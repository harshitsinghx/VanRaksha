// ===================================================
// VANARAKHSA AI — PHASE 3 MODULE
// 1. Community Incident Reporting
// 2. Fire Spread Simulator
// 3. Satellite Before/After Comparator
// ===================================================

// ===== SHARED: NDVI COLOR (mirrors app.js, safe duplicate) =====
function p3NdviColor(v) {
  v = parseFloat(v) || 0;
  if (v < 0.15) return '#7a3605';
  if (v < 0.25) return '#b8860b';
  if (v < 0.35) return '#c8a500';
  if (v < 0.45) return '#6db33f';
  if (v < 0.55) return '#45c06a';
  if (v < 0.65) return '#27a057';
  if (v < 0.75) return '#1a7a3e';
  if (v < 0.85) return '#0d5a2c';
  return '#052412';
}

// =====================================================
// SECTION 1 — COMMUNITY INCIDENT REPORTS
// =====================================================

const REPORT_TYPES = [
  { id: 'fire',     label: 'Forest Fire',      icon: '🔥', color: '#ef4444' },
  { id: 'logging',  label: 'Illegal Logging',  icon: '🪓', color: '#f59e0b' },
  { id: 'poaching', label: 'Poaching',         icon: '🐾', color: '#a855f7' },
  { id: 'encroach', label: 'Encroachment',     icon: '🏗️', color: '#f97316' },
  { id: 'flood',    label: 'Flood / Erosion',  icon: '🌊', color: '#38bdf8' },
  { id: 'disease',  label: 'Tree Disease',     icon: '🍂', color: '#84cc16' },
];

let userReports = JSON.parse(localStorage.getItem('vr_reports') || '[]');
let reportMapMarkers = [];
let selectedReportType = 'fire';

function initReports() {
  renderReportTypeButtons();
  renderReportFeed();
  // Add existing stored reports to the map once ready
  const tryAddMarkers = () => {
    if (typeof map !== 'undefined' && map && map.isStyleLoaded()) {
      userReports.forEach(r => addReportMarkerToMap(r));
    } else {
      setTimeout(tryAddMarkers, 800);
    }
  };
  tryAddMarkers();
}

function renderReportTypeButtons() {
  const container = document.getElementById('report-type-grid');
  if (!container) return;
  container.innerHTML = REPORT_TYPES.map(rt => `
    <button class="report-type-btn" id="rtype-${rt.id}" onclick="selectReportType('${rt.id}')">
      <span class="rtb-icon">${rt.icon}</span>
      <span class="rtb-label">${rt.label}</span>
    </button>
  `).join('');
  selectReportType('fire');
}

function selectReportType(id) {
  selectedReportType = id;
  document.querySelectorAll('.report-type-btn').forEach(b => {
    b.classList.remove('selected');
    b.style.background = '';
    b.style.borderColor = '';
  });
  const rt = REPORT_TYPES.find(t => t.id === id);
  const btn = document.getElementById('rtype-' + id);
  if (btn && rt) {
    btn.classList.add('selected');
    btn.style.background = rt.color + '25';
    btn.style.borderColor = rt.color;
  }
}

function autoDetectGPS() {
  const btn = document.getElementById('gps-btn');
  if (!navigator.geolocation) {
    if (btn) btn.textContent = '📡 GPS Unavailable';
    return;
  }
  if (btn) { btn.disabled = true; btn.textContent = '📡 Locating...'; }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      document.getElementById('report-lat').value = pos.coords.latitude.toFixed(4);
      document.getElementById('report-lng').value = pos.coords.longitude.toFixed(4);
      if (btn) { btn.disabled = false; btn.textContent = '✅ GPS Detected'; setTimeout(() => { btn.textContent = '📡 Auto-Detect GPS'; }, 3000); }
    },
    () => {
      if (btn) { btn.disabled = false; btn.textContent = '❌ GPS Failed'; setTimeout(() => { btn.textContent = '📡 Auto-Detect GPS'; }, 2500); }
    }
  );
}

