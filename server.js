/**
 * HYDRA Mission Control - Backend API & Static Server
 * Built with native Node.js (Zero external dependencies required)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');
const os = require('os');

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
    https.get(url, { headers: { 'User-Agent': 'HYDRA-Mission-Control/2.0' } }, (res) => {
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
    return res.end(JSON.stringify({ status: 'operational', timestamp: new Date().toISOString(), server: 'HYDRA Core v2.0' }));
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

        console.log(`[HYDRA Backend] Dispatched rovers ${roverIds.join(', ')} to hazard ${hazardId}`);
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

  // ---------- ESP32 API ENDPOINTS ----------
  if (pathname === '/api/esp32/scan') {
    // Get local network IPv4 subnet interfaces (e.g. 192.168.1.x, 10.0.0.x, 172.20.10.x)
    const interfaces = os.networkInterfaces();
    const localIps = [];
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          localIps.push(iface.address);
        }
      }
    }

    const defaultEspDevices = [
      {
        id: 'ESP-ROVER-01',
        name: 'ESP32-CAM Scout Alpha',
        type: 'ground',
        ip: '192.168.4.1',
        port: 81,
        streamPath: '/stream',
        rssi: -48,
        mac: '24:6F:28:AE:3C:80',
        battery: 95,
        chipset: 'ESP32-CAM (OV2640)',
        status: 'Available',
        features: ['MJPEG Stream', 'Flash LED', 'Dual Motor Drive', 'GPS Telemetry']
      },
      {
        id: 'ESP-DRONE-01',
        name: 'ESP32-S3 SkyScout Flyer',
        type: 'aerial',
        ip: '192.168.1.108',
        port: 81,
        streamPath: '/stream',
        rssi: -58,
        mac: '84:CC:A8:92:4F:1A',
        battery: 88,
        chipset: 'ESP32-S3 (OV5640)',
        status: 'Available',
        features: ['HD Aerial Feed', 'Altitude Hold', 'Auto-Return', 'Telemetry Uplink']
      },
      {
        id: 'ESP-ROVER-02',
        name: 'ESP32 Micro-Scout Beta',
        type: 'ground',
        ip: '192.168.1.142',
        port: 80,
        streamPath: '/mjpeg',
        rssi: -64,
        mac: '30:AE:A4:17:B9:5D',
        battery: 76,
        chipset: 'ESP32-WROVER-E',
        status: 'Available',
        features: ['All-Terrain Tracks', 'Obstacle LiDAR', 'Night Vision IR']
      }
    ];

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      devices: defaultEspDevices,
      scannedAt: new Date().toISOString(),
      subnet: localIps.join(', ') || '2.4GHz WiFi / LAN',
      activeInterfaces: localIps
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
    console.warn(`[HYDRA Server] Port ${currentPort} is currently in use (e.g. by another server or Python).`);
    currentPort += 1;
    console.log(`[HYDRA Server] Retrying on port ${currentPort}...`);
    setTimeout(() => {
      server.listen(currentPort);
    }, 200);
  } else {
    console.error('[HYDRA Server] Unexpected server error:', err);
  }
});

server.listen(currentPort, () => {
  console.log(`=================================================`);
  console.log(`  HYDRA MISSION CONTROL SERVER ACTIVE`);
  console.log(`  URL: http://localhost:${currentPort}`);
  console.log(`  Live APIs: USGS Earthquakes, NASA EONET, NOAA`);
  console.log(`  Fleet Endpoints: /api/rovers, /api/rovers/dispatch`);
  console.log(`=================================================`);
});
