/**
 * H3 Integration Test
 * Tests: indexRider, removeRider, getRidersInRings, and allocateRider end-to-end.
 * Run with: node src/__test__/h3Test.js
 */

const { latLngToCell, gridDisk } = require("h3-js");
const { indexRider, removeRider, getRidersInRings, hexIndex, H3_RESOLUTION } = require("../store/h3Store");
const { activeRiders } = require("../store/memoryStore");
const allocateRider = require("../services/allocationService");

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✅ PASS: ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${label}`);
    failed++;
  }
}

function section(title) {
  console.log(`\n=== ${title} ===`);
}

// ─── Helper: seed a rider into both activeRiders + H3 index ─────────────────
function seedRider(id, lat, lng, available = true) {
  activeRiders[id] = {
    socketId: "socket_" + id,
    latitude: lat,
    longitude: lng,
    available,
    lastUpdated: Date.now()
  };
  indexRider(id, lat, lng);
}

function cleanup() {
  for (const id in activeRiders) delete activeRiders[id];
  hexIndex.clear();
}

// ─── TEST 1: indexRider puts rider into correct H3 cell ─────────────────────
section("TEST 1: indexRider — correct cell assignment");
{
  cleanup();
  const lat = 12.9716, lng = 77.5946; // Bangalore
  indexRider("R1", lat, lng);

  const expectedCell = latLngToCell(lat, lng, H3_RESOLUTION);
  const cellHasRider = hexIndex.has(expectedCell) && hexIndex.get(expectedCell).has("R1");

  assert(cellHasRider, `Rider R1 is indexed in cell ${expectedCell}`);
  assert(hexIndex.size === 1, "hexIndex has exactly 1 cell");
}

// ─── TEST 2: indexRider moves rider when location changes ────────────────────
section("TEST 2: indexRider — rider moves to a new cell");
{
  cleanup();
  const lat1 = 12.9716, lng1 = 77.5946;
  const lat2 = 13.0827, lng2 = 80.2707; // Chennai — guaranteed different cell

  indexRider("R1", lat1, lng1);
  const oldCell = latLngToCell(lat1, lng1, H3_RESOLUTION);
  assert(hexIndex.get(oldCell)?.has("R1"), "R1 in old cell before move");

  indexRider("R1", lat2, lng2); // move
  const newCell = latLngToCell(lat2, lng2, H3_RESOLUTION);

  assert(!hexIndex.get(oldCell)?.has("R1"), "R1 removed from old cell after move");
  assert(hexIndex.get(newCell)?.has("R1"), "R1 in new cell after move");
  assert(hexIndex.size === 1, "hexIndex still has exactly 1 cell (old cleaned up)");
}

// ─── TEST 3: removeRider cleans up the index ────────────────────────────────
section("TEST 3: removeRider — cleans up index");
{
  cleanup();
  indexRider("R1", 12.9716, 77.5946);
  indexRider("R2", 12.9716, 77.5946); // same cell

  assert(hexIndex.size === 1, "1 cell with 2 riders");

  removeRider("R1");
  const cell = latLngToCell(12.9716, 77.5946, H3_RESOLUTION);
  assert(!hexIndex.get(cell)?.has("R1"), "R1 removed from cell");
  assert(hexIndex.get(cell)?.has("R2"), "R2 still in cell");

  removeRider("R2");
  assert(hexIndex.size === 0, "hexIndex empty after both riders removed");
}

// ─── TEST 4: getRidersInRings — finds rider in same cell (k=0) ──────────────
section("TEST 4: getRidersInRings — same cell (ring k=0)");
{
  cleanup();
  const restaurantLat = 12.9716, restaurantLng = 77.5946;
  const riderLat = 12.9717, riderLng = 77.5947; // ~10 m away, same H3 cell

  indexRider("R1", riderLat, riderLng);
  const candidates = getRidersInRings(restaurantLat, restaurantLng, 5);

  assert(candidates.includes("R1"), "R1 found in ring expansion");
}

// ─── TEST 5: getRidersInRings — finds rider in adjacent ring (k=1) ──────────
section("TEST 5: getRidersInRings — adjacent ring (k=1)");
{
  cleanup();
  const restaurantLat = 12.9716, restaurantLng = 77.5946;
  const restaurantCell = latLngToCell(restaurantLat, restaurantLng, H3_RESOLUTION);

  // Find a cell that is exactly 1 ring away
  const ring1Cells = gridDisk(restaurantCell, 1).filter(c => c !== restaurantCell);
  const targetCell = ring1Cells[0];

  // Manually plant a rider in that adjacent cell
  if (!hexIndex.has(targetCell)) hexIndex.set(targetCell, new Set());
  hexIndex.get(targetCell).add("R_ADJACENT");

  const candidates = getRidersInRings(restaurantLat, restaurantLng, 5);
  assert(candidates.includes("R_ADJACENT"), "Adjacent rider found at ring k=1");
}

// ─── TEST 6: allocateRider — full end-to-end pick closest rider ─────────────
section("TEST 6: allocateRider — picks closest available rider");
{
  cleanup();
  const restaurantLat = 12.9716, restaurantLng = 77.5946;

  seedRider("R_CLOSE", 12.9720, 77.5950); // ~100 m away
  seedRider("R_FAR",   12.9900, 77.6100); // ~2 km away

  const { winner, bestDistance } = allocateRider(restaurantLat, restaurantLng);

  assert(winner === "R_CLOSE", `Winner is R_CLOSE (got: ${winner})`);
  assert(bestDistance < 1, `bestDistance < 1 km (got: ${bestDistance?.toFixed(3)} km)`);
}

// ─── TEST 7: allocateRider — skips unavailable riders ───────────────────────
section("TEST 7: allocateRider — skips unavailable riders");
{
  cleanup();
  const restaurantLat = 12.9716, restaurantLng = 77.5946;

  seedRider("R_BUSY", 12.9720, 77.5950, false); // unavailable
  seedRider("R_FREE", 12.9900, 77.6100, true);  // available but farther

  const { winner } = allocateRider(restaurantLat, restaurantLng);
  assert(winner === "R_FREE", `Skips unavailable R_BUSY, picks R_FREE (got: ${winner})`);
}

// ─── TEST 8: allocateRider — excludeRiders list ─────────────────────────────
section("TEST 8: allocateRider — respects excludeRiders (rejection)");
{
  cleanup();
  const restaurantLat = 12.9716, restaurantLng = 77.5946;

  seedRider("R1", 12.9720, 77.5950);
  seedRider("R2", 12.9900, 77.6100);

  const { winner } = allocateRider(restaurantLat, restaurantLng, ["R1"]);
  assert(winner === "R2", `Skips excluded R1, picks R2 (got: ${winner})`);
}

// ─── TEST 9: allocateRider — no riders available ────────────────────────────
section("TEST 9: allocateRider — returns null when no eligible riders");
{
  cleanup();
  const { winner } = allocateRider(12.9716, 77.5946);
  assert(winner === null, `winner is null when no riders (got: ${winner})`);
}

// ─── TEST 10: allocateRider — stale rider is skipped ────────────────────────
section("TEST 10: allocateRider — skips stale rider (lastUpdated > 30s ago)");
{
  cleanup();
  const restaurantLat = 12.9716, restaurantLng = 77.5946;

  activeRiders["R_STALE"] = {
    socketId: "s1",
    latitude: 12.9720,
    longitude: 77.5950,
    available: true,
    lastUpdated: Date.now() - 60000 // 60 seconds ago — stale
  };
  indexRider("R_STALE", 12.9720, 77.5950);

  const { winner } = allocateRider(restaurantLat, restaurantLng);
  assert(winner === null, `Stale rider skipped, winner is null (got: ${winner})`);
}

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
if (failed === 0) {
  console.log("🎉 All tests passed! H3 integration is working correctly.\n");
  process.exit(0);
} else {
  console.error("⚠️  Some tests failed. See above for details.\n");
  process.exit(1);
}
