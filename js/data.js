/* =========================================================
   HYDRA - INDIAN DISASTER COMMAND STATIONS & FLEET ROSTERS
========================================================= */

const HYDRA_STATIONS = [
  {
    id: 'guwahati',
    name: 'Guwahati HYDRA Station',
    shortName: 'Guwahati Station',
    state: 'Assam',
    region: 'Brahmaputra Valley & Kopili Fault',
    riskLevel: 'CRITICAL',
    badgeClass: 'risk-critical',
    lat: 26.1445,
    lon: 91.7362,
    threats: ['Brahmaputra Floods', 'Kamrup Slope Landslides', 'Kopili Fault Earthquakes'],
    description: 'High-risk Himalayan river basin prone to annual Brahmaputra spates, urban waterlogging, and Zone V seismic faulting.',
    depots: [
      { name: 'Saraighat Staging HQ', x: 130, y: 560, code: 'HQ-SARAIGHAT' },
      { name: 'Dispur Operations Base', x: 750, y: 540, code: 'HQ-DISPUR' }
    ],
    mapFeatures: {
      riverName: 'Brahmaputra River',
      coastOrRiverD: 'M0,180 C200,120 400,260 620,180 C780,120 900,220 1000,160 L1000,290 C880,340 760,240 600,320 C420,400 200,260 0,310 Z',
      terrainPaths: [
        'M50,80 C220,50 380,120 540,70 C700,30 840,90 970,60',
        'M30,130 C190,100 350,160 510,120 C690,80 830,140 980,110',
        'M20,420 C180,380 340,460 520,410 C700,360 840,430 980,390',
        'M40,510 C210,470 390,530 580,480 C750,440 880,510 990,470',
        'M460,70 C470,160 430,230 460,320 C490,400 450,470 470,540',
        'M720,50 C730,140 690,250 720,330 C750,420 710,500 730,570'
      ],
      landmarks: [
        { name: 'Kamakhya Nilachal Hills', x: 260, y: 460, icon: 'hill' },
        { name: 'Deepor Beel Wetland', x: 190, y: 390, icon: 'water' },
        { name: 'Saraighat Bridge Corridor', x: 130, y: 240, icon: 'bridge' },
        { name: 'North Guwahati Bluffs', x: 520, y: 100, icon: 'hill' },
        { name: 'Bharalu Urban Basin', x: 440, y: 490, icon: 'urban' }
      ]
    },
    rovers: [
      { id: 'GA-01', name: 'Brahma-Scout 1', type: 'ground', status: 'Ready', battery: 94, connection: 'strong', task: 'Standing by — Saraighat HQ', x: 130, y: 560, home: { x: 130, y: 560 } },
      { id: 'GA-02', name: 'Lohit-Flyer', type: 'aerial', status: 'Deployed', battery: 78, connection: 'strong', task: 'Brahmaputra Spate Aerial Survey', x: 520, y: 240, home: { x: 160, y: 520 }, hazardId: 'GH-01' },
      { id: 'GA-03', name: 'Kamrup-Rescue 2', type: 'ground', status: 'Deployed', battery: 61, connection: 'moderate', task: 'Debris clearance — Kamakhya South', x: 260, y: 460, home: { x: 130, y: 560 }, hazardId: 'GH-02' },
      { id: 'GA-04', name: 'Nilachal-Crawler', type: 'ground', status: 'Ready', battery: 89, connection: 'strong', task: 'Standing by — Slope Inspection', x: 180, y: 510, home: { x: 180, y: 510 } },
      { id: 'GA-05', name: 'Barak-Drone', type: 'aerial', status: 'Returning', battery: 28, connection: 'weak', task: 'Returning to Dispur HQ — Low Batt', x: 620, y: 430, home: { x: 750, y: 540 } },
      { id: 'GA-06', name: 'Kaziranga-Eye', type: 'aerial', status: 'Ready', battery: 96, connection: 'strong', task: 'Standing by — Thermal Long Range', x: 750, y: 540, home: { x: 750, y: 540 } }
    ],
    hazards: [
      { id: 'GH-01', type: 'Flood', name: 'Brahmaputra Sandbar Breach', location: 'Brahmaputra Channel Sector 4', detected: '06:40', severity: 'severe', status: 'Active', source: 'CWC India', x: 520, y: 240 },
      { id: 'GH-02', type: 'Landslide', name: 'Kamakhya South Face Debris Flow', location: 'Nilachal Hills, Kamrup Metro', detected: '07:15', severity: 'severe', status: 'Active', source: 'ASDMA', x: 260, y: 460 },
      { id: 'GH-03', type: 'Flood', name: 'Deepor Beel Overflow Inundation', location: 'Deepor Beel Wildlife Catchment', detected: '05:50', severity: 'moderate', status: 'Active', source: 'IMD', x: 190, y: 390 },
      { id: 'GH-04', type: 'Earthquake', name: 'Kopili Fault Tremor (M 4.7)', location: 'Kopili River Basin Seismic Line', detected: '04:12', severity: 'moderate', status: 'Monitoring', magnitude: 'M 4.7', source: 'USGS', x: 810, y: 190 },
      { id: 'GH-05', type: 'Flood', name: 'Bharalu Silt Channel Backflow', location: 'Guwahati Central Municipal Basin', detected: '08:05', severity: 'severe', status: 'Active', source: 'IMD', x: 440, y: 490 },
      { id: 'GH-06', type: 'Landslide', name: 'Jalukbari Highway Ridge Slump', location: 'NH-27 Jalukbari Approach', detected: '09:20', severity: 'low', status: 'Advisory', source: 'ASDMA', x: 140, y: 290 }
    ]
  },

  {
    id: 'chennai',
    name: 'Chennai HYDRA Station',
    shortName: 'Chennai Station',
    state: 'Tamil Nadu',
    region: 'Coromandel Coast & Bay of Bengal',
    riskLevel: 'SEVERE',
    badgeClass: 'risk-severe',
    lat: 13.0827,
    lon: 80.2707,
    threats: ['Bay of Bengal Cyclones', 'Adyar & Cooum Deluge Floods', 'Coastal Storm Surges'],
    description: 'Vulnerable coastal megacity subject to intense post-monsoon cyclonic landfall, urban basin waterlogging, and tsunami watches.',
    depots: [
      { name: 'Adyar River Command', x: 180, y: 550, code: 'HQ-ADYAR' },
      { name: 'Chennai Port Marine Pier', x: 800, y: 220, code: 'HQ-PORT' }
    ],
    mapFeatures: {
      riverName: 'Bay of Bengal Coastline',
      coastOrRiverD: 'M0,0 L780,0 C740,150 820,320 760,470 C720,540 760,600 750,640 L0,640 Z',
      terrainPaths: [
        'M100,60 C260,80 420,50 600,70',
        'M80,180 C280,210 460,170 640,190',
        'M50,330 C240,360 480,320 680,340',
        'M60,480 C270,510 500,470 700,490'
      ],
      landmarks: [
        { name: 'Marina Beach Shoreline', x: 740, y: 380, icon: 'coast' },
        { name: 'Adyar Estuary & Mangrove', x: 380, y: 480, icon: 'water' },
        { name: 'Cooum Urban Canal', x: 490, y: 280, icon: 'canal' },
        { name: 'Ennore Energy Terminal', x: 720, y: 130, icon: 'port' }
      ]
    },
    rovers: [
      { id: 'CN-01', name: 'Coromandel-Hunter', type: 'aerial', status: 'Deployed', battery: 83, connection: 'strong', task: 'Gale Wind Track — Offshore Wave Radar', x: 740, y: 150, home: { x: 800, y: 220 }, hazardId: 'CH-01' },
      { id: 'CN-02', name: 'Marina-Scout', type: 'ground', status: 'Deployed', battery: 67, connection: 'strong', task: 'Adyar Canal Flood Gate Survey', x: 380, y: 480, home: { x: 180, y: 550 }, hazardId: 'CH-02' },
      { id: 'CN-03', name: 'Adyar-Hydra Bot', type: 'ground', status: 'Ready', battery: 91, connection: 'strong', task: 'Standing by — Submersible Water Bot', x: 180, y: 550, home: { x: 180, y: 550 } },
      { id: 'CN-04', name: 'Bay-Hexacopter', type: 'aerial', status: 'Ready', battery: 97, connection: 'strong', task: 'Standing by — High Altitude Surge UAV', x: 800, y: 220, home: { x: 800, y: 220 } },
      { id: 'CN-05', name: 'Velachery-Track', type: 'ground', status: 'Returning', battery: 32, connection: 'moderate', task: 'Returning — Low Sump Clearance', x: 440, y: 420, home: { x: 180, y: 550 } }
    ],
    hazards: [
      { id: 'CH-01', type: 'Cyclone', name: 'Bay of Bengal Deep Depression', location: 'Coromandel Coast Approach Corridor', detected: '07:25', severity: 'severe', status: 'Active', source: 'IMD Chennai', x: 740, y: 150 },
      { id: 'CH-02', type: 'Flood', name: 'Adyar River Embankment Inflow', location: 'Adyar South Catchment Basin', detected: '06:10', severity: 'severe', status: 'Active', source: 'NDRF India', x: 380, y: 480 },
      { id: 'CH-03', type: 'Tsunami', name: 'Ennore Storm Surge Swell (3.6m)', location: 'North Chennai Coastal Barrier', detected: '04:50', severity: 'severe', status: 'Active', source: 'INCOIS', x: 620, y: 280 },
      { id: 'CH-04', type: 'Flood', name: 'Cooum Canal Urban Drainage Breach', location: 'Chennai Central Arterial Canal', detected: '08:30', severity: 'moderate', status: 'Active', source: 'GCC', x: 490, y: 360 },
      { id: 'CH-05', type: 'Cyclone', name: 'Marina Beach 90 km/h Gale Front', location: 'East Coast Road Coastal Stretch', detected: '09:00', severity: 'moderate', status: 'Watch', source: 'IMD', x: 800, y: 440 }
    ]
  },

  {
    id: 'kedarnath',
    name: 'Kedarnath & Chamoli Station',
    shortName: 'Kedarnath Station',
    state: 'Uttarakhand',
    region: 'Garhwal Himalayas & High-Altitude GLOF',
    riskLevel: 'CRITICAL',
    badgeClass: 'risk-critical',
    lat: 30.7346,
    lon: 79.0669,
    threats: ['Glacial Lake Outbursts (GLOF)', 'Cloudburst Floods', 'Alpine Mudslides'],
    description: 'Rugged high-altitude glacier corridor vulnerable to moraine dam breaches, cloudburst torrents, and Mandakini valley flash deluges.',
    depots: [
      { name: 'Sonprayag Mountain Depot', x: 160, y: 570, code: 'HQ-SONPRAYAG' },
      { name: 'Kedarnath Temple Helipad Base', x: 500, y: 220, code: 'HQ-KEDAR' }
    ],
    mapFeatures: {
      riverName: 'Mandakini River Gorge',
      coastOrRiverD: 'M460,0 C480,140 440,280 500,420 C540,520 490,580 470,640 L530,640 C550,560 590,450 560,340 C520,220 540,110 520,0 Z',
      terrainPaths: [
        'M40,60 C160,30 320,80 430,40',
        'M580,40 C720,80 860,30 980,60',
        'M20,200 C180,160 340,240 450,180',
        'M570,180 C740,220 880,160 990,210',
        'M30,390 C190,340 350,420 460,370',
        'M560,380 C720,430 870,360 980,410'
      ],
      landmarks: [
        { name: 'Chorabari Glacier Moraine', x: 500, y: 90, icon: 'glacier' },
        { name: 'Kedarnath Ridge Helipad', x: 500, y: 220, icon: 'helipad' },
        { name: 'Rambara Gorge Cut', x: 490, y: 380, icon: 'gorge' },
        { name: 'Bhairavnath Peak (3800m)', x: 720, y: 260, icon: 'peak' }
      ]
    },
    rovers: [
      { id: 'KD-01', name: 'Trishul-Alpine Drone', type: 'aerial', status: 'Deployed', battery: 74, connection: 'strong', task: 'Chorabari Glacier Lake Sensor Scan', x: 500, y: 130, home: { x: 500, y: 220 }, hazardId: 'KH-01' },
      { id: 'KD-02', name: 'Mandakini-Rover', type: 'ground', status: 'Deployed', battery: 62, connection: 'moderate', task: 'Gorge Debris Clearance — Rambara', x: 360, y: 350, home: { x: 160, y: 570 }, hazardId: 'KH-02' },
      { id: 'KD-03', name: 'Garhwal-Scout', type: 'ground', status: 'Ready', battery: 95, connection: 'strong', task: 'Standing by — Tethered Steep Slope Bot', x: 160, y: 570, home: { x: 160, y: 570 } },
      { id: 'KD-04', name: 'Chorabari-Eye', type: 'aerial', status: 'Ready', battery: 88, connection: 'strong', task: 'Standing by — Sub-Zero Thermal UAV', x: 500, y: 220, home: { x: 500, y: 220 } }
    ],
    hazards: [
      { id: 'KH-01', type: 'Flood', name: 'Chorabari Moraine Lake GLOF Risk', location: 'Upper Kedarnath Cirque Glacier', detected: '05:30', severity: 'severe', status: 'Active', source: 'WIHG Dehradun', x: 500, y: 130 },
      { id: 'KH-02', type: 'Landslide', name: 'Mandakini Gorge Massive Rockslide', location: 'Rambara-Gaurikund Highway MP 9', detected: '06:50', severity: 'severe', status: 'Active', source: 'USDMA', x: 360, y: 350 },
      { id: 'KH-03', type: 'Wildfire', name: 'Alpine Pine Ridge Flame Front', location: 'Guptkashi Valley Ridge Forest', detected: '08:10', severity: 'moderate', status: 'Active', source: 'NASA FIRMS', x: 720, y: 420 },
      { id: 'KH-04', type: 'Earthquake', name: 'Main Central Thrust Tremors (M 4.9)', location: 'Chamoli Fault Boundary Line', detected: '03:40', severity: 'moderate', status: 'Monitoring', magnitude: 'M 4.9', source: 'USGS', x: 210, y: 220 }
    ]
  },

  {
    id: 'puri',
    name: 'Puri & Odisha HYDRA Station',
    shortName: 'Puri Station',
    state: 'Odisha',
    region: 'Mahanadi Delta & East Coast Corridor',
    riskLevel: 'SEVERE',
    badgeClass: 'risk-severe',
    lat: 19.8135,
    lon: 85.8312,
    threats: ['Super Cyclones', 'Mahanadi Delta Floods', 'Bay of Bengal Storm Surges'],
    description: 'Primary landfall corridor for severe cyclonic storms in the Bay of Bengal, accompanied by delta river embankment overflows.',
    depots: [
      { name: 'Puri Coastal Command', x: 720, y: 520, code: 'HQ-PURI' },
      { name: 'Cuttack Delta Staging Base', x: 220, y: 340, code: 'HQ-CUTTACK' }
    ],
    mapFeatures: {
      riverName: 'Mahanadi River Delta & Ocean',
      coastOrRiverD: 'M0,0 L650,0 C620,160 720,320 680,480 C660,560 700,610 680,640 L0,640 Z',
      terrainPaths: [
        'M50,90 C220,120 420,80 580,100',
        'M40,240 C240,270 460,220 610,250',
        'M60,420 C280,450 490,390 630,420'
      ],
      landmarks: [
        { name: 'Chilika Lake Lagoon Channel', x: 190, y: 460, icon: 'water' },
        { name: 'Puri Temple Seafront', x: 680, y: 500, icon: 'coast' },
        { name: 'Mahanadi Main Embankment', x: 320, y: 380, icon: 'dam' },
        { name: 'Paradeep Deep Sea Harbor', x: 660, y: 160, icon: 'port' }
      ]
    },
    rovers: [
      { id: 'OD-01', name: 'Fani-Chaser UAV', type: 'aerial', status: 'Deployed', battery: 79, connection: 'strong', task: 'Super Cyclone Windfield Barometer Flight', x: 780, y: 200, home: { x: 720, y: 520 }, hazardId: 'OH-01' },
      { id: 'OD-02', name: 'Chilika-Hovercraft', type: 'ground', status: 'Deployed', battery: 65, connection: 'strong', task: 'Delta Breach Evacuation Corridor', x: 320, y: 380, home: { x: 220, y: 340 }, hazardId: 'OH-02' },
      { id: 'OD-03', name: 'Kalinga-Surge Bot', type: 'ground', status: 'Ready', battery: 92, connection: 'strong', task: 'Standing by — Sea Wall Reinforcement', x: 720, y: 520, home: { x: 720, y: 520 } },
      { id: 'OD-04', name: 'Mahanadi-Scout', type: 'ground', status: 'Ready', battery: 86, connection: 'strong', task: 'Standing by — Sluice Gate Monitor', x: 220, y: 340, home: { x: 220, y: 340 } }
    ],
    hazards: [
      { id: 'OH-01', type: 'Cyclone', name: 'Extremely Severe Cyclonic Storm', location: 'Offshore Puri-Ganjam Coast (130 km/h)', detected: '06:15', severity: 'severe', status: 'Active', source: 'IMD Bhubaneswar', x: 780, y: 200 },
      { id: 'OH-02', type: 'Flood', name: 'Mahanadi Delta Embankment Breach', location: 'Jagatsinghpur Riverine Basin', detected: '07:40', severity: 'severe', status: 'Active', source: 'OSDMA', x: 320, y: 380 },
      { id: 'OH-03', type: 'Tsunami', name: 'Puri Seafront Tidal Swell (4.2m)', location: 'Golden Beach Coastal Barrier', detected: '05:00', severity: 'severe', status: 'Active', source: 'INCOIS', x: 680, y: 500 },
      { id: 'OH-04', type: 'Flood', name: 'Chilika Inflow Level Warning', location: 'Chilika Lagoon Sluice Discharge', detected: '08:25', severity: 'moderate', status: 'Watch', source: 'CWC', x: 190, y: 460 }
    ]
  },

  {
    id: 'wayanad',
    name: 'Wayanad & Kochi HYDRA Station',
    shortName: 'Wayanad Station',
    state: 'Kerala',
    region: 'Western Ghats & Periyar Basin',
    riskLevel: 'CRITICAL',
    badgeClass: 'risk-critical',
    lat: 11.6854,
    lon: 76.1320,
    threats: ['Massive Debris Flow Landslides', 'Periyar Dam Spills', 'Monsoon Flash Floods'],
    description: 'Steep tropical Western Ghats slopes prone to devastating rainfall-induced mudslides, soil piping, and reservoir deluge.',
    depots: [
      { name: 'Meppadi Disaster HQ', x: 180, y: 520, code: 'HQ-MEPPADI' },
      { name: 'Kochi Coastal Airbase', x: 760, y: 560, code: 'HQ-KOCHI' }
    ],
    mapFeatures: {
      riverName: 'Periyar River & Ghat Slopes',
      coastOrRiverD: 'M0,320 C180,260 360,390 540,310 C720,240 880,360 1000,280 L1000,380 C860,450 700,340 520,420 C340,510 160,380 0,430 Z',
      terrainPaths: [
        'M40,80 C220,40 400,120 620,70 C800,20 960,80',
        'M20,190 C200,150 420,230 640,170 C840,120 980,180',
        'M30,510 C240,460 480,540 700,480 C880,440 990,500'
      ],
      landmarks: [
        { name: 'Chooralmala Debris Ridge', x: 420, y: 220, icon: 'slide' },
        { name: 'Vellarimala Peak (2300m)', x: 280, y: 310, icon: 'peak' },
        { name: 'Idukki Dam Reservoir', x: 650, y: 450, icon: 'dam' },
        { name: 'Aluva Urban Flood Basin', x: 510, y: 520, icon: 'water' }
      ]
    },
    rovers: [
      { id: 'KL-01', name: 'Sahyadri-Thermal Drone', type: 'aerial', status: 'Deployed', battery: 71, connection: 'strong', task: 'Canopy Penetrating Thermal Survivor Scan', x: 420, y: 220, home: { x: 180, y: 520 }, hazardId: 'WH-01' },
      { id: 'KL-02', name: 'Meppadi-Crawler', type: 'ground', status: 'Deployed', battery: 59, connection: 'moderate', task: 'Heavy Silt & Debris Trench Recon', x: 280, y: 310, home: { x: 180, y: 520 }, hazardId: 'WH-03' },
      { id: 'KL-03', name: 'Periyar-Aqua Inspector', type: 'ground', status: 'Ready', battery: 93, connection: 'strong', task: 'Standing by — Dam Sluice Ultrasonic Bot', x: 760, y: 560, home: { x: 760, y: 560 } },
      { id: 'KL-04', name: 'Chooralmala-1', type: 'ground', status: 'Ready', battery: 88, connection: 'strong', task: 'Standing by — High Torque Mud Tread', x: 180, y: 520, home: { x: 180, y: 520 } }
    ],
    hazards: [
      { id: 'WH-01', type: 'Landslide', name: 'Chooralmala Catastrophic Mudslide', location: 'Meppadi-Chooralmala Ghat Ridge', detected: '04:10', severity: 'severe', status: 'Active', source: 'KSDMA', x: 420, y: 220 },
      { id: 'WH-02', type: 'Flood', name: 'Idukki Dam High Discharge Sluice', location: 'Periyar River Gorge Basin', detected: '06:30', severity: 'severe', status: 'Active', source: 'KSEB', x: 650, y: 450 },
      { id: 'WH-03', type: 'Landslide', name: 'Vellarimala Hill Slope Fracture', location: 'Upper Vellarimala Tea Estate Slopes', detected: '07:45', severity: 'severe', status: 'Active', source: 'GSI Kerala', x: 280, y: 310 },
      { id: 'WH-04', type: 'Flood', name: 'Aluva Lowland Monsoon Inundation', location: 'Aluva Temple Riverbank Catchment', detected: '09:00', severity: 'moderate', status: 'Active', source: 'IMD', x: 510, y: 520 }
    ]
  },

  {
    id: 'mumbai',
    name: 'Mumbai HYDRA Station',
    shortName: 'Mumbai Station',
    state: 'Maharashtra',
    region: 'Konkan Coast & Salsette Island',
    riskLevel: 'SEVERE',
    badgeClass: 'risk-severe',
    lat: 19.0760,
    lon: 72.8777,
    threats: ['Monsoonal Cloudburst Floods', 'Mithi River Deluge', 'High-Tide Sea Inundation'],
    description: 'High-density coastal metropolis vulnerable to simultaneous cloudbursts, high-tide sea locks, and low-lying railway waterlogging.',
    depots: [
      { name: 'Bandra-Kurla Emergency HQ', x: 240, y: 540, code: 'HQ-BKC' },
      { name: 'Colaba Marine Station', x: 740, y: 560, code: 'HQ-COLABA' }
    ],
    mapFeatures: {
      riverName: 'Mithi River & Arabian Sea Coast',
      coastOrRiverD: 'M0,0 L700,0 C660,180 750,340 680,500 C640,580 690,620 670,640 L0,640 Z',
      terrainPaths: [
        'M60,100 C240,120 440,90 600,110',
        'M40,250 C260,280 480,230 620,260',
        'M50,420 C270,450 500,400 640,430'
      ],
      landmarks: [
        { name: 'Mithi River Sluice Gate', x: 460, y: 380, icon: 'canal' },
        { name: 'Marine Drive Sea Wall', x: 740, y: 490, icon: 'coast' },
        { name: 'Sanjay Gandhi Forest Hills', x: 310, y: 160, icon: 'hill' },
        { name: 'Hindmata Sump Catchment', x: 380, y: 460, icon: 'water' }
      ]
    },
    rovers: [
      { id: 'MB-01', name: 'Mithi-Scout Crawler', type: 'ground', status: 'Deployed', battery: 76, connection: 'strong', task: 'Mithi Silt Culvert Flow Monitoring', x: 460, y: 380, home: { x: 240, y: 540 }, hazardId: 'MH-01' },
      { id: 'MB-02', name: 'Gateway-SkyEye', type: 'aerial', status: 'Deployed', battery: 82, connection: 'strong', task: 'High Tide Storm Barrier Surveillance', x: 740, y: 490, home: { x: 740, y: 560 }, hazardId: 'MH-02' },
      { id: 'MB-03', name: 'Salsette-Amphibian', type: 'ground', status: 'Ready', battery: 94, connection: 'strong', task: 'Standing by — Submerged Highway Bot', x: 240, y: 540, home: { x: 240, y: 540 } },
      { id: 'MB-04', name: 'Konkan-Patrol', type: 'aerial', status: 'Ready', battery: 90, connection: 'strong', task: 'Standing by — Coastal Wind Monitor', x: 740, y: 560, home: { x: 740, y: 560 } }
    ],
    hazards: [
      { id: 'MH-01', type: 'Flood', name: 'Mithi River Overflow & Kurla Basin', location: 'Mithi River Basin, Central Mumbai', detected: '06:50', severity: 'severe', status: 'Active', source: 'BMC Disaster Cell', x: 460, y: 380 },
      { id: 'MH-02', type: 'Flood', name: 'High Tide (4.8m) Sea Inundation', location: 'Marine Drive & Worli Seafront', detected: '07:30', severity: 'severe', status: 'Active', source: 'INCOIS', x: 740, y: 490 },
      { id: 'MH-03', type: 'Landslide', name: 'Malabar Hill Slope Instability', location: 'Malabar Hill Western Ridge Road', detected: '05:15', severity: 'moderate', status: 'Active', source: 'GSI', x: 220, y: 520 },
      { id: 'MH-04', type: 'Cyclone', name: 'Arabian Sea Tropical Squall Front', location: 'Offshore Mumbai Port Corridor', detected: '08:40', severity: 'moderate', status: 'Watch', source: 'IMD Colaba', x: 790, y: 210 }
    ]
  },

  {
    id: 'kolkata',
    name: 'Kolkata & Sundarbans Station',
    shortName: 'Kolkata Station',
    state: 'West Bengal',
    region: 'Ganga-Brahmaputra Delta & Mangroves',
    riskLevel: 'SEVERE',
    badgeClass: 'risk-severe',
    lat: 22.5726,
    lon: 88.3639,
    threats: ['Cyclone Storm Surges', 'Sundarbans Embankment Breaches', 'Hooghly River Deluges'],
    description: 'Dense estuarine delta region prone to tidal surges, mangrove erosion, and cyclonic landfalls over the Bay of Bengal.',
    depots: [
      { name: 'Alipore Disaster Central HQ', x: 190, y: 540, code: 'HQ-ALIPORE' },
      { name: 'Kakdwip Delta Command', x: 750, y: 510, code: 'HQ-KAKDWIP' }
    ],
    mapFeatures: {
      riverName: 'Hooghly River & Sundarbans Delta',
      coastOrRiverD: 'M0,280 C220,210 390,340 560,260 C740,190 880,310 1000,240 L1000,360 C860,430 710,320 540,400 C360,490 180,360 0,410 Z',
      terrainPaths: [
        'M40,90 C220,50 420,120 620,80 C820,40 980,90',
        'M20,190 C240,160 460,220 680,170 C870,130 990,190',
        'M50,510 C260,470 500,530 720,480 C890,450 990,510'
      ],
      landmarks: [
        { name: 'Sundarbans Mangrove Core', x: 670, y: 320, icon: 'tree' },
        { name: 'Gosalba Embankment Dyke', x: 790, y: 480, icon: 'dam' },
        { name: 'Howrah Hooghly Bridge', x: 380, y: 260, icon: 'bridge' },
        { name: 'Sagar Island Pilot Station', x: 620, y: 550, icon: 'coast' }
      ]
    },
    rovers: [
      { id: 'WB-01', name: 'Sundarban-Hover UAV', type: 'aerial', status: 'Deployed', battery: 84, connection: 'strong', task: 'Tidal Breach Aerial Reconnaissance', x: 670, y: 320, home: { x: 750, y: 510 }, hazardId: 'SH-01' },
      { id: 'WB-02', name: 'Hooghly-Current Bot', type: 'ground', status: 'Deployed', battery: 63, connection: 'strong', task: 'Embankment Seepage Structural Bot', x: 790, y: 480, home: { x: 750, y: 510 }, hazardId: 'SH-02' },
      { id: 'WB-03', name: 'Delta-Crawler', type: 'ground', status: 'Ready', battery: 91, connection: 'strong', task: 'Standing by — Mudflat All-Terrain Unit', x: 190, y: 540, home: { x: 190, y: 540 } },
      { id: 'WB-04', name: 'Kakdwip-Flyer', type: 'aerial', status: 'Ready', battery: 95, connection: 'strong', task: 'Standing by — Offshore Islands Scanner', x: 750, y: 510, home: { x: 750, y: 510 } }
    ],
    hazards: [
      { id: 'SH-01', type: 'Cyclone', name: 'Severe Cyclonic Landfall Surge', location: 'Sundarbans Outer Islands Channel', detected: '05:40', severity: 'severe', status: 'Active', source: 'IMD Kolkata', x: 670, y: 320 },
      { id: 'SH-02', type: 'Flood', name: 'Gosaba Tidal Embankment Failure', location: 'South 24 Parganas Delta Reach', detected: '06:55', severity: 'severe', status: 'Active', source: 'WBDMD', x: 790, y: 480 },
      { id: 'SH-03', type: 'Flood', name: 'Hooghly River High Water Surge', location: 'Hooghly Basin Howrah Embankment', detected: '08:15', severity: 'moderate', status: 'Active', source: 'CWC', x: 380, y: 260 },
      { id: 'SH-04', type: 'Wildfire', name: 'Delta Peatland Flame Front', location: 'Sundarban Biosphere Buffer Zone', detected: '09:10', severity: 'low', status: 'Monitoring', source: 'NASA FIRMS', x: 210, y: 450 }
    ]
  },

  {
    id: 'bhuj',
    name: 'Bhuj & Kutch HYDRA Station',
    shortName: 'Bhuj Station',
    state: 'Gujarat',
    region: 'Kutch Fault Belt & Thar Desert Edge',
    riskLevel: 'CRITICAL',
    badgeClass: 'risk-critical',
    lat: 23.2420,
    lon: 69.6669,
    threats: ['Zone V Intraplate Earthquakes', 'Arabian Sea Cyclones', 'Rann Salt Flat Flash Surges'],
    description: 'Seismically volatile desert rift zone infamous for historical M 7.7+ earthquakes, liquefaction, and coastal storm incursions.',
    depots: [
      { name: 'Bhuj Seismo Command HQ', x: 220, y: 530, code: 'HQ-BHUJ' },
      { name: 'Kandla Port Industrial Depot', x: 740, y: 520, code: 'HQ-KANDLA' }
    ],
    mapFeatures: {
      riverName: 'Great Rann of Kutch & Gulf',
      coastOrRiverD: 'M0,0 L680,0 C640,160 740,320 670,490 C630,570 690,620 660,640 L0,640 Z',
      terrainPaths: [
        'M50,80 C230,100 450,70 610,90',
        'M30,220 C250,260 470,210 630,240',
        'M40,380 C260,420 490,370 650,400'
      ],
      landmarks: [
        { name: 'Kutch Mainland Fault (KMF)', x: 480, y: 310, icon: 'fault' },
        { name: 'Gulf of Kutch Maritime Channel', x: 760, y: 440, icon: 'port' },
        { name: 'Great Rann Salt Crust Basin', x: 340, y: 160, icon: 'desert' },
        { name: 'Allah Bund Historic Escarpment', x: 210, y: 240, icon: 'fault' }
      ]
    },
    rovers: [
      { id: 'GJ-01', name: 'Rann-SandCrawler', type: 'ground', status: 'Deployed', battery: 77, connection: 'strong', task: 'KMF Seismic Rupture Field Analysis', x: 480, y: 310, home: { x: 220, y: 530 }, hazardId: 'BH-01' },
      { id: 'GJ-02', name: 'Kutch-SeismoDrone', type: 'aerial', status: 'Deployed', battery: 85, connection: 'strong', task: 'Gulf of Kutch Wind & Wave Radar', x: 760, y: 440, home: { x: 740, y: 520 }, hazardId: 'BH-02' },
      { id: 'GJ-03', name: 'Kandla-Surge Rover', type: 'ground', status: 'Ready', battery: 93, connection: 'strong', task: 'Standing by — Port Chemical Hazard Bot', x: 740, y: 520, home: { x: 740, y: 520 } },
      { id: 'GJ-04', name: 'Anjar-Rescue Scout', type: 'ground', status: 'Ready', battery: 89, connection: 'strong', task: 'Standing by — Rubble Penetration Bot', x: 220, y: 530, home: { x: 220, y: 530 } }
    ],
    hazards: [
      { id: 'BH-01', type: 'Earthquake', name: 'Kutch Mainland Fault Active Swarm', location: 'Bhuj North Rupture Zone (M 5.8)', detected: '04:45', severity: 'severe', status: 'Active', source: 'ISR Gujarat', x: 480, y: 310 },
      { id: 'BH-02', type: 'Cyclone', name: 'Gulf of Kutch Tropical Storm Surge', location: 'Kandla-Mandvi Coastal Strip', detected: '06:10', severity: 'severe', status: 'Active', source: 'IMD Ahmedabad', x: 760, y: 440 },
      { id: 'BH-03', type: 'Flood', name: 'Great Rann Salt Crust Inundation', location: 'Khavda Northern Salt Expanse', detected: '08:00', severity: 'moderate', status: 'Active', source: 'GSDMA', x: 340, y: 160 },
      { id: 'BH-04', type: 'Earthquake', name: 'Allah Bund Fault Slip Monitoring', location: 'Indo-Pak Border Fault Corridor', detected: '03:20', severity: 'moderate', status: 'Monitoring', magnitude: 'M 4.5', source: 'USGS', x: 210, y: 240 }
    ]
  },

  {
    id: 'shimla',
    name: 'Shimla & Kullu-Manali Station',
    shortName: 'Shimla Station',
    state: 'Himachal Pradesh',
    region: 'Himachal Himalayas & Beas Basin',
    riskLevel: 'SEVERE',
    badgeClass: 'risk-severe',
    lat: 31.1048,
    lon: 77.1734,
    threats: ['Beas River Flash Deluges', 'NH-3 / NH-5 Rockslides', 'Alpine Cloudbursts'],
    description: 'Rugged Himachal gorges prone to monsoon river torrents, massive highway rockfalls, and slope destabilization.',
    depots: [
      { name: 'Shimla Ridge Operations Base', x: 190, y: 550, code: 'HQ-SHIMLA' },
      { name: 'Kullu Valley Forward Depot', x: 760, y: 210, code: 'HQ-KULLU' }
    ],
    mapFeatures: {
      riverName: 'Beas River Torrent & Ridge',
      coastOrRiverD: 'M480,0 C510,130 460,260 520,390 C560,490 510,560 490,640 L550,640 C570,550 610,430 580,320 C540,200 560,100 540,0 Z',
      terrainPaths: [
        'M30,70 C160,40 310,90 430,50',
        'M590,50 C730,90 870,40 980,70',
        'M20,210 C180,170 340,250 450,190',
        'M580,190 C750,230 890,170 990,220',
        'M40,410 C200,360 360,440 470,390',
        'M570,400 C730,450 880,380 980,430'
      ],
      landmarks: [
        { name: 'Pandoh Dam Sluice Catchment', x: 530, y: 280, icon: 'dam' },
        { name: 'Aut Tunnel Highway Rockslide', x: 390, y: 410, icon: 'slide' },
        { name: 'Shimla Ridge Heritage Zone', x: 240, y: 490, icon: 'hill' },
        { name: 'Rohtang Pass (3978m)', x: 680, y: 120, icon: 'peak' }
      ]
    },
    rovers: [
      { id: 'HP-01', name: 'Beas-Torrent Drone', type: 'aerial', status: 'Deployed', battery: 73, connection: 'strong', task: 'River Velocity & Gorge Water Spate', x: 530, y: 280, home: { x: 760, y: 210 }, hazardId: 'SM-01' },
      { id: 'HP-02', name: 'Himalaya-SkyEye', type: 'aerial', status: 'Deployed', battery: 81, connection: 'strong', task: 'Highway Rockfall Thermal Scanning', x: 390, y: 410, home: { x: 190, y: 550 }, hazardId: 'SM-02' },
      { id: 'HP-03', name: 'Rohtang-Crawler', type: 'ground', status: 'Ready', battery: 94, connection: 'strong', task: 'Standing by — Scree Slope Heavy Bot', x: 190, y: 550, home: { x: 190, y: 550 } },
      { id: 'HP-04', name: 'Parvati-Scout', type: 'ground', status: 'Ready', battery: 87, connection: 'strong', task: 'Standing by — Tributary Valley Explorer', x: 760, y: 210, home: { x: 760, y: 210 } }
    ],
    hazards: [
      { id: 'SM-01', type: 'Flood', name: 'Beas River Cloudburst Spate', location: 'Pandoh-Mandi River Highway Gorge', detected: '05:10', severity: 'severe', status: 'Active', source: 'HPSDMA', x: 530, y: 280 },
      { id: 'SM-02', type: 'Landslide', name: 'Aut Tunnel Massive Rockfall', location: 'Chandigarh-Manali NH-3 Corridor', detected: '06:35', severity: 'severe', status: 'Active', source: 'BRO India', x: 390, y: 410 },
      { id: 'SM-03', type: 'Landslide', name: 'Shimla Ridge Structural Fissures', location: 'Mall Road-Lakkar Bazaar Slopes', detected: '07:50', severity: 'moderate', status: 'Active', source: 'GSI HP', x: 240, y: 490 },
      { id: 'SM-04', type: 'Earthquake', name: 'Kangra Fault Micro-Swarm (M 4.4)', location: 'Kangra-Chamba Boundary Fault', detected: '03:15', severity: 'moderate', status: 'Monitoring', magnitude: 'M 4.4', source: 'USGS', x: 680, y: 190 }
    ]
  },

  {
    id: 'patna',
    name: 'Patna & Kosi HYDRA Station',
    shortName: 'Patna Station',
    state: 'Bihar',
    region: 'Indo-Gangetic Plain & Kosi Basin',
    riskLevel: 'CRITICAL',
    badgeClass: 'risk-critical',
    lat: 25.5941,
    lon: 85.1376,
    threats: ['Kosi River Embankment Breaches', 'Ganges Delta Spills', 'North Bihar Inundations'],
    description: 'Known as the "Sorrow of Bihar", the volatile shifting Kosi river basin causes massive seasonal inundations affecting millions.',
    depots: [
      { name: 'Patna Disaster Command HQ', x: 190, y: 550, code: 'HQ-PATNA' },
      { name: 'Supaul Kosi Forward Base', x: 760, y: 220, code: 'HQ-SUPAUL' }
    ],
    mapFeatures: {
      riverName: 'Ganges & Kosi River Confluence',
      coastOrRiverD: 'M0,260 C210,190 380,320 550,240 C730,170 870,290 1000,220 L1000,340 C850,410 700,300 530,380 C350,470 170,340 0,390 Z',
      terrainPaths: [
        'M40,90 C220,50 420,120 620,80 C820,40 980,90',
        'M20,190 C240,160 460,220 680,170 C870,130 990,190',
        'M50,510 C260,470 500,530 720,480 C890,450 990,510'
      ],
      landmarks: [
        { name: 'Kosi Birpur Embankment', x: 620, y: 220, icon: 'dam' },
        { name: 'Ganges-Gandak Confluence', x: 410, y: 390, icon: 'water' },
        { name: 'Patna Urban Sump Drainage', x: 290, y: 480, icon: 'urban' },
        { name: 'Darbhanga Lowland Floodplain', x: 740, y: 140, icon: 'water' }
      ]
    },
    rovers: [
      { id: 'BH-01', name: 'Kosi-Amphibian 1', type: 'ground', status: 'Deployed', battery: 78, connection: 'strong', task: 'Kosi Embankment Breach Evacuation Bot', x: 620, y: 220, home: { x: 760, y: 220 }, hazardId: 'PT-01' },
      { id: 'BH-02', name: 'Mithila-Aero Scanner', type: 'aerial', status: 'Deployed', battery: 84, connection: 'strong', task: 'Flood Inundation Area Multi-Spectral Scan', x: 410, y: 390, home: { x: 190, y: 550 }, hazardId: 'PT-02' },
      { id: 'BH-03', name: 'Ganges-Patrol', type: 'ground', status: 'Ready', battery: 96, connection: 'strong', task: 'Standing by — High Current River Rescue Bot', x: 190, y: 550, home: { x: 190, y: 550 } },
      { id: 'BH-04', name: 'Seemanchal-Scout', type: 'aerial', status: 'Ready', battery: 90, connection: 'strong', task: 'Standing by — Long Range Silt Survey UAV', x: 760, y: 220, home: { x: 760, y: 220 } }
    ],
    hazards: [
      { id: 'PT-01', type: 'Flood', name: 'Kosi Embankment Heavy Discharge', location: 'Birpur Barrage Sector 8 Sluice', detected: '04:30', severity: 'severe', status: 'Active', source: 'CWC Patna', x: 620, y: 220 },
      { id: 'PT-02', type: 'Flood', name: 'Ganges-Gandak Confluence Spate', location: 'Digha-Sonepur Lowland Reach', detected: '06:05', severity: 'severe', status: 'Active', source: 'BSDMA', x: 410, y: 390 },
      { id: 'PT-03', type: 'Flood', name: 'Patna Lowland Storm Inundation', location: 'Rajendra Nagar Drainage Sump', detected: '07:45', severity: 'moderate', status: 'Active', source: 'Patna Municipal', x: 290, y: 480 },
      { id: 'PT-04', type: 'Earthquake', name: 'Bihar-Nepal Border Fault (M 4.7)', location: 'Raxaul-Birgunj Border Fault Zone', detected: '03:10', severity: 'moderate', status: 'Monitoring', magnitude: 'M 4.7', source: 'USGS', x: 740, y: 140 }
    ]
  }
];