function pickFromMap() {
  switchView('map');
  let hint = document.getElementById('map-pick-hint');
  if (!hint) {
    hint = document.createElement('div');
    hint.id = 'map-pick-hint';
    hint.textContent = '📍 Click anywhere on the map to set incident location';
    hint.style.cssText = 'position:fixed;top:76px;left:50%;transform:translateX(-50%);background:rgba(249,115,22,0.95);color:#fff;font-size:13px;font-weight:700;padding:10px 22px;border-radius:99px;z-index:9999;pointer-events:none;box-shadow:0 4px 20px rgba(249,115,22,0.5);letter-spacing:0.2px;';
    document.body.appendChild(hint);
  }
  hint.style.display = 'block';
  map.getCanvas().style.cursor = 'crosshair';
  map.once('click', (e) => {
    document.getElementById('report-lat').value = e.lngLat.lat.toFixed(4);
    document.getElementById('report-lng').value = e.lngLat.lng.toFixed(4);
    hint.style.display = 'none';
    map.getCanvas().style.cursor = '';
    switchView('reports');
  });
}

function submitReport() {
  const lat = parseFloat(document.getElementById('report-lat').value);
  const lng = parseFloat(document.getElementById('report-lng').value);
  const urgency = document.getElementById('report-urgency').value;
  const desc = document.getElementById('report-desc').value.trim();
  const reporter = document.getElementById('report-name').value.trim() || 'Anonymous Ranger';
  const statusEl = document.getElementById('report-status');

  const setStatus = (msg, isErr) => {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.className = 'report-status-msg ' + (isErr ? 'error' : 'success');
  };

  if (isNaN(lat) || isNaN(lng)) { setStatus('⚠️ Enter valid coordinates or use GPS detect.', true); return; }
  if (!desc) { setStatus('⚠️ Please describe what you observed.', true); return; }

  const report = { id: Date.now(), type: selectedReportType, lat, lng, urgency, desc, reporter, time: new Date().toISOString() };

  userReports.unshift(report);
  localStorage.setItem('vr_reports', JSON.stringify(userReports.slice(0, 50)));
  renderReportFeed();
  addReportMarkerToMap(report);

  setStatus('✅ Report submitted! Visible on the map.', false);
  setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 5000);
  ['report-lat', 'report-lng', 'report-desc', 'report-name'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  selectReportType(selectedReportType); // keep type selection
}

function renderReportFeed() {
  const feed = document.getElementById('report-feed');
  if (!feed) return;

  const totalEl = document.getElementById('report-total-count');
  const critEl  = document.getElementById('report-critical-count');
  if (totalEl) totalEl.textContent = userReports.length;
  if (critEl)  critEl.textContent  = userReports.filter(r => r.urgency === 'critical').length;

  if (!userReports.length) {
    feed.innerHTML = '<div class="report-empty"><span>📋</span><p>No field reports yet.</p><small>Submit the first incident from the field.</small></div>';
    return;
  }
  const urgColor = { critical: '#ef4444', high: '#f59e0b', medium: '#38bdf8', low: '#3dcc73' };
  feed.innerHTML = userReports.map((r, i) => {
    const rt = REPORT_TYPES.find(t => t.id === r.type) || REPORT_TYPES[0];
    const uc = urgColor[r.urgency] || '#38bdf8';
    return `
      <div class="report-card animate-in" style="animation-delay:${Math.min(i,6)*0.05}s;border-left-color:${rt.color}"
           onclick="flyToReport(${r.lat},${r.lng})">
        <div class="rc-header">
          <span class="rc-icon">${rt.icon}</span>
          <div class="rc-info">
            <div class="rc-type" style="color:${rt.color}">${rt.label}</div>
            <div class="rc-meta">${r.reporter} · ${p3TimeAgo(r.time)}</div>
          </div>
          <span class="rc-urgency" style="background:${uc}20;color:${uc};border-color:${uc}55">${r.urgency.toUpperCase()}</span>
        </div>
        <div class="rc-desc">${r.desc}</div>
        <div class="rc-loc">📍 ${r.lat.toFixed(3)}°N · ${r.lng.toFixed(3)}°E</div>
      </div>`;
  }).join('');
}

function p3TimeAgo(iso) {
  const m = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  return Math.floor(h / 24) + 'd ago';
}

function flyToReport(lat, lng) {
  switchView('map');
  setTimeout(() => map.flyTo({ center: [lng, lat], zoom: 10, duration: 1200 }), 150);
}

