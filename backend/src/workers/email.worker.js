/**
 * Worker (consumer) — this is what actually sends emails.
 *
 * DESIGN DECISIONS FOR "PRODUCTION SCALE":
 *
 * 1. Runs as its own process (src/worker-process.js is the entrypoint),
 *    completely decoupled from the API. You scale API replicas and worker
 *    replicas independently. If SMTP is slow, your API stays fast because
 *    it only ever does a fast Redis write (queue.add) and returns.
 *
 * 2. `concurrency` controls how many jobs THIS worker process pulls off
 *    the queue in parallel. Horizontal scale = run more worker processes
 *    (more containers/pods), each with its own concurrency. BullMQ workers
 *    across processes all pull from the same Redis-backed queue safely —
 *    no extra coordination code needed, BullMQ handles distributed locking.
 *
 * 3. `limiter` throttles the whole queue's throughput (not per-worker) —
 *    e.g. "no more than 50 jobs/sec across ALL workers combined" — because
 *    your email provider (SES/SendGrid) has its own rate limits, and if you
 *    have 10 worker replicas each doing concurrency:10, that's 100
 *    concurrent sends unless you cap it here.
 *
 * 4. Idempotent DB write: even though the Queue already dedupes on jobId,
 *    the worker also checks a "notification log" before sending, so that
 *    a job manually retried from the dashboard doesn't double-send if the
 *    email actually went out but the job was marked failed for an
 *    unrelated reason (e.g. process crashed after sendMail resolved but
 *    before job completion was acknowledged to Redis).
 */

const { Worker, QueueEvents } = require("bullmq");
const { createRedisConnection } = require("../config/redis");
const { sendStatusEmail } = require("../utils/email.service");
const notificationLog = require("../repository/notificationLog.repository");
require("../config/env");

const QUEUE_NAME = process.env.EMAIL_QUEUE_NAME || "application-status-emails";

function createEmailWorker() {
  const connection = createRedisConnection();

  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { applicationId, status, recipientEmail, applicantName, meta } = job.data;

      // Belt-and-suspenders idempotency check (see note #4 above).
      const alreadySent = await notificationLog.wasNotificationSent(applicationId, status);
      if (alreadySent) {
        job.log(`Skipping: notification already sent for ${applicationId}/${status}`);
        return { skipped: true };
      }

      job.log(`Sending ${status} email to ${recipientEmail} for application ${applicationId}`);

      const info = await sendStatusEmail({
        status,
        recipientEmail,
        applicantName,
        applicationId,
        meta,
      });

      await notificationLog.recordNotificationSent(applicationId, status, info.messageId);

      return { messageId: info.messageId };
    },
    {
      connection,
      concurrency: Number(process.env.EMAIL_WORKER_CONCURRENCY || 10),
      limiter: {
        max: Number(process.env.EMAIL_RATE_LIMIT_MAX || 50),
        duration: Number(process.env.EMAIL_RATE_LIMIT_DURATION_MS || 1000),
      },
    }
  );

  // QueueEvents gives you reliable, cross-process event notifications
  // (unlike worker.on('failed') which only fires for jobs THIS worker
  // instance processed). Use it for alerting/observability hooks.
  const queueEvents = new QueueEvents(QUEUE_NAME, { connection: createRedisConnection() });

  queueEvents.on("completed", ({ jobId, returnvalue }) => {
    console.log(`[email-worker] job ${jobId} completed`, returnvalue);
  });

  queueEvents.on("failed", ({ jobId, failedReason }) => {
    // After all `attempts` are exhausted, this fires for the final failure.
    // This is your hook to page someone, write to a dead-letter table,
    // or fire a Slack webhook — the job data is still inspectable via
    // job.getState in the dashboard for manual retry.
    console.error(`[email-worker] job ${jobId} FAILED permanently:`, failedReason);
  });

  worker.on("error", (err) => {
    // Worker-level errors (e.g. Redis connection issues), not job failures.
    console.error("[email-worker] worker error:", err);
  });

  return { worker, queueEvents, connection };
}

module.exports = { createEmailWorker };
