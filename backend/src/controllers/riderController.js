const {
  activeRiders
} = require("../store/memoryStore");

const getRiderPage = (req, res) => {

  const riderId = req.params.riderId;

  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rider Dashboard - ${riderId}</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-gradient: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
      --card-bg: rgba(30, 41, 59, 0.7);
      --card-border: rgba(255, 255, 255, 0.08);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #6366f1;
      --success: #10b981;
      --danger: #ef4444;
      --success-glow: rgba(16, 185, 129, 0.2);
      --danger-glow: rgba(239, 68, 68, 0.2);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Outfit', sans-serif;
      background: var(--bg-gradient);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow-x: hidden;
      position: relative;
    }

    /* Ambient background glows */
    body::before, body::after {
      content: '';
      position: absolute;
      width: 280px;
      height: 280px;
      border-radius: 50%;
      filter: blur(120px);
      z-index: 0;
      opacity: 0.35;
      pointer-events: none;
    }
    body::before {
      background: var(--primary);
      top: 15%;
      left: 10%;
    }
    body::after {
      background: #c084fc;
      bottom: 15%;
      right: 10%;
    }

    .container {
      width: 90%;
      max-width: 440px;
      z-index: 1;
      position: relative;
    }

    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: 28px;
      padding: 36px 32px;
      box-shadow: 0 24px 50px rgba(0, 0, 0, 0.4);
      text-align: center;
      transition: all 0.3s ease;
    }

    .header {
      margin-bottom: 24px;
    }

    .logo-container {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 64px;
      height: 64px;
      background: rgba(99, 102, 241, 0.1);
      border: 1px solid rgba(99, 102, 241, 0.2);
      border-radius: 20px;
      margin-bottom: 16px;
      color: var(--primary);
      font-size: 28px;
    }

    h1 {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin-bottom: 4px;
    }

    .subtitle {
      font-size: 14px;
      color: var(--text-muted);
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 50px;
      padding: 8px 18px;
      font-size: 13px;
      font-weight: 600;
      margin: 12px 0 20px 0;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #64748b;
      transition: background-color 0.3s ease;
    }

    .status-dot.connecting {
      background: #f59e0b;
      box-shadow: 0 0 12px #f59e0b;
      animation: pulse 1.5s infinite;
    }

    .status-dot.connected {
      background: var(--success);
      box-shadow: 0 0 12px var(--success);
      animation: pulse 1.5s infinite;
    }

    .status-dot.error {
      background: var(--danger);
      box-shadow: 0 0 12px var(--danger);
      animation: pulse 1.5s infinite;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-top: 24px;
      text-align: left;
    }

    .info-item {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.04);
      border-radius: 16px;
      padding: 16px;
    }

    .info-label {
      font-size: 12px;
      color: var(--text-muted);
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-value {
      font-size: 15px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }

    /* Modal / Alert Card for New Orders */
    .order-card {
      margin-top: 24px;
      background: rgba(99, 102, 241, 0.08);
      border: 1px dashed rgba(99, 102, 241, 0.35);
      border-radius: 20px;
      padding: 24px;
      display: none;
      transform: translateY(20px);
      opacity: 0;
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      text-align: left;
    }

    .order-card.show {
      display: block;
      transform: translateY(0);
      opacity: 1;
    }

    .order-header {
      color: var(--primary);
      font-weight: 700;
      font-size: 18px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .order-detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      padding-bottom: 8px;
    }

    .order-detail-row:last-of-type {
      border-bottom: none;
      padding-bottom: 0;
    }

    .order-detail-label {
      color: var(--text-muted);
    }

    .order-detail-value {
      font-weight: 600;
    }

    .btn-group {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 20px;
    }

    button {
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      font-size: 14px;
      padding: 14px 20px;
      border-radius: 14px;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .btn-accept {
      background: var(--success);
      color: #fff;
      box-shadow: 0 4px 12px var(--success-glow);
    }

    .btn-accept:hover {
      background: #059669;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px var(--success-glow);
    }

    .btn-reject {
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .btn-reject:hover {
      background: var(--danger);
      border-color: transparent;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px var(--danger-glow);
    }

    button:active {
      transform: translateY(0);
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none !important;
      box-shadow: none !important;
    }

    .accepted-status {
      display: none;
      color: var(--success);
      font-weight: 600;
      margin-top: 16px;
      font-size: 15px;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .accepted-status.show {
      display: flex;
    }

    @keyframes pulse {
      0% {
        transform: scale(0.95);
        opacity: 0.5;
      }
      50% {
        transform: scale(1.08);
        opacity: 1;
      }
      100% {
        transform: scale(0.95);
        opacity: 0.5;
      }
    }
  </style>
</head>
<body>

<div class="container">
  <div class="card">
    <div class="header">
      <div class="logo-container">🚴</div>
      <h1>Rider Dashboard</h1>
      <p class="subtitle" id="rider-id-label">ID: ${riderId}</p>
    </div>

    <div class="status-badge">
      <div class="status-dot connecting" id="status-dot"></div>
      <span id="status-text">Connecting...</span>
    </div>

    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Latitude</div>
        <div class="info-value" id="val-lat">-</div>
      </div>
      <div class="info-item">
        <div class="info-label">Longitude</div>
        <div class="info-value" id="val-lng">-</div>
      </div>
    </div>

    <!-- Interactive New Order Modal -->
    <div class="order-card" id="order-card">
      <div class="order-header">📦 New Delivery Available!</div>
      
      <div class="order-detail-row">
        <span class="order-detail-label">Order ID</span>
        <span class="order-detail-value" id="order-id-val">-</span>
      </div>

      <div class="order-detail-row">
        <span class="order-detail-label">Restaurant Coordinates</span>
        <span class="order-detail-value" id="order-coords-val">-</span>
      </div>

      <div class="accepted-status" id="accepted-message">
        <span>✓ Order Accepted. En route...</span>
      </div>

      <div class="btn-group" id="order-actions">
        <button class="btn-reject" id="btn-reject" onclick="handleOrderResponse(false)">Reject</button>
        <button class="btn-accept" id="btn-accept" onclick="handleOrderResponse(true)">Accept</button>
      </div>
    </div>

  </div>
</div>

<script src="/socket.io/socket.io.js"></script>

<script>
const riderId = "${riderId}";
const socket = io();

const statusText = document.getElementById("status-text");
const statusDot = document.getElementById("status-dot");
const valLat = document.getElementById("val-lat");
const valLng = document.getElementById("val-lng");

const orderCard = document.getElementById("order-card");
const orderIdVal = document.getElementById("order-id-val");
const orderCoordsVal = document.getElementById("order-coords-val");
const orderActions = document.getElementById("order-actions");
const acceptedMessage = document.getElementById("accepted-message");

let activeOrder = null;

socket.on("connect", () => {
  statusText.innerText = "Active & Tracking";
  statusDot.className = "status-dot connected";

  // Watch geolocation coordinates
  navigator.geolocation.watchPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      
      valLat.innerText = lat.toFixed(6);
      valLng.innerText = lng.toFixed(6);

      socket.emit("location-update", {
        riderId,
        latitude: lat,
        longitude: lng
      });
    },
    (error) => {
      console.error(error);
      statusText.innerText = "Location Denied";
      statusDot.className = "status-dot error";
    },
    {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 10000
    }
  );
});

socket.on("disconnect", () => {
  statusText.innerText = "Disconnected";
  statusDot.className = "status-dot error";
});

// Incoming order assigned to this rider
socket.on("new-order", (order) => {
  activeOrder = order;

  orderIdVal.innerText = order.orderId;
  orderCoordsVal.innerText = order.restaurantLat.toFixed(5) + ", " + order.restaurantLng.toFixed(5);
  
  // Reset buttons / status text
  orderActions.style.display = "grid";
  acceptedMessage.classList.remove("show");
  
  // Show Card Animation
  orderCard.style.display = "block";
  setTimeout(() => {
    orderCard.classList.add("show");
  }, 50);
});

// Send rider accept/reject action
function handleOrderResponse(accepted) {
  if (!activeOrder) return;

  const status = accepted ? "ACCEPTED" : "REJECTED";
  
  // Send websocket response to server
  socket.emit("order-response", {
    orderId: activeOrder.orderId,
    status: status
  });

  if (accepted) {
    // Show accepted state
    orderActions.style.display = "none";
    acceptedMessage.classList.add("show");
    
    // Auto fade-out after 4 seconds
    setTimeout(() => {
      hideOrderCard();
    }, 4000);
  } else {
    // Hide immediately if rejected
    hideOrderCard();
  }
}

function hideOrderCard() {
  orderCard.classList.remove("show");
  setTimeout(() => {
    orderCard.style.display = "none";
    activeOrder = null;
  }, 400);
}
</script>

</body>
</html>
  `);

};

const getActiveRiders = (req, res) => {

  res.json({
    totalRiders:
      Object.keys(activeRiders).length,

    riders:
      activeRiders
  });

};

module.exports = {
  getRiderPage,
  getActiveRiders
};