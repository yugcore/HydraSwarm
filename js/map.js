/* =========================================================
   AEGIS - TACTICAL GIS MAP WITH TARGET FOCUSING & VIEWBOX ZOOM
========================================================= */

// ViewBox animation state
let viewBoxAnimationId = null;
let currentViewBox = { x: 0, y: 0, w: 1000, h: 640 };

function resetMapViewBox() {
  if (viewBoxAnimationId) cancelAnimationFrame(viewBoxAnimationId);
  currentViewBox = { x: 0, y: 0, w: 1000, h: 640 };
  if (typeof AEGIS_MAP_INTERACTIONS !== 'undefined') {
    AEGIS_MAP_INTERACTIONS.applyViewBox();
  }
}

/* =========================================================
   AEGIS INTERACTIVE PAN & ZOOM ENGINE
========================================================= */
const AEGIS_MAP_INTERACTIONS = {
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
  const targets = [];
  const deployedHazardIds = new Set();

  if (typeof rovers !== 'undefined') {
    rovers.forEach(r => {
      if ((r.status === 'Deployed' || r.status === 'On Site') && r.hazardId) {
        deployedHazardIds.add(r.hazardId);
      }
    });
  }

  deployedHazardIds.forEach(id => {
    const h = byId(hazards, id);
    if (h) targets.push({ ...h, targetType: 'hazard' });
  });

  // Also include active heavy airdrop missions
  if (typeof activeDropTargets !== 'undefined') {
    activeDropTargets.forEach(dt => {
      if (dt.status === 'enroute' || dt.status === 'delivered') {
        targets.push({
          id: dt.id,
          name: `${dt.payloadName || 'Medikit Drop'} — ${dt.label}`,
          type: 'Airdrop Supply',
          severity: 'reinforcement',
          x: dt.x,
          y: dt.y,
          status: dt.status === 'delivered' ? 'Delivered' : 'En Route',
          roverId: dt.roverId,
          targetType: 'drop'
        });
      }
    });
  }

  return targets;
}

