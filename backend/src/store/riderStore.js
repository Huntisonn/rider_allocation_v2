/**
 * riderStore.js — Redis-backed rider storage
 *
 * Redis key schema:
 *   rider:{riderId}            Hash  { socketId, latitude, longitude, available, lastUpdated }
 *   active_riders              Set   of all active rider IDs
 *   socket_to_rider:{socketId} String → riderId   (reverse lookup for O(1) disconnect)
 *
 * All functions are async and return parsed JS values (numbers, booleans)
 * rather than raw Redis strings.
 */

const redis = require("../config/redisClient");

const RIDERS_SET = "active_riders";

// ─── Write ────────────────────────────────────────────────────────────────────

/**
 * Insert or fully overwrite a rider's record.
 * Also maintains the socket → rider reverse-lookup key.
 */
async function setRider(riderId, data) {
  // If socketId changed, remove old reverse-lookup entry
  const oldSocketId = await redis.hget(`rider:${riderId}`, "socketId");
  if (oldSocketId && oldSocketId !== data.socketId) {
    await redis.del(`socket_to_rider:${oldSocketId}`);
  }

  await redis.hset(`rider:${riderId}`, {
    socketId:    data.socketId,
    latitude:    String(data.latitude),
    longitude:   String(data.longitude),
    available:   data.available ? "1" : "0",
    lastUpdated: String(data.lastUpdated)
  });

  // Register in active set + reverse-lookup
  await redis.sadd(RIDERS_SET, riderId);
  await redis.set(`socket_to_rider:${data.socketId}`, riderId);
}

/**
 * Update one or more fields on an existing rider without a full overwrite.
 * @param {string} riderId
 * @param {object} fields  e.g. { available: false } or { latitude: 12.9, longitude: 77.6 }
 */
async function updateRiderFields(riderId, fields) {
  const mapped = {};
  for (const [key, value] of Object.entries(fields)) {
    mapped[key] = key === "available" ? (value ? "1" : "0") : String(value);
  }
  await redis.hset(`rider:${riderId}`, mapped);
}

/**
 * Remove a rider from Redis entirely (called on disconnect).
 */
async function deleteRider(riderId) {
  const socketId = await redis.hget(`rider:${riderId}`, "socketId");
  if (socketId) {
    await redis.del(`socket_to_rider:${socketId}`);
  }
  await redis.del(`rider:${riderId}`);
  await redis.srem(RIDERS_SET, riderId);
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * Fetch a single rider's record.
 * @returns {object|null} Parsed rider object, or null if not found.
 */
async function getRider(riderId) {
  const raw = await redis.hgetall(`rider:${riderId}`);
  if (!raw || Object.keys(raw).length === 0) return null;
  return parseRider(raw);
}

/**
 * Look up a rider ID from a socket ID in O(1).
 * @returns {string|null} riderId or null
 */
async function getRiderIdBySocketId(socketId) {
  return redis.get(`socket_to_rider:${socketId}`);
}

/**
 * Fetch ALL active riders as a { riderId: riderObject } map.
 * Used by the fallback linear scan in allocationService.
 */
async function getAllRiders() {
  const ids = await redis.smembers(RIDERS_SET);
  if (ids.length === 0) return {};

  const pipeline = redis.pipeline();
  ids.forEach(id => pipeline.hgetall(`rider:${id}`));
  const results = await pipeline.exec();

  const riders = {};
  results.forEach(([err, raw], i) => {
    if (!err && raw && Object.keys(raw).length > 0) {
      riders[ids[i]] = parseRider(raw);
    }
  });
  return riders;
}

/**
 * Return just the Set of active rider IDs (cheap: no hash fetches).
 * @returns {string[]}
 */
async function getAllRiderIds() {
  return redis.smembers(RIDERS_SET);
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Convert raw Redis hash strings → typed JS object */
function parseRider(raw) {
  return {
    socketId:    raw.socketId,
    latitude:    parseFloat(raw.latitude),
    longitude:   parseFloat(raw.longitude),
    available:   raw.available === "1",
    lastUpdated: parseInt(raw.lastUpdated, 10)
  };
}

module.exports = {
  setRider,
  updateRiderFields,
  deleteRider,
  getRider,
  getRiderIdBySocketId,
  getAllRiders,
  getAllRiderIds
};
