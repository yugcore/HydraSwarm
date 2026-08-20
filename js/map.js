/* =========================================================
   HYDRA - TACTICAL GIS MAP
========================================================= */

function routePath(rx, ry, hx, hy) {
  const mx = (rx + hx) / 2, my = (ry + hy) / 2 - 40;
  return `M ${rx} ${ry} Q ${mx} ${my} ${hx} ${hy}`;
}

function etaFor(r) {
  const map = { 'A-02': '6 min', 'G-02': '11 min' };
  return map[r.id] || '9 min';
}

function renderRoverInfoPanel() {
  const r = state.selectedRoverId ? byId(rovers, state.selectedRoverId) : null;
  if (!r) return `<div class="rover-info-panel" id="roverInfoPanel"></div>`;
  const h = r.hazardId ? byId(hazards, r.hazardId) : null;
  const eta = r.status === 'Deployed' ? etaFor(r) : '—';
  return `
  <div class="rover-info-panel show" id="roverInfoPanel">
    <div class="rip-head">
      <b>${r.name} <span style="color:var(--text-low);font-weight:400;font-size:11px;">${r.id}</span></b>
      <button class="rip-close" data-action="deselect-rover" aria-label="Close">&times;</button>
    </div>
    <div class="rip-grid">
      <div class="detail-field"><label>Status</label><span>${r.status}</span></div>
      <div class="detail-field"><label>Destination</label><span>${h ? h.name.split(',')[0] : '—'}</span></div>
      <div class="detail-field"><label>ETA</label><span>${eta}</span></div>
      <div class="detail-field"><label>Battery</label><span>${r.battery}%</span></div>
      <div class="detail-field"><label>Speed</label><span>${r.status === 'Deployed' ? (r.type === 'aerial' ? '38 km/h' : '14 km/h') : '0 km/h'}</span></div>
      <div class="detail-field"><label>Connection</label><span style="text-transform:capitalize;">${r.connection}</span></div>
    </div>
    ${r.status === 'Deployed' ? `<button class="mini-btn ${state.liveFeedRoverId === r.id ? 'feed-on' : ''}" style="width:100%;" data-action="toggle-feed" data-id="${r.id}">${state.liveFeedRoverId === r.id ? 'Feed Active' : 'Show Live Feed'}</button>` : ``}
  </div>`;
}

function renderMapSvg() {
  const hazardMarkers = hazards.map(h => {
    const selected = state.selectedHazardId === h.id;
    return `
    <g class="marker marker-hazard" data-action="select-hazard" data-id="${h.id}" transform="translate(${h.x},${h.y})">
      <circle class="pulse" r="9" fill="var(--accent-${h.severity === 'severe' ? 'red' : h.severity === 'moderate' ? 'amber' : 'teal'})"></circle>
      <circle r="7" fill="var(--bg-1)" stroke="var(--accent-${h.severity === 'severe' ? 'red' : h.severity === 'moderate' ? 'amber' : 'teal'})" stroke-width="${selected ? 2.6 : 1.6}"></circle>
      <g transform="translate(-4.5,-4.5) scale(0.42)" stroke="var(--accent-${h.severity === 'severe' ? 'red' : h.severity === 'moderate' ? 'amber' : 'teal'})" fill="none" stroke-width="1.8">${hazardIcons[h.type]}</g>
      <text class="marker-label" x="11" y="3.5">${h.name.split(' — ')[0].split(',')[0]}</text>
    </g>`;
  }).join('');

  const routes = rovers.filter(r => r.hazardId).map(r => {
    const h = byId(hazards, r.hazardId);
    if (!h) return '';
    const highlighted = state.selectedRoverId === r.id;
    return `<path class="route-path ${highlighted ? 'highlighted' : ''}" d="${routePath(r.home.x, r.home.y, h.x, h.y)}"></path>`;
  }).join('');

  const roverMarkers = rovers.map(r => {
    const selected = state.selectedRoverId === r.id;
    const deployed = r.status === 'Deployed';
    const shape = r.type === 'ground'
      ? `<rect x="-6" y="-6" width="12" height="12" rx="2.5"></rect>`
      : `<polygon points="0,-7 6,6 0,3 -6,6"></polygon>`;
    return `
    <g class="marker rover-marker-${r.type} ${selected ? 'selected' : ''} ${deployed ? 'deployed' : ''}" data-action="select-rover" data-id="${r.id}" transform="translate(${r.x},${r.y})">
      ${shape}
      <text class="marker-label" x="10" y="3.5">${r.id}</text>
    </g>`;
  }).join('');

  return `
  <svg class="map-svg" viewBox="0 0 1000 640" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Operations map">
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
    <g opacity="0.55">
      <rect x="80" y="580" width="16" height="16" rx="2" fill="none" stroke="var(--text-low)" stroke-width="1.2"></rect>
      <text x="100" y="591" class="marker-label" fill="var(--text-low)">HQ / WEST DEPOT</text>
      <rect x="200" y="545" width="16" height="16" rx="2" fill="none" stroke="var(--text-low)" stroke-width="1.2"></rect>
      <text x="220" y="556" class="marker-label" fill="var(--text-low)">EAST DEPOT</text>
    </g>
    ${routes}
    ${hazardMarkers}
    ${roverMarkers}
  </svg>`;
}

function renderMap() {
  const isLive = state.mode === 'live';
  const chipLabel = isLive ? 'Live Global Satellite & Seismic Feeds' : 'Sim Region &middot; Coastal &amp; Mountain Basin';

  return `
  <div class="map-wrap">
    <div class="map-toolbar">
      <div class="map-chip"><span class="stat-dot ok" style="margin-right:2px;"></span>${chipLabel}</div>
    </div>
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
