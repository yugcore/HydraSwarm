/* =========================================================
   HYDRA - DATA & CONSTANTS
========================================================= */

const rovers = [
  { id: 'G-01', name: 'Terra-1', type: 'ground', status: 'Ready', battery: 92, connection: 'strong', task: 'Standing by — East Depot', x: 180, y: 520, home: { x: 180, y: 520 } },
  { id: 'G-02', name: 'Terra-2', type: 'ground', status: 'Deployed', battery: 64, connection: 'moderate', task: 'En route — Cañon Road MP 14', x: 340, y: 430, home: { x: 150, y: 470 }, hazardId: 'H-02' },
  { id: 'G-03', name: 'Terra-3', type: 'ground', status: 'Offline', battery: 0, connection: 'none', task: 'Maintenance bay — no signal', x: 90, y: 590, home: { x: 90, y: 590 } },
  { id: 'G-04', name: 'Terra-4', type: 'ground', status: 'Ready', battery: 87, connection: 'strong', task: 'Standing by — West Depot', x: 110, y: 460, home: { x: 110, y: 460 } },
  { id: 'A-01', name: 'Falcon-1', type: 'aerial', status: 'Ready', battery: 98, connection: 'strong', task: 'Standing by — Launch Pad 1', x: 230, y: 560, home: { x: 230, y: 560 } },
  { id: 'A-02', name: 'Falcon-2', type: 'aerial', status: 'Deployed', battery: 71, connection: 'strong', task: 'Aerial survey — Ridgeline Sector 7', x: 560, y: 220, home: { x: 210, y: 540 }, hazardId: 'H-01' },
  { id: 'A-03', name: 'Falcon-3', type: 'aerial', status: 'Returning', battery: 22, connection: 'weak', task: 'Returning to base — low battery', x: 400, y: 380, home: { x: 250, y: 530 } },
  { id: 'A-04', name: 'Falcon-4', type: 'aerial', status: 'Unavailable', battery: 45, connection: 'none', task: 'Scheduled maintenance', x: 270, y: 590, home: { x: 270, y: 590 } },
];

const fallbackHazards = [
  { id: 'H-01', type: 'Wildfire', name: 'Ridgeline Sector 7', location: 'Ridgeline Sector 7, N Highlands', detected: '07:12', severity: 'severe', status: 'Active', source: 'NASA', x: 600, y: 190 },
  { id: 'H-02', type: 'Landslide', name: 'Cañon Road MP 14', location: 'Cañon Road, Mile Post 14', detected: '08:41', severity: 'moderate', status: 'Active', source: 'NOAA', x: 370, y: 410 },
  { id: 'H-03', type: 'Flood', name: 'Lowland Basin — District 3', location: 'Lowland Basin, District 3', detected: '06:55', severity: 'severe', status: 'Active', source: 'NOAA', x: 250, y: 270 },
  { id: 'H-04', type: 'Earthquake', name: 'Fault Line North — Aftershocks', location: 'North Fault Corridor', detected: '05:20', severity: 'moderate', status: 'Monitoring', magnitude: 'M 4.8', source: 'USGS', x: 700, y: 340 },
  { id: 'H-05', type: 'Cyclone', name: 'Coastal Sector A — Approach', location: 'Coastal Sector A', detected: '04:02', severity: 'severe', status: 'Watch', source: 'NOAA', x: 820, y: 520 },
  { id: 'H-06', type: 'Tsunami', name: 'Harbor Zone — Advisory', location: 'Harbor Zone, South Coast', detected: '09:03', severity: 'low', status: 'Advisory', source: 'USGS', x: 780, y: 580 },
];

let hazards = [...fallbackHazards];

const hazardIcons = {
  Wildfire: `<path d="M12 2c1 3-2 4-2 7a3 3 0 0 0 6 0c0-1-.5-1.5-1-2 2 1 3 3 3 5a6 6 0 1 1-12 0c0-4 3-6 4-10 .5 2 1.5 3 2 0z"/>`,
  Landslide: `<path d="M2 20l6-10 4 5 3-4 7 9z"/><path d="M2 20h20" stroke-width="1.4"/>`,
  Flood: `<path d="M2 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 19c2-2 4-2 6 0s4 2 6 0 4-2 6 0" fill="none" stroke-width="1.6" stroke-linecap="round"/>`,
  Earthquake: `<path d="M2 12h4l2-6 3 12 2-8 2 4 2-2h5" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  Cyclone: `<path d="M12 12c3-4 8-2 8 2a5 5 0 0 1-9 3M12 12c-3-4-8-2-8 2a5 5 0 0 0 9 3M12 12a3 3 0 1 1 0 0" fill="none" stroke-width="1.5"/>`,
  Tsunami: `<path d="M2 18c1.5-3 3-4 5-4s3.5 2 5 2 3-3 5-3 3 1.5 5 3" fill="none" stroke-width="1.6" stroke-linecap="round"/><path d="M4 14c2-6 6-8 8-10" fill="none" stroke-width="1.4" stroke-linecap="round"/>`,
};
