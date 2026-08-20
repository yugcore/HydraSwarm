/* =========================================================
   HYDRA - LIVE API CLIENT & DATA NORMALIZATION LAYER
========================================================= */

const HYDRA_API = {
  endpoints: {
    usgsEarthquakes: 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=2.5&minlatitude=6&maxlatitude=38&minlongitude=68&maxlongitude=98',
    usgsGlobal: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson',
    nasaEonet: 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=30',
    openMeteo: 'https://api.open-meteo.com/v1/forecast',
    localBackend: (typeof window !== 'undefined' && window.location.origin && window.location.origin.startsWith('http'))
      ? `${window.location.origin}/api`
      : 'http://localhost:8080/api'
  },

  status: {
    usgs: 'idle',    // 'idle' | 'connected' | 'error'
    nasa: 'idle',
    noaa: 'idle',
    backend: 'idle',
    lastSync: null
  },

  /* ---------- PROJECTION HELPERS ---------- */
  // Projects real GPS (lat, lon) to tactical SVG coordinate space (1000 x 640)
  projectLatLonToMap(lat, lon) {
    // Default regional bounding box: Pacific / Western US (Latitude 20N to 60N, Longitude 160W to 60W)
    // Global fallback linear Mercator projection
    const clampedLon = Math.max(-180, Math.min(180, lon));
    const clampedLat = Math.max(-85, Math.min(85, lat));

    const x = Math.round(((clampedLon + 180) / 360) * 1000);
    // Spherical Mercator formula for realistic projection
    const latRad = (clampedLat * Math.PI) / 180;
    const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
    const y = Math.round(320 - (mercN / Math.PI) * 300);

    return {
      x: Math.max(30, Math.min(970, x)),
      y: Math.max(30, Math.min(610, y))
    };
  },

  /* ---------- USGS EARTHQUAKES API ---------- */
  async fetchEarthquakes() {
    try {
      const res = await fetch(this.endpoints.usgsEarthquakes, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`USGS HTTP ${res.status}`);
      const data = await res.json();
      this.status.usgs = 'connected';

      return (data.features || []).slice(0, 15).map(f => {
        const props = f.properties;
        const [lon, lat, depth] = f.geometry.coordinates;
        const mapCoords = this.projectLatLonToMap(lat, lon);
        const mag = props.mag || 0;
        
        let severity = 'low';
        if (mag >= 5.0) severity = 'severe';
        else if (mag >= 4.0) severity = 'moderate';

        const timeObj = new Date(props.time);
        const timeStr = timeObj.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

        return {
          id: `USGS-${f.id}`,
          type: 'Earthquake',
          name: props.title ? props.title.replace(/^M\s*[\d.]+\s*-\s*/i, '') : 'Seismic Anomaly',
          location: props.place || 'Unknown Epicenter',
          detected: timeStr,
          severity,
          status: mag >= 4.5 ? 'Active' : 'Monitoring',
          lat,
          lon,
          depth: `${depth} km`,
          magnitude: `M ${mag.toFixed(1)}`,
          source: 'USGS',
          url: props.url,
          x: mapCoords.x,
          y: mapCoords.y
        };
      });
    } catch (err) {
      console.warn('[HYDRA API] USGS Earthquakes fetch failed:', err.message);
      this.status.usgs = 'error';
      return [];
    }
  },

  /* ---------- NASA EONET (WILDFIRES, VOLCANOES, STORMS) ---------- */
  async fetchNasaEonet() {
    try {
      const res = await fetch(this.endpoints.nasaEonet, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`NASA EONET HTTP ${res.status}`);
      const data = await res.json();
      this.status.nasa = 'connected';

      const typeMap = {
        wildfires: 'Wildfire',
        severeStorms: 'Cyclone',
        volcanoes: 'Wildfire',
        floods: 'Flood',
        seaLakeIce: 'Cyclone'
      };

      return (data.events || []).slice(0, 15).map(e => {
        const catId = e.categories?.[0]?.id || 'wildfires';
        const type = typeMap[catId] || 'Wildfire';
        const lastGeo = e.geometry?.[e.geometry.length - 1];
        const [lon, lat] = lastGeo && Array.isArray(lastGeo.coordinates) && typeof lastGeo.coordinates[0] === 'number'
          ? lastGeo.coordinates
          : [-119.5, 36.8]; // fallback default region
        
        const mapCoords = this.projectLatLonToMap(lat, lon);
        const dateObj = lastGeo?.date ? new Date(lastGeo.date) : new Date();
        const timeStr = dateObj.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

        let severity = 'moderate';
        if (type === 'Wildfire' || type === 'Cyclone') severity = 'severe';

        return {
          id: `NASA-${e.id.substring(0, 10)}`,
          type,
          name: e.title || `${type} Event`,
          location: `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°W`,
          detected: timeStr,
          severity,
          status: 'Active',
          lat,
          lon,
          source: 'NASA',
          url: e.link,
          x: mapCoords.x,
          y: mapCoords.y
        };
      });
    } catch (err) {
      console.warn('[HYDRA API] NASA EONET fetch failed:', err.message);
      this.status.nasa = 'error';
      return [];
    }
  },

  /* ---------- NOAA ACTIVE SEVERE WEATHER ALERTS ---------- */
  async fetchNoaaAlerts() {
    try {
      const res = await fetch(this.endpoints.noaaAlerts, {
        headers: { 'Accept': 'application/geo+json' }
      });
      if (!res.ok) throw new Error(`NOAA HTTP ${res.status}`);
      const data = await res.json();
      this.status.noaa = 'connected';

      return (data.features || []).slice(0, 10).map(f => {
        const props = f.properties || {};
        let lat = 34.0, lon = -118.0;
        if (f.geometry && f.geometry.coordinates) {
          const coords = f.geometry.coordinates[0];
          if (Array.isArray(coords) && coords.length > 0) {
            lon = coords[0][0] || -118.0;
            lat = coords[0][1] || 34.0;
          }
        }
        const mapCoords = this.projectLatLonToMap(lat, lon);
        const eventName = props.event || 'Severe Weather Warning';
        
        let type = 'Flood';
        if (/fire|red flag/i.test(eventName)) type = 'Wildfire';
        else if (/hurricane|cyclone|storm|wind/i.test(eventName)) type = 'Cyclone';
        else if (/tsunami/i.test(eventName)) type = 'Tsunami';
        else if (/flood/i.test(eventName)) type = 'Flood';

        let severity = 'moderate';
        if (props.severity === 'Extreme' || props.severity === 'Severe') severity = 'severe';
        else if (props.severity === 'Minor') severity = 'low';

        const sentDate = props.sent ? new Date(props.sent) : new Date();
        const timeStr = sentDate.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

        return {
          id: `NOAA-${(props.id || Math.random().toString(36)).substring(0, 8)}`,
          type,
          name: props.headline || eventName,
          location: props.areaDesc ? props.areaDesc.split(';')[0] : 'Coastal Alert Zone',
          detected: timeStr,
          severity,
          status: props.urgency === 'Immediate' ? 'Active' : 'Watch',
          lat,
          lon,
          source: 'NOAA',
          x: mapCoords.x,
          y: mapCoords.y
        };
      });
    } catch (err) {
      console.warn('[HYDRA API] NOAA Weather Alerts fetch failed:', err.message);
      this.status.noaa = 'error';
      return [];
    }
  },

  /* ---------- AGGREGATE ALL LIVE HAZARDS (INDIA & GLOBAL SATELLITE) ---------- */
  async fetchAllLiveHazards() {
    const activeStation = (typeof getStationById === 'function')
      ? getStationById(typeof state !== 'undefined' ? state.selectedStationId : currentStationId)
      : null;

    let stationWeatherHazards = [];
    if (activeStation && activeStation.lat) {
      try {
        const url = `${this.endpoints.openMeteo}?latitude=${activeStation.lat}&longitude=${activeStation.lon}&current=temperature_2m,relative_humidity_2m,rain,showers,weather_code,wind_speed_10m,wind_gusts_10m&hourly=precipitation,rain&forecast_days=1`;
        const res = await fetch(url).catch(() => null);
        if (res && res.ok) {
          const data = await res.json();
          const curr = data.current || {};
          const isHeavyRain = (curr.rain > 5 || curr.showers > 5);
          const isHighWind = curr.wind_gusts_10m > 40;

          if (isHeavyRain || isHighWind || curr.rain > 0.5) {
            stationWeatherHazards.push({
              id: `LIVE-WX-${activeStation.id.toUpperCase()}`,
              type: isHeavyRain ? 'Flood' : isHighWind ? 'Cyclone' : 'Flood',
              name: isHeavyRain ? `${activeStation.shortName} Monsoonal Heavy Precipitation Alert` : `${activeStation.shortName} High Velocity Gust Watch`,
              location: `${activeStation.name}, ${activeStation.state}`,
              detected: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
              severity: isHeavyRain ? 'severe' : 'moderate',
              status: 'Active',
              lat: activeStation.lat,
              lon: activeStation.lon,
              source: 'Open-Meteo / IMD',
              x: 480,
              y: 280
            });
          }
        }
      } catch (e) {}
    }

    const [quakes, nasaEvents, noaaAlerts] = await Promise.all([
      this.fetchEarthquakes(),
      this.fetchNasaEonet(),
      this.fetchNoaaAlerts()
    ]);

    const combined = [...stationWeatherHazards, ...quakes, ...nasaEvents, ...noaaAlerts];
    this.status.lastSync = new Date();

    if (combined.length === 0) {
      console.info('[HYDRA API] Fallback to station operational dataset.');
      return (activeStation && activeStation.hazards) ? activeStation.hazards : fallbackHazards;
    }

    // Sort by severity (severe first) then active status
    const sevOrder = { severe: 3, moderate: 2, low: 1 };
    combined.sort((a, b) => (sevOrder[b.severity] || 0) - (sevOrder[a.severity] || 0));

    return combined.slice(0, 20);
  },

  /* ---------- FLEET DISPATCH & TELEMETRY API ---------- */
  async fetchRoverTelemetry() {
    try {
      const res = await fetch(`${this.endpoints.localBackend}/rovers`);
      if (!res.ok) throw new Error(`Backend HTTP ${res.status}`);
      const data = await res.json();
      this.status.backend = 'connected';
      return data;
    } catch (err) {
      this.status.backend = 'offline';
      return null;
    }
  },

  async dispatchRoverMission(roverIds, hazardId) {
    try {
      const res = await fetch(`${this.endpoints.localBackend}/rovers/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roverIds, hazardId, timestamp: new Date().toISOString() })
      });
      if (!res.ok) throw new Error(`Dispatch HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[HYDRA API] Local backend dispatch offline, applying in client memory.');
      return { success: true, mode: 'client-simulation' };
    }
  }
};
