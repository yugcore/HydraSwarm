/* =========================================================
   AEGIS - MAIN APP CONTROLLER
========================================================= */

const state = {
  theme: (typeof localStorage !== 'undefined' && localStorage.getItem('aegis_theme')) || 'dark', // 'dark' | 'light'
  mode: 'simulation', // 'simulation' | 'live'
  selectedStationId: 'guwahati',
  stationModalOpen: false,
  activeTargetId: 'ALL', // 'ALL' | hazardId | dropId
  selectedHazardId: null,
  selectedRoverId: null,
  selectedHeavyRoverId: null,
  leftPanelTab: 'rovers', // 'rovers' | 'reinforcements'
  reinforcementFilter: 'all', // 'all' | 'loaded' | 'unloaded' | 'inflight'
  dropDesignationActive: false,
  liveFeedRoverId: null,
  deployModalHazardId: null,
  deployChecked: new Set(),
  esp32ModalOpen: false,
  feedViewMode: 'single', // 'single' | 'grid'
  feedExpanded: false,
  lastUpdate: new Date(),
  isSyncing: false,
};

function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', state.theme);
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('aegis_theme', state.theme);
  }
  render();
}

/* =========================================================
   ROOT RENDER
========================================================= */
function render() {
  const app = $('#app');
  if (!app) return;
  app.innerHTML = `
    ${renderTopbar()}
    <div class="main">
      ${renderRoverPanel()}
      <div class="col col-center">
        ${renderMap()}
        ${renderLiveFeed()}
      </div>
      ${renderHazardPanel()}
    </div>
    ${renderDeployModal()}
    ${typeof renderEsp32Modal === 'function' ? renderEsp32Modal() : ''}
    ${typeof renderStationModal === 'function' ? renderStationModal() : ''}
  `;
  if (state.liveFeedRoverId) {
    startFeedAnim();
  }
}

/* =========================================================
   LIVE API SYNC CONTROLLER
========================================================= */
async function syncLiveHazards() {
  if (state.isSyncing) return;

  // In SIMULATION mode, always keep the active station's authentic local disaster hazards
  if (state.mode === 'simulation') {
    const activeStation = (typeof getStationById === 'function')
      ? getStationById(state.selectedStationId || currentStationId || 'guwahati')
      : AEGIS_STATIONS[0];
    hazards = [...activeStation.hazards];
    state.lastUpdate = new Date();
    render();
    return;
  }

  state.isSyncing = true;
  console.log('[AEGIS] Syncing live regional hazards from USGS India & Open-Meteo...');

  try {
    const liveData = await AEGIS_API.fetchAllLiveHazards();
    if (liveData && liveData.length > 0) {
      hazards = liveData;
      state.lastUpdate = new Date();
      console.log(`[AEGIS] Successfully loaded ${hazards.length} live disaster alerts.`);
    }
  } catch (err) {
    console.error('[AEGIS] Hazard sync error:', err);
  } finally {
    state.isSyncing = false;
    render();
  }
}

/* =========================================================
   DEPLOY MODAL HANDLERS
========================================================= */
function closeDeployModal() {
  state.deployModalHazardId = null;
  state.deployChecked = new Set();
  render();
}

async function confirmDeploy() {
  const hazardId = state.deployModalHazardId;
  const h = byId(hazards, hazardId);
  if (!h) return;

  const roverIds = Array.from(state.deployChecked);

  roverIds.forEach(id => {
    AEGIS_TELEMETRY.startMission(id, hazardId);
  });

  h.status = 'Active';
  state.deployModalHazardId = null;
  state.deployChecked = new Set();
  state.lastUpdate = new Date();

  // Focus and zoom the map onto this new target deployment
  state.activeTargetId = hazardId;
  const targetEnvelope = getTargetEnvelope(hazardId);
  animateViewBoxTo(targetEnvelope);

  // Dispatch via API if backend is available
  await AEGIS_API.dispatchRoverMission(roverIds, hazardId);

  render();
}

