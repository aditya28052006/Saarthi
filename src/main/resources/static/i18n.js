/**
 * SAARTHI Trilingual Translation Engine
 * Instant Language Switching for English (EN), Hindi (हिं), and Punjabi (ਪੰ)
 * Tailored specifically for Punjab's farming community.
 */

const I18N_DICTIONARY = {
  en: {
    // Navigation
    nav_home: "Overview",
    nav_farmer: "Farmer Portal",
    nav_map: "Risk Map",
    nav_timeline: "Forecast",
    nav_check_block: "Check your block",
    live_monitoring: "Sangrur Live Monitoring",
    district_name: "Sangrur District, Punjab",

    // Hero / Landing
    hero_eyebrow: "Hyperlocal Climate Intelligence",
    hero_title_1: "Know the",
    hero_title_em: "monsoon",
    hero_title_2: "before it arrives.",
    hero_desc: "Hyperlocal onset & dry-spell break forecasting for Sangrur's 8 blocks and 1,200+ Panchayats. Clearer, confident farming decisions.",
    hero_cta: "Open Farmer Portal",
    hero_secondary_cta: "View Risk Map",
    hero_badge: "Designed for every field, every season",
    hero_card_kicker: "Saarthi · Sangrur, Punjab",
    hero_card_signal: "This week's monsoon signal",
    hero_card_days: "days",
    hero_card_sub: "early warning for dry spells",
    risk_low: "Low Risk",
    risk_mod: "Moderate",
    risk_high: "High Risk",

    // Stats
    stat_1_val: "7–30",
    stat_1_lbl: "Days of Early Outlook",
    stat_2_val: "6",
    stat_2_lbl: "ML Meteorological Signals",
    stat_3_val: "8 / 1,200+",
    stat_3_lbl: "Blocks & Panchayats Covered",
    stat_4_val: "92.4%",
    stat_4_lbl: "Model Calibrated Accuracy",

    // Feature Cards
    portal_features_title: "Explore the SAARTHI Platform",
    portal_features_sub: "Decision support portals built for farmers and agriculture communities in Sangrur.",
    card_farmer_title: "Farmer Advisory Portal",
    card_farmer_desc: "Personalized sowing decisions, 4-pillar risk breakdown, and root-zone moisture dial.",
    card_map_title: "Village-Scale Risk Map",
    card_map_desc: "Interactive OpenStreetMap displaying Panchayat-level dry break risk across all 8 blocks.",
    card_timeline_title: "7–30 Day Forecast Outlook",
    card_timeline_desc: "Probabilistic rainfall vs moisture trend chart and 30-day day-by-day forecast matrix.",

    // Landing Outlook Section
    outlook_heading: "Your Block Outlook",
    outlook_title_1: "One selection.",
    outlook_title_em: "A clear decision.",
    outlook_desc: "Select your block in Sangrur. Saarthi analyses the rolling 6-feature meteorological vector to deliver clear advice.",
    choose_block: "Choose your block",
    latest_block_analysis: "Latest Block Analysis",
    rain_7d: "Rainfall · 7 days",
    dry_14d: "Dry days · 14 days",
    expected_rain: "Expected Rain · Next 7d",
    rain_trend: "Rainfall Trend",
    dry_spell_prob_label: "Dry Spell Probability",
    dry_spell_caption: "Probability of a severe dry break in the next 7 days from recent precipitation history.",
    sowing_rec: "Sowing Recommendation",

    // Farmer Portal
    farmer_title: "Farmer Advisory",
    farmer_subtitle: "Hyperlocal sowing decisions & root-zone telemetry for Sangrur farmers.",
    farm_profile: "Farm Profile",
    lbl_block: "Block",
    lbl_panchayat: "Panchayat (1,200+ Covered)",
    lbl_crop: "Crop Variety",
    lbl_soil: "Soil Type",
    lbl_sowing_date: "Planned Sowing Date",
    lbl_irrigation: "Irrigation Source",
    btn_update_advisory: "Compute Advisory",
    lbl_sowing_decision: "Sowing Decision",
    lbl_recommended_window: "Recommended Window",
    lbl_model_confidence: "Model Confidence",
    pillar_weather: "Weather Risk",
    pillar_soil: "Soil Moisture Risk",
    pillar_crop: "Crop Vulnerability",
    pillar_dry_spell: "Dry Break Risk",
    lbl_root_moisture: "Root-Zone Soil Moisture",
    lbl_root_moisture_sub: "Volumetric water content in active root zone (0–30 cm).",
    btn_copy_whatsapp: "Share WhatsApp Advisory",
    btn_copied: "Advisory Copied to Clipboard ✓",

    // Map
    map_title: "Village-Scale Risk Map",
    map_subtitle: "Interactive OpenStreetMap of Sangrur District showing Panchayat dry-break risk.",
    map_filter_block: "Filter by Block",
    map_filter_risk: "Filter by Risk",
    map_all_blocks: "All 8 Blocks",
    map_all_risks: "All Risk Levels",
    map_panchayats_active: "Panchayats Monitored",

    // Timeline / Forecast
    timeline_title: "7–30 Day Forecast Outlook",
    timeline_subtitle: "Probabilistic rainfall trend & 30-day day-by-day meteorological matrix.",
    timeline_horizon: "Forecast Interval",
    timeline_chart_label: "Probabilistic Cumulative Rainfall vs Soil Moisture Depletion Curve",
    th_day: "Day",
    th_date: "Date",
    th_rain: "Predicted Rain",
    th_temp: "Temperature",
    th_moisture: "Soil Moisture",
    th_risk: "Risk Status",

    // Footer
    footer_text: "Climate clarity for stronger rural futures in Punjab.",
    footer_copy: "© 2026 · SIH26086 Hyperlocal Monsoon Intelligence"
  },

  hi: {
    // Navigation
    nav_home: "मुख्य पृष्ठ",
    nav_farmer: "किसान पोर्टल",
    nav_map: "जोखिम मानचित्र",
    nav_timeline: "पूर्वानुमान",
    nav_check_block: "अपना ब्लॉक देखें",
    live_monitoring: "संगरूर लाइव मॉनिटरिंग",
    district_name: "संगरूर जिला, पंजाब",

    // Hero / Landing
    hero_eyebrow: "अति-स्थानीय जलवायु बुद्धिमत्ता",
    hero_title_1: "मानसून को",
    hero_title_em: "आगमन से पहले",
    hero_title_2: "सटीकता से जानें।",
    hero_desc: "संगरूर के 8 ब्लॉकों और 1,200+ पंचायतों के लिए सूखा-विराम और मानसून आगमन का सटीक पूर्वानुमान।",
    hero_cta: "किसान पोर्टल खोलें",
    hero_secondary_cta: "जोखिम नक्शा देखें",
    hero_badge: "हर खेत, हर मौसम के लिए तैयार",
    hero_card_kicker: "सारथी · संगरूर, पंजाब",
    hero_card_signal: "इस सप्ताह का मानसूनी संकेत",
    hero_card_days: "दिन",
    hero_card_sub: "सूखे की पूर्व चेतावनी",
    risk_low: "कम जोखिम",
    risk_mod: "मध्यम जोखिम",
    risk_high: "उच्च जोखिम",

    // Stats
    stat_1_val: "7–30",
    stat_1_lbl: "दिनों का पूर्व पूर्वानुमान",
    stat_2_val: "6",
    stat_2_lbl: "एमएल मौसम संकेत",
    stat_3_val: "8 / 1,200+",
    stat_3_lbl: "ब्लॉक एवं पंचायत कवरेज",
    stat_4_val: "92.4%",
    stat_4_lbl: "मॉडल कैलिब्रेटेड सटीकता",

    // Feature Cards
    portal_features_title: "सारथी प्लेटफॉर्म का अन्वेषण करें",
    portal_features_sub: "संगरूर के किसानों और कृषि समुदायों के लिए निर्णय सहायता पोर्टल।",
    card_farmer_title: "किसान परामर्श पोर्टल",
    card_farmer_desc: "व्यक्तिगत बुवाई निर्णय, 4-स्तंभ जोखिम विश्लेषण और मिट्टी की नमी का मीटर।",
    card_map_title: "ग्राम-स्तरीय जोखिम नक्शा",
    card_map_desc: "संगरूर के सभी 8 ब्लॉकों में पंचायत-स्तरीय सूखा जोखिम का इंटरएक्टिव नक्शा।",
    card_timeline_title: "7–30 दिन का पूर्वानुमान",
    card_timeline_desc: "बारिश बनाम मिट्टी नमी का रुझान ग्राफ और 30 दिनों की दैनिक तालिका।",

    // Landing Outlook Section
    outlook_heading: "आपके ब्लॉक का पूर्वानुमान",
    outlook_title_1: "एक चयन।",
    outlook_title_em: "स्पष्ट निर्णय।",
    outlook_desc: "संगरूर में अपना ब्लॉक चुनें। सारथी मौसम डेटा का विश्लेषण कर बुवाई का स्पष्ट परामर्श देता है।",
    choose_block: "अपना ब्लॉक चुनें",
    latest_block_analysis: "नवीनतम ब्लॉक विश्लेषण",
    rain_7d: "वर्षा · 7 दिन",
    dry_14d: "सूखे दिन · 14 दिन",
    expected_rain: "अनुमानित वर्षा · आगामी 7 दिन",
    rain_trend: "वर्षा का रुझान",
    dry_spell_prob_label: "सूखे की संभावना",
    dry_spell_caption: "हालिया वर्षा के आधार पर अगले 7 दिनों में गंभीर सूखा-विराम की संभावना।",
    sowing_rec: "बुवाई की सिफारिश",

    // Farmer Portal
    farmer_title: "किसान परामर्श पोर्टल",
    farmer_subtitle: "संगरूर के किसानों के लिए अति-स्थानीय बुवाई निर्णय और नमी टेलीमेट्री।",
    farm_profile: "खेत की प्रोफाइल",
    lbl_block: "ब्लॉक",
    lbl_panchayat: "पंचायत (1,200+ शामिल)",
    lbl_crop: "फसल किस्म",
    lbl_soil: "मिट्टी का प्रकार",
    lbl_sowing_date: "योजनाबद्ध बुवाई तिथि",
    lbl_irrigation: "सिंचाई का साधन",
    btn_update_advisory: "सलाह अपडेट करें",
    lbl_sowing_decision: "बुवाई का निर्णय",
    lbl_recommended_window: "अनुशंसित बुवाई अवधि",
    lbl_model_confidence: "मॉडल विश्वसनीयता",
    pillar_weather: "मौसम जोखिम",
    pillar_soil: "मिट्टी नमी जोखिम",
    pillar_crop: "फसल संवेदनशीलता",
    pillar_dry_spell: "सूखा विराम जोखिम",
    lbl_root_moisture: "जड़-क्षेत्र मिट्टी की नमी",
    lbl_root_moisture_sub: "सक्रिय जड़ क्षेत्र (0–30 सेमी) में पानी की मात्रा।",
    btn_copy_whatsapp: "व्हाट्सएप सलाह कॉपी करें",
    btn_copied: "सलाह क्लिपबोर्ड पर कॉपी हो गई ✓",

    // Map
    map_title: "ग्राम-स्तरीय सूखा जोखिम मानचित्र",
    map_subtitle: "संगरूर जिले की पंचायतों में सूखा जोखिम दर्शाने वाला इंटरएक्टिव नक्शा।",
    map_filter_block: "ब्लॉक के अनुसार फ़िल्टर करें",
    map_filter_risk: "जोखिम के अनुसार फ़िल्टर करें",
    map_all_blocks: "सभी 8 ब्लॉक",
    map_all_risks: "सभी जोखिम स्तर",
    map_panchayats_active: "निगरानी में पंचायतें",

    // Timeline / Forecast
    timeline_title: "7–30 दिन का मौसम पूर्वानुमान",
    timeline_subtitle: "संभाव्य वर्षा रुझान और 30 दिनों का दैनिक मौसम डेटा मैट्रिक्स।",
    timeline_horizon: "पूर्वानुमान अवधि",
    timeline_chart_label: "संभाव्य संचयी वर्षा बनाम मिट्टी की नमी ह्रास वक्र",
    th_day: "दिन",
    th_date: "दिनांक",
    th_rain: "अनुमानित वर्षा",
    th_temp: "तापमान",
    th_moisture: "मिट्टी की नमी",
    th_risk: "जोखिम स्थिति",

    // Footer
    footer_text: "पंजाब में मजबूत ग्रामीण भविष्य के लिए सटीक मौसम बुद्धिमत्ता।",
    footer_copy: "© 2026 · SIH26086 अति-स्थानीय मानसूनी बुद्धिमत्ता प्रणाली"
  },

  pa: {
    // Navigation
    nav_home: "ਮੁੱਖ ਪੰਨਾ",
    nav_farmer: "ਕਿਸਾਨ ਪੋਰਟਲ",
    nav_map: "ਜੋਖਮ ਨਕਸ਼ਾ",
    nav_timeline: "ਮੌਸਮ ਭਵਿੱਖਬਾਣੀ",
    nav_check_block: "ਆਪਣਾ ਬਲਾਕ ਵੇਖੋ",
    live_monitoring: "ਸੰਗਰੂਰ ਲਾਈਵ ਨਿਗਰਾਨੀ",
    district_name: "ਜ਼ਿਲ੍ਹਾ ਸੰਗਰੂਰ, ਪੰਜਾਬ",

    // Hero / Landing
    hero_eyebrow: "ਹਾਈਪਰਲੋਕਲ ਮੌਸਮੀ ਸੂਝ-ਬੂਝ",
    hero_title_1: "ਮੌਨਸੂਨ ਨੂੰ",
    hero_title_em: "ਆਉਣ ਤੋਂ ਪਹਿਲਾਂ",
    hero_title_2: "ਚੰਗੀ ਤਰ੍ਹਾਂ ਜਾਣੋ।",
    hero_desc: "ਸੰਗਰੂਰ ਦੇ 8 ਬਲਾਕਾਂ ਅਤੇ 1,200+ ਪੰਚਾਇਤਾਂ ਲਈ ਸੁੱਕੇ ਦੇ ਸਮੇਂ ਅਤੇ ਮੌਨਸੂਨ ਆਮਦ ਦੀ ਸਹੀ ਭਵਿੱਖਬਾਣੀ।",
    hero_cta: "ਕਿਸਾਨ ਪੋਰਟਲ ਖੋਲ੍ਹੋ",
    hero_secondary_cta: "ਜੋਖਮ ਨਕਸ਼ਾ ਵੇਖੋ",
    hero_badge: "ਹਰ ਖੇਤ, ਹਰ ਮੌਸਮ ਲਈ ਤਿਆਰ",
    hero_card_kicker: "ਸਾਰਥੀ · ਸੰਗਰੂਰ, ਪੰਜਾਬ",
    hero_card_signal: "ਇਸ ਹਫ਼ਤੇ ਦਾ ਮੌਨਸੂਨੀ ਸੰਕੇਤ",
    hero_card_days: "ਦਿਨ",
    hero_card_sub: "ਸੋਕੇ ਦੀ ਅਗੇਤੀ ਚੇਤਾਵਨੀ",
    risk_low: "ਘੱਟ ਜੋਖਮ",
    risk_mod: "ਦਰਮਿਆਨਾ ਜੋਖਮ",
    risk_high: "ਵੱਡਾ ਜੋਖਮ",

    // Stats
    stat_1_val: "7–30",
    stat_1_lbl: "ਦਿਨਾਂ ਦਾ ਅਗੇਤਾ ਅਨੁਮਾਨ",
    stat_2_val: "6",
    stat_2_lbl: "ਮੌਸਮੀ ਮਾਡਲ ਸੰਕੇਤ",
    stat_3_val: "8 / 1,200+",
    stat_3_lbl: "ਬਲਾਕ ਅਤੇ ਪੰਚਾਇਤ ਕਵਰੇਜ",
    stat_4_val: "92.4%",
    stat_4_lbl: "ਮਾਡਲ ਦੀ ਪਰਖੀ ਹੋਈ ਸਟੀਕਤਾ",

    // Feature Cards
    portal_features_title: "ਸਾਰਥੀ ਪਲੇਟਫਾਰਮ ਦੀਆਂ ਸੇਵਾਵਾਂ",
    portal_features_sub: "ਸੰਗਰੂਰ ਦੇ ਕਿਸਾਨਾਂ ਅਤੇ ਖੇਤੀਬਾੜੀ ਲਈ ਵਿਸ਼ੇਸ਼ ਪੋਰਟਲ।",
    card_farmer_title: "ਕਿਸਾਨ ਸਲਾਹਕਾਰ ਪੋਰਟਲ",
    card_farmer_desc: "ਖੇਤ ਮੁਤਾਬਕ ਬੀਜਾਈ ਦੇ ਫ਼ੈਸਲੇ, 4-ਥੰਮ੍ਹ ਜੋਖਮ ਵੇਰਵੇ ਅਤੇ ਜ਼ਮੀਨੀ ਨਮੀ ਦਾ ਮੀਟਰ।",
    card_map_title: "ਪਿੰਡ ਪੱਧਰੀ ਜੋਖਮ ਨਕਸ਼ਾ",
    card_map_desc: "ਸੰਗਰੂਰ ਦੇ ਸਾਰੇ 8 ਬਲਾਕਾਂ ਵਿੱਚ ਪੰਚਾਇਤ ਪੱਧਰ 'ਤੇ ਸੋਕੇ ਦਾ ਇੰਟਰਐਕਟਿਵ ਨਕਸ਼ਾ।",
    card_timeline_title: "7–30 ਦਿਨਾਂ ਦਾ ਮੌਸਮ ਰੁਝਾਨ",
    card_timeline_desc: "ਮੀਂਹ ਅਤੇ ਨਮੀ ਦਾ ਗ੍ਰਾਫ਼ ਅਤੇ 30 ਦਿਨਾਂ ਦਾ ਰੋਜ਼ਾਨਾ ਅਨੁਮਾਨ ਚਾਰਟ।",

    // Landing Outlook Section
    outlook_heading: "ਤੁਹਾਡੇ ਬਲਾਕ ਦਾ ਮੌਸਮ ਹਾਲ",
    outlook_title_1: "ਇੱਕ ਚੋਣ।",
    outlook_title_em: "ਸਪੱਸ਼ਟ ਫ਼ੈਸਲਾ।",
    outlook_desc: "ਸੰਗਰੂਰ ਵਿੱਚ ਆਪਣਾ ਬਲਾਕ ਚੁਣੋ। ਸਾਰਥੀ ਤਾਜ਼ਾ ਮੀਂਹ ਦੇ ਅੰਕੜਿਆਂ ਦੀ ਜਾਂਚ ਕਰਕੇ ਸਪੱਸ਼ਟ ਬੀਜਾਈ ਸਲਾਹ ਦਿੰਦਾ ਹੈ।",
    choose_block: "ਆਪਣਾ ਬਲਾਕ ਚੁਣੋ",
    latest_block_analysis: "ਤਾਜ਼ਾ ਬਲਾਕ ਵਿਸ਼ਲੇਸ਼ਣ",
    rain_7d: "ਮੀਂਹ · 7 ਦਿਨ",
    dry_14d: "ਸੁੱਕੇ ਦਿਨ · 14 ਦਿਨ",
    expected_rain: "ਸੰਭਾਵੀ ਮੀਂਹ · ਅਗਲੇ 7 ਦਿਨ",
    rain_trend: "ਮੀਂਹ ਦਾ ਰੁਝਾਨ",
    dry_spell_prob_label: "ਸੋਕੇ ਦੀ ਸੰਭਾਵਨਾ",
    dry_spell_caption: "ਪਿਛਲੇ ਮੀਂਹ ਦੇ ਆਧਾਰ 'ਤੇ ਅਗਲੇ 7 ਦਿਨਾਂ ਵਿੱਚ ਗੰਭੀਰ ਸੋਕੇ ਦਾ ਖ਼ਤਰਾ।",
    sowing_rec: "ਬੀਜਾਈ ਦੀ ਸਿਫ਼ਾਰਸ਼",

    // Farmer Portal
    farmer_title: "ਕਿਸਾਨ ਸਲਾਹਕਾਰ ਪੋਰਟਲ",
    farmer_subtitle: "ਸੰਗਰੂਰ ਦੇ ਕਿਸਾਨਾਂ ਲਈ ਪੰਚਾਇਤ ਪੱਧਰੀ ਬੀਜਾਈ ਫ਼ੈਸਲੇ ਅਤੇ ਨਮੀ ਮੀਟਰ।",
    farm_profile: "ਖੇਤ ਦਾ ਵੇਰਵਾ",
    lbl_block: "ਬਲਾਕ",
    lbl_panchayat: "ਪੰਚਾਇਤ (1,200+ ਕਵਰਡ)",
    lbl_crop: "ਫ਼ਸਲ ਦੀ ਕਿਸਮ",
    lbl_soil: "ਮਿੱਟੀ ਦੀ ਕਿਸਮ",
    lbl_sowing_date: "ਬੀਜਾਈ ਦੀ ਮਿਤੀ",
    lbl_irrigation: "ਸਿੰਚਾਈ ਦਾ ਸਾਧਨ",
    btn_update_advisory: "ਸਲਾਹ ਤਾਜ਼ਾ ਕਰੋ",
    lbl_sowing_decision: "ਬੀਜਾਈ ਦਾ ਫ਼ੈਸਲਾ",
    lbl_recommended_window: "ਸਿਫ਼ਾਰਸ਼ੀ ਸਮਾਂ",
    lbl_model_confidence: "ਮਾਡਲ ਭਰੋਸੇਯੋਗਤਾ",
    pillar_weather: "ਮੌਸਮ ਜੋਖਮ",
    pillar_soil: "ਮਿੱਟੀ ਨਮੀ ਜੋਖਮ",
    pillar_crop: "ਫ਼ਸਲ ਸੰਵੇਦਨਸ਼ੀਲਤਾ",
    pillar_dry_spell: "ਸੋਕੇ ਦਾ ਖ਼ਤਰਾ",
    lbl_root_moisture: "ਜੜ੍ਹ-ਖੇਤਰ ਮਿੱਟੀ ਦੀ ਨਮੀ",
    lbl_root_moisture_sub: "ਜੜ੍ਹ-ਖੇਤਰ (0–30 ਸੈਂਟੀਮੀਟਰ) ਵਿੱਚ ਪਾਣੀ ਦੀ ਮਾਤਰਾ।",
    btn_copy_whatsapp: "ਵਟਸਐਪ ਸਲਾਹ ਕਾਪੀ ਕਰੋ",
    btn_copied: "ਸਲਾਹ ਕਲਿੱਪਬੋਰਡ 'ਤੇ ਕਾਪੀ ਹੋ ਗਈ ✓",

    // Map
    map_title: "ਪਿੰਡ ਪੱਧਰੀ ਸੋਕਾ ਜੋਖਮ ਨਕਸ਼ਾ",
    map_subtitle: "ਸੰਗਰੂਰ ਜ਼ਿਲ੍ਹੇ ਦੀਆਂ ਪੰਚਾਇਤਾਂ ਵਿੱਚ ਸੋਕੇ ਦੇ ਖ਼ਤਰੇ ਦਾ ਇੰਟਰਐਕਟਿਵ ਨਕਸ਼ਾ।",
    map_filter_block: "ਬਲਾਕ ਅਨੁਸਾਰ ਫ਼ਿਲਟਰ",
    map_filter_risk: "ਜੋਖਮ ਅਨੁਸਾਰ ਫ਼ਿਲਟਰ",
    map_all_blocks: "ਸਾਰੇ 8 ਬਲਾਕ",
    map_all_risks: "ਸਾਰੇ ਜੋਖਮ ਪੱਧਰ",
    map_panchayats_active: "ਨਿਗਰਾਨੀ ਅਧੀਨ ਪੰਚਾਇਤਾਂ",

    // Timeline / Forecast
    timeline_title: "7–30 ਦਿਨਾਂ ਦਾ ਮੌਸਮ ਅਨੁਮਾਨ",
    timeline_subtitle: "ਸੰਭਾਵੀ ਮੀਂਹ ਰੁਝਾਨ ਅਤੇ 30 ਦਿਨਾਂ ਦਾ ਰੋਜ਼ਾਨਾ ਡਾਟਾ ਚਾਰਟ।",
    timeline_horizon: "ਅਨੁਮਾਨ ਸਮਾਂ",
    timeline_chart_label: "ਸੰਭਾਵੀ ਮੀਂਹ ਬਨਾਮ ਮਿੱਟੀ ਨਮੀ ਗਿਰਾਵਟ ਗ੍ਰਾਫ਼",
    th_day: "ਦਿਨ",
    th_date: "ਮਿਤੀ",
    th_rain: "ਅਨੁਮਾਨਿਤ ਮੀਂਹ",
    th_temp: "ਤਾਪਮਾਨ",
    th_moisture: "ਮਿੱਟੀ ਨਮੀ",
    th_risk: "ਜੋਖਮ ਹਾਲਤ",

    // Footer
    footer_text: "ਪੰਜਾਬ ਦੇ ਖੇਤੀਬਾੜੀ ਭਵਿੱਖ ਲਈ ਸਟੀਕ ਅਤੇ ਭਰੋਸੇਯੋਗ ਮੌਸਮੀ ਜਾਣਕਾਰੀ।",
    footer_copy: "© 2026 · SIH26086 ਹਾਈਪਰਲੋਕਲ ਮੌਨਸੂਨ ਸੂਚਨਾ ਪ੍ਰਣਾਲੀ"
  }
};

