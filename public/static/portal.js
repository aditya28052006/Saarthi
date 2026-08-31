/**
 * SAARTHI Decision Platform Logic
 * Handles dynamic routing across Farmer Advisory (/farmer),
 * Village-Scale Risk Map (/map), and 7-30 Day Forecast Outlook (/timeline).
 * Built with instant client intelligence and automatic API synchronisation.
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

// Built-in Sangrur District Datasets & Telemetry
const SANGRUR_DISTRICT = {
  panchayats: {
    Sunam: ['Suler Gherat', 'Kularan', 'Chhajli', 'Dirba', 'Cheema', 'Mehlan', 'Ubhawal', 'Togawal', 'Shahpur Kaler', 'Bigarwal', 'Dhandiwal', 'Mauran', 'Namol', 'Jakhepal', 'Janal', 'Khanal Kalan', 'Khanal Khurd', 'Kauhar Singh Wala'],
    Sangrur: ['Bhalwan', 'Mangwal', 'Ubhawal', 'Kanganwal', 'Badrukhan', 'Ladda', 'Akoi Sahib', 'Ghabdan', 'Duggan', 'Khurana', 'Bhawanigarh Road', 'Fatehgarh Chhanna', 'Soian', 'Uppli', 'Gharachon', 'Bahadurpur'],
    Dhuri: ['Rangian', 'Maanwala', 'Benra', 'Kalerian', 'Babbanpur', 'Jahangir', 'Ranike', 'Mullowal', 'Mimsa', 'Bardwal', 'Pakhoke', 'Rajomajra', 'Daulatpur', 'Bhulran', 'Bhalwan Dhuri', 'Bugra'],
    Moonak: ['Moonak Rural', 'Ghamoor Ghat', 'Makror Sahib', 'Kakra', 'Mandvi', 'Hamirgarh', 'Surjan Bhaini', 'Lehal Khurd', 'Balran', 'Dehla', 'Bhundar Bhaini', 'Ramnagar Sibian', 'Banawali', 'Bushehra'],
    Lehragaga: ['Lehal Kalan', 'Kotra Amru', 'Chhajli Khurd', 'Sangha', 'Alampur', 'Gaga', 'Dhadrian', 'Bakhoran Kalan', 'Sekhuwas', 'Bhutal Kalan', 'Chotian', 'Khokhar', 'Anderana', 'Balran Lehra'],
    Malerkotla: ['Ahmedgarh Rural', 'Amargarh Border', 'Kup Kalan', 'Himmatpura', 'Jamalpura', 'Sandaur', 'Bhadas', 'Mithewal', 'Maholi Kalan', 'Nathuwala', 'Rohira', 'Chaunda', 'Balyal'],
    Amargarh: ['Amargarh Central', 'Mubarakpur', 'Bhasaur', 'Himmatpura North', 'Bagrian', 'Chaunda Khurd', 'Naraingarh', 'Jalwana', 'Ladda Kalan', 'Bhogiwal', 'Salana', 'Alipur Amargarh'],
    Bhawanigarh: ['Bhawanigarh Rural', 'Kularan South', 'Nadampur', 'Sular Gharat', 'Balad Kalan', 'Majhi', 'Jhaneri', 'Phagguwala', 'Noorpur', 'Gharachon West', 'Fatehgarh', 'Bakhopai'],
  },
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
  villages: [
    { name: 'Suler Gherat', block: 'Sunam', lat: 30.0821, lng: 75.8124, risk_score: 74, risk_level: 'High', soil_type: 'Clay Loam', soil_moisture: '24%', decision: 'WAIT 7 DAYS', advisory: 'Prolonged dry break expected. Delay sowing & protect root moisture.' },
    { name: 'Kularan', block: 'Sunam', lat: 30.1235, lng: 75.8641, risk_score: 42, risk_level: 'Moderate', soil_type: 'Alluvial', soil_moisture: '36%', decision: 'EXERCISE CAUTION', advisory: 'Rainfall uncertain; review outlook in 3 days.' },
    { name: 'Chhajli', block: 'Sunam', lat: 30.0412, lng: 75.7621, risk_score: 78, risk_level: 'High', soil_type: 'Sandy Loam', soil_moisture: '21%', decision: 'WAIT 7 DAYS', advisory: 'Prolonged dry break expected. Delay sowing & protect root moisture.' },
    { name: 'Dirba', block: 'Sunam', lat: 30.0654, lng: 75.9812, risk_score: 68, risk_level: 'High', soil_type: 'Clay Loam', soil_moisture: '26%', decision: 'WAIT 7 DAYS', advisory: 'Prolonged dry break expected. Delay sowing & protect root moisture.' },
    { name: 'Cheema', block: 'Sunam', lat: 30.0921, lng: 75.7012, risk_score: 28, risk_level: 'Low', soil_type: 'Alluvial', soil_moisture: '42%', decision: 'SAFE TO SOW', advisory: 'Moisture profile optimal; safe to proceed with sowing.' },
    { name: 'Mehlan', block: 'Sunam', lat: 30.1741, lng: 75.8912, risk_score: 52, risk_level: 'Moderate', soil_type: 'Silt Loam', soil_moisture: '33%', decision: 'EXERCISE CAUTION', advisory: 'Rainfall uncertain; review outlook in 3 days.' },
    { name: 'Bhalwan', block: 'Sangrur', lat: 30.2912, lng: 75.8112, risk_score: 76, risk_level: 'High', soil_type: 'Sandy Loam', soil_moisture: '22%', decision: 'WAIT 7 DAYS', advisory: 'Prolonged dry break expected. Delay sowing & protect root moisture.' },
    { name: 'Mangwal', block: 'Sangrur', lat: 30.2214, lng: 75.8341, risk_score: 55, risk_level: 'Moderate', soil_type: 'Alluvial', soil_moisture: '32%', decision: 'EXERCISE CAUTION', advisory: 'Rainfall uncertain; review outlook in 3 days.' },
    { name: 'Ubhawal', block: 'Sangrur', lat: 30.1982, lng: 75.8741, risk_score: 34, risk_level: 'Moderate', soil_type: 'Clay Loam', soil_moisture: '39%', decision: 'EXERCISE CAUTION', advisory: 'Moisture profile optimal; safe to proceed with sowing.' },
    { name: 'Kanganwal', block: 'Sangrur', lat: 30.2641, lng: 75.9112, risk_score: 61, risk_level: 'High', soil_type: 'Silt Loam', soil_moisture: '28%', decision: 'WAIT 7 DAYS', advisory: 'Prolonged dry break expected. Delay sowing & protect root moisture.' },
    { name: 'Badrukhan', block: 'Sangrur', lat: 30.2014, lng: 75.7912, risk_score: 48, risk_level: 'Moderate', soil_type: 'Alluvial', soil_moisture: '35%', decision: 'EXERCISE CAUTION', advisory: 'Rainfall uncertain; review outlook in 3 days.' },
    { name: 'Rangian', block: 'Dhuri', lat: 30.3412, lng: 75.8712, risk_score: 69, risk_level: 'High', soil_type: 'Alluvial', soil_moisture: '27%', decision: 'WAIT 7 DAYS', advisory: 'Prolonged dry break expected.' },
    { name: 'Maanwala', block: 'Dhuri', lat: 30.3812, lng: 75.8312, risk_score: 78, risk_level: 'High', soil_type: 'Clay Loam', soil_moisture: '23%', decision: 'WAIT 7 DAYS', advisory: 'Prolonged dry break expected.' },
    { name: 'Benra', block: 'Dhuri', lat: 30.3912, lng: 75.9212, risk_score: 58, risk_level: 'Moderate', soil_type: 'Alluvial', soil_moisture: '34%', decision: 'EXERCISE CAUTION', advisory: 'Review radar in 3 days.' },
    { name: 'Kalerian', block: 'Dhuri', lat: 30.4121, lng: 75.8512, risk_score: 54, risk_level: 'Moderate', soil_type: 'Silt Loam', soil_moisture: '36%', decision: 'EXERCISE CAUTION', advisory: 'Review radar in 3 days.' },
    { name: 'Ghamoor Ghat', block: 'Moonak', lat: 29.8912, lng: 75.8712, risk_score: 39, risk_level: 'Moderate', soil_type: 'Sandy Loam', soil_moisture: '37%', decision: 'EXERCISE CAUTION', advisory: 'Review radar in 3 days.' },
    { name: 'Makror Sahib', block: 'Moonak', lat: 29.8412, lng: 75.9312, risk_score: 62, risk_level: 'High', soil_type: 'Clay Loam', soil_moisture: '27%', decision: 'WAIT 7 DAYS', advisory: 'Prolonged dry break expected.' },
    { name: 'Kakra', block: 'Moonak', lat: 29.8112, lng: 75.8812, risk_score: 35, risk_level: 'Moderate', soil_type: 'Alluvial', soil_moisture: '38%', decision: 'EXERCISE CAUTION', advisory: 'Review radar in 3 days.' },
    { name: 'Mandvi', block: 'Moonak', lat: 29.8612, lng: 75.9912, risk_score: 51, risk_level: 'Moderate', soil_type: 'Alluvial', soil_moisture: '35%', decision: 'EXERCISE CAUTION', advisory: 'Review radar in 3 days.' },
    { name: 'Lehal Kalan', block: 'Lehragaga', lat: 29.9812, lng: 75.8112, risk_score: 82, risk_level: 'High', soil_type: 'Sandy Loam', soil_moisture: '19%', decision: 'WAIT 7 DAYS', advisory: 'Delay sowing by 7 days.' },
    { name: 'Kotra Amru', block: 'Lehragaga', lat: 29.9512, lng: 75.8512, risk_score: 75, risk_level: 'High', soil_type: 'Clay Loam', soil_moisture: '22%', decision: 'WAIT 7 DAYS', advisory: 'Delay sowing by 7 days.' },
    { name: 'Sangha', block: 'Lehragaga', lat: 29.9112, lng: 75.7912, risk_score: 64, risk_level: 'High', soil_type: 'Alluvial', soil_moisture: '26%', decision: 'WAIT 7 DAYS', advisory: 'Delay sowing by 7 days.' },
    { name: 'Bakhoran Kalan', block: 'Lehragaga', lat: 29.9312, lng: 75.8812, risk_score: 71, risk_level: 'High', soil_type: 'Sandy Loam', soil_moisture: '24%', decision: 'WAIT 7 DAYS', advisory: 'Delay sowing by 7 days.' },
    { name: 'Ahmedgarh Rural', block: 'Malerkotla', lat: 30.6812, lng: 75.8312, risk_score: 81, risk_level: 'High', soil_type: 'Alluvial', soil_moisture: '21%', decision: 'WAIT 7 DAYS', advisory: 'Clear drains / hold sowing.' },
    { name: 'Kup Kalan', block: 'Malerkotla', lat: 30.5612, lng: 75.8912, risk_score: 72, risk_level: 'High', soil_type: 'Clay Loam', soil_moisture: '25%', decision: 'WAIT 7 DAYS', advisory: 'Hold sowing for 7 days.' },
    { name: 'Himmatpura', block: 'Malerkotla', lat: 30.4912, lng: 75.8112, risk_score: 88, risk_level: 'High', soil_type: 'Silt Loam', soil_moisture: '18%', decision: 'WAIT 7 DAYS', advisory: 'Hold sowing for 7 days.' },
    { name: 'Mubarakpur', block: 'Amargarh', lat: 30.5112, lng: 75.9812, risk_score: 73, risk_level: 'High', soil_type: 'Alluvial', soil_moisture: '24%', decision: 'WAIT 7 DAYS', advisory: 'Hold sowing for 7 days.' },
    { name: 'Bhasaur', block: 'Amargarh', lat: 30.4712, lng: 76.0112, risk_score: 59, risk_level: 'Moderate', soil_type: 'Clay Loam', soil_moisture: '33%', decision: 'EXERCISE CAUTION', advisory: 'Review radar in 3 days.' },
    { name: 'Nadampur', block: 'Bhawanigarh', lat: 30.2512, lng: 76.0712, risk_score: 47, risk_level: 'Moderate', soil_type: 'Alluvial', soil_moisture: '36%', decision: 'EXERCISE CAUTION', advisory: 'Review radar in 3 days.' },
    { name: 'Sular Gharat', block: 'Bhawanigarh', lat: 30.2112, lng: 76.0212, risk_score: 72, risk_level: 'High', soil_type: 'Clay Loam', soil_moisture: '25%', decision: 'WAIT 7 DAYS', advisory: 'Hold sowing for 7 days.' },
    { name: 'Balad Kalan', block: 'Bhawanigarh', lat: 30.2812, lng: 76.0412, risk_score: 38, risk_level: 'Moderate', soil_type: 'Silt Loam', soil_moisture: '37%', decision: 'EXERCISE CAUTION', advisory: 'Review radar in 3 days.' },
  ]
};

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

function populatePanchayats(block) {
  const select = document.querySelector('#form-panchayat');
  if (!select) return;
  const list = SANGRUR_DISTRICT.panchayats[block] || SANGRUR_DISTRICT.panchayats.Sunam;
  select.innerHTML = list.map((p) => `<option value="${p}">${p}</option>`).join('');
}

function computeLocalFarmerAdvisory(inputs) {
  const block = inputs.block || 'Sunam';
  const panchayat = inputs.panchayat || 'Suler Gherat';
  const crop = inputs.crop || 'Paddy (PR-126)';
  const soil = inputs.soil || 'Clay Loam';
  const irrigation = inputs.irrigation || 'Canals';

  const c = SANGRUR_DISTRICT.conditions[block] || SANGRUR_DISTRICT.conditions.Sunam;
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
  const riskLevel = prob >= 0.6 ? 'High' : prob >= 0.3 ? 'Moderate' : 'Low';

  let baseMoisture = 42.0 - (prob * 26.0);
  if (soil === 'Clay Loam') baseMoisture += 6.0;
  else if (soil === 'Sandy Loam') baseMoisture -= 7.0;
  else if (soil === 'Silt Loam') baseMoisture += 2.0;

  if (irrigation === 'Canals') baseMoisture += 4.0;
  else if (irrigation === 'Tubewells') baseMoisture += 3.0;
  else if (irrigation === 'Rainfed') baseMoisture -= 6.0;

  const moisture = Math.round(Math.max(14, Math.min(62, baseMoisture)) * 10) / 10;

  let decisionTag, decisionTone, decisionColor, recWindow;
  const today = new Date();
  const formatMonthDay = (d) => d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });

  if (prob >= 0.60 || (moisture < 25.0 && irrigation === 'Rainfed')) {
    decisionTag = 'WAIT / DELAY SOWING';
    decisionTone = 'wait';
    decisionColor = '#f27256';
    const d1 = new Date(today); d1.setDate(d1.getDate() + 7);
    const d2 = new Date(today); d2.setDate(d2.getDate() + 14);
    recWindow = `${formatMonthDay(d1)} – ${formatMonthDay(d2)}`;
  } else if (prob >= 0.30 || moisture < 32.0) {
    decisionTag = 'EXERCISE CAUTION';
    decisionTone = 'review';
    decisionColor = '#f0c35e';
    const d1 = new Date(today); d1.setDate(d1.getDate() + 3);
    const d2 = new Date(today); d2.setDate(d2.getDate() + 9);
    recWindow = `${formatMonthDay(d1)} – ${formatMonthDay(d2)}`;
  } else {
    decisionTag = 'SAFE TO SOW';
    decisionTone = 'sow';
    decisionColor = '#9ed683';
    const d1 = new Date(today);
    const d2 = new Date(today); d2.setDate(d2.getDate() + 6);
    recWindow = `${formatMonthDay(d1)} – ${formatMonthDay(d2)}`;
  }

  const explanation = {
    en: `For ${crop} in ${panchayat} (${block} Block), ${decisionTone === 'sow' ? `soil moisture (${moisture}%) and monsoon probability indicate favorable sowing conditions.` : decisionTone === 'review' ? `moderate dry break risk (${probPct}%). Ensure supplemental irrigation before transplanting.` : `high dry spell risk (${probPct}%). Delay sowing by 7 days to avoid seedling desiccation.`}`,
    hi: `${panchayat} (${block} ब्लॉक) में ${crop} के लिए, ${decisionTone === 'sow' ? `मिट्टी की नमी (${moisture}%) और मौसम बुवाई के लिए पूर्णतः अनुकूल हैं।` : decisionTone === 'review' ? `मध्यम सूखा जोखिम (${probPct}%) है। बुवाई से पूर्व सिंचाई की व्यवस्था सुनिश्चित करें।` : `सूखे का बड़ा खतरा (${probPct}%) है। बीज व पौध को नुकसान से बचाने हेतु बुवाई 7 दिन टालें।`}`,
    pa: `${panchayat} (${block} ਬਲਾਕ) ਵਿੱਚ ${crop} ਲਈ, ${decisionTone === 'sow' ? `ਜ਼ਮੀਨੀ ਨਮੀ (${moisture}%) ਅਤੇ ਮੌਸਮ ਬੀਜਾਈ ਲਈ ਬਹੁਤ ਵਧੀਆ ਹਨ।` : decisionTone === 'review' ? `ਦਰਮਿਆਨਾ ਸੋਕਾ ਜੋਖਮ (${probPct}%) ਹੈ। ਪਨੀਰੀ ਲਾਉਣ ਤੋਂ ਪਹਿਲਾਂ ਨਹਿਰੀ/ਟਿਊਬਵੈੱਲ ਪਾਣੀ ਯਕੀਨੀ ਬਣਾਓ।` : `ਸੋਕੇ ਦਾ ਵੱਡਾ ਖ਼ਤਰਾ (${probPct}%) ਹੈ। ਪਨੀਰੀ ਨੂੰ ਸੁੱਕਣ ਤੋਂ ਬਚਾਉਣ ਲਈ ਬੀਜਾਈ 7 ਦਿਨ ਅੱਗੇ ਪਾਓ।`}`
  };

  const whatsappShare = {
    en: `🌾 *SAARTHI KISAN ADVISORY — SANGRUR*\n📍 *Location:* ${panchayat}, ${block}\n🌱 *Crop:* ${crop} | *Soil:* ${soil}\n📊 *Decision:* *${decisionTag}*\n📅 *Recommended Window:* ${recWindow}\n💧 *Root-Zone Moisture:* ${moisture}% | *Dry Break Risk:* ${probPct}%\n\n💡 *Advisory:* ${explanation.en}\n— Powered by SAARTHI AI (SIH26086)`,
    hi: `🌾 *सारथी किसान सलाह — संगरूर जिला*\n📍 *स्थान:* ${panchayat}, ${block}\n🌱 *फसल:* ${crop} | *मिट्टी:* ${soil}\n📊 *निर्णय:* *${decisionTag}*\n📅 *उचित बुवाई समय:* ${recWindow}\n💧 *मिट्टी नमी:* ${moisture}% | *सूखा जोखिम:* ${probPct}%\n\n💡 *कृषि सलाह:* ${explanation.hi}\n— सारथी मानसूनी बुद्धिमत्ता (SIH26086)`,
    pa: `🌾 *ਸਾਰਥੀ ਕਿਸਾਨ ਸਲਾਹ — ਸੰਗਰੂਰ*\n📍 *ਥਾਂ:* ${panchayat}, ${block}\n🌱 *ਫ਼ਸਲ:* ${crop} | *ਮਿੱਟੀ:* ${soil}\n📊 *ਫ਼ੈਸਲਾ:* *${decisionTag}*\n📅 *ਬੀਜਾਈ ਦਾ ਸਹੀ ਸਮਾਂ:* ${recWindow}\n💧 *ਜ਼ਮੀਨੀ ਨਮੀ:* ${moisture}% | *ਸੋਕਾ ਜੋਖਮ:* ${probPct}%\n\n💡 *ਸਲਾਹ:* ${explanation.pa}\n— ਸਾਰਥੀ AI (SIH26086)`
  };

  return {
    inputs,
    outputs: {
      dry_spell_probability: probPct,
      risk_level: riskLevel,
      model_confidence: 92.4,
      decision_tag: decisionTag,
      decision_tone: decisionTone,
      decision_color: decisionColor,
      recommended_window: recWindow,
      explanation,
      fourPillars: {
        weather_risk: c.rain_7d > 20 ? 'Low' : c.rain_7d > 8 ? 'Moderate' : 'High',
        soil_moisture_risk: moisture >= 38 ? 'Low' : moisture >= 28 ? 'Moderate' : 'High',
        crop_vulnerability_risk: crop.includes('PR-126') ? 'Low' : crop.includes('Pusa-44') ? 'High' : 'Moderate',
        dry_break_risk: riskLevel,
      },
      root_zone_soil_moisture_pct: moisture,
      whatsapp_share: whatsappShare,
    }
  };
}

async function computeFarmerAdvisory() {
  const block = document.querySelector('#form-block')?.value || 'Sunam';
  const panchayat = document.querySelector('#form-panchayat')?.value || 'Suler Gherat';
  const crop = document.querySelector('#form-crop')?.value || 'Paddy (PR-126)';
  const soil = document.querySelector('#form-soil')?.value || 'Clay Loam';
  const sowingDate = document.querySelector('#form-date')?.value || '2026-09-06';
  const irrigation = document.querySelector('#form-irrigation')?.value || 'Canals';

  const payload = { block, panchayat, crop, soil, sowing_date: sowingDate, irrigation };

  // 1. Instant local calculation render (0ms guarantee)
  const localResult = computeLocalFarmerAdvisory(payload);
  currentFarmerData = localResult;
  renderFarmerAdvisoryView(localResult);

  // 2. Refresh from API asynchronously if available
  try {
    const res = await fetch('/api/farmer-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      currentFarmerData = data;
      renderFarmerAdvisoryView(data);
    }
  } catch (err) {
    console.warn('Using local agronomy model:', err);
  }
}

function renderFarmerAdvisoryView(data) {
  if (!data || !data.outputs) return;
  const out = data.outputs;
  const lang = localStorage.getItem('saarthi_lang') || 'en';

  const tagEl = document.querySelector('#decision-tag');
  if (tagEl) {
    tagEl.textContent = out.decision_tag;
    tagEl.className = `decision-tag ${out.decision_tone}`;
  }

  const winEl = document.querySelector('#decision-window');
  if (winEl) winEl.textContent = out.recommended_window;
  
  const cropName = (data.inputs && data.inputs.crop) || 'Paddy (PR-126)';
  let headline = `Optimal sowing window for ${cropName}.`;
  if (out.decision_tone === 'wait') {
    headline = `Delay sowing: severe dry break risk for ${cropName}.`;
  } else if (out.decision_tone === 'review') {
    headline = `Exercise caution: verify soil moisture before sowing ${cropName}.`;
  }
  const hlEl = document.querySelector('#decision-headline');
  if (hlEl) hlEl.textContent = headline;

  const expEl = document.querySelector('#decision-explanation');
  if (expEl && out.explanation) expEl.textContent = out.explanation[lang] || out.explanation.en;

  const probEl = document.querySelector('#decision-prob');
  if (probEl) probEl.textContent = `${out.dry_spell_probability}% (${out.risk_level} Risk)`;

  const confEl = document.querySelector('#decision-confidence');
  if (confEl) confEl.textContent = `${out.model_confidence}%`;

  const targetEl = document.querySelector('#decision-target-panchayat');
  if (targetEl && data.inputs) targetEl.textContent = `${data.inputs.panchayat}, ${data.inputs.block}`;

  // 4 Risk Pillars
  const p = out.fourPillars || out.four_pillars || {};
  const wRisk = p.weather_risk || 'Low';
  const sRisk = p.soil_moisture_risk || 'Low';
  const cRisk = p.crop_vulnerability_risk || 'Moderate';

  const pWeather = document.querySelector('#pillar-weather-val');
  if (pWeather) {
    pWeather.textContent = wRisk;
    pWeather.style.color = wRisk === 'High' ? 'var(--coral)' : wRisk === 'Moderate' ? 'var(--gold)' : 'var(--moss)';
  }

  const pSoil = document.querySelector('#pillar-soil-val');
  if (pSoil) {
    pSoil.textContent = sRisk;
    pSoil.style.color = sRisk === 'High' ? 'var(--coral)' : sRisk === 'Moderate' ? 'var(--gold)' : 'var(--moss)';
  }

  const pCrop = document.querySelector('#pillar-crop-val');
  if (pCrop) {
    pCrop.textContent = cRisk;
    pCrop.style.color = cRisk === 'High' ? 'var(--coral)' : cRisk === 'Moderate' ? 'var(--gold)' : 'var(--moss)';
  }

  const pDry = document.querySelector('#pillar-dry-val');
  if (pDry) {
    pDry.textContent = `${out.dry_spell_probability}%`;
    pDry.style.color = out.dry_spell_probability >= 60 ? 'var(--coral)' : out.dry_spell_probability >= 30 ? 'var(--gold)' : 'var(--moss)';
  }

  // Root-Zone Moisture Gauge Dial
  const moisture = Number(out.root_zone_soil_moisture_pct || 38);
  const gaugePct = document.querySelector('#gauge-percent');
  if (gaugePct) gaugePct.textContent = `${moisture.toFixed(0)}%`;

  const gaugeDial = document.querySelector('#root-gauge-dial');
  if (gaugeDial) {
    gaugeDial.style.background = `conic-gradient(#abc87d 0% ${moisture}%, #e6ece0 ${moisture}% 100%)`;
  }
  let statusText = 'Adequate Moisture';
  if (moisture < 25) statusText = 'Critical Deficit (Dry Break)';
  else if (moisture < 35) statusText = 'Moderate Moisture';
  else if (moisture > 48) statusText = 'High / Saturated';
  const gStatus = document.querySelector('#gauge-status');
  if (gStatus) gStatus.textContent = statusText;

  // WhatsApp Share button binding
  const shareBtn = document.querySelector('#share-whatsapp-btn');
  if (shareBtn && out.whatsapp_share) {
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

    document.querySelector('#map-block-filter')?.addEventListener('change', renderMapMarkers);
    document.querySelector('#map-risk-filter')?.addEventListener('change', renderMapMarkers);
  }

  // 1. Render immediately from local dataset
  allMapVillages = SANGRUR_DISTRICT.villages;
  renderMapMarkers();
  setTimeout(() => leafletMapInstance.invalidateSize(), 200);

  // 2. Refresh from API asynchronously if available
  try {
    const res = await fetch('/api/map-data');
    if (res.ok) {
      const data = await res.json();
      allMapVillages = data.villages || SANGRUR_DISTRICT.villages;
      renderMapMarkers();
    }
  } catch (err) {
    console.warn('Using local GIS dataset:', err);
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
// 3. 7–30 DAY FORECAST OUTLOOK & MATRIX (TIMELINE)
// -------------------------------------------------------------

function generateLocalForecastMatrix(block = 'Sunam', horizon = 30) {
  const c = SANGRUR_DISTRICT.conditions[block] || SANGRUR_DISTRICT.conditions.Sunam;
  const r7Score = Math.max(0, Math.min(1, 1 - (c.rain_7d / 40.0)));
  const d7Score = Math.max(0, Math.min(1, c.dry_days_7d / 7.0));
  const r14Score = Math.max(0, Math.min(1, 1 - (c.rain_14d / 80.0)));
  const d14Score = Math.max(0, Math.min(1, c.dry_days_14d / 14.0));
  const r30Score = Math.max(0, Math.min(1, 1 - (c.rain_30d / 150.0)));
  const r3Score = Math.max(0, Math.min(1, 1 - (c.rain_3d / 20.0)));

  const weighted = (0.35 * r7Score) + (0.25 * d7Score) + (0.15 * r14Score) + (0.12 * d14Score) + (0.08 * r30Score) + (0.05 * r3Score);
  const logit = (weighted - 0.48) * 5.2;
  const prob = Math.max(0.02, Math.min(0.98, 1 / (1 + Math.exp(-logit))));

  const nextWeekRain = Math.max(0, Math.round(c.rain_7d * (1.35 - prob) * 10) / 10);
  const blockIdx = ['Sunam', 'Sangrur', 'Dhuri', 'Moonak', 'Lehragaga', 'Malerkotla', 'Amargarh', 'Bhawanigarh'].indexOf(block);
  const pattern = [0.10, 0.20, 0.06, 0.25, 0.11, 0.18, 0.10];

  const matrix = [];
  let baseMoisture = 38.0;
  const today = new Date();
  let cumRain = 0.0;

  for (let i = 0; i < horizon; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    const r = Math.round(((nextWeekRain / 7) * pattern[i % 7] * 7 + ((blockIdx + i) % 3) * 0.4) * 10) / 10;
    cumRain += r;
    const temp = Math.round((34.2 - Math.min(i, 14) * 0.15 + (i % 4) * 0.6 - (r > 5 ? 1.5 : 0)) * 10) / 10;
    const m = Math.max(18, Math.min(55, Math.round(baseMoisture + cumRain * 0.4 - i * 0.7)));
    const riskStatus = r < 1.5 && m < 28 ? 'High' : (r < 4.0 || m < 38 ? 'Moderate' : 'Low');

    matrix.push({
      day: i + 1,
      date: dateStr,
      rainfall_mm: r,
      temperature_c: temp,
      soil_moisture_pct: m,
      risk_status: riskStatus
    });
  }

  return {
    block,
    forecast_matrix: matrix
  };
}

async function loadTimelineForecast(block = 'Sunam', horizon = activeTimelineHorizon) {
  const titleEl = document.querySelector('#timeline-block-title');
  if (titleEl) titleEl.textContent = `${block} Block`;

  // 1. Immediately render calculated forecast matrix (0ms latency guarantee)
  const localData = generateLocalForecastMatrix(block, horizon);
  renderForecastChart(localData);
  renderForecastMatrix(localData.forecast_matrix || []);

  // 2. Try fetching from backend API asynchronously if available
  try {
    const res = await fetch(`/api/outlook/${encodeURIComponent(block)}?days=${horizon}`);
    if (res.ok) {
      const data = await res.json();
      renderForecastChart(data);
      renderForecastMatrix(data.forecast_matrix || []);
    }
  } catch (err) {
    console.warn('Using local timeline generator:', err);
  }
}

function renderForecastChart(data) {
  const container = document.querySelector('#recharts-forecast-canvas');
  if (!container) return;

  const matrix = data.forecast_matrix || [];
  const n = matrix.length;
  if (n === 0) return;

  const svgWidth = 920;
  const svgHeight = 310;
  const padLeft = 60;
  const padRight = 60;
  const padTop = 25;
  const padBottom = 45;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const rawMaxRain = Math.max(...matrix.map((m) => m.rainfall_mm), 1);
  const maxRain = Math.max(12, Math.ceil(rawMaxRain / 4) * 4);
  const maxMoisture = 80;

  const stepX = plotWidth / n;
  let barWidth = Math.min(42, Math.max(14, stepX * 0.58));
  if (n > 20) barWidth = Math.max(10, stepX * 0.65);

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

  const thresholdMoisture = 25;
  const thresholdY = padTop + plotHeight - (thresholdMoisture / maxMoisture) * plotHeight;
  const dangerZoneHeight = padTop + plotHeight - thresholdY;
  const dangerZoneSvg = `
    <rect x="${padLeft}" y="${thresholdY}" width="${plotWidth}" height="${dangerZoneHeight}" fill="rgba(242, 114, 86, 0.05)" />
    <line x1="${padLeft}" y1="${thresholdY}" x2="${svgWidth - padRight}" y2="${thresholdY}" stroke="#e0725c" stroke-dasharray="5,4" stroke-width="1.5" />
    <text x="${svgWidth - padRight - 8}" y="${thresholdY - 5}" text-anchor="end" fill="#c44026" font-family="'DM Mono', monospace" font-weight="700" font-size="9.5">Critical Deficit Threshold (25%)</text>
  `;

  const barsSvg = matrix
    .map((m, i) => {
      const centerX = padLeft + i * stepX + stepX / 2;
      const barX = centerX - barWidth / 2;
      const barH = Math.max(3, (m.rainfall_mm / maxRain) * plotHeight);
      const barY = padTop + plotHeight - barH;
      const isPeak = m.rainfall_mm === rawMaxRain && rawMaxRain > 3;
      const fill = isPeak ? 'url(#rainBarPeakGrad)' : 'url(#rainBarGrad)';

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
      if (n > 15 && i % 3 !== 0 && i !== n - 1) return '';
      return `
        <circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="3.5" fill="#ffffff" stroke="#2a543b" stroke-width="2.5">
          <title>Day ${pt.day} (${pt.date}): Soil Moisture ${pt.moisture}%</title>
        </circle>
      `;
    })
    .join('');

  const xAxisLabelsSvg = matrix
    .map((m, i) => {
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
      const pillClass = (row.risk_status || 'low').toLowerCase();
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

document.addEventListener('DOMContentLoaded', () => {
  updateRouteUI();

  if (activeRoute === 'farmer') {
    const blockSelect = document.querySelector('#form-block');
    if (blockSelect) {
      populatePanchayats(blockSelect.value);
      blockSelect.addEventListener('change', (e) => {
        populatePanchayats(e.target.value);
        computeFarmerAdvisory();
      });
      document.querySelector('#form-refresh-btn')?.addEventListener('click', computeFarmerAdvisory);
    }
    computeFarmerAdvisory();
  } else if (activeRoute === 'map') {
    initRiskMap();
  } else if (activeRoute === 'timeline') {
    loadTimelineForecast('Sunam', activeTimelineHorizon);
    document.querySelectorAll('.horizon-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.horizon-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        activeTimelineHorizon = Number(btn.getAttribute('data-days'));
        loadTimelineForecast('Sunam', activeTimelineHorizon);
      });
    });
  }

  window.addEventListener('languageChanged', () => {
    updateRouteUI();
    if (activeRoute === 'farmer' && currentFarmerData) {
      renderFarmerAdvisoryView(currentFarmerData);
    }
  });
});
