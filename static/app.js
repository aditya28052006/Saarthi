const blockSelect = document.querySelector('#block-select');
const ids = (name) => document.querySelector(name);
const prototypeBadge = document.createElement('span');
prototypeBadge.className = 'prototype-badge';
prototypeBadge.textContent = 'PROTOTYPE · SYNTHETIC FORECAST LAYERS';
document.querySelector('footer')?.append(prototypeBadge);
let selectedHorizon = 7;
let latestOutlookData = null;

function mapColor(value) {
  if (value >= 75) return '#2e6a90';
  if (value >= 55) return '#62a8c8';
  if (value >= 35) return '#b7d978';
  return '#e2be62';
}

function renderMap(local) {
  if (!local || !local.zones) return;
  let panel = document.querySelector('#rainfall-map');
  if (!panel) {
    panel = document.createElement('section');
    panel.id = 'rainfall-map';
    panel.className = 'rainfall-map';
    document.querySelector('.analysis-panel')?.append(panel);
  }
  const areas = [
    ['M16 19 L109 10 L119 60 L89 86 L23 72 Z', 65, 44],
    ['M112 12 L211 24 L204 78 L146 89 L119 60 Z', 163, 47],
    ['M22 73 L89 87 L113 142 L18 134 L9 101 Z', 61, 106],
    ['M90 87 L147 89 L207 78 L218 127 L172 146 L113 142 Z', 161, 113],
  ];
  const zones = local.zones.map(([name, value, village], index) => {
    const [path, x, y] = areas[index % areas.length];
    return `<g class="zone"><path d="${path}" fill="${mapColor(value)}"/><circle cx="${x}" cy="${y - 13}" r="3.2"/><text class="village" x="${x + 7}" y="${y - 10}">${village}</text><text class="map-value" x="${x}" y="${y + 9}" text-anchor="middle">${value}%</text><text class="zone-label" x="${x}" y="${y + 21}" text-anchor="middle">${name}</text></g>`;
  }).join('');
  const list = local.zones.map(([name, value, village]) => `<li><span><b>${village}</b><small>${name}</small></span><strong>${value}%</strong></li>`).join('');
  panel.innerHTML = `<div class="map-heading"><div><p class="card-kicker">Synthetic hyperlocal rainfall map</p><h4>Village-wise rainfall opportunity</h4></div><span>Next 7 days</span></div><svg viewBox="0 0 226 156" role="img" aria-label="Village-level rainfall opportunity map"><path class="map-outline" d="M16 19 L109 10 L211 24 L204 78 L218 127 L172 146 L113 142 L18 134 L9 101 Z"/><path class="waterway" d="M4 54 C47 69 63 53 105 71 S167 111 224 91"/><path class="road" d="M32 8 L76 146 M125 6 L151 149"/>${zones}<g class="map-north"><path d="M12 9 L17 19 L12 17 L7 19 Z"/><text x="12" y="28" text-anchor="middle">N</text></g></svg><div class="map-legend"><span><i class="dry"></i>Low rainfall</span><span><i class="moderate"></i>Moderate</span><span><i class="wet"></i>High rainfall</span></div><ul class="village-list">${list}</ul><div class="farmer-advice"><span>Field note</span><p>${local.advice || ''}</p><div><small>Soil moisture</small><strong>${local.soil_moisture || 'Adequate'}</strong><small>Humidity</small><strong>${local.humidity || 65}%</strong></div></div>`;
}

function renderLanguageAdvisory(decision) {
  if (!decision) return;
  let panel = document.querySelector('#language-advisory');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'language-advisory';
    panel.className = 'language-advisory';
    document.querySelector('#sowing-card')?.append(panel);
  }
  const currentLang = localStorage.getItem('saarthi_lang') || 'en';
  const messages = { en: decision.message || '', pa: decision.punjabi || decision.message || '', hi: decision.hindi || decision.message || '' };
  panel.innerHTML = `<div class="language-tabs"><span>Language</span><button class="${currentLang === 'en' ? 'active' : ''}" data-lang="en">EN</button><button class="${currentLang === 'pa' ? 'active' : ''}" data-lang="pa">ਪੰਜਾਬੀ</button><button class="${currentLang === 'hi' ? 'active' : ''}" data-lang="hi">हिंदी</button></div><p id="local-advice">${messages[currentLang] || messages.en}</p>`;
  panel.querySelectorAll('button').forEach((button) => button.addEventListener('click', () => {
    panel.querySelectorAll('button').forEach((item) => item.classList.toggle('active', item === button));
    const lang = button.dataset.lang;
    panel.querySelector('#local-advice').textContent = messages[lang] || messages.en;
    if (typeof setLanguage === 'function') setLanguage(lang);
  }));
}

function renderTimeline(dailyRain, decision, horizon) {
  if (!dailyRain) return;
  let panel = document.querySelector('#rainfall-timeline');
  if (!panel) {
    panel = document.createElement('section');
    panel.id = 'rainfall-timeline';
    panel.className = 'rainfall-timeline';
    document.querySelector('.outlook-heading')?.append(panel);
  }
  const max = Math.max(...dailyRain, 1);
  const bars = dailyRain.map((rain, index) => `<div class="rain-day ${rain === Math.max(...dailyRain) ? 'peak' : ''}"><span>${rain} mm</span><i style="height:${Math.max(12, Math.round(rain / max * 72))}px"></i><small>D+${index + 1}</small></div>`).join('');
  const windowText = decision && decision.days ? `Review in ${decision.days} days` : 'Favourable sowing window';
  panel.innerHTML = `<div class="timeline-heading"><p class="card-kicker">Rainfall outlook</p><select aria-label="Forecast interval"><option value="7">7 days</option><option value="15">15 days</option><option value="30">30 days</option></select></div><span class="timeline-window">${windowText}</span><div class="rain-bars horizon-${horizon || 7}">${bars}</div><p class="timeline-note">Synthetic forecast estimate · rainfall in millimetres</p>`;
  const sel = panel.querySelector('select');
  if (sel) {
    sel.value = horizon || selectedHorizon;
    sel.addEventListener('change', (event) => { selectedHorizon = Number(event.target.value); loadOutlook(); });
  }
}

function renderSeasonalSignals(seasonal) {
  if (!seasonal) return;
  let panel = document.querySelector('#seasonal-signals');
  if (!panel) {
    panel = document.createElement('section');
    panel.id = 'seasonal-signals';
    panel.className = 'seasonal-signals';
    document.querySelector('.analysis-grid')?.after(panel);
  }
  panel.innerHTML = `<p class="card-kicker">Seasonal predictions</p><div><article><span>Monsoon onset</span><strong>${seasonal.onset || '4–7 Sep'}</strong><small>${seasonal.onset_confidence || 82}% confidence</small></article><article><span>Monsoon withdrawal</span><strong>${seasonal.withdrawal || '24–29 Sep'}</strong><small>probable window</small></article><article><span>Dry-spell watch</span><strong>${seasonal.dry_spell_window || 'Next 5–11 days'}</strong><small>rainfall-break outlook</small></article></div>`;
}

function renderCropAdvice(cropAdvice) {
  if (!cropAdvice) return;
  let panel = document.querySelector('#crop-advice');
  if (!panel) {
    panel = document.createElement('section');
    panel.id = 'crop-advice';
    panel.className = 'crop-advice';
    document.querySelector('#sowing-card')?.append(panel);
  }
  const crops = Object.keys(cropAdvice);
  if (crops.length === 0) return;
  const render = (crop) => {
    const plan = cropAdvice[crop];
    if (!plan) return;
    panel.innerHTML = `<div class="crop-heading"><span>Crop-specific advice</span><select aria-label="Select crop">${crops.map((item) => `<option ${item === crop ? 'selected' : ''}>${item}</option>`).join('')}</select></div><p>${plan.advice || ''}</p><div class="crop-options"><span><small>Alternative</small><b>${plan.alternative || ''}</b></span><span><small>Planting / irrigation</small><b>${plan.method || ''}</b></span></div>`;
    panel.querySelector('select')?.addEventListener('change', (event) => render(event.target.value));
  };
  render(crops[0]);
}

async function loadOutlook() {
  if (!blockSelect) return;
  const block = blockSelect.value;
  if (ids('#analysis-block')) ids('#analysis-block').textContent = block;
  try {
    const response = await fetch(`/api/outlook/${encodeURIComponent(block)}?days=${selectedHorizon}`);
    if (!response.ok) throw new Error('Unable to load the latest block outlook.');
    const outlook = await response.json();
    latestOutlookData = outlook;
    const c = outlook.conditions || {};
    if (ids('#rain-7')) ids('#rain-7').textContent = c.rain_7d != null ? c.rain_7d : '—';
    if (ids('#dry-14')) ids('#dry-14').textContent = c.dry_days_14d != null ? c.dry_days_14d : '—';
    if (ids('#expected-rain')) ids('#expected-rain').textContent = outlook.expected_rainfall != null ? outlook.expected_rainfall : '—';
    if (ids('#rain-trend')) ids('#rain-trend').textContent = outlook.rainfall_trend || 'Normal';
    if (ids('#risk-label')) ids('#risk-label').textContent = `${outlook.risk || 'Low'} dry-spell risk`;
    if (ids('#risk-probability')) ids('#risk-probability').textContent = `${outlook.dry_spell_probability || 18}% risk`;
    if (ids('#risk-meter')) ids('#risk-meter').style.width = `${outlook.dry_spell_probability || 18}%`;
    const decision = outlook.decision || {};
    if (ids('#model-note')) ids('#model-note').textContent = `Analysis source: ${outlook.model_source || 'Random Forest'}`;
    if (outlook.local) renderMap(outlook.local);
    if (outlook.daily_rainfall) renderTimeline(outlook.daily_rainfall, decision, outlook.horizon);
    if (outlook.crop_advice) renderCropAdvice(outlook.crop_advice);
    if (outlook.seasonal) renderSeasonalSignals(outlook.seasonal);
    const upd = document.querySelector('.updated');
    if (upd && outlook.local) upd.textContent = outlook.local.updated || 'Updated today';
    const card = ids('#sowing-card');
    if (card && decision) {
      card.dataset.tone = decision.tone || 'sow';
      if (ids('#decision-icon')) ids('#decision-icon').textContent = decision.tone === 'sow' ? '✓' : '↗';
      if (ids('#decision-status')) ids('#decision-status').textContent = decision.status || 'Suitable to sow';
      if (ids('#decision-title')) ids('#decision-title').textContent = decision.tone === 'sow' ? 'You can sow now.' : (decision.days ? `Wait ${decision.days} days.` : 'Review conditions.');
      if (ids('#decision-message')) ids('#decision-message').textContent = decision.message || 'Favourable moisture conditions.';
      if (ids('#wait-badge')) ids('#wait-badge').innerHTML = decision.days ? `Review in <strong>${decision.days}</strong> days` : '<strong>Proceed with sowing</strong>';
      renderLanguageAdvisory(decision);
    }
  } catch (error) {
    if (ids('#decision-title')) ids('#decision-title').textContent = 'Outlook unavailable';
    if (ids('#decision-message')) ids('#decision-message').textContent = error.message;
  }
}

if (blockSelect) {
  blockSelect.addEventListener('change', loadOutlook);
  loadOutlook();
}

window.addEventListener('languageChanged', () => {
  if (latestOutlookData && latestOutlookData.decision) {
    renderLanguageAdvisory(latestOutlookData.decision);
  }
});
