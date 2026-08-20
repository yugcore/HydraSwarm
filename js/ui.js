/* =========================================================
   HYDRA - UI COMPONENTS (CLEAN BENTO DESIGN)
========================================================= */

/* ---------- TOP BAR ---------- */
function renderTopbar() {
  const simActive = state.mode === 'simulation';
  const isLight = state.theme === 'light';
  const activeStation = (typeof getStationById === 'function')
    ? getStationById(state.selectedStationId || currentStationId || 'guwahati')
    : HYDRA_STATIONS[0];

  const themeIcon = isLight
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;

  return `
  <div class="topbar">
    <div class="brand">
      <div class="brand-mark">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5"/><circle cx="12" cy="12" r="3.5"/></svg>
      </div>
      <div class="brand-text">
        <span class="brand-name">HYDRA</span>
        <span class="brand-sub">Mission Operations</span>
      </div>
    </div>

    <!-- Center Section: Station Selector & Sim/Live Switcher -->
    <div class="topbar-center-group">
      <button class="station-pill-btn" data-action="open-station-modal" title="Switch Command Station (Guwahati, Chennai, Kedarnath, Mumbai, Puri, Wayanad...)">
        <span class="pin-dot"></span>
        <span class="station-pill-text">${activeStation.shortName}</span>
        <span class="station-pill-badge ${activeStation.badgeClass}">${activeStation.riskLevel}</span>
        <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" style="opacity:0.6;"><polyline points="6 9 12 15 18 9"/></svg>
      </button>

      <div class="mode-switch" role="group" aria-label="Operating mode">
        <button data-action="set-mode" data-mode="simulation" class="${simActive ? 'active' : ''}">
          Simulation
        </button>
        <button data-action="set-mode" data-mode="live" class="${!simActive ? 'live-active' : ''}">
          Live Feeds
        </button>
      </div>
    </div>

    <!-- Right Controls: Clock & Single-Click Theme Switcher -->
    <div class="topbar-right">
      <div class="topbar-clock">
        <span class="tc-lbl">TIME</span>
        <b id="clockVal">${fmtTime(new Date())}</b>
      </div>
      <button class="theme-toggle-btn" data-action="toggle-theme" title="Switch to ${isLight ? 'Dark' : 'Light'} Mode" aria-label="Toggle Theme">
        ${themeIcon}
      </button>
    </div>
  </div>`;
}

/* ---------- STATUS BAR (CLEAN & NON-BLINKING) ---------- */
function renderStatusbar() {
  const isLive = state.mode === 'live';
  const fleetRovers = isLive ? rovers.filter(r => r.isEsp32) : rovers;
  const activeHazards = hazards.filter(h => h.status === 'Active').length;
  const deployedRovers = fleetRovers.filter(r => r.status === 'Deployed' || r.status === 'On Site').length;
  const connectedUnits = fleetRovers.filter(r => r.connection !== 'none').length;
  
  const apiConnected = HYDRA_API.status.usgs === 'connected' || HYDRA_API.status.nasa === 'connected';
  const apiText = isLive ? (apiConnected ? 'USGS & NASA Feeds Live' : 'Live Feeds Operational') : 'Simulation Engine Active';

  return `
  <div class="statusbar">
    <div class="stat-group">
      <div class="stat"><span class="stat-lbl">Data Uplink</span><b>${apiText}</b></div>
      <div class="stat-divider"></div>
      <div class="stat"><span class="stat-lbl">Real Hazards</span><b>${activeHazards}</b></div>
      <div class="stat-divider"></div>
      <div class="stat"><span class="stat-lbl">${isLive ? 'Live Units' : 'Deployed Units'}</span><b>${deployedRovers}</b></div>
      <div class="stat-divider"></div>
      <div class="stat"><span class="stat-lbl">${isLive ? 'WiFi Hardware' : 'Fleet Link'}</span><b>${connectedUnits} / ${fleetRovers.length}</b></div>
    </div>
    <div class="stat"><span class="stat-lbl">Last Sync</span><b id="lastUpdateVal">${fmtTime(state.lastUpdate)}</b></div>
  </div>`;
}

