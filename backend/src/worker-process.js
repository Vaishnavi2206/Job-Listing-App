// Load .env before any other require so env vars are set before module init
require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

/**
 * Worker process entrypoint.
 *
 * Run N of these in production (separate containers/pods) for
 * horizontal scale. Each one independently pulls jobs from the same
 * BullMQ queue — Redis + BullMQ handle the distributed locking so two
 * workers never process the same job twice.
 *
 * GRACEFUL SHUTDOWN IS NOT OPTIONAL IN PRODUCTION:
 * When k8s/ECS/PM2 sends SIGTERM (rolling deploy, autoscaling scale-down,
 * spot instance reclaim), you MUST let in-flight jobs finish instead of
 * killing them mid-send. worker.close() waits for active jobs to complete
 * (up to a timeout) before resolving. Without this, you get half-sent
 * emails or jobs stuck "active" forever in Redis until a stalled-job
 * sweep recovers them (which BullMQ does automatically, but it costs time
 * and can cause duplicate sends if the recovery races with a real send).
 */

const { createEmailWorker } = require("./workers/email.worker");

console.log("[worker-process] starting email worker...");
const { worker, queueEvents, connection } = createEmailWorker();
console.log("[worker-process] email worker started, concurrency =", worker.opts.concurrency);

async function shutdown(signal) {
  console.log(`[worker-process] received ${signal}, shutting down gracefully...`);
  try {
    await worker.close(); // waits for active jobs to finish
    await queueEvents.close();
    await connection.quit();
    console.log("[worker-process] shutdown complete");
    process.exit(0);
  } catch (err) {
    console.error("[worker-process] error during shutdown:", err);
    process.exit(1);
  }
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Catch anything that slips through so the process doesn't die silently
// and leave a job stuck "active" in Redis.
process.on("unhandledRejection", (reason) => {
  console.error("[worker-process] unhandled rejection:", reason);
});