function addReportMarkerToMap(report) {
  if (typeof map === 'undefined' || !map || !map.isStyleLoaded()) return;
  const rt = REPORT_TYPES.find(t => t.id === report.type) || REPORT_TYPES[0];
  const el = document.createElement('div');
  el.className = 'report-map-marker';
  el.innerHTML = `
    <div class="rmm-pulse" style="background:${rt.color}44;border:2px solid ${rt.color}88"></div>
    <div class="rmm-icon" style="background:${rt.color}ee;box-shadow:0 2px 12px ${rt.color}88">${rt.icon}</div>
  `;
  el.onclick = () => {
    new maplibregl.Popup({ maxWidth: '260px' })
      .setLngLat([report.lng, report.lat])
      .setHTML(`
        <div style="font-family:Inter,sans-serif">
          <div style="font-weight:700;font-size:14px;color:${rt.color};margin-bottom:4px">${rt.icon} ${rt.label}</div>
          <div style="font-size:10px;color:rgba(200,240,218,0.5);margin-bottom:6px">${report.reporter} · ${p3TimeAgo(report.time)}</div>
          <div style="font-size:12px;color:#c8f0da;margin-bottom:8px">${report.desc}</div>
          <div style="font-size:10px;color:rgba(200,240,218,0.4)">📍 ${report.lat.toFixed(3)}°N, ${report.lng.toFixed(3)}°E</div>
        </div>`)
      .addTo(map);
  };
  const marker = new maplibregl.Marker({ element: el }).setLngLat([report.lng, report.lat]).addTo(map);
  reportMapMarkers.push(marker);
}

function clearAllReports() {
  if (!confirm('Clear all field reports? This cannot be undone.')) return;
  userReports = [];
  localStorage.removeItem('vr_reports');
  reportMapMarkers.forEach(m => m.remove());
  reportMapMarkers = [];
  renderReportFeed();
}

// =====================================================
// SECTION 2 — FIRE SPREAD SIMULATOR
// =====================================================

const FS_CELL = 13;   // px per grid cell
const FS_COLS = 54;
const FS_ROWS = 44;

let fsCells    = [];
let fsOrigin   = null;
let fsRunning  = false;
let fsInterval = null;
let fsCtx      = null;
let fsSteps    = 0;
let fireSimInit = false;

function initFireSim() {
  if (fireSimInit) return;
  fireSimInit = true;
  const canvas = document.getElementById('fire-canvas');
  if (!canvas) return;
  canvas.width  = FS_COLS * FS_CELL;
  canvas.height = FS_ROWS * FS_CELL;
  fsCtx = canvas.getContext('2d');
  buildFSGrid();
  drawFSCanvas();
  canvas.addEventListener('click', onFSCanvasClick);
}

function buildFSGrid() {
  fsCells = [];
  for (let row = 0; row < FS_ROWS; row++) {
    for (let col = 0; col < FS_COLS; col++) {
      const lat = 37 - (row / (FS_ROWS - 1)) * 29;
      const lng = 68 + (col / (FS_COLS - 1)) * 29;
      const inside = isInIndia(lat, lng);
      const ndvi   = inside ? getNDVIForCell(lat, lng, 2024) : 0;
      fsCells.push({ row, col, lat, lng, inside, ndvi, fuel: inside ? Math.max(0.1, ndvi) : 0, state: 'unburned', burnProgress: 0, selected: false });
    }
  }
}

function drawFSCanvas() {
  if (!fsCtx) return;
  fsCtx.fillStyle = '#050d0a';
  fsCtx.fillRect(0, 0, FS_COLS * FS_CELL, FS_ROWS * FS_CELL);

  fsCells.forEach(cell => {
    if (!cell.inside) return;
    const x = cell.col * FS_CELL;
    const y = cell.row * FS_CELL;
    let color;
    if      (cell.state === 'burned')   color = '#1c0800';
    else if (cell.state === 'burning')  color = cell.burnProgress > 0.5 ? '#dc2626' : '#f97316';
    else if (cell.selected)             color = '#fde68a';
    else                                color = p3NdviColor(cell.ndvi);
    fsCtx.fillStyle = color;
    fsCtx.fillRect(x, y, FS_CELL - 1, FS_CELL - 1);
  });

  // Glow on burning cells
  fsCells.filter(c => c.state === 'burning').forEach(cell => {
    const cx = cell.col * FS_CELL + FS_CELL / 2;
    const cy = cell.row * FS_CELL + FS_CELL / 2;
    const g = fsCtx.createRadialGradient(cx, cy, 0, cx, cy, FS_CELL * 2.5);
    g.addColorStop(0, 'rgba(251,146,60,0.38)');
    g.addColorStop(1, 'rgba(220,38,38,0)');
    fsCtx.fillStyle = g;
    fsCtx.fillRect(cx - FS_CELL * 2.5, cy - FS_CELL * 2.5, FS_CELL * 5, FS_CELL * 5);
  });

  // Origin ring
  if (fsOrigin && fsOrigin.state === 'unburned' && fsOrigin.selected) {
    const cx = fsOrigin.col * FS_CELL + FS_CELL / 2;
    const cy = fsOrigin.row * FS_CELL + FS_CELL / 2;
    fsCtx.beginPath();
    fsCtx.arc(cx, cy, FS_CELL * 1.3, 0, Math.PI * 2);
    fsCtx.fillStyle = 'rgba(239,68,68,0.28)';
    fsCtx.fill();
    fsCtx.strokeStyle = '#ef4444';
    fsCtx.lineWidth = 2;
    fsCtx.stroke();
  }
}