/* ---------- BESPOKE ROVER BADGE HELPER ---------- */
function renderRoverBadge(status) {
  switch (status) {
    case 'Ready':
      return `<span class="rover-badge badge-ready"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> Ready</span>`;
    case 'Deployed':
    case 'On Site':
      return `<span class="rover-badge badge-deployed"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg> Deployed</span>`;
    case 'Returning':
      return `<span class="rover-badge badge-returning"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 14L4 9l5-5"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg> Returning</span>`;
    default:
      return `<span class="rover-badge badge-offline">${status}</span>`;
  }
}

/* ---------- ROVER PANEL (FLEET BENTO TILES) ---------- */
function renderRoverPanel() {
  const isLive = state.mode === 'live';
  const activeStation = (typeof getStationById === 'function')
    ? getStationById(state.selectedStationId || currentStationId || 'guwahati')
    : HYDRA_STATIONS[0];
  const fleetRovers = isLive ? rovers.filter(r => r.isEsp32) : rovers;
  const espConnectedCount = rovers.filter(r => r.isEsp32).length;

  let contentHtml = '';
  if (isLive && fleetRovers.length === 0) {
    contentHtml = `
      <div class="rover-empty-live">
        <div class="wifi-empty-icon">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
            <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
            <circle cx="12" cy="20" r="1.5" fill="currentColor"/>
          </svg>
        </div>
        <div class="es-title" style="margin-top:8px;font-size:12px;font-weight:700;color:var(--text-0);">No Real Hardware Linked</div>
        <div class="es-sub" style="margin-top:4px;text-align:center;max-width:210px;font-size:10.5px;color:var(--text-3);line-height:1.4;">
          In <b>Live Feeds</b> mode, all simulated data is unwired. Connect your real physical ESP32-CAM rovers &amp; drones over WiFi.
        </div>
        <button class="btn btn-primary btn-sm" data-action="open-esp32-modal" style="margin-top:12px;">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><line x1="12" y1="20" x2="12.01" y2="20" stroke-width="3"/></svg>
          Connect Physical WiFi Rover
        </button>
      </div>`;
  } else {
    contentHtml = fleetRovers.map(r => {
      const selected = state.selectedRoverId === r.id;
      const isDeployed = r.status === 'Deployed' || r.status === 'On Site';
      const feedOn = state.liveFeedRoverId === r.id;
      const telem = HYDRA_TELEMETRY.getRoverTelemetry(r.id);
      const etaText = isDeployed ? HYDRA_TELEMETRY.formatEta(telem.etaSeconds) : '—';
      const isEsp = !!r.isEsp32;

      return `
      <div class="rover-card ${selected ? 'selected' : ''} ${isEsp ? 'rover-card-esp32' : ''}" data-action="select-rover" data-id="${r.id}">
        <div class="rover-top">
          <div class="rover-id">
            <span class="rover-type-icon ${isEsp ? 'esp32-icon' : ''}">${typeIcon(r.type)}</span>
            <span class="rover-name">${r.name}</span>
            ${isEsp ? `<span class="esp32-badge" title="ESP32 WiFi Hardware Device &middot; ${r.ip}"><svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><line x1="12" y1="20" x2="12.01" y2="20" stroke-width="3.5"/></svg> ESP32</span>` : ''}
          </div>
          ${renderRoverBadge(r.status)}
        </div>
        <div class="rover-meta">${r.task}${isEsp ? ` &middot; <span class="esp-ip-text">${r.ip}</span>` : ''}</div>
        <div class="rover-stats">
          <div class="rover-stat">
            <span class="stat-sub">BATT</span>
            <span class="batt-track"><span class="batt-fill ${battClass(r.battery)}" style="width:${r.battery}%"></span></span>
            <span style="font-weight:600;">${r.battery}%</span>
          </div>
          ${isDeployed ? `<div class="rover-stat" style="color:var(--accent-cyan);font-weight:600;">${telem.speed.toFixed(0)} km/h</div>` : ''}
          ${isDeployed ? `<div class="rover-stat" style="color:var(--accent-amber);font-weight:600;">ETA ${etaText}</div>` : ''}
          ${isEsp ? `<div class="rover-stat esp32-rssi" title="WiFi RSSI: ${r.rssi || -52} dBm"><svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/></svg> ${r.rssi || -52} dBm</div>` : `<div class="rover-stat">${connPips(r.connection)}</div>`}
        </div>
        <div class="rover-actions">
          ${isDeployed || isEsp ? `
            <button class="mini-btn ${feedOn ? 'feed-on' : ''}" data-action="toggle-feed" data-id="${r.id}">
              <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.2" style="margin-right:3px;"><rect x="2" y="6" width="14" height="12" rx="1.6"/><path d="M16 10.5l6-3.5v10l-6-3.5"/></svg>
              ${feedOn ? 'Feed Active' : 'Live Camera Feed'}
            </button>` : ``}
          ${isEsp ? `
            <button class="mini-btn mini-btn-danger" data-action="disconnect-esp32" data-id="${r.id}" title="Disconnect ESP32 WiFi connection">
              Disconnect
            </button>` : ``}
        </div>
      </div>`;
    }).join('');
  }

  return `
  <div class="col col-left">
    <div class="col-header">
      <div class="col-header-title-group">
        <span class="col-title">${isLive ? 'Live Scout Fleet' : `${activeStation.shortName} Fleet`}</span>
        <button class="wifi-connect-btn" data-action="open-esp32-modal" title="Connect ESP32 WiFi Rover / Drone (ESP32-CAM, ESP32-S3, IoT)">
          <svg class="wifi-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
            <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
            <circle cx="12" cy="20" r="1.5" fill="currentColor"/>
          </svg>
          <span class="wifi-btn-text">Connect WiFi</span>
          ${espConnectedCount > 0 ? `<span class="wifi-pill-count">${espConnectedCount}</span>` : ''}
        </button>
      </div>
      <span class="col-count">${fleetRovers.length}</span>
    </div>
    <div class="col-body">${contentHtml}</div>
  </div>`;
}

