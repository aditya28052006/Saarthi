/**
 * SAARTHI Decision Platform Logic
 * Handles dynamic routing across Farmer Advisory (/farmer),
 * Village-Scale Risk Map (/map), and 7-30 Day Forecast Outlook (/timeline).
 */

let activeRoute = location.pathname.slice(1) || 'farmer';
if (!['farmer', 'map', 'timeline'].includes(activeRoute)) {
  activeRoute = 'farmer';
}

let currentFarmerData = null;
let leafletMapInstance = null;
let mapMarkersLayer = null;
let allMapVillages = [];
let activeTimelineHorizon = 30;

// Page Titles and Subtitles
const PAGE_METADATA = {
  farmer: {
    title: { en: 'Farmer <em>advisory.</em>', hi: 'किसान <em>परामर्श पोर्टल।</em>', pa: 'ਕਿਸਾਨ <em>ਸਲਾਹਕਾਰ ਪੋਰਟਲ।</em>' },
    intro: {
      en: 'Personalized sowing decisions, 4-pillar risk breakdown, and root-zone soil moisture telemetry.',
      hi: 'व्यक्तिगत बुवाई निर्णय, 4-स्तंभ जोखिम विश्लेषण और जड़-क्षेत्र मिट्टी की नमी का सटीक विवरण।',
      pa: 'ਖੇਤ ਮੁਤਾਬਕ ਬੀਜਾਈ ਦੇ ਫ਼ੈਸਲੇ, 4-ਥੰਮ੍ਹ ਜੋਖਮ ਵੇਰਵੇ ਅਤੇ ਜ਼ਮੀਨੀ ਨਮੀ ਦਾ ਪੂਰਾ ਹਾਲ।'
    }
  },
  map: {
    title: { en: 'Village-scale <em>risk map.</em>', hi: 'ग्राम-स्तरीय <em>सूखा जोखिम नक्शा।</em>', pa: 'ਪਿੰਡ ਪੱਧਰੀ <em>ਸੋਕਾ ਜੋਖਮ ਨਕਸ਼ਾ।</em>' },
    intro: {
      en: 'Interactive OpenStreetMap displaying Panchayat-scale dry-spell probability across Sangrur district.',
      hi: 'संगरूर जिले की पंचायतों में सूखा-विराम जोखिम दर्शाने वाला इंटरएक्टिव मानचित्र।',
      pa: 'ਸੰਗਰੂਰ ਜ਼ਿਲ੍ਹੇ ਦੀਆਂ ਪੰਚਾਇਤਾਂ ਵਿੱਚ ਸੋਕੇ ਦੇ ਖ਼ਤਰੇ ਨੂੰ ਦਰਸਾਉਂਦਾ ਇੰਟਰਐਕਟਿਵ ਨਕਸ਼ਾ।'
    }
  },
  timeline: {
    title: { en: 'Forecast <em>outlook.</em>', hi: '7–30 दिन <em>पूर्वानुमान।</em>', pa: '7–30 ਦਿਨਾਂ ਦਾ <em>ਮੌਸਮ ਅਨੁਮਾਨ।</em>' },
    intro: {
      en: 'Probabilistic rainfall vs moisture depletion trend and 30-day day-by-day meteorological matrix.',
      hi: 'संभाव्य वर्षा रुझान और 30 दिनों का दैनिक मौसम डेटा मैट्रिक्स।',
      pa: 'ਸੰਭਾਵੀ ਮੀਂਹ ਰੁਝਾਨ ਅਤੇ 30 ਦਿਨਾਂ ਦਾ ਰੋਜ਼ਾਨਾ ਡਾਟਾ ਚਾਰਟ।'
    }
  }
};

