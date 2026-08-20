/* =========================================================
   HYDRA - UI COMPONENTS (BENTO-GRID & THEME INTEGRATION)
========================================================= */

/* ---------- TOP BAR ---------- */
function renderTopbar() {
  const simActive = state.mode === 'simulation';
  const isLight = state.theme === 'light';

  const themeIcon = isLight
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>` // Moon icon for switching to dark
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`; // Sun icon for switching to light

  return `
  <div class="topbar">
    <div class="brand">
      <div class="brand-mark">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5"/><circle cx="12" cy="12" r="3.5"/></svg>
      </div>
      <div class="brand-text">
        <span class="brand-name">HYDRA</span>
        <span class="brand-sub">Mission Ops</span>
      </div>
    </div>

    <!-- Center Navigation Pill (Reference Style) -->
    <div class="mode-switch" role="group" aria-label="Operating mode">
      <button data-action="set-mode" data-mode="simulation" class="${simActive ? 'active' : ''}">
        <span class="dot"></span>Simulation
      </button>
      <button data-action="set-mode" data-mode="live" class="${!simActive ? 'live-active' : ''}">
        <span class="dot"></span>Live Feeds
      </button>
    </div>

    <!-- Right Controls: Clock & Single-Click Theme Switcher -->
    <div class="topbar-right">
      <div class="topbar-clock">
        <span>TIME</span>
        <b id="clockVal">${fmtTime(new Date())}</b>
      </div>
      <button class="theme-toggle-btn" data-action="toggle-theme" title="Switch to ${isLight ? 'Dark' : 'Light'} Mode" aria-label="Toggle Theme">
        ${themeIcon}
      </button>
    </div>
  </div>`;
}

/* ---------- STATUS BAR ---------- */
function renderStatusbar() {
  const activeHazards = hazards.filter(h => h.status === 'Active').length;
  const deployedRovers = rovers.filter(r => r.status === 'Deployed' || r.status === 'On Site').length;
  const connectedUnits = rovers.filter(r => r.connection !== 'none').length;
  
  const apiConnected = HYDRA_API.status.usgs === 'connected' || HYDRA_API.status.nasa === 'connected';
  const apiStatusClass = apiConnected ? 'ok' : HYDRA_API.status.usgs === 'error' ? 'warn' : 'ok';
  const apiText = apiConnected ? 'Live Feeds Active' : 'Operational';

  return `
  <div class="statusbar">
    <div class="stat-group">
      <div class="stat"><span class="stat-dot ${apiStatusClass}"></span>Data Uplink <b>${apiText}</b></div>
      <div class="stat"><span class="stat-dot ${activeHazards ? 'warn' : 'ok'}"></span>Active Hazards <b>${activeHazards}</b></div>
      <div class="stat"><span class="stat-dot ok"></span>Deployed Units <b>${deployedRovers}</b></div>
      <div class="stat"><span class="stat-dot ${connectedUnits ? 'ok' : 'off'}"></span>Fleet Link <b>${connectedUnits} / ${rovers.length}</b></div>
    </div>
    <div class="stat"><span class="stat-dot ok"></span>Last Sync <b id="lastUpdateVal">${fmtTime(state.lastUpdate)}</b></div>
  </div>`;
}

