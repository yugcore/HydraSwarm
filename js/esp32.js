/* =========================================================
   HYDRA - ESP32 WIFI ROVER & DRONE INTEGRATION MODULE
   Supports Physical ESP32-CAM, ESP32-S3, ESP32-WROVER & Custom IoT Hardware
========================================================= */

const HYDRA_ESP32 = {
  // Discovery & scanner state
  isScanning: false,
  activeTab: 'scanner', // 'scanner' | 'manual' | 'firmware'
  flashLedActive: false,
  currentResolution: 'SVGA', // 'QVGA' | 'VGA' | 'SVGA' | 'XGA' | 'HD'
  testStreamStatus: 'idle', // 'idle' | 'testing' | 'success' | 'error'
  testStreamUrl: '',
  telemetryInterval: null,

  // Discovered / Available ESP32 WiFi network devices (populated via live subnet probing or manual setup)
  discoveredDevices: [],

  /* ---------- PERSISTENCE STORAGE ---------- */
  STORAGE_KEY: 'hydra_esp32_rovers',

  loadSavedDevices() {
    try {
      const saved = (typeof localStorage !== 'undefined') ? localStorage.getItem(this.STORAGE_KEY) : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.forEach(dev => {
            this.addRoverToFleet(dev, false);
          });
        }
      }
    } catch (e) {
      console.warn('[HYDRA ESP32] Failed to load saved devices:', e);
    }
  },

  clearAllEsp32() {
    // Remove all ESP32 units from active fleet
    const nonEsp = rovers.filter(r => !r.isEsp32);
    rovers.length = 0;
    rovers.push(...nonEsp);
    this.discoveredDevices = [];
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
    if (typeof state !== 'undefined') {
      state.liveFeedRoverId = null;
      state.feedViewMode = 'single';
    }
    console.log('[HYDRA ESP32] Cleared all linked WiFi hardware devices from fleet.');
  },

  saveFleetDevices() {
    try {
      const espRovers = rovers.filter(r => r.isEsp32);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(espRovers));
      }
    } catch (e) {
      console.warn('[HYDRA ESP32] Failed to persist devices:', e);
    }
  },

  /* ---------- REAL NETWORK SCANNER ---------- */
  lastScanStats: null,

  async scanNetwork() {
    this.isScanning = true;
    if (typeof render === 'function') render();

    console.log('[HYDRA ESP32] Probing local network interfaces for real ESP32 boards...');

    try {
      const backendUrl = typeof HYDRA_API !== 'undefined' && HYDRA_API.endpoints?.localBackend 
        ? `${HYDRA_API.endpoints.localBackend}/esp32/scan` 
        : '/api/esp32/scan';
      
      const res = await fetch(backendUrl, { signal: AbortSignal.timeout(8000) }).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        this.lastScanStats = {
          hostsScanned: data.totalHostsScanned || 254,
          portsScanned: data.portsScanned ? data.portsScanned.length : 11,
          durationMs: data.scanDurationMs || 800,
          subnets: data.subnetsScanned || ['Local Subnet'],
          scannedAt: new Date().toLocaleTimeString()
        };

        if (data && Array.isArray(data.devices)) {
          this.discoveredDevices = data.devices;
        }
      }
    } catch (e) {
      console.info('[HYDRA ESP32] Backend scan fallback:', e);
    }

    // Direct browser probe fallback for 192.168.4.1 (ESP32 SoftAP hotspot)
    await this.probeRealHardwareSubnet();

    this.isScanning = false;
    if (typeof render === 'function') render();
    console.log(`[HYDRA ESP32] Scan complete. ${this.discoveredDevices.length} real hardware devices found.`);
  },

  // Direct probe for ESP32 hotspot AP and local router candidates
  async probeRealHardwareSubnet() {
    const candidateIps = ['192.168.4.1', '192.168.1.1', '192.168.0.1'];
    await Promise.all(candidateIps.map(ip => {
      return new Promise((resolve) => {
        const img = new Image();
        let done = false;
        img.onload = () => {
          if (!done) {
            done = true;
            console.log(`[HYDRA ESP32] Real ESP32 camera hardware verified online at ${ip}!`);
            if (!this.discoveredDevices.some(d => d.ip === ip)) {
              this.discoveredDevices.push({
                id: `ESP-AP-${ip.replace(/\./g, '-')}`,
                name: `ESP32-CAM Hotspot (${ip})`,
                type: 'ground',
                ip: ip,
                port: 81,
                streamPath: '/stream',
                rssi: -38,
                battery: 95,
                chipset: 'AI-Thinker ESP32-CAM',
                status: 'Online (Direct Hotspot)',
                isRealHardware: true,
                features: ['Direct Hotspot Stream', 'Real-Time WiFi Link']
              });
            }
            resolve();
          }
        };
        img.onerror = () => { if (!done) { done = true; resolve(); } };
        setTimeout(() => { if (!done) { done = true; resolve(); } }, 400);
        img.src = `http://${ip}:81/stream?probe=${Date.now()}`;
      });
    }));
  },

  /* ---------- CONNECT TO ROVER ---------- */
  connectDiscovered(id) {
    const dev = this.discoveredDevices.find(d => d.id === id);
    if (!dev) return false;

    // Check if already in fleet
    const existing = rovers.find(r => r.id === dev.id || (r.isEsp32 && r.ip === dev.ip));
    if (existing) {
      existing.status = 'Ready';
      existing.connection = 'strong';
      existing.task = 'Standing by — ESP32 WiFi Connected';
      if (typeof state !== 'undefined') {
        state.selectedRoverId = existing.id;
      }
      this.saveFleetDevices();
      if (typeof render === 'function') render();
      return true;
    }

    const success = this.addRoverToFleet(dev, true);
    if (typeof render === 'function') render();
    return success;
  },

  connectAllDiscovered() {
    let connectedCount = 0;
    this.discoveredDevices.forEach(d => {
      const existing = rovers.find(r => r.id === d.id || (r.isEsp32 && r.ip === d.ip));
      if (!existing) {
        this.addRoverToFleet(d, false);
        connectedCount++;
      }
    });

    if (rovers.length > 0 && typeof state !== 'undefined' && !state.liveFeedRoverId) {
      const firstEsp = rovers.find(r => r.isEsp32);
      if (firstEsp) state.liveFeedRoverId = firstEsp.id;
    }

    this.saveFleetDevices();
    if (typeof render === 'function') render();
    console.log(`[HYDRA ESP32] Batch connected ${connectedCount} WiFi devices to fleet.`);
    return true;
  },

  connectManual(config) {
    const id = `ESP-${Date.now().toString(36).toUpperCase().slice(-4)}`;
    const newDev = {
      id,
      name: config.name || `ESP32-${config.type === 'aerial' ? 'Drone' : 'Rover'}`,
      type: config.type || 'ground',
      ip: config.ip || '192.168.4.1',
      port: parseInt(config.port, 10) || 81,
      streamPath: config.streamPath || '/stream',
      rssi: -52,
      mac: config.mac || `24:6F:28:${Math.floor(Math.random()*90+10)}:${Math.floor(Math.random()*90+10)}:${Math.floor(Math.random()*90+10)}`,
      battery: 100,
      chipset: 'ESP32-CAM WiFi Hardware',
      status: 'Ready',
      features: ['Live MJPEG Stream', 'Direct WiFi Control', 'Physical Hardware Link']
    };

    const success = this.addRoverToFleet(newDev, true);
    if (typeof render === 'function') render();
    return success;
  },

  addRoverToFleet(dev, shouldSelect = true) {
    const isAerial = dev.type === 'aerial';
    const streamUrl = this.buildStreamUrl(dev.ip, dev.port, dev.streamPath);

    // Initial tactical map placement (near depot or staging)
    const baseCoords = isAerial 
      ? { x: 260 + Math.floor(Math.random() * 60), y: 530 + Math.floor(Math.random() * 40) }
      : { x: 140 + Math.floor(Math.random() * 80), y: 490 + Math.floor(Math.random() * 40) };

    const newRover = {
      id: dev.id,
      name: dev.name,
      type: dev.type,
      status: 'Ready',
      battery: dev.battery || 95,
      connection: 'strong',
      task: 'Standing by — ESP32 WiFi Link Active',
      x: baseCoords.x,
      y: baseCoords.y,
      home: { x: baseCoords.x, y: baseCoords.y },
      isEsp32: true,
      ip: dev.ip,
      port: dev.port || 81,
      streamPath: dev.streamPath || '/stream',
      streamUrl: streamUrl,
      rssi: dev.rssi || -50,
      mac: dev.mac || 'ESP32-WIFI',
      chipset: dev.chipset || 'ESP32-CAM',
      features: dev.features || ['MJPEG Stream', 'WiFi Direct'],
      isHardwareLive: false
    };

    // Check if rover already exists
    const idx = rovers.findIndex(r => r.id === newRover.id);
    if (idx >= 0) {
      rovers[idx] = { ...rovers[idx], ...newRover };
    } else {
      rovers.unshift(newRover); // Put at top of Scout Rovers list for high visibility
    }

    // Initialize telemetry model
    if (typeof HYDRA_TELEMETRY !== 'undefined' && HYDRA_TELEMETRY.initRoverTelemetry) {
      HYDRA_TELEMETRY.initRoverTelemetry(newRover);
    }

    if (shouldSelect && typeof state !== 'undefined') {
      state.selectedRoverId = newRover.id;
    }

    this.saveFleetDevices();
    this.startTelemetryPolling();
    return true;
  },

  disconnectRover(roverId) {
    const idx = rovers.findIndex(r => r.id === roverId && r.isEsp32);
    if (idx >= 0) {
      rovers.splice(idx, 1);
      if (typeof state !== 'undefined') {
        if (state.selectedRoverId === roverId) state.selectedRoverId = null;
        if (state.liveFeedRoverId === roverId) state.liveFeedRoverId = null;
      }
      this.saveFleetDevices();
      if (typeof render === 'function') render();
      return true;
    }
    return false;
  },

  /* ---------- STREAM & URL UTILITIES ---------- */
  buildStreamUrl(ip, port, streamPath) {
    const cleanIp = (ip || '192.168.4.1').trim().replace(/^https?:\/\//i, '');
    const cleanPort = port ? `:${port}` : '';
    const cleanPath = (streamPath || '/stream').startsWith('/') ? streamPath : `/${streamPath}`;
    return `http://${cleanIp}${cleanPort}${cleanPath}`;
  },

  /* ---------- REAL HARDWARE TELEMETRY POLLING ---------- */
  startTelemetryPolling() {
    if (this.telemetryInterval) return;
    this.telemetryInterval = setInterval(async () => {
      const espRovers = rovers.filter(r => r.isEsp32);
      for (const r of espRovers) {
        if (!r.ip) continue;
        try {
          const t0 = performance.now();
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1200);

          // Probe /status or /telemetry endpoint on real ESP32
          const res = await fetch(`http://${r.ip}/status`, { signal: controller.signal }).catch(() => null);
          clearTimeout(timeoutId);

          if (res && res.ok) {
            const data = await res.json().catch(() => null);
            const pingMs = Math.round(performance.now() - t0);
            r.isHardwareLive = true;
            r.connection = 'strong';
            if (data) {
              if (data.battery !== undefined) r.battery = data.battery;
              if (data.rssi !== undefined) r.rssi = data.rssi;
              if (data.heading !== undefined || data.lat !== undefined || data.x !== undefined) {
                HYDRA_TELEMETRY.setLiveHardwareTelemetry(r.id, data);
              }
            }
          }
        } catch (e) {
          // Hardware offline or standard simulation mode
        }
      }
    }, 2000);
  },

  /* ---------- ESP32-CAM HARDWARE COMMANDS (UNIVERSAL PROTOCOL) ---------- */
  async toggleFlashLed(roverId) {
    const r = rovers.find(x => x.id === roverId && x.isEsp32);
    this.flashLedActive = !this.flashLedActive;
    console.log(`[HYDRA ESP32] Flash LED on ${r ? r.name : 'rover'} set to: ${this.flashLedActive ? 'ON' : 'OFF'}`);

    if (r && r.ip) {
      const val = this.flashLedActive ? 255 : 0;
      // Send standard ESP32-CAM camera web server GPIO 4 intensity
      fetch(`http://${r.ip}/control?var=led_intensity&val=${val}`, { mode: 'no-cors' }).catch(() => {});
      // Fallback Arduino car flash toggles
      fetch(`http://${r.ip}/flash?val=${this.flashLedActive ? 1 : 0}`, { mode: 'no-cors' }).catch(() => {});
      fetch(`http://${r.ip}/control?var=flash&val=${this.flashLedActive ? 1 : 0}`, { mode: 'no-cors' }).catch(() => {});
    }

    if (typeof render === 'function') render();
  },

  async setResolution(roverId, resName) {
    this.currentResolution = resName;
    const r = rovers.find(x => x.id === roverId && x.isEsp32);
    console.log(`[HYDRA ESP32] Setting resolution on ${r ? r.name : 'rover'} to: ${resName}`);

    const resMap = { 'QVGA': 4, 'VGA': 6, 'SVGA': 7, 'XGA': 8, 'HD': 9 };
    const frameSize = resMap[resName] || 7;

    if (r && r.ip) {
      // Standard ESP32-CAM framesize command
      fetch(`http://${r.ip}/control?var=framesize&val=${frameSize}`, { mode: 'no-cors' }).catch(() => {});
    }

    if (typeof render === 'function') render();
  },

  captureSnapshot(roverId) {
    const r = rovers.find(x => x.id === roverId);
    const filename = `HYDRA_ESP32_${r ? r.name.replace(/\s+/g, '_') : 'CAPTURE'}_${Date.now()}.jpg`;

    // Try high-res physical hardware capture first if online
    if (r && r.ip) {
      const a = document.createElement('a');
      a.href = `http://${r.ip}/capture?t=${Date.now()}`;
      a.download = filename;
      a.target = '_blank';
    }

    const canvas = document.getElementById('feedCanvas');
    const imgEl = document.getElementById('esp32StreamImg');

    if (imgEl && imgEl.naturalWidth > 0) {
      try {
        const c = document.createElement('canvas');
        c.width = imgEl.naturalWidth;
        c.height = imgEl.naturalHeight;
        const ctx = c.getContext('2d');
        ctx.drawImage(imgEl, 0, 0);
        
        ctx.font = '16px monospace';
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(`HYDRA MISSION CONTROL // ESP32-CAM [${r ? r.ip : 'LIVE'}]`, 14, 28);
        ctx.fillText(new Date().toISOString(), 14, 48);

        const a = document.createElement('a');
        a.download = filename;
        a.href = c.toDataURL('image/jpeg', 0.92);
        a.click();
        return;
      } catch (e) {}
    }

    if (canvas) {
      const a = document.createElement('a');
      a.download = filename;
      a.href = canvas.toDataURL('image/jpeg', 0.92);
      a.click();
    }
  },

  currentCommand: 'stop',

  sendVehicleControl(roverId, command) {
    this.currentCommand = command;
    const r = rovers.find(x => x.id === roverId && x.isEsp32);
    console.log(`[HYDRA ESP32] Motor command to ${r ? r.name : roverId}: ${command}`);

    // Update live HUD driving badge
    const badge = document.getElementById('espDriveHudBadge');
    if (badge) {
      const labels = {
        forward: '▲ FORWARD',
        backward: '▼ REVERSE',
        left: '◀ STEER LEFT',
        right: '▶ STEER RIGHT',
        stop: '■ MOTORS IDLE'
      };
      badge.textContent = labels[command] || command.toUpperCase();
      badge.className = `lf-tag drive-tag ${command !== 'stop' ? 'active' : ''}`;
    }

    // Highlight D-Pad buttons
    document.querySelectorAll('.dpad-btn').forEach(btn => {
      if (btn.dataset.cmd === command) {
        btn.classList.add('active');
        if (command !== 'stop') {
          setTimeout(() => btn.classList.remove('active'), 300);
        }
      } else if (command === 'stop') {
        btn.classList.remove('active');
      }
    });

    if (r && r.ip) {
      // 1. Standard ESP32 Web Server Action
      fetch(`http://${r.ip}/action?go=${encodeURIComponent(command)}`, { mode: 'no-cors' }).catch(() => {});
      
      // 2. Standard Arduino Web Car Val (1=Forward, 2=Backward, 3=Left, 4=Right, 0=Stop)
      const carValMap = { forward: 1, backward: 2, left: 3, right: 4, stop: 0 };
      if (carValMap[command] !== undefined) {
        fetch(`http://${r.ip}/car?val=${carValMap[command]}`, { mode: 'no-cors' }).catch(() => {});
      }

      // 3. Simple Single-Char Direction Endpoint (F, B, L, R, S)
      const charMap = { forward: 'F', backward: 'B', left: 'L', right: 'R', stop: 'S' };
      if (charMap[command]) {
        fetch(`http://${r.ip}/cmd?dir=${charMap[command]}`, { mode: 'no-cors' }).catch(() => {});
      }
    }
  }
};

