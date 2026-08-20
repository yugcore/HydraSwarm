/* =========================================================
   HYDRA - TACTICAL GIS MAP WITH TARGET FOCUSING & VIEWBOX ZOOM
========================================================= */

// ViewBox animation state
let viewBoxAnimationId = null;
let currentViewBox = { x: 0, y: 0, w: 1000, h: 640 };

function resetMapViewBox() {
  if (viewBoxAnimationId) cancelAnimationFrame(viewBoxAnimationId);
  currentViewBox = { x: 0, y: 0, w: 1000, h: 640 };
  if (typeof HYDRA_MAP_INTERACTIONS !== 'undefined') {
    HYDRA_MAP_INTERACTIONS.applyViewBox();
  }
}

/* =========================================================
   HYDRA INTERACTIVE PAN & ZOOM ENGINE
========================================================= */
const HYDRA_MAP_INTERACTIONS = {
  isPanning: false,
  hasDragged: false,
  startMouse: { x: 0, y: 0 },
  startVb: { x: 0, y: 0 },
  touchStartDist: 0,
  touchStartW: 1000,
  initialized: false,

  init() {
    if (this.initialized) return;
    this.initialized = true;

    document.addEventListener('mousedown', (e) => this.onMouseDown(e));
    document.addEventListener('mousemove', (e) => this.onMouseMove(e));
    document.addEventListener('mouseup', (e) => this.onMouseUp(e));

    // Non-passive wheel listener on map-wrap container
    document.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    
    // Double click to zoom in
    document.addEventListener('dblclick', (e) => this.onDblClick(e));

    // Touch support
    document.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
    document.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    document.addEventListener('touchend', (e) => this.onTouchEnd(e));
  },

  onMouseDown(e) {
    const mapWrap = e.target.closest('.map-wrap');
    if (!mapWrap) return;
    // Don't initiate pan if clicked on toolbar, HUD, legend, controls, or button
    if (e.target.closest('.map-toolbar') || e.target.closest('.map-controls') || e.target.closest('.target-hud-overlay') || e.target.closest('.map-legend') || e.target.closest('button')) {
      return;
    }

    this.isPanning = true;
    this.hasDragged = false;
    this.startMouse = { x: e.clientX, y: e.clientY };
    this.startVb = { x: currentViewBox.x, y: currentViewBox.y };
    mapWrap.classList.add('panning');
  },

  onMouseMove(e) {
    if (!this.isPanning) return;
    const mapWrap = document.querySelector('.map-wrap');
    const svgEl = document.querySelector('.map-svg');
    if (!mapWrap || !svgEl) return;

    const dx = e.clientX - this.startMouse.x;
    const dy = e.clientY - this.startMouse.y;

    if (Math.hypot(dx, dy) > 5) {
      this.hasDragged = true;
    }

    const rect = mapWrap.getBoundingClientRect();
    const scaleX = currentViewBox.w / Math.max(1, rect.width);
    const scaleY = currentViewBox.h / Math.max(1, rect.height);

    currentViewBox.x = this.startVb.x - dx * scaleX;
    currentViewBox.y = this.startVb.y - dy * scaleY;

    // Boundaries check
    currentViewBox.x = Math.max(-600, Math.min(1600 - currentViewBox.w, currentViewBox.x));
    currentViewBox.y = Math.max(-400, Math.min(1040 - currentViewBox.h, currentViewBox.y));

    this.applyViewBox();
  },

  onMouseUp(e) {
    if (this.isPanning) {
      this.isPanning = false;
      const mapWrap = document.querySelector('.map-wrap');
      if (mapWrap) mapWrap.classList.remove('panning');
    }
  },

  onWheel(e) {
    const mapWrap = e.target.closest('.map-wrap');
    if (!mapWrap) return;
    // Only zoom if over map
    e.preventDefault();

    const rect = mapWrap.getBoundingClientRect();
    const mouseRelX = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)));
    const mouseRelY = Math.max(0, Math.min(1, (e.clientY - rect.top) / Math.max(1, rect.height)));

    const mouseSvgX = currentViewBox.x + mouseRelX * currentViewBox.w;
    const mouseSvgY = currentViewBox.y + mouseRelY * currentViewBox.h;

    // Smooth, gentle zoom sensitivity (4-6% step per scroll tick)
    const clampedDelta = Math.max(-50, Math.min(50, e.deltaY));
    const zoomFactor = clampedDelta < 0 ? 0.93 : 1.07;
    this.zoomAtPoint(mouseSvgX, mouseSvgY, mouseRelX, mouseRelY, zoomFactor);
  },

  onDblClick(e) {
    const mapWrap = e.target.closest('.map-wrap');
    if (!mapWrap || e.target.closest('button') || e.target.closest('.map-toolbar') || e.target.closest('.map-controls')) return;

    const rect = mapWrap.getBoundingClientRect();
    const mouseRelX = (e.clientX - rect.left) / Math.max(1, rect.width);
    const mouseRelY = (e.clientY - rect.top) / Math.max(1, rect.height);
    const mouseSvgX = currentViewBox.x + mouseRelX * currentViewBox.w;
    const mouseSvgY = currentViewBox.y + mouseRelY * currentViewBox.h;

    this.zoomAtPoint(mouseSvgX, mouseSvgY, mouseRelX, mouseRelY, 0.78);
  },

  zoomAtPoint(svgX, svgY, relX, relY, factor) {
    const newW = Math.max(160, Math.min(2200, currentViewBox.w * factor));
    const newH = newW * (640 / 1000);

    currentViewBox.x = svgX - relX * newW;
    currentViewBox.y = svgY - relY * newH;
    currentViewBox.w = newW;
    currentViewBox.h = newH;

    // Constrain boundaries
    currentViewBox.x = Math.max(-600, Math.min(1600 - currentViewBox.w, currentViewBox.x));
    currentViewBox.y = Math.max(-400, Math.min(1040 - currentViewBox.h, currentViewBox.y));

    this.applyViewBox();
  },

  zoomBy(factor) {
    const centerX = currentViewBox.x + currentViewBox.w / 2;
    const centerY = currentViewBox.y + currentViewBox.h / 2;
    this.zoomAtPoint(centerX, centerY, 0.5, 0.5, factor);
  },

  reset() {
    animateViewBoxTo({ x: 0, y: 0, w: 1000, h: 640 });
  },

  applyViewBox() {
    const svgEl = document.querySelector('.map-svg');
    if (svgEl) {
      svgEl.setAttribute('viewBox', `${currentViewBox.x.toFixed(1)} ${currentViewBox.y.toFixed(1)} ${currentViewBox.w.toFixed(1)} ${currentViewBox.h.toFixed(1)}`);
    }
    const zoomBadge = document.querySelector('.map-zoom-val');
    if (zoomBadge) {
      const zoomPct = Math.round((1000 / currentViewBox.w) * 100);
      zoomBadge.textContent = `${zoomPct}%`;
    }
  },

  onTouchStart(e) {
    const mapWrap = e.target.closest('.map-wrap');
    if (!mapWrap) return;

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      this.isPanning = true;
      this.hasDragged = false;
      this.startMouse = { x: touch.clientX, y: touch.clientY };
      this.startVb = { x: currentViewBox.x, y: currentViewBox.y };
    } else if (e.touches.length === 2) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      this.touchStartDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      this.touchStartW = currentViewBox.w;
    }
  },

  onTouchMove(e) {
    const mapWrap = document.querySelector('.map-wrap');
    if (!mapWrap) return;

    if (e.touches.length === 1 && this.isPanning) {
      const touch = e.touches[0];
      const dx = touch.clientX - this.startMouse.x;
      const dy = touch.clientY - this.startMouse.y;
      if (Math.hypot(dx, dy) > 5) this.hasDragged = true;

      const rect = mapWrap.getBoundingClientRect();
      const scaleX = currentViewBox.w / Math.max(1, rect.width);
      const scaleY = currentViewBox.h / Math.max(1, rect.height);

      currentViewBox.x = this.startVb.x - dx * scaleX;
      currentViewBox.y = this.startVb.y - dy * scaleY;
      this.applyViewBox();
    } else if (e.touches.length === 2 && this.touchStartDist > 0) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const factor = 1 + (this.touchStartDist - dist) * 0.0008;
      const centerX = (t1.clientX + t2.clientX) / 2;
      const centerY = (t1.clientY + t2.clientY) / 2;
      const rect = mapWrap.getBoundingClientRect();
      const relX = (centerX - rect.left) / Math.max(1, rect.width);
      const relY = (centerY - rect.top) / Math.max(1, rect.height);
      const svgX = currentViewBox.x + relX * currentViewBox.w;
      const svgY = currentViewBox.y + relY * currentViewBox.h;
      this.zoomAtPoint(svgX, svgY, relX, relY, factor);
    }
  },

  onTouchEnd(e) {
    if (e.touches.length < 2) this.touchStartDist = 0;
    if (e.touches.length === 0) this.isPanning = false;
  }
};

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
    if (telem) pts.push({ x: telem.x, y: telem.y });
    if (r.home) pts.push({ x: r.home.x, y: r.home.y });
  });

  const validPts = pts.filter(p => p && typeof p.x === 'number' && isFinite(p.x) && typeof p.y === 'number' && isFinite(p.y));
  if (validPts.length === 0) return { x: 0, y: 0, w: 1000, h: 640 };

  let minX = Math.min(...validPts.map(p => p.x));
  let maxX = Math.max(...validPts.map(p => p.x));
  let minY = Math.min(...validPts.map(p => p.y));
  let maxY = Math.max(...validPts.map(p => p.y));

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

