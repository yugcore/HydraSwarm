/* =========================================================
   HYDRA - HELPER FUNCTIONS
========================================================= */

const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);
const el = (html) => {
  const d = document.createElement('div');
  d.innerHTML = html.trim();
  return d.firstElementChild;
};

function byId(arr, id) {
  return arr.find(x => x.id === id);
}

function battClass(b) {
  return b <= 25 ? 'low' : b <= 55 ? 'mid' : '';
}

function connClass(c) {
  return c;
}

function connPips(c) {
  return `<span class="conn-pips ${connClass(c)}"><i></i><i></i><i></i><i></i></span>`;
}

function badgeClass(status) {
  return {
    Ready: 'badge-ready',
    Deployed: 'badge-deployed',
    Returning: 'badge-returning',
    Offline: 'badge-offline',
    Unavailable: 'badge-unavailable'
  }[status] || '';
}

function statusPillClass(status) {
  return {
    Active: 'status-active',
    Watch: 'status-watch',
    Monitoring: 'status-monitoring',
    Advisory: 'status-advisory',
    Contained: 'status-contained'
  }[status] || '';
}

function sevClass(s) {
  return {
    severe: 'sev-severe',
    moderate: 'sev-moderate',
    low: 'sev-low'
  }[s] || '';
}

function fmtTime(d) {
  return d.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function typeIcon(type) {
  if (type === 'ground') {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="9" width="18" height="9" rx="1.5"/><circle cx="7.5" cy="18" r="1.6"/><circle cx="16.5" cy="18" r="1.6"/><path d="M6 9V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3"/></svg>`;
  }
  if (type === 'heavylift' || type === 'vtol') {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 2l4 7h5l-4 3 2 7-7-4-7 4 2-7-4-3h5z"/><rect x="8" y="10" width="8" height="6" rx="1" fill="none" stroke-width="1.4"/></svg>`;
  }
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3v18M3 12h18" opacity="0"/><circle cx="12" cy="12" r="2.3"/><path d="M4 6l5.5 4M20 6l-5.5 4M4 18l5.5-4M20 18l-5.5-4" stroke-linecap="round"/></svg>`;
}

function payloadIcon(key) {
  switch (key) {
    case 'medikit':
    case 'medikit_trauma':
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><line x1="12" y1="10" x2="12" y2="16"/><line x1="9" y1="13" x2="15" y2="13"/></svg>`;
    case 'plasma':
    case 'plasma_coldbox':
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/><path d="M12 9v6m-3-3h6" stroke-width="1.8"/></svg>`;
    case 'water':
    case 'water_purify':
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/><path d="M9 14a3 3 0 0 0 6 0"/></svg>`;
    case 'rations':
    case 'survival_rations':
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 15h2m4 0h2"/></svg>`;
    case 'raft':
    case 'inflatable_raft':
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="13" rx="9" ry="6"/><ellipse cx="12" cy="13" rx="5" ry="3"/><line x1="12" y1="7" x2="12" y2="10"/><line x1="12" y1="16" x2="12" y2="19"/></svg>`;
    case 'hazmat':
    case 'hazmat_decon':
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M19.07 4.93l-4.24 4.24M9.17 14.83l-4.24 4.24"/></svg>`;
    default:
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`;
  }
}

function heavyAirframeIcon() {
  return `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>`;
}

