const allocateRider = require("../services/allocationService");
const { getRider, updateRiderFields } = require("../store/riderStore");
const { setOrder, getAllOrders } = require("../store/orderStore");

const getOrders = async (req, res) => {
  try {
    const orders = await getAllOrders();
    res.json({
      totalOrders: Object.keys(orders).length,
      orders
    });
  } catch (err) {
    console.error("[getOrders] Redis error:", err.message);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

const createOrder = async (req, res) => {
  try {
    const { restaurantLat, restaurantLng } = req.body;

    const { winner, bestDistance } = await allocateRider(
      restaurantLat,
      restaurantLng
    );

    if (!winner) {
      return res.status(400).json({
        message: "No eligible riders found"
      });
    }

    // Mark winner as busy in Redis
    await updateRiderFields(winner, { available: false });

    const orderId = "ORD_" + Date.now();

    // Push order event to the winning rider via Socket.io
    const io = req.app.get("io");
    if (io) {
      const winnerRider = await getRider(winner);
      if (winnerRider) {
        io.to(winnerRider.socketId).emit("new-order", {
          orderId,
          restaurantLat,
          restaurantLng,
          assignedRider: winner
        });
      }
    }

    // Persist the new order to Redis
    await setOrder(orderId, {
      riderId:       winner,
      restaurantLat,
      restaurantLng,
      status:        "ASSIGNED",
      createdAt:     Date.now(),
      rejectedRiders: []
    });

    res.json({
      orderId,
      assignedRider: winner,
      distanceKm:    bestDistance
    });

  } catch (err) {
    console.error("[createOrder] Redis error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createOrder,
  getOrders
};