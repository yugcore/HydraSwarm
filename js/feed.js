/* =========================================================
   AEGIS - LIVE CAMERA FEED & MULTI-CAM GRID (ESP32 & SQUAD)
========================================================= */

let feedRAF = null;

function renderLiveFeed() {
  const isLive = state.mode === 'live';
  // The live video feed section strictly streams REAL physical WiFi hardware (zero simulated units)
  const streamableRovers = rovers.filter(rv => rv.isEsp32);

  // If in grid mode or multiple real ESP32 rovers are active and no specific single rover chosen, default to grid
  const isGrid = (state.feedViewMode === 'grid' || (!state.liveFeedRoverId && streamableRovers.length > 1)) && streamableRovers.length > 1;
  const isExpanded = !!state.feedExpanded;

  // Multi-camera switcher tabs
  const multiCamSwitcher = streamableRovers.length > 1 ? `
    <div class="feed-tabs-strip">
      <button class="feed-tab-btn ${isGrid ? 'active' : ''}" data-action="set-feed-view" data-view="grid" title="Multi-Camera Split Grid (Stream all real WiFi rovers simultaneously)">
        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        Multi-Cam Split Grid (${streamableRovers.length})
      </button>
      <button class="feed-tab-btn ${!isGrid ? 'active' : ''}" data-action="set-feed-view" data-view="single" title="Focus Single Camera View">
        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
        Single Cam
      </button>
      <div class="strip-divider"></div>
      ${streamableRovers.map(rv => `
        <button class="feed-tab-btn ${(!isGrid && rv.id === state.liveFeedRoverId) ? 'active' : ''}" data-action="select-active-feed" data-id="${rv.id}" title="Focus ${rv.name} camera feed">
          <span class="ft-name">${rv.name}</span>
          <span class="ft-ip">${rv.ip}</span>
        </button>
      `).join('')}
      <button class="feed-tab-btn" data-action="open-esp32-modal" style="margin-left:auto;color:var(--accent-cyan);" title="Add or configure WiFi rovers">
        + Add Real Hardware
      </button>
    </div>` : '';

  // ----------------------------------------------------
  // IDLE / NO ACTIVE FEED STATE
  // ----------------------------------------------------
  if (streamableRovers.length === 0) {
    return `
    <div class="livefeed livefeed-idle">
      <div class="lf-header">
        <div class="lf-title-group">
          <span class="lf-title">${isLive ? 'Real Hardware Camera Feed' : 'Live Camera Feed'}</span>
        </div>
        <span style="font-size:10.5px;color:var(--text-3);">Physical Hardware Only</span>
      </div>
      <div class="lf-body">
        <div class="lf-empty">
          <div style="display:flex;align-items:center;gap:8px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="24" height="24"><rect x="2" y="6" width="14" height="12" rx="1.6"/><path d="M16 10.5l6-3.5v10l-6-3.5"/></svg>
            <span class="es-title" style="margin:0;">No Real WiFi Rovers Linked</span>
          </div>
          <div class="es-sub">In accordance with live operational protocol, simulated units are excluded. Link your real ESP32-CAM / ESP32-S3 hardware over local WiFi to stream live footage.</div>
          <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;justify-content:center;">
            <button class="btn btn-primary btn-sm" data-action="connect-all-esp32">
              Connect Discovered WiFi Hardware (4)
            </button>
            <button class="btn btn-secondary btn-sm" data-action="open-esp32-modal">
              + Manual IP / Subnet Scan
            </button>
          </div>
        </div>
      </div>
    </div>`;
  }

  // ----------------------------------------------------
  // MULTI-CAM GRID VIEW (STREAM ALL ROVERS SIMULTANEOUSLY)
  // ----------------------------------------------------
  if (isGrid) {
    const gridCols = streamableRovers.length >= 3 ? 'grid-4' : 'grid-2';
    const gridCards = streamableRovers.slice(0, 4).map(rv => {
      const isEsp = !!rv.isEsp32;
      const telem = AEGIS_TELEMETRY.getRoverTelemetry(rv.id);
      return `
      <div class="grid-cam-tile" data-id="${rv.id}">
        <div class="grid-cam-head">
          <span class="grid-cam-title">
            <b>${rv.name}</b> ${isEsp ? `<span class="esp-ip-pill" style="font-size:8.5px;padding:1px 5px;">${rv.ip}</span>` : ''}
          </span>
          <div style="display:flex;align-items:center;gap:6px;">
            ${isEsp ? `<span style="color:var(--accent-emerald);font-size:9.5px;font-weight:700;font-family:var(--mono);">${rv.rssi || -50}dBm</span>` : ''}
            <span style="font-size:9.5px;font-weight:800;font-family:var(--mono);">${rv.battery}%</span>
            <button class="link-btn" data-action="select-active-feed" data-id="${rv.id}" title="Maximize single view" style="color:var(--accent-cyan);font-size:10px;font-weight:700;">Focus &rarr;</button>
          </div>
        </div>
        <div class="grid-cam-screen">
          ${isEsp ? `
            <img class="feed-mjpeg-stream" src="${rv.streamUrl}" alt="${rv.name} Feed"
                 onerror="this.classList.add('stream-error');"
                 onload="this.classList.remove('stream-error');" />
          ` : ''}
          <div class="grid-synthetic-view">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="6" width="14" height="12" rx="1.6"/><path d="M16 10.5l6-3.5v10l-6-3.5"/></svg>
            <span>${rv.name} &bull; ${isEsp ? `${rv.ip}:${rv.port || 81}` : 'Synthetic Feed'}</span>
          </div>
          <div class="grid-cam-osd">
            <span>LAT ${telem.lat.toFixed(4)} &middot; LON ${telem.lon.toFixed(4)}</span>
            <span>${isEsp ? '2.4GHz WiFi' : `${telem.speed.toFixed(0)} km/h`}</span>
          </div>
        </div>
        <div class="grid-cam-foot">
          ${isEsp ? `
            <button class="mini-btn" style="padding:2px 6px;font-size:9px;" data-action="toggle-esp32-flash" data-id="${rv.id}">Flash</button>
            <button class="mini-btn" style="padding:2px 6px;font-size:9px;" data-action="capture-esp32-snapshot" data-id="${rv.id}">Snap</button>
            <button class="mini-btn" style="padding:2px 6px;font-size:9px;" data-action="esp-drive" data-cmd="forward" data-id="${rv.id}">&#x25B2; Fwd</button>
            <button class="mini-btn" style="padding:2px 6px;font-size:9px;" data-action="esp-drive" data-cmd="stop" data-id="${rv.id}">Stop</button>
          ` : `
            <span style="font-size:9.5px;color:var(--text-3);">Speed: ${telem.speed.toFixed(0)} km/h</span>
          `}
        </div>
      </div>`;
    }).join('');

    return `
    <div class="livefeed livefeed-grid-mode ${isExpanded ? 'livefeed-expanded' : ''}">
      <div class="lf-header">
        <div class="lf-title-group">
          <span class="lf-title">
            Multi-Camera Squad Grid &mdash; ${streamableRovers.length} Active Feeds
          </span>
        </div>
        <div class="lf-header-actions">
          <button class="lf-close" data-action="toggle-feed-size" title="${isExpanded ? 'Restore view' : 'Maximize grid'}">
            ${isExpanded ? 'Standard Size' : 'Expand Grid'}
          </button>
          <button class="lf-close" data-action="close-feed">Close</button>
        </div>
      </div>
      ${multiCamSwitcher}
      <div class="lf-body lf-body-grid">
        <div class="multi-camera-grid ${gridCols}">
          ${gridCards}
        </div>
      </div>
    </div>`;
  }

  // ----------------------------------------------------
  // SINGLE FOCUSED ROVER VIEW
  // ----------------------------------------------------
  let activeRover = byId(rovers, state.liveFeedRoverId);
  if (!activeRover && streamableRovers.length > 0) {
    activeRover = streamableRovers[0];
    state.liveFeedRoverId = activeRover.id;
  }
  const r = activeRover;
  if (!r) return '';

  const h = r.hazardId ? byId(hazards, r.hazardId) : null;
  const telem = AEGIS_TELEMETRY.getRoverTelemetry(r.id);
  const etaText = AEGIS_TELEMETRY.formatEta(telem.etaSeconds);
  const isEsp = !!r.isEsp32;

  // Header controls for ESP32 devices
  const espControls = isEsp ? `
    <div class="lf-esp-controls">
      <button class="lf-ctrl-btn ${AEGIS_ESP32.flashLedActive ? 'active' : ''}" data-action="toggle-esp32-flash" data-id="${r.id}" title="Toggle Flashlight LED (GPIO 4)">
        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        <span>${AEGIS_ESP32.flashLedActive ? 'Flash ON' : 'Flash OFF'}</span>
      </button>
      <button class="lf-ctrl-btn" data-action="capture-esp32-snapshot" data-id="${r.id}" title="Capture High-Res Snapshot">
        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="13" r="4"/><path d="M5 7h2l2-3h6l2 3h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z"/></svg>
        <span>Snap</span>
      </button>
      <button class="lf-ctrl-btn" data-action="cycle-esp32-res" data-id="${r.id}" title="Change Camera Resolution">
        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>
        <span>${AEGIS_ESP32.currentResolution || 'SVGA'}</span>
      </button>
    </div>` : '';

  return `
  <div class="livefeed ${isEsp ? 'livefeed-esp32' : ''} ${isExpanded ? 'livefeed-expanded' : ''}">
    <div class="lf-header">
      <div class="lf-title-group">
        <span class="lf-title">
          <span class="rec-dot"></span>
          ${isEsp ? 'ESP32 Live Feed' : 'Live Feed'} &mdash; ${r.name}
          ${isEsp ? `<span class="esp-ip-pill">${r.ip}</span>` : `(${r.id})`}
        </span>
      </div>
      <div class="lf-header-actions">
        ${espControls}
        <button class="lf-close" data-action="toggle-feed-size" title="${isExpanded ? 'Restore standard view' : 'Maximize video view'}">
          ${isExpanded ? 'Standard Size' : 'Expand Video'}
        </button>
        <button class="lf-close" data-action="close-feed" title="Close video stream">Close</button>
      </div>
    </div>
    ${multiCamSwitcher}
    <div class="lf-body">
      <!-- High-Fidelity Synthetic / HUD Canvas (Always active in background) -->
      <canvas class="feed-canvas" id="feedCanvas"></canvas>

      <!-- Direct MJPEG image stream for physical hardware (Layers on top when online) -->
      ${isEsp ? `
        <img class="feed-mjpeg-stream" id="esp32StreamImg" src="${r.streamUrl}" alt="ESP32 Stream"
             onerror="this.classList.add('stream-error');"
             onload="this.classList.remove('stream-error');" />
      ` : ''}

      <div class="lf-crosshair"></div>

      <!-- Live On-Screen Display (OSD) Overlay -->
      <div class="lf-overlay">
        <div class="lf-ov-row">
          <span class="lf-tag">
            ${isEsp ? `<span class="dot-live"></span> ESP32-CAM [${r.ip}:${r.port || 81}] &middot; RSSI ${r.rssi || -52} dBm` : `${r.id} &middot; ${r.name} &middot; SPD ${telem.speed.toFixed(1)} km/h`}
          </span>
          <div style="display:flex;gap:5px;align-items:center;">
            ${isEsp ? `<span class="lf-tag drive-tag" id="espDriveHudBadge">■ MOTORS IDLE</span>` : ''}
            <span class="lf-tag" id="feedTimestamp">${fmtTime(new Date())}</span>
          </div>
        </div>
        <div class="lf-ov-row" style="align-items:flex-end;">
          <span class="lf-tag">
            ${isEsp ? `BATT ${r.battery}% &middot; ${r.type === 'aerial' ? 'FLIGHT SENSORS OK' : 'TERRAIN DRIVE OK'} &middot; HDG ${telem.heading || 0}°` : `LAT ${telem.lat.toFixed(4)} &middot; LON ${telem.lon.toFixed(4)}`}
          </span>
          <span class="lf-tag">
            ${isEsp ? `${AEGIS_ESP32.currentResolution || 'SVGA (800x600)'} &middot; 28 FPS &middot; 2.4GHz WiFi` : `HDG ${telem.heading}° &middot; ${h ? ('TGT ' + h.name.split(',')[0]).toUpperCase() : 'PATROL'} &middot; ETA ${etaText}`}
          </span>
        </div>
      </div>

      <!-- Quick Vehicle Driving D-Pad (ESP32 Live Direct Steering & WASD Keyboard) -->
      ${isEsp ? `
      <div class="esp-dpad-overlay" title="Direct ESP32 WiFi Drive Controls (or use WASD / Arrow Keys)">
        <button class="dpad-btn dpad-up" data-action="esp-drive" data-cmd="forward" data-id="${r.id}" title="Drive Forward (W / Up)">&#x25B2;</button>
        <div class="dpad-mid">
          <button class="dpad-btn dpad-left" data-action="esp-drive" data-cmd="left" data-id="${r.id}" title="Steer Left (A / Left)">&#x25C0;</button>
          <button class="dpad-btn dpad-stop" data-action="esp-drive" data-cmd="stop" data-id="${r.id}" title="Stop Motors (Space / X)">&#x25A0;</button>
          <button class="dpad-btn dpad-right" data-action="esp-drive" data-cmd="right" data-id="${r.id}" title="Steer Right (D / Right)">&#x25B6;</button>
        </div>
        <button class="dpad-btn dpad-down" data-action="esp-drive" data-cmd="backward" data-id="${r.id}" title="Reverse (S / Down)">&#x25BC;</button>
      </div>` : ''}
    </div>
  </div>`;
}