/* =========================================================
   ACTIVE FLEET & HAZARD WORKING STATE
========================================================= */

// Default active station: Guwahati HYDRA Station (Assam)
let currentStationId = 'guwahati';

function getStationById(id) {
  return HYDRA_STATIONS.find(s => s.id === id) || HYDRA_STATIONS[0];
}

// Initial dataset loaded from default station (Guwahati)
const rovers = [...HYDRA_STATIONS[0].rovers];
let hazards = [...HYDRA_STATIONS[0].hazards];
const fallbackHazards = [...HYDRA_STATIONS[0].hazards];

function switchHydraStation(stationId) {
  const station = getStationById(stationId);
  if (!station) return false;

  currentStationId = station.id;

  // Preserve any connected physical ESP32 rovers across station changes
  const connectedEspRovers = rovers.filter(r => r.isEsp32);

  // Clear simulated rovers and load the new station's unique fleet roster
  rovers.length = 0;
  rovers.push(...connectedEspRovers, ...station.rovers.map(r => ({ ...r, home: { ...r.home } })));

  // Load new station's localized hazards
  hazards.length = 0;
  hazards.push(...station.hazards.map(h => ({ ...h })));

  // Update telemetry base coordinates for physics engine
  if (typeof HYDRA_TELEMETRY !== 'undefined' && HYDRA_TELEMETRY.init) {
    HYDRA_TELEMETRY.init();
  }

  // Reset map view box to full station overview
  if (typeof resetMapViewBox === 'function') {
    resetMapViewBox();
  }

  // Update active state
  if (typeof state !== 'undefined') {
    state.selectedStationId = station.id;
    state.selectedRoverId = null;
    state.selectedHazardId = null;
    state.activeTargetId = 'ALL';
    state.liveFeedRoverId = null;
  }

  console.log(`[HYDRA] Switched to Station: ${station.name} (${station.state}) — ${station.rovers.length} local rovers, ${station.hazards.length} hazards.`);
  return true;
}

