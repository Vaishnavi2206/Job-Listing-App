/**
 * Queue (producer) definition.
 *
 * This file is imported by your API layer (controllers) whenever you need
 * to enqueue an email job. It is NOT where emails get sent — that's the
 * Worker's job (src/workers/email.worker.js), which typically runs as a
 * completely separate process/container so API latency is never coupled
 * to SMTP latency.
 */

const { Queue } = require("bullmq");
const { createRedisConnection } = require("../config/redis");
require("../config/env");

const QUEUE_NAME = process.env.EMAIL_QUEUE_NAME || "application-status-emails";

// One dedicated connection for this Queue instance.
const connection = createRedisConnection();

const emailQueue = new Queue(QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: Number(process.env.EMAIL_JOB_ATTEMPTS || 5),
    backoff: {
      type: "exponential",
      delay: Number(process.env.EMAIL_JOB_BACKOFF_DELAY_MS || 5000),
    },
    // Auto-cleanup so Redis memory doesn't grow unbounded in prod.
    // Keep a small trailing window of completed jobs for debugging,
    // but keep ALL failed jobs (or a large cap) so nothing silently
    // disappears before you've had a chance to inspect/retry it.
    removeOnComplete: { count: 1000, age: 24 * 3600 }, // 1 day
    removeOnFail: { count: 5000 }, // keep more failed jobs, they're rarer
  },
});

/**
 * Enqueue an email job for an application status change.
 *
 * IDEMPOTENCY: we pass a deterministic jobId. If the update API is called
 * twice for the same application+status (e.g. a retried HTTP request, or
 * a duplicate DB trigger), BullMQ will reject the second add() as a
 * duplicate instead of sending the email twice. This is the single most
 * important production safeguard for "send email on status change" flows.
 *
 * @param {Object} params
 * @param {string} params.applicationId
 * @param {'APPROVED'|'REJECTED'} params.status
 * @param {string} params.recipientEmail
 * @param {string} params.applicantName
 * @param {Object} [params.meta] - any extra data the email template needs
 */
async function enqueueStatusEmail({
  applicationId,
  status,
  recipientEmail,
  applicantName,
  meta = {},
}) {
  const jobId = `status-email:${applicationId}:${status}`;

  const job = await emailQueue.add(
    "send-status-email",
    {
      applicationId,
      status,
      recipientEmail,
      applicantName,
      meta,
      enqueuedAt: new Date().toISOString(),
    },
    {
      jobId, // <-- deduplication key
      // Optional: delay sending by a few seconds so a rapid
      // approve -> immediate-undo doesn't fire a stale email.
      // delay: 3000,
    }
  );

  return job;
}

async function closeEmailQueue() {
  await emailQueue.close();
  await connection.quit();
}

module.exports = { emailQueue, enqueueStatusEmail, closeEmailQueue, QUEUE_NAME };
