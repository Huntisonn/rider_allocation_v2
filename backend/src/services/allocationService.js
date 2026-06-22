const getDistance =
  require("../utils/distance");

const {
  activeRiders
} = require("../store/memoryStore");

const RIDER_TIMEOUT = 30000;

function allocateRider(
  restaurantLat,
  restaurantLng,
  excludeRiders = []
) {

  let winner = null;

  let bestDistance =
    Infinity;

  for (const riderId in activeRiders) {

    const rider =
      activeRiders[riderId];

    // Skip riders that have already rejected this order
    if (excludeRiders.includes(riderId)) {
      continue;
    }

    if (
      Date.now() -
      rider.lastUpdated >
      RIDER_TIMEOUT
    ) {
      continue;
    }

    if (
      rider.available === false
    ) {
      continue;
    }

    const distance =
      getDistance(
        restaurantLat,
        restaurantLng,
        rider.latitude,
        rider.longitude
      );

    if (
      distance <
      bestDistance
    ) {

      bestDistance =
        distance;

      winner =
        riderId;

    }

  }

  return {
    winner,
    bestDistance
  };

}

module.exports =
  allocateRider;