const hazardIcons = {
  Wildfire: `<path d="M12 2c1 3-2 4-2 7a3 3 0 0 0 6 0c0-1-.5-1.5-1-2 2 1 3 3 3 5a6 6 0 1 1-12 0c0-4 3-6 4-10 .5 2 1.5 3 2 0z"/>`,
  Landslide: `<path d="M2 20l6-10 4 5 3-4 7 9z"/><path d="M2 20h20" stroke-width="1.4"/>`,
  Flood: `<path d="M2 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 19c2-2 4-2 6 0s4 2 6 0 4-2 6 0" fill="none" stroke-width="1.6" stroke-linecap="round"/>`,
  Earthquake: `<path d="M2 12h4l2-6 3 12 2-8 2 4 2-2h5" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  Cyclone: `<path d="M12 12c3-4 8-2 8 2a5 5 0 0 1-9 3M12 12c-3-4-8-2-8 2a5 5 0 0 0 9 3M12 12a3 3 0 1 1 0 0" fill="none" stroke-width="1.5"/>`,
  Tsunami: `<path d="M2 18c1.5-3 3-4 5-4s3.5 2 5 2 3-3 5-3 3 1.5 5 3" fill="none" stroke-width="1.6" stroke-linecap="round"/><path d="M4 14c2-6 6-8 8-10" fill="none" stroke-width="1.4" stroke-linecap="round"/>`
};