/* ---------- KEYBOARD TELEOPERATION LISTENER (WASD / ARROW KEYS) ---------- */
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    // Only capture if live feed of an ESP32 rover is open and not typing in an input field
    if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
    if (typeof state === 'undefined' || !state.liveFeedRoverId) return;

    const r = byId(rovers, state.liveFeedRoverId);
    if (!r || !r.isEsp32) return;

    const key = e.key.toLowerCase();
    if (key === 'w' || key === 'arrowup') {
      HYDRA_ESP32.sendVehicleControl(r.id, 'forward');
    } else if (key === 's' || key === 'arrowdown') {
      HYDRA_ESP32.sendVehicleControl(r.id, 'backward');
    } else if (key === 'a' || key === 'arrowleft') {
      HYDRA_ESP32.sendVehicleControl(r.id, 'left');
    } else if (key === 'd' || key === 'arrowright') {
      HYDRA_ESP32.sendVehicleControl(r.id, 'right');
    } else if (key === ' ' || key === 'x') {
      HYDRA_ESP32.sendVehicleControl(r.id, 'stop');
    } else if (key === 'f') {
      HYDRA_ESP32.toggleFlashLed(r.id);
    } else if (key === 'c') {
      HYDRA_ESP32.captureSnapshot(r.id);
    }
  });

  window.addEventListener('keyup', (e) => {
    if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
    if (typeof state === 'undefined' || !state.liveFeedRoverId) return;
    const r = byId(rovers, state.liveFeedRoverId);
    if (!r || !r.isEsp32) return;

    const key = e.key.toLowerCase();
    if (['w', 's', 'a', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
      HYDRA_ESP32.sendVehicleControl(r.id, 'stop');
    }
  });
}

// Auto-load saved ESP32 devices when script executes
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    HYDRA_ESP32.loadSavedDevices();
  });
}