/* ---------- HAZARD PANEL (INCIDENT BENTO TILES) ---------- */
function renderHazardPanel() {
  const activeStation = (typeof getStationById === 'function')
    ? getStationById(state.selectedStationId || currentStationId || 'guwahati')
    : HYDRA_STATIONS[0];

  const rows = hazards.map(h => {
    const selected = state.selectedHazardId === h.id;
    const assigned = rovers.filter(r => r.hazardId === h.id);
    const availableCount = rovers.filter(r => r.status === 'Ready').length;
    const sourceTag = h.source ? `<span class="source-tag">${h.source}</span>` : '';
    
    return `
    <div class="hazard-card ${selected ? 'selected' : ''}">
      <div class="hazard-head" data-action="select-hazard" data-id="${h.id}">
        <div class="hazard-top">
          <div class="hazard-id">
            <div style="min-width:0;">
              <div class="hazard-name">${h.name} ${sourceTag}</div>
              <div class="hazard-type">${h.type} ${h.magnitude ? `&middot; ${h.magnitude}` : ''}</div>
            </div>
          </div>
          <div class="hazard-badge-row">
            <span class="hazard-sev-badge sev-${h.severity}">${h.severity.toUpperCase()}</span>
            <span class="hazard-status-pill ${statusPillClass(h.status)}">${h.status}</span>
          </div>
        </div>
        <div class="hazard-loc">${h.location}</div>
        <div class="hazard-time">DETECTED ${h.detected}</div>
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
      <span class="col-title">Hazards &middot; ${activeStation.state}</span>
      <div style="display:flex;align-items:center;gap:6px;">
        <button class="link-btn" data-action="sync-hazards" style="font-size:10px;font-weight:700;padding:2px 8px;border:1px solid var(--border-card);border-radius:var(--radius-pill);color:var(--accent-cyan);" title="Fetch latest regional alerts">&#x21bb; Sync</button>
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

/* ---------- ESP32 WIFI VEHICLE CONNECTION MODAL ---------- */
function renderEsp32Modal() {
  if (!state.esp32ModalOpen) {
    return `<div class="modal-overlay" id="esp32ModalOverlay"></div>`;
  }

  const activeTab = HYDRA_ESP32.activeTab || 'scanner';
  const isScanning = HYDRA_ESP32.isScanning;
  const isLive = state.mode === 'live';
  const discovered = isLive 
    ? (HYDRA_ESP32.discoveredDevices.filter(d => d.isRealHardware || (d.status && d.status.includes('Live')) || rovers.some(r => r.ip === d.ip && r.isHardwareLive)))
    : (HYDRA_ESP32.discoveredDevices || []);

  // Helper for RSSI signal bars
  function renderRssiBars(rssi) {
    const bars = rssi >= -50 ? 4 : rssi >= -65 ? 3 : rssi >= -75 ? 2 : 1;
    return `
    <span class="rssi-meter" title="Signal: ${rssi} dBm">
      <i class="${bars >= 1 ? 'bar-on' : ''}"></i>
      <i class="${bars >= 2 ? 'bar-on' : ''}"></i>
      <i class="${bars >= 3 ? 'bar-on' : ''}"></i>
      <i class="${bars >= 4 ? 'bar-on' : ''}"></i>
      <span class="rssi-val">${rssi} dBm</span>
    </span>`;
  }

  let tabBodyHtml = '';

  if (activeTab === 'scanner') {
    let devRows = '';

    if (discovered.length === 0) {
      devRows = `
      <div class="esp-scanner-empty" style="padding:28px 16px;text-align:center;background:var(--bg-card);border:1px dashed var(--border-card);border-radius:var(--radius-s);display:flex;flex-direction:column;align-items:center;">
        <span class="scanner-pulse ${isScanning ? 'active' : ''}"></span>
        <div style="font-weight:700;font-size:12px;color:var(--text-0);margin-top:10px;">${isScanning ? 'Scanning 2.4GHz Local WiFi Subnet...' : 'No Physical Hardware Discovered on LAN'}</div>
        <div style="font-size:11px;color:var(--text-2);text-align:center;max-width:320px;margin-top:4px;line-height:1.4;">
          ${isScanning ? 'Listening for real ESP32-CAM and ESP32-S3 boards on your local subnet...' : 'Ensure your ESP32 rover is powered on and connected to your WiFi router or its hotspot (192.168.4.1), or use Manual IP Setup.'}
        </div>
        <div style="display:flex;gap:8px;margin-top:12px;">
          <button class="btn btn-secondary btn-sm" data-action="scan-esp32" ${isScanning ? 'disabled' : ''}>
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" class="${isScanning ? 'spin' : ''}"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            ${isScanning ? 'Scanning...' : 'Rescan Subnet'}
          </button>
          <button class="btn btn-primary btn-sm" data-action="switch-esp32-tab" data-tab="manual">
            Manual IP Setup
          </button>
        </div>
      </div>`;
    } else {
      devRows = discovered.map(d => {
        const isConnected = rovers.some(r => r.id === d.id || (r.isEsp32 && r.ip === d.ip));
        const featuresHtml = (d.features || []).map(f => `<span class="esp-feature-tag">${f}</span>`).join('');

        return `
        <div class="esp-device-card ${isConnected ? 'device-connected' : ''}">
          <div class="esp-dev-main">
            <div class="esp-dev-head">
              <span class="esp-dev-icon">${typeIcon(d.type)}</span>
              <div class="esp-dev-info">
                <div class="esp-dev-name">${d.name} <span class="esp-chipset">${d.chipset || 'ESP32-CAM'}</span></div>
                <div class="esp-dev-ip">IP: <b>${d.ip}:${d.port || 81}${d.streamPath || '/stream'}</b> &middot; MAC: ${d.mac || '—'}</div>
              </div>
            </div>
            <div class="esp-dev-meta">
              ${renderRssiBars(d.rssi || -55)}
              <span class="esp-batt"><span class="batt-track"><span class="batt-fill ${battClass(d.battery)}" style="width:${d.battery}%"></span></span> ${d.battery}%</span>
            </div>
          </div>
          <div class="esp-dev-features">${featuresHtml}</div>
          <div class="esp-dev-foot">
            ${isConnected ? `
              <span class="esp-linked-tag"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> Linked in Scout Fleet</span>
              <button class="mini-btn mini-btn-danger" data-action="disconnect-esp32" data-id="${d.id}">Disconnect</button>
            ` : `
              <span class="esp-status-avail"><span class="dot-avail"></span> Ready to link</span>
              <button class="btn btn-primary btn-sm" data-action="connect-esp32-discovered" data-id="${d.id}">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><line x1="12" y1="20" x2="12.01" y2="20" stroke-width="3"/></svg>
                Connect Vehicle
              </button>
            `}
          </div>
        </div>`;
      }).join('');
    }

    tabBodyHtml = `
    <div class="esp-scanner-top">
      <div class="esp-scanner-status">
        <span class="scanner-pulse ${isScanning ? 'active' : ''}"></span>
        <span>${isScanning ? 'Scanning 2.4GHz WiFi Subnet...' : `Discovered <b>${discovered.length}</b> ESP32 WiFi vehicles`}</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px;">
        ${discovered.length > 0 ? `
          <button class="btn btn-primary btn-sm" data-action="connect-all-esp32" title="Connect and link all discovered ESP32 units to the scout fleet simultaneously">
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><polyline points="9 11 12 14 22 4"/></svg>
            Connect All Devices
          </button>` : ''}
        <button class="btn btn-secondary btn-sm" data-action="scan-esp32" ${isScanning ? 'disabled' : ''}>
          <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" class="${isScanning ? 'spin' : ''}"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          ${isScanning ? 'Scanning...' : 'Rescan'}
        </button>
      </div>
    </div>
    <div class="esp-dev-list">
      ${devRows}
    </div>
    <div class="esp-tip-box">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
      <div><b>${isLive ? 'Live Hardware Setup:' : 'Quick Connection Guide:'}</b> Connect your computer to your ESP32 rover's WiFi Access Point (e.g. <code>192.168.4.1</code>) or ensure both devices share the same local router. In <b>Live Feeds</b> mode, all simulated data is removed.</div>
    </div>`;
  } else if (activeTab === 'manual') {
    // Manual setup tab
    tabBodyHtml = `
    <div class="esp-manual-form">
      <div class="form-row">
        <label class="form-label">Vehicle Name</label>
        <input type="text" id="manualEspName" class="form-input" value="ESP32-Scout-${rovers.filter(r => r.isEsp32).length + 1}" placeholder="e.g. ESP32-Rover-01 or SkyScout-02" />
      </div>
      <div class="form-row">
        <label class="form-label">Vehicle Type</label>
        <div class="type-radio-pills" id="manualEspTypeGroup">
          <button type="button" class="type-pill active" data-action="set-manual-type" data-type="ground">
            ${typeIcon('ground')} Ground Rover
          </button>
          <button type="button" class="type-pill" data-action="set-manual-type" data-type="aerial">
            ${typeIcon('aerial')} Aerial Drone
          </button>
        </div>
      </div>
      <div class="form-grid-2">
        <div class="form-row">
          <label class="form-label">ESP32 IP / Host</label>
          <input type="text" id="manualEspIp" class="form-input" value="192.168.1.${105 + rovers.filter(r => r.isEsp32).length}" placeholder="192.168.4.1 or 192.168.1.x" />
        </div>
        <div class="form-row">
          <label class="form-label">Stream Port</label>
          <input type="number" id="manualEspPort" class="form-input" value="81" placeholder="81 or 80" />
        </div>
      </div>
      <div class="form-row">
        <label class="form-label">Camera Stream Path</label>
        <input type="text" id="manualEspPath" class="form-input" value="/stream" placeholder="/stream or /mjpeg or /capture" />
      </div>

      <!-- Test stream preview box -->
      <div class="esp-preview-box" id="espTestPreviewBox">
        <div class="preview-header">
          <span>Camera Stream Preview</span>
          <button class="link-btn" data-action="test-esp32-stream" style="color:var(--accent-cyan);font-weight:700;">Test Link &amp; Preview</button>
        </div>
        <div class="preview-screen" id="espTestScreen">
          <div class="preview-placeholder">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="6" width="14" height="12" rx="1.6"/><path d="M16 10.5l6-3.5v10l-6-3.5"/></svg>
            <span>Click "Test Link &amp; Preview" to verify MJPEG video feed</span>
          </div>
        </div>
      </div>
    </div>`;
  } else if (activeTab === 'firmware') {
    tabBodyHtml = `
    <div class="esp-firmware-guide">
      <div class="esp-fw-head">
        <div>
          <div style="font-weight:700;font-size:12px;color:var(--text-0);">Arduino / PlatformIO ESP32-CAM Firmware</div>
          <div style="font-size:10.5px;color:var(--text-2);">Flash your physical ESP32 board to link directly with HYDRA Mission Control.</div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="navigator.clipboard.writeText(document.getElementById('espInoCode').innerText); alert('Arduino .ino firmware code copied to clipboard!');">
          <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copy .INO Sketch
        </button>
      </div>
      <div class="esp-code-container">
        <pre><code id="espInoCode" class="esp-code">// HYDRA Mission Control - ESP32-CAM Physical Rover Firmware
// File saved in project root as: ESP32_HYDRA_ROVER.ino
// 1. Open Arduino IDE -> Select Board: "AI Thinker ESP32-CAM"
// 2. Set PSRAM: "Enabled"
// 3. Connect to "HYDRA-ESP32-ROVER" WiFi (192.168.4.1) or your home router.
// 4. Click "Connect" in HYDRA Scout Rovers to stream live video!

#include "esp_camera.h"
#include &lt;WiFi.h&gt;
#include "esp_http_server.h"

// Camera Pins &amp; Motor Pins configured for AI-Thinker ESP32-CAM
// Endpoints: /stream (Port 81), /status (JSON), /action?go=forward
// Check workspace file: ESP32_HYDRA_ROVER.ino for full source code!</code></pre>
      </div>
      <div class="esp-hw-specs-grid">
        <div class="hw-spec-card">
          <b>Camera Stream</b>
          <span>MJPEG at Port 81 (/stream)</span>
        </div>
        <div class="hw-spec-card">
          <b>Motor Control</b>
          <span>GPIOs 12, 13, 14, 15 (/action)</span>
        </div>
        <div class="hw-spec-card">
          <b>Flashlight LED</b>
          <span>GPIO 4 (/control?var=flash)</span>
        </div>
        <div class="hw-spec-card">
          <b>Telemetry JSON</b>
          <span>Battery &amp; RSSI (/status)</span>
        </div>
      </div>
    </div>`;
  }

  const linkedCount = rovers.filter(r => r.isEsp32).length;

  return `
  <div class="modal-overlay show" id="esp32ModalOverlay" data-action="overlay-close">
    <div class="modal esp32-modal" data-stop="1">
      <div class="modal-header">
        <div class="mh-top-row">
          <div class="mh-icon-title">
            <div class="wifi-modal-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
                <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
                <circle cx="12" cy="20" r="1.5" fill="currentColor"/>
              </svg>
            </div>
            <div>
              <div class="mh-title">Connect ESP32 WiFi Rover &amp; Drone</div>
              <div class="mh-sub">Live 2.4GHz WiFi link for ESP32-CAM, ESP32-S3 &amp; Physical IoT Hardware</div>
            </div>
          </div>
          <button class="modal-close-btn" data-action="close-esp32-modal" aria-label="Close modal">&times;</button>
        </div>

        <!-- Tab Pills -->
        <div class="modal-tabs">
          <button class="modal-tab ${activeTab === 'scanner' ? 'active' : ''}" data-action="switch-esp32-tab" data-tab="scanner">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><line x1="12" y1="20" x2="12.01" y2="20" stroke-width="3"/></svg>
            WiFi Scanner
          </button>
          <button class="modal-tab ${activeTab === 'manual' ? 'active' : ''}" data-action="switch-esp32-tab" data-tab="manual">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            Manual IP Setup
          </button>
          <button class="modal-tab ${activeTab === 'firmware' ? 'active' : ''}" data-action="switch-esp32-tab" data-tab="firmware">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            Arduino Firmware (.ino)
          </button>
        </div>
      </div>

      <div class="modal-body esp-modal-body">
        ${tabBodyHtml}
      </div>

      <div class="modal-footer" style="display:flex;align-items:center;justify-content:space-between;">
        <div style="font-size:11px;color:var(--text-2);display:flex;align-items:center;gap:6px;">
          <span class="esp32-badge" style="margin:0;">${linkedCount} Linked</span>
          <span>ESP32 unit${linkedCount !== 1 ? 's' : ''} active in Scout fleet</span>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn" data-action="close-esp32-modal">Done</button>
          ${activeTab === 'manual' ? `
            <button class="btn btn-primary" data-action="connect-esp32-manual">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><line x1="12" y1="20" x2="12.01" y2="20" stroke-width="3"/></svg>
              Connect &amp; Add to Fleet
            </button>
          ` : ``}
        </div>
      </div>
    </div>
  </div>`;
}

/* ---------- STATION SWITCHER MODAL (10 DISASTER STATIONS IN INDIA) ---------- */
function renderStationModal() {
  if (!state.stationModalOpen) {
    return `<div class="modal-overlay" id="stationModalOverlay"></div>`;
  }

  const currentId = state.selectedStationId || currentStationId || 'guwahati';

  const stationCards = HYDRA_STATIONS.map((s, idx) => {
    const isSelected = s.id === currentId;
    const threatsHtml = s.threats.map(t => `<span class="st-threat-tag">${t}</span>`).join('');

    return `
    <div class="station-card ${isSelected ? 'selected' : ''}" data-action="select-station" data-id="${s.id}">
      <div class="st-top">
        <div class="st-num">#${idx + 1 < 10 ? '0' + (idx + 1) : idx + 1}</div>
        <div class="st-title-group">
          <div class="st-name">${s.name}</div>
          <div class="st-sub">${s.state} &middot; <span style="color:var(--text-3);">${s.region}</span></div>
        </div>
        <div class="st-badges">
          <span class="st-risk-pill ${s.badgeClass}">${s.riskLevel}</span>
        </div>
      </div>
      <div class="st-desc">${s.description}</div>
      <div class="st-threats">${threatsHtml}</div>
      <div class="st-foot">
        <div class="st-stats">
          <span><b>${s.rovers.length}</b> Robotic Fleet Units</span>
          &middot;
          <span><b>${s.hazards.length}</b> Active Hazard Zones</span>
        </div>
        <button class="btn ${isSelected ? 'btn-primary' : 'btn-secondary'} btn-sm" data-action="select-station" data-id="${s.id}">
          ${isSelected ? '<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> Current Station' : 'Deploy Here &rarr;'}
        </button>
      </div>
    </div>`;
  }).join('');

  return `
  <div class="modal-overlay show" id="stationModalOverlay" data-action="overlay-close">
    <div class="modal station-modal" data-stop="1">
      <div class="modal-header">
        <div class="mh-top-row">
          <div class="mh-icon-title">
            <div class="wifi-modal-icon" style="color:var(--accent-amber);border-color:rgba(245,158,11,0.3);background:rgba(245,158,11,0.1);">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div>
              <div class="mh-title">HYDRA Disaster Response Command Stations</div>
              <div class="mh-sub">Select an operational command center across high-vulnerability disaster corridors in India</div>
            </div>
          </div>
          <button class="modal-close-btn" data-action="close-station-modal" aria-label="Close modal">&times;</button>
        </div>
      </div>

      <div class="modal-body station-modal-body">
        <div class="station-grid">
          ${stationCards}
        </div>
      </div>

      <div class="modal-footer" style="display:flex;align-items:center;justify-content:space-between;">
        <div style="font-size:11px;color:var(--text-2);">
          Each station maintains a distinct drone &amp; rover squadron calibrated for localized mountain, coastal, or river delta terrain.
        </div>
        <button class="btn" data-action="close-station-modal">Close</button>
      </div>
    </div>
  </div>`;
}

