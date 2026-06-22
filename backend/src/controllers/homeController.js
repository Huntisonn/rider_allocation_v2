const getHomePage = (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DeliverFlow – Delivery Partner Allocation</title>
  <meta name="description" content="DeliverFlow connects restaurants with nearby delivery riders in real time. Join as a rider or restaurant owner.">
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg:        #070d1a;
      --surface:   rgba(255,255,255,0.04);
      --border:    rgba(255,255,255,0.08);
      --primary:   #6366f1;
      --primary-g: rgba(99,102,241,0.18);
      --amber:     #f59e0b;
      --amber-g:   rgba(245,158,11,0.18);
      --success:   #10b981;
      --text:      #f1f5f9;
      --muted:     #94a3b8;
      --dim:       #475569;
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Outfit', sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow-x: hidden;
      position: relative;
    }

    /* ── Ambient glows ── */
    .glow {
      position: fixed;
      border-radius: 50%;
      filter: blur(130px);
      pointer-events: none;
      z-index: 0;
      animation: drift 12s ease-in-out infinite alternate;
    }
    .glow-1 { width: 480px; height: 480px; background: rgba(99,102,241,0.22); top: -100px; left: -100px; }
    .glow-2 { width: 400px; height: 400px; background: rgba(245,158,11,0.14); bottom: -80px; right: -80px; animation-delay: -6s; }
    .glow-3 { width: 300px; height: 300px; background: rgba(16,185,129,0.12); top: 50%; left: 50%; transform: translate(-50%,-50%); }

    @keyframes drift {
      from { transform: translate(0, 0) scale(1); }
      to   { transform: translate(30px, 20px) scale(1.08); }
    }

    /* ── Grid overlay ── */
    .grid-bg {
      position: fixed;
      inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
      background-size: 60px 60px;
      z-index: 0;
      pointer-events: none;
    }

    /* ── Wrapper ── */
    .wrapper {
      position: relative;
      z-index: 1;
      width: 90%;
      max-width: 900px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 48px;
    }

    /* ── Hero ── */
    .hero {
      text-align: center;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 16px;
      background: rgba(99,102,241,0.12);
      border: 1px solid rgba(99,102,241,0.25);
      border-radius: 50px;
      font-size: 13px;
      font-weight: 600;
      color: #a5b4fc;
      margin-bottom: 24px;
      letter-spacing: 0.3px;
    }

    .badge-dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: var(--success);
      box-shadow: 0 0 8px var(--success);
      animation: blink 2s ease-in-out infinite;
    }

    @keyframes blink {
      0%,100% { opacity: 1; } 50% { opacity: 0.35; }
    }

    .hero h1 {
      font-size: clamp(36px, 6vw, 64px);
      font-weight: 800;
      line-height: 1.1;
      letter-spacing: -1.5px;
      background: linear-gradient(135deg, #f1f5f9 0%, #a5b4fc 60%, #c084fc 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 18px;
    }

    .hero p {
      font-size: clamp(15px, 2vw, 18px);
      color: var(--muted);
      max-width: 520px;
      margin: 0 auto;
      line-height: 1.65;
    }

    /* ── Card grid ── */
    .card-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      width: 100%;
    }

    @media (max-width: 640px) {
      .card-grid { grid-template-columns: 1fr; }
    }

    .role-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 28px;
      padding: 36px 32px 32px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      position: relative;
      overflow: hidden;
      transition: border-color 0.3s, transform 0.3s, box-shadow 0.3s;
      cursor: default;
    }

    .role-card::before {
      content: '';
      position: absolute;
      inset: 0;
      opacity: 0;
      transition: opacity 0.4s;
      pointer-events: none;
      border-radius: inherit;
    }

    /* Rider card accent */
    .card-rider::before  { background: radial-gradient(ellipse at top left, rgba(99,102,241,0.15), transparent 65%); }
    .card-rider:hover    { border-color: rgba(99,102,241,0.4); transform: translateY(-4px); box-shadow: 0 20px 60px rgba(99,102,241,0.15); }
    .card-rider:hover::before { opacity: 1; }

    /* Restaurant card accent */
    .card-rest::before  { background: radial-gradient(ellipse at top left, rgba(245,158,11,0.15), transparent 65%); }
    .card-rest:hover    { border-color: rgba(245,158,11,0.4); transform: translateY(-4px); box-shadow: 0 20px 60px rgba(245,158,11,0.15); }
    .card-rest:hover::before { opacity: 1; }

    .card-icon {
      width: 56px; height: 56px;
      border-radius: 18px;
      display: flex; align-items: center; justify-content: center;
      font-size: 26px;
      flex-shrink: 0;
    }

    .card-rider .card-icon { background: var(--primary-g); border: 1px solid rgba(99,102,241,0.25); }
    .card-rest  .card-icon { background: var(--amber-g);   border: 1px solid rgba(245,158,11,0.25); }

    .card-title {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.4px;
      margin-bottom: 6px;
    }

    .card-desc {
      font-size: 14px;
      color: var(--muted);
      line-height: 1.6;
    }

    /* ── Rider input section ── */
    .rider-input-wrap {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .input-field {
      width: 100%;
      padding: 13px 16px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 14px;
      font-family: 'Outfit', sans-serif;
      font-size: 15px;
      font-weight: 500;
      color: var(--text);
      outline: none;
      transition: border-color 0.25s, box-shadow 0.25s;
    }

    .input-field::placeholder { color: var(--dim); }

    .input-field:focus {
      border-color: rgba(99,102,241,0.6);
      box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
    }

    .input-error {
      font-size: 12px;
      color: #f87171;
      display: none;
      margin-top: -6px;
    }
    .input-error.show { display: block; }

    /* ── Buttons ── */
    .btn {
      width: 100%;
      padding: 14px 20px;
      border: none;
      border-radius: 14px;
      font-family: 'Outfit', sans-serif;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.25s ease;
      display: flex; align-items: center; justify-content: center; gap: 10px;
      text-decoration: none;
      letter-spacing: 0.3px;
    }

    .btn:active { transform: translateY(1px) !important; }

    .btn-rider {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff;
      box-shadow: 0 4px 18px rgba(99,102,241,0.35);
    }
    .btn-rider:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(99,102,241,0.45); }

    .btn-rest {
      background: linear-gradient(135deg, #f59e0b, #f97316);
      color: #fff;
      box-shadow: 0 4px 18px rgba(245,158,11,0.35);
    }
    .btn-rest:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(245,158,11,0.45); }

    /* ── Features strip ── */
    .features {
      display: flex;
      gap: 32px;
      flex-wrap: wrap;
      justify-content: center;
    }

    .feature {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--dim);
    }

    .feature-icon {
      width: 28px; height: 28px;
      border-radius: 8px;
      background: var(--surface);
      border: 1px solid var(--border);
      display: flex; align-items: center; justify-content: center;
      font-size: 14px;
    }

    /* ── Footer ── */
    footer {
      font-size: 12px;
      color: var(--dim);
      text-align: center;
    }
  </style>
