const {
  activeOrders,
  activeRiders
} = require("../store/memoryStore");

const allocateRider =
  require("../services/allocationService");

const getOrders = (req, res) => {

  res.json({
    totalOrders:
      Object.keys(activeOrders).length,

    orders:
      activeOrders
  });

};

const createOrder = (req, res) => {

  const {
    restaurantLat,
    restaurantLng
  } = req.body;

  const {
    winner,
    bestDistance
  } = allocateRider(
    restaurantLat,
    restaurantLng
  );

  if (!winner) {

    return res.status(400).json({
      message:
        "No eligible riders found"
    });

  }

  activeRiders[winner].available =
    false;

  const orderId =
    "ORD_" + Date.now();

  // Retrieve Socket.io server instance attached to express app
  const io = req.app.get("io");
  if (io) {
    const winnerSocketId = activeRiders[winner].socketId;
    io.to(winnerSocketId).emit("new-order", {
      orderId,
      restaurantLat,
      restaurantLng,
      assignedRider: winner
    });
  }

  activeOrders[orderId] = {

    riderId:
      winner,

    restaurantLat,

    restaurantLng,

    status:
      "ASSIGNED",

    createdAt:
      Date.now()

  };

  res.json({
    orderId,
    assignedRider:
      winner,
    distanceKm:
      bestDistance
  });

};

module.exports = {
  createOrder,
  getOrders
};