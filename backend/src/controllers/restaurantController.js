const getRestaurantPage = (req, res) => {

  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restaurant Dashboard</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="/socket.io/socket.io.js"></script>
  <style>
    :root {
      --bg-primary: #0f172a;
      --bg-secondary: #1e293b;
      --card-bg: rgba(30, 41, 59, 0.85);
      --card-border: rgba(255, 255, 255, 0.08);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
      --primary: #6366f1;
      --primary-glow: rgba(99, 102, 241, 0.25);
      --success: #10b981;
      --success-glow: rgba(16, 185, 129, 0.25);
      --warning: #f59e0b;
      --danger: #ef4444;
      --rider-blue: #3b82f6;
      --rider-blue-glow: rgba(59, 130, 246, 0.3);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Outfit', sans-serif;
      background: var(--bg-primary);
      color: var(--text-main);
      height: 100vh;
      display: flex;
      overflow: hidden;
    }

    /* ---- Sidebar ---- */
    .sidebar {
      width: 400px;
      min-width: 400px;
      height: 100vh;
      background: var(--card-bg);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border-right: 1px solid var(--card-border);
      display: flex;
      flex-direction: column;
      z-index: 1000;
      position: relative;
    }

    .sidebar-header {
      padding: 28px 28px 20px;
      border-bottom: 1px solid var(--card-border);
    }

    .logo-row {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 4px;
    }

    .logo-icon {
      width: 48px;
      height: 48px;
      background: rgba(99, 102, 241, 0.12);
      border: 1px solid rgba(99, 102, 241, 0.25);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }

    .logo-text h1 {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.3px;
    }

    .logo-text p {
      font-size: 13px;
      color: var(--text-muted);
      margin-top: 2px;
    }

    /* ---- Location Section ---- */
    .section {
      padding: 24px 28px;
      border-bottom: 1px solid var(--card-border);
    }

    .section-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--text-dim);
      font-weight: 600;
      margin-bottom: 14px;
    }

    .location-status {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 14px;
      font-size: 14px;
    }

    .loc-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--warning);
      box-shadow: 0 0 10px var(--warning);
      animation: pulse 1.5s infinite;
      flex-shrink: 0;
    }

    .loc-dot.active {
      background: var(--success);
      box-shadow: 0 0 10px var(--success);
    }

    .loc-dot.error {
      background: var(--danger);
      box-shadow: 0 0 10px var(--danger);
      animation: none;
    }

    .coord-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-top: 12px;
    }

    .coord-item {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.04);
      border-radius: 12px;
      padding: 12px 14px;
    }

    .coord-label {
      font-size: 11px;
      color: var(--text-dim);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .coord-value {
      font-size: 14px;
      font-weight: 600;
      margin-top: 3px;
      font-variant-numeric: tabular-nums;
    }

    /* ---- Create Order Button ---- */
    .btn-create {
      width: 100%;
      padding: 16px;
      border: none;
      border-radius: 14px;
      font-family: 'Outfit', sans-serif;
      font-size: 15px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      cursor: pointer;
      transition: all 0.25s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      background: linear-gradient(135deg, var(--primary), #8b5cf6);
      color: #fff;
      box-shadow: 0 4px 20px var(--primary-glow);
      margin-top: 16px;
    }

    .btn-create:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px var(--primary-glow);
    }

    .btn-create:active { transform: translateY(0); }

    .btn-create:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      transform: none !important;
      box-shadow: none !important;
    }

    /* ---- Order Result Card ---- */
    .order-result {
      display: none;
      margin-top: 16px;
      background: rgba(16, 185, 129, 0.06);
      border: 1px solid rgba(16, 185, 129, 0.2);
      border-radius: 16px;
      padding: 20px;
      animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .order-result.show { display: block; }

    .order-result.error-result {
      background: rgba(239, 68, 68, 0.06);
      border-color: rgba(239, 68, 68, 0.2);
    }

    .order-result.warning-result {
      background: rgba(245, 158, 11, 0.06);
      border-color: rgba(245, 158, 11, 0.2);
    }

    .order-result.warning-result .result-header { color: var(--warning); }

    /* ---- Reassignment Banner ---- */
    .reassign-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.25);
      border-radius: 10px;
      font-size: 13px;
      color: var(--warning);
      font-weight: 600;
      margin-bottom: 10px;
      animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .reassign-banner .spin {
      display: inline-block;
      animation: spinOnce 0.6s ease forwards;
    }

    @keyframes spinOnce {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }

    .result-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      font-size: 16px;
      margin-bottom: 14px;
      color: var(--success);
    }

    .order-result.error-result .result-header { color: var(--danger); }

    .result-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      font-size: 14px;
    }

    .result-row:last-child { border-bottom: none; }

    .result-label { color: var(--text-muted); }
    .result-value { font-weight: 600; }

    /* ---- Riders Summary (bottom of sidebar) ---- */
    .sidebar-footer {
      margin-top: auto;
      padding: 20px 28px;
      border-top: 1px solid var(--card-border);
    }

    .riders-summary {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
    }

    .riders-count {
      background: rgba(59, 130, 246, 0.12);
      border: 1px solid rgba(59, 130, 246, 0.25);
      padding: 6px 14px;
      border-radius: 50px;
      font-weight: 700;
      font-size: 13px;
      color: var(--rider-blue);
    }

    /* ---- Map Container ---- */
    .map-container {
      flex: 1;
      position: relative;
    }

    #map {
      width: 100%;
      height: 100%;
    }

    /* ---- Custom Map Markers ---- */
    .marker-restaurant {
      width: 42px;
      height: 42px;
      background: linear-gradient(135deg, var(--primary), #8b5cf6);
      border: 3px solid #fff;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 4px 16px rgba(99, 102, 241, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .marker-restaurant span {
      transform: rotate(45deg);
      font-size: 18px;
    }

    .marker-rider {
      width: 36px;
      height: 36px;
      background: var(--rider-blue);
      border: 2px solid rgba(255, 255, 255, 0.8);
      border-radius: 50%;
      box-shadow: 0 3px 12px var(--rider-blue-glow);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      transition: all 0.4s ease;
    }

    .marker-rider.allocated {
      width: 44px;
      height: 44px;
      background: var(--success);
      border: 3px solid #fff;
      box-shadow: 0 0 20px var(--success-glow), 0 0 40px var(--success-glow);
      font-size: 20px;
      animation: markerPulse 1.5s ease-in-out infinite;
    }

    .marker-rider.dimmed {
      opacity: 0.45;
      filter: grayscale(0.4);
    }

    .rider-label {
      position: absolute;
      bottom: -22px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15, 23, 42, 0.85);
      color: #e2e8f0;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 10px;
      font-family: 'Outfit', sans-serif;
      font-weight: 600;
      white-space: nowrap;
      letter-spacing: 0.3px;
    }

    .marker-rider.allocated .rider-label {
      background: rgba(16, 185, 129, 0.9);
      color: #fff;
    }

    /* ---- Map Legend ---- */
    .map-legend {
      position: absolute;
      bottom: 24px;
      right: 24px;
      background: var(--card-bg);
      backdrop-filter: blur(16px);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 16px 20px;
      z-index: 1000;
      font-size: 13px;
    }

    .legend-title {
      font-weight: 700;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-dim);
      margin-bottom: 10px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 6px;
    }

    .legend-item:last-child { margin-bottom: 0; }

    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.6);
      flex-shrink: 0;
    }

    /* ---- Animations ---- */
    @keyframes pulse {
      0%, 100% { opacity: 0.5; transform: scale(0.95); }
      50% { opacity: 1; transform: scale(1.1); }
    }

    @keyframes markerPulse {
      0%, 100% { box-shadow: 0 0 20px var(--success-glow), 0 0 40px var(--success-glow); }
      50% { box-shadow: 0 0 30px var(--success-glow), 0 0 60px var(--success-glow); }
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Dark Leaflet Overrides */
    .leaflet-tile-pane { filter: brightness(0.65) contrast(1.2) saturate(0.3) hue-rotate(180deg) invert(1); }
    .leaflet-control-zoom a {
      background: var(--bg-secondary) !important;
      color: var(--text-main) !important;
      border-color: var(--card-border) !important;
    }
    .leaflet-control-attribution { display: none !important; }
  </style>
</head>
<body>

<!-- Sidebar -->
<div class="sidebar">
  <div class="sidebar-header">
    <div class="logo-row">
      <div class="logo-icon">🍽️</div>
      <div class="logo-text">
        <h1>Restaurant Panel</h1>
        <p>Order & Rider Allocation</p>
      </div>
    </div>
  </div>

  <!-- Location Section -->
  <div class="section">
    <div class="section-label">Your Location</div>
    <div class="location-status">
      <div class="loc-dot" id="loc-dot"></div>
      <span id="loc-status">Detecting location...</span>
    </div>
    <div class="coord-grid">
      <div class="coord-item">
        <div class="coord-label">Latitude</div>
        <div class="coord-value" id="my-lat">—</div>
      </div>
      <div class="coord-item">
        <div class="coord-label">Longitude</div>
        <div class="coord-value" id="my-lng">—</div>
      </div>
    </div>
  </div>

  <!-- Action Section -->
  <div class="section">
    <div class="section-label">Create Delivery Order</div>
    <button class="btn-create" id="btn-create" onclick="createOrder()" disabled>
      <span>📦</span> Create Order
    </button>

    <div class="order-result" id="order-result">
      <div class="result-header" id="result-header">
        <span>✓</span> <span id="result-title">Order Created!</span>
      </div>
      <div id="result-body"></div>
    </div>
  </div>

  <!-- Footer -->
  <div class="sidebar-footer">
    <div class="riders-summary">
      <span class="riders-count" id="riders-count">0</span>
      <span style="color: var(--text-muted)">Active Riders Online</span>
    </div>
  </div>
</div>

<!-- Map -->
<div class="map-container">
  <div id="map"></div>
  <div class="map-legend">
    <div class="legend-title">Map Legend</div>
    <div class="legend-item">
      <div class="legend-dot" style="background: var(--primary);"></div>
      <span>Your Restaurant</span>
    </div>
    <div class="legend-item">
      <div class="legend-dot" style="background: var(--rider-blue);"></div>
      <span>Available Rider</span>
    </div>
    <div class="legend-item">
      <div class="legend-dot" style="background: var(--success);"></div>
      <span>Allocated Rider</span>
    </div>
  </div>
</div>

<script>
// ---- State ----
let myLat = null;
let myLng = null;
let map = null;
let restaurantMarker = null;
let riderMarkers = {};
let currentOrderId = null;
let currentWinnerId = null;
let allocationLine = null;

// ---- Init Map ----
map = L.map('map', {
  zoomControl: true
}).setView([20.5937, 78.9629], 5); // Default to India

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19
}).addTo(map);

