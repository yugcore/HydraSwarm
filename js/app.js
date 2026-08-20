/* =========================================================
   HYDRA - MAIN APP CONTROLLER
========================================================= */

const state = {
  theme: (typeof localStorage !== 'undefined' && localStorage.getItem('hydra_theme')) || 'dark', // 'dark' | 'light'
  mode: 'simulation', // 'simulation' | 'live'
  activeTargetId: 'ALL', // 'ALL' | hazardId
  selectedHazardId: null,
  selectedRoverId: null,
  liveFeedRoverId: null,
  deployModalHazardId: null,
  deployChecked: new Set(),
  lastUpdate: new Date(),
  isSyncing: false,
};

function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', state.theme);
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('hydra_theme', state.theme);
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

  roverIds.forEach(id => {
    HYDRA_TELEMETRY.startMission(id, hazardId);
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
  if ((state.mode === 'simulation' || state.mode === 'live') && typeof rovers !== 'undefined') {
    const hasMovingRovers = rovers.some(r => r.status === 'Deployed' || r.status === 'On Site');
    if (hasMovingRovers) {
      const mapWrap = document.querySelector('.map-wrap');
      if (mapWrap) {
        // Smoothly update SVG inner contents without destroying SVG root
        const svgEl = document.querySelector('.map-svg');
        if (svgEl) {
          const newSvgHtml = renderMapSvg();
          const parsed = new DOMParser().parseFromString(newSvgHtml, 'image/svg+xml').documentElement;
          if (parsed && parsed.innerHTML) {
            svgEl.innerHTML = parsed.innerHTML;
          }
        }

        // Smoothly update Target HUD without destroying card wrapper
        const hudEl = document.querySelector('.target-hud-overlay');
        const newHudHtml = renderTargetHudOverlay();
        if (hudEl) {
          if (newHudHtml) {
            const parsedHud = new DOMParser().parseFromString(newHudHtml, 'text/html').body.firstElementChild;
            if (parsedHud) hudEl.innerHTML = parsedHud.innerHTML;
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
  }
}, 350);

// Battery & periodic state drift tick
setInterval(() => {
  if (state.mode === 'simulation' || state.mode === 'live') {
    state.lastUpdate = new Date();
    const lu = document.getElementById('lastUpdateVal');
    if (lu) lu.textContent = fmtTime(state.lastUpdate);
    rovers.forEach(r => {
      if (r.status === 'Deployed' && r.battery > 5) {
        r.battery -= (Math.random() < 0.25 ? 1 : 0);
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
  render();
  syncLiveHazards();
}

document.addEventListener('DOMContentLoaded', init);
if (document.readyState !== 'loading') {
  init();
}
