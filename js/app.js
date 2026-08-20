/* =========================================================
   HYDRA - MAIN APP CONTROLLER
========================================================= */

const state = {
  mode: 'simulation', // 'simulation' | 'live'
  selectedHazardId: null,
  selectedRoverId: null,
  liveFeedRoverId: null,
  deployModalHazardId: null,
  deployChecked: new Set(),
  lastUpdate: new Date(),
  isSyncing: false,
};

/* =========================================================
   ROOT RENDER
========================================================= */
function render() {
  const app = $('#app');
  if (!app) return;
  app.innerHTML = `
    ${renderTopbar()}
    ${renderLiveBanner()}
    ${renderStatusbar()}
    <div class="main">
      ${renderRoverPanel()}
      <div class="col col-center">
        ${renderMap()}
        ${renderLiveFeed()}
      </div>
      ${renderHazardPanel()}
    </div>
    ${renderDeployModal()}
  `;
  if (state.liveFeedRoverId && (state.mode === 'simulation' || state.mode === 'live')) {
    startFeedAnim();
  }
}

/* =========================================================
   LIVE API SYNC CONTROLLER
========================================================= */
async function syncLiveHazards() {
  if (state.isSyncing) return;
  state.isSyncing = true;
  console.log('[HYDRA] Syncing live hazards from USGS, NASA EONET & NOAA...');
  
  try {
    const liveData = await HYDRA_API.fetchAllLiveHazards();
    if (liveData && liveData.length > 0) {
      hazards = liveData;
      state.lastUpdate = new Date();
      console.log(`[HYDRA] Successfully loaded ${hazards.length} live disaster alerts.`);
    }
  } catch (err) {
    console.error('[HYDRA] Hazard sync error:', err);
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

  state.deployChecked.forEach(id => {
    const r = byId(rovers, id);
    if (!r) return;
    r.status = 'Deployed';
    r.hazardId = hazardId;
    r.task = `En route — ${h.name.split(',')[0]}`;
    r.connection = r.connection === 'none' ? 'moderate' : r.connection;
  });
  h.status = 'Active';
  state.deployModalHazardId = null;
  state.deployChecked = new Set();
  state.lastUpdate = new Date();
  
  // Dispatch via API if backend is available
  await HYDRA_API.dispatchRoverMission(roverIds, hazardId);

  render();
}

/* =========================================================
   EVENT DELEGATION
========================================================= */
document.addEventListener('click', (e) => {
  const overlayClose = e.target.closest('[data-action="overlay-close"]');
  const stopEl = e.target.closest('[data-stop]');
  if (overlayClose && !stopEl) {
    closeDeployModal();
    return;
  }

  const t = e.target.closest('[data-action]');
  if (!t) return;
  const action = t.dataset.action;
  const id = t.dataset.id;

  switch (action) {
    case 'set-mode':
      state.mode = t.dataset.mode;
      state.selectedHazardId = null;
      state.selectedRoverId = null;
      state.liveFeedRoverId = null;
      state.deployModalHazardId = null;
      if (state.mode === 'live') {
        syncLiveHazards();
      }
      render();
      break;
    case 'sync-hazards':
      syncLiveHazards();
      break;
    case 'select-hazard':
      state.selectedHazardId = state.selectedHazardId === id ? null : id;
      render();
      break;
    case 'select-rover': {
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
    case 'toggle-feed':
      state.liveFeedRoverId = state.liveFeedRoverId === id ? null : id;
      render();
      break;
    case 'close-feed':
      state.liveFeedRoverId = null;
      render();
      break;
    case 'open-deploy':
      state.deployModalHazardId = id;
      state.deployChecked = new Set();
      render();
      break;
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
  }
});

/* =========================================================
   CLOCK / LAST-UPDATE TICK
========================================================= */
setInterval(() => {
  const clock = document.getElementById('clockVal');
  if (clock) clock.textContent = fmtTime(new Date());
  const feedTs = document.getElementById('feedTimestamp');
  if (feedTs) feedTs.textContent = fmtTime(new Date());
}, 1000);

setInterval(() => {
  if (state.mode === 'simulation' || state.mode === 'live') {
    state.lastUpdate = new Date();
    const lu = document.getElementById('lastUpdateVal');
    if (lu) lu.textContent = fmtTime(state.lastUpdate);
    // subtle battery drift for deployed units
    rovers.forEach(r => {
      if (r.status === 'Deployed' && r.battery > 5) {
        r.battery -= (Math.random() < 0.3 ? 1 : 0);
      }
    });
  }
}, 8000);

// Auto-sync live APIs every 30 seconds
setInterval(() => {
  if (state.mode === 'live') {
    syncLiveHazards();
  }
}, 30000);

/* =========================================================
   INITIALIZATION
========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  render();
  // Fetch initial live feeds in the background
  syncLiveHazards();
});

if (document.readyState !== 'loading') {
  render();
  syncLiveHazards();
}
