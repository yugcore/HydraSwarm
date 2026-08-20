/* =========================================================
   HYDRA - TACTICAL GIS MAP WITH TARGET FOCUSING & VIEWBOX ZOOM
========================================================= */

// ViewBox animation state
let viewBoxAnimationId = null;
let currentViewBox = { x: 0, y: 0, w: 1000, h: 640 };

function getActiveTargets() {
  const deployedHazardIds = new Set();
  rovers.forEach(r => {
    if ((r.status === 'Deployed' || r.status === 'On Site') && r.hazardId) {
      deployedHazardIds.add(r.hazardId);
    }
  });

  return Array.from(deployedHazardIds).map(id => byId(hazards, id)).filter(Boolean);
}

/* ---------- TARGET BOUNDING BOX & VIEWBOX CALCULATOR ---------- */
function getTargetEnvelope(hazardId) {
  if (!hazardId || hazardId === 'ALL') {
    return { x: 0, y: 0, w: 1000, h: 640 };
  }

  const h = byId(hazards, hazardId);
  if (!h) return { x: 0, y: 0, w: 1000, h: 640 };

  const assignedRovers = rovers.filter(r => r.hazardId === hazardId);
  const pts = [{ x: h.x, y: h.y }];

  assignedRovers.forEach(r => {
    const telem = HYDRA_TELEMETRY.getRoverTelemetry(r.id);
    pts.push({ x: telem.x, y: telem.y });
    if (r.home) pts.push({ x: r.home.x, y: r.home.y });
  });

  let minX = Math.min(...pts.map(p => p.x));
  let maxX = Math.max(...pts.map(p => p.x));
  let minY = Math.min(...pts.map(p => p.y));
  let maxY = Math.max(...pts.map(p => p.y));

  // Add comfortable tactical padding
  const padX = 75;
  const padY = 65;
  minX = Math.max(0, minX - padX);
  maxX = Math.min(1000, maxX + padX);
  minY = Math.max(0, minY - padY);
  maxY = Math.min(640, maxY + padY);

  let w = Math.max(280, maxX - minX);
  let h_box = Math.max(180, maxY - minY);

  // Maintain 1000:640 aspect ratio
  const targetAspect = 1000 / 640;
  const currentAspect = w / h_box;

  if (currentAspect < targetAspect) {
    const newW = h_box * targetAspect;
    minX = Math.max(0, minX - (newW - w) / 2);
    w = newW;
  } else {
    const newH = w / targetAspect;
    minY = Math.max(0, minY - (newH - h_box) / 2);
    h_box = newH;
  }

  return {
    x: Math.round(Math.max(0, Math.min(1000 - w, minX))),
    y: Math.round(Math.max(0, Math.min(640 - h_box, minY))),
    w: Math.round(w),
    h: Math.round(h_box)
  };
}

/* ---------- SMOOTH VIEWBOX TRANSITION ENGINE ---------- */
function animateViewBoxTo(target) {
  cancelAnimationFrame(viewBoxAnimationId);
  const start = { ...currentViewBox };
  const startTime = performance.now();
  const duration = 480; // ms

  function easeOutCubic(x) {
    return 1 - Math.pow(1 - x, 3);
  }

  function frame(now) {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);
    const ease = easeOutCubic(progress);

    currentViewBox.x = start.x + (target.x - start.x) * ease;
    currentViewBox.y = start.y + (target.y - start.y) * ease;
    currentViewBox.w = start.w + (target.w - start.w) * ease;
    currentViewBox.h = start.h + (target.h - start.h) * ease;

    const svg = document.querySelector('.map-svg');
    if (svg) {
      svg.setAttribute('viewBox', `${currentViewBox.x.toFixed(1)} ${currentViewBox.y.toFixed(1)} ${currentViewBox.w.toFixed(1)} ${currentViewBox.h.toFixed(1)}`);
    }

    if (progress < 1) {
      viewBoxAnimationId = requestAnimationFrame(frame);
    }
  }

  viewBoxAnimationId = requestAnimationFrame(frame);
}

