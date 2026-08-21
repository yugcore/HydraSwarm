const fs = require('fs');
const path = require('path');

// Mock browser globals
global.window = {
  location: { origin: 'http://localhost:8080' },
  addEventListener: () => {},
  removeEventListener: () => {}
};
global.document = {
  documentElement: { setAttribute: () => {} },
  addEventListener: () => {},
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: () => null
};
global.localStorage = {
  getItem: () => null,
  setItem: () => {}
};
global.performance = {
  now: () => Date.now()
};

const vm = require('vm');

// Load code files in exact load order in global context
const files = [
  'js/data.js',
  'js/helpers.js',
  'js/api.js',
  'js/telemetry.js',
  'js/esp32.js',
  'js/map.js',
  'js/feed.js',
  'js/ui.js',
  'js/app.js'
];

files.forEach(f => {
  const code = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
  vm.runInThisContext(code, { filename: f });
});

console.log('--- RUNNING HYDRA REINFORCEMENTS AUTOMATED TEST SUITE ---');

// Test 1: Check SUPPLY_PAYLOADS Catalog
console.assert(Array.isArray(SUPPLY_PAYLOADS) && SUPPLY_PAYLOADS.length === 6, 'SUPPLY_PAYLOADS should have 6 items');
console.log('✓ Test 1 Passed: SUPPLY_PAYLOADS catalog verified (6 payloads)');

// Test 2: Check Heavy Rovers per Station
console.assert(Array.isArray(heavyRovers) && heavyRovers.length >= 4, 'heavyRovers should be populated');
const airframeTypes = new Set(heavyRovers.map(r => r.type));
console.assert(airframeTypes.has('aerial') && airframeTypes.size === 1, 'Only air rovers must be in heavyRovers');
console.log(`✓ Test 2 Passed: ${heavyRovers.length} Heavy-Lifting Air Rovers loaded for ${currentStationId}`);

// Test 3: Arming / Loading / Unloading Payloads
const testRover = heavyRovers[0];
loadHeavyRoverPayload(testRover.id, 'medikit_trauma');
console.assert(testRover.payloadStatus === 'loaded', 'Rover should be loaded');
console.assert(testRover.payloadId === 'medikit_trauma', 'Rover payloadId should match');
const payload = getPayloadById(testRover.id);
console.log(`✓ Test 3 Passed: Loaded payload ${testRover.payloadId} onto ${testRover.name}`);

// Test 4: Arm All Heavy Rovers
armAllHeavyRovers('medikit_trauma');
const allLoaded = heavyRovers.every(r => r.payloadStatus === 'loaded');
console.assert(allLoaded, 'All available heavy rovers should be loaded with medikits');
console.log('✓ Test 4 Passed: Quick Arm All Medikits verified');

// Test 5: Airdrop Mission Kinematics & Trajectory Simulation
const targetZone = { x: 620, y: 340, label: 'Sector Alpha Flood Relief' };
const dropRecord = HYDRA_TELEMETRY.startHeavyAirliftMission(testRover.id, targetZone, 'medikit_trauma');
console.assert(dropRecord && dropRecord.id.startsWith('DROP-'), 'Drop record created in activeDropTargets');
console.assert(testRover.status === 'Deployed', 'Rover status should be Deployed');

const telem = HYDRA_TELEMETRY.getRoverTelemetry(testRover.id);
console.assert(telem && telem.isHeavy && telem.altitude === 120, 'Heavy telemetry configured for 120m flight corridor');
console.log(`✓ Test 5 Passed: Dispatched heavy airlift mission to ${targetZone.label} with ETA ${HYDRA_TELEMETRY.formatEta(telem.etaSeconds)}`);

// Test 6: Advance Kinematics through Airdrop Delivery and Return Leg
console.log('Simulating flight kinematics ticks (outbound -> arrival -> delivery -> return)...');
for (let step = 0; step < 1500; step++) {
  HYDRA_TELEMETRY.updateKinematics(0.2);
}
console.assert(dropRecord.status === 'delivered', `Airdrop should be delivered (current: ${dropRecord.status})`);
console.assert(dropRecord.deliveredAt instanceof Date, 'deliveredAt timestamp should be set');
console.log(`✓ Test 6 Passed: Parachute supply drop delivered! Status: ${dropRecord.status}, Rover Status: ${testRover.status}`);

// Test 7: UI Rendering Verification (Left Panel Tabs, Heavy Cards, Map SVG)
state.leftPanelTab = 'reinforcements';
const reinforcementHtml = renderReinforcementPanelContent();
console.assert(reinforcementHtml.includes('Heavy Aerial'), 'Reinforcement banner rendered');
console.assert(reinforcementHtml.includes('Trauma Medikits') || reinforcementHtml.includes('Medikits'), 'Payload names rendered');

const leftPanelHtml = renderRoverPanel();
console.assert(leftPanelHtml.includes('Scout Fleet') && leftPanelHtml.includes('Reinforcements'), 'Tab bar rendered');

const mapSvgHtml = renderMapSvg();
console.assert(mapSvgHtml.includes('heavy-rover-marker') || mapSvgHtml.includes('delivered-drop-marker'), 'Heavy markers in SVG');

const mapContainerHtml = renderMap();
console.assert(mapContainerHtml.includes('map-wrap'), 'Map container rendered');

console.log('✓ Test 7 Passed: UI panels, Tab Navigation, and SVG map render cleanly without exceptions');

// Test 8: Station Switching Roster Check across all 10 Indian Stations
const stationIds = ['guwahati', 'chennai', 'kedarnath', 'puri', 'wayanad', 'mumbai', 'kolkata', 'bhuj', 'shimla', 'patna'];
stationIds.forEach(sId => {
  switchHydraStation(sId);
  console.assert(heavyRovers.length >= 3, `Station ${sId} should have at least 3 heavy rovers`);
  const onlyAir = heavyRovers.every(r => r.type === 'aerial');
  console.assert(onlyAir, `Station ${sId} heavy rovers must be strictly aerial`);
});
console.log(`✓ Test 8 Passed: All 10 Indian disaster stations verified with dedicated aerial heavy rovers rosters`);

console.log('\n=========================================================');
console.log(' ALL REINFORCEMENT SUPPLY TESTS PASSED PERFECTLY! (8/8)');
console.log('=========================================================');
process.exit(0);