</head>
<body>

<div class="glow glow-1"></div>
<div class="glow glow-2"></div>
<div class="glow glow-3"></div>
<div class="grid-bg"></div>

<div class="wrapper">

  <!-- Hero -->
  <div class="hero">
    <div class="badge">
      <div class="badge-dot"></div>
      Real-time Delivery Allocation
    </div>
    <h1>DeliverFlow</h1>
    <p>Connect restaurants with the nearest available rider — instantly, intelligently, and in real time.</p>
  </div>

  <!-- Role Cards -->
  <div class="card-grid">

    <!-- Rider Card -->
    <div class="role-card card-rider">
      <div class="card-icon">🏍️</div>
      <div>
        <div class="card-title">I'm a Rider</div>
        <div class="card-desc">Enter your name to go online, share your location, and start receiving delivery assignments.</div>
      </div>
      <div class="rider-input-wrap">
        <input
          class="input-field"
          id="rider-name"
          type="text"
          placeholder="Your name or ID (e.g. Ravi)"
          maxlength="32"
          autocomplete="off"
          onkeydown="if(event.key==='Enter') goRider()"
        />
        <div class="input-error" id="rider-error">Please enter your name first.</div>
        <button class="btn btn-rider" onclick="goRider()">
          <span>🚀</span> Go Online as Rider
        </button>
      </div>
    </div>

    <!-- Restaurant Card -->
    <div class="role-card card-rest">
      <div class="card-icon">🍽️</div>
      <div>
        <div class="card-title">I'm a Restaurant</div>
        <div class="card-desc">Open the restaurant dashboard to create delivery orders and track the nearest assigned rider on the live map.</div>
      </div>
      <a class="btn btn-rest" href="/restaurant">
        <span>📍</span> Open Restaurant Dashboard
      </a>
    </div>

  </div>

  <!-- Feature strip -->
  <div class="features">
    <div class="feature"><div class="feature-icon">📡</div> Live GPS Tracking</div>
    <div class="feature"><div class="feature-icon">⚡</div> Instant Allocation</div>
    <div class="feature"><div class="feature-icon">🔄</div> Auto Reassignment</div>
    <div class="feature"><div class="feature-icon">👥</div> Multi-user Support</div>
  </div>

  <footer>DeliverFlow &copy; 2025 &mdash; Built for speed &amp; scale</footer>

</div>

<script>
  function goRider() {
    const input = document.getElementById('rider-name');
    const err   = document.getElementById('rider-error');
    const name  = input.value.trim();

    if (!name) {
      err.classList.add('show');
      input.focus();
      input.style.borderColor = 'rgba(248,113,113,0.6)';
      return;
    }

    err.classList.remove('show');
    input.style.borderColor = '';

    // Slugify: keep alphanumeric, replace spaces with underscores
    const slug = name.replace(/\\s+/g, '_').replace(/[^a-zA-Z0-9_\\-]/g, '');
    if (!slug) {
      err.textContent = 'Please use letters or numbers only.';
      err.classList.add('show');
      return;
    }

    window.location.href = '/rider/' + encodeURIComponent(slug);
  }

  // Clear error state on input
  document.getElementById('rider-name').addEventListener('input', function () {
    document.getElementById('rider-error').classList.remove('show');
    this.style.borderColor = '';
  });
</script>

</body>
</html>`);
};

module.exports = { getHomePage };
