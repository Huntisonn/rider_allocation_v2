const getDistance = require("../utils/distance");
const { getRider, getAllRiders } = require("../store/riderStore");
const { getRidersInRings } = require("../store/h3Store");

const RIDER_TIMEOUT = 30000;

/**
 * Allocate the nearest available rider to a restaurant location.
 *
 * Strategy — Uber H3 ring expansion + Redis fetch:
 *   1. Convert the restaurant (lat, lng) to an H3 cell at resolution 9.
 *   2. Expand outward ring-by-ring (k = 0 → 5) until candidates appear
 *      in the in-memory H3 index (built live from location-update events).
 *   3. For each candidate, fetch their live record from Redis and apply
 *      validity filters (stale timeout, availability, exclude list).
 *   4. Return the one with the smallest Haversine distance.
 *
 *   Fallback: if the H3 index is empty (e.g. first moments after restart),
 *   do a full linear scan of all riders fetched from Redis.
 *
 * @param {number}   restaurantLat
 * @param {number}   restaurantLng
 * @param {string[]} [excludeRiders=[]]  Rider IDs that already rejected this order
 * @returns {Promise<{ winner: string|null, bestDistance: number }>}
 */
async function allocateRider(
  restaurantLat,
  restaurantLng,
  excludeRiders = []
) {

  // Step 1: H3 ring expansion to get candidate rider IDs
  const candidates = getRidersInRings(restaurantLat, restaurantLng, 5);

  let winner = null;
  let bestDistance = Infinity;

  // Step 2: Fetch each candidate from Redis and score it
  for (const riderId of candidates) {
    if (excludeRiders.includes(riderId)) continue;

    const rider = await getRider(riderId);
    if (!rider) continue;
    if (Date.now() - rider.lastUpdated > RIDER_TIMEOUT) continue;
    if (rider.available === false) continue;

    const distance = getDistance(
      restaurantLat, restaurantLng,
      rider.latitude, rider.longitude
    );

    if (distance < bestDistance) {
      bestDistance = distance;
      winner = riderId;
    }
  }

  // Step 3: Fallback — linear scan of all Redis riders
  if (!winner) {
    console.warn(
      "[allocationService] H3 index returned no valid rider — " +
      "falling back to full Redis scan."
    );

    const allRiders = await getAllRiders();

    for (const riderId in allRiders) {
      if (excludeRiders.includes(riderId)) continue;

      const rider = allRiders[riderId];
      if (Date.now() - rider.lastUpdated > RIDER_TIMEOUT) continue;
      if (rider.available === false) continue;

      const distance = getDistance(
        restaurantLat, restaurantLng,
        rider.latitude, rider.longitude
      );

      if (distance < bestDistance) {
        bestDistance = distance;
        winner = riderId;
      }
    }
  }

  return { winner, bestDistance };
}

module.exports = allocateRider;