// Show Toast Notification Helper
function showToast(message) {
  const existing = document.querySelector('.toast-notification');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.innerHTML = `<span>✓</span> <span>${message}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Update Active Navigation Tab and Page Header
function updateRouteUI() {
  document.querySelectorAll('.nav-tabs a').forEach((link) => {
    link.classList.toggle('active', link.getAttribute('href') === `/${activeRoute}`);
  });

  document.querySelectorAll('.portal-page').forEach((section) => {
    section.style.display = section.id === activeRoute ? 'block' : 'none';
  });

  const lang = localStorage.getItem('saarthi_lang') || 'en';
  const meta = PAGE_METADATA[activeRoute] || PAGE_METADATA.farmer;
  document.querySelector('#page-title').innerHTML = meta.title[lang] || meta.title.en;
  document.querySelector('#page-intro').textContent = meta.intro[lang] || meta.intro.en;
}

// -------------------------------------------------------------
// 1. FARMER ADVISORY PORTAL LOGIC
// -------------------------------------------------------------

async function populatePanchayats(block) {
  const select = document.querySelector('#form-panchayat');
  if (!select) return;
  
  try {
    const res = await fetch(`/api/panchayats?block=${encodeURIComponent(block)}`);
    const data = await res.json();
    select.innerHTML = (data.panchayats || ['Suler Gherat', 'Kularan', 'Chhajli', 'Dirba'])
      .map((p) => `<option value="${p}">${p}</option>`)
      .join('');
  } catch (err) {
    console.error('Failed to load Panchayats', err);
  }
}

async function computeFarmerAdvisory() {
  const block = document.querySelector('#form-block').value;
  const panchayat = document.querySelector('#form-panchayat').value;
  const crop = document.querySelector('#form-crop').value;
  const soil = document.querySelector('#form-soil').value;
  const sowingDate = document.querySelector('#form-date').value;
  const irrigation = document.querySelector('#form-irrigation').value;

  const payload = {
    block,
    panchayat,
    crop,
    soil,
    sowing_date: sowingDate,
    irrigation,
  };

  try {
    const res = await fetch('/api/farmer-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    currentFarmerData = data;
    renderFarmerAdvisoryView(data);
  } catch (err) {
    console.error('Advisory computation error:', err);
  }
}

function renderFarmerAdvisoryView(data) {
  if (!data || !data.outputs) return;
  const out = data.outputs;
  const lang = localStorage.getItem('saarthi_lang') || 'en';

  // Decision Hero Card
  const tagEl = document.querySelector('#decision-tag');
  tagEl.textContent = out.decision_tag;
  tagEl.className = `decision-tag ${out.decision_tone}`;

  document.querySelector('#decision-window').textContent = out.recommended_window;
  
  // Headline based on tone
  const cropName = data.inputs.crop;
  let headline = `Optimal sowing window for ${cropName}.`;
  if (out.decision_tone === 'wait') {
    headline = `Delay sowing: severe dry break risk for ${cropName}.`;
  } else if (out.decision_tone === 'review') {
    headline = `Exercise caution: verify soil moisture before sowing ${cropName}.`;
  }
  document.querySelector('#decision-headline').textContent = headline;
  document.querySelector('#decision-explanation').textContent = out.explanation[lang] || out.explanation.en;

  document.querySelector('#decision-prob').textContent = `${out.dry_spell_probability}% (${out.risk_level} Risk)`;
  document.querySelector('#decision-confidence').textContent = `${out.model_confidence}%`;
  document.querySelector('#decision-target-panchayat').textContent = `${data.inputs.panchayat}, ${data.inputs.block}`;

  // 4 Risk Pillars
  const p = out.four_pillars;
  document.querySelector('#pillar-weather-val').textContent = p.weather_risk;
  document.querySelector('#pillar-weather-val').style.color = p.weather_risk === 'High' ? 'var(--coral)' : p.weather_risk === 'Moderate' ? 'var(--gold)' : 'var(--moss)';

  document.querySelector('#pillar-soil-val').textContent = p.soil_moisture_risk;
  document.querySelector('#pillar-soil-val').style.color = p.soil_moisture_risk === 'High' ? 'var(--coral)' : p.soil_moisture_risk === 'Moderate' ? 'var(--gold)' : 'var(--moss)';

  document.querySelector('#pillar-crop-val').textContent = p.crop_vulnerability_risk;
  document.querySelector('#pillar-crop-val').style.color = p.crop_vulnerability_risk === 'High' ? 'var(--coral)' : p.crop_vulnerability_risk === 'Moderate' ? 'var(--gold)' : 'var(--moss)';

  document.querySelector('#pillar-dry-val').textContent = `${out.dry_spell_probability}%`;
  document.querySelector('#pillar-dry-val').style.color = out.dry_spell_probability >= 60 ? 'var(--coral)' : out.dry_spell_probability >= 30 ? 'var(--gold)' : 'var(--moss)';

  // Root-Zone Moisture Gauge Dial
  const moisture = out.root_zone_soil_moisture_pct;
  document.querySelector('#gauge-percent').textContent = `${moisture.toFixed(0)}%`;
  const gaugeDial = document.querySelector('#root-gauge-dial');
  if (gaugeDial) {
    gaugeDial.style.background = `conic-gradient(#abc87d 0% ${moisture}%, #e6ece0 ${moisture}% 100%)`;
  }
  let statusText = 'Adequate Moisture';
  if (moisture < 25) statusText = 'Critical Deficit (Dry Break)';
  else if (moisture < 35) statusText = 'Moderate Moisture';
  else if (moisture > 48) statusText = 'High / Saturated';
  document.querySelector('#gauge-status').textContent = statusText;

  // WhatsApp Share button binding
  const shareBtn = document.querySelector('#share-whatsapp-btn');
  if (shareBtn) {
    shareBtn.onclick = async () => {
      const shareText = out.whatsapp_share[lang] || out.whatsapp_share.en;
      try {
        await navigator.clipboard.writeText(shareText);
        showToast(getTranslation('btn_copied', lang));
      } catch (e) {
        showToast('Advisory text copied!');
      }
    };
  }
}