let currentLanguage = localStorage.getItem("saarthi_lang") || "en";

function getTranslation(key, lang = currentLanguage) {
  if (I18N_DICTIONARY[lang] && I18N_DICTIONARY[lang][key]) {
    return I18N_DICTIONARY[lang][key];
  }
  if (I18N_DICTIONARY.en[key]) {
    return I18N_DICTIONARY.en[key];
  }
  return key;
}

function setLanguage(lang) {
  if (!["en", "hi", "pa"].includes(lang)) lang = "en";
  currentLanguage = lang;
  localStorage.setItem("saarthi_lang", lang);
  applyTranslations();
  
  // Trigger custom event for reactive components
  window.dispatchEvent(new CustomEvent("languageChanged", { detail: { language: lang } }));
}

function applyTranslations() {
  const elements = document.querySelectorAll("[data-i18n]");
  elements.forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const trans = getTranslation(key);
    if (trans) {
      if (el.tagName === "INPUT" && el.getAttribute("type") === "button") {
        el.value = trans;
      } else if (el.hasAttribute("data-i18n-placeholder")) {
        el.placeholder = trans;
      } else {
        el.innerHTML = trans;
      }
    }
  });

  // Update active states on trilingual buttons
  document.querySelectorAll(".lang-btn, .lang-switcher button").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-lang") === currentLanguage);
  });

  // Update HTML lang attribute
  document.documentElement.lang = currentLanguage;
}

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
  applyTranslations();
  
  // Bind click handlers to language buttons
  document.querySelectorAll(".lang-btn, .lang-switcher button").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const chosen = btn.getAttribute("data-lang");
      if (chosen) setLanguage(chosen);
    });
  });
});