// ---- Create custom marker icon ----
function createRestaurantIcon() {
  return L.divIcon({
    className: '',
    html: '<div class="marker-restaurant"><span>🍽️</span></div>',
    iconSize: [42, 42],
    iconAnchor: [21, 42],
    popupAnchor: [0, -42]
  });
}

function createRiderIcon(riderId, state) {
  // state: "normal" | "allocated" | "dimmed"
  const cls = state === "allocated" ? "allocated" : (state === "dimmed" ? "dimmed" : "");
  return L.divIcon({
    className: '',
    html: \`
      <div class="marker-rider \${cls}" style="position:relative;">
        🏍️
        <div class="rider-label">\${riderId}</div>
      </div>
    \`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -24]
  });
}

// ---- Geolocation ----
if (navigator.geolocation) {
  navigator.geolocation.watchPosition(
    (pos) => {
      myLat = pos.coords.latitude;
      myLng = pos.coords.longitude;

      document.getElementById('loc-dot').className = 'loc-dot active';
      document.getElementById('loc-status').innerText = 'Location Active';
      document.getElementById('my-lat').innerText = myLat.toFixed(6);
      document.getElementById('my-lng').innerText = myLng.toFixed(6);
      document.getElementById('btn-create').disabled = false;

      // Update restaurant marker on map
      if (!restaurantMarker) {
        restaurantMarker = L.marker([myLat, myLng], {
          icon: createRestaurantIcon(),
          zIndexOffset: 1000
        }).addTo(map)
          .bindPopup('<b>Your Restaurant</b>');
        map.setView([myLat, myLng], 15);
      } else {
        restaurantMarker.setLatLng([myLat, myLng]);
      }

      // Fetch and display active riders
      fetchRiders();
    },
    (err) => {
      document.getElementById('loc-dot').className = 'loc-dot error';
      document.getElementById('loc-status').innerText = 'Location Denied';
      console.error(err);
    },
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
  );
} else {
  document.getElementById('loc-dot').className = 'loc-dot error';
  document.getElementById('loc-status').innerText = 'Geolocation Unsupported';
}

// ---- Fetch Riders Periodically ----
async function fetchRiders() {
  try {
    const res = await fetch('/riders');
    const data = await res.json();
    const riders = data.riders || {};
    const riderIds = Object.keys(riders);

    document.getElementById('riders-count').innerText = riderIds.length;

    // Add/update rider markers
    riderIds.forEach(id => {
      const r = riders[id];
      if (riderMarkers[id]) {
        riderMarkers[id].setLatLng([r.latitude, r.longitude]);
      } else {
        riderMarkers[id] = L.marker([r.latitude, r.longitude], {
          icon: createRiderIcon(id, "normal")
        }).addTo(map)
          .bindPopup('<b>' + id + '</b><br>Available: ' + r.available);
      }
    });

    // Remove markers for riders that disconnected
    Object.keys(riderMarkers).forEach(id => {
      if (!riders[id]) {
        map.removeLayer(riderMarkers[id]);
        delete riderMarkers[id];
      }
    });

  } catch (e) {
    console.error('Failed to fetch riders:', e);
  }
}

// Refresh riders every 4 seconds
setInterval(fetchRiders, 4000);

// ---- Create Order ----
async function createOrder() {
  if (myLat === null || myLng === null) return;

  const btn = document.getElementById('btn-create');
  btn.disabled = true;
  btn.innerHTML = '<span>⏳</span> Allocating...';

  const resultCard = document.getElementById('order-result');
  resultCard.className = 'order-result';

  try {
    const res = await fetch('/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurantLat: myLat,
        restaurantLng: myLng
      })
    });

    const data = await res.json();

    if (!res.ok) {
      showError(data.message || 'Failed to allocate');
      return;
    }

    // ---- Success: highlight allocated rider on map ----
    const winnerId = data.assignedRider;

    // First refresh riders so we have latest positions
    await fetchRiders();

    // Now restyle all markers
    Object.keys(riderMarkers).forEach(id => {
      const marker = riderMarkers[id];
      const latlng = marker.getLatLng();
      if (id === winnerId) {
        marker.setIcon(createRiderIcon(id, "allocated"));
        marker.setZIndexOffset(900);
        marker.bindPopup('<b>' + id + '</b><br>✅ Allocated for this order');
        marker.openPopup();
      } else {
        marker.setIcon(createRiderIcon(id, "dimmed"));
      }
    });

    // Draw a dashed line from restaurant to allocated rider
    if (allocationLine) {
      map.removeLayer(allocationLine);
      allocationLine = null;
    }
    if (riderMarkers[winnerId]) {
      const riderPos = riderMarkers[winnerId].getLatLng();
      allocationLine = L.polyline(
        [[myLat, myLng], [riderPos.lat, riderPos.lng]],
        {
          color: '#10b981',
          weight: 3,
          dashArray: '8, 12',
          opacity: 0.7
        }
      ).addTo(map);

      // Fit map to show both markers
      const bounds = L.latLngBounds(
        [myLat, myLng],
        [riderPos.lat, riderPos.lng]
      );
      map.fitBounds(bounds, { padding: [80, 80] });
    }

    // Track current order + winner for reassignment updates
    currentOrderId = data.orderId;
    currentWinnerId = winnerId;

    // Show result card
    document.getElementById('result-header').innerHTML = '<span>✓</span> <span>Order Created!</span>';
    resultCard.classList.remove('error-result');
    document.getElementById('result-body').innerHTML = \`
      <div class="result-row">
        <span class="result-label">Order ID</span>
        <span class="result-value">\${data.orderId}</span>
      </div>
      <div class="result-row">
        <span class="result-label">Assigned Rider</span>
        <span class="result-value">\${data.assignedRider}</span>
      </div>
      <div class="result-row">
        <span class="result-label">Distance</span>
        <span class="result-value">\${data.distanceKm.toFixed(3)} km</span>
      </div>
    \`;
    resultCard.className = 'order-result show';

    // Re-enable button after 5s for next order
    setTimeout(() => {
      btn.disabled = false;
      btn.innerHTML = '<span>📦</span> Create Order';
      // Reset rider marker styles back to normal
      Object.keys(riderMarkers).forEach(id => {
        riderMarkers[id].setIcon(createRiderIcon(id, "normal"));
      });
    }, 5000);

  } catch (err) {
    showError('Network error: ' + err.message);
  }
}

function showError(msg) {
  const resultCard = document.getElementById('order-result');
  document.getElementById('result-header').innerHTML = '<span>✗</span> <span>Allocation Failed</span>';
  document.getElementById('result-body').innerHTML = \`
    <div class="result-row">
      <span class="result-label">Reason</span>
      <span class="result-value">\${msg}</span>
    </div>
  \`;
  resultCard.className = 'order-result show error-result';

  setTimeout(() => {
    document.getElementById('btn-create').disabled = false;
    document.getElementById('btn-create').innerHTML = '<span>📦</span> Create Order';
  }, 3000);
}
// ---- Socket.io: real-time reassignment updates ----
const socket = io();

socket.on('order-reassigned', (data) => {
  // Only update if this event is for our current order
  if (data.orderId !== currentOrderId) return;

  const newWinnerId = data.assignedRider;

  // Update map: dim old winner, highlight new winner, redraw line
  fetchRiders().then(() => {
    Object.keys(riderMarkers).forEach(id => {
      if (id === newWinnerId) {
        riderMarkers[id].setIcon(createRiderIcon(id, 'allocated'));
        riderMarkers[id].setZIndexOffset(900);
        riderMarkers[id].bindPopup('<b>' + id + '</b><br>✅ Reassigned for this order');
        riderMarkers[id].openPopup();
      } else {
        riderMarkers[id].setIcon(createRiderIcon(id, 'dimmed'));
      }
    });

    // Redraw the allocation line
    if (allocationLine) {
      map.removeLayer(allocationLine);
      allocationLine = null;
    }
    if (riderMarkers[newWinnerId]) {
      const riderPos = riderMarkers[newWinnerId].getLatLng();
      allocationLine = L.polyline(
        [[myLat, myLng], [riderPos.lat, riderPos.lng]],
        { color: '#f59e0b', weight: 3, dashArray: '8, 12', opacity: 0.8 }
      ).addTo(map);
      map.fitBounds(
        L.latLngBounds([myLat, myLng], [riderPos.lat, riderPos.lng]),
        { padding: [80, 80] }
      );
    }
  });

  // Update the result card in the sidebar
  const resultCard = document.getElementById('order-result');
  resultCard.classList.remove('error-result', 'warning-result');
  document.getElementById('result-header').innerHTML = '<span>✓</span> <span>Order Reassigned</span>';

  document.getElementById('result-body').innerHTML = \`
    <div class="reassign-banner">
      <span class="spin">🔄</span>
      Rider <b>\${data.rejectedBy}</b> declined — reassigned!
    </div>
    <div class="result-row">
      <span class="result-label">Order ID</span>
      <span class="result-value">\${data.orderId}</span>
    </div>
    <div class="result-row">
      <span class="result-label">New Rider</span>
      <span class="result-value">\${newWinnerId}</span>
    </div>
    <div class="result-row">
      <span class="result-label">Distance</span>
      <span class="result-value">\${data.distanceKm.toFixed(3)} km</span>
    </div>
  \`;
  resultCard.className = 'order-result show';

  currentWinnerId = newWinnerId;
});

socket.on('order-no-rider', (data) => {
  if (data.orderId !== currentOrderId) return;

  // Remove the allocation line
  if (allocationLine) {
    map.removeLayer(allocationLine);
    allocationLine = null;
  }

  // Reset all markers
  Object.keys(riderMarkers).forEach(id => {
    riderMarkers[id].setIcon(createRiderIcon(id, 'normal'));
  });

  // Show warning card
  const resultCard = document.getElementById('order-result');
  document.getElementById('result-header').innerHTML = '<span>⚠️</span> <span>No Riders Available</span>';
  document.getElementById('result-body').innerHTML = \`
    <div class="result-row">
      <span class="result-label">Order ID</span>
      <span class="result-value">\${data.orderId}</span>
    </div>
    <div class="result-row">
      <span class="result-label">Status</span>
      <span class="result-value">All riders declined</span>
    </div>
  \`;
  resultCard.className = 'order-result show warning-result';

  // Re-enable the create button
  const btn = document.getElementById('btn-create');
  btn.disabled = false;
  btn.innerHTML = '<span>📦</span> Create Order';
  currentOrderId = null;
  currentWinnerId = null;
});

</script>

</body>
</html>
  `);

};

module.exports = {
  getRestaurantPage
};