// -------------------------------------------------------------
// 2. VILLAGE SCALE RISK MAP (LEAFLET GIS)
// -------------------------------------------------------------

async function initRiskMap() {
  const mapContainer = document.querySelector('#leaflet-map-canvas');
  if (!mapContainer) return;

  if (!leafletMapInstance) {
    // Center at Sangrur District, Punjab
    leafletMapInstance = L.map('leaflet-map-canvas', {
      center: [30.2458, 75.8421],
      zoom: 10,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors | SAARTHI Hyperlocal Model',
      maxZoom: 18,
    }).addTo(leafletMapInstance);

    mapMarkersLayer = L.layerGroup().addTo(leafletMapInstance);

    // Filter bindings
    document.querySelector('#map-block-filter')?.addEventListener('change', renderMapMarkers);
    document.querySelector('#map-risk-filter')?.addEventListener('change', renderMapMarkers);
  }

  try {
    const res = await fetch('/api/map-data');
    const data = await res.json();
    allMapVillages = data.villages || [];
    renderMapMarkers();
    setTimeout(() => leafletMapInstance.invalidateSize(), 200);
  } catch (err) {
    console.error('Failed to load map data:', err);
  }
}

function renderMapMarkers() {
  if (!leafletMapInstance || !mapMarkersLayer) return;
  mapMarkersLayer.clearLayers();

  const blockFilter = document.querySelector('#map-block-filter')?.value || 'all';
  const riskFilter = document.querySelector('#map-risk-filter')?.value || 'all';

  const filtered = allMapVillages.filter((v) => {
    const matchBlock = blockFilter === 'all' || v.block === blockFilter;
    const matchRisk = riskFilter === 'all' || v.risk_level === riskFilter;
    return matchBlock && matchRisk;
  });

  filtered.forEach((v) => {
    const color = v.risk_score >= 60 ? '#f27256' : v.risk_score >= 30 ? '#f0c35e' : '#9ed683';
    const tagClass = v.risk_score >= 60 ? 'tag-high' : v.risk_score >= 30 ? 'tag-mod' : 'tag-low';

    const circle = L.circleMarker([v.lat, v.lng], {
      radius: 11,
      fillColor: color,
      color: '#ffffff',
      weight: 2.5,
      opacity: 1,
      fillOpacity: 0.88,
    });

    const popupHtml = `
      <div style="font-family: Manrope, sans-serif; font-size: 12px; min-width: 190px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <strong style="font-size: 14px; color: #1d241f;">${v.name}</strong>
          <span style="font: 700 9px 'DM Mono', monospace; padding: 2px 6px; border-radius: 8px;" class="${tagClass}">${v.risk_level} RISK</span>
        </div>
        <div style="color: #617163; font-size: 11px; margin-bottom: 4px;">Block: <b>${v.block}</b> · Soil: <b>${v.soil_type}</b></div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin: 8px 0; background: #f6f8f2; padding: 6px; border-radius: 6px;">
          <div><small style="color: #728273;">Dry Spell</small><br><strong>${v.risk_score}%</strong></div>
          <div><small style="color: #728273;">Soil Moisture</small><br><strong>${v.soil_moisture}</strong></div>
        </div>
        <p style="margin: 6px 0 0; font-size: 11px; line-height: 1.4; color: #425244;">${v.advisory}</p>
      </div>
    `;

    circle.bindPopup(popupHtml);
    mapMarkersLayer.addLayer(circle);
  });
}

