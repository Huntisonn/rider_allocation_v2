const allocateRider = require("../services/allocationService");

const {
  setRider,
  updateRiderFields,
  deleteRider,
  getRider,
  getRiderIdBySocketId
} = require("../store/riderStore");

const {
  setOrder,
  updateOrder,
  getOrder
} = require("../store/orderStore");

const {
  indexRider,
  removeRider
} = require("../store/h3Store");

function socketHandler(io) {

  io.on("connection", (socket) => {

    console.log("Connected:", socket.id);

    // ── location-update ───────────────────────────────────────────────────────
    socket.on(
      "location-update",
      async ({ riderId, latitude, longitude }) => {

        try {
          // Fetch existing availability so we don't overwrite it on a re-ping
          const existing = await getRider(riderId);
          const available = existing ? existing.available : true;

          // Persist to Redis
          await setRider(riderId, {
            socketId:    socket.id,
            latitude,
            longitude,
            available,
            lastUpdated: Date.now()
          });

          // Keep H3 in-memory index in sync
          indexRider(riderId, latitude, longitude);

          console.log("\n====== RIDER UPDATE ======");
          console.log("Rider:",     riderId);
          console.log("Latitude:",  latitude);
          console.log("Longitude:", longitude);
          console.log("==========================");

        } catch (err) {
          console.error("[location-update] Redis error:", err.message);
        }
      }
    );

    // ── order-response ────────────────────────────────────────────────────────
    socket.on(
      "order-response",
      async ({ orderId, status }) => {

        try {
          // O(1) reverse lookup: socketId → riderId
          const riderId = await getRiderIdBySocketId(socket.id);

          if (!riderId) {
            console.log(
              `\n[Socket Error] order-response received but no active rider ` +
              `found for socket: ${socket.id}`
            );
            return;
          }

          console.log("\n====== RIDER RESPONSE ======");
          console.log("Rider:",    riderId);
          console.log("Order ID:", orderId);
          console.log("Status:",   status);
          console.log("============================");

          if (status === "ACCEPTED") {
            await updateOrder(orderId, { status: "ACCEPTED" });
            console.log(`\n[Order ${orderId}] Accepted by rider ${riderId}`);

          } else if (status === "REJECTED") {
            // Free the rejecting rider
            await updateRiderFields(riderId, { available: true });

            const order = await getOrder(orderId);
            if (!order) {
              console.log(
                `\n[Order ${orderId}] Not found in Redis — cannot reassign.`
              );
              return;
            }

            // Track all riders that rejected this order
            const rejectedRiders = [...order.rejectedRiders, riderId];
            await updateOrder(orderId, { rejectedRiders });

            console.log(
              `\n[Order ${orderId}] Rejected by rider ${riderId}. ` +
              `Attempting reassignment...`
            );
            console.log(
              `  Already rejected: [${rejectedRiders.join(", ")}]`
            );

            // Find the next best available rider
            const { winner, bestDistance } = await allocateRider(
              order.restaurantLat,
              order.restaurantLng,
              rejectedRiders
            );

            if (!winner) {
              await updateOrder(orderId, { status: "NO_RIDER_AVAILABLE" });
              io.emit("order-no-rider", { orderId });
              console.log(
                `\n[Order ${orderId}] No more eligible riders. ` +
                `Marked as NO_RIDER_AVAILABLE.`
              );
              return;
            }

            // Assign the new rider
            await updateRiderFields(winner, { available: false });
            await updateOrder(orderId, { riderId: winner, status: "ASSIGNED" });

            const winnerRider = await getRider(winner);
            if (winnerRider) {
              io.to(winnerRider.socketId).emit("new-order", {
                orderId,
                restaurantLat: order.restaurantLat,
                restaurantLng: order.restaurantLng,
                assignedRider: winner
              });
            }

            io.emit("order-reassigned", {
              orderId,
              assignedRider: winner,
              distanceKm:    bestDistance,
              rejectedBy:    riderId
            });

            console.log(
              `\n[Order ${orderId}] Reassigned to rider ${winner} ` +
              `(distance: ${bestDistance.toFixed(2)} km)`
            );
          }

        } catch (err) {
          console.error("[order-response] Redis error:", err.message);
        }
      }
    );

    // ── disconnect ────────────────────────────────────────────────────────────
    socket.on("disconnect", async () => {

      console.log(`Disconnected: ${socket.id}`);

      try {
        const riderId = await getRiderIdBySocketId(socket.id);

        if (riderId) {
          // Remove from H3 in-memory index
          removeRider(riderId);

          // Remove from Redis
          await deleteRider(riderId);

          console.log(`Removed Rider: ${riderId}`);
        }
      } catch (err) {
        console.error("[disconnect] Redis error:", err.message);
      }

    });

  });

}

module.exports = socketHandler;