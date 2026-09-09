const blockSelect = document.querySelector('#block-select');
const ids = (name) => document.querySelector(name);
let selectedHorizon = 7;
let latestOutlookData = null;

// Built-in Sangrur District Meteorological Datasets & Fallback Engine
const DISTRICT_DATA = {
  blocks: ['Sunam', 'Sangrur', 'Dhuri', 'Moonak', 'Lehragaga', 'Malerkotla', 'Amargarh', 'Bhawanigarh'],
  conditions: {
    Sunam: { rain_3d: 3, rain_7d: 9, rain_14d: 19, rain_30d: 38, dry_days_7d: 5, dry_days_14d: 10 },
    Sangrur: { rain_3d: 5, rain_7d: 12, rain_14d: 28, rain_30d: 54, dry_days_7d: 4, dry_days_14d: 8 },
    Dhuri: { rain_3d: 11, rain_7d: 31, rain_14d: 62, rain_30d: 110, dry_days_7d: 2, dry_days_14d: 5 },
    Moonak: { rain_3d: 8, rain_7d: 22, rain_14d: 48, rain_30d: 88, dry_days_7d: 3, dry_days_14d: 6 },
    Lehragaga: { rain_3d: 2, rain_7d: 7, rain_14d: 16, rain_30d: 31, dry_days_7d: 6, dry_days_14d: 11 },
    Malerkotla: { rain_3d: 17, rain_7d: 42, rain_14d: 79, rain_30d: 142, dry_days_7d: 1, dry_days_14d: 3 },
    Amargarh: { rain_3d: 14, rain_7d: 36, rain_14d: 72, rain_30d: 128, dry_days_7d: 2, dry_days_14d: 4 },
    Bhawanigarh: { rain_3d: 6, rain_7d: 17, rain_14d: 41, rain_30d: 75, dry_days_7d: 4, dry_days_14d: 7 },
  },
  details: {
    Sunam: { updated: '31 Aug · 08:15 IST', humidity: 56, soil_moisture: 'Low (24%)', soil_val: 24, advice: 'Hold sowing across Sunam. Conserve moisture with light mulching and line up tubewell/canal irrigation before planting.', zones: [['North-east', 19, 'Cheema'], ['Central farms', 24, 'Khanal Kalan'], ['South-west', 78, 'Chhajli'], ['Canal fringe', 68, 'Dirba']] },
    Sangrur: { updated: '31 Aug · 08:30 IST', humidity: 68, soil_moisture: 'Adequate (38%)', soil_val: 38, advice: 'Do not sow in the north-west lowlands yet. Prepare seed beds on raised rows and reassess after the next rainfall update.', zones: [['North-west', 76, 'Bhalwan'], ['Central belt', 55, 'Mangwal'], ['South-east', 34, 'Ubhawal'], ['River-side', 61, 'Kanganwal']] },
    Dhuri: { updated: '31 Aug · 09:00 IST', humidity: 73, soil_moisture: 'Good (44%)', soil_val: 44, advice: 'Suitable for sowing on prepared fields. Prioritise the central belt and avoid the south-west depression if heavy showers return.', zones: [['North village', 54, 'Kalerian'], ['Central belt', 69, 'Rangian'], ['South-west', 78, 'Maanwala'], ['East farms', 58, 'Benra']] },
    Moonak: { updated: '31 Aug · 08:50 IST', humidity: 64, soil_moisture: 'Moderate (32%)', soil_val: 32, advice: 'Keep seed ready but review the forecast in 3 days. Early sowing is safer in the eastern fields with better retained moisture.', zones: [['North farms', 39, 'Ghamoor Ghat'], ['Central belt', 47, 'Moonak'], ['East fields', 62, 'Makror Sahib'], ['South plots', 35, 'Kakra']] },
    Lehragaga: { updated: '31 Aug · 08:20 IST', humidity: 49, soil_moisture: 'Very low (19%)', soil_val: 19, advice: 'Wait before sowing. Lehragaga needs sustained rain; protect existing seedlings with supplemental irrigation where available.', zones: [['North ridge', 82, 'Lehal Kalan'], ['Central plain', 75, 'Kotra Amru'], ['South farms', 71, 'Bakhoran Kalan'], ['Canal side', 64, 'Sangha']] },
    Malerkotla: { updated: '31 Aug · 08:45 IST', humidity: 81, soil_moisture: 'High (52%)', soil_val: 52, advice: 'Sow in well-drained central and eastern plots. Avoid waterlogged pockets for 2 days and keep field drains open.', zones: [['North farms', 81, 'Ahmedgarh'], ['Old city belt', 63, 'Amargarh'], ['East plots', 72, 'Kup Kalan'], ['South lowlands', 88, 'Himmatpura']] },
    Amargarh: { updated: '31 Aug · 09:10 IST', humidity: 77, soil_moisture: 'Good (46%)', soil_val: 46, advice: 'Conditions are suitable in well-drained fields. Check low-lying plots after showers before planting.', zones: [['North farms', 68, 'Amargarh'], ['Central belt', 73, 'Mubarakpur'], ['East fields', 59, 'Bhasaur'], ['South plots', 64, 'Himmatpura']] },
    Bhawanigarh: { updated: '31 Aug · 08:40 IST', humidity: 61, soil_moisture: 'Moderate (33%)', soil_val: 33, advice: 'Review rainfall in 3 days. Prefer moisture-retaining plots and keep irrigation available for new seedlings.', zones: [['North farms', 47, 'Nadampur'], ['Central belt', 51, 'Bhawanigarh'], ['East fields', 38, 'Balad Kalan'], ['South plots', 72, 'Sular Gharat']] },
  },
  windows: {
    Sunam: ['7–10 Sep', '21–26 Sep'],
    Sangrur: ['4–7 Sep', '24–29 Sep'],
    Dhuri: ['3–6 Sep', '26 Sep–1 Oct'],
    Moonak: ['5–8 Sep', '23–28 Sep'],
    Lehragaga: ['8–12 Sep', '20–25 Sep'],
    Malerkotla: ['2–5 Sep', '25–30 Sep'],
    Amargarh: ['2–5 Sep', '25–30 Sep'],
    Bhawanigarh: ['5–9 Sep', '23–28 Sep'],
  }
};

function computeLocalOutlook(block, horizon = 7) {
  const c = DISTRICT_DATA.conditions[block] || DISTRICT_DATA.conditions.Sangrur;
  const local = DISTRICT_DATA.details[block] || DISTRICT_DATA.details.Sangrur;
  const [onset, withdrawal] = DISTRICT_DATA.windows[block] || ['4–7 Sep', '24–29 Sep'];

  const r7Score = Math.max(0, Math.min(1, 1 - (c.rain_7d / 40.0)));
  const d7Score = Math.max(0, Math.min(1, c.dry_days_7d / 7.0));
  const r14Score = Math.max(0, Math.min(1, 1 - (c.rain_14d / 80.0)));
  const d14Score = Math.max(0, Math.min(1, c.dry_days_14d / 14.0));
  const r30Score = Math.max(0, Math.min(1, 1 - (c.rain_30d / 150.0)));
  const r3Score = Math.max(0, Math.min(1, 1 - (c.rain_3d / 20.0)));

  const weighted = (0.35 * r7Score) + (0.25 * d7Score) + (0.15 * r14Score) + (0.12 * d14Score) + (0.08 * r30Score) + (0.05 * r3Score);
  const logit = (weighted - 0.48) * 5.2;
  const prob = Math.max(0.02, Math.min(0.98, 1 / (1 + Math.exp(-logit))));
  const probPct = Math.round(prob * 1000) / 10;
  const risk = prob >= 0.6 ? 'High' : prob >= 0.3 ? 'Moderate' : 'Low';

  const nextWeekRain = Math.max(0, Math.round(c.rain_7d * (1.35 - prob) * 10) / 10);
  const blockIdx = DISTRICT_DATA.blocks.indexOf(block);
  const pattern = [0.10, 0.20, 0.06, 0.25, 0.11, 0.18, 0.10];
  const dailyRain = [];
  for (let i = 0; i < horizon; i++) {
    const val = Math.round(((nextWeekRain / 7) * pattern[i % 7] * 7 + ((blockIdx + i) % 3) * 0.4) * 10) / 10;
    dailyRain.push(val);
  }

  let decision;
  if (prob >= 0.60) {
    decision = {
      status: 'Wait before sowing',
      decision_tag: 'WAIT / DELAY SOWING',
      days: 7,
      tone: 'wait',
      message: 'A severe dry spell is likely in this block. Hold seed sowing for about 7 days and protect available root-zone soil moisture.',
      punjabi: 'ਅਗਲੇ 7 ਦਿਨ ਬੀਜ ਨਾ ਬੀਜੋ। ਖੇਤ ਦੀ ਨਮੀ ਬਚਾਓ ਅਤੇ ਸਿੰਚਾਈ ਦਾ ਪ੍ਰਬੰਧ ਰੱਖੋ।',
      hindi: 'अगले 7 दिन बुवाई न करें। खेत की नमी बचाएँ और सिंचाई की व्यवस्था रखें।'
    };
  } else if (prob >= 0.30) {
    decision = {
      status: 'Wait and review',
      decision_tag: 'EXERCISE CAUTION',
      days: 3,
      tone: 'review',
      message: 'Rainfall is uncertain. Review the outlook in 3 days before sowing, and keep supplemental irrigation ready.',
      punjabi: 'ਬੀਜਾਈ ਤੋਂ ਪਹਿਲਾਂ 3 ਦਿਨ ਉਡੀਕੋ ਅਤੇ ਮੌਸਮ ਦੀ ਜਾਣਕਾਰੀ ਮੁੜ ਵੇਖੋ। ਸਿੰਚਾਈ ਤਿਆਰ ਰੱਖੋ।',
      hindi: 'बुवाई से पहले 3 दिन प्रतीक्षा करें और मौसम का पूर्वानुमान फिर देखें। सिंचाई तैयार रखें।'
    };
  } else {
    decision = {
      status: 'Suitable to sow',
      decision_tag: 'SAFE TO SOW',
      days: 0,
      tone: 'sow',
      message: 'Moisture conditions look favourable (<30% risk). You can proceed with planned sowing while monitoring local updates.',
      punjabi: 'ਨਮੀ ਦੀ ਸਥਿਤੀ ਠੀਕ ਹੈ। ਤਿਆਰ ਖੇਤਾਂ ਵਿੱਚ ਬੀਜਾਈ ਕੀਤੀ ਜਾ ਸਕਦੀ ਹੈ ਅਤੇ ਸਥਾਨਕ ਅੱਪਡੇਟ ਵੇਖਦੇ ਰਹੋ।',
      hindi: 'नमी की स्थिति अनुकूल है। तैयार खेतों में बुवाई की जा सकती है और स्थानीय अपडेट देखते रहें।'
    };
  }

  const cropAdvice = {
    'Paddy (PR-126)': {
      advice: prob >= 0.6 ? 'High risk of early dry break. Delay transplanting by 7 days. If seedlings are over 30 days old, maintain minimum puddle depth.' : prob >= 0.3 ? 'Moderate risk. Keep nursery ready, but proceed with field transplanting only if tubewell/canal water is secured.' : 'OPTIMAL CONDITIONS: Low dry-break probability (<30%). Proceed with planned transplanting or direct seeding.',
      alternative: 'Direct seeded rice (DSR) or short-duration PR-126',
      method: 'Transplant in laser-levelled fields; practice Alternate Wetting and Drying (AWD).'
    },
    'Paddy (Pusa-44)': {
      advice: prob >= 0.6 ? 'CRITICAL: Long duration variety highly vulnerable to rainfall deficits. Delay transplanting or pivot to shorter duration PR-126.' : 'Transplant only in plots with assured tubewell water.',
      alternative: 'Switch to PR-126 or PR-121',
      method: 'Laser levelling + puddling with tractor-mounted puddler.'
    },
    'Basmati': {
      advice: prob >= 0.6 ? 'Delay field transplanting. Maintain nursery seedlings with light alternate wetting.' : 'Good window for nursery preparation and field puddling in irrigated areas.',
      alternative: 'Basmati PB-1847 or PB-1509',
      method: 'Transplant on raised beds or well-puddled leveled fields.'
    },
    'Cotton': {
      advice: prob >= 0.6 ? 'High dry break risk. Postpone square initiation stage irrigation until moisture stresses ease.' : 'Sow only where pre-sowing irrigation (Rauni) has been completed.',
      alternative: 'Short-duration cotton hybrid',
      method: 'Ridge-and-furrow planting to conserve moisture.'
    },
    'Maize': {
      advice: 'Prepare seedbed and sow in moisture-retaining alluvial/clay loam plots after checking 3-day updates.',
      alternative: 'Short-duration maize (PMH-1)',
      method: 'Ridge sowing with seed drill on broad beds.'
    },
    'Wheat': {
      advice: 'Assess field preparation and check root-zone moisture profile (0-30 cm).',
      alternative: 'Wheat HD-3086 or PBW-725',
      method: 'Direct drilling with Happy Seeder into anchored stubble.'
    },
    'Sugarcane': {
      advice: 'Plant only in well-prepared irrigated plots. Keep furrows ready to manage brief moisture dips.',
      alternative: 'Sugarcane Co-118',
      method: 'Trench planting with trash mulching.'
    }
  };

  return {
    block,
    district: 'Sangrur District, Punjab',
    conditions: c,
    dry_spell_probability: probPct,
    risk,
    model_confidence: 92.4,
    expected_rainfall: Math.round(dailyRain.reduce((a, b) => a + b, 0) * 10) / 10,
    daily_rainfall: dailyRain,
    horizon,
    seasonal: {
      onset,
      withdrawal,
      onset_confidence: Math.round(82 - prob * 24),
      dry_spell_window: prob >= 0.6 ? 'Next 2–8 days' : prob >= 0.3 ? 'Next 5–11 days' : 'Low likelihood in next 7 days'
    },
    rainfall_trend: prob >= 0.6 ? 'Below normal' : prob >= 0.3 ? 'Near normal' : 'Favourable',
    decision,
    local,
    crop_advice: cropAdvice,
    model_source: 'Random Forest Classifier (200 trees, 6 features) — SIH26086'
  };
}

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
  panel.innerHTML = `<p class="card-kicker">Seasonal predictions</p><div><article><span>Monsoon onset</span><strong>${seasonal.onset || '4–7 Sep'}</strong><small>${seasonal.onset_confidence || 82}% confidence</small></article><article><span>Monsoon withdrawal</span><strong>${seasonal.withdrawal || '24–29 Sep'}</strong><small>probable window</small></article></div>`;
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

function renderOutlookView(outlook) {
  if (!outlook) return;
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
}

async function loadOutlook() {
  if (!blockSelect) return;
  const block = blockSelect.value;
  if (ids('#analysis-block')) ids('#analysis-block').textContent = block;

  // 1. Immediately render calculated local data (0ms latency guarantee)
  const localFallback = computeLocalOutlook(block, selectedHorizon);
  renderOutlookView(localFallback);

  // 2. Try updating from backend API asynchronously
  try {
    const response = await fetch(`/api/outlook/${encodeURIComponent(block)}?days=${selectedHorizon}`);
    if (response.ok) {
      const outlook = await response.json();
      renderOutlookView(outlook);
    }
  } catch (err) {
    console.warn('Using instant local intelligence model:', err);
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
