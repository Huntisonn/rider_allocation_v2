/**
 * memoryStore.js — DEPRECATED
 *
 * Rider and order state have been migrated to Redis.
 * See:
 *   src/store/riderStore.js  — rider CRUD (Redis)
 *   src/store/orderStore.js  — order CRUD (Redis)
 *
 * This file is kept as an empty shim so any legacy imports do not crash,
 * but it no longer holds live data.
 */

module.exports = {};