function onFSCanvasClick(e) {
  if (fsRunning) return;
  const canvas = document.getElementById('fire-canvas');
  const rect   = canvas.getBoundingClientRect();
  const col = Math.floor((e.clientX - rect.left) * (canvas.width  / rect.width)  / FS_CELL);
  const row = Math.floor((e.clientY - rect.top)  * (canvas.height / rect.height) / FS_CELL);
  const cell = fsCells.find(c => c.col === col && c.row === row && c.inside);
  if (!cell) return;

  if (fsOrigin) fsOrigin.selected = false;
  fsOrigin = cell;
  cell.selected = true;

  const lbl = document.getElementById('fs-origin-label');
  if (lbl) lbl.textContent = `🎯 Origin set: ${cell.lat.toFixed(2)}°N, ${cell.lng.toFixed(2)}°E · NDVI ${cell.ndvi.toFixed(2)}`;

  const btn = document.getElementById('fs-run-btn');
  if (btn) btn.disabled = false;

  drawFSCanvas();
}

function runFireSim() {
  if (!fsOrigin) return;
  if (fsRunning) { stopFireSim(); return; }

  buildFSGrid();
  fsSteps = 0;

  fsOrigin = fsCells.find(c => c.col === fsOrigin.col && c.row === fsOrigin.row);
  if (!fsOrigin || !fsOrigin.inside) return;
  fsOrigin.state = 'burning';
  fsOrigin.burnProgress = 0.2;
  fsOrigin.selected = true;

  fsRunning = true;
  const btn = document.getElementById('fs-run-btn');
  if (btn) btn.textContent = '⏹ Stop';

  const windDir   = document.getElementById('fs-wind-dir').value;
  const windSpeed = parseFloat(document.getElementById('fs-wind-speed').value) / 100;
  const moisture  = parseFloat(document.getElementById('fs-moisture').value) / 100;
  const frameMs   = Math.max(55, 380 - windSpeed * 310);

  fsInterval = setInterval(() => {
    fsSteps++;
    fsBurnStep(windDir, windSpeed, moisture);
    drawFSCanvas();
    updateFSStats();
    if (fsCells.filter(c => c.state === 'burning').length === 0) stopFireSim();
  }, frameMs);
}

function fsBurnStep(windDir, windSpeedFactor, moistureFactor) {
  const WV = { N:{x:0,y:-1}, NE:{x:.707,y:-.707}, E:{x:1,y:0}, SE:{x:.707,y:.707}, S:{x:0,y:1}, SW:{x:-.707,y:.707}, W:{x:-1,y:0}, NW:{x:-.707,y:-.707} };
  const wv = WV[windDir] || { x: 0, y: 0 };
  const toIgnite = [];

  fsCells.forEach(cell => {
    if (cell.state !== 'burning') return;
    cell.burnProgress += 0.14 + windSpeedFactor * 0.08;
    if (cell.burnProgress >= 1) { cell.state = 'burned'; return; }

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const nb = fsCells.find(c => c.row === cell.row + dr && c.col === cell.col + dc);
        if (!nb || !nb.inside || nb.state !== 'unburned') continue;
        const windAlign   = dc * wv.x + dr * wv.y;
        const windFactor  = 1 + windAlign * windSpeedFactor * 2.2;
        const dryFactor   = 1 - moistureFactor * 0.78;
        const diag        = (dr !== 0 && dc !== 0) ? 0.72 : 1;
        const prob        = 0.3 * Math.max(0.05, windFactor) * dryFactor * nb.fuel * diag;
        if (Math.random() < prob) toIgnite.push(nb);
      }
    }
  });

  toIgnite.forEach(c => { c.state = 'burning'; c.burnProgress = 0; });
}