/* ---------- ROVER PANEL (FLEET BENTO TILES) ---------- */
function renderRoverPanel() {
  const rows = rovers.map(r => {
    const selected = state.selectedRoverId === r.id;
    const isDeployed = r.status === 'Deployed' || r.status === 'On Site';
    const feedOn = state.liveFeedRoverId === r.id;
    const telem = HYDRA_TELEMETRY.getRoverTelemetry(r.id);
    const etaText = isDeployed ? HYDRA_TELEMETRY.formatEta(telem.etaSeconds) : '—';

    return `
    <div class="rover-card ${selected ? 'selected' : ''}" data-action="select-rover" data-id="${r.id}">
      <div class="rover-top">
        <div class="rover-id">
          <span class="rover-type-icon">${typeIcon(r.type)}</span>
          <span class="rover-name">${r.name}</span>
        </div>
        <span class="rover-badge ${badgeClass(r.status)}">${r.status}</span>
      </div>
      <div class="rover-meta">${r.task}</div>
      <div class="rover-stats">
        <div class="rover-stat">BATT
          <span class="batt-track"><span class="batt-fill ${battClass(r.battery)}" style="width:${r.battery}%"></span></span>
          ${r.battery}%
        </div>
        ${isDeployed ? `<div class="rover-stat" style="color:var(--accent-cyan);font-weight:700;">${telem.speed.toFixed(0)} km/h</div>` : ''}
        ${isDeployed ? `<div class="rover-stat" style="color:var(--accent-amber);font-weight:700;">ETA ${etaText}</div>` : ''}
        <div class="rover-stat">${connPips(r.connection)}</div>
      </div>
      ${isDeployed ? `<div class="rover-actions">
        <button class="mini-btn ${feedOn ? 'feed-on' : ''}" data-action="toggle-feed" data-id="${r.id}">${feedOn ? 'Feed Active' : 'Show Live Feed'}</button>
      </div>` : ``}
    </div>`;
  }).join('');

  return `
  <div class="col col-left">
    <div class="col-header">
      <span class="col-title">Scout Rovers</span>
      <span class="col-count">${rovers.length}</span>
    </div>
    <div class="col-body">${rows}</div>
  </div>`;
}

function disconnectedCard(title, sub) {
  return `<div class="disconnected-card">
    <div class="dc-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 1l22 22M9 9a4 4 0 0 1 5.66 5.66M4.7 4.7A10 10 0 0 0 2 12M22 12a10 10 0 0 0-2.7-6.8" stroke-linecap="round"/></svg></div>
    <div><div class="dc-title">${title}</div><div class="dc-sub">${sub}</div></div>
    <button class="dc-btn" disabled>Configure</button>
  </div>`;
}

/* ---------- HAZARD PANEL (INCIDENT BENTO TILES) ---------- */
function renderHazardPanel() {
  const rows = hazards.map(h => {
    const selected = state.selectedHazardId === h.id;
    const assigned = rovers.filter(r => r.hazardId === h.id);
    const availableCount = rovers.filter(r => r.status === 'Ready').length;
    const sourceTag = h.source ? `<span style="font-size:9px;color:var(--accent-cyan);font-weight:700;margin-left:5px;border:1px solid var(--accent-cyan-dim);padding:1px 5px;border-radius:var(--radius-pill);">${h.source}</span>` : '';
    
    return `
    <div class="hazard-card ${selected ? 'selected' : ''}">
      <div class="hazard-head" data-action="select-hazard" data-id="${h.id}">
        <div class="hazard-top">
          <div class="hazard-id">
            <span class="hazard-sev-dot ${sevClass(h.severity)}"></span>
            <div style="min-width:0;">
              <div class="hazard-name">${h.name} ${sourceTag}</div>
              <div class="hazard-type">${h.type} ${h.magnitude ? `&middot; ${h.magnitude}` : ''}</div>
            </div>
          </div>
          <span class="hazard-status-pill ${statusPillClass(h.status)}">${h.status}</span>
        </div>
        <div class="hazard-loc">${h.location}</div>
        <div class="hazard-time">DETECTED ${h.detected} &middot; SEV ${h.severity.toUpperCase()}</div>
      </div>
      ${selected ? `
      <div class="hazard-detail">
        <div class="hazard-detail-grid">
          <div class="detail-field"><label>Type</label><span>${h.type}</span></div>
          <div class="detail-field"><label>Severity</label><span>${h.severity}</span></div>
          <div class="detail-field"><label>Detected</label><span>${h.detected}</span></div>
          <div class="detail-field"><label>Source</label><span>${h.source || 'Local Sensor'}</span></div>
          ${h.depth ? `<div class="detail-field"><label>Depth</label><span>${h.depth}</span></div>` : ''}
          ${h.magnitude ? `<div class="detail-field"><label>Magnitude</label><span>${h.magnitude}</span></div>` : ''}
          ${h.lat ? `<div class="detail-field"><label>Coordinates</label><span>${h.lat.toFixed(2)}°, ${h.lon.toFixed(2)}°</span></div>` : ''}
        </div>
        ${assigned.length ? `
          <div class="assigned-note">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M4 12l5 5L20 6" stroke-linecap="round" stroke-linejoin="round"/></svg>
            ${assigned.length} rover${assigned.length > 1 ? 's' : ''} assigned: ${assigned.map(a => a.name).join(', ')}
          </div>
          <button class="mini-btn" style="width:100%;margin-top:7px;background:var(--accent-amber-dim);color:var(--accent-amber);border-color:var(--accent-amber);" data-action="set-map-view" data-target="${h.id}">
            Focus Target View
          </button>` : ``}
        <button class="deploy-btn" style="margin-top:10px;" data-action="open-deploy" data-id="${h.id}" ${availableCount === 0 ? 'disabled' : ''}>
          ${availableCount === 0 ? 'No Rovers Available' : 'Deploy Scout Rovers'}
        </button>
      </div>` : ``}
    </div>`;
  }).join('') || `<p style="font-size:11.5px;color:var(--text-3);padding:10px 2px;">No active hazards detected.</p>`;

  return `
  <div class="col col-right">
    <div class="col-header">
      <span class="col-title">Natural Hazards</span>
      <div style="display:flex;align-items:center;gap:6px;">
        <button class="link-btn" data-action="sync-hazards" style="font-size:10px;font-weight:700;padding:2px 8px;border:1px solid var(--border-card);border-radius:var(--radius-pill);color:var(--accent-cyan);" title="Fetch latest USGS, NASA & NOAA feeds">&#x21bb; Sync</button>
        <span class="col-count">${hazards.length}</span>
      </div>
    </div>
    <div class="col-body">${rows}</div>
  </div>`;
}