/* =========================================================
   MAP CLICK TO AIRDROP REINFORCEMENTS
========================================================= */
function handleMapDropClick(e) {
  if (typeof AEGIS_MAP_INTERACTIONS !== 'undefined' && AEGIS_MAP_INTERACTIONS.hasDragged) return;
  if (!state.dropDesignationActive && state.leftPanelTab !== 'reinforcements') return;
  if (e.target.closest('.map-toolbar') || e.target.closest('.map-controls') || e.target.closest('.map-legend') || e.target.closest('button') || e.target.closest('.rover-info-panel')) return;

  const mapWrap = e.target.closest('.map-wrap');
  if (!mapWrap) return;

  const rect = mapWrap.getBoundingClientRect();
  const relX = (e.clientX - rect.left) / Math.max(1, rect.width);
  const relY = (e.clientY - rect.top) / Math.max(1, rect.height);
  const svgX = currentViewBox.x + relX * currentViewBox.w;
  const svgY = currentViewBox.y + relY * currentViewBox.h;

  if (svgX < 0 || svgX > 1000 || svgY < 0 || svgY > 640) return;

  // Check if click was on or near an existing hazard
  const clickedHazard = hazards.find(h => Math.hypot(h.x - svgX, h.y - svgY) < 32);

  // Find heavy air rover to dispatch
  let roverToDispatch = null;
  if (state.selectedHeavyRoverId) {
    roverToDispatch = heavyRovers.find(r => r.id === state.selectedHeavyRoverId && r.status === 'Ready');
  }
  if (!roverToDispatch) {
    roverToDispatch = heavyRovers.find(r => r.status === 'Ready' && r.payloadStatus === 'loaded');
  }
  if (!roverToDispatch) {
    roverToDispatch = heavyRovers.find(r => r.status === 'Ready');
    if (roverToDispatch) {
      loadHeavyRoverPayload(roverToDispatch.id, 'medikit_trauma');
    }
  }

  if (!roverToDispatch) {
    alert('All Heavy-Lifting Air Rovers are currently in flight. Awaiting Base Return.');
    return;
  }

  const targetLocation = {
    x: clickedHazard ? clickedHazard.x : Math.round(svgX),
    y: clickedHazard ? clickedHazard.y : Math.round(svgY),
    label: clickedHazard ? `${clickedHazard.name.split(',')[0]} Drop Zone` : `Sector (${Math.round(svgX)}, ${Math.round(svgY)})`,
    hazardId: clickedHazard ? clickedHazard.id : null
  };

  const dropRecord = AEGIS_TELEMETRY.startHeavyAirliftMission(roverToDispatch.id, targetLocation, roverToDispatch.payloadId || 'medikit_trauma');
  if (dropRecord) {
    state.activeTargetId = dropRecord.id;
    state.dropDesignationActive = false;
    const envelope = getTargetEnvelope(dropRecord.id);
    animateViewBoxTo(envelope);
    render();
  }
}

