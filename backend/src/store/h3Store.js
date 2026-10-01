/**
 * H3 Geospatial Index Store
 *
 * Maps H3 hex cell IDs → Set of riderIds in that cell.
 * Used by allocationService to do fast nearest-rider lookups
 * via ring expansion instead of scanning all active riders.
 *
 * Resolution 9 ≈ ~0.1 km² per cell (~174 m edge length).
 * Ring k=1 covers the 7 cells around the restaurant.
 */

const { latLngToCell, gridDisk } = require("h3-js");

/** Resolution used for all H3 indexing. */
const H3_RESOLUTION = 9;

/**
 * hexIndex: Map<h3CellId (string), Set<riderId (string)>>
 *
 * Maintained in sync with activeRiders via:
 *   - indexRider()   — called on every location-update
 *   - removeRider()  — called on disconnect
 */
const hexIndex = new Map();

/**
 * Track which H3 cell each rider is currently indexed under
 * so we can efficiently remove them when they move or disconnect.
 *
 * riderCellMap: Map<riderId, h3CellId>
 */
const riderCellMap = new Map();

/**
 * Convert (lat, lng) to an H3 cell at the configured resolution.
 * @param {number} lat
 * @param {number} lng
 * @returns {string} H3 cell ID
 */
function latlngToH3(lat, lng) {
  return latLngToCell(lat, lng, H3_RESOLUTION);
}

/**
 * Index (or re-index) a rider into the H3 hex grid.
 * Automatically removes the rider from their previous cell if they moved.
 *
 * @param {string} riderId
 * @param {number} lat
 * @param {number} lng
 */
function indexRider(riderId, lat, lng) {
  const newCell = latlngToH3(lat, lng);
  const oldCell = riderCellMap.get(riderId);

  // Remove from the old cell if the rider moved
  if (oldCell && oldCell !== newCell) {
    const riders = hexIndex.get(oldCell);
    if (riders) {
      riders.delete(riderId);
      if (riders.size === 0) {
        hexIndex.delete(oldCell);
      }
    }
  }

  // Insert into the new cell
  if (!hexIndex.has(newCell)) {
    hexIndex.set(newCell, new Set());
  }
  hexIndex.get(newCell).add(riderId);
  riderCellMap.set(riderId, newCell);
}

/**
 * Remove a rider from the H3 index entirely (e.g. on disconnect).
 *
 * @param {string} riderId
 */
function removeRider(riderId) {
  const cell = riderCellMap.get(riderId);
  if (cell) {
    const riders = hexIndex.get(cell);
    if (riders) {
      riders.delete(riderId);
      if (riders.size === 0) {
        hexIndex.delete(cell);
      }
    }
    riderCellMap.delete(riderId);
  }
}

/**
 * Get all rider IDs within a ring of H3 cells around a point.
 * Starts at ring 0 (exact cell) and expands outward ring-by-ring.
 *
 * @param {number} lat           Restaurant latitude
 * @param {number} lng           Restaurant longitude
 * @param {number} [maxRing=5]   Maximum number of rings to expand
 * @returns {string[]}           Ordered list of riderIds (closest cells first)
 */
function getRidersInRings(lat, lng, maxRing = 5) {
  const originCell = latlngToH3(lat, lng);
  const found = [];

  for (let k = 0; k <= maxRing; k++) {
    const cells = gridDisk(originCell, k);
    for (const cell of cells) {
      if (hexIndex.has(cell)) {
        for (const riderId of hexIndex.get(cell)) {
          if (!found.includes(riderId)) {
            found.push(riderId);
          }
        }
      }
    }
    // Return as soon as we have at least one candidate
    if (found.length > 0) break;
  }

  return found;
}

module.exports = {
  H3_RESOLUTION,
  hexIndex,
  indexRider,
  removeRider,
  getRidersInRings,
  latlngToH3
};