function updateFSStats() {
  const burned  = fsCells.filter(c => c.state === 'burned').length;
  const burning = fsCells.filter(c => c.state === 'burning').length;
  const areaHa  = Math.round((burned + burning * 0.4) * 82);
  const mins    = fsSteps * 12;
  const el = id => document.getElementById(id);
  if (el('fs-stat-area'))      el('fs-stat-area').textContent      = areaHa.toLocaleString() + ' ha';
  if (el('fs-stat-time'))      el('fs-stat-time').textContent      = mins < 60 ? mins + ' min' : (mins/60).toFixed(1) + ' hrs';
  if (el('fs-stat-cells'))     el('fs-stat-cells').textContent     = burning;
  if (el('fs-stat-intensity')) el('fs-stat-intensity').textContent = burning > 30 ? '🔴 Extreme' : burning > 10 ? '🟡 High' : burning > 2 ? '🟠 Moderate' : '🟢 Low';
}

function stopFireSim() {
  fsRunning = false;
  if (fsInterval) { clearInterval(fsInterval); fsInterval = null; }
  const btn = document.getElementById('fs-run-btn');
  if (btn) btn.textContent = '▶ Run Simulation';
}

function resetFireSim() {
  stopFireSim();
  fsOrigin = null;
  buildFSGrid();
  drawFSCanvas();
  const lbl = document.getElementById('fs-origin-label');
  if (lbl) lbl.textContent = '🖱️ Click the map to set fire origin point';
  const btn = document.getElementById('fs-run-btn');
  if (btn) { btn.disabled = true; btn.textContent = '▶ Run Simulation'; }
  ['fs-stat-area','fs-stat-time','fs-stat-cells','fs-stat-intensity'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = id === 'fs-stat-area' ? '0 ha' : id === 'fs-stat-time' ? '0 min' : id === 'fs-stat-cells' ? '0' : '—';
  });
}

function onFSWindSpeedChange() {
  const v = document.getElementById('fs-wind-speed').value;
  const l = document.getElementById('fs-wind-label');
  if (l) l.textContent = v + ' km/h';
}

function onFSMoistureChange() {
  const v = document.getElementById('fs-moisture').value;
  const l = document.getElementById('fs-moisture-label');
  if (l) l.textContent = v + '%';
}

// =====================================================
// SECTION 3 — SATELLITE BEFORE / AFTER COMPARATOR
// =====================================================

const CMP_COLS = 58;
const CMP_ROWS = 50;

let cmpYearLeft  = 2000;
let cmpYearRight = 2024;
let compareInitialized = false;

function initComparator() {
  if (compareInitialized) return;
  compareInitialized = true;

  populateCmpYearSelects();

  requestAnimationFrame(() => {
    const wrap = document.getElementById('cmp-wrapper');
    if (!wrap) return;
    const W = Math.max(500, wrap.clientWidth);
    const H = 460;

    const lc = document.getElementById('cmp-left-canvas');
    const rc = document.getElementById('cmp-right-canvas');
    if (!lc || !rc) return;

    lc.width = rc.width = W;
    lc.height = rc.height = H;

    drawCmpCanvas(lc, cmpYearLeft,  'left');
    drawCmpCanvas(rc, cmpYearRight, 'right');
    updateCmpStats();
    setupCmpSlider();
  });
}

function populateCmpYearSelects() {
  ['cmp-year-a', 'cmp-year-b'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = '';
    for (let y = 2000; y <= 2024; y++) {
      const opt = document.createElement('option');
      opt.value = y; opt.textContent = y;
      if ((id === 'cmp-year-a' && y === 2000) || (id === 'cmp-year-b' && y === 2024)) opt.selected = true;
      sel.appendChild(opt);
    }
  });
}

function drawCmpCanvas(canvas, year, side) {
  const ctx = canvas.getContext('2d');
  const W   = canvas.width;
  const H   = canvas.height;
  const cW  = W / CMP_COLS;
  const cH  = H / CMP_ROWS;

  ctx.fillStyle = '#060f09';
  ctx.fillRect(0, 0, W, H);

  for (let row = 0; row < CMP_ROWS; row++) {
    for (let col = 0; col < CMP_COLS; col++) {
      const lat = 37 - (row / (CMP_ROWS - 1)) * 29;
      const lng = 68 + (col / (CMP_COLS - 1)) * 29;
      if (!isInIndia(lat, lng)) continue;
      const ndvi = getNDVIForCell(lat, lng, year);
      ctx.fillStyle = p3NdviColor(ndvi);
      ctx.fillRect(Math.floor(col * cW), Math.floor(row * cH), Math.ceil(cW) - 1, Math.ceil(cH) - 1);
    }
  }

  // Year label badge
  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  ctx.fillRect(10, 10, 86, 30);
  ctx.fillStyle = side === 'left' ? '#3dcc73' : '#f97316';
  ctx.font = 'bold 19px "Space Grotesk", system-ui, sans-serif';
  ctx.fillText(String(year), 18, 31);

  // NDVI scale bar
  const barY = H - 16;
  for (let i = 0; i < 180; i++) {
    ctx.fillStyle = p3NdviColor(i / 180);
    ctx.fillRect(10 + i, barY, 1, 7);
  }
  ctx.fillStyle = 'rgba(200,240,218,0.65)';
  ctx.font = '9px Inter, sans-serif';
  ctx.fillText('Bare', 10, barY - 3);
  ctx.fillText('Dense', 170, barY - 3);
}

function setupCmpSlider() {
  const slider = document.getElementById('cmp-range');
  const rc     = document.getElementById('cmp-right-canvas');
  const div    = document.getElementById('cmp-divider');
  if (!slider) return;
  slider.addEventListener('input', (e) => {
    const pct = e.target.value;
    if (rc)  rc.style.clipPath = `inset(0 0 0 ${pct}%)`;
    if (div) div.style.left   = pct + '%';
  });
  // Set initial state
  if (rc)  rc.style.clipPath = 'inset(0 0 0 50%)';
  if (div) div.style.left   = '50%';
}

function updateCompare() {
  const a = parseInt(document.getElementById('cmp-year-a').value);
  const b = parseInt(document.getElementById('cmp-year-b').value);
  if (a >= b) { alert('Year A must be earlier than Year B.'); return; }
  cmpYearLeft  = a;
  cmpYearRight = b;
  const lc = document.getElementById('cmp-left-canvas');
  const rc = document.getElementById('cmp-right-canvas');
  if (lc) drawCmpCanvas(lc, a, 'left');
  if (rc) drawCmpCanvas(rc, b, 'right');
  const lblL = document.getElementById('cmp-label-left');
  const lblR = document.getElementById('cmp-label-right');
  if (lblL) lblL.textContent = '◀ ' + a;
  if (lblR) lblR.textContent = b + ' ▶';
  updateCmpStats();
}

function updateCmpStats() {
  const years       = cmpYearRight - cmpYearLeft;
  const lossKm2     = Math.round(Math.max(0, years * 4300));
  const ndviDelta   = (years * -0.002).toFixed(3);
  const carbonLost  = Math.round(lossKm2 * 0.185);
  const speciesImpacted = Math.round(years * 1.8);
  const el = id => document.getElementById(id);
  if (el('cmp-stat-loss'))    el('cmp-stat-loss').textContent    = lossKm2.toLocaleString() + ' km²';
  if (el('cmp-stat-ndvi'))    el('cmp-stat-ndvi').textContent    = ndviDelta;
  if (el('cmp-stat-carbon'))  el('cmp-stat-carbon').textContent  = carbonLost.toLocaleString() + ' Tg C';
  if (el('cmp-stat-species')) el('cmp-stat-species').textContent = speciesImpacted + ' spp.';
  if (el('cmp-stat-years'))   el('cmp-stat-years').textContent   = cmpYearLeft + '–' + cmpYearRight;
}

function setCmpPreset(preset) {
  const p = { assam: [2000,2024], ghats: [2005,2024], mp: [2000,2020], sunder: [2000,2024] }[preset];
  if (!p) return;
  document.getElementById('cmp-year-a').value = p[0];
  document.getElementById('cmp-year-b').value = p[1];
  updateCompare();
}

// =====================================================
// PHASE 3 — INIT ENTRY POINT (called from app.js)
// =====================================================

function initPhase3() {
  initReports();
}