/* =========================================================
   EVENT DELEGATION
======================================================== */
document.addEventListener('click', (e) => {
  // 1. Check for Map Airdrop Designation clicks
  if (state.dropDesignationActive || (state.leftPanelTab === 'reinforcements' && e.target.closest('.map-svg'))) {
    const isSpecialBtn = e.target.closest('[data-action]') && !e.target.closest('.map-svg');
    if (!isSpecialBtn) {
      handleMapDropClick(e);
    }
  }

  const overlayClose = e.target.closest('[data-action="overlay-close"]');
  const stopEl = e.target.closest('[data-stop]');
  if (overlayClose && !stopEl) {
    if (state.stationModalOpen) {
      state.stationModalOpen = false;
      render();
      return;
    }
    if (state.esp32ModalOpen) {
      state.esp32ModalOpen = false;
      render();
      return;
    }
    closeDeployModal();
    return;
  }

  const t = e.target.closest('[data-action]');
  if (!t) return;
  const action = t.dataset.action;
  const id = t.dataset.id;

  switch (action) {
    case 'open-station-modal':
      state.stationModalOpen = true;
      render();
      break;
    case 'close-station-modal':
      state.stationModalOpen = false;
      render();
      break;
    case 'select-station':
      if (typeof switchAegisStation === 'function') {
        switchAegisStation(id);
      }
      state.stationModalOpen = false;
      render();
      break;
    case 'set-mode':
      state.mode = t.dataset.mode;
      state.selectedHazardId = null;
      state.selectedRoverId = null;
      state.selectedHeavyRoverId = null;
      state.deployModalHazardId = null;
      if (state.mode === 'live') {
        const realRovers = rovers.filter(r => r.isEsp32);
        state.liveFeedRoverId = realRovers.length > 0 ? realRovers[0].id : null;
        state.feedViewMode = realRovers.length > 1 ? 'grid' : 'single';
        syncLiveHazards();
      } else {
        state.liveFeedRoverId = null;
        state.feedViewMode = 'single';
        // In simulation mode, reload active station's authentic simulated fleet and hazards
        const activeStation = (typeof getStationById === 'function')
          ? getStationById(state.selectedStationId || currentStationId || 'guwahati')
          : AEGIS_STATIONS[0];
        if (typeof switchAegisStation === 'function') {
          switchAegisStation(activeStation.id);
        }
      }
      render();
      break;
    case 'toggle-theme':
      toggleTheme();
      break;
    case 'set-map-view': {
      const target = t.dataset.target || 'ALL';
      state.activeTargetId = target;
      const envelope = getTargetEnvelope(target);
      animateViewBoxTo(envelope);
      render();
      break;
    }
    case 'sync-hazards':
      syncLiveHazards();
      break;
    case 'map-zoom-in':
      if (typeof AEGIS_MAP_INTERACTIONS !== 'undefined') AEGIS_MAP_INTERACTIONS.zoomBy(0.88);
      break;
    case 'map-zoom-out':
      if (typeof AEGIS_MAP_INTERACTIONS !== 'undefined') AEGIS_MAP_INTERACTIONS.zoomBy(1.14);
      break;
    case 'map-reset-zoom':
      if (typeof AEGIS_MAP_INTERACTIONS !== 'undefined') AEGIS_MAP_INTERACTIONS.reset();
      break;
    case 'select-hazard':
      if (typeof AEGIS_MAP_INTERACTIONS !== 'undefined' && AEGIS_MAP_INTERACTIONS.hasDragged) break;
      if (state.selectedHazardId === id) {
        state.selectedHazardId = null;
      } else {
        state.selectedHazardId = id;
        state.activeTargetId = id;
        const envelope = getTargetEnvelope(id);
        animateViewBoxTo(envelope);
      }
      render();
      break;
    case 'select-rover': {
      if (typeof AEGIS_MAP_INTERACTIONS !== 'undefined' && AEGIS_MAP_INTERACTIONS.hasDragged) break;
      const r = byId(rovers, id);
      if (r && (r.status === 'Offline' || r.status === 'Unavailable')) {
        break;
      }
      state.selectedRoverId = state.selectedRoverId === id ? null : id;
      render();
      break;
    }
    case 'deselect-rover':
      state.selectedRoverId = null;
      render();
      break;

    /* ---------- REINFORCEMENT SYSTEM ACTIONS ---------- */
    case 'switch-left-tab':
      state.leftPanelTab = t.dataset.tab || 'rovers';
      render();
      break;
    case 'select-heavy-rover':
      state.selectedHeavyRoverId = state.selectedHeavyRoverId === id ? null : id;
      render();
      break;
    case 'set-reinforce-filter':
      state.reinforcementFilter = t.dataset.filter || 'all';
      render();
      break;
    case 'toggle-drop-designation':
      state.dropDesignationActive = !state.dropDesignationActive;
      state.leftPanelTab = 'reinforcements';
      render();
      break;
    case 'quick-arm-all-medikits':
      armAllHeavyRovers('medikit_trauma');
      render();
      break;
    case 'load-heavy-payload': {
      const selectEl = document.getElementById(`payloadSelect_${id}`);
      const pId = selectEl ? selectEl.value : 'medikit_trauma';
      loadHeavyRoverPayload(id, pId);
      render();
      break;
    }
    case 'quick-load-single':
      loadHeavyRoverPayload(id, t.dataset.payload || 'medikit_trauma');
      render();
      break;
    case 'unload-heavy-payload':
      unloadHeavyRoverPayload(id);
      render();
      break;
    case 'dispatch-heavy-rover':
      state.selectedHeavyRoverId = id;
      state.dropDesignationActive = true;
      state.leftPanelTab = 'reinforcements';
      render();
      break;
    case 'focus-drop-target': {
      const hr = (typeof heavyRovers !== 'undefined') ? heavyRovers.find(r => r.id === id) : null;
      const telem = hr ? AEGIS_TELEMETRY.getRoverTelemetry(hr.id) : null;
      if (telem && telem.dropId) {
        state.activeTargetId = telem.dropId;
        const envelope = getTargetEnvelope(telem.dropId);
        animateViewBoxTo(envelope);
        render();
      }
      break;
    }

    /* ---------- CAMERA FEED ACTIONS ---------- */
    case 'toggle-feed':
      state.liveFeedRoverId = state.liveFeedRoverId === id ? null : id;
      state.feedViewMode = 'single';
      render();
      break;
    case 'set-feed-view':
      state.feedViewMode = t.dataset.view || 'single';
      render();
      break;
    case 'select-active-feed':
      state.liveFeedRoverId = id;
      state.feedViewMode = 'single';
      render();
      break;
    case 'toggle-feed-size':
      state.feedExpanded = !state.feedExpanded;
      render();
      break;
    case 'close-feed':
      state.liveFeedRoverId = null;
      state.feedViewMode = 'single';
      render();
      break;

    /* ---------- SCOUT FLEET DISPATCH ACTIONS ---------- */
    case 'open-deploy': {
      state.deployModalHazardId = id;
      const readyRovers = rovers.filter(r => r.status === 'Ready');
      state.deployChecked = new Set(readyRovers.map(r => r.id));
      render();
      break;
    }
    case 'close-deploy':
      closeDeployModal();
      break;
    case 'toggle-deploy-check':
      if (state.deployChecked.has(id)) {
        state.deployChecked.delete(id);
      } else {
        state.deployChecked.add(id);
      }
      render();
      break;
    case 'deploy-all': {
      const available = rovers.filter(r => r.status === 'Ready');
      state.deployChecked = new Set(available.map(r => r.id));
      render();
      break;
    }
    case 'confirm-deploy':
      confirmDeploy();
      break;
    case 'quick-deploy-single': {
      const roverId = t.dataset.rover;
      const hazardId = t.dataset.hazard;
      if (roverId && hazardId) {
        AEGIS_TELEMETRY.startMission(roverId, hazardId);
        const h = byId(hazards, hazardId);
        if (h) h.status = 'Active';
        state.activeTargetId = hazardId;
        const targetEnvelope = getTargetEnvelope(hazardId);
        animateViewBoxTo(targetEnvelope);
        render();
      }
      break;
    }
    case 'quick-deploy-all-to-hazard': {
      const hazardId = id || t.dataset.id;
      const available = rovers.filter(r => r.status === 'Ready');
      if (hazardId && available.length > 0) {
        available.forEach(r => {
          AEGIS_TELEMETRY.startMission(r.id, hazardId);
        });
        const h = byId(hazards, hazardId);
        if (h) h.status = 'Active';
        state.activeTargetId = hazardId;
        const targetEnvelope = getTargetEnvelope(hazardId);
        animateViewBoxTo(targetEnvelope);
        render();
      }
      break;
    }

    /* ---------- ESP32 ACTIONS ---------- */
    case 'open-esp32-modal':
      state.esp32ModalOpen = true;
      render();
      break;
    case 'close-esp32-modal':
      state.esp32ModalOpen = false;
      render();
      break;
    case 'switch-esp32-tab':
      if (typeof AEGIS_ESP32 !== 'undefined') {
        AEGIS_ESP32.activeTab = t.dataset.tab || 'scanner';
        render();
      }
      break;
    case 'scan-esp32':
      if (typeof AEGIS_ESP32 !== 'undefined') {
        AEGIS_ESP32.scanNetwork();
      }
      break;
    case 'connect-esp32-discovered':
      if (typeof AEGIS_ESP32 !== 'undefined') {
        AEGIS_ESP32.connectDiscovered(id);
      }
      break;
    case 'connect-all-esp32':
      if (typeof AEGIS_ESP32 !== 'undefined') {
        AEGIS_ESP32.connectAllDiscovered();
      }
      break;
    case 'set-manual-type': {
      const parent = t.closest('.type-radio-pills');
      if (parent) {
        parent.querySelectorAll('.type-pill').forEach(b => b.classList.remove('active'));
        t.classList.add('active');
      }
      break;
    }
    case 'test-esp32-stream': {
      const ip = (document.getElementById('manualEspIp')?.value || '192.168.4.1').trim();
      const port = document.getElementById('manualEspPort')?.value || 81;
      const path = document.getElementById('manualEspPath')?.value || '/stream';
      const streamUrl = AEGIS_ESP32.buildStreamUrl(ip, port, path);
      const screen = document.getElementById('espTestScreen');
      if (screen) {
        screen.innerHTML = `
          <div class="test-stream-container">
            <img src="${streamUrl}" class="test-img-stream" alt="Testing stream" 
                 onerror="this.style.display='none'; document.getElementById('testFailMsg').style.display='block';"
                 onload="document.getElementById('testOkBadge').style.display='inline-flex';" />
            <div id="testOkBadge" class="test-badge ok" style="display:none;">Stream Active &bull; ${ip}</div>
            <div id="testFailMsg" class="test-fallback-view" style="display:none;">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--accent-amber)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>Connecting to <b>${ip}</b>... Device ready for fleet link.</span>
            </div>
          </div>`;
      }
      break;
    }
    case 'connect-esp32-manual': {
      const name = (document.getElementById('manualEspName')?.value || 'ESP32-Scout').trim();
      const activePill = document.querySelector('#manualEspTypeGroup .type-pill.active');
      const type = activePill ? activePill.dataset.type : 'ground';
      const ip = (document.getElementById('manualEspIp')?.value || '192.168.4.1').trim();
      const port = document.getElementById('manualEspPort')?.value || 81;
      const streamPath = (document.getElementById('manualEspPath')?.value || '/stream').trim();

      if (typeof AEGIS_ESP32 !== 'undefined') {
        AEGIS_ESP32.connectManual({ name, type, ip, port, streamPath });
      }
      break;
    }
    case 'disconnect-esp32':
      if (typeof AEGIS_ESP32 !== 'undefined') {
        AEGIS_ESP32.disconnectRover(id);
      }
      break;
    case 'clear-all-esp32':
      if (typeof AEGIS_ESP32 !== 'undefined') {
        AEGIS_ESP32.clearAllEsp32();
        render();
      }
      break;
    case 'toggle-esp32-flash':
      if (typeof AEGIS_ESP32 !== 'undefined') {
        AEGIS_ESP32.toggleFlashLed(id);
      }
      break;
    case 'capture-esp32-snapshot':
      if (typeof AEGIS_ESP32 !== 'undefined') {
        AEGIS_ESP32.captureSnapshot(id);
      }
      break;
    case 'cycle-esp32-res': {
      const resList = ['QVGA', 'VGA', 'SVGA', 'XGA', 'HD'];
      const current = AEGIS_ESP32.currentResolution || 'SVGA';
      const nextIdx = (resList.indexOf(current) + 1) % resList.length;
      const nextRes = resList[nextIdx];
      AEGIS_ESP32.setResolution(id, nextRes);
      break;
    }
    case 'esp-drive':
      if (typeof AEGIS_ESP32 !== 'undefined') {
        AEGIS_ESP32.sendVehicleControl(t.dataset.id, t.dataset.cmd);
      }
      break;
  }
});

/* =========================================================
   CLOCK & LIVE TELEMETRY TICK
========================================================= */
setInterval(() => {
  const clock = document.getElementById('clockVal');
  if (clock) clock.textContent = fmtTime(new Date());
  const feedTs = document.getElementById('feedTimestamp');
  if (feedTs) feedTs.textContent = fmtTime(new Date());
}, 1000);

// Live map & telemetry refresh tick (keeps rover positions & ETAs moving smoothly)
setInterval(() => {
  const hasMovingRovers = typeof rovers !== 'undefined' && rovers.some(r => r.status === 'Deployed' || r.status === 'On Site');
  const hasMovingHeavy = typeof heavyRovers !== 'undefined' && heavyRovers.some(r => r.status === 'Deployed' || r.status === 'Returning');

  if (hasMovingRovers || hasMovingHeavy) {
    const mapWrap = document.querySelector('.map-wrap');
    if (mapWrap) {
      // Robust SVG map update without XML parserentity errors
      const svgEl = document.querySelector('.map-svg');
      if (svgEl) {
        const temp = document.createElement('div');
        temp.innerHTML = renderMapSvg();
        const newSvg = temp.firstElementChild;
        if (newSvg) {
          svgEl.replaceWith(newSvg);
        }
      }

      // Smoothly update Target HUD without destroying card wrapper
      const hudEl = document.querySelector('.target-hud-overlay');
      const newHudHtml = renderTargetHudOverlay();
      if (hudEl) {
        if (newHudHtml) {
          const tempHud = document.createElement('div');
          tempHud.innerHTML = newHudHtml;
          if (tempHud.firstElementChild) {
            hudEl.replaceWith(tempHud.firstElementChild);
          }
        } else {
          hudEl.remove();
        }
      } else if (newHudHtml) {
        const mapToolbar = document.querySelector('.map-toolbar');
        if (mapToolbar) {
          mapToolbar.insertAdjacentHTML('afterend', newHudHtml);
        }
      }
    }
  }
}, 350);

// Battery & periodic state drift tick
setInterval(() => {
  state.lastUpdate = new Date();
  const lu = document.getElementById('lastUpdateVal');
  if (lu) lu.textContent = fmtTime(state.lastUpdate);
  if (typeof rovers !== 'undefined') {
    rovers.forEach(r => {
      if (r.status === 'Deployed' && r.battery > 5) {
        r.battery -= (Math.random() < 0.25 ? 1 : 0);
      }
    });
  }
  if (typeof heavyRovers !== 'undefined') {
    heavyRovers.forEach(hr => {
      if (hr.status === 'Deployed' && hr.battery > 5) {
        hr.battery -= (Math.random() < 0.2 ? 1 : 0);
      }
    });
  }
}, 8000);

// Auto-sync live hazard APIs every 30 seconds
setInterval(() => {
  if (state.mode === 'live') {
    syncLiveHazards();
  }
}, 30000);

/* =========================================================
   INITIALIZATION
========================================================= */
function init() {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', state.theme);
  }
  if (typeof AEGIS_ESP32 !== 'undefined' && AEGIS_ESP32.loadSavedDevices) {
    AEGIS_ESP32.loadSavedDevices();
  }
  if (typeof switchAegisStation === 'function') {
    switchAegisStation(state.selectedStationId || 'guwahati');
  }
  if (typeof AEGIS_MAP_INTERACTIONS !== 'undefined') {
    AEGIS_MAP_INTERACTIONS.init();
  }
  render();
  if (state.mode === 'live') {
    syncLiveHazards();
  }
}

document.addEventListener('DOMContentLoaded', init);
if (document.readyState !== 'loading') {
  init();
}