/* ---------- MAP VIEW SELECTOR BAR ---------- */
function renderMapViewSelector() {
  const activeTargets = getActiveTargets();
  const currentMode = state.activeTargetId || 'ALL';

  if (activeTargets.length === 0) {
    return `
    <div class="map-view-selector">
      <button class="map-view-btn active" data-action="set-map-view" data-target="ALL">
        <span class="target-dot"></span>ALL OPERATIONS
      </button>
    </div>`;
  }

  const allBtn = `
    <button class="map-view-btn ${currentMode === 'ALL' ? 'active' : ''}" data-action="set-map-view" data-target="ALL">
      <span class="target-dot"></span>ALL
    </button>`;

  const targetBtns = activeTargets.map((h, idx) => {
    const isFocused = currentMode === h.id;
    const assignedCount = rovers.filter(r => r.hazardId === h.id).length;
    const label = activeTargets.length === 1 ? `TARGET: ${h.name.split(' — ')[0].split(',')[0]}` : `TARGET ${idx + 1}: ${h.name.split(' — ')[0].split(',')[0]}`;
    return `
    <button class="map-view-btn target-btn ${isFocused ? 'active' : ''}" data-action="set-map-view" data-target="${h.id}">
      <span class="target-dot"></span>${label}
      <span class="rover-cnt">${assignedCount} unit${assignedCount > 1 ? 's' : ''}</span>
    </button>`;
  }).join('');

  return `<div class="map-view-selector">${allBtn}${targetBtns}</div>`;
}

/* ---------- TARGET TELEMETRY HUD OVERLAY ---------- */
function renderTargetHudOverlay() {
  if (!state.activeTargetId || state.activeTargetId === 'ALL') return '';

  const h = byId(hazards, state.activeTargetId);
  if (!h) return '';

  const assignedRovers = rovers.filter(r => r.hazardId === h.id);
  if (assignedRovers.length === 0) return '';

  // Get leader rover telemetry
  const primaryRover = assignedRovers[0];
  const telem = HYDRA_TELEMETRY.getRoverTelemetry(primaryRover.id);
  const etaText = HYDRA_TELEMETRY.formatEta(telem.etaSeconds);
  const progressPct = Math.round(telem.t * 100);

  return `
  <div class="target-hud-overlay">
    <div class="target-hud-header">
      <div class="target-hud-title" title="${h.name}">${h.name.split(',')[0]}</div>
      <div class="target-hud-sub">
        <span class="target-hud-badge ${h.severity}">${h.type} &middot; ${h.severity.toUpperCase()}</span>
        ${h.source ? `<span class="target-hud-source">${h.source}</span>` : ''}
      </div>
    </div>
    <div class="target-hud-grid">
      <div class="target-hud-item">
        <span class="target-hud-label">Assigned Units</span>
        <span class="target-hud-val">${assignedRovers.map(r => r.name).join(', ')}</span>
      </div>
      <div class="target-hud-item">
        <span class="target-hud-label">Primary ETA</span>
        <span class="target-hud-val" style="color:var(--accent-amber);">${etaText}</span>
      </div>
      <div class="target-hud-item">
        <span class="target-hud-label">Speed / Avg</span>
        <span class="target-hud-val">${telem.speed.toFixed(1)} / ${telem.avgSpeed.toFixed(1)} km/h</span>
      </div>
      <div class="target-hud-item">
        <span class="target-hud-label">Remaining Dist</span>
        <span class="target-hud-val">${telem.remainingDistance.toFixed(1)} / ${telem.totalDistance.toFixed(1)} km</span>
      </div>
    </div>
    <div class="target-hud-progress">
      <div class="target-hud-progress-fill" style="width:${progressPct}%"></div>
    </div>
  </div>`;
}

