/* =========================================================
   HYDRA - ROVER KINEMATICS & TELEMETRY SIMULATION ENGINE
========================================================= */

const HYDRA_TELEMETRY = {
  // Rover kinematic states: keyed by rover ID
  // { t: 0..1, speed: km/h, avgSpeed: km/h, distanceTraveled: km, totalDistance: km, etaSeconds: num, heading: deg, status: string, orbitAngle: num }
  records: {},
  lastTickTime: performance.now(),
  isRunning: false,

  // Scale: 1 map coordinate unit ≈ 50 meters (0.05 km)
  KM_PER_UNIT: 0.05,

  /* ---------- INITIALIZATION ---------- */
  init() {
    rovers.forEach(r => {
      this.initRoverTelemetry(r);
    });
    this.startSimulationLoop();
  },

  initRoverTelemetry(r) {
    const isDeployed = r.status === 'Deployed' || r.status === 'On Site';
    const hazard = r.hazardId ? byId(hazards, r.hazardId) : null;
    
    const baseSpeed = r.type === 'aerial' ? 42 : 18;
    const currentPos = { x: r.x, y: r.y };
    const homePos = r.home || { x: r.x, y: r.y };
    const targetPos = hazard ? { x: hazard.x, y: hazard.y } : currentPos;

    // Approximate total route distance
    const totalDist = this.calculateRouteDistance(homePos, targetPos);
    const initialT = isDeployed ? (r.id === 'A-02' ? 0.65 : r.id === 'G-02' ? 0.45 : 0.05) : 0.0;
    const distTraveled = totalDist * initialT;

    this.records[r.id] = {
      id: r.id,
      t: initialT,
      x: currentPos.x,
      y: currentPos.y,
      lat: 34.21 + currentPos.y * 0.0007,
      lon: -118.5 + currentPos.x * 0.0006,
      heading: 0,
      baseSpeed,
      speed: isDeployed ? baseSpeed : 0,
      avgSpeed: isDeployed ? baseSpeed : 0,
      speedSamples: isDeployed ? [baseSpeed] : [0],
      distanceTraveled: distTraveled,
      totalDistance: Math.max(1.0, totalDist),
      remainingDistance: Math.max(0, totalDist - distTraveled),
      etaSeconds: isDeployed ? ((totalDist - distTraveled) / baseSpeed) * 3600 : 0,
      status: r.status,
      orbitAngle: 0,
      source: 'SIMULATED' // Can be swapped to 'HARDWARE_GPS'
    };

    // Calculate initial position & heading
    if (hazard && isDeployed) {
      const pt = this.getBezierPoint(initialT, homePos, targetPos);
      const tangent = this.getBezierTangent(initialT, homePos, targetPos);
      this.records[r.id].x = pt.x;
      this.records[r.id].y = pt.y;
      this.records[r.id].heading = Math.round((Math.atan2(tangent.dy, tangent.dx) * 180) / Math.PI) + 90;
      r.x = Math.round(pt.x);
      r.y = Math.round(pt.y);
    }
  },

  /* ---------- GEOMETRIC CALCULATIONS ---------- */
  getControlPoint(p0, p2) {
    return {
      x: (p0.x + p2.x) / 2,
      y: (p0.y + p2.y) / 2 - 40
    };
  },

  getBezierPoint(t, p0, p2) {
    const p1 = this.getControlPoint(p0, p2);
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    return {
      x: uu * p0.x + 2 * u * t * p1.x + tt * p2.x,
      y: uu * p0.y + 2 * u * t * p1.y + tt * p2.y
    };
  },

  getBezierTangent(t, p0, p2) {
    const p1 = this.getControlPoint(p0, p2);
    return {
      dx: 2 * (1 - t) * (p1.x - p0.x) + 2 * t * (p2.x - p1.x),
      dy: 2 * (1 - t) * (p1.y - p0.y) + 2 * t * (p2.y - p1.y)
    };
  },

  calculateRouteDistance(p0, p2) {
    let dist = 0;
    let prev = p0;
    const steps = 20;
    for (let i = 1; i <= steps; i++) {
      const curr = this.getBezierPoint(i / steps, p0, p2);
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      dist += Math.sqrt(dx * dx + dy * dy);
      prev = curr;
    }
    return dist * this.KM_PER_UNIT; // Convert to km
  },

  /* ---------- MISSION DISPATCH TRIGGER ---------- */
  startMission(roverId, hazardId) {
    const r = byId(rovers, roverId);
    const h = byId(hazards, hazardId);
    if (!r || !h) return;

    r.status = 'Deployed';
    r.hazardId = hazardId;
    r.task = `En route — ${h.name.split(',')[0]}`;
    r.connection = r.connection === 'none' ? 'strong' : r.connection;

    const baseSpeed = r.type === 'aerial' ? (38 + Math.random() * 8) : (16 + Math.random() * 6);
    const totalDist = this.calculateRouteDistance(r.home || { x: r.x, y: r.y }, { x: h.x, y: h.y });

    this.records[roverId] = {
      id: roverId,
      t: 0.001,
      x: r.home?.x || r.x,
      y: r.home?.y || r.y,
      lat: 34.21 + (r.home?.y || r.y) * 0.0007,
      lon: -118.5 + (r.home?.x || r.x) * 0.0006,
      heading: 0,
      baseSpeed,
      speed: baseSpeed,
      avgSpeed: baseSpeed,
      speedSamples: [baseSpeed],
      distanceTraveled: 0,
      totalDistance: Math.max(1.0, totalDist),
      remainingDistance: totalDist,
      etaSeconds: (totalDist / baseSpeed) * 3600,
      status: 'Deployed',
      orbitAngle: 0,
      source: 'SIMULATED'
    };
  },

  /* ---------- TELEMETRY PHYSICS TICK ---------- */
  startSimulationLoop() {
    if (this.isRunning) return;
    if (typeof requestAnimationFrame === 'undefined') return;
    this.isRunning = true;

    const tick = (now) => {
      const deltaSec = Math.min(0.2, (now - this.lastTickTime) / 1000);
      this.lastTickTime = now;

      if (typeof state === 'undefined' || state.mode === 'simulation') {
        this.updateKinematics(deltaSec);
      }

      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  },

  updateKinematics(deltaSec) {
    rovers.forEach(r => {
      if (r.status !== 'Deployed' && r.status !== 'On Site' && r.status !== 'Returning') return;
      const telem = this.records[r.id];
      if (!telem || telem.source === 'HARDWARE_GPS') return; // Skip if real hardware connected

      const hazard = r.hazardId ? byId(hazards, r.hazardId) : null;
      if (!hazard) return;

      const p0 = r.home || { x: 180, y: 520 };
      const p2 = { x: hazard.x, y: hazard.y };

      if (telem.status === 'Deployed') {
        // Realistic micro-fluctuation in speed (±4%)
        const noise = (Math.random() - 0.5) * 1.2;
        telem.speed = Math.max(5, telem.baseSpeed + noise);
        telem.speedSamples.push(telem.speed);
        if (telem.speedSamples.length > 50) telem.speedSamples.shift();
        telem.avgSpeed = telem.speedSamples.reduce((a, b) => a + b, 0) / telem.speedSamples.length;

        // Kinematic progress delta (dt = v * deltaSec / totalDist)
        // Accelerated multiplier for engaging tactical simulation
        const SIM_TIME_SCALE = 3.5; 
        const distDeltaKm = (telem.speed / 3600) * deltaSec * SIM_TIME_SCALE;
        
        telem.distanceTraveled = Math.min(telem.totalDistance, telem.distanceTraveled + distDeltaKm);
        telem.t = Math.min(1.0, telem.distanceTraveled / telem.totalDistance);
        telem.remainingDistance = Math.max(0, telem.totalDistance - telem.distanceTraveled);
        
        // Exact countdown ETA
        telem.etaSeconds = telem.speed > 0 ? (telem.remainingDistance / telem.speed) * 3600 : 0;

        // Interpolate along Quadratic Bézier
        const pt = this.getBezierPoint(telem.t, p0, p2);
        const tangent = this.getBezierTangent(telem.t, p0, p2);

        telem.x = pt.x;
        telem.y = pt.y;
        telem.lat = 34.21 + pt.y * 0.0007;
        telem.lon = -118.5 + pt.x * 0.0006;
        telem.heading = Math.round((Math.atan2(tangent.dy, tangent.dx) * 180) / Math.PI) + 90;

        // Update rover core coordinates
        r.x = Math.round(pt.x);
        r.y = Math.round(pt.y);

        // Check for arrival on site
        if (telem.t >= 1.0) {
          telem.status = 'On Site';
          r.status = 'On Site';
          r.task = `On site &mdash; Containment ops at ${hazard.name.split(',')[0]}`;
          telem.speed = r.type === 'aerial' ? 12 : 3;
          telem.remainingDistance = 0;
          telem.etaSeconds = 0;
        }
      } else if (telem.status === 'On Site') {
        // Loiter / survey orbit around hazard epicenter
        telem.orbitAngle = (telem.orbitAngle + deltaSec * (r.type === 'aerial' ? 0.6 : 0.25)) % (Math.PI * 2);
        const radius = r.type === 'aerial' ? 26 : 14;
        telem.x = p2.x + Math.cos(telem.orbitAngle) * radius;
        telem.y = p2.y + Math.sin(telem.orbitAngle) * radius;
        telem.lat = 34.21 + telem.y * 0.0007;
        telem.lon = -118.5 + telem.x * 0.0006;
        telem.heading = Math.round(((telem.orbitAngle + Math.PI / 2) * 180) / Math.PI);
        telem.speed = r.type === 'aerial' ? 14.5 : 4.2;
        r.x = Math.round(telem.x);
        r.y = Math.round(telem.y);
      }
    });
  },

  /* ---------- GETTERS & TELEMETRY INTERFACE ---------- */
  getRoverTelemetry(roverId) {
    return this.records[roverId] || {
      id: roverId,
      t: 0,
      x: 0,
      y: 0,
      lat: 34.21,
      lon: -118.5,
      heading: 0,
      speed: 0,
      avgSpeed: 0,
      distanceTraveled: 0,
      totalDistance: 1,
      remainingDistance: 0,
      etaSeconds: 0,
      status: 'Offline',
      source: 'SIMULATED'
    };
  },

  formatEta(seconds) {
    if (seconds <= 0) return 'On Station';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hrs}h ${remMins}m`;
    }
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  },

  /* ---------- PLUGGABLE HARDWARE GPS ADAPTER ---------- */
  setLiveHardwareTelemetry(roverId, gpsPacket) {
    // Allows real IoT / ROS 2 / GPS packets to overwrite simulated kinematics seamlessly
    if (!this.records[roverId]) return;
    const r = byId(rovers, roverId);
    this.records[roverId] = {
      ...this.records[roverId],
      ...gpsPacket,
      source: 'HARDWARE_GPS'
    };
    if (r && gpsPacket.x !== undefined && gpsPacket.y !== undefined) {
      r.x = gpsPacket.x;
      r.y = gpsPacket.y;
    }
  }
};

// Initialize kinematics on module load
HYDRA_TELEMETRY.init();