/* ---------- DEPLOY MODAL ---------- */
function renderDeployModal() {
  const h = state.deployModalHazardId ? byId(hazards, state.deployModalHazardId) : null;
  if (!h) {
    return `<div class="modal-overlay" id="modalOverlay"></div>`;
  }
  const available = rovers.filter(r => r.status === 'Ready');
  const rows = available.map(r => {
    const checked = state.deployChecked.has(r.id);
    return `
    <div class="deploy-row ${checked ? 'checked' : ''}" data-action="toggle-deploy-check" data-id="${r.id}">
      <span class="chk"><svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3"><path d="M4 12l5 5L20 6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
      <span class="rover-type-icon">${typeIcon(r.type)}</span>
      <span class="dr-name">${r.name}</span>
      <span class="dr-meta">BATT ${r.battery}%</span>
    </div>`;
  }).join('') || `<p style="font-size:11.5px;color:var(--text-3);padding:10px 2px;">No rovers currently available for deployment.</p>`;

  const count = state.deployChecked.size;
  return `
  <div class="modal-overlay show" id="modalOverlay" data-action="overlay-close">
    <div class="modal" data-stop="1">
      <div class="modal-header">
        <div class="mh-title">Deploy Scout Rovers</div>
        <div class="mh-sub">Target: ${h.name} &middot; ${h.type} &middot; ${h.severity.toUpperCase()} severity</div>
      </div>
      <div class="modal-body">
        <div style="display:flex;align-items:center;margin-bottom:8px;">
          <span style="font-size:10.5px;color:var(--text-3);text-transform:uppercase;letter-spacing:0.4px;font-weight:700;">Available Rovers</span>
          <button class="link-all" data-action="deploy-all">Select All Available</button>
        </div>
        ${rows}
        ${count > 0 ? `<div class="confirm-summary">Assigning <b>${count}</b> rover${count > 1 ? 's' : ''} to <b>${h.name}</b>. Routes will be calculated from staging positions to target site.</div>` : ``}
      </div>
      <div class="modal-footer">
        <button class="btn" data-action="close-deploy">Cancel</button>
        <button class="btn btn-primary" style="margin-left:auto;" data-action="confirm-deploy" ${count === 0 ? 'disabled' : ''}>Confirm Deployment</button>
      </div>
    </div>
  </div>`;
}

/* ---------- LIVE BANNER ---------- */
function renderLiveBanner() {
  if (state.mode !== 'live') return '';
  return `<div class="live-banner">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 3"/></svg>
    Live Mode Active &mdash; Connected to live USGS Earthquake &amp; NASA EONET satellite feeds. Polling updates every 30s.
  </div>`;
}
