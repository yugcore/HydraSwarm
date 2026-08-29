# AEGIS Swarm — Hazard Response & Scout Rover Operations

Tactical Autonomous Fleet Coordination & Real-Time Hazard Response System for Disaster Management.

🌐 **Live Deployment**: [https://yugcore.github.io/AegisSwarm/](https://yugcore.github.io/AegisSwarm/)

---

## 🚀 Overview

AEGIS is a comprehensive mission control dashboard for coordinating disaster response rovers, monitoring live multi-agency satellite/ground hazard telemetry (USGS Earthquakes, NASA EONET Wildfires & Cyclones, Open-Meteo Weather Alerts), and managing real ESP32 / simulated scout rovers in the field.

### Key Capabilities:
- **Interactive Tactical Operations Map**: Real-time Mercator SVG projection with zoom/pan, multi-station switching, sector hazard heat zones, and dynamic rover path tracing.
- **Multi-Agency Real-Time Hazard Ingestion**: Live feeds from USGS (Earthquakes), NASA EONET (Storms/Wildfires), and Open-Meteo meteorological anomalies.
- **ESP32 Rover Hardware Integration**: Web-based rover command interface, low-latency live camera streaming, flashlight & motor speed telemetry, and subnet scanning.
- **Autonomous Reinforcement Logistics**: Dynamic rover dispatch, airdrop reinforcement deployment, supply cargo payload tracking, and auto-return routines.
- **100% Client-Side Compatible**: Runs seamlessly both as a static web dashboard (GitHub Pages) and with an optional Node.js local proxy server for LAN rover control.

---

## 🌐 GitHub Pages Deployment Instructions

To host this repository on GitHub Pages:

1. Go to your repository on GitHub: [https://github.com/yugcore/AegisSwarm](https://github.com/yugcore/AegisSwarm)
2. Click on the **Settings** tab (gear icon at the top of the repo).
3. In the left sidebar, click on **Pages** (under the "Code and automation" section).
4. Under **Build and deployment**:
   - **Source**: Select `Deploy from a branch`
   - **Branch**: Select `main` from the dropdown
   - **Folder**: Select `/ (root)` from the dropdown
5. Click **Save**.
6. Wait 1-2 minutes for GitHub Actions to build and deploy.
7. Your site will be live at:
   👉 **`https://yugcore.github.io/AegisSwarm/`**

---

## 🛠️ Local Development & Hardware Testing

If you want to run the optional local Node.js proxy server (for direct local network ESP32 camera streaming and rover control):

```bash
# Start local mission control server
node server.js
```

Then navigate to `http://localhost:8080` (or `http://localhost:8082`).

---

## 📁 Project Architecture

```
├── index.html           # Main Mission Control Web App Entry Point
├── dashboard.html       # Alternative entry point
├── .nojekyll            # Bypasses Jekyll build on GitHub Pages
├── server.js            # Optional Node.js hardware bridge server
├── ESP32_AEGIS_ROVER.ino # Arduino/ESP32 firmware code
├── css/
│   └── dashboard.css    # Mission Control dark-mode tactical theme & glassmorphism
└── js/
    ├── app.js           # Core state management & lifecycle loops
    ├── api.js           # USGS, NASA EONET, Open-Meteo & fleet dispatch API
    ├── data.js          # Sector stations, preconfigured fleets & mock telemetry
    ├── esp32.js         # ESP32 hardware bridge, camera streams & controls
    ├── feed.js          # Live event log and disaster situational ticker
    ├── helpers.js       # Formatting, SVG helpers, and math utils
    ├── map.js           # Tactical map rendering, path overlays & interactions
    ├── telemetry.js     # Rover sensor calculations & battery depletion loops
    └── ui.js            # Glassmorphism panels, modals, tabs & HUD components
```
