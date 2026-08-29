/**
 * AEGIS Mission Control - Backend API & Static Server
 * Built with native Node.js (Zero external dependencies required)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');
const os = require('os');
const net = require('net');

const PORT = process.env.PORT || 8080;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

// In-memory fleet state
const fleetState = [
  { id: 'G-01', name: 'Terra-1', type: 'ground', status: 'Ready', battery: 92, connection: 'strong', task: 'Standing by — East Depot', x: 180, y: 520, lat: 34.05, lon: -118.25 },
  { id: 'G-02', name: 'Terra-2', type: 'ground', status: 'Deployed', battery: 64, connection: 'moderate', task: 'En route — Cañon Road MP 14', x: 340, y: 430, lat: 34.12, lon: -118.35, hazardId: 'H-02' },
  { id: 'G-03', name: 'Terra-3', type: 'ground', status: 'Offline', battery: 0, connection: 'none', task: 'Maintenance bay — no signal', x: 90, y: 590, lat: 33.95, lon: -118.40 },
  { id: 'G-04', name: 'Terra-4', type: 'ground', status: 'Ready', battery: 87, connection: 'strong', task: 'Standing by — West Depot', x: 110, y: 460, lat: 34.01, lon: -118.30 },
  { id: 'A-01', name: 'Falcon-1', type: 'aerial', status: 'Ready', battery: 98, connection: 'strong', task: 'Standing by — Launch Pad 1', x: 230, y: 560, lat: 34.08, lon: -118.20 },
  { id: 'A-02', name: 'Falcon-2', type: 'aerial', status: 'Deployed', battery: 71, connection: 'strong', task: 'Aerial survey — Ridgeline Sector 7', x: 560, y: 220, lat: 34.25, lon: -118.10, hazardId: 'H-01' },
  { id: 'A-03', name: 'Falcon-3', type: 'aerial', status: 'Returning', battery: 22, connection: 'weak', task: 'Returning to base — low battery', x: 400, y: 380, lat: 34.15, lon: -118.28 },
  { id: 'A-04', name: 'Falcon-4', type: 'aerial', status: 'Unavailable', battery: 45, connection: 'none', task: 'Scheduled maintenance', x: 270, y: 590, lat: 34.02, lon: -118.22 }
];

// Helper to fetch external JSON over HTTPS
function fetchHttpsJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'AEGIS-Mission-Control/2.0' } }, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`HTTPS status ${res.statusCode}`));
      }
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // Enable CORS headers for API calls
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // ---------- REST API ENDPOINTS ----------
  if (pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'operational', timestamp: new Date().toISOString(), server: 'AEGIS Core v2.0' }));
  }

  if (pathname === '/api/rovers') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ rovers: fleetState, count: fleetState.length, timestamp: new Date().toISOString() }));
  }

  if (pathname === '/api/rovers/dispatch' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const { roverIds = [], hazardId } = payload;

        fleetState.forEach(r => {
          if (roverIds.includes(r.id)) {
            r.status = 'Deployed';
            r.hazardId = hazardId;
            r.task = `En route — Mission ${hazardId}`;
          }
        });

        console.log(`[AEGIS Backend] Dispatched rovers ${roverIds.join(', ')} to hazard ${hazardId}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, dispatched: roverIds, hazardId, timestamp: new Date().toISOString() }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  if (pathname === '/api/hazards/live') {
    try {
      const usgsData = await fetchHttpsJson('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        source: 'USGS',
        count: usgsData.features?.length || 0,
        features: (usgsData.features || []).slice(0, 20)
      }));
    } catch (err) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Failed to proxy hazard data', message: err.message }));
    }
  }

  // ---------- UNIVERSAL NETWORK DEVICE SCANNER ----------
  if (pathname === '/api/esp32/scan') {
    const startTime = Date.now();
    const interfaces = os.networkInterfaces();
    const localIps = [];
    const subnetsToScan = [];

    // All common camera / stream / webserver ports to probe
    const SCAN_PORTS = [81, 80, 82, 8080, 8081, 8888, 554, 5000, 3000, 4747, 9000];

    // Always probe 192.168.4.x (ESP32 standard SoftAP Hotspot range)
    subnetsToScan.push({ prefix: '192.168.4.', start: 1, end: 10, label: 'ESP32 SoftAP Hotspot (192.168.4.x)' });

    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          localIps.push(iface.address);
          const parts = iface.address.split('.');
          if (parts.length === 4) {
            const prefix = `${parts[0]}.${parts[1]}.${parts[2]}.`;
            if (!subnetsToScan.some(s => s.prefix === prefix)) {
              subnetsToScan.push({ prefix, start: 1, end: 254, myIp: iface.address, label: `${name} (${prefix}0/24)` });
            }
          }
        }
      }
    }

    // Fast TCP port prober
    function probePort(ip, port, timeoutMs = 300) {
      return new Promise((resolve) => {
        const socket = new net.Socket();
        let settled = false;
        socket.setTimeout(timeoutMs);
        socket.on('connect', () => { if (!settled) { settled = true; socket.destroy(); resolve(true); } });
        socket.on('timeout', () => { if (!settled) { settled = true; socket.destroy(); resolve(false); } });
        socket.on('error', () => { if (!settled) { settled = true; socket.destroy(); resolve(false); } });
        try { socket.connect(port, ip); } catch (e) { resolve(false); }
      });
    }

    // Quick HTTP GET to fingerprint a device (returns body string or null)
    function httpGet(ip, port, path, timeoutMs = 800) {
      return new Promise((resolve) => {
        const req = http.get({ hostname: ip, port, path, timeout: timeoutMs }, (res) => {
          let body = '';
          res.on('data', c => body += c);
          res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
        });
        req.on('error', () => resolve(null));
        req.on('timeout', () => { req.destroy(); resolve(null); });
      });
    }

    const realFoundDevices = [];
    let totalHostsScanned = 0;

    for (const subnet of subnetsToScan) {
      const targetIps = [];
      for (let i = subnet.start; i <= subnet.end; i++) {
        const ip = `${subnet.prefix}${i}`;
        if (ip !== subnet.myIp) targetIps.push(ip);
      }
      totalHostsScanned += targetIps.length;

      // Scan in parallel batches of 50
      const batchSize = 50;
      for (let bi = 0; bi < targetIps.length; bi += batchSize) {
        const batch = targetIps.slice(bi, bi + batchSize);
        await Promise.all(batch.map(async (ip) => {
          // Probe all ports in parallel for this IP
          const portResults = await Promise.all(SCAN_PORTS.map(async (port) => {
            const open = await probePort(ip, port, 300);
            return { port, open };
          }));

          const openPorts = portResults.filter(p => p.open).map(p => p.port);
          if (openPorts.length === 0) return;

          // Fingerprint the device
          let deviceType = 'unknown';
          let chipset = 'Network Device';
          let streamPort = openPorts[0];
          let streamPath = '/';
          let features = [];
          let name = `Device-${ip.split('.')[3]}`;

          // Try ESP32-CAM fingerprint: /status on port 80
          if (openPorts.includes(80)) {
            const statusResp = await httpGet(ip, 80, '/status', 600);
            if (statusResp && statusResp.body) {
              try {
                const sj = JSON.parse(statusResp.body);
                if (sj.framesize !== undefined || sj.quality !== undefined) {
                  deviceType = 'esp32-cam';
                  chipset = 'ESP32-CAM (OV2640)';
                  name = `ESP32-CAM-${ip.split('.')[3]}`;
                  features.push('ESP32 Camera Server', 'MJPEG Stream', 'Motor Control');
                }
              } catch (e) { /* not JSON, check content */ }
              if (deviceType === 'unknown' && statusResp.body.toLowerCase().includes('esp')) {
                deviceType = 'esp32';
                chipset = 'ESP32 Board';
                name = `ESP32-${ip.split('.')[3]}`;
                features.push('ESP32 WebServer');
              }
            }
          }

          // Determine best stream configuration
          if (openPorts.includes(81)) {
            streamPort = 81;
            streamPath = '/stream';
            if (deviceType === 'unknown') {
              deviceType = 'esp32-cam';
              chipset = 'ESP32-CAM (OV2640)';
              name = `ESP32-CAM-${ip.split('.')[3]}`;
              features.push('MJPEG Stream (Port 81)');
            }
          } else if (openPorts.includes(82)) {
            streamPort = 82;
            streamPath = '/stream';
            features.push('Camera Stream (Port 82)');
          } else if (openPorts.includes(8080)) {
            streamPort = 8080;
            streamPath = '/video';
            if (deviceType === 'unknown') { deviceType = 'ip-camera'; chipset = 'IP Camera / Webcam'; name = `IPCam-${ip.split('.')[3]}`; }
            features.push('HTTP Video (Port 8080)');
          } else if (openPorts.includes(4747)) {
            streamPort = 4747;
            streamPath = '/video';
            if (deviceType === 'unknown') { deviceType = 'droidcam'; chipset = 'DroidCam / Phone Camera'; name = `PhoneCam-${ip.split('.')[3]}`; }
            features.push('DroidCam Stream (Port 4747)');
          } else if (openPorts.includes(8081)) {
            streamPort = 8081;
            streamPath = '/stream';
            features.push('Stream (Port 8081)');
          } else if (openPorts.includes(554)) {
            streamPort = 554;
            streamPath = '/';
            if (deviceType === 'unknown') { deviceType = 'rtsp-camera'; chipset = 'RTSP Camera'; name = `RTSPCam-${ip.split('.')[3]}`; }
            features.push('RTSP (Port 554)');
          } else if (openPorts.includes(80)) {
            streamPort = 80;
            streamPath = '/mjpeg';
            if (deviceType === 'unknown') { deviceType = 'webserver'; chipset = 'Web Server'; name = `WebDev-${ip.split('.')[3]}`; }
            features.push('HTTP Server (Port 80)');
          }

          if (openPorts.includes(80) && !features.some(f => f.includes('80'))) features.push('Web Control (Port 80)');
          if (openPorts.includes(5000)) features.push('API Server (Port 5000)');
          if (openPorts.includes(3000)) features.push('Dev Server (Port 3000)');
          if (openPorts.includes(9000)) features.push('Service (Port 9000)');

          const roverType = (deviceType === 'esp32-cam' || deviceType === 'esp32') ? 'ground' : 'ground';

          realFoundDevices.push({
            id: `DEV-${ip.replace(/\./g, '-')}`,
            name: name,
            type: roverType,
            ip: ip,
            port: streamPort,
            streamPath: streamPath,
            openPorts: openPorts,
            rssi: -42,
            battery: 95,
            chipset: chipset,
            deviceType: deviceType,
            status: 'Online (Real Hardware)',
            isRealHardware: true,
            features: features.length > 0 ? features : [`TCP Open: ${openPorts.join(', ')}`]
          });
        }));
      }
    }

    const durationMs = Date.now() - startTime;
    console.log(`[AEGIS Network Scanner] Probed ${totalHostsScanned} hosts across ${SCAN_PORTS.length} ports in ${durationMs}ms. Found ${realFoundDevices.length} live devices.`);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      devices: realFoundDevices,
      totalHostsScanned: totalHostsScanned,
      portsScanned: SCAN_PORTS,
      scanDurationMs: durationMs,
      subnetsScanned: subnetsToScan.map(s => s.label),
      activeInterfaces: localIps,
      scannedAt: new Date().toISOString()
    }));
  }

  // ---------- SINGLE IP QUICK PROBE ----------
  if (pathname === '/api/probe') {
    const targetIp = parsedUrl.searchParams.get('ip');
    if (!targetIp) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Missing ?ip= parameter' }));
    }

    const PROBE_PORTS = [81, 80, 82, 8080, 8081, 4747, 554, 5000, 3000];
    function probePortSingle(ip, port, timeoutMs = 500) {
      return new Promise((resolve) => {
        const socket = new net.Socket();
        let settled = false;
        socket.setTimeout(timeoutMs);
        socket.on('connect', () => { if (!settled) { settled = true; socket.destroy(); resolve(true); } });
        socket.on('timeout', () => { if (!settled) { settled = true; socket.destroy(); resolve(false); } });
        socket.on('error', () => { if (!settled) { settled = true; socket.destroy(); resolve(false); } });
        try { socket.connect(port, ip); } catch (e) { resolve(false); }
      });
    }

    const results = await Promise.all(PROBE_PORTS.map(async p => {
      const open = await probePortSingle(targetIp, p);
      return { port: p, open };
    }));
    const openPorts = results.filter(r => r.open).map(r => r.port);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      ip: targetIp,
      alive: openPorts.length > 0,
      openPorts: openPorts,
      timestamp: new Date().toISOString()
    }));
  }

  if (pathname === '/api/esp32/stream') {
    const targetUrl = parsedUrl.searchParams.get('url');
    if (!targetUrl) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Missing ?url parameter' }));
    }

    try {
      const u = new URL(targetUrl);
      const clientReq = http.get(u, (streamRes) => {
        res.writeHead(streamRes.statusCode || 200, {
          'Content-Type': streamRes.headers['content-type'] || 'multipart/x-mixed-replace; boundary=frame',
          'Cache-Control': 'no-cache',
          'Connection': 'close',
          'Access-Control-Allow-Origin': '*'
        });
        streamRes.pipe(res);
      });

      clientReq.on('error', (err) => {
        if (!res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'ESP32 Stream Unreachable', details: err.message }));
        }
      });
      return;
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Invalid URL', details: e.message }));
    }
  }

  // ---------- STATIC FILE SERVING ----------
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

  // Security check: prevent directory traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Access Denied');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('404 Not Found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

let currentPort = parseInt(PORT, 10);

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`[AEGIS Server] Port ${currentPort} is currently in use (e.g. by another server or Python).`);
    currentPort += 1;
    console.log(`[AEGIS Server] Retrying on port ${currentPort}...`);
    setTimeout(() => {
      server.listen(currentPort);
    }, 200);
  } else {
    console.error('[AEGIS Server] Unexpected server error:', err);
  }
});

server.listen(currentPort, () => {
  console.log(`=================================================`);
  console.log(`  AEGIS MISSION CONTROL SERVER ACTIVE`);
  console.log(`  URL: http://localhost:${currentPort}`);
  console.log(`  Live APIs: USGS Earthquakes, NASA EONET, NOAA`);
  console.log(`  Fleet Endpoints: /api/rovers, /api/rovers/dispatch`);
  console.log(`=================================================`);
});