// -------------------------------------------------------------
// 3. 7–30 DAY FORECAST OUTLOOK & MATRIX
// -------------------------------------------------------------

async function loadTimelineForecast(block = 'Sunam', horizon = activeTimelineHorizon) {
  try {
    const res = await fetch(`/api/outlook/${encodeURIComponent(block)}?days=${horizon}`);
    const data = await res.json();
    const titleEl = document.querySelector('#timeline-block-title');
    if (titleEl) titleEl.textContent = `${data.block} Block`;
    renderForecastChart(data);
    renderForecastMatrix(data.forecast_matrix || []);
  } catch (err) {
    console.error('Failed to load forecast outlook:', err);
  }
}

function renderForecastChart(data) {
  const container = document.querySelector('#recharts-forecast-canvas');
  if (!container) return;

  const matrix = data.forecast_matrix || [];
  const n = matrix.length;
  if (n === 0) return;

  // Chart Dimensions
  const svgWidth = 920;
  const svgHeight = 310;
  const padLeft = 60;
  const padRight = 60;
  const padTop = 25;
  const padBottom = 45;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  // Scale calculations
  const rawMaxRain = Math.max(...matrix.map((m) => m.rainfall_mm), 1);
  const maxRain = Math.max(12, Math.ceil(rawMaxRain / 4) * 4); // Nice ceiling (e.g. 12, 16, 20 mm)
  const maxMoisture = 80; // Moisture scale 0 to 80%

  // Compute bar spacing & widths
  const stepX = plotWidth / n;
  let barWidth = Math.min(42, Math.max(14, stepX * 0.58));
  if (n > 20) barWidth = Math.max(10, stepX * 0.65);

  // Left Y-axis (Rainfall) grid lines & labels
  const rainTicks = [0, maxRain * 0.25, maxRain * 0.5, maxRain * 0.75, maxRain];
  const gridLinesSvg = rainTicks
    .map((val) => {
      const y = padTop + plotHeight - (val / maxRain) * plotHeight;
      const moistureVal = (val / maxRain) * maxMoisture;
      return `
        <line x1="${padLeft}" y1="${y}" x2="${svgWidth - padRight}" y2="${y}" stroke="#e8ece4" stroke-dasharray="3,3" stroke-width="1" />
        <text x="${padLeft - 10}" y="${y + 3.5}" text-anchor="end" fill="#587482" font-family="'DM Mono', monospace" font-size="10">${val.toFixed(0)} mm</text>
        <text x="${svgWidth - padRight + 10}" y="${y + 3.5}" text-anchor="start" fill="#446a50" font-family="'DM Mono', monospace" font-size="10">${moistureVal.toFixed(0)}%</text>
      `;
    })
    .join('');

  // Critical Dry Break Threshold line (Moisture = 25%)
  const thresholdMoisture = 25;
  const thresholdY = padTop + plotHeight - (thresholdMoisture / maxMoisture) * plotHeight;
  const dangerZoneHeight = padTop + plotHeight - thresholdY;
  const dangerZoneSvg = `
    <rect x="${padLeft}" y="${thresholdY}" width="${plotWidth}" height="${dangerZoneHeight}" fill="rgba(242, 114, 86, 0.05)" />
    <line x1="${padLeft}" y1="${thresholdY}" x2="${svgWidth - padRight}" y2="${thresholdY}" stroke="#e0725c" stroke-dasharray="5,4" stroke-width="1.5" />
    <text x="${svgWidth - padRight - 8}" y="${thresholdY - 5}" text-anchor="end" fill="#c44026" font-family="'DM Mono', monospace" font-weight="700" font-size="9.5">Critical Deficit Threshold (25%)</text>
  `;

  // Rainfall Bars SVG
  const barsSvg = matrix
    .map((m, i) => {
      const centerX = padLeft + i * stepX + stepX / 2;
      const barX = centerX - barWidth / 2;
      const barH = Math.max(3, (m.rainfall_mm / maxRain) * plotHeight);
      const barY = padTop + plotHeight - barH;
      const isPeak = m.rainfall_mm === rawMaxRain && rawMaxRain > 3;
      const fill = isPeak ? 'url(#rainBarPeakGrad)' : 'url(#rainBarGrad)';

      // Label on bar if height allows
      const textLabel = (n <= 15 && barH > 18) || (isPeak && barH > 14)
        ? `<text x="${centerX}" y="${barY - 4}" text-anchor="middle" fill="#2d6b8b" font-family="'DM Mono', monospace" font-weight="700" font-size="9.5">${m.rainfall_mm}</text>`
        : '';

      return `
        <g class="chart-bar" style="cursor: pointer;">
          <rect x="${barX}" y="${barY}" width="${barWidth}" height="${barH}" rx="4" fill="${fill}" />
          ${textLabel}
          <title>Day ${m.day} (${m.date}): Rain ${m.rainfall_mm}mm | Root-Zone Moisture ${m.soil_moisture_pct}% | Risk: ${m.risk_status}</title>
        </g>
      `;
    })
    .join('');

  // Soil Moisture Depletion Curve Points
  const curvePoints = matrix.map((m, i) => {
    const x = padLeft + i * stepX + stepX / 2;
    const y = padTop + plotHeight - (Math.min(maxMoisture, m.soil_moisture_pct) / maxMoisture) * plotHeight;
    return { x, y, moisture: m.soil_moisture_pct, day: m.day, date: m.date };
  });

  const polylineStr = curvePoints.map((pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ');
  const areaPathStr = `M ${curvePoints[0].x.toFixed(1)},${padTop + plotHeight} L ` +
    curvePoints.map((pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' L ') +
    ` L ${curvePoints[curvePoints.length - 1].x.toFixed(1)},${padTop + plotHeight} Z`;

  const dataNodesSvg = curvePoints
    .map((pt, i) => {
      // For 30 days show every 2nd or key nodes, for 7/15 days show all
      if (n > 15 && i % 3 !== 0 && i !== n - 1) return '';
      return `
        <circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="3.5" fill="#ffffff" stroke="#2a543b" stroke-width="2.5">
          <title>Day ${pt.day} (${pt.date}): Soil Moisture ${pt.moisture}%</title>
        </circle>
      `;
    })
    .join('');

  // X-Axis Day Labels
  const xAxisLabelsSvg = matrix
    .map((m, i) => {
      // Determine label skipping for clean legibility
      const showLabel = n <= 7 || (n <= 15 ? i % 2 === 0 : i % 5 === 0 || i === n - 1);
      if (!showLabel) return '';
      const x = padLeft + i * stepX + stepX / 2;
      return `
        <line x1="${x}" y1="${padTop + plotHeight}" x2="${x}" y2="${padTop + plotHeight + 5}" stroke="#b8c4b4" stroke-width="1" />
        <text x="${x}" y="${padTop + plotHeight + 18}" text-anchor="middle" fill="#3c4e3f" font-family="'DM Mono', monospace" font-weight="700" font-size="10">D${m.day}</text>
        <text x="${x}" y="${padTop + plotHeight + 30}" text-anchor="middle" fill="#788a7b" font-family="'DM Mono', monospace" font-size="9">${m.date}</text>
      `;
    })
    .join('');

  container.innerHTML = `
    <div class="chart-legend-row">
      <div style="display: flex; gap: 16px; align-items: center;">
        <span class="chart-legend-badge rain">■ Predicted Daily Rain (mm)</span>
        <span class="chart-legend-badge moisture">● Root-Zone Soil Moisture (%)</span>
      </div>
      <span class="chart-legend-badge danger">--- Severe Dry Break Threat Zone (&lt;25%)</span>
    </div>

    <div class="chart-svg-wrap">
      <svg viewBox="0 0 ${svgWidth} ${svgHeight}" style="width: 100%; height: auto; display: block; overflow: visible;">
        <defs>
          <linearGradient id="rainBarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#427c9c" />
            <stop offset="100%" stop-color="#82b7c7" />
          </linearGradient>
          <linearGradient id="rainBarPeakGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#2a5d77" />
            <stop offset="100%" stop-color="#5599b8" />
          </linearGradient>
          <linearGradient id="moistureAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#335b42" stop-opacity="0.18" />
            <stop offset="100%" stop-color="#335b42" stop-opacity="0.01" />
          </linearGradient>
        </defs>

        <!-- Grid Lines & Y-Axis Labels -->
        ${gridLinesSvg}

        <!-- Danger Zone (<25% moisture) -->
        ${dangerZoneSvg}

        <!-- Rainfall Bars -->
        ${barsSvg}

        <!-- Moisture Gradient Fill Area -->
        <path d="${areaPathStr}" fill="url(#moistureAreaGrad)" />

        <!-- Moisture Curve -->
        <polyline fill="none" stroke="#244235" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round" points="${polylineStr}" />

        <!-- Moisture Node Points -->
        ${dataNodesSvg}

        <!-- Baseline X-Axis -->
        <line x1="${padLeft}" y1="${padTop + plotHeight}" x2="${svgWidth - padRight}" y2="${padTop + plotHeight}" stroke="#adbdb0" stroke-width="1.5" />

        <!-- X-Axis Labels -->
        ${xAxisLabelsSvg}
      </svg>
    </div>
  `;
}

function renderForecastMatrix(matrix) {
  const tbody = document.querySelector('#forecast-matrix-tbody');
  if (!tbody) return;

  tbody.innerHTML = matrix
    .map((row) => {
      const pillClass = row.risk_status.toLowerCase();
      return `
        <tr>
          <td><b>Day ${row.day}</b></td>
          <td>${row.date}</td>
          <td><strong style="color: #427c9c;">${row.rainfall_mm} mm</strong></td>
          <td>${row.temperature_c}°C</td>
          <td><strong style="color: #335b42;">${row.soil_moisture_pct}%</strong></td>
          <td><span class="risk-status-pill ${pillClass}">${row.risk_status}</span></td>
        </tr>
      `;
    })
    .join('');
}

// -------------------------------------------------------------
// INITIALIZATION
// -------------------------------------------------------------

document.addEventListener('DOMContentLoaded', async () => {
  updateRouteUI();

  // Route specific initializations
  if (activeRoute === 'farmer') {
    const blockSelect = document.querySelector('#form-block');
    if (blockSelect) {
      await populatePanchayats(blockSelect.value);
      blockSelect.addEventListener('change', async (e) => {
        await populatePanchayats(e.target.value);
        computeFarmerAdvisory();
      });
      document.querySelector('#form-refresh-btn')?.addEventListener('click', computeFarmerAdvisory);
    }
    computeFarmerAdvisory();
  } else if (activeRoute === 'map') {
    initRiskMap();
  } else if (activeRoute === 'timeline') {
    loadTimelineForecast('Sunam', 30);
    document.querySelectorAll('.horizon-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.horizon-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        activeTimelineHorizon = Number(btn.getAttribute('data-days'));
        loadTimelineForecast('Sunam', activeTimelineHorizon);
      });
    });
  }

  // Reactive language change listener
  window.addEventListener('languageChanged', () => {
    updateRouteUI();
    if (activeRoute === 'farmer' && currentFarmerData) {
      renderFarmerAdvisoryView(currentFarmerData);
    }
  });
});
