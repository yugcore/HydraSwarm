/* =========================================================
   HYDRA - LIVE CAMERA FEED & HUD CANVAS
========================================================= */

let feedRAF = null;

function renderLiveFeed() {
  const r = state.liveFeedRoverId ? byId(rovers, state.liveFeedRoverId) : null;
  if (state.mode === 'live' || !r) {
    return `
    <div class="livefeed">
      <div class="lf-header"><span class="lf-title">Live Feed</span></div>
      <div class="lf-body">
        <div class="lf-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2" y="6" width="14" height="12" rx="1.6"/><path d="M16 10.5l6-3.5v10l-6-3.5"/></svg>
          <div class="es-title">${state.mode === 'live' ? 'Camera service not connected' : 'No active feed'}</div>
          <div class="es-sub">${state.mode === 'live' ? 'Connect a camera feed provider to view live rover video in Live mode.' : 'Select a deployed rover and choose “Show Live Feed” to view its camera stream.'}</div>
        </div>
      </div>
    </div>`;
  }
  const h = r.hazardId ? byId(hazards, r.hazardId) : null;
  const telem = HYDRA_TELEMETRY.getRoverTelemetry(r.id);
  const etaText = HYDRA_TELEMETRY.formatEta(telem.etaSeconds);

  return `
  <div class="livefeed">
    <div class="lf-header">
      <span class="lf-title"><span class="rec-dot"></span>Live Feed &mdash; ${r.name} (${r.id})</span>
      <button class="lf-close" data-action="close-feed">Close</button>
    </div>
    <div class="lf-body">
      <canvas class="feed-canvas" id="feedCanvas"></canvas>
      <div class="lf-crosshair"></div>
      <div class="lf-overlay">
        <div class="lf-ov-row">
          <span class="lf-tag">${r.id} &middot; ${r.name} &middot; SPD ${telem.speed.toFixed(1)} km/h</span>
          <span class="lf-tag" id="feedTimestamp">${fmtTime(new Date())}</span>
        </div>
        <div class="lf-ov-row" style="align-items:flex-end;">
          <span class="lf-tag">LAT ${telem.lat.toFixed(4)} &middot; LON ${telem.lon.toFixed(4)}</span>
          <span class="lf-tag">HDG ${telem.heading}° &middot; ${h ? ('TGT ' + h.name.split(',')[0]).toUpperCase() : 'PATROL'} &middot; ETA ${etaText}</span>
        </div>
      </div>
    </div>
  </div>`;
}

function startFeedAnim() {
  cancelAnimationFrame(feedRAF);
  const canvas = document.getElementById('feedCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
  }
  resize();
  window.addEventListener('resize', resize);

  let t = 0;
  function frame() {
    t += 1;
    const w = canvas.width, hh = canvas.height;
    const g = ctx.createLinearGradient(0, 0, 0, hh);
    g.addColorStop(0, '#1a2420');
    g.addColorStop(0.55, '#10231f');
    g.addColorStop(1, '#0a1512');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, hh);

    // simulated terrain silhouette
    ctx.fillStyle = 'rgba(10,20,17,0.9)';
    ctx.beginPath();
    ctx.moveTo(0, hh * 0.62);
    for (let x = 0; x <= w; x += w / 12) {
      const y = hh * 0.6 + Math.sin((x / w * 6) + t * 0.01) * hh * 0.03;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, hh);
    ctx.lineTo(0, hh);
    ctx.closePath();
    ctx.fill();

    // scanline noise
    ctx.globalAlpha = 0.05;
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#8fe0d0' : '#000';
      ctx.fillRect(Math.random() * w, Math.random() * hh, Math.random() * 2, 1);
    }
    ctx.globalAlpha = 1;

    // faint moving grid line (simulated stabilization drift)
    ctx.strokeStyle = 'rgba(216,240,236,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, hh * 0.5 + Math.sin(t * 0.008) * 6);
    ctx.lineTo(w, hh * 0.5 + Math.sin(t * 0.008 + 1) * 6);
    ctx.stroke();

    feedRAF = requestAnimationFrame(frame);
  }
  frame();
}
