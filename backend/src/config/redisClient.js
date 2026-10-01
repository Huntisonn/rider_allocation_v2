const Redis = require("ioredis");

/**
 * Singleton Redis client.
 *
 * Reads REDIS_URL from the environment (default: redis://127.0.0.1:6379).
 * ioredis will automatically reconnect on connection loss using
 * exponential backoff — no extra configuration needed for dev.
 */
const redis = new Redis(
  process.env.REDIS_URL || "redis://127.0.0.1:6379",
  {
    // Don't throw on failed commands if Redis is temporarily down;
    // just reject the promise so callers can handle it gracefully.
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false
  }
);

redis.on("connect", () => {
  console.log("[Redis] Connected to", process.env.REDIS_URL || "redis://127.0.0.1:6379");
});

redis.on("ready", () => {
  console.log("[Redis] Ready to accept commands");
});

redis.on("error", (err) => {
  console.error("[Redis] Connection error:", err.message);
});

redis.on("reconnecting", (delay) => {
  console.warn(`[Redis] Reconnecting in ${delay} ms...`);
});

module.exports = redis;