/* ---------- TARGET BOUNDING BOX & VIEWBOX CALCULATOR ---------- */
function getTargetEnvelope(targetId) {
  if (!targetId || targetId === 'ALL') {
    return { x: 0, y: 0, w: 1000, h: 640 };
  }

  // Check if target is an Airdrop Target
  if (typeof targetId === 'string' && targetId.startsWith('DROP-')) {
    const dt = (typeof activeDropTargets !== 'undefined') ? activeDropTargets.find(d => d.id === targetId) : null;
    if (dt) {
      const hr = (typeof heavyRovers !== 'undefined') ? heavyRovers.find(r => r.id === dt.roverId) : null;
      const pts = [{ x: dt.x, y: dt.y }];
      if (hr) {
        const telem = AEGIS_TELEMETRY.getRoverTelemetry(hr.id);
        if (telem) pts.push({ x: telem.x, y: telem.y });
        if (hr.home) pts.push({ x: hr.home.x, y: hr.home.y });
      }

      let minX = Math.min(...pts.map(p => p.x));
      let maxX = Math.max(...pts.map(p => p.x));
      let minY = Math.min(...pts.map(p => p.y));
      let maxY = Math.max(...pts.map(p => p.y));

      const padX = 80;
      const padY = 70;
      minX = Math.max(0, minX - padX);
      maxX = Math.min(1000, maxX + padX);
      minY = Math.max(0, minY - padY);
      maxY = Math.min(640, maxY + padY);

      let w = Math.max(300, maxX - minX);
      let h_box = Math.max(200, maxY - minY);
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
  }

  const h = byId(hazards, targetId);
  if (!h) return { x: 0, y: 0, w: 1000, h: 640 };

  const assignedRovers = rovers.filter(r => r.hazardId === targetId);
  const pts = [{ x: h.x, y: h.y }];

  assignedRovers.forEach(r => {
    const telem = AEGIS_TELEMETRY.getRoverTelemetry(r.id);
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
    const isDrop = h.targetType === 'drop';
    const assignedCount = isDrop ? 1 : rovers.filter(r => r.hazardId === h.id).length;
    const label = isDrop ? `DROP: ${h.name.split(' — ')[0]}` : (activeTargets.length === 1 ? `TARGET: ${h.name.split(' — ')[0].split(',')[0]}` : `TARGET ${idx + 1}: ${h.name.split(' — ')[0].split(',')[0]}`);

    return `
    <button class="map-view-btn target-btn ${isFocused ? 'active' : ''} ${isDrop ? 'target-btn-drop' : ''}" data-action="set-map-view" data-target="${h.id}">
      ${label}
      <span class="rover-cnt">${assignedCount} unit${assignedCount > 1 ? 's' : ''}</span>
    </button>`;
  }).join('');

  return `<div class="map-view-selector">${allBtn}${targetBtns}</div>`;
}

/* ---------- TARGET TELEMETRY HUD OVERLAY ---------- */
function renderTargetHudOverlay() {
  if (!state.activeTargetId || state.activeTargetId === 'ALL') return '';

  // 1. Heavy Airlift Drop Mission HUD
  if (typeof state.activeTargetId === 'string' && state.activeTargetId.startsWith('DROP-')) {
    const dt = (typeof activeDropTargets !== 'undefined') ? activeDropTargets.find(d => d.id === state.activeTargetId) : null;
    if (!dt) return '';
    const hr = (typeof heavyRovers !== 'undefined') ? heavyRovers.find(r => r.id === dt.roverId) : null;
    const telem = hr ? AEGIS_TELEMETRY.getRoverTelemetry(hr.id) : null;
    const etaText = telem ? AEGIS_TELEMETRY.formatEta(telem.etaSeconds) : '—';
    const progressPct = telem ? Math.round(telem.t * 100) : (dt.status === 'delivered' ? 100 : 0);

    return `
    <div class="target-hud-overlay target-hud-drop">
      <div class="target-hud-header">
        <div class="target-hud-title">${dt.payloadName || 'Relief Supplies'} &mdash; AIRDROP MISSION</div>
        <div class="target-hud-sub">
          <span class="target-hud-badge sev-moderate">REINFORCEMENT CORRIDOR</span>
          <span class="target-hud-source">${dt.label}</span>
        </div>
      </div>
      <div class="target-hud-grid">
        <div class="target-hud-item">
          <span class="target-hud-label">Assigned Airframe</span>
          <span class="target-hud-val" style="color:var(--accent-cyan);font-weight:700;">${hr ? hr.name : 'Heavy Lifter'} (${hr ? hr.capacity : 'Heavy'})</span>
        </div>
        <div class="target-hud-item">
          <span class="target-hud-label">Airdrop ETA</span>
          <span class="target-hud-val" style="color:var(--accent-amber);font-weight:700;">${dt.status === 'delivered' ? 'DELIVERED' : etaText}</span>
        </div>
        <div class="target-hud-item">
          <span class="target-hud-label">Cruise Speed</span>
          <span class="target-hud-val">${telem ? telem.speed.toFixed(1) : '78'} km/h &middot; 120m AGL</span>
        </div>
        <div class="target-hud-item">
          <span class="target-hud-label">Remaining Dist</span>
          <span class="target-hud-val">${telem ? `${telem.remainingDistance.toFixed(1)} / ${telem.totalDistance.toFixed(1)} km` : '0 km'}</span>
        </div>
      </div>
      <div class="target-hud-progress">
        <div class="target-hud-progress-fill" style="width:${progressPct}%;background:linear-gradient(90deg, var(--accent-cyan), var(--accent-amber));"></div>
      </div>
    </div>`;
  }

  // 2. Scout Fleet Incident Target HUD
  const h = byId(hazards, state.activeTargetId);
  if (!h) return '';

  const assignedRovers = rovers.filter(r => r.hazardId === h.id);
  if (assignedRovers.length === 0) return '';

  // Get leader rover telemetry
  const primaryRover = assignedRovers[0];
  const telem = AEGIS_TELEMETRY.getRoverTelemetry(primaryRover.id);
  const etaText = AEGIS_TELEMETRY.formatEta(telem.etaSeconds);
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
    : AEGIS_STATIONS[0];

  const vb = currentViewBox;

  // Tactical Colors & Shading
  const mapBgStart = isLight ? '#f4f6f9' : '#0b0f17';
  const mapBgEnd = isLight ? '#e9edf4' : '#111726';
  const waterGradStart = isLight ? '#bae6fd' : '#0284c7';
  const waterGradEnd = isLight ? '#e0f2fe' : '#0369a1';
  const waterStroke = isLight ? 'rgba(2, 132, 199, 0.45)' : 'rgba(56, 189, 248, 0.55)';
  const waterShoreGlow = isLight ? 'rgba(56, 189, 248, 0.25)' : 'rgba(56, 189, 248, 0.35)';
  const gridMinor = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.035)';
  const gridMajor = isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.08)';

  // 1. Dynamic terrain contours
  const terrainPathsSvg = (activeStation.mapFeatures?.terrainContours || []).map((d, i) => `
    <path class="contour-path" fill="none" stroke="${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)'}" stroke-width="1.0" d="${d}"></path>
  `).join('');

  // 2. Base Station Radar Rings
  const basePos = activeStation.depots?.[0] || { x: 180, y: 520 };
  const radarRangeRingsSvg = `
    <g class="radar-range-rings" opacity="0.6">
      <circle cx="${basePos.x}" cy="${basePos.y}" r="80" fill="none" stroke="var(--accent-cyan)" stroke-width="0.8" stroke-dasharray="3 3" opacity="0.35"/>
      <circle cx="${basePos.x}" cy="${basePos.y}" r="160" fill="none" stroke="var(--accent-cyan)" stroke-width="0.8" stroke-dasharray="4 4" opacity="0.25"/>
      <circle cx="${basePos.x}" cy="${basePos.y}" r="240" fill="none" stroke="var(--accent-cyan)" stroke-width="0.8" stroke-dasharray="5 5" opacity="0.15"/>
      <line x1="${basePos.x - 250}" y1="${basePos.y}" x2="${basePos.x + 250}" y2="${basePos.y}" stroke="var(--accent-cyan)" stroke-width="0.5" opacity="0.2"/>
      <line x1="${basePos.x}" y1="${basePos.y - 250}" x2="${basePos.x}" y2="${basePos.y + 250}" stroke="var(--accent-cyan)" stroke-width="0.5" opacity="0.2"/>
    </g>
  `;

  // 3. Landmarks
  const landmarksSvg = (activeStation.mapFeatures?.landmarks || []).map(lm => `
    <g class="landmark-marker" transform="translate(${lm.x},${lm.y})">
      <circle r="3" fill="var(--text-3)" opacity="0.6"/>
      <text class="marker-label" x="7" y="3" font-size="8px" fill="var(--text-3)" opacity="0.8">${lm.name}</text>
    </g>
  `).join('');

  // 4. Depots
  const depotsSvg = (activeStation.depots || []).map(dp => `
    <g class="depot-marker" transform="translate(${dp.x},${dp.y})">
      <rect x="-5" y="-5" width="10" height="10" rx="2" fill="var(--accent-cyan-dim)" stroke="var(--accent-cyan)" stroke-width="1.2"/>
      <circle cx="0" cy="0" r="1.5" fill="var(--accent-cyan)"/>
      <text class="marker-label" x="8" y="3" font-size="8px" font-weight="700" fill="var(--accent-cyan)">${dp.name}</text>
    </g>
  `).join('');

  // 5. Compass Rose
  const compassRoseSvg = `
    <g class="compass-rose" transform="translate(940, 60)" opacity="0.75">
      <circle r="18" fill="${markerInnerFill}" stroke="var(--border-card)" stroke-width="1.2"/>
      <polygon points="0,-14 4,0 0,-4 -4,0" fill="var(--accent-red)"/>
      <polygon points="0,14 4,0 0,4 -4,0" fill="var(--text-3)"/>
      <text x="0" y="-17" text-anchor="middle" font-size="8px" font-weight="800" fill="var(--accent-red)">N</text>
    </g>
  `;

  // 6. Scale Bar
  const scaleBarSvg = `
    <g class="scale-bar" transform="translate(40, 600)" opacity="0.8">
      <line x1="0" y1="0" x2="60" y2="0" stroke="var(--text-2)" stroke-width="2"/>
      <line x1="0" y1="-3" x2="0" y2="3" stroke="var(--text-2)" stroke-width="1.5"/>
      <line x1="60" y1="-3" x2="60" y2="3" stroke="var(--text-2)" stroke-width="1.5"/>
      <text x="30" y="-5" text-anchor="middle" font-size="8px" font-family="var(--mono)" fill="var(--text-2)">3 KM</text>
    </g>
  `;

  // 7. Coordinate Rulers
  const topRulers = [100, 250, 400, 550, 700, 850].map(x => `
    <g transform="translate(${x}, 12)" opacity="0.4">
      <line x1="0" y1="0" x2="0" y2="4" stroke="var(--text-3)" stroke-width="0.8"/>
      <text x="0" y="-2" text-anchor="middle" font-size="7px" font-family="var(--mono)" fill="var(--text-3)">${(91.5 + x * 0.002).toFixed(2)}°E</text>
    </g>
  `).join('');

  const leftRulers = [100, 220, 340, 460, 580].map(y => `
    <g transform="translate(12, ${y})" opacity="0.4">
      <line x1="0" y1="0" x2="4" y2="0" stroke="var(--text-3)" stroke-width="0.8"/>
      <text x="6" y="3" font-size="7px" font-family="var(--mono)" fill="var(--text-3)">${(26.4 - y * 0.0015).toFixed(2)}°N</text>
    </g>
  `).join('');

  // 8. Hazard Markers
  const hazardMarkers = hazards.map(h => {
    const isSelected = state.selectedHazardId === h.id;
    const isTarget = isTargetFocused && focusedHazardId === h.id;
    const isDimmed = isTargetFocused && !isTarget;
    const glowFill = h.severity === 'severe' ? 'url(#hazardGlowSevere)' : (h.severity === 'moderate' ? 'url(#hazardGlowModerate)' : 'none');

    return `
    <g class="marker hazard-marker ${isSelected ? 'selected' : ''} ${isTarget ? 'target-focused' : ''}" style="${isDimmed ? 'opacity:0.25;' : ''}" data-action="select-hazard" data-id="${h.id}" transform="translate(${h.x},${h.y})">
      ${glowFill !== 'none' ? `<circle r="42" fill="${glowFill}"/>` : ''}
      <circle r="7" fill="${markerInnerFill}" stroke="var(--accent-${h.severity === 'severe' ? 'red' : h.severity === 'moderate' ? 'amber' : 'teal'})" stroke-width="2.2"/>
      <circle r="2.8" fill="var(--accent-${h.severity === 'severe' ? 'red' : h.severity === 'moderate' ? 'amber' : 'teal'})"/>
      ${(!isDimmed || isSelected) ? `
        <text class="marker-label" x="${isTarget ? 16 : 13}" y="3.5" font-size="9px" font-weight="${isTarget ? '700' : '600'}">${h.name.split(' — ')[0].split(',')[0]}</text>
      ` : ''}
      ${isTarget ? `<circle r="38" fill="none" stroke="var(--accent-amber)" stroke-width="1.2" stroke-dasharray="4 4" opacity="0.85"/>` : ''}
    </g>`;
  }).join('');

  const isLive = state.mode === 'live';
  // In live mode, exclusively display real hardware units (zero simulated rovers)
  const activeFleet = isLive ? rovers.filter(r => r.isEsp32) : rovers;
  const activeHeavyFleet = isLive
    ? ((typeof heavyRovers !== 'undefined') ? heavyRovers.filter(hr => hr.isEsp32) : [])
    : ((typeof heavyRovers !== 'undefined') ? heavyRovers : []);

  // 9. Scout Fleet Laser Trajectory Routes
  const scoutRoutes = activeFleet.filter(r => r.hazardId).map(r => {
    const h = byId(hazards, r.hazardId);
    if (!h) return '';
    const telem = AEGIS_TELEMETRY.getRoverTelemetry(r.id);
    const isTarget = isTargetFocused && focusedHazardId === r.hazardId;
    const isDimmed = isTargetFocused && !isTarget;
    const home = r.home || { x: 180, y: 520 };
    const p1 = AEGIS_TELEMETRY.getControlPoint(home, h);

    return `
    <g class="route-group" style="${isDimmed ? 'opacity:0.15;' : ''}">
      <path d="M ${home.x} ${home.y} Q ${p1.x} ${p1.y} ${telem.x} ${telem.y}" fill="none" stroke="var(--accent-cyan)" stroke-width="5" opacity="0.18"></path>
      <path d="M ${home.x} ${home.y} Q ${p1.x} ${p1.y} ${telem.x} ${telem.y}" fill="none" stroke="var(--accent-cyan)" stroke-width="${isTarget ? 2.6 : 1.8}" opacity="0.95"></path>
      <path class="route-path ${isTarget ? 'highlighted' : ''}" d="M ${telem.x} ${telem.y} Q ${p1.x} ${p1.y} ${h.x} ${h.y}" stroke="${isTarget ? 'var(--accent-amber)' : 'rgba(56, 189, 248, 0.75)'}"></path>
    </g>`;
  }).join('');

  // 10. Heavy Airlift Reinforcement Flight Corridors
  const heavyRoutes = activeHeavyFleet.filter(hr => hr.status === 'Deployed' || hr.status === 'Returning').map(hr => {
    const telem = AEGIS_TELEMETRY.getRoverTelemetry(hr.id);
    if (!telem || !telem.targetPos) return '';
    const isReturn = telem.returnLeg;
    const p0 = isReturn ? telem.targetPos : (telem.homePos || hr.home || { x: 130, y: 560 });
    const p2 = isReturn ? (telem.homePos || hr.home || { x: 130, y: 560 }) : telem.targetPos;
    const p1 = AEGIS_TELEMETRY.getControlPoint(p0, p2);

    return `
    <g class="route-group heavy-airlift-corridor">
      <!-- Broad flight corridor laser channel -->
      <path d="M ${p0.x} ${p0.y} Q ${p1.x} ${p1.y} ${p2.x} ${p2.y}" fill="none" stroke="var(--accent-amber)" stroke-width="7" opacity="0.12"></path>
      <!-- Completed flight path -->
      <path d="M ${p0.x} ${p0.y} Q ${p1.x} ${p1.y} ${telem.x} ${telem.y}" fill="none" stroke="${isReturn ? 'var(--accent-teal)' : 'var(--accent-amber)'}" stroke-width="2.6" stroke-dasharray="6 4" opacity="0.95"></path>
      <!-- Remaining projection corridor -->
      <path class="route-path heavy-flight-path" d="M ${telem.x} ${telem.y} Q ${p1.x} ${p1.y} ${p2.x} ${p2.y}" stroke="${isReturn ? 'var(--accent-teal)' : 'var(--accent-cyan)'}" stroke-width="1.8"></path>
    </g>`;
  }).join('');

  // 11. Scout Fleet Rover Markers
  const roverMarkers = activeFleet.map(r => {
    const telem = AEGIS_TELEMETRY.getRoverTelemetry(r.id);
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

  // 12. Heavy-Lifting Air Rovers & Aerial Drones
  const heavyRoverMarkers = activeHeavyFleet.map(hr => {
    const telem = AEGIS_TELEMETRY.getRoverTelemetry(hr.id);
    const isSelected = state.selectedHeavyRoverId === hr.id;
    const isDeployed = hr.status === 'Deployed' || hr.status === 'Returning';
    const isTarget = isTargetFocused && (focusedHazardId === hr.id || (telem && telem.dropId === focusedHazardId));
    const posX = isDeployed ? telem.x : hr.x;
    const posY = isDeployed ? telem.y : hr.y;
    const heading = telem.heading || 0;
    const payload = hr.payloadId ? getPayloadById(hr.payloadId) : null;

    return `
    <g class="marker heavy-rover-marker ${isSelected ? 'selected' : ''} ${isDeployed ? 'deployed' : ''}" data-action="select-heavy-rover" data-id="${hr.id}" transform="translate(${posX},${posY})">
      <!-- High Altitude Flight Shadow -->
      ${isDeployed ? `<ellipse cx="8" cy="12" rx="14" ry="7" fill="rgba(0,0,0,0.3)" opacity="0.6"/>` : ''}
      <!-- Octocopter / VTOL Heavy Frame -->
      <g transform="rotate(${heading})">
        <!-- Booms -->
        <line x1="-12" y1="-12" x2="12" y2="12" stroke="${roverStroke}" stroke-width="1.6"/>
        <line x1="-12" y1="12" x2="12" y2="-12" stroke="${roverStroke}" stroke-width="1.6"/>
        <!-- Rotor Rings -->
        <circle cx="-12" cy="-12" r="4.5" fill="none" stroke="var(--accent-cyan)" stroke-width="1.0" opacity="0.85"/>
        <circle cx="12" cy="-12" r="4.5" fill="none" stroke="var(--accent-cyan)" stroke-width="1.0" opacity="0.85"/>
        <circle cx="-12" cy="12" r="4.5" fill="none" stroke="var(--accent-cyan)" stroke-width="1.0" opacity="0.85"/>
        <circle cx="12" cy="12" r="4.5" fill="none" stroke="var(--accent-cyan)" stroke-width="1.0" opacity="0.85"/>
        <!-- Central Avionics & Cargo Pod -->
        <rect x="-7" y="-8" width="14" height="16" rx="2.5" fill="${roverFill}" stroke="${isDeployed ? 'var(--accent-amber)' : roverStroke}" stroke-width="1.6"/>
        <!-- Attached Medical/Relief Cargo Box -->
        ${hr.payloadStatus === 'loaded' ? `
          <rect x="-4.5" y="-4" width="9" height="8" rx="1.2" fill="var(--accent-amber)" stroke="#ffffff" stroke-width="0.8"/>
          <path d="M-1.5,-4 v8 M-4.5,0 h9" stroke="#ffffff" stroke-width="0.8"/>
        ` : ''}
        <!-- Heading Indicator -->
        <line x1="0" y1="-8" x2="0" y2="-15" stroke="var(--accent-amber)" stroke-width="2.2" stroke-linecap="round"/>
      </g>
      <!-- Label -->
      <text class="marker-label heavy-label" x="14" y="3.5" font-weight="700">${hr.name}</text>
      ${isDeployed ? `
        <text class="marker-label" x="14" y="13" font-size="8px" fill="var(--accent-amber)">${telem.speed.toFixed(0)} km/h &bull; ${payload ? payload.shortName : 'Supplies'}</text>
      ` : (hr.payloadStatus === 'loaded' ? `
        <text class="marker-label" x="14" y="13" font-size="7.5px" fill="var(--accent-emerald)">[ARMED] ${payload ? payload.shortName : 'Loaded'}</text>
      ` : '')}
    </g>`;
  }).join('');

  // 13. Airdrop Targets & Delivered Parachute Markers
  const dropZoneMarkers = (typeof activeDropTargets !== 'undefined') ? activeDropTargets.map(dt => {
    const isDelivered = dt.status === 'delivered';
    const isTarget = isTargetFocused && focusedHazardId === dt.id;

    if (isDelivered) {
      return `
      <g class="delivered-drop-marker" transform="translate(${dt.x},${dt.y})" data-action="set-map-view" data-target="${dt.id}">
        <!-- Parachute canopy on ground -->
        <path d="M -11 -8 C -11 -18 11 -18 11 -8 Z" fill="rgba(16, 185, 129, 0.28)" stroke="var(--accent-emerald)" stroke-width="1.3"/>
        <line x1="-11" y1="-8" x2="-3" y2="1" stroke="var(--accent-emerald)" stroke-width="0.8" opacity="0.8"/>
        <line x1="11" y1="-8" x2="3" y2="1" stroke="var(--accent-emerald)" stroke-width="0.8" opacity="0.8"/>
        <!-- Delivered Crate -->
        <rect x="-6" y="1" width="12" height="10" rx="1.5" fill="#10b981" stroke="#ffffff" stroke-width="1.2"/>
        <path d="M0,1 v10 M-6,6 h12" stroke="#ffffff" stroke-width="1.0"/>
        <text class="marker-label" x="14" y="5" font-size="8.5px" font-weight="700" fill="var(--accent-emerald)">${dt.payloadName || 'SUPPLIES'} [DELIVERED]</text>
        <text class="marker-label" x="14" y="14" font-size="7.5px" fill="var(--text-3)">ON SITE RELIEF</text>
      </g>`;
    } else {
      return `
      <g class="drop-target-marker ${isTarget ? 'target-focused' : ''}" transform="translate(${dt.x},${dt.y})" data-action="set-map-view" data-target="${dt.id}">
        <circle r="7" fill="none" stroke="var(--accent-amber)" stroke-width="2.2"/>
        <line x1="-15" y1="0" x2="15" y2="0" stroke="var(--accent-amber)" stroke-width="1.5"/>
        <line x1="0" y1="-15" x2="0" y2="15" stroke="var(--accent-amber)" stroke-width="1.5"/>
        <rect x="-4" y="-4" width="8" height="8" rx="1.5" fill="var(--accent-amber)"/>
        <text class="marker-label" x="16" y="3.5" font-size="9px" font-weight="700" fill="var(--accent-amber)">DROP ZONE: ${dt.payloadName || 'MEDIKIT'}</text>
        <text class="marker-label" x="16" y="13" font-size="8px" fill="var(--text-2)">EN ROUTE &bull; ${dt.roverName || 'HEAVY LIFTER'}</text>
      </g>`;
    }
  }).join('') : '';

  return `
  <svg class="map-svg ${state.dropDesignationActive ? 'map-drop-cursor' : ''}" viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Tactical Operations Map">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${mapBgStart}"/>
        <stop offset="100%" stop-color="${mapBgEnd}"/>
      </linearGradient>
      <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${waterGradStart}" stop-opacity="0.45"/>
        <stop offset="100%" stop-color="${waterGradEnd}" stop-opacity="0.3"/>
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
    </defs>

    <!-- 1. Background -->
    <rect x="0" y="0" width="1000" height="640" fill="url(#bgGrad)"></rect>

    <!-- 2. Dynamic terrain contours -->
    ${terrainPathsSvg}

    <!-- 3. Radar Range Rings -->
    ${radarRangeRingsSvg}

    <!-- 4. Landmarks -->
    ${landmarksSvg}

    <!-- 5. Depots -->
    ${depotsSvg}

    <!-- 6. Compass & Scale -->
    ${compassRoseSvg}
    ${scaleBarSvg}

    <!-- 7. Coordinates -->
    ${topRulers}
    ${leftRulers}

    <!-- 8. Routes, Hazards, Rovers, and Heavy Supply Drops -->
    ${scoutRoutes}
    ${heavyRoutes}
    ${dropZoneMarkers}
    ${hazardMarkers}
    ${roverMarkers}
    ${heavyRoverMarkers}
  </svg>`;
}

/* ---------- ROVER INFO POPUP ---------- */
function renderRoverInfoPanel() {
  const r = state.selectedRoverId ? byId(rovers, state.selectedRoverId) : null;
  if (!r) return `<div class="rover-info-panel" id="roverInfoPanel"></div>`;

  const telem = AEGIS_TELEMETRY.getRoverTelemetry(r.id);
  const h = r.hazardId ? byId(hazards, r.hazardId) : null;
  const isDeployed = r.status === 'Deployed' || r.status === 'On Site';
  const etaStr = isDeployed ? AEGIS_TELEMETRY.formatEta(telem.etaSeconds) : '—';
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
    : AEGIS_STATIONS[0];
  const chipLabel = isLive
    ? `Live Disaster Feeds &middot; ${activeStation.state}`
    : `${activeStation.shortName} &middot; ${activeStation.region}`;

  const zoomPct = Math.round((1000 / Math.max(1, currentViewBox.w)) * 100);
  const isDropActive = !!state.dropDesignationActive;

  return `
  <div class="map-wrap ${isDropActive ? 'drop-targeting-active' : ''}">
    <div class="map-toolbar">
      <div class="map-chip">${chipLabel}</div>
      ${renderMapViewSelector()}
    </div>
    ${isDropActive ? `
      <div class="map-drop-banner">
        <div class="mdb-content">
          <span><b>TARGET DESIGNATION ACTIVE:</b> Click ANY point on the tactical map to dispatch Heavy Airlift Supply Drop</span>
        </div>
        <button class="mdb-close-btn" data-action="toggle-drop-designation" title="Exit Drop Mode">&times;</button>
      </div>` : ''}
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
      <div class="lg-row"><span class="lg-swatch" style="background:var(--accent-amber);"></span>Moderate hazard / Drop</div>
      <div class="lg-row"><span class="lg-swatch" style="background:var(--accent-teal);"></span>Low / advisory</div>
      <div class="lg-row"><span class="lg-swatch" style="background:var(--accent-blue);border-radius:2px;"></span>Scout route</div>
      <div class="lg-row"><span class="lg-swatch" style="background:var(--accent-emerald);border-radius:2px;"></span>Parachute drop</div>
    </div>
  </div>`;
}
