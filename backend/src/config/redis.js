/**
 * Redis connection factory.
 *
 * WHY A SEPARATE FILE:
 * BullMQ needs its own ioredis connection(s) with very specific options.
 * Reusing a connection you already use for app-level caching is a common
 * mistake — BullMQ issues blocking commands (BRPOPLPUSH / BLMPOP under the
 * hood for some operations) and requires maxRetriesPerRequest: null so it
 * can retry indefinitely instead of throwing inside the library's internals.
 *
 * PRODUCTION NOTES:
 * - Use a dedicated Redis instance/database for queues, not db0 shared with
 *   sessions/cache. Isolate blast radius and make eviction policies correct
 *   (queues must NOT use an eviction policy like allkeys-lru — set
 *   `maxmemory-policy noeviction` on this Redis instance, or you WILL lose
 *   jobs silently under memory pressure).
 * - For HA, point host/port at a Redis Sentinel set or use `cluster: true`
 *   config below (commented) for Redis Cluster. BullMQ supports both.
 * - Each BullMQ "Worker" and "QueueEvents" instance ideally gets its own
 *   ioredis connection (not shared) because they each hold blocking
 *   connections. The Queue (producer) side can share one connection safely
 *   since it's just issuing regular commands.
 */

const IORedis = require("ioredis");
require("dotenv").config();

function buildRedisOptions() {
  return {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    tls: process.env.REDIS_TLS === "true" ? {} : undefined,

    // REQUIRED by BullMQ. Without this, ioredis throws after 20 retries
    // and BullMQ's internal blocking calls break.
    maxRetriesPerRequest: null,

    // Keep retrying to connect instead of giving up — a worker process
    // should survive a Redis restart/failover without crashing.
    enableReadyCheck: true,
    retryStrategy(times) {
      // Exponential backoff capped at 5s between reconnect attempts.
      return Math.min(times * 200, 5000);
    },
  };
}

/**
 * Creates a new dedicated ioredis connection.
 * Call this once per Queue / Worker / QueueEvents instance — do not
 * export a singleton and share it across a Worker and a QueueEvents
 * object, they need independent connections.
 */
function createRedisConnection() {
  const connection = new IORedis(buildRedisOptions());

  connection.on("error", (err) => {
    // Do not crash the process on transient Redis errors — ioredis will
    // keep retrying per retryStrategy above. Just log for visibility.
    console.error("[redis] connection error:", err.message);
  });

  connection.on("connect", () => {
    console.log("[redis] connected");
  });

  return connection;
}

module.exports = { createRedisConnection, buildRedisOptions };