/* ---------- SVG MAP RENDERING (TACTICAL GIS & HIGH-FIDELITY CARTOGRAPHY) ---------- */
function renderMapSvg() {
  const isTargetFocused = state.activeTargetId && state.activeTargetId !== 'ALL';
  const focusedHazardId = state.activeTargetId;
  const isLight = state.theme === 'light';
  const markerInnerFill = isLight ? '#ffffff' : '#121622';
  const roverFill = isLight ? '#ffffff' : '#1a2230';
  const roverStroke = isLight ? '#334155' : '#cbd5e1';

  const activeStation = (typeof getStationById === 'function') 
    ? getStationById(state.selectedStationId || currentStationId || 'guwahati')
    : HYDRA_STATIONS[0];

  const vb = currentViewBox;

  // Tactical Colors & Shading
  const mapBgStart = isLight ? '#f4f6f9' : '#0b0f17';
  const mapBgEnd = isLight ? '#e2e8f0' : '#05070a';
  
  const waterGradStart = isLight ? '#38bdf8' : '#0284c7';
  const waterGradEnd = isLight ? '#0284c7' : '#082f49';
  const waterStroke = isLight ? '#0284c7' : '#38bdf8';
  const waterShoreGlow = isLight ? 'rgba(56, 189, 248, 0.5)' : 'rgba(56, 189, 248, 0.25)';

  const gridMinor = isLight ? 'rgba(100, 116, 139, 0.12)' : 'rgba(56, 189, 248, 0.06)';
  const gridMajor = isLight ? 'rgba(100, 116, 139, 0.35)' : 'rgba(56, 189, 248, 0.22)';
  const rulerTextColor = isLight ? '#64748b' : 'rgba(148, 163, 184, 0.6)';

  const terrainStroke = isLight ? 'rgba(100, 116, 139, 0.32)' : 'rgba(148, 163, 184, 0.18)';
  const depotFill = isLight ? '#ffffff' : '#111726';
  const depotStroke = isLight ? '#0284c7' : '#38bdf8';
  const depotTextColor = isLight ? '#0f172a' : '#f8fafc';

  // 1. GIS Longitude / Latitude Coordinate Rulers
  const baseLat = activeStation.lat || 26.14;
  const baseLon = activeStation.lon || 91.73;

  const topRulers = [120, 260, 400, 540, 680, 820, 940].map(x => {
    const lonVal = (baseLon + (x - 500) * 0.0006).toFixed(3);
    return `
      <g transform="translate(${x}, 0)" opacity="0.65">
        <line x1="0" y1="0" x2="0" y2="7" stroke="${gridMajor}" stroke-width="1"/>
        <text x="3" y="10" font-size="7px" font-family="var(--mono)" fill="${rulerTextColor}">${lonVal}°E</text>
      </g>
    `;
  }).join('');

  const leftRulers = [80, 180, 290, 400, 510, 610].map(y => {
    const latVal = (baseLat + (320 - y) * 0.0006).toFixed(3);
    return `
      <g transform="translate(0, ${y})" opacity="0.65">
        <line x1="0" y1="0" x2="7" y2="0" stroke="${gridMajor}" stroke-width="1"/>
        <text x="9" y="3" font-size="7px" font-family="var(--mono)" fill="${rulerTextColor}">${latVal}°N</text>
      </g>
    `;
  }).join('');

  // 2. Tactical Radar Range Rings from Station HQ
  const primaryDepot = activeStation.depots?.[0] || { x: 160, y: 540, name: 'Command HQ' };
  const radarRangeRingsSvg = `
    <g class="radar-group" opacity="${isLight ? '0.5' : '0.4'}">
      <line x1="${primaryDepot.x - 380}" y1="${primaryDepot.y}" x2="${primaryDepot.x + 380}" y2="${primaryDepot.y}" stroke="${gridMajor}" stroke-width="0.8" stroke-dasharray="3 5"/>
      <line x1="${primaryDepot.x}" y1="${primaryDepot.y - 380}" x2="${primaryDepot.x}" y2="${primaryDepot.y + 380}" stroke="${gridMajor}" stroke-width="0.8" stroke-dasharray="3 5"/>
      
      <circle cx="${primaryDepot.x}" cy="${primaryDepot.y}" r="110" fill="none" stroke="${gridMajor}" stroke-width="0.8" stroke-dasharray="4 4"/>
      <text x="${primaryDepot.x + 114}" y="${primaryDepot.y - 3}" font-size="6.8px" font-family="var(--mono)" fill="${rulerTextColor}">5 KM RADAR</text>

      <circle cx="${primaryDepot.x}" cy="${primaryDepot.y}" r="220" fill="none" stroke="${gridMajor}" stroke-width="0.8" stroke-dasharray="4 4"/>
      <text x="${primaryDepot.x + 224}" y="${primaryDepot.y - 3}" font-size="6.8px" font-family="var(--mono)" fill="${rulerTextColor}">10 KM RADAR</text>

      <circle cx="${primaryDepot.x}" cy="${primaryDepot.y}" r="330" fill="none" stroke="${gridMajor}" stroke-width="0.8" stroke-dasharray="4 4"/>
      <text x="${primaryDepot.x + 334}" y="${primaryDepot.y - 3}" font-size="6.8px" font-family="var(--mono)" fill="${rulerTextColor}">15 KM RADAR</text>
    </g>
  `;

  // 3. Topographic Contours with Altitude Stamps
  const altitudes = ['+80m', '+160m', '+240m', '+360m', '+480m', '+650m', '+920m', '+1400m'];
  const terrainPathsSvg = (activeStation.mapFeatures?.terrainPaths || []).map((d, idx) => {
    return `
      <g class="terrain-group">
        <path class="terrain-line" stroke="${terrainStroke}" stroke-width="${idx % 2 === 0 ? '1.3' : '0.8'}" stroke-dasharray="${idx % 2 === 0 ? 'none' : '4 3'}" d="${d}"></path>
      </g>
    `;
  }).join('');

  // 4. Landmarks with Clean Cartographic Labels
  const landmarksSvg = (activeStation.mapFeatures?.landmarks || []).map(lm => {
    let iconSvg = `<circle r="3" fill="var(--accent-cyan)"/>`;
    if (lm.icon === 'hill' || lm.icon === 'peak' || lm.icon === 'slide') {
      iconSvg = `<polygon points="0,-5 4,3 -4,3" fill="var(--accent-amber)"/>`;
    } else if (lm.icon === 'water' || lm.icon === 'glacier') {
      iconSvg = `<circle r="3.5" fill="none" stroke="var(--accent-cyan)" stroke-width="1.4"/><circle r="1.5" fill="var(--accent-cyan)"/>`;
    } else if (lm.icon === 'bridge' || lm.icon === 'dam' || lm.icon === 'canal') {
      iconSvg = `<rect x="-3.5" y="-2.5" width="7" height="5" rx="1" fill="var(--accent-emerald)"/>`;
    } else if (lm.icon === 'port' || lm.icon === 'coast') {
      iconSvg = `<circle r="3" fill="var(--accent-blue)"/>`;
    }

    return `
      <g class="map-landmark" transform="translate(${lm.x},${lm.y})">
        ${iconSvg}
        <text x="8" y="3" class="marker-label" font-size="8px" font-weight="600" letter-spacing="0.4px">${lm.name.toUpperCase()}</text>
      </g>
    `;
  }).join('');

  // 5. Depots with Command Bunker Symbol
  const depotsSvg = (activeStation.depots || []).map((dp, idx) => `
    <g class="map-depot-marker" transform="translate(${dp.x},${dp.y})">
      <circle r="12" fill="none" stroke="var(--accent-cyan)" stroke-width="0.8" opacity="0.4" stroke-dasharray="3 3"/>
      <polygon points="0,-9 8,-4.5 8,4.5 0,9 -8,4.5 -8,-4.5" fill="${depotFill}" stroke="${depotStroke}" stroke-width="1.6"/>
      <circle r="2.8" fill="var(--accent-cyan)"/>
      <text x="14" y="3.5" class="marker-label" fill="${depotTextColor}" font-size="8.5px" font-weight="700" letter-spacing="0.4px">${(dp.name || 'HQ BASE').toUpperCase()}</text>
    </g>
  `).join('');

  // 6. Military Compass Rose (Top-Right)
  const compassRoseSvg = `
    <g class="compass-rose" transform="translate(940, 52)" opacity="${isLight ? '0.85' : '0.7'}">
      <circle r="22" fill="none" stroke="${gridMajor}" stroke-width="1.2" stroke-dasharray="2 3"/>
      <line x1="0" y1="-26" x2="0" y2="26" stroke="${gridMajor}" stroke-width="1"/>
      <line x1="-26" y1="0" x2="26" y2="0" stroke="${gridMajor}" stroke-width="1"/>
      <polygon points="0,-22 4,-5 0,-8 -4,-5" fill="var(--accent-rose)"/>
      <polygon points="0,22 4,5 0,8 -4,5" fill="${rulerTextColor}"/>
      <text x="0" y="-27" text-anchor="middle" font-size="8px" font-weight="800" font-family="var(--mono)" fill="var(--accent-rose)">N</text>
      <text x="31" y="2.5" text-anchor="start" font-size="7px" font-weight="700" font-family="var(--mono)" fill="${rulerTextColor}">E</text>
      <text x="0" y="34" text-anchor="middle" font-size="7px" font-weight="700" font-family="var(--mono)" fill="${rulerTextColor}">S</text>
      <text x="-31" y="2.5" text-anchor="end" font-size="7px" font-weight="700" font-family="var(--mono)" fill="${rulerTextColor}">W</text>
    </g>
  `;

  // 7. Tactical Scale Bar (Bottom-Left)
  const scaleBarSvg = `
    <g class="scale-bar" transform="translate(40, 615)" opacity="${isLight ? '0.85' : '0.7'}">
      <rect x="0" y="0" width="120" height="4" fill="none" stroke="${depotStroke}" stroke-width="1"/>
      <rect x="0" y="0" width="60" height="4" fill="${depotStroke}"/>
      <text x="0" y="-4" font-size="7px" font-family="var(--mono)" font-weight="700" fill="${rulerTextColor}">0</text>
      <text x="60" y="-4" text-anchor="middle" font-size="7px" font-family="var(--mono)" font-weight="700" fill="${rulerTextColor}">2.5 KM</text>
      <text x="120" y="-4" text-anchor="end" font-size="7px" font-family="var(--mono)" font-weight="700" fill="${rulerTextColor}">5.0 KM</text>
      <text x="135" y="4" font-size="7px" font-family="var(--mono)" font-weight="600" fill="${rulerTextColor}">[SCALE 1:50,000 // WGS-84 GIS]</text>
    </g>
  `;

  // 8. Hazard Markers with Clean Text Labels
  const hazardMarkers = hazards.map(h => {
    const isSelected = state.selectedHazardId === h.id;
    const isTarget = isTargetFocused && focusedHazardId === h.id;
    const isDimmed = isTargetFocused && !isTarget;
    const sevColor = h.severity === 'severe' ? '#f43f5e' : h.severity === 'moderate' ? '#f59e0b' : '#0ea5e9';

    return `
    <g class="marker marker-hazard ${isDimmed ? 'dimmed' : ''}" style="${isDimmed ? 'opacity:0.2;' : ''}" data-action="select-hazard" data-id="${h.id}" transform="translate(${h.x},${h.y})">
      <circle class="pulse" r="${isTarget ? 15 : 10}" fill="${sevColor}"></circle>
      <circle r="${isTarget ? 10 : 8}" fill="${markerInnerFill}" stroke="${sevColor}" stroke-width="${isTarget ? 3.2 : isSelected ? 2.8 : 2.0}"></circle>
      <g transform="translate(-5,-5) scale(0.46)" stroke="${sevColor}" fill="none" stroke-width="1.9">${hazardIcons[h.type] || ''}</g>
      ${!isDimmed ? `
        <text class="marker-label" x="${isTarget ? 16 : 13}" y="3.5" font-size="9px" font-weight="${isTarget ? '700' : '600'}">${h.name.split(' — ')[0].split(',')[0]}</text>
      ` : ''}
      ${isTarget ? `<circle r="38" fill="none" stroke="var(--accent-amber)" stroke-width="1.2" stroke-dasharray="4 4" opacity="0.85"/>` : ''}
    </g>`;
  }).join('');

  const isLive = state.mode === 'live';
  const activeFleet = isLive ? rovers.filter(r => r.isEsp32) : rovers;

  // 9. Laser Trajectory Routes with Multi-Layer Glow
  const routes = activeFleet.filter(r => r.hazardId).map(r => {
    const h = byId(hazards, r.hazardId);
    if (!h) return '';
    const telem = HYDRA_TELEMETRY.getRoverTelemetry(r.id);
    const isTarget = isTargetFocused && focusedHazardId === r.hazardId;
    const isDimmed = isTargetFocused && !isTarget;
    const home = r.home || { x: 180, y: 520 };
    const p1 = HYDRA_TELEMETRY.getControlPoint(home, h);

    return `
    <g class="route-group" style="${isDimmed ? 'opacity:0.15;' : ''}">
      <path d="M ${home.x} ${home.y} Q ${p1.x} ${p1.y} ${telem.x} ${telem.y}" fill="none" stroke="var(--accent-cyan)" stroke-width="5" opacity="0.18"></path>
      <path d="M ${home.x} ${home.y} Q ${p1.x} ${p1.y} ${telem.x} ${telem.y}" fill="none" stroke="var(--accent-cyan)" stroke-width="${isTarget ? 2.6 : 1.8}" opacity="0.95"></path>
      <path class="route-path ${isTarget ? 'highlighted' : ''}" d="M ${telem.x} ${telem.y} Q ${p1.x} ${p1.y} ${h.x} ${h.y}" stroke="${isTarget ? 'var(--accent-amber)' : 'rgba(56, 189, 248, 0.75)'}"></path>
    </g>`;
  }).join('');

  // 10. Rover markers
  const roverMarkers = activeFleet.map(r => {
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
          <rect x="-6" y="-7" width="12" height="14" rx="2.5" fill="${roverFill}" stroke="${roverStroke}" stroke-width="1.4"></rect>
          <line x1="0" y1="-7" x2="0" y2="-12" stroke="#f59e0b" stroke-width="1.8" stroke-linecap="round"/>
         </g>`
      : `<g transform="rotate(${heading})">
          <polygon points="0,-9 6,6 0,2 -6,6" fill="${roverFill}" stroke="${roverStroke}" stroke-width="1.4"></polygon>
          <line x1="0" y1="-9" x2="0" y2="-14" stroke="#0ea5e9" stroke-width="1.8" stroke-linecap="round"/>
         </g>`;

    const isEsp = !!r.isEsp32;

    return `
    <g class="marker rover-marker-${r.type} ${isSelected ? 'selected' : ''} ${isDeployed ? 'deployed' : ''} ${isEsp ? 'rover-esp32' : ''}" style="${isDimmed ? 'opacity:0.2;' : ''}" data-action="select-rover" data-id="${r.id}" transform="translate(${posX},${posY})">
      ${isEsp ? `<circle r="13" fill="none" stroke="var(--accent-cyan)" stroke-width="0.8" stroke-dasharray="2 2" opacity="0.65"/>` : ''}
      ${shape}
      <text class="marker-label" x="12" y="3.5">${r.name}${isEsp ? ' [WiFi]' : ''}</text>
      ${isDeployed ? `<text class="marker-label" x="12" y="13" font-size="8px" fill="var(--accent-cyan)">${telem.speed.toFixed(0)} km/h</text>` : (isEsp ? `<text class="marker-label" x="12" y="13" font-size="7.5px" fill="var(--accent-emerald)">${r.ip}</text>` : '')}
    </g>`;
  }).join('');

  return `
  <svg class="map-svg" viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Operations map">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${mapBgStart}"/>
        <stop offset="100%" stop-color="${mapBgEnd}"/>
      </linearGradient>
      <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${waterGradStart}" stop-opacity="${isLight ? '0.35' : '0.45'}"/>
        <stop offset="100%" stop-color="${waterGradEnd}" stop-opacity="${isLight ? '0.2' : '0.3'}"/>
      </linearGradient>
      <radialGradient id="hazardGlowSevere" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#f43f5e" stop-opacity="0.35"/>
        <stop offset="60%" stop-color="#f43f5e" stop-opacity="0.10"/>
        <stop offset="100%" stop-color="#f43f5e" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="hazardGlowModerate" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.35"/>
        <stop offset="60%" stop-color="#f59e0b" stop-opacity="0.10"/>
        <stop offset="100%" stop-color="#f59e0b" stop-opacity="0"/>
      </radialGradient>
      <pattern id="gisMinorGrid" width="60" height="60" patternUnits="userSpaceOnUse">
        <path d="M 60 0 L 0 0 0 60" fill="none" stroke="${gridMinor}" stroke-width="0.7" stroke-dasharray="2 3"/>
        <path d="M 0 -2.5 L 0 2.5 M -2.5 0 L 2.5 0" stroke="${gridMajor}" stroke-width="0.8"/>
      </pattern>
    </defs>

    <!-- 1. Background -->
    <rect x="0" y="0" width="1000" height="640" fill="url(#bgGrad)"></rect>

    <!-- 2. Tactical GIS Grid -->
    <rect x="0" y="0" width="1000" height="640" fill="url(#gisMinorGrid)"></rect>

    <!-- 3. Dynamic Coastline or River Channel with Water Glow -->
    <path class="coast-fill" fill="url(#waterGrad)" stroke="${waterStroke}" stroke-width="1.8" d="${activeStation.mapFeatures?.coastOrRiverD || 'M0,0 L1000,0 L1000,470 Z'}"></path>
    <path fill="none" stroke="${waterShoreGlow}" stroke-width="3.5" opacity="0.35" d="${activeStation.mapFeatures?.coastOrRiverD || 'M0,0 L1000,0 L1000,470 Z'}"></path>

    <!-- 4. Station Water Body Banner -->
    <text x="30" y="32" class="marker-label" font-size="9.5px" font-weight="700" font-family="var(--mono)" fill="var(--accent-cyan)" letter-spacing="1px" opacity="0.75">${(activeStation.mapFeatures?.riverName || activeStation.region).toUpperCase()}</text>

    <!-- 5. Dynamic contour lines with Altitude Stamps -->
    ${terrainPathsSvg}

    <!-- 6. Radar Range Rings from Base -->
    ${radarRangeRingsSvg}

    <!-- 7. Dynamic landmarks -->
    ${landmarksSvg}

    <!-- 8. Dynamic depot markers -->
    ${depotsSvg}

    <!-- 9. Compass Rose & Scale Bar -->
    ${compassRoseSvg}
    ${scaleBarSvg}

    <!-- 10. GIS Coordinate Rulers -->
    ${topRulers}
    ${leftRulers}

    <!-- 11. Routes, Hazards, and Rovers -->
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
  const isEsp = !!r.isEsp32;

  return `
  <div class="rover-info-panel show" id="roverInfoPanel">
    <div class="rip-head">
      <b>${r.name} <span style="color:var(--text-3);font-weight:400;font-size:10.5px;">${r.id} &middot; ${r.type.toUpperCase()}${isEsp ? ' (WiFi)' : ''}</span></b>
      <button class="rip-close" data-action="deselect-rover" aria-label="Close">&times;</button>
    </div>
    <div class="rip-grid">
      <div class="detail-field"><label>Status</label><span style="color:var(--accent-${isDeployed ? 'cyan' : 'emerald'});">${r.status}</span></div>
      <div class="detail-field"><label>Destination</label><span>${h ? h.name.split(',')[0] : '—'}</span></div>
      <div class="detail-field"><label>ETA</label><span style="color:var(--accent-amber);">${etaStr}</span></div>
      <div class="detail-field"><label>Battery</label><span>${r.battery}%</span></div>
      <div class="detail-field"><label>Live Speed</label><span>${isDeployed ? `${telem.speed.toFixed(1)} km/h` : '0 km/h'}</span></div>
      <div class="detail-field"><label>${isEsp ? 'WiFi IP & RSSI' : 'Heading / Link'}</label><span>${isEsp ? `${r.ip} (${r.rssi || -52}dBm)` : `${isDeployed ? `${telem.heading}°` : '—'} &middot; ${r.connection.toUpperCase()}`}</span></div>
    </div>
    <div style="display:flex;gap:6px;margin-top:6px;">
      <button class="mini-btn ${state.liveFeedRoverId === r.id ? 'feed-on' : ''}" style="flex:1;" data-action="toggle-feed" data-id="${r.id}">
        ${state.liveFeedRoverId === r.id ? 'Feed Active' : 'Show Live Feed'}
      </button>
      ${isEsp ? `
        <button class="mini-btn mini-btn-danger" data-action="disconnect-esp32" data-id="${r.id}" title="Disconnect ESP32">
          Disconnect
        </button>` : ''}
    </div>
  </div>`;
}

/* ---------- ROOT MAP CONTAINER ---------- */
function renderMap() {
  const isLive = state.mode === 'live';
  const activeStation = (typeof getStationById === 'function')
    ? getStationById(state.selectedStationId || currentStationId || 'guwahati')
    : HYDRA_STATIONS[0];
  const chipLabel = isLive 
    ? `Live Disaster Feeds &middot; ${activeStation.state}` 
    : `${activeStation.shortName} &middot; ${activeStation.region}`;

  const zoomPct = Math.round((1000 / Math.max(1, currentViewBox.w)) * 100);

  return `
  <div class="map-wrap">
    <div class="map-toolbar">
      <div class="map-chip"><span class="stat-dot ok"></span>${chipLabel}</div>
      ${renderMapViewSelector()}
    </div>
    <div class="map-controls">
      <button class="map-ctrl-btn" data-action="map-zoom-in" title="Zoom In (+)">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
      <span class="map-zoom-val">${zoomPct}%</span>
      <button class="map-ctrl-btn" data-action="map-zoom-out" title="Zoom Out (−)">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
      <button class="map-ctrl-btn" data-action="map-reset-zoom" title="Reset View (Center)">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
      </button>
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
