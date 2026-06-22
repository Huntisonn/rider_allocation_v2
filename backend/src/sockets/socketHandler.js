const {
  activeRiders,
  activeOrders
} = require("../store/memoryStore");

const allocateRider =
  require("../services/allocationService");

function socketHandler(io) {

  io.on(
    "connection",
    (socket) => {

      console.log(
        "Connected:",
        socket.id
      );

      socket.on(
        "location-update",
        ({
          riderId,
          latitude,
          longitude
        }) => {

          activeRiders[
            riderId
          ] = {

            socketId:
              socket.id,

            latitude,

            longitude,

            available:
              activeRiders[
                riderId
              ]?.available ?? true,

            lastUpdated:
              Date.now()

          };

          console.log(
            "\n====== RIDER UPDATE ======"
          );

          console.log(
            "Rider:",
            riderId
          );

          console.log(
            "Latitude:",
            latitude
          );

          console.log(
            "Longitude:",
            longitude
          );

          console.log(
            "Total Riders:",
            Object.keys(
              activeRiders
            ).length
          );

          console.log(
            "=========================="
          );

        }
      );

      // Handle rider order acceptance/rejection response
      socket.on(
        "order-response",
        ({ orderId, status }) => {

          let riderId = null;
          for (const id in activeRiders) {
            if (activeRiders[id].socketId === socket.id) {
              riderId = id;
              break;
            }
          }

          if (!riderId) {
            console.log(`\n[Socket Error] Order response received but no active rider found for socket: ${socket.id}`);
            return;
          }

          console.log(
            "\n====== RIDER RESPONSE ======"
          );

          console.log(
            "Rider:",
            riderId
          );

          console.log(
            "Order ID:",
            orderId
          );

          console.log(
            "Status:",
            status
          );

          console.log(
            "============================"
          );

          if (status === "ACCEPTED") {
            // Mark the order as accepted
            if (activeOrders[orderId]) {
              activeOrders[orderId].status = "ACCEPTED";
            }
            console.log(`\n[Order ${orderId}] Accepted by rider ${riderId}`);

          } else if (status === "REJECTED") {
            // Free the rejecting rider
            if (activeRiders[riderId]) {
              activeRiders[riderId].available = true;
            }

            const order = activeOrders[orderId];
            if (!order) {
              console.log(`\n[Order ${orderId}] Not found in activeOrders — cannot reassign.`);
              return;
            }

            // Track all riders who have rejected this order
            if (!order.rejectedRiders) {
              order.rejectedRiders = [];
            }
            order.rejectedRiders.push(riderId);

            console.log(
              `\n[Order ${orderId}] Rejected by rider ${riderId}. Attempting reassignment...`
            );
            console.log(
              `  Already rejected: [${order.rejectedRiders.join(", ")}]`
            );

            // Find the next best available rider
            const { winner, bestDistance } = allocateRider(
              order.restaurantLat,
              order.restaurantLng,
              order.rejectedRiders
            );

            if (!winner) {
              order.status = "NO_RIDER_AVAILABLE";
              // Notify restaurant dashboard that all riders declined
              io.emit("order-no-rider", { orderId });
              console.log(`\n[Order ${orderId}] No more eligible riders available. Order marked as NO_RIDER_AVAILABLE.`);
              return;
            }

            // Assign the new rider
            activeRiders[winner].available = false;
            order.riderId = winner;
            order.status = "ASSIGNED";

            // Notify the new rider via Socket.io
            const newRiderSocketId = activeRiders[winner].socketId;
            io.to(newRiderSocketId).emit("new-order", {
              orderId,
              restaurantLat: order.restaurantLat,
              restaurantLng: order.restaurantLng,
              assignedRider: winner
            });

            // Broadcast reassignment to all clients (e.g. restaurant dashboard)
            io.emit("order-reassigned", {
              orderId,
              assignedRider: winner,
              distanceKm: bestDistance,
              rejectedBy: riderId
            });

            console.log(
              `\n[Order ${orderId}] Reassigned to rider ${winner} (distance: ${bestDistance.toFixed(2)} km)`
            );
          }

        }
      );

      socket.on(
        "disconnect",
        () => {

          console.log(
            `Disconnected: ${socket.id}`
          );

          for (
            const riderId
            in activeRiders
          ) {

            if (
              activeRiders[
                riderId
              ].socketId ===
              socket.id
            ) {

              delete activeRiders[
                riderId
              ];

              console.log(
                `Removed Rider: ${riderId}`
              );

            }

          }

        }
      );

    }
  );

}

module.exports =
  socketHandler;