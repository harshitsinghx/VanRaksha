// ===================================================
// VANARAKHSA AI — APP LOGIC
// Phase 1: Map, Layers, Alerts, Timeline, Species, Scanner
// ===================================================

// ===== STATE =====
let map;
let currentYear = 2024;
let activeView = 'map';
let layerState = { ndvi: true, deforestation: true, protected: true, fires: true, species: false };
let markers = { fires: [], protected: [], deforestation: [], species: [] };
let ndviOverlayVisible = true;
let liveCounter = 0;
let chartsInitialized = false;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  renderAlerts();
  renderThreatZones();
  renderNDVIRing();
  startLiveCounters();
  startLiveAlerts();
  renderZonesGrid(PROTECTED_ZONES);
  renderSpeciesGrid();
  initPhase2();       // Phase 2: GBIF, AQI, relocation engine
  populateReportAlerts();
  initPhase3();       // Phase 3: Incident Reports, Fire Sim, Comparator
});

// Wait for Chart.js CDN to finish loading before rendering sidebar charts
// (CDN can be slow — polling is more reliable than a fixed timeout)
function waitForChartJS() {
  if (typeof Chart !== 'undefined') {
    renderMiniCharts();
  } else {
    setTimeout(waitForChartJS, 50);
  }
}
window.addEventListener('load', waitForChartJS);

// ===== MAP INIT =====
function initMap() {
  map = new maplibregl.Map({
    container: 'map',
    style: {
      version: 8,
      sources: {
        'carto-dark': {
          type: 'raster',
          tiles: ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'],
          tileSize: 256,
          attribution: '© CARTO © OpenStreetMap'
        }
      },
      layers: [{ id: 'carto-dark', type: 'raster', source: 'carto-dark' }]
    },
    center: [82.8, 21.5],
    zoom: 5,
    minZoom: 4,
    maxZoom: 14
  });

  map.addControl(new maplibregl.NavigationControl(), 'bottom-right');
  map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

  map.on('load', () => {
    addNDVILayer();
    addDeforestationLayer();
    addFireLayer();
    addProtectedAreasLayer();
    addCorridorLayer();
  });

  map.on('mousemove', (e) => {
    document.getElementById('coords-lat').textContent = `${e.lngLat.lat.toFixed(4)}°N`;
    document.getElementById('coords-lng').textContent = `${e.lngLat.lng.toFixed(4)}°E`;
    document.getElementById('coords-zoom').textContent = `Zoom: ${Math.round(map.getZoom())}`;
  });

  map.on('click', (e) => {
    // Check if a feature was clicked
    const features = map.queryRenderedFeatures(e.point, {
      layers: ['deforestation-fill', 'protected-fill', 'fire-circles']
    });
    if (!features.length) {
      // Open scanner with these coordinates
      document.getElementById('scan-lat').value = e.lngLat.lat.toFixed(4);
      document.getElementById('scan-lng').value = e.lngLat.lng.toFixed(4);
    }
  });
}

// ===== NDVI LAYER =====
function addNDVILayer() {
  // We simulate NDVI as a colourful fill over India using a large set of grid cells
  const ndviGrid = generateNDVIGrid();

  map.addSource('ndvi-source', {
    type: 'geojson',
    data: ndviGrid
  });

  map.addLayer({
    id: 'ndvi-fill',
    type: 'fill',
    source: 'ndvi-source',
    paint: {
      'fill-color': ['get', 'color'],
      'fill-opacity': 0.45
    }
  });

  map.on('click', 'ndvi-fill', (e) => {
    const props = e.features[0].properties;
    new maplibregl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(`
        <div style="min-width:180px">
          <div style="font-weight:700;font-size:14px;color:#3dcc73;margin-bottom:6px">🛰 NDVI Reading</div>
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <span style="color:#a4f5c4">NDVI Value</span>
            <strong>${props.ndvi}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <span style="color:#a4f5c4">Vegetation</span>
            <strong>${ndviLabel(props.ndvi)}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <span style="color:#a4f5c4">Year</span>
            <strong>${currentYear}</strong>
          </div>
          <div style="height:6px;border-radius:99px;background:linear-gradient(to right,#7a3605,#c8a000,#3dcc73,#004d18);margin-top:8px;position:relative">
            <div style="position:absolute;top:-4px;left:${props.ndvi*100}%;transform:translateX(-50%);width:3px;height:14px;background:#fff;border-radius:2px"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:9px;color:#5de896;margin-top:2px"><span>0.0</span><span>1.0</span></div>
        </div>
      `)
      .addTo(map);
  });

  map.on('mouseenter', 'ndvi-fill', () => map.getCanvas().style.cursor = 'crosshair');
  map.on('mouseleave', 'ndvi-fill', () => map.getCanvas().style.cursor = '');
}

function ndviLabel(val) {
  if (val < 0.2) return 'Bare soil';
  if (val < 0.35) return 'Sparse veg.';
  if (val < 0.5) return 'Grassland';
  if (val < 0.65) return 'Mixed forest';
  if (val < 0.8) return 'Dense forest';
  return 'Very dense';
}

function generateNDVIGrid() {
  const features = [];
  const step = 0.8;
  // India bounds approx: lat 8–37, lng 68–97
  for (let lat = 8; lat < 37; lat += step) {
    for (let lng = 68; lng < 97; lng += step) {
      if (!isInIndia(lat + step / 2, lng + step / 2)) continue;
      const ndvi = getNDVIForCell(lat, lng, currentYear);
      features.push({
        type: 'Feature',
        properties: { ndvi: ndvi.toFixed(2), color: ndviColor(ndvi) },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [lng, lat], [lng + step, lat], [lng + step, lat + step], [lng, lat + step], [lng, lat]
          ]]
        }
      });
    }
  }
  return { type: 'FeatureCollection', features };
}

// Rough India polygon check
function isInIndia(lat, lng) {
  if (lat < 8 || lat > 37 || lng < 68 || lng > 97) return false;
  // Northeast exclusion (ocean)
  if (lat < 10 && lng > 80) return false;
  if (lat > 35 && lng < 74) return false;
  if (lat < 12 && lng < 76) return false;
  // Pakistan / Bangladesh rough exclusion
  if (lng < 70 && lat > 30) return false;
  return true;
}

function getNDVIForCell(lat, lng, year) {
  // Seed a deterministic NDVI based on lat/lng
  const seed = Math.sin(lat * 127.1 + lng * 311.7) * 0.5 + 0.5;
  // Base NDVI zones (Northeast + Western Ghats higher)
  let base;
  if ((lat > 22 && lng > 88) || (lat > 25 && lng > 90)) base = 0.75;   // Northeast
  else if (lat < 14 && lng < 78) base = 0.72;   // Western Ghats
  else if (lat > 28 && lng < 80) base = 0.62;   // Himalayas
  else if (lat < 25 && lng < 76) base = 0.4;    // Rajasthan arid
  else if (lat > 20 && lng < 78) base = 0.55;   // Deccan plateau
  else base = 0.58;
  // Year degradation
  const yearFactor = (year - 2000) * -0.002;
  // Some zones improved post-2019 (afforestation drives)
  const improvement = year > 2019 ? 0.01 : 0;
  return Math.max(0.05, Math.min(0.95, base + seed * 0.2 + yearFactor + improvement));
}

// ===== DEFORESTATION LAYER =====
function addDeforestationLayer() {
  const features = DEFORESTATION_ZONES.map(z => ({
    type: 'Feature',
    properties: { name: z.name, severity: z.severity },
    geometry: {
      type: 'Polygon',
      coordinates: [createCircleCoords(z.lng, z.lat, z.radius, 24)]
    }
  }));

  map.addSource('deforestation-source', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features }
  });

  map.addLayer({
    id: 'deforestation-fill',
    type: 'fill',
    source: 'deforestation-source',
    paint: {
      'fill-color': ['case',
        ['==', ['get', 'severity'], 'high'], '#ff4444',
        ['==', ['get', 'severity'], 'medium'], '#ff9900',
        '#ffdd00'
      ],
      'fill-opacity': 0.35
    }
  });

  map.addLayer({
    id: 'deforestation-stroke',
    type: 'line',
    source: 'deforestation-source',
    paint: {
      'line-color': ['case',
        ['==', ['get', 'severity'], 'high'], '#ff4444',
        ['==', ['get', 'severity'], 'medium'], '#ff9900',
        '#ffdd00'
      ],
      'line-width': 1.5,
      'line-dasharray': [3, 2]
    }
  });

  map.on('click', 'deforestation-fill', (e) => {
    const props = e.features[0].properties;
    new maplibregl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(`
        <div>
          <div style="font-weight:700;font-size:14px;color:#ff9900;margin-bottom:6px">🌳 Deforestation Zone</div>
          <div style="margin-bottom:4px;font-weight:600">${props.name}</div>
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <span style="color:#a4f5c4">Severity</span>
            <strong style="color:${props.severity==='high'?'#ff4444':'#ff9900'}">${props.severity.toUpperCase()}</strong>
          </div>
          <div style="font-size:11px;color:#5de896;margin-top:8px">⚠️ Urgent intervention required</div>
        </div>
      `)
      .addTo(map);
  });
}

// ===== FIRE LAYER =====
function addFireLayer() {
  const features = FIRE_HOTSPOTS.map(f => ({
    type: 'Feature',
    properties: { name: f.name, intensity: f.intensity },
    geometry: { type: 'Point', coordinates: [f.lng, f.lat] }
  }));

  map.addSource('fire-source', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features }
  });

  map.addLayer({
    id: 'fire-halo',
    type: 'circle',
    source: 'fire-source',
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['get', 'intensity'], 0.3, 16, 1.0, 28],
      'circle-color': '#ff4444',
      'circle-opacity': 0.12,
      'circle-blur': 1
    }
  });

  map.addLayer({
    id: 'fire-circles',
    type: 'circle',
    source: 'fire-source',
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['get', 'intensity'], 0.3, 6, 1.0, 12],
      'circle-color': ['interpolate', ['linear'], ['get', 'intensity'], 0.3, '#ffd000', 0.7, '#ff6600', 1.0, '#ff2200'],
      'circle-stroke-width': 1.5,
      'circle-stroke-color': '#fff'
    }
  });

  map.on('click', 'fire-circles', (e) => {
    const props = e.features[0].properties;
    new maplibregl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(`
        <div>
          <div style="font-weight:700;font-size:14px;color:#ff6600;margin-bottom:6px">🔥 Fire Hotspot</div>
          <div style="margin-bottom:6px;font-weight:600">${props.name}</div>
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <span style="color:#a4f5c4">Intensity</span>
            <strong style="color:#ff4444">${(props.intensity * 100).toFixed(0)}%</strong>
          </div>
          <div style="font-size:11px;color:#ff9900;margin-top:6px">🛰️ Source: NASA FIRMS</div>
        </div>
      `)
      .addTo(map);
  });

  map.on('mouseenter', 'fire-circles', () => map.getCanvas().style.cursor = 'pointer');
  map.on('mouseleave', 'fire-circles', () => map.getCanvas().style.cursor = '');
}

// ===== PROTECTED AREAS LAYER =====
function addProtectedAreasLayer() {
  const features = PROTECTED_ZONES.map(z => ({
    type: 'Feature',
    properties: { name: z.name, type: z.type, typeName: z.typeName, ndvi: z.ndvi, threat: z.threat, area: z.area, species: z.species.join(', '), icon: z.icon, state: z.state },
    geometry: {
      type: 'Polygon',
      coordinates: [createCircleCoords(z.lng, z.lat, Math.sqrt(z.area / 314) * 0.6, 32)]
    }
  }));

  map.addSource('protected-source', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features }
  });

  map.addLayer({
    id: 'protected-fill',
    type: 'fill',
    source: 'protected-source',
    paint: {
      'fill-color': ['case',
        ['==', ['get', 'type'], 'tiger-reserve'], '#fbbf24',
        ['==', ['get', 'type'], 'biosphere'], '#a855f7',
        ['==', ['get', 'type'], 'wildlife-sanctuary'], '#38bdf8',
        '#27a057'
      ],
      'fill-opacity': 0.15
    }
  });

  map.addLayer({
    id: 'protected-stroke',
    type: 'line',
    source: 'protected-source',
    paint: {
      'line-color': ['case',
        ['==', ['get', 'type'], 'tiger-reserve'], '#fbbf24',
        ['==', ['get', 'type'], 'biosphere'], '#a855f7',
        ['==', ['get', 'type'], 'wildlife-sanctuary'], '#38bdf8',
        '#27a057'
      ],
      'line-width': 1.5
    }
  });

  map.on('click', 'protected-fill', (e) => {
    const p = e.features[0].properties;
    new maplibregl.Popup({ maxWidth: '240px' })
      .setLngLat(e.lngLat)
      .setHTML(`
        <div>
          <div style="font-weight:700;font-size:15px;color:#3dcc73;margin-bottom:4px">${p.icon} ${p.name}</div>
          <div style="font-size:11px;color:#a4f5c4;margin-bottom:8px">${p.typeName} · ${p.state}</div>
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <span style="color:#a4f5c4">Area</span><strong>${p.area.toLocaleString()} km²</strong>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <span style="color:#a4f5c4">NDVI</span><strong style="color:#3dcc73">${p.ndvi}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:8px">
            <span style="color:#a4f5c4">Threat</span><strong style="color:${threatColor(p.threat)}">${p.threat}%</strong>
          </div>
          <div style="font-size:11px;color:#a4f5c4">🦁 ${p.species}</div>
        </div>
      `)
      .addTo(map);
  });

  map.on('mouseenter', 'protected-fill', () => map.getCanvas().style.cursor = 'pointer');
  map.on('mouseleave', 'protected-fill', () => map.getCanvas().style.cursor = '');
}

// ===== SPECIES CORRIDOR LAYER =====
function addCorridorLayer() {
  const features = CORRIDORS.map(c => ({
    type: 'Feature',
    properties: { name: c.name, species: c.species },
    geometry: {
      type: 'LineString',
      coordinates: c.points.map(p => [p[1], p[0]])
    }
  }));

  map.addSource('corridor-source', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features }
  });

  map.addLayer({
    id: 'corridor-line',
    type: 'line',
    source: 'corridor-source',
    layout: { 'line-join': 'round', 'line-cap': 'round', visibility: 'none' },
    paint: {
      'line-color': '#ffdd00',
      'line-width': 3,
      'line-dasharray': [4, 2],
      'line-opacity': 0.85
    }
  });
}

// ===== LAYER TOGGLE =====
function toggleLayer(layer, visible) {
  layerState[layer] = visible;
  const v = visible ? 'visible' : 'none';

  if (!map || !map.isStyleLoaded()) return;

  const layerMap = {
    ndvi: ['ndvi-fill'],
    deforestation: ['deforestation-fill', 'deforestation-stroke'],
    protected: ['protected-fill', 'protected-stroke'],
    fires: ['fire-circles', 'fire-halo'],
    species: ['corridor-line']
  };

  if (layerMap[layer]) {
    layerMap[layer].forEach(id => {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', v);
    });
  }
}

// ===== YEAR SLIDER =====
function onYearChange(year) {
  currentYear = parseInt(year);
  document.getElementById('year-display').textContent = year;
  updateNDVIForYear(year);
  updateScoreForYear(year);
}

function updateNDVIForYear(year) {
  if (!map || !map.getSource('ndvi-source')) return;
  const grid = generateNDVIGrid();
  map.getSource('ndvi-source').setData(grid);
}

function updateScoreForYear(year) {
  const idx = YEARLY_DATA.years.indexOf(parseInt(year));
  if (idx < 0) return;
  const ndvi = (YEARLY_DATA.ndvi[idx] * 100).toFixed(0);
  document.getElementById('score-value').textContent = ndvi + '%';
  const arc = Math.round(YEARLY_DATA.ndvi[idx] * 314);
  const offset = -47;
  document.getElementById('ring-arc').setAttribute('stroke-dasharray', `${arc} 314`);
}

// ===== ALERTS =====
function renderAlerts() {
  const list = document.getElementById('alerts-list');
  list.innerHTML = ALERTS.map(a => `
    <div class="alert-item ${a.type} animate-in" id="alert-${a.id}" onclick="flyTo(${a.lat},${a.lng})" style="animation-delay:${ALERTS.indexOf(a)*0.07}s">
      <div class="alert-icon">${a.icon}</div>
      <div class="alert-text">
        <div class="alert-title">${a.title}</div>
        <div class="alert-sub">${a.sub}</div>
      </div>
      <div class="alert-time">${a.time}</div>
    </div>
  `).join('');
}

function flyTo(lat, lng) {
  if (activeView !== 'map') switchView('map');
  map.flyTo({ center: [lng, lat], zoom: 9, duration: 1500 });
}

// ===== LIVE ALERTS (simulated stream) =====
const LIVE_ALERT_SEEDS = [
  { type: 'critical', icon: '🔥', title: 'New Fire Detected', sub: 'MP Border · Thermal scan confirms 340ha', lat: 23.1, lng: 78.4 },
  { type: 'warning', icon: '🌳', title: 'Deforestation Spike', sub: 'Assam NE · 28% above weekly avg', lat: 26.5, lng: 93.5 },
  { type: 'info', icon: '🛰️', title: 'Sentinel-2 Pass Completed', sub: 'Western Ghats imagery updated', lat: 11.0, lng: 76.5 },
  { type: 'warning', icon: '🦅', title: 'Rare Bird Sighting', sub: 'Great Hornbill outside reserve boundary', lat: 11.1, lng: 76.4 },
];

function startLiveAlerts() {
  let idx = 0;
  setInterval(() => {
    const seed = LIVE_ALERT_SEEDS[idx % LIVE_ALERT_SEEDS.length];
    const item = document.createElement('div');
    item.className = `alert-item ${seed.type}`;
    item.onclick = () => flyTo(seed.lat, seed.lng);
    item.innerHTML = `
      <div class="alert-icon">${seed.icon}</div>
      <div class="alert-text">
        <div class="alert-title">${seed.title}</div>
        <div class="alert-sub">${seed.sub}</div>
      </div>
      <div class="alert-time">just now</div>
    `;
    item.style.opacity = 0;
    item.style.transform = 'translateY(-8px)';
    item.style.transition = 'all 0.3s ease';
    const list = document.getElementById('alerts-list');
    list.prepend(item);
    setTimeout(() => { item.style.opacity = 1; item.style.transform = 'none'; }, 50);
    if (list.children.length > 10) list.removeChild(list.lastChild);

    // Update badge
    const count = Math.min(list.children.length, 99);
    document.getElementById('alert-count-badge').textContent = `${count} Active`;

    idx++;
  }, 8000);
}

// ===== THREAT ZONES (right panel) =====
function renderThreatZones() {
  const zones = [
    { name: 'Simlipal NP', pct: 67, color: '#ef4444' },
    { name: 'Sundarbans', pct: 62, color: '#ef4444' },
    { name: 'Gulf of Mannar', pct: 55, color: '#f59e0b' },
    { name: 'Karbi Anglong', pct: 53, color: '#f59e0b' },
    { name: 'Kaziranga', pct: 45, color: '#fbbf24' },
    { name: 'Pench TR', pct: 41, color: '#38bdf8' },
  ];
  document.getElementById('threat-list').innerHTML = zones.map(z => `
    <div class="threat-item" style="border-left-color:${z.color}" onclick="''">
      <div style="flex:1">
        <div class="threat-name">${z.name}</div>
        <div class="threat-bar-bg"><div class="threat-bar" style="width:${z.pct}%;background:${z.color}"></div></div>
      </div>
      <span class="threat-pct" style="color:${z.color}">${z.pct}%</span>
    </div>
  `).join('');
}

// ===== NDVI SCORE RING =====
function renderNDVIRing() {
  // Inject gradient def
  const svgEl = document.querySelector('#score-ring svg');
  const defs = document.createElementNS('http://www.w3.org/2000/svg','defs');
  defs.innerHTML = `
    <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#1a7a3e"/>
      <stop offset="100%" stop-color="#3dcc73"/>
    </linearGradient>
  `;
  svgEl.prepend(defs);
  document.getElementById('ring-fill').setAttribute('stroke', 'url(#ring-gradient)');
}

// ===== LIVE COUNTERS =====
function startLiveCounters() {
  const treesEl = document.getElementById('qs-trees');
  const firesEl = document.getElementById('qs-fires');
  let trees = 2400000;
  let fires = 124;

  setInterval(() => {
    trees += Math.floor(Math.random() * 200 + 50);
    fires = Math.max(90, fires + (Math.random() > 0.5 ? 1 : -1));
    treesEl.textContent = (trees / 1000000).toFixed(2) + 'M';
    firesEl.textContent = fires;
  }, 3000);
}

// ===== SEARCH =====
function filterSearch(val) {
  const dd = document.getElementById('search-dropdown');
  if (!val || val.length < 2) { dd.classList.remove('open'); return; }
  const matches = SEARCH_INDEX.filter(s => s.name.toLowerCase().includes(val.toLowerCase())).slice(0, 6);
  if (!matches.length) { dd.classList.remove('open'); return; }
  dd.innerHTML = matches.map(m => `
    <div class="search-item" onclick="flyTo(${m.lat},${m.lng}); document.getElementById('map-search-input').value='${m.name}'; document.getElementById('search-dropdown').classList.remove('open')">
      <span>${m.icon}</span>
      <div>
        <div style="font-size:12px;font-weight:500">${m.name}</div>
        <div style="font-size:10px;color:rgba(200,240,218,0.4)">${m.type}</div>
      </div>
    </div>
  `).join('');
  dd.classList.add('open');
}

// Close search on outside click
document.addEventListener('click', e => {
  if (!e.target.closest('.map-search-bar')) {
    document.getElementById('search-dropdown').classList.remove('open');
  }
});

// ===== VIEW SWITCHING =====
function switchView(view) {
  activeView = view;
  const allViews = [
    'timeline', 'zones', 'species', 'scanner',
    'osint', 'tracks', 'forecast', 'report',
    'reports', 'firesim', 'compare'
  ];
  const navBtns = {
    map: 'nav-map', timeline: 'nav-timeline', zones: 'nav-zones',
    species: 'nav-species', scanner: 'nav-scanner',
    osint: 'nav-osint', tracks: 'nav-tracks', forecast: 'nav-forecast', report: 'nav-report',
    reports: 'nav-reports', firesim: 'nav-firesim', compare: 'nav-compare'
  };

  // Update nav active state
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const activeBtn = document.getElementById(navBtns[view]);
  if (activeBtn) activeBtn.classList.add('active');

  // Show/hide views
  if (view === 'map') {
    allViews.forEach(v => {
      const el = document.getElementById(`${v}-view`);
      if (el) el.classList.add('hidden');
    });
  } else {
    allViews.forEach(v => {
      const el = document.getElementById(`${v}-view`);
      if (el) {
        if (v === view) el.classList.remove('hidden');
        else el.classList.add('hidden');
      }
    });
  }

  // Lazy-init charts/content on first open
  if (view === 'timeline' && !chartsInitialized) {
    chartsInitialized = true;
    setTimeout(renderTimelineCharts, 50);
  }
  if (view === 'forecast' && !forecastChartsInit) {
    forecastChartsInit = true;
    setTimeout(() => { renderForecastCharts(); renderRelocationEngine(); renderTippingPoints(generateForecast()); }, 50);
  }
  if (view === 'tracks') {
    setTimeout(updateGBIFStats, 100);
  }
  // Phase 3 lazy init
  if (view === 'firesim' && !fireSimInit) {
    setTimeout(initFireSim, 60);
  }
  if (view === 'compare' && !compareInitialized) {
    setTimeout(initComparator, 60);
  }
}

// ===== WINDY LAYER SWITCHER =====
function switchWindyLayer(overlay) {
  const frame = document.getElementById('windy-frame');
  if (!frame) return;
  const base = `https://embed.windy.com/embed2.html?lat=21.0&lon=82.0&detailLat=21.0&detailLon=82.0&width=100%25&height=100%25&zoom=5&level=surface&product=ecmwf&menu=&message=true&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=default&metricTemp=default&radarRange=-1`;
  frame.src = base + `&overlay=${overlay}`;
}

// ===== POPULATE REPORT ALERTS =====
function populateReportAlerts() {
  const el = document.getElementById('report-alert-list');
  if (!el) return;
  el.innerHTML = ALERTS.filter(a => a.type === 'critical').map(a => `
    <div class="alert-item ${a.type}" style="pointer-events:none">
      <div class="alert-icon">${a.icon}</div>
      <div class="alert-text">
        <div class="alert-title">${a.title}</div>
        <div class="alert-sub">${a.sub}</div>
      </div>
      <div class="alert-time">${a.time}</div>
    </div>
  `).join('');
}

// ===== GBIF STATS UPDATER =====
function updateGBIFStats() {
  const el = document.getElementById('tracks-stats');
  if (!el || !gbifOccurrences || !gbifOccurrences.length) return;
  const bySpecies = {};
  gbifOccurrences.forEach(o => { bySpecies[o.species] = (bySpecies[o.species] || 0) + 1; });
  el.innerHTML = Object.entries(bySpecies).map(([sp, cnt]) => `
    <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(61,204,115,0.06)">
      <span>${sp}</span>
      <strong style="color:#3dcc73">${cnt}</strong>
    </div>
  `).join('') + `<div style="margin-top:8px;color:rgba(200,240,218,0.4);font-size:10px">Total: ${gbifOccurrences.length} sightings · Source: GBIF.org</div>`;
}

// ===== TIMELINE CHARTS =====
function renderTimelineCharts() {
  const chartDefaults = {
    responsive: true,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0f2018', titleColor: '#3dcc73', bodyColor: '#c8f0da', borderColor: '#1a7a3e', borderWidth: 1 } },
    scales: {
      x: { grid: { color: 'rgba(61,204,115,0.07)' }, ticks: { color: 'rgba(200,240,218,0.45)', font: { size: 10 }, maxTicksLimit: 8 } },
      y: { grid: { color: 'rgba(61,204,115,0.07)' }, ticks: { color: 'rgba(200,240,218,0.45)', font: { size: 10 } } }
    }
  };

  // Forest Cover
  new Chart(document.getElementById('tl-cover-chart'), {
    type: 'line',
    data: {
      labels: YEARLY_DATA.years,
      datasets: [{
        data: YEARLY_DATA.forestCover,
        borderColor: '#3dcc73',
        backgroundColor: 'rgba(61,204,115,0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5
      }]
    },
    options: { ...chartDefaults, scales: { ...chartDefaults.scales, y: { ...chartDefaults.scales.y, ticks: { ...chartDefaults.scales.y.ticks, callback: v => (v/1000).toFixed(0)+'k' } } } }
  });

  // State Loss
  new Chart(document.getElementById('tl-state-chart'), {
    type: 'bar',
    data: {
      labels: STATE_LOSS.states,
      datasets: [{
        data: STATE_LOSS.loss2024,
        backgroundColor: ['rgba(239,68,68,0.7)','rgba(245,158,11,0.7)','rgba(245,158,11,0.5)','rgba(56,189,248,0.6)','rgba(56,189,248,0.4)','rgba(61,204,115,0.6)','rgba(61,204,115,0.4)','rgba(61,204,115,0.3)'],
        borderColor: 'transparent',
        borderRadius: 4
      }]
    },
    options: { ...chartDefaults, scales: { ...chartDefaults.scales, y: { ...chartDefaults.scales.y, ticks: { ...chartDefaults.scales.y.ticks, callback: v => v+'km²' } } } }
  });

  // NDVI Full
  new Chart(document.getElementById('tl-ndvi-full-chart'), {
    type: 'line',
    data: {
      labels: YEARLY_DATA.years,
      datasets: [{
        data: YEARLY_DATA.ndvi,
        borderColor: '#5de896',
        backgroundColor: 'rgba(93,232,150,0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 2
      }]
    },
    options: chartDefaults
  });

  // Carbon Stock
  new Chart(document.getElementById('tl-carbon-chart'), {
    type: 'line',
    data: {
      labels: YEARLY_DATA.years,
      datasets: [{
        data: YEARLY_DATA.carbonStock,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245,158,11,0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 2
      }]
    },
    options: { ...chartDefaults, scales: { ...chartDefaults.scales, y: { ...chartDefaults.scales.y, ticks: { ...chartDefaults.scales.y.ticks, callback: v => v+'Tg' } } } }
  });

  // Note: renderMiniCharts() is called separately on DOMContentLoaded
}

function renderMiniCharts() {
  const miniOpts = {
    responsive: true,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: {
      x: { display: false },
      y: { display: false }
    },
    animation: { duration: 1000 }
  };

  new Chart(document.getElementById('defo-chart'), {
    type: 'bar',
    data: {
      labels: YEARLY_DATA.years.slice(-10),
      datasets: [{
        data: YEARLY_DATA.defoRate.slice(-10),
        backgroundColor: YEARLY_DATA.defoRate.slice(-10).map(v => v > 7000 ? 'rgba(239,68,68,0.8)' : 'rgba(245,158,11,0.7)'),
        borderRadius: 3
      }]
    },
    options: { ...miniOpts, plugins: { ...miniOpts.plugins, tooltip: { enabled: true, backgroundColor: '#0f2018', titleColor: '#3dcc73', bodyColor: '#c8f0da', borderColor: '#1a7a3e', borderWidth: 1 } }, scales: { x: { display: true, grid: { display: false }, ticks: { color: 'rgba(200,240,218,0.35)', font: { size: 9 }, maxTicksLimit: 5 } }, y: { display: true, grid: { color: 'rgba(61,204,115,0.05)' }, ticks: { color: 'rgba(200,240,218,0.35)', font: { size: 9 }, callback: v => (v/1000).toFixed(0)+'k' } } } }
  });

  new Chart(document.getElementById('ndvi-chart'), {
    type: 'line',
    data: {
      labels: YEARLY_DATA.years,
      datasets: [{
        data: YEARLY_DATA.ndvi,
        borderColor: '#3dcc73',
        backgroundColor: 'rgba(61,204,115,0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 0
      }]
    },
    options: { ...miniOpts, plugins: { ...miniOpts.plugins, tooltip: { enabled: true, backgroundColor: '#0f2018', titleColor: '#3dcc73', bodyColor: '#c8f0da', borderColor: '#1a7a3e', borderWidth: 1 } }, scales: { x: { display: true, grid: { display: false }, ticks: { color: 'rgba(200,240,218,0.35)', font: { size: 9 }, maxTicksLimit: 5 } }, y: { display: true, grid: { color: 'rgba(61,204,115,0.05)' }, ticks: { color: 'rgba(200,240,218,0.35)', font: { size: 9 } } } } }
  });
}

// ===== ZONES GRID =====
function renderZonesGrid(zones) {
  const grid = document.getElementById('zones-grid');
  grid.innerHTML = zones.map(z => `
    <div class="zone-card ${z.type} animate-in" id="zone-card-${z.id}" onclick="openZonePopup('${z.id}')">
      <div class="zone-type-badge">${z.icon} ${z.typeName}</div>
      <div class="zone-name">${z.name}</div>
      <div class="zone-state">📍 ${z.state}</div>
      <div class="zone-stats">
        <div class="zone-stat"><strong>${z.area.toLocaleString()}</strong> km²</div>
        <div class="zone-stat"><strong style="color:#3dcc73">NDVI ${z.ndvi}</strong></div>
        <div class="zone-stat"><strong>Est. ${z.established}</strong></div>
      </div>
      <div class="zone-threat">
        <div class="zone-threat-bar-bg">
          <div class="zone-threat-bar" style="width:${z.threat}%;background:${threatColor(z.threat)}"></div>
        </div>
        <div class="zone-threat-label">Threat level: <strong style="color:${threatColor(z.threat)}">${z.threat}%</strong></div>
      </div>
    </div>
  `).join('');
}

function filterZones(query) {
  const typeFilter = document.getElementById('zones-filter').value;
  const q = (query || '').toLowerCase();
  const filtered = PROTECTED_ZONES.filter(z => {
    const matchType = typeFilter === 'all' || z.type === typeFilter;
    const matchQuery = !q || z.name.toLowerCase().includes(q) || z.state.toLowerCase().includes(q);
    return matchType && matchQuery;
  });
  renderZonesGrid(filtered);
}

function openZonePopup(id) {
  const z = PROTECTED_ZONES.find(z => z.id === id);
  if (!z) return;
  document.getElementById('popup-content').innerHTML = `
    <div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
        <span style="font-size:40px">${z.icon}</span>
        <div>
          <div style="font-family:'Space Grotesk',sans-serif;font-size:20px;font-weight:700;color:#fff">${z.name}</div>
          <div style="font-size:12px;color:rgba(200,240,218,0.5)">${z.typeName} · ${z.state} · Est. ${z.established}</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
        <div style="background:rgba(61,204,115,0.08);border-radius:8px;padding:12px;text-align:center">
          <div style="font-size:22px;font-weight:700;color:#3dcc73;font-family:'Space Grotesk',sans-serif">${z.area.toLocaleString()}</div>
          <div style="font-size:10px;color:rgba(200,240,218,0.45)">km² Area</div>
        </div>
        <div style="background:rgba(61,204,115,0.08);border-radius:8px;padding:12px;text-align:center">
          <div style="font-size:22px;font-weight:700;color:#5de896;font-family:'Space Grotesk',sans-serif">${z.ndvi}</div>
          <div style="font-size:10px;color:rgba(200,240,218,0.45)">NDVI Score</div>
        </div>
        <div style="background:rgba(239,68,68,0.08);border-radius:8px;padding:12px;text-align:center">
          <div style="font-size:22px;font-weight:700;color:${threatColor(z.threat)};font-family:'Space Grotesk',sans-serif">${z.threat}%</div>
          <div style="font-size:10px;color:rgba(200,240,218,0.45)">Threat Level</div>
        </div>
        <div style="background:rgba(56,189,248,0.08);border-radius:8px;padding:12px;text-align:center">
          <div style="font-size:22px;font-weight:700;color:#38bdf8;font-family:'Space Grotesk',sans-serif">${z.species.length}</div>
          <div style="font-size:10px;color:rgba(200,240,218,0.45)">Key Species</div>
        </div>
      </div>
      <div style="margin-bottom:12px">
        <div style="font-size:11px;font-weight:600;color:rgba(200,240,218,0.5);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Key Species</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px">
          ${z.species.map(s => `<span style="background:rgba(61,204,115,0.12);border:1px solid rgba(61,204,115,0.2);color:#3dcc73;font-size:11px;padding:3px 10px;border-radius:99px">🦁 ${s}</span>`).join('')}
        </div>
      </div>
      <button onclick="flyToZone(${z.lat},${z.lng});closePopup()" style="width:100%;background:linear-gradient(135deg,#0d5a2c,#1a7a3e);border:1px solid #27a057;color:#fff;font-size:13px;font-weight:600;padding:11px;border-radius:10px;cursor:pointer;font-family:'Inter',sans-serif">
        🗺️ View on Map
      </button>
    </div>
  `;
  document.getElementById('zone-popup').classList.add('open');
  document.getElementById('popup-overlay').classList.add('open');
}

function flyToZone(lat, lng) {
  switchView('map');
  setTimeout(() => { map.flyTo({ center: [lng, lat], zoom: 9, duration: 1500 }); }, 100);
}

function closePopup() {
  document.getElementById('zone-popup').classList.remove('open');
  document.getElementById('popup-overlay').classList.remove('open');
}

// ===== SPECIES GRID =====
function renderSpeciesGrid() {
  document.getElementById('species-grid').innerHTML = SPECIES_DATA.map(s => `
    <div class="species-card animate-in" id="species-card-${s.id}">
      <div class="species-header">
        <div class="species-emoji">${s.emoji}</div>
        <div class="species-info">
          <div class="species-name">${s.name}</div>
          <div class="species-sci">${s.sci}</div>
        </div>
        <span class="species-status-badge status-${s.status.toLowerCase()}">${s.statusLabel}</span>
      </div>
      <div class="species-risk-bar">
        <div class="risk-label">
          <span>Habitat at Risk</span>
          <span class="risk-pct" style="color:${s.habitatLoss>70?'#ef4444':s.habitatLoss>50?'#f59e0b':'#38bdf8'}">${s.habitatLoss}%</span>
        </div>
        <div class="risk-bar-bg">
          <div class="risk-bar" style="width:${s.habitatLoss}%;background:${s.habitatLoss>70?'#ef4444':s.habitatLoss>50?'#f59e0b':'#38bdf8'}"></div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px">
        <div style="background:rgba(61,204,115,0.08);border-radius:6px;padding:6px;text-align:center">
          <div style="font-size:14px;font-weight:700;color:#3dcc73;font-family:'Space Grotesk',sans-serif">${s.population.toLocaleString()}</div>
          <div style="font-size:9px;color:rgba(200,240,218,0.4)">Est. Population</div>
        </div>
        <div style="background:rgba(61,204,115,0.08);border-radius:6px;padding:6px;text-align:center">
          <div style="font-size:14px;font-weight:700;color:${s.trend.startsWith('+')?'#3dcc73':'#ef4444'};font-family:'Space Grotesk',sans-serif">${s.trend}</div>
          <div style="font-size:9px;color:rgba(200,240,218,0.4)">5yr Trend</div>
        </div>
      </div>
      <div class="species-detail">
        🏠 ${s.primaryHabitat}<br/>
        ⚠️ ${s.threats.join(' · ')}<br/>
        🛡️ ${s.refuges.join(', ')}
      </div>
    </div>
  `).join('');
}

// ===== ZONE SCANNER =====
function runScan() {
  const lat = parseFloat(document.getElementById('scan-lat').value);
  const lng = parseFloat(document.getElementById('scan-lng').value);
  const state = document.getElementById('scan-state').value;

  const btn = document.getElementById('scan-button');
  btn.classList.add('loading');
  btn.innerHTML = '<span class="btn-icon">⏳</span> Analyzing...';

  setTimeout(() => {
    btn.classList.remove('loading');
    btn.innerHTML = '<span class="btn-icon">⚡</span> Analyze Zone';
    renderScanResult(lat, lng, state);
  }, 2200);
}

function renderScanResult(lat, lng, state) {
  // Deterministic score based on coords
  const seed = Math.abs(Math.sin(lat * 12.9898 + lng * 78.233));
  const score = Math.round(seed * 55 + 35); // 35-90
  const ndvi = (Math.sin(lat * 7.1 + lng * 3.3) * 0.3 + 0.45).toFixed(2);
  const rainfall = Math.round(seed * 1200 + 400);
  const soilQuality = ['Poor', 'Fair', 'Good', 'Excellent'][Math.floor(seed * 4)];
  const carbonPotential = Math.round(seed * 120 + 40);
  const connectivity = (seed * 0.7 + 0.2).toFixed(2);
  const species_benefit = Math.round(seed * 15 + 5);

  const quality = score >= 75 ? 'excellent' : score >= 55 ? 'good' : 'moderate';
  const qualityLabel = quality === 'excellent' ? 'High Reforestation Potential' : quality === 'good' ? 'Moderate Potential' : 'Needs Intervention First';

  // Parameters panel
  document.getElementById('param-grid').innerHTML = `
    <div class="param-item"><div class="param-val">${ndvi}</div><div class="param-lbl">NDVI</div></div>
    <div class="param-item"><div class="param-val">${rainfall}mm</div><div class="param-lbl">Annual Rain</div></div>
    <div class="param-item"><div class="param-val">${soilQuality}</div><div class="param-lbl">Soil Quality</div></div>
    <div class="param-item"><div class="param-val">${connectivity}</div><div class="param-lbl">Connectivity</div></div>
  `;

  const result = document.getElementById('scanner-result');
  result.innerHTML = `
    <div class="scan-result-content">
      <div class="scan-score-banner ${quality}">
        <div class="scan-score-num">${score}</div>
        <div class="scan-score-right">
          <h3>${qualityLabel}</h3>
          <p>AI analysis based on NDVI, rainfall, soil & corridor data</p>
          ${state ? `<p style="margin-top:4px">📍 ${state}</p>` : ''}
        </div>
      </div>
      <div class="scan-metrics">
        <div class="scan-metric">
          <div class="scan-metric-val">${carbonPotential}t</div>
          <div class="scan-metric-lbl">CO₂/ha Sequestration</div>
        </div>
        <div class="scan-metric">
          <div class="scan-metric-val">${species_benefit}</div>
          <div class="scan-metric-lbl">Species Benefitted</div>
        </div>
        <div class="scan-metric">
          <div class="scan-metric-val">3–7yr</div>
          <div class="scan-metric-lbl">Recovery Timeline</div>
        </div>
      </div>
      <div class="scan-recommendations">
        <h4>Recommendations</h4>
        ${getRecommendations(score, soilQuality, rainfall, connectivity)}
      </div>
    </div>
  `;
}

function getRecommendations(score, soil, rainfall, connectivity) {
  const recs = [];
  if (score >= 75) {
    recs.push({ icon: '🌱', text: 'Zone is suitable for native species planting. Prioritize endemic tree species for maximum biodiversity impact.' });
    recs.push({ icon: '🦁', text: 'High connectivity score indicates this zone can serve as a wildlife corridor. Coordinate with Forest Department.' });
    recs.push({ icon: '💧', text: `Rainfall of ${rainfall}mm is adequate. Consider rainwater harvesting structures to retain moisture.` });
  } else if (score >= 55) {
    recs.push({ icon: '🌿', text: 'Moderate potential. Start with pioneer species (Acacia, Bamboo) to prepare soil for native trees.' });
    recs.push({ icon: '🛡️', text: 'Establish a buffer zone around existing forest patches. Reduce edge effects first.' });
    recs.push({ icon: '📊', text: 'Monitor NDVI quarterly. Expect measurable improvement within 2 years of intervention.' });
  } else {
    recs.push({ icon: '⚠️', text: 'Zone shows significant degradation. Soil restoration should precede planting — apply organic matter & compost.' });
    recs.push({ icon: '💧', text: 'Rainfall is below optimal. Drip irrigation pilot recommended for the first 2 years.' });
    recs.push({ icon: '🔬', text: 'Conduct ground survey to assess invasive species presence before planting indigenous flora.' });
  }
  return recs.map(r => `
    <div class="rec-item">
      <span class="rec-icon">${r.icon}</span>
      <div class="rec-text">${r.text}</div>
    </div>
  `).join('');
}

// ===== UTILITY =====
function createCircleCoords(lng, lat, radius, steps) {
  const coords = [];
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    coords.push([
      lng + radius * Math.cos(angle) * 1.3, // stretch for lng
      lat + radius * Math.sin(angle)
    ]);
  }
  return coords;
}
