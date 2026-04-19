// ===================================================
// VANARAKHSA AI — DATA LAYER
// Static seed data for Phase 1 (will be replaced by live APIs)
// ===================================================

// ------- Active Alerts -------
const ALERTS = [
  { id: 'a1', type: 'critical', icon: '🔥', title: 'Fire Alert — Simlipal NP', sub: 'Odisha · 2,400 ha affected', time: '4m ago', lat: 21.6, lng: 86.5 },
  { id: 'a2', type: 'critical', icon: '🌳', title: 'Rapid Deforestation — Assam', sub: 'Karbi Anglong · 340 ha/week', time: '18m ago', lat: 26.3, lng: 92.8 },
  { id: 'a3', type: 'warning', icon: '⚠️', title: 'Tiger Corridor Breach', sub: 'Pench–Kanha · human encroachment', time: '1h ago', lat: 22.2, lng: 80.1 },
  { id: 'a4', type: 'warning', icon: '🦅', title: 'Species Habitat Loss', sub: 'Great Hornbill · Silent Valley fragmented', time: '2h ago', lat: 11.1, lng: 76.4 },
  { id: 'a5', type: 'info', icon: '💧', title: 'Drought Stress Detected', sub: 'Rajasthan–MP border · NDVI dropped 18%', time: '3h ago', lat: 24.5, lng: 76.0 },
  { id: 'a6', type: 'critical', icon: '🔥', title: 'Fire Alert — Bandipur TR', sub: 'Karnataka · 860 ha under threat', time: '5h ago', lat: 11.7, lng: 76.6 },
];

// ------- Protected Zones -------
const PROTECTED_ZONES = [
  { id: 'z1', name: 'Jim Corbett National Park', state: 'Uttarakhand', type: 'national-park', typeName: 'National Park', area: 1318, established: 1936, ndvi: 0.82, threat: 28, lat: 29.5, lng: 78.9, species: ['Tiger','Leopard','Asian Elephant'], icon: '🐯' },
  { id: 'z2', name: 'Kaziranga National Park', state: 'Assam', type: 'national-park', typeName: 'National Park', area: 858, established: 1974, ndvi: 0.79, threat: 45, lat: 26.6, lng: 93.4, species: ['One-horned Rhinoceros','Tiger','Wild Buffalo'], icon: '🦏' },
  { id: 'z3', name: 'Sundarbans National Park', state: 'West Bengal', type: 'national-park', typeName: 'National Park', area: 1330, established: 1984, ndvi: 0.71, threat: 62, lat: 21.9, lng: 88.9, species: ['Royal Bengal Tiger','Irrawaddy Dolphin','Estuarine Crocodile'], icon: '🐅' },
  { id: 'z4', name: 'Bandipur Tiger Reserve', state: 'Karnataka', type: 'tiger-reserve', typeName: 'Tiger Reserve', area: 874, established: 1974, ndvi: 0.76, threat: 38, lat: 11.7, lng: 76.6, species: ['Tiger','Leopard','Gaur','Wild Dog'], icon: '🐆' },
  { id: 'z5', name: 'Pench Tiger Reserve', state: 'Madhya Pradesh', type: 'tiger-reserve', typeName: 'Tiger Reserve', area: 758, established: 1977, ndvi: 0.69, threat: 41, lat: 22.0, lng: 79.8, species: ['Tiger','Leopard','Nilgai','Indian Wild Dog'], icon: '🐯' },
  { id: 'z6', name: 'Silent Valley NP', state: 'Kerala', type: 'national-park', typeName: 'National Park', area: 237, established: 1980, ndvi: 0.88, threat: 22, lat: 11.1, lng: 76.4, species: ['Lion-tailed Macaque','Tiger','Elephant'], icon: '🐒' },
  { id: 'z7', name: 'Simlipal National Park', state: 'Odisha', type: 'national-park', typeName: 'National Park', area: 2750, established: 1980, ndvi: 0.74, threat: 67, lat: 21.6, lng: 86.5, species: ['Tiger','Elephant','Gaur'], icon: '🌿' },
  { id: 'z8', name: 'Namdapha NP', state: 'Arunachal Pradesh', type: 'national-park', typeName: 'National Park', area: 1985, established: 1983, ndvi: 0.91, threat: 18, lat: 27.4, lng: 96.4, species: ['Snow Leopard','Cloud Leopard','Red Panda'], icon: '🐼' },
  { id: 'z9', name: 'Gulf of Mannar', state: 'Tamil Nadu', type: 'biosphere', typeName: 'Biosphere Reserve', area: 10500, established: 1989, ndvi: 0.55, threat: 55, lat: 9.1, lng: 79.1, species: ['Dugong','Sea Turtle','Dolphins'], icon: '🐢' },
  { id: 'z10', name: 'Nokrek Biosphere', state: 'Meghalaya', type: 'biosphere', typeName: 'Biosphere Reserve', area: 820, established: 1988, ndvi: 0.85, threat: 30, lat: 25.5, lng: 90.2, species: ['Red Panda','Elephant','Hoolock Gibbon'], icon: '🌳' },
  { id: 'z11', name: 'Periyar Wildlife Sanctuary', state: 'Kerala', type: 'wildlife-sanctuary', typeName: 'Wildlife Sanctuary', area: 925, established: 1950, ndvi: 0.80, threat: 25, lat: 9.5, lng: 77.2, species: ['Tiger','Elephant','Gaur'], icon: '🐘' },
  { id: 'z12', name: 'Kanha Tiger Reserve', state: 'Madhya Pradesh', type: 'tiger-reserve', typeName: 'Tiger Reserve', area: 2052, established: 1974, ndvi: 0.78, threat: 33, lat: 22.3, lng: 80.6, species: ['Tiger','Barasingha','Leopard'], icon: '🦌' },
];

// ------- Endangered Species -------
const SPECIES_DATA = [
  { id: 's1', name: 'Bengal Tiger', sci: 'Panthera tigris tigris', emoji: '🐅', status: 'EN', statusLabel: 'Endangered', population: 3167, trend: '+33%', habitatLoss: 72, riskScore: 68, primaryHabitat: 'Deciduous & moist forests', threats: ['Poaching', 'Habitat fragmentation', 'Human–wildlife conflict'], refuges: ['Corbett', 'Sundarbans', 'Bandipur'] },
  { id: 's2', name: 'Indian One-Horned Rhinoceros', sci: 'Rhinoceros unicornis', emoji: '🦏', status: 'VU', statusLabel: 'Vulnerable', population: 3300, trend: '+8%', habitatLoss: 48, riskScore: 52, primaryHabitat: 'Tall grasslands & floodplains', threats: ['Poaching for horn', 'Flooding', 'Forest fire'], refuges: ['Kaziranga', 'Pobitora', 'Orang'] },
  { id: 's3', name: 'Snow Leopard', sci: 'Panthera uncia', emoji: '🐆', status: 'VU', statusLabel: 'Vulnerable', population: 718, trend: '-4%', habitatLoss: 31, riskScore: 61, primaryHabitat: 'High-altitude Himalayas', threats: ['Climate change', 'Prey depletion', 'Retaliatory killing'], refuges: ['Hemis NP', 'Spiti Valley', 'Pin Valley'] },
  { id: 's4', name: 'Great Indian Bustard', sci: 'Ardeotis nigriceps', emoji: '🦅', status: 'CR', statusLabel: 'Critically Endangered', population: 150, trend: '-22%', habitatLoss: 90, riskScore: 94, primaryHabitat: 'Arid grasslands & Thar desert', threats: ['Power line collision', 'Habitat loss', 'Hunting'], refuges: ['Desert NP', 'Rollapadu'] },
  { id: 's5', name: 'Lion-Tailed Macaque', sci: 'Macaca silenus', emoji: '🐒', status: 'EN', statusLabel: 'Endangered', population: 4000, trend: '-12%', habitatLoss: 65, riskScore: 77, primaryHabitat: 'Western Ghats rainforest', threats: ['Deforestation', 'Fragmentation', 'Road kills'], refuges: ['Silent Valley', 'Anamalai', 'Kalakad'] },
  { id: 's6', name: 'Gangetic River Dolphin', sci: 'Platanista gangetica', emoji: '🐬', status: 'EN', statusLabel: 'Endangered', population: 3700, trend: '+5%', habitatLoss: 55, riskScore: 63, primaryHabitat: 'Ganges & Brahmaputra river systems', threats: ['Pollution', 'Fishing nets', 'Dam construction'], refuges: ['Vikramshila', 'Chambal'] },
  { id: 's7', name: 'Red Panda', sci: 'Ailurus fulgens', emoji: '🦊', status: 'EN', statusLabel: 'Endangered', population: 2500, trend: '-7%', habitatLoss: 44, riskScore: 59, primaryHabitat: 'Eastern Himalayan temperate forest', threats: ['Deforestation', 'Climate change', 'Pet trade'], refuges: ['Kanchenjunga', 'Namdapha', 'Singalila'] },
  { id: 's8', name: 'Hoolock Gibbon', sci: 'Hoolock hoolock', emoji: '🦧', status: 'EN', statusLabel: 'Endangered', population: 5000, trend: '-18%', habitatLoss: 80, riskScore: 82, primaryHabitat: 'Northeast India tropical forests', threats: ['Deforestation', 'Hunting', 'Shifting cultivation'], refuges: ['Hollongapar', 'Nokrek', 'Gibbon WLS'] },
];

// ------- Deforestation time series -------
const YEARLY_DATA = {
  years: [2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
  forestCover: [776520,773100,769800,765200,761000,757400,753200,749800,746500,742300,738000,734200,729800,726500,722100,718400,715200,711800,708900,706200,703800,710400,707500,711000,713789],
  defoRate:    [8200, 6800, 7100, 7600, 6900, 7200, 8100, 7900, 7600, 8000, 8200, 7800, 8800, 7900, 8800, 7100, 6700, 7200, 5800, 4900, 5100, 4600, 5800, 4700, 4300],
  ndvi:        [0.72, 0.71, 0.70, 0.70, 0.69, 0.68, 0.68, 0.67, 0.67, 0.66, 0.66, 0.65, 0.65, 0.65, 0.64, 0.64, 0.65, 0.65, 0.66, 0.66, 0.67, 0.68, 0.68, 0.69, 0.70],
  carbonStock: [5220, 5190, 5165, 5130, 5095, 5060, 5025, 4995, 4960, 4925, 4890, 4858, 4820, 4790, 4755, 4726, 4700, 4672, 4648, 4625, 4604, 4640, 4618, 4645, 4680]
};

// ------- State-level deforestation (2024 top 8) -------
const STATE_LOSS = {
  states: ['Assam','MP','Odisha','Maharashtra','Andhra Pradesh','Chhattisgarh','Uttarakhand','Jharkhand'],
  loss2024: [420, 380, 310, 290, 260, 250, 210, 190]
};

// ------- Fire hotspots (lat/lng) -------
const FIRE_HOTSPOTS = [
  { lat: 21.6, lng: 86.5, intensity: 0.9, name: 'Simlipal NP' },
  { lat: 11.7, lng: 76.6, intensity: 0.7, name: 'Bandipur TR' },
  { lat: 26.3, lng: 92.8, intensity: 0.6, name: 'Karbi Anglong' },
  { lat: 22.0, lng: 79.8, intensity: 0.5, name: 'Pench TR' },
  { lat: 18.5, lng: 79.5, intensity: 0.8, name: 'Nagarjunasagar' },
  { lat: 24.8, lng: 84.0, intensity: 0.4, name: 'Palamu TR' },
  { lat: 15.4, lng: 75.2, intensity: 0.5, name: 'Anshi NP' },
  { lat: 27.0, lng: 94.0, intensity: 0.7, name: 'Dibang Valley' },
  { lat: 20.8, lng: 85.0, intensity: 0.6, name: 'Satkosia' },
  { lat: 23.5, lng: 92.7, intensity: 0.55, name: 'Dampa TR – Mizoram' },
];

// ------- Deforestation zones ----------
const DEFORESTATION_ZONES = [
  { lat: 26.3, lng: 92.8, radius: 0.6, severity: 'high', name: 'Karbi Anglong – Assam' },
  { lat: 24.6, lng: 93.2, radius: 0.4, severity: 'medium', name: 'Manipur Hills' },
  { lat: 20.0, lng: 82.0, radius: 0.5, severity: 'high', name: 'Bastar – Chhattisgarh' },
  { lat: 22.8, lng: 84.2, radius: 0.35, severity: 'medium', name: 'Jharkhand Central' },
  { lat: 11.6, lng: 79.2, radius: 0.3, severity: 'low', name: 'Tamil Nadu Eastern Ghats' },
  { lat: 16.3, lng: 74.2, radius: 0.4, severity: 'medium', name: 'Western Ghats – Ratnagiri' },
  { lat: 28.8, lng: 93.6, radius: 0.5, severity: 'high', name: 'Arunachal – Dibang' },
];

// ------- Species corridors -------
const CORRIDORS = [
  { name: 'Pench – Kanha Corridor', points: [[22.0,79.8],[22.2,80.1],[22.3,80.6]], width: 3, species: 'Tiger' },
  { name: 'Corbett – Rajaji Corridor', points: [[29.5,78.9],[29.8,78.0],[30.1,77.9]], width: 3, species: 'Elephant' },
  { name: 'Anamalai – Mundanthurai', points: [[10.4,77.1],[9.8,77.2],[9.1,77.4]], width: 3, species: 'Elephant+Tiger' },
];

// ------- Search Index -------
const SEARCH_INDEX = [
  { name: 'Jim Corbett NP', lat: 29.5, lng: 78.9, icon: '🐯', type: 'National Park' },
  { name: 'Kaziranga NP', lat: 26.6, lng: 93.4, icon: '🦏', type: 'National Park' },
  { name: 'Sundarbans NP', lat: 21.9, lng: 88.9, icon: '🐅', type: 'National Park' },
  { name: 'Bandipur TR', lat: 11.7, lng: 76.6, icon: '🐆', type: 'Tiger Reserve' },
  { name: 'Simlipal NP', lat: 21.6, lng: 86.5, icon: '🌿', type: 'National Park' },
  { name: 'Western Ghats', lat: 11.0, lng: 76.5, icon: '⛰️', type: 'Region' },
  { name: 'Assam', lat: 26.2, lng: 92.9, icon: '📍', type: 'State' },
  { name: 'Madhya Pradesh', lat: 22.9, lng: 78.7, icon: '📍', type: 'State' },
  { name: 'Arunachal Pradesh', lat: 28.2, lng: 94.7, icon: '📍', type: 'State' },
  { name: 'Kerala', lat: 10.8, lng: 76.3, icon: '📍', type: 'State' },
  { name: 'Namdapha NP', lat: 27.4, lng: 96.4, icon: '🐼', type: 'National Park' },
  { name: 'Kanha TR', lat: 22.3, lng: 80.6, icon: '🦌', type: 'Tiger Reserve' },
];

// ------- NDVI color scale -------
function ndviColor(ndvi) {
  // 0 = #7a3605 (bare) → 0.5 = #c8b400 → 1 = #004d00 (dense)
  if (ndvi < 0.2) return '#7a3605';
  if (ndvi < 0.35) return '#c8a000';
  if (ndvi < 0.5) return '#90c820';
  if (ndvi < 0.65) return '#3dcc73';
  if (ndvi < 0.8) return '#1a7a3e';
  return '#004d18';
}

// ------- Threat color -------
function threatColor(threat) {
  if (threat >= 70) return '#ef4444';
  if (threat >= 50) return '#f59e0b';
  if (threat >= 30) return '#38bdf8';
  return '#27a057';
}
