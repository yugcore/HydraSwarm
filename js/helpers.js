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
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3v18M3 12h18" opacity="0"/><circle cx="12" cy="12" r="2.3"/><path d="M4 6l5.5 4M20 6l-5.5 4M4 18l5.5-4M20 18l-5.5-4" stroke-linecap="round"/></svg>`;
}