/* ---------- SVG MAP RENDERING ---------- */
function renderMapSvg() {
  const isTargetFocused = state.activeTargetId && state.activeTargetId !== 'ALL';
  const focusedHazardId = state.activeTargetId;

  // Hazard markers
  const hazardMarkers = hazards.map(h => {
    const isSelected = state.selectedHazardId === h.id;
    const isTarget = isTargetFocused && focusedHazardId === h.id;
    const isDimmed = isTargetFocused && !isTarget;

    return `
    <g class="marker marker-hazard ${isDimmed ? 'dimmed' : ''}" style="${isDimmed ? 'opacity:0.2;' : ''}" data-action="select-hazard" data-id="${h.id}" transform="translate(${h.x},${h.y})">
      <circle class="pulse" r="${isTarget ? 14 : 9}" fill="var(--accent-${h.severity === 'severe' ? 'red' : h.severity === 'moderate' ? 'amber' : 'teal'})"></circle>
      <circle r="${isTarget ? 9 : 7}" fill="var(--bg-1)" stroke="var(--accent-${h.severity === 'severe' ? 'red' : h.severity === 'moderate' ? 'amber' : 'teal'})" stroke-width="${isTarget ? 3.0 : isSelected ? 2.6 : 1.6}"></circle>
      <g transform="translate(-4.5,-4.5) scale(0.42)" stroke="var(--accent-${h.severity === 'severe' ? 'red' : h.severity === 'moderate' ? 'amber' : 'teal'})" fill="none" stroke-width="1.8">${hazardIcons[h.type] || ''}</g>
      ${!isDimmed ? `<text class="marker-label" x="${isTarget ? 14 : 11}" y="3.5" font-weight="${isTarget ? '700' : '400'}">${h.name.split(' — ')[0].split(',')[0]}</text>` : ''}
      ${isTarget ? `<circle r="36" fill="none" stroke="var(--accent-amber)" stroke-width="0.8" stroke-dasharray="3 3" opacity="0.6"/>` : ''}
    </g>`;
  }).join('');

  // Route paths
  const routes = rovers.filter(r => r.hazardId).map(r => {
    const h = byId(hazards, r.hazardId);
    if (!h) return '';
    const telem = HYDRA_TELEMETRY.getRoverTelemetry(r.id);
    const isTarget = isTargetFocused && focusedHazardId === r.hazardId;
    const isDimmed = isTargetFocused && !isTarget;
    const home = r.home || { x: 180, y: 520 };
    const p1 = HYDRA_TELEMETRY.getControlPoint(home, h);

    return `
    <g class="route-group" style="${isDimmed ? 'opacity:0.2;' : ''}">
      <!-- Traveled path (solid teal/blue) -->
      <path d="M ${home.x} ${home.y} Q ${p1.x} ${p1.y} ${telem.x} ${telem.y}" fill="none" stroke="var(--accent-teal)" stroke-width="${isTarget ? 2.4 : 1.8}" opacity="0.9"></path>
      <!-- Remaining route (dashed animated) -->
      <path class="route-path ${isTarget ? 'highlighted' : ''}" d="M ${telem.x} ${telem.y} Q ${p1.x} ${p1.y} ${h.x} ${h.y}" stroke="${isTarget ? 'var(--accent-amber)' : 'var(--accent-blue)'}"></path>
    </g>`;
  }).join('');

  // Rover markers with real-time positions & heading orientation
  const roverMarkers = rovers.map(r => {
    const telem = HYDRA_TELEMETRY.getRoverTelemetry(r.id);
    const isSelected = state.selectedRoverId === r.id;
    const isDeployed = r.status === 'Deployed' || r.status === 'On Site';
    const isTarget = isTargetFocused && focusedHazardId === r.hazardId;
    const isDimmed = isTargetFocused && !isTarget && !isSelected;

    const posX = isDeployed ? telem.x : r.x;
    const posY = isDeployed ? telem.y : r.y;
    const heading = telem.heading || 0;

    const shape = r.type === 'ground'
      ? `<g transform="rotate(${heading})">
          <rect x="-6" y="-7" width="12" height="14" rx="2.5"></rect>
          <line x1="0" y1="-7" x2="0" y2="-12" stroke="var(--accent-amber)" stroke-width="1.5" stroke-linecap="round"/>
         </g>`
      : `<g transform="rotate(${heading})">
          <polygon points="0,-9 6,6 0,2 -6,6"></polygon>
          <line x1="0" y1="-9" x2="0" y2="-14" stroke="var(--accent-teal)" stroke-width="1.5" stroke-linecap="round"/>
         </g>`;

    return `
    <g class="marker rover-marker-${r.type} ${isSelected ? 'selected' : ''} ${isDeployed ? 'deployed' : ''}" style="${isDimmed ? 'opacity:0.25;' : ''}" data-action="select-rover" data-id="${r.id}" transform="translate(${posX},${posY})">
      ${shape}
      <text class="marker-label" x="12" y="3.5">${r.name}</text>
      ${isDeployed ? `<text class="marker-label" x="12" y="12" font-size="7.5px" fill="var(--accent-teal)">${telem.speed.toFixed(0)} km/h</text>` : ''}
    </g>`;
  }).join('');

  const vb = currentViewBox;

  return `
  <svg class="map-svg" viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Operations map">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#12161a"/>
        <stop offset="100%" stop-color="#0c0f12"/>
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="1000" height="640" fill="url(#bgGrad)"></rect>
    <!-- coastline -->
    <path class="coast-fill" d="M0,0 L1000,0 L1000,470 C900,440 860,500 800,470 C740,440 700,480 640,460 C560,430 520,470 460,440 C380,400 340,430 260,400 C160,360 100,400 0,370 Z"></path>
    <!-- contour lines -->
    <path class="terrain-line" d="M60,80 C220,40 380,120 520,70 C660,20 800,90 960,60"></path>
    <path class="terrain-line" d="M40,150 C200,110 360,190 520,140 C680,90 820,160 980,130"></path>
    <path class="terrain-line" d="M20,220 C200,180 380,260 560,210 C720,170 860,230 990,200"></path>
    <path class="terrain-line" d="M10,290 C220,250 400,330 600,280 C760,240 880,300 990,270"></path>
    <path class="terrain-line" d="M470,60 C480,140 440,220 470,300 C500,380 460,440 480,520"></path>
    <path class="terrain-line" d="M600,40 C610,140 570,240 600,320"></path>
    <path class="terrain-line" d="M0,480 C120,460 200,510 320,490 C440,470 520,510 640,495 C760,480 880,510 1000,490" opacity="0.6"></path>
    <path class="terrain-line" d="M0,540 C140,520 260,560 400,545 C540,530 660,560 800,548 C880,542 940,555 1000,548" opacity="0.5"></path>
    <!-- depot markers -->
    <g opacity="0.65">
      <rect x="80" y="580" width="16" height="16" rx="2" fill="none" stroke="var(--text-low)" stroke-width="1.2"></rect>
      <text x="100" y="591" class="marker-label" fill="var(--text-low)">WEST DEPOT (HQ)</text>
      <rect x="200" y="545" width="16" height="16" rx="2" fill="none" stroke="var(--text-low)" stroke-width="1.2"></rect>
      <text x="220" y="556" class="marker-label" fill="var(--text-low)">EAST DEPOT</text>
    </g>
    ${routes}
    ${hazardMarkers}
    ${roverMarkers}
  </svg>`;
}

