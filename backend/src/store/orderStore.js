/**
 * orderStore.js — Redis-backed order storage
 *
 * Redis key schema:
 *   order:{orderId}  Hash  { riderId, restaurantLat, restaurantLng,
 *                            status, createdAt, rejectedRiders (JSON) }
 *   active_orders    Set   of all active order IDs
 */

const redis = require("../config/redisClient");

const ORDERS_SET = "active_orders";

// ─── Write ────────────────────────────────────────────────────────────────────

/**
 * Insert a new order into Redis.
 */
async function setOrder(orderId, data) {
  await redis.hset(`order:${orderId}`, {
    riderId:        data.riderId,
    restaurantLat:  String(data.restaurantLat),
    restaurantLng:  String(data.restaurantLng),
    status:         data.status,
    createdAt:      String(data.createdAt),
    rejectedRiders: JSON.stringify(data.rejectedRiders || [])
  });
  await redis.sadd(ORDERS_SET, orderId);
}

/**
 * Update one or more fields on an existing order.
 * Pass `rejectedRiders` as a JS array — it is serialised to JSON automatically.
 */
async function updateOrder(orderId, fields) {
  const mapped = {};
  for (const [key, value] of Object.entries(fields)) {
    mapped[key] = key === "rejectedRiders"
      ? JSON.stringify(value)
      : String(value);
  }
  await redis.hset(`order:${orderId}`, mapped);
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * Fetch a single order's record.
 * @returns {object|null}
 */
async function getOrder(orderId) {
  const raw = await redis.hgetall(`order:${orderId}`);
  if (!raw || Object.keys(raw).length === 0) return null;
  return parseOrder(raw);
}

/**
 * Fetch ALL orders as a { orderId: orderObject } map.
 */
async function getAllOrders() {
  const ids = await redis.smembers(ORDERS_SET);
  if (ids.length === 0) return {};

  const pipeline = redis.pipeline();
  ids.forEach(id => pipeline.hgetall(`order:${id}`));
  const results = await pipeline.exec();

  const orders = {};
  results.forEach(([err, raw], i) => {
    if (!err && raw && Object.keys(raw).length > 0) {
      orders[ids[i]] = parseOrder(raw);
    }
  });
  return orders;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function parseOrder(raw) {
  return {
    riderId:        raw.riderId,
    restaurantLat:  parseFloat(raw.restaurantLat),
    restaurantLng:  parseFloat(raw.restaurantLng),
    status:         raw.status,
    createdAt:      parseInt(raw.createdAt, 10),
    rejectedRiders: JSON.parse(raw.rejectedRiders || "[]")
  };
}

module.exports = {
  setOrder,
  updateOrder,
  getOrder,
  getAllOrders
};