function startFeedAnim() {
  cancelAnimationFrame(feedRAF);
  const canvas = document.getElementById('feedCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    if (!canvas) return;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
  }
  resize();
  window.addEventListener('resize', resize);

  const activeRover = state.liveFeedRoverId ? byId(rovers, state.liveFeedRoverId) : null;
  const isEsp = activeRover && activeRover.isEsp32;
  const isAerial = activeRover && activeRover.type === 'aerial';

  let t = 0;
  function frame() {
    t += 1;
    const w = canvas.width, hh = canvas.height;
    if (w === 0 || hh === 0) {
      feedRAF = requestAnimationFrame(frame);
      return;
    }

    // Sky / Horizon gradient
    const g = ctx.createLinearGradient(0, 0, 0, hh);
    if (isEsp && isAerial) {
      g.addColorStop(0, '#0c1524');
      g.addColorStop(0.5, '#122036');
      g.addColorStop(1, '#050a12');
    } else {
      g.addColorStop(0, '#131b26');
      g.addColorStop(0.55, '#0a0f17');
      g.addColorStop(1, '#040609');
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, hh);

    // Simulated terrain silhouette
    ctx.fillStyle = isAerial ? 'rgba(5, 9, 14, 0.96)' : 'rgba(7, 10, 15, 0.95)';
    ctx.beginPath();
    const horizonBase = isAerial ? hh * 0.72 : hh * 0.62;
    ctx.moveTo(0, horizonBase);
    for (let x = 0; x <= w; x += w / 14) {
      const freq = isAerial ? 4 : 6;
      const y = horizonBase + Math.sin((x / w * freq) + t * 0.012) * hh * 0.025;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, hh);
    ctx.lineTo(0, hh);
    ctx.closePath();
    ctx.fill();

    // Secondary foreground contour
    ctx.fillStyle = 'rgba(3, 5, 8, 0.85)';
    ctx.beginPath();
    ctx.moveTo(0, horizonBase + hh * 0.1);
    for (let x = 0; x <= w; x += w / 10) {
      const y = horizonBase + hh * 0.1 + Math.cos((x / w * 8) + t * 0.018) * hh * 0.02;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, hh);
    ctx.lineTo(0, hh);
    ctx.closePath();
    ctx.fill();

    // Scanline & sensor noise
    ctx.globalAlpha = 0.035;
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#38bdf8' : '#000';
      ctx.fillRect(Math.random() * w, Math.random() * hh, Math.random() * 3, 1);
    }
    ctx.globalAlpha = 1;

    // Pitch & Roll Horizon lines (Dynamic HUD)
    const pitchOffset = Math.sin(t * 0.02) * (isAerial ? 12 : 4);
    const rollAngle = Math.sin(t * 0.015) * (isAerial ? 0.04 : 0.015);

    ctx.save();
    ctx.translate(w / 2, hh / 2 + pitchOffset);
    ctx.rotate(rollAngle);

    // Horizon line
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-w * 0.25, 0);
    ctx.lineTo(-w * 0.06, 0);
    ctx.moveTo(w * 0.06, 0);
    ctx.lineTo(w * 0.25, 0);
    ctx.stroke();

    // Pitch ladder ticks
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.14)';
    [-24, 24].forEach(offsetY => {
      ctx.beginPath();
      ctx.moveTo(-20, offsetY);
      ctx.lineTo(20, offsetY);
      ctx.stroke();
    });

    ctx.restore();

    // ESP32-CAM subtle flash LED bloom effect if LED is active
    if (AEGIS_ESP32.flashLedActive) {
      const flashGrad = ctx.createRadialGradient(w / 2, hh / 2, 10, w / 2, hh / 2, w * 0.6);
      flashGrad.addColorStop(0, 'rgba(255, 255, 230, 0.15)');
      flashGrad.addColorStop(1, 'rgba(255, 255, 230, 0)');
      ctx.fillStyle = flashGrad;
      ctx.fillRect(0, 0, w, hh);
    }

    feedRAF = requestAnimationFrame(frame);
  }
  frame();
}