/* ---------- ROVER INFO POPUP ---------- */
function renderRoverInfoPanel() {
  const r = state.selectedRoverId ? byId(rovers, state.selectedRoverId) : null;
  if (!r) return `<div class="rover-info-panel" id="roverInfoPanel"></div>`;
  
  const telem = HYDRA_TELEMETRY.getRoverTelemetry(r.id);
  const h = r.hazardId ? byId(hazards, r.hazardId) : null;
  const isDeployed = r.status === 'Deployed' || r.status === 'On Site';
  const etaStr = isDeployed ? HYDRA_TELEMETRY.formatEta(telem.etaSeconds) : '—';

  return `
  <div class="rover-info-panel show" id="roverInfoPanel">
    <div class="rip-head">
      <b>${r.name} <span style="color:var(--text-low);font-weight:400;font-size:11px;">${r.id} &middot; ${r.type.toUpperCase()}</span></b>
      <button class="rip-close" data-action="deselect-rover" aria-label="Close">&times;</button>
    </div>
    <div class="rip-grid">
      <div class="detail-field"><label>Status</label><span style="color:var(--accent-${isDeployed ? 'teal' : 'mid'});">${r.status}</span></div>
      <div class="detail-field"><label>Destination</label><span>${h ? h.name.split(',')[0] : '—'}</span></div>
      <div class="detail-field"><label>ETA</label><span style="color:var(--accent-amber);">${etaStr}</span></div>
      <div class="detail-field"><label>Battery</label><span>${r.battery}%</span></div>
      <div class="detail-field"><label>Live Speed</label><span>${isDeployed ? `${telem.speed.toFixed(1)} km/h` : '0 km/h'}</span></div>
      <div class="detail-field"><label>Heading / Link</label><span>${isDeployed ? `${telem.heading}°` : '—'} &middot; ${r.connection.toUpperCase()}</span></div>
    </div>
    ${isDeployed ? `<button class="mini-btn ${state.liveFeedRoverId === r.id ? 'feed-on' : ''}" style="width:100%;" data-action="toggle-feed" data-id="${r.id}">${state.liveFeedRoverId === r.id ? 'Feed Active' : 'Show Live Feed'}</button>` : ``}
  </div>`;
}

/* ---------- ROOT MAP CONTAINER ---------- */
function renderMap() {
  const isLive = state.mode === 'live';
  const chipLabel = isLive ? 'Live Global Satellite & Seismic Feeds' : 'Sim Region &middot; Coastal &amp; Mountain Basin';

  return `
  <div class="map-wrap">
    <div class="map-toolbar">
      <div class="map-chip"><span class="stat-dot ok"></span>${chipLabel}</div>
      ${renderMapViewSelector()}
    </div>
    ${renderTargetHudOverlay()}
    ${renderMapSvg()}
    ${renderRoverInfoPanel()}
    <div class="map-legend">
      <div class="lg-row"><span class="lg-swatch" style="background:var(--accent-red);"></span>Severe hazard</div>
      <div class="lg-row"><span class="lg-swatch" style="background:var(--accent-amber);"></span>Moderate hazard</div>
      <div class="lg-row"><span class="lg-swatch" style="background:var(--accent-teal);"></span>Low / advisory</div>
      <div class="lg-row"><span class="lg-swatch" style="background:var(--accent-blue);border-radius:2px;"></span>Deployment route</div>
    </div>
  </div>`;
}
