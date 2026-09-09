"""
SAARTHI Agronomic AI LLM Advisory Engine.

Analyzes 3 core agricultural attributes:
1. Rainfall & Monsoon Forecast (Rain 3d, 7d, 14d, dry spell risk)
2. Soil Root-Zone Moisture & Soil Type (saturation, water retention vs drainage)
3. Crop Phenology & Sensitivity Window (germination temperature & moisture needs)

Outputs direct, plain-language farmer guidance:
- SOW NOW vs WAIT
- Recommended Window
- Simple 3-attribute explanation in English, Hindi, or Punjabi
- Practical field action steps
Supports live Google Gemini API with seamless local reasoning engine fallback.
"""
from __future__ import annotations

import os
from datetime import date, timedelta
from typing import Any, Dict

# Try importing the official google-genai SDK
try:
    # pyrefly: ignore [missing-import]
    from google import genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False


def _get_district_telemetry(block: str) -> dict:
    """Telemetry data matching Sangrur's 8 blocks."""
    conditions = {
        "Sunam": {"rain_3d": 3, "rain_7d": 9, "rain_14d": 19, "rain_30d": 38, "dry_days_7d": 5, "dry_days_14d": 10, "moisture": 24, "temp": 33},
        "Sangrur": {"rain_3d": 5, "rain_7d": 12, "rain_14d": 28, "rain_30d": 54, "dry_days_7d": 4, "dry_days_14d": 8, "moisture": 32, "temp": 32},
        "Dhuri": {"rain_3d": 11, "rain_7d": 31, "rain_14d": 62, "rain_30d": 110, "dry_days_7d": 2, "dry_days_14d": 5, "moisture": 36, "temp": 31},
        "Moonak": {"rain_3d": 8, "rain_7d": 22, "rain_14d": 48, "rain_30d": 88, "dry_days_7d": 3, "dry_days_14d": 6, "moisture": 37, "temp": 34},
        "Lehragaga": {"rain_3d": 2, "rain_7d": 7, "rain_14d": 16, "rain_30d": 31, "dry_days_7d": 6, "dry_days_14d": 11, "moisture": 19, "temp": 35},
        "Malerkotla": {"rain_3d": 17, "rain_7d": 42, "rain_14d": 79, "rain_30d": 142, "dry_days_7d": 1, "dry_days_14d": 3, "moisture": 44, "temp": 30},
        "Amargarh": {"rain_3d": 14, "rain_7d": 36, "rain_14d": 72, "rain_30d": 128, "dry_days_7d": 2, "dry_days_14d": 4, "moisture": 41, "temp": 31},
        "Bhawanigarh": {"rain_3d": 6, "rain_7d": 17, "rain_14d": 41, "rain_30d": 75, "dry_days_7d": 4, "dry_days_14d": 7, "moisture": 35, "temp": 33},
    }
    return conditions.get(block, conditions["Sangrur"])


def _calculate_sowing_assessment(telemetry: dict, crop: str, soil: str, irrigation: str) -> dict:
    """Analyzes the 3 core attributes mathematically to determine the fundamental agronomic verdict."""
    rain_7d = telemetry["rain_7d"]
    moisture = telemetry["moisture"]
    dry_days = telemetry["dry_days_7d"]

    # Attribute 1: Rain Condition
    if rain_7d < 15:
        rain_status = "Deficit / Dry Spell Ahead"
        rain_score = -2
    elif 15 <= rain_7d <= 55:
        rain_status = "Optimal Monsoon Showers"
        rain_score = 2
    else:
        rain_status = "Heavy Waterlogging Risk"
        rain_score = -1

    # Attribute 2: Soil Root-Zone Moisture Condition
    if "Clay" in soil:
        effective_moisture = moisture + 6
    elif "Sandy" in soil:
        effective_moisture = moisture - 6
    else:
        effective_moisture = moisture

    if effective_moisture < 25:
        soil_status = "Dry - Needs Pre-Sowing Irrigation"
        soil_score = -2
    elif 25 <= effective_moisture <= 50:
        soil_status = "Good Field Moisture Capacity"
        soil_score = 2
    else:
        soil_status = "Saturated / Submerged"
        soil_score = -1

    # Attribute 3: Crop Sensitivity
    crop_lower = crop.lower()
    if "paddy" in crop_lower or "rice" in crop_lower:
        crop_req = "Requires steady moisture, vulnerable to dry breaks during early transplanting."
        crop_score = 1 if irrigation in ["Canals", "Tubewells"] else -1
    elif "cotton" in crop_lower:
        crop_req = "Very sensitive to stagnant water, needs well-drained aerated beds."
        crop_score = -2 if rain_7d > 45 else 1
    elif "maize" in crop_lower:
        crop_req = "Moderate water need; cannot tolerate water stagnation for more than 24 hours."
        crop_score = 1
    elif "wheat" in crop_lower:
        crop_req = "Winter rabi crop; needs cooler soil temperatures and light moisture."
        crop_score = 1
    else:
        crop_req = "Standard agronomic moisture requirements."
        crop_score = 1

    total_score = rain_score + soil_score + crop_score

    # Determine Verdict & Recommended Window
    today = date.today()
    if total_score >= 2:
        verdict = "SOW NOW"
        verdict_code = "safe"
        window_start = today
        window_end = today + timedelta(days=6)
    elif -1 <= total_score < 2:
        verdict = "PREPARE FIELD & SOW CAUTIOUSLY"
        verdict_code = "caution"
        window_start = today + timedelta(days=3)
        window_end = today + timedelta(days=9)
    else:
        verdict = "HOLD / WAIT (DO NOT SOW YET)"
        verdict_code = "wait"
        window_start = today + timedelta(days=7)
        window_end = today + timedelta(days=14)

    return {
        "verdict": verdict,
        "verdict_code": verdict_code,
        "window": f"{window_start.strftime('%b %d')} – {window_end.strftime('%b %d')}",
        "rain_status": rain_status,
        "rain_val": f"{rain_7d} mm (7-day forecast)",
        "soil_status": soil_status,
        "soil_val": f"{effective_moisture}% Volumetric Moisture",
        "crop_req": crop_req,
        "dry_days": f"{dry_days} days dry break probability",
    }


def generate_advisor_response(
    block: str,
    panchayat: str,
    crop: str,
    soil: str,
    sowing_date: str,
    irrigation: str,
    custom_question: str = "",
    lang: str = "en",
    api_key: str = ""
) -> Dict[str, Any]:
    """
    Main LLM Advisor generation method.
    Uses Gemini API if key is available, otherwise uses local agronomic LLM reasoning engine.
    Always returns structured, plain-language text for farmers.
    """
    telemetry = _get_district_telemetry(block)
    assessment = _calculate_sowing_assessment(telemetry, crop, soil, irrigation)

    # Check for live Google Gemini API key
    active_key = api_key or os.getenv("GEMINI_API_KEY")
    live_llm_used = False
    llm_text = ""

    prompt = f"""You are 'Saarthi AI Kisan Advisor', a warm, expert, and practical village agronomist helping farmers in Sangrur District, Punjab.
The farmer has submitted their field details:
- Block: {block}
- Panchayat: {panchayat}
- Crop: {crop}
- Soil: {soil}
- Irrigation Source: {irrigation}
- Planned Sowing: {sowing_date}
- Core Attribute 1 (Rainfall): {assessment['rain_val']} - Status: {assessment['rain_status']}
- Core Attribute 2 (Soil Moisture): {assessment['soil_val']} - Status: {assessment['soil_status']}
- Core Attribute 3 (Crop Requirement): {assessment['crop_req']}
- Sowing Verdict: {assessment['verdict']}
- Recommended Window: {assessment['window']}
Farmer's specific question: "{custom_question or 'Should I sow right now or wait, and what should I do?'}"

Instructions:
1. Speak in warm, respectful, extremely simple language suitable for everyday Indian farmers (no complex charts, statistics, or academic jargon).
2. Start with a direct, crystal-clear answer: Tell them whether they should SOW NOW or WAIT.
3. State the exact recommended dates: {assessment['window']}.
4. Briefly summarize the 3 main attributes (Rain, Soil Moisture, Crop condition) in 2-3 simple conversational sentences.
5. Give 3 short, practical bullet points on what they should do in the field right now.
6. Respond in language: { 'Punjabi (Gurmukhi script)' if lang == 'pa' else 'Hindi (Devanagari script)' if lang == 'hi' else 'English' }.
Keep it direct, encouraging, and under 150 words.
"""

    if GENAI_AVAILABLE and active_key:
        try:
            client = genai.Client(api_key=active_key)
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt
            )
            if response and response.text:
                llm_text = response.text.strip()
                live_llm_used = True
        except Exception as e:
            # If live API call fails, fall through to built-in reasoning engine
            print(f"[LLM Advisor] Live API call fallback: {e}")

    if not llm_text:
        # High quality built-in local agronomic reasoning engine
        llm_text = _generate_local_llm_response(assessment, block, panchayat, crop, soil, irrigation, lang, custom_question)

    return {
        "status": "success",
        "verdict": assessment["verdict"],
        "verdict_code": assessment["verdict_code"],
        "recommended_window": assessment["window"],
        "core_attributes": {
            "rainfall": {
                "label": "Rainfall & Monsoon Forecast",
                "value": assessment["rain_val"],
                "status": assessment["rain_status"]
            },
            "soil_moisture": {
                "label": "Root-Zone Soil Moisture",
                "value": assessment["soil_val"],
                "status": assessment["soil_status"]
            },
            "crop_sensitivity": {
                "label": "Crop Phenology & Vulnerability",
                "value": crop,
                "status": assessment["crop_req"]
            }
        },
        "summary": llm_text,
        "model_used": "Gemini 2.0 Flash (Live)" if live_llm_used else "Saarthi Agronomy LLM Engine (Local)",
        "language": lang,
        "block": block,
        "panchayat": panchayat,
        "crop": crop
    }


# Backward-compatible alias
generate_sowing_advice = generate_advisor_response


def _generate_local_llm_response(assessment: dict, block: str, panchayat: str, crop: str, soil: str, irrigation: str, lang: str, question: str = "") -> str:
    """Generates empathetic, natural village advisory text in English, Hindi, or Punjabi."""
    verdict_code = assessment["verdict_code"]
    window = assessment["window"]
    rain_val = assessment["rain_val"]
    soil_val = assessment["soil_val"]

    if lang == "pa":  # Punjabi
        if verdict_code == "safe":
            return (
                f"ਕਿਸਾਨ ਵੀਰ ਜੀ, ਤੁਹਾਡੇ ਖੇਤ ({panchayat}, {block}) ਲਈ ਸਿੱਧਾ ਫੈਸਲਾ: ਹੁਣ ਬਿਜਾਈ ਕਰਨ ਦਾ ਬਿਲਕੁਲ ਸਹੀ ਸਮਾਂ ਹੈ।\n\n"
                f"ਸਿਫ਼ਾਰਿਸ਼ ਕੀਤੀ ਬਿਜਾਈ ਮਿਤੀ: {window}।\n\n"
                f"ਮੁੱਖ ਕਾਰਨ:\n"
                f"1. ਮੀਂਹ ਦੀ ਸਥਿਤੀ: ਅਗਲੇ 7 ਦਿਨਾਂ 'ਚ {rain_val} ਆਮ ਮੀਂਹ ਹੈ, ਜੋ ਪੁੰਗਰਨ ਲਈ ਅਨੁਕੂਲ ਹੈ।\n"
                f"2. ਜ਼ਮੀਨ ਦੀ ਨਮੀ: {soil_val} ਨਾਲ ਜ਼ਮੀਨ 'ਚ ਵੱਤਰ ਬਹੁਤ ਵਧੀਆ ਹੈ।\n"
                f"3. ਫ਼ਸਲ: {crop} ਲਈ ਇਹ ਮੌਸਮ ਬਿਲਕੁਲ ਅਨੁਕੂਲ ਹੈ।\n\n"
                f"ਅਗਲੇ ਕਦਮ:\n"
                f"• ਖੇਤ ਦੀ ਤਿਆਰੀ ਪੂਰੀ ਕਰਕੇ {window} ਦੇ ਦੌਰਾਨ ਬੀਜ ਪਾਓ।\n"
                f"• {irrigation} ਪਾਣੀ ਦੀ ਬਚਤ ਨਾਲ ਵਰਤੋਂ ਕਰੋ ਕਿਉਂਕਿ ਮੀਂਹ ਮਦਦ ਕਰੇਗਾ।\n"
                f"• ਬੀਜ ਨੂੰ ਸਿਫ਼ਾਰਿਸ਼ ਕੀਤੀ ਦਵਾਈ ਨਾਲ ਸੋਧ ਕੇ ਹੀ ਬੀਜੋ।"
            )
        elif verdict_code == "caution":
            return (
                f"ਕਿਸਾਨ ਵੀਰ ਜੀ, ਤੁਹਾਡੇ ਖੇਤ ({panchayat}, {block}) ਲਈ ਸਲਾਹ: ਥੋੜ੍ਹਾ ਧਿਆਨ ਰੱਖੋ ਅਤੇ ਖੇਤ ਤਿਆਰ ਰੱਖੋ।\n\n"
                f"ਸਿਫ਼ਾਰਿਸ਼ ਕੀਤੀ ਬਿਜਾਈ ਮਿਤੀ: {window}।\n\n"
                f"ਮੁੱਖ ਕਾਰਨ:\n"
                f"1. ਮੀਂਹ ਦੀ ਸਥਿਤੀ: {rain_val} ਹੋਣ ਕਰਕੇ ਮੀਂਹ 'ਚ ਹਲਕਾ ਵਕਫ਼ਾ ਆ ਸਕਦਾ ਹੈ।\n"
                f"2. ਜ਼ਮੀਨ ਦੀ ਨਮੀ: ਨਮੀ ({soil_val}) ਦਰਮਿਆਨੀ ਹੈ, ਹਲਕੀ ਰੌਣੀ ਦੀ ਲੋੜ ਪੈ ਸਕਦੀ ਹੈ।\n"
                f"3. ਫ਼ਸਲ: {crop} ਦੀ ਪਨੀਰੀ ਜਾਂ ਬਿਜਾਈ ਲਈ 3 ਦਿਨ ਬਾਅਦ ਮੌਸਮ ਹੋਰ ਸਥਿਰ ਹੋਵੇਗਾ।\n\n"
                f"ਅਗਲੇ ਕਦਮ:\n"
                f"• ਖੇਤ ਨੂੰ ਪੱਧਰਾ ਕਰੋ ਅਤੇ ਵੱਟਾਂ ਮਜ਼ਬੂਤ ਕਰੋ।\n"
                f"• ਬਿਜਾਈ ਤੋਂ ਪਹਿਲਾਂ ਹਲਕਾ ਪਾਣੀ ਲਗਾ ਕੇ ਵੱਤਰ ਆਉਣ ਦਿਓ।\n"
                f"• {window} ਦੇ ਵਿਚਕਾਰ ਹੀ ਬਿਜਾਈ ਕਰੋ।"
            )
        else:
            return (
                f"ਕਿਸਾਨ ਵੀਰ ਜੀ, ਤੁਹਾਡੇ ਖੇਤ ({panchayat}, {block}) ਲਈ ਸਪੱਸ਼ਟ ਫੈਸਲਾ: ਹੁਣੇ ਬਿਜਾਈ ਨਾ ਕਰੋ, ਥੋੜ੍ਹਾ ਇੰਤਜ਼ਾਰ ਕਰੋ।\n\n"
                f"ਸਿਫ਼ਾਰਿਸ਼ ਕੀਤੀ ਬਿਜਾਈ ਮਿਤੀ: {window} ਤੱਕ ਮੁਲਤਵੀ ਰੱਖੋ।\n\n"
                f"ਮੁੱਖ ਕਾਰਨ:\n"
                f"1. ਮੀਂਹ ਦੀ ਸਥਿਤੀ: ਅਗਲੇ ਦਿਨਾਂ 'ਚ ਖੁਸ਼ਕ ਦੌਰ (Dry Spell) ਦੀ ਸੰਭਾਵਨਾ ਹੈ ({rain_val})।\n"
                f"2. ਜ਼ਮੀਨ ਦੀ ਨਮੀ: {soil_val} ਕਾਫ਼ੀ ਘੱਟ ਹੈ, ਬੀਜ ਸੁੱਕਣ ਦਾ ਖ਼ਤਰਾ ਹੈ।\n"
                f"3. ਫ਼ਸਲ: {crop} ਦੇ ਨਾਜ਼ੁਕ ਪੁੰਗਰਨ ਵੇਲੇ ਪਾਣੀ ਦੀ ਤੋਟ ਨੁਕਸਾਨ ਕਰ ਸਕਦੀ ਹੈ।\n\n"
                f"ਅਗਲੇ ਕਦਮ:\n"
                f"• ਹੁਣੇ ਬਿਜਾਈ ਰੋਕ ਲਵੋ ਅਤੇ ਬੀਜ ਸੰਭਾਲ ਕੇ ਰੱਖੋ।\n"
                f"• {irrigation} ਸਾਧਨਾਂ ਨੂੰ ਤਿਆਰ ਰੱਖੋ ਅਤੇ ਨਹਿਰੀ ਪਾਣੀ ਦੀ ਵਾਰੀ ਯਕੀਨੀ ਬਣਾਓ।\n"
                f"• ਅਗਲੇ ਹਫ਼ਤੇ {window} ਵਿੱਚ ਜਦੋਂ ਨਵੀਂ ਰਿਪੋਰਟ ਆਵੇ ਤਾਂ ਹੀ ਬਿਜਾਈ ਸ਼ੁਰੂ ਕਰੋ।"
            )

    elif lang == "hi":  # Hindi
        if verdict_code == "safe":
            return (
                f"किसान भाई, आपके खेत ({panchayat}, {block}) के लिए सीधा निर्णय: अभी बुवाई करने का सबसे अनुकूल समय है।\n\n"
                f"अनुशंसित बुवाई विंडो: {window}।\n\n"
                f"मुख्य विश्लेषण (3 महत्वपूर्ण बातें):\n"
                f"1. वर्षा स्थिति: 7 दिनों में {rain_val} वर्षा अनुकूल है, अंकुरण में मदद मिलेगी।\n"
                f"2. मिट्टी की नमी: {soil_val} नमी पौधों की जड़ों के लिए आदर्श है।\n"
                f"3. फसल स्थिति: {crop} के लिए यह मौसमी संकेत एकदम सुरक्षित है।\n\n"
                f"आगे के जरूरी कदम:\n"
                f"• खेत तैयार करके {window} के भीतर बुवाई पूरी करें।\n"
                f"• {irrigation} जल का संतुलित उपयोग करें।\n"
                f"• बीजों को उपचारित करके ही खेत में डालें।"
            )
        elif verdict_code == "caution":
            return (
                f"किसान भाई, आपके खेत ({panchayat}, {block}) के लिए सलाह: खेत तैयार रखें और सावधानी के साथ आगे बढ़ें।\n\n"
                f"अनुशंसित बुवाई विंडो: {window}।\n\n"
                f"मुख्य विश्लेषण (3 महत्वपूर्ण बातें):\n"
                f"1. वर्षा स्थिति: आगामी दिनों में {rain_val} वर्षा के साथ मौसम परिवर्तनशील रहेगा।\n"
                f"2. मिट्टी की नमी: नमी ({soil_val}) मध्यम है, हल्की सिंचाई की जरूरत हो सकती है।\n"
                f"3. फसल स्थिति: {crop} की बुवाई के लिए 2-3 दिन बाद परिस्थितियां और बेहतर होंगी।\n\n"
                f"आगे के जरूरी कदम:\n"
                f"• खेत की मेड़ों को दुरुस्त करें और खरपतवार हटाएं।\n"
                f"• पलेवा (हल्की सिंचाई) करके नमी बनाएं।\n"
                f"• {window} की तय अवधि में बुवाई करें।"
            )
        else:
            return (
                f"किसान भाई, आपके खेत ({panchayat}, {block}) के लिए स्पष्ट निर्णय: अभी बुवाई न करें, थोड़ा रुकें।\n\n"
                f"अनुशंसित बुवाई विंडो: बुवाई को {window} तक टालें।\n\n"
                f"मुख्य विश्लेषण (3 महत्वपूर्ण बातें):\n"
                f"1. वर्षा स्थिति: आने वाले दिनों में लंबा सूखा दौर (ड्राई स्पेल) संभव है ({rain_val})।\n"
                f"2. मिट्टी की नमी: {soil_val} नमी कम है, अंकुर झुलसने का खतरा है।\n"
                f"3. फसल स्थिति: {crop} शुरुआती अवस्था में पानी की कमी बर्दाश्त नहीं कर पाएगी।\n\n"
                f"आगे के जरूरी कदम:\n"
                f"• अभी बुवाई रोकें और बीज को सुरक्षित रखें।\n"
                f"• {irrigation} जल आपूर्ति की पहले से व्यवस्था करें।\n"
                f"• मौसम सुधरने पर {window} में ही बुवाई का फैसला लें।"
            )

    else:  # English
        if verdict_code == "safe":
            return (
                f"Clear Decision for {panchayat}, {block}: SOW NOW. Conditions are fully favorable for your field.\n\n"
                f"Recommended Sowing Window: {window}.\n\n"
                f"3 Core Attributes Summary:\n"
                f"1. Rainfall: Projected {rain_val} provides consistent, non-flooding moisture ideal for germination.\n"
                f"2. Soil Moisture: Healthy {soil_val} volumetric water content ensures rapid root establishment in {soil}.\n"
                f"3. Crop Phenology: {crop} is well protected against upcoming monsoon breaks.\n\n"
                f"Immediate Action Steps:\n"
                f"• Finalize seedbed preparation and sow within {window}.\n"
                f"• Conserve {irrigation} irrigation as incoming showers will support moisture.\n"
                f"• Ensure certified seed treatment prior to sowing."
            )
        elif verdict_code == "caution":
            return (
                f"Advisory for {panchayat}, {block}: PREPARE FIELD & SOW CAUTIOUSLY. Weather will stabilize in 3 days.\n\n"
                f"Recommended Sowing Window: {window}.\n\n"
                f"3 Core Attributes Summary:\n"
                f"1. Rainfall: Scattered showers expected ({rain_val}) with variable coverage.\n"
                f"2. Soil Moisture: Currently at {soil_val}; a light pre-sowing irrigation may be required.\n"
                f"3. Crop Phenology: {crop} will benefit from waiting until the steady rain window begins.\n\n"
                f"Immediate Action Steps:\n"
                f"• Level field beds and clear drainage furrows.\n"
                f"• Apply light soaking irrigation if soil surface is dry.\n"
                f"• Proceed with sowing during {window}."
            )
        else:
            return (
                f"Clear Decision for {panchayat}, {block}: WAIT / DO NOT SOW YET. Prolonged dry break expected.\n\n"
                f"Recommended Sowing Window: Delay sowing until {window}.\n\n"
                f"3 Core Attributes Summary:\n"
                f"1. Rainfall: Extended dry spell ahead with minimal precipitation ({rain_val}).\n"
                f"2. Soil Moisture: Critically low at {soil_val}, posing high seedling mortality risk.\n"
                f"3. Crop Phenology: {crop} sprouts will dry out without sustained sub-surface water.\n\n"
                f"Immediate Action Steps:\n"
                f"• Hold back sowing and preserve seed stocks.\n"
                f"• Prepare {irrigation} pump schedules and canal rotation slots.\n"
                f"• Re-check advisories next week for the safe window opening around {window}."
            )


def generate_chat_response(
    question: str,
    language: str = "en",
    history: list[dict] | None = None,
    block: str = "Sangrur",
    panchayat: str = "Mangwal",
    crop: str = "Paddy (PR-126)",
    soil: str = "Clay Loam",
    api_key: str | None = None,
) -> dict[str, Any]:
    """
    Generates a concise, direct, multi-turn AI Advisory copilot response.
    
    Constraints:
    - Default response length: strictly 2 to 4 sentences (approx 40-60 words).
    - Multi-turn context retained from previous conversation turns.
    - Integrates the voice backend agronomic knowledge rules (Irrigation, Rain, Fertilizer, Pest, Disease).
    - Returns dynamic contextual follow-up suggestions in the active language.
    """
    history = history or []
    q_lower = question.strip().lower()
    telemetry = _get_district_telemetry(block)

    # Normalize language code (e.g., 'en-IN' or 'en' -> 'en', 'hi-IN' or 'hi' -> 'hi', 'pa-IN' or 'pa' -> 'pa')
    lang_code = "pa" if "pa" in language.lower() else "hi" if "hi" in language.lower() else "en"
    active_crop = _detect_crop_override(question, crop)

    # 1. Try Live Gemini 2.0 if available and configured
    active_key = api_key or os.environ.get("GEMINI_API_KEY")
    if active_key and GENAI_AVAILABLE:
        try:
            client = genai.Client(api_key=active_key)
            system_instruction = (
                f"You are SAARTHI Kisan AI Copilot, an expert agricultural voice assistant for Punjab farmers trained on PAU (Punjab Agricultural University) agronomy standards. "
                f"Current field context: Block: {block}, Panchayat: {panchayat}, Crop: {active_crop}, Soil: {soil}. "
                f"Current telemetry: 7-day projected rain: {telemetry['rain_7d']}mm, dry days: {telemetry['dry_days_7d']}, "
                f"soil moisture: {telemetry['moisture']}%, temp: {telemetry['temp']}°C. "
                f"STRICT RULES:\n"
                f"1. Target strictly 2 to 4 sentences maximum (approx 40-60 words). Be direct, actionable, practical, and empathetic.\n"
                f"2. Never write bullet lists or long essays unless explicitly asked.\n"
                f"3. Language: Respond fluently in {'Punjabi (Gurmukhi script)' if lang_code == 'pa' else 'Hindi (Devanagari script)' if lang_code == 'hi' else 'English'}.\n"
                f"4. Provide exact fertilizer doses (splits), irrigation management (AWD / furrow), weed or pest control (active chemicals and dosage), and sowing windows tailored to {active_crop}."
            )

            # Build multi-turn context
            conversation_context = ""
            for turn in history[-4:]:  # last 4 turns
                role = "Farmer" if turn.get("role") == "user" else "SAARTHI"
                conversation_context += f"{role}: {turn.get('text', '')}\n"

            prompt = f"{conversation_context}Farmer: {question}\nSAARTHI (strictly 2-4 sentences):"
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt,
                config=genai.types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.3,
                    max_output_tokens=180,
                )
            )
            raw_text = (response.text or "").strip()
            if raw_text:
                suggestions = _generate_contextual_suggestions(q_lower, lang_code, active_crop)
                return {
                    "answer": raw_text,
                    "suggestions": suggestions,
                    "model_used": "Gemini 2.0 Flash (Cloud Live)",
                    "language": lang_code,
                    "crop": active_crop,
                }
        except Exception:
            # Fall back cleanly to the integrated agronomic knowledge engine
            pass

    # 2. Integrated Agricultural Domain Rules & Hyperlocal Reasoning Engine (from backend/server.js + PAU models)
    answer, suggestions = _resolve_local_agronomy_chat(
        question=question,
        lang=lang_code,
        telemetry=telemetry,
        block=block,
        panchayat=panchayat,
        crop=active_crop,
        soil=soil,
        history=history,
    )

    return {
        "answer": answer,
        "suggestions": suggestions,
        "model_used": "Saarthi Hyperlocal Agronomy Engine",
        "language": lang_code,
        "crop": active_crop,
    }


def _detect_crop_override(query: str, default_crop: str) -> str:
    """Detects whether the farmer explicitly mentioned another crop in their query."""
    q = query.lower()
    if any(w in q for w in ["pr-126", "pr126", "126"]):
        return "Paddy (PR-126)"
    if any(w in q for w in ["pusa-44", "pusa44", "44"]):
        return "Paddy (Pusa-44)"
    if any(w in q for w in ["basmati", "1121", "1509", "1847", "ਬਾਸਮਤੀ", "बासमती"]):
        return "Basmati"
    if any(w in q for w in ["cotton", "narma", "kapas", "ਕਪਾਹ", "ਨਰਮਾ", "कपास", "नरमा"]):
        return "Cotton"
    if any(w in q for w in ["maize", "corn", "makki", "makka", "ਮੱਕੀ", "मक्का"]):
        return "Maize"
    if any(w in q for w in ["wheat", "kanak", "gehun", "gehu", "ਕਣਕ", "गेहूं", "गेहु"]):
        return "Wheat"
    if any(w in q for w in ["sugarcane", "ganna", "kamad", "ਕਮਾਦ", "ਗੰਨਾ", "गन्ना"]):
        return "Sugarcane"
    if any(w in q for w in ["paddy", "dhan", "chawal", "ਝੋਨਾ", "ਚਾਵਲ", "धान", "चावल"]):
        if "pusa" in default_crop.lower():
            return "Paddy (Pusa-44)"
        if "basmati" in default_crop.lower():
            return "Basmati"
        return "Paddy (PR-126)"
    return default_crop or "Paddy (PR-126)"


def _resolve_local_agronomy_chat(
    question: str,
    lang: str,
    telemetry: dict,
    block: str,
    panchayat: str,
    crop: str,
    soil: str,
    history: list[dict],
) -> tuple[str, list[str]]:
    """Evaluates the agricultural query against Punjab conditions and returns 2-4 concise sentences + suggestions."""
    q = question.lower()
    rain_7d = telemetry["rain_7d"]
    moisture = telemetry["moisture"]
    dry_days = telemetry["dry_days_7d"]

    # Detect primary agronomic topic
    is_irrigation = any(k in q for k in ["irrigat", "irritat", "water", "paani", "pani", "ਪਾਣੀ", "ਸਿੰਚਾਈ", "ਸਿੰਜਾਈ", "सिंचाई", "पलेवा", "ਰੌਣੀ", "ਪਾਣੀ"])
    is_rain = any(k in q for k in ["rain", "barish", "monsoon", "weather", "dry spell", "ਮੀਂਹ", "ਬਾਰਿਸ਼", "ਵਰਖਾ", "ਬਾਰਿਸ਼", "बारिश", "वर्षा", "मौसम"])
    is_fertilizer = any(k in q for k in ["fertiliz", "urea", "dap", "npk", "khad", "khat", "nitrogen", "zinc", "potash", "ਖਾਦ", "ਉਰਵਰਕ", "ਯੂਰੀਆ", "ਜ਼ਿੰਕ", "खाद", "उर्वरक", "यूरिया", "जिंक"])
    is_pest = any(k in q for k in ["pest", "insect", "keeda", "keede", "kida", "bug", "attack", "spray", "whitefly", "bollworm", "ਕੀੜੇ", "ਕੀੜਾ", "ਸੁੰਡੀ", "ਮੱਖੀ", "ਸਪਰੇਅ", "कीट", "कीड़ा", "कीड़े", "सुंडी", "मक्खी", "छिड़काव"])
    is_disease = any(k in q for k in ["disease", "fungus", "yellow", "blast", "blight", "rot", "infection", "rust", "ਬਿਮਾਰੀ", "ਬੀਮਾਰੀ", "ਰੋਗ", "ਪੀਲਾ", "ਕੁੰਗੀ", "ਬਲਾਸਟ", "बीमारी", "रोग", "पीलापन", "कुंगी", "ब्लास्ट"])
    is_sow = any(k in q for k in ["sow", "sowing", "bijai", "lagana", "plant", "transplant", "nursery", "seed", "variety", "ਬਿਜਾਈ", "ਬੀਜ", "ਪਨੀਰੀ", "ਕਿਸਮ", "ਬੀਜਾਈ", "बुवाई", "बीज", "रोपाई", "नर्सरी", "किस्म"])

    # Fallback to history topic if follow-up question is terse (e.g. "and for basmati?", "when should i do it?")
    if not (is_irrigation or is_rain or is_fertilizer or is_pest or is_disease or is_sow) and history:
        last_turn = history[-1].get("text", "").lower()
        if any(k in last_turn for k in ["irrigat", "water", "ਪਾਣੀ", "सिंचाई"]):
            is_irrigation = True
        elif any(k in last_turn for k in ["fertiliz", "urea", "khad", "ਖਾਦ", "खाद"]):
            is_fertilizer = True
        elif any(k in last_turn for k in ["pest", "spray", "keeda", "ਕੀੜੇ", "कीट"]):
            is_pest = True
        elif any(k in last_turn for k in ["sow", "plant", "ਬਿਜਾਈ", "बुवाई"]):
            is_sow = True

    crop_lower = crop.lower()
    is_pr126 = "pr-126" in crop_lower or "126" in crop_lower
    is_pusa44 = "pusa" in crop_lower or "44" in crop_lower
    is_basmati = "basmati" in crop_lower
    is_cotton = "cotton" in crop_lower
    is_maize = "maize" in crop_lower
    is_wheat = "wheat" in crop_lower
    is_sugarcane = "sugarcane" in crop_lower

    # ==================== PUNJABI ADVISORY (GURMUKHI) ====================
    if lang == "pa":
        if is_sow:
            if is_pr126:
                ans = f"PR-126 ਦੀ 25 ਤੋਂ 30 ਦਿਨਾਂ ਦੀ ਪਨੀਰੀ ਦੀ ਲੁਆਈ 25 ਜੂਨ ਤੋਂ 10 ਜੁਲਾਈ ਦਰਮਿਆਨ ਸਭ ਤੋਂ ਵਧੀਆ ਰਹਿੰਦੀ ਹੈ। ਨਰਸਰੀ ਲਈ ਪ੍ਰਤੀ ਏਕੜ 4-5 ਕਿਲੋ ਬੀਜ ਨੂੰ ਉੱਲੀਨਾਸ਼ਕ ਦਵਾਈ ਨਾਲ ਸੋਧ ਕੇ ਹੀ ਬੀਜੋ। ਸਮੇਂ ਤੋਂ ਬਹੁਤ ਪਹਿਲਾਂ ਲੁਆਈ ਕਰਨ ਨਾਲ ਫ਼ਸਲ ਦਾ ਬੇਲੋੜਾ ਵਾਧਾ ਅਤੇ ਕੀੜਿਆਂ ਦਾ ਹਮਲਾ ਵੱਧਦਾ ਹੈ।"
            elif is_pusa44:
                ans = f"ਪੂਸਾ-44 ਲੰਮੇ ਸਮੇਂ (160 ਦਿਨ) ਦੀ ਕਿਸਮ ਹੈ, ਇਸ ਲਈ ਕਣਕ ਦੀ ਸਮੇਂ ਸਿਰ ਬਿਜਾਈ ਯਕੀਨੀ ਬਣਾਉਣ ਲਈ ਇਸ ਦੀ ਲੁਆਈ 20 ਜੂਨ ਤੋਂ ਪਹਿਲਾਂ ਮੁਕੰਮਲ ਕਰੋ। 30 ਦਿਨਾਂ ਦੀ ਤੰਦਰੁਸਤ ਪਨੀਰੀ ਲਗਾਓ ਅਤੇ ਜੜ੍ਹ ਗਲਣ ਤੋਂ ਬਚਾਅ ਲਈ ਸੋਧਿਆ ਬੀਜ ਹੀ ਵਰਤੋ। ਮਈ ਦੇ ਅੱਧ ਤੱਕ ਪਨੀਰੀ ਦੀ ਬਿਜਾਈ ਸ਼ੁਰੂ ਕਰ ਲੈਣੀ ਚਾਹੀਦੀ ਹੈ।"
            elif is_basmati:
                ans = f"ਬਾਸਮਤੀ (PB-1121 ਅਤੇ 1509) ਦੀ ਪਨੀਰੀ ਲਾਉਣ ਦਾ ਸਹੀ ਸਮਾਂ 1 ਤੋਂ 15 ਜੁਲਾਈ ਹੈ। ਜੁਲਾਈ ਵਿੱਚ ਲੁਆਈ ਕਰਨ ਨਾਲ ਫ਼ਸਲ ਅਕਤੂਬਰ ਦੇ ਠੰਢੇ ਮੌਸਮ ਵਿੱਚ ਨਿਸਰਦੀ ਹੈ, ਜਿਸ ਨਾਲ ਚੌਲਾਂ ਦੀ ਖ਼ੁਸ਼ਬੂ ਅਤੇ ਲੰਬਾਈ ਸਭ ਤੋਂ ਵਧੀਆ ਬਣਦੀ ਹੈ। ਪੈਰ ਗਲਣ (ਬਕਾਨੇ ਰੋਗ) ਤੋਂ ਬਚਣ ਲਈ ਬੀਜ ਨੂੰ ਕਾਰਬੈਂਡਾਜ਼ਿਮ ਜਾਂ ਟਰਾਈਕੋਡਰਮਾ ਨਾਲ ਸੋਧੋ।"
            elif is_cotton:
                ans = f"ਕਪਾਹ ਅਤੇ ਨਰਮੇ ਦੀ ਬਿਜਾਈ 15 ਅਪ੍ਰੈਲ ਤੋਂ 15 ਮਈ ਦਰਮਿਆਨ ਨਹਿਰੀ ਪਾਣੀ ਦੇ ਰੌਣੀ ਕਰਕੇ ਕਰਨੀ ਚਾਹੀਦੀ ਹੈ। ਬੂਟੇ ਤੋਂ ਬੂਟੇ ਦਾ ਫ਼ਾਸਲਾ 60 ਸੈਂਟੀਮੀਟਰ ਅਤੇ ਕਤਾਰਾਂ ਵਿਚਕਾਰ 67.5 ਸੈਂਟੀਮੀਟਰ ਰੱਖੋ। ਬੀਟੀ ਕਾਟਨ ਦਾ ਪ੍ਰਮਾਣਿਤ ਬੀਜ ਹੀ ਵਰਤੋ ਤਾਂ ਜੋ ਪੁੰਗਰਨ ਵਧੀਆ ਹੋਵੇ।"
            elif is_maize:
                ans = f"ਖ਼ਰੀਫ਼ ਮੱਕੀ (PMH-1, PMH-2) ਦੀ ਬਿਜਾਈ ਮਈ ਦੇ ਆਖ਼ਰੀ ਹਫ਼ਤੇ ਤੋਂ ਜੂਨ ਦੇ ਅੰਤ ਤੱਕ ਕਰੋ। ਪਾਣੀ ਖੜ੍ਹਨ ਤੋਂ ਬਚਾਅ ਲਈ ਮੱਕੀ ਦੀ ਬਿਜਾਈ ਵੱਟਾਂ ਉੱਤੇ 60 ਸੈਂਟੀਮੀਟਰ ਦੀ ਦੂਰੀ 'ਤੇ ਕਰੋ। ਪ੍ਰਤੀ ਏਕੜ 8 ਕਿਲੋ ਬੀਜ ਨੂੰ ਸੋਧ ਕੇ ਹੀ ਬੀਜੋ ਤਾਂ ਜੋ ਜੜ੍ਹਾਂ ਮਜ਼ਬੂਤ ਰਹਿਣ।"
            elif is_wheat:
                ans = f"ਕਣਕ (HD-2967, PBW-725) ਦੀ ਬਿਜਾਈ ਲਈ ਸਭ ਤੋਂ ਵਧੀਆ ਸਮਾਂ 1 ਤੋਂ 15 ਨਵੰਬਰ ਹੈ। ਹੈਪੀ ਸੀਡਰ ਜਾਂ ਸੁਪਰ ਸੀਡਰ ਰਾਹੀਂ ਝੋਨੇ ਦੇ ਪਰਾਲੀ ਵਿੱਚ ਸਿੱਧੀ ਬਿਜਾਈ ਕਰਨ ਨਾਲ ਪਾਣੀ ਅਤੇ ਖ਼ਰਚੇ ਦੀ ਵੱਡੀ ਬੱਚਤ ਹੁੰਦੀ ਹੈ। ਪ੍ਰਤੀ ਏਕੜ 40-45 ਕਿਲੋ ਬੀਜ ਦੀ ਵਰਤੋਂ ਕਰੋ।"
            elif is_sugarcane:
                ans = f"ਕਮਾਦ (ਗੰਨਾ) ਦੀ ਪਤਝੜ ਬਿਜਾਈ ਸਤੰਬਰ-ਅਕਤੂਬਰ ਅਤੇ ਬਸੰਤ ਬਿਜਾਈ ਫ਼ਰਵਰੀ-ਮਾਰਚ ਵਿੱਚ ਖਾਲੀਆਂ (ਟਰੈਂਚ) ਵਿਧੀ ਰਾਹੀਂ 4 ਫੁੱਟ ਦੇ ਫ਼ਾਸਲੇ 'ਤੇ ਕਰੋ। ਸਿਰਫ਼ ਸਿਹਤਮੰਦ 2-3 ਅੱਖਾਂ ਵਾਲੀਆਂ ਪੋਰੀਆਂ ਹੀ ਬੀਜੋ ਅਤੇ ਬੀਜ ਨੂੰ ਕਾਰਬੈਂਡਾਜ਼ਿਮ ਨਾਲ ਸੋਧੋ।"
            else:
                ans = f"{panchayat} ਵਿਖੇ {crop} ਦੀ ਬਿਜਾਈ ਲਈ ਜ਼ਮੀਨੀ ਨਮੀ {moisture}% ਅਨੁਕੂਲ ਹੈ। ਪ੍ਰਮਾਣਿਤ ਬੀਜ ਨੂੰ ਉੱਲੀਨਾਸ਼ਕ ਦਵਾਈ ਨਾਲ ਸੋਧ ਕੇ ਅਗਲੇ 4-5 ਦਿਨਾਂ ਵਿੱਚ ਬਿਜਾਈ ਮੁਕੰਮਲ ਕਰੋ।"
            sugg = [f"{crop} ਲਈ ਖਾਦ ਦੀ ਕਿੰਨੀ ਮਾਤਰਾ ਪਾਈਏ?", f"{crop} ਵਿੱਚ ਪਾਣੀ ਕਦੋਂ ਲਗਾਈਏ?", "ਕੀੜਿਆਂ ਤੋਂ ਬਚਾਅ ਲਈ ਕਿਹੜੀ ਸਪਰੇਅ ਕਰੀਏ?"]

        elif is_irrigation:
            if is_pr126:
                ans = f"PR-126 ਲਈ ਪਹਿਲੇ 15 ਦਿਨ ਹੀ ਖੇਤ ਵਿੱਚ 2 ਇੰਚ ਪਾਣੀ ਖੜ੍ਹਾ ਰੱਖੋ। ਇਸ ਮਗਰੋਂ ਬਦਲਵੀਂ ਸੁਕਾਈ ਵਿਧੀ (AWD) ਅਪਣਾਓ ਅਤੇ ਪਾਣੀ ਜ਼ਮੀਨ ਵਿੱਚ ਜੀਰਨ ਦੇ 2 ਦਿਨਾਂ ਬਾਅਦ ਹੀ ਨਵਾਂ ਪਾਣੀ ਲਗਾਓ। ਇਸ ਤਕਨੀਕ ਨਾਲ 25 ਤੋਂ 30 ਫ਼ੀਸਦੀ ਪਾਣੀ ਦੀ ਬੱਚਤ ਹੁੰਦੀ ਹੈ।"
            elif is_pusa44:
                ans = f"ਪੂਸਾ-44 ਫ਼ਸਲ ਪਾਣੀ ਦੀ ਜ਼ਿਆਦਾ ਖਪਤ ਮੰਗਦੀ ਹੈ ਅਤੇ ਇਸ ਨੂੰ ਕੁੱਲ 25 ਤੋਂ 30 ਪਾਣੀਆਂ ਦੀ ਲੋੜ ਪੈਂਦੀ ਹੈ। ਨਿਸਰਣ ਅਤੇ ਦੋਧੇ ਭਰਨ ਵੇਲੇ ਖੇਤ ਨੂੰ ਸੁੱਕਣ ਨਾ ਦਿਓ ਅਤੇ ਨਮੀ ਲਗਾਤਾਰ ਬਣਾਈ ਰੱਖੋ। ਇਸ ਨਾਜ਼ੁਕ ਸਮੇਂ ਪਾਣੀ ਦੀ ਕਿੱਲਤ ਨਾਲ ਝੋਨੇ ਦਾ ਫੋਕੜ ਬਣਦਾ ਹੈ।"
            elif is_basmati:
                ans = f"ਬਾਸਮਤੀ ਵਿੱਚ ਪਹਿਲੇ 10 ਦਿਨ ਹਲਕਾ ਪਾਣੀ ਰੱਖੋ ਅਤੇ ਉਸ ਤੋਂ ਬਾਅਦ 2-3 ਦਿਨਾਂ ਦੇ ਵਕਫ਼ੇ ਨਾਲ ਸਿੰਚਾਈ ਕਰੋ। ਨਿਸਰਣ ਅਤੇ ਦੁੱਧ ਪੈਣ ਸਮੇਂ ਖੇਤ ਵਿੱਚ ਨਮੀ ਬਣਾਈ ਰੱਖੋ, ਪਰ ਵਾਢੀ ਤੋਂ 15 ਦਿਨ ਪਹਿਲਾਂ ਪਾਣੀ ਪੂਰੀ ਤਰ੍ਹਾਂ ਬੰਦ ਕਰ ਦਿਓ। ਖੇਤ ਵਿੱਚ ਜ਼ਿਆਦਾ ਪਾਣੀ ਨਾ ਖੜ੍ਹਾ ਕਰੋ ਤਾਂ ਜੋ ਫ਼ਸਲ ਡਿੱਗਣ ਤੋਂ ਬਚੀ ਰਹੇ।"
            elif is_cotton:
                ans = f"ਕਪਾਹ ਨੂੰ ਪਹਿਲਾ ਪਾਣੀ ਬਿਜਾਈ ਤੋਂ 4 ਤੋਂ 6 ਹਫ਼ਤਿਆਂ ਬਾਅਦ ਲਗਾਓ। ਜੁਲਾਈ-ਅਗਸਤ ਦੇ ਭਾਰੀ ਮੀਂਹਾਂ ਦੌਰਾਨ ਖੇਤ ਵਿੱਚੋਂ ਵਾਧੂ ਪਾਣੀ ਕੱਢਣ ਦਾ ਪ੍ਰਬੰਧ ਰੱਖੋ ਕਿਉਂਕਿ ਪਾਣੀ ਖੜ੍ਹਨ ਨਾਲ ਪੈਰਾਵਿਲਟ (ਮੁਰਝਾਉਣ) ਦੀ ਸਮੱਸਿਆ ਆਉਂਦੀ ਹੈ। ਫੁੱਲ ਖਿੜਨ ਵੇਲੇ ਹਲਕਾ ਪਾਣੀ ਹੀ ਲਗਾਓ।"
            elif is_maize:
                ans = f"ਮੱਕੀ ਦੀ ਫ਼ਸਲ ਪਾਣੀ ਖੜ੍ਹਨ ਨੂੰ ਬਿਲਕੁਲ ਬਰਦਾਸ਼ਤ ਨਹੀਂ ਕਰਦੀ; ਭਾਰੀ ਮੀਂਹ ਪੈਣ 'ਤੇ 6 ਘੰਟਿਆਂ ਦੇ ਅੰਦਰ ਪਾਣੀ ਨਿਕਾਸ ਯਕੀਨੀ ਬਣਾਓ। ਗੋਡੇ-ਗੋਡੇ ਹੋਣ ਵੇਲੇ ਅਤੇ ਛੱਲੀਆਂ 'ਤੇ ਬੂਰ (ਟੈਸਲਿੰਗ) ਪੈਣ ਸਮੇਂ ਪਾਣੀ ਦੀ ਘਾਟ ਨਾ ਆਉਣ ਦਿਓ।"
            elif is_wheat:
                ans = f"ਕਣਕ ਨੂੰ ਪਹਿਲਾ ਪਾਣੀ ਬਿਜਾਈ ਤੋਂ 21 ਦਿਨਾਂ ਬਾਅਦ (ਸੀ.ਆਰ.ਆਈ. ਸਟੇਜ) ਲਗਾਉਣਾ ਬਹੁਤ ਜ਼ਰੂਰੀ ਹੈ। ਕੁੱਲ 4-5 ਹਲਕੇ ਪਾਣੀ ਲਗਾਓ ਅਤੇ ਦਾਣਾ ਪੱਕਣ ਸਮੇਂ ਤੇਜ਼ ਹਵਾ ਚੱਲਣ 'ਤੇ ਪਾਣੀ ਨਾ ਲਗਾਓ ਤਾਂ ਜੋ ਫ਼ਸਲ ਡਿੱਗਣ ਤੋਂ ਬਚੀ ਰਹੇ।"
            elif is_sugarcane:
                ans = f"ਗਰਮੀਆਂ ਵਿੱਚ ਕਮਾਦ ਨੂੰ ਹਰ 10-12 ਦਿਨਾਂ ਬਾਅਦ ਪਾਣੀ ਲਗਾਓ। ਖੇਤ ਦੀਆਂ ਵੱਟਾਂ ਵਿਚਕਾਰ ਗੰਨੇ ਦੀ ਸੁੱਕੀ ਪੱਤੀ (ਟਰੈਸ਼ ਮਲਚਿੰਗ) ਵਿਛਾਉਣ ਨਾਲ ਨਮੀ ਬਣੀ ਰਹਿੰਦੀ ਹੈ ਅਤੇ 3-4 ਸਿੰਚਾਈਆਂ ਦੀ ਬੱਚਤ ਹੁੰਦੀ ਹੈ।"
            else:
                ans = f"ਤੁਹਾਡੇ ਖੇਤ ਵਿੱਚ ਮੌਜੂਦਾ ਨਮੀ {moisture}% ਹੈ ਅਤੇ 7 ਦਿਨਾਂ ਦਾ ਮੀਂਹ {rain_7d} ਮਿ.ਮੀ. ਹੈ। {crop} ਲਈ ਸ਼ਾਮ ਵੇਲੇ ਹਲਕੀ ਸਿੰਚਾਈ ਕਰੋ ਤਾਂ ਜੋ ਭਾਫ਼ ਬਣ ਕੇ ਪਾਣੀ ਅਜਾਈਂ ਨਾ ਜਾਵੇ।"
            sugg = [f"{crop} ਲਈ ਖਾਦ ਕਦੋਂ ਪਾਈਏ?", "ਕੀ ਅਗਲੇ ਹਫ਼ਤੇ ਮੀਂਹ ਪਵੇਗਾ?", "ਕੀੜਿਆਂ ਦਾ ਕੀ ਹੱਲ ਹੈ?"]

        elif is_fertilizer:
            if is_pr126:
                ans = f"PR-126 ਨੂੰ ਪ੍ਰਤੀ ਏਕੜ 90 ਕਿਲੋ ਯੂਰੀਆ ਤਿੰਨ ਬਰਾਬਰ ਕਿਸ਼ਤਾਂ ਵਿੱਚ ਪਾਓ: ਤੀਜਾ ਹਿੱਸਾ ਕੱਦੂ ਵੇਲੇ, ਤੀਜਾ ਹਿੱਸਾ 21 ਦਿਨਾਂ 'ਤੇ ਅਤੇ ਆਖ਼ਰੀ ਹਿੱਸਾ 42ਵੇਂ ਦਿਨ। ਕੱਦੂ ਕਰਨ ਵੇਲੇ 25 ਕਿਲੋ ਜ਼ਿੰਕ ਸਲਫ਼ੇਟ (21%) ਜ਼ਰੂਰ ਪਾਓ ਤਾਂ ਜੋ ਬੂਟਾ ਵਧੀਆ ਫੋੜ ਮਾਰੇ। 45 ਦਿਨਾਂ ਤੋਂ ਬਾਅਦ ਯੂਰੀਆ ਕਦੇ ਨਾ ਪਾਓ।"
            elif is_pusa44:
                ans = f"ਪੂਸਾ-44 ਵਿੱਚ ਲੁਆਈ ਦੇ 45 ਦਿਨਾਂ ਦੇ ਅੰਦਰ ਪ੍ਰਤੀ ਏਕੜ 110 ਕਿਲੋ ਯੂਰੀਆ ਤਿੰਨ ਕਿਸ਼ਤਾਂ ਵਿੱਚ ਅਤੇ 25 ਕਿਲੋ ਜ਼ਿੰਕ ਸਲਫ਼ੇਟ ਪਾਓ। ਪੀਲਾਪਣ ਦੇਖ ਕੇ ਵਾਧੂ ਯੂਰੀਆ ਨਾ ਪਾਓ ਕਿਉਂਕਿ ਪੂਸਾ-44 ਉੱਤੇ ਪੱਤਾ ਝੁਲਸ ਰੋਗ ਬਹੁਤ ਛੇਤੀ ਪੈਂਦਾ ਹੈ। ਤਣੇ ਦੀ ਮਜ਼ਬੂਤੀ ਲਈ 30 ਕਿਲੋ ਪੋਟਾਸ਼ ਪ੍ਰਤੀ ਏਕੜ ਵਰਤੋ।"
            elif is_basmati:
                ans = f"ਬਾਸਮਤੀ ਨੂੰ ਘੱਟ ਨਾਈਟ੍ਰੋਜਨ ਦੀ ਲੋੜ ਹੁੰਦੀ ਹੈ: ਪ੍ਰਤੀ ਏਕੜ ਸਿਰਫ਼ 54 ਕਿਲੋ ਯੂਰੀਆ ਦੋ ਕਿਸ਼ਤਾਂ ਵਿੱਚ (ਲੁਆਈ ਵੇਲੇ ਅਤੇ 21ਵੇਂ ਦਿਨ) ਪਾਓ। ਜ਼ਿਆਦਾ ਯੂਰੀਆ ਪਾਉਣ ਨਾਲ ਬੂਟੇ ਕਮਜ਼ੋਰ ਹੋ ਕੇ ਡਿੱਗ ਪੈਂਦੇ ਹਨ ਅਤੇ ਧੌਣ-ਮਰੋੜ ਦੀ ਬਿਮਾਰੀ ਵੱਧਦੀ ਹੈ। ਕੱਦੂ ਵੇਲੇ 15 ਕਿਲੋ ਜ਼ਿੰਕ ਸਲਫ਼ੇਟ ਜ਼ਰੂਰ ਪਾਓ।"
            elif is_cotton:
                ans = f"ਕਪਾਹ ਲਈ ਪ੍ਰਤੀ ਏਕੜ 90 ਕਿਲੋ ਯੂਰੀਆ, 60 ਕਿਲੋ ਸਿੰਗਲ ਸੁਪਰ ਫ਼ਾਸਫ਼ੇਟ ਅਤੇ 20 ਕਿਲੋ ਪੋਟਾਸ਼ ਪਾਓ। ਫੁੱਲ ਖਿੜਨ ਅਤੇ ਟੀਂਡੇ ਬਣਨ ਸਮੇਂ ਹਫ਼ਤੇ-ਹਫ਼ਤੇ ਦੇ ਵਕਫ਼ੇ 'ਤੇ 2% ਪੋਟਾਸ਼ੀਅਮ ਨਾਈਟ੍ਰੇਟ (13:0:45) ਦੀਆਂ 4 ਸਪਰੇਆਂ ਕਰੋ।"
            elif is_maize:
                ans = f"ਮੱਕੀ ਲਈ ਪ੍ਰਤੀ ਏਕੜ 110 ਕਿਲੋ ਯੂਰੀਆ, 55 ਕਿਲੋ ਡੀ.ਏ.ਪੀ. ਅਤੇ 20 ਕਿਲੋ ਪੋਟਾਸ਼ ਦੀ ਸਿਫ਼ਾਰਿਸ਼ ਹੈ। ਯੂਰੀਆ ਦੀ ਵਰਤੋਂ ਤਿੰਨ ਵਾਰ ਕਰੋ: ਇੱਕ ਤਿਹਾਈ ਬਿਜਾਈ ਸਮੇਂ, ਇੱਕ ਤਿਹਾਈ ਗੋਡੇ-ਗੋਡੇ ਕੱਦ ਵੇਲੇ ਅਤੇ ਇੱਕ ਤਿਹਾਈ ਬੂਰ ਪੈਣ ਸਮੇਂ।"
            elif is_wheat:
                ans = f"ਕਣਕ ਲਈ ਪ੍ਰਤੀ ਏਕੜ 110 ਕਿਲੋ ਯੂਰੀਆ ਅਤੇ 55 ਕਿਲੋ ਡੀ.ਏ.ਪੀ. ਪਾਓ। ਅੱਧੀ ਯੂਰੀਆ ਅਤੇ ਪੂਰੀ ਡੀ.ਏ.ਪੀ. ਬਿਜਾਈ ਸਮੇਂ ਡਰਿੱਲ ਕਰੋ; ਬਾਕੀ ਰਹਿੰਦੀ ਅੱਧੀ ਯੂਰੀਆ ਪਹਿਲੇ ਅਤੇ ਦੂਜੇ ਪਾਣੀ ਤੋਂ ਪਹਿਲਾਂ ਦੋ ਕਿਸ਼ਤਾਂ ਵਿੱਚ ਖਿਲਾਰੋ।"
            elif is_sugarcane:
                ans = f"ਕਮਾਦ ਲਈ ਪ੍ਰਤੀ ਏਕੜ 150 ਕਿਲੋ ਯੂਰੀਆ, 75 ਕਿਲੋ ਡੀ.ਏ.ਪੀ. ਅਤੇ 40 ਕਿਲੋ ਪੋਟਾਸ਼ ਪਾਓ। ਯੂਰੀਆ ਦੀ ਸਾਰੀ ਮਾਤਰਾ ਜੂਨ ਦੇ ਅਖ਼ੀਰ ਤੱਕ ਤਿੰਨ ਕਿਸ਼ਤਾਂ ਵਿੱਚ ਪਾ ਕੇ ਮੁਕੰਮਲ ਕਰ ਲਵੋ ਤਾਂ ਜੋ ਮਿਠਾਸ ਵਧੀਆ ਬਣੇ।"
            else:
                ans = f"{crop} ਲਈ ਖਾਦ ਹਮੇਸ਼ਾ ਜ਼ਮੀਨ ਵਿੱਚ ਲੋੜੀਂਦੀ ਨਮੀ ਹੋਣ 'ਤੇ ਹੀ ਪਾਓ। ਯੂਰੀਆ ਦਾ ਛਿੜਕਾਅ ਸ਼ਾਮ ਵੇਲੇ ਕਰੋ ਤਾਂ ਜੋ ਗੈਸ ਬਣ ਕੇ ਨੁਕਸਾਨ ਨਾ ਹੋਵੇ।"
            sugg = ["ਕੀ ਖਾਦ ਤੋਂ ਬਾਅਦ ਪਾਣੀ ਲਾਉਣਾ ਚਾਹੀਦਾ ਹੈ?", f"{crop} ਵਿੱਚ ਕੀੜਿਆਂ ਦੀ ਰੋਕਥਾਮ?", "ਮੀਂਹ ਦੀ ਭਵਿੱਖਬਾਣੀ ਕੀ ਹੈ?"]

        elif is_pest or is_disease:
            if is_cotton:
                ans = f"ਚਿੱਟੀ ਮੱਖੀ ਦਾ ਹਮਲਾ ਆਰਥਿਕ ਹੱਦ (6-8 ਮੱਖੀਆਂ ਪ੍ਰਤੀ ਪੱਤਾ) ਟੱਪਣ 'ਤੇ ਫ਼ਲੋਨਿਕਾਮਿਡ 50 WG (80 ਗ੍ਰਾਮ ਪ੍ਰਤੀ ਏਕੜ) ਦੀ ਸਪਰੇਅ ਕਰੋ। ਗੁਲਾਬੀ ਸੁੰਡੀ ਦੀ ਨਿਗਰਾਨੀ ਲਈ 5 ਫ਼ੀਰੋਮੋਨ ਟਰੈਪ ਪ੍ਰਤੀ ਏਕੜ ਲਗਾਓ ਅਤੇ ਨੁਕਸਾਨ ਦਿਖਣ 'ਤੇ ਪ੍ਰੋਕਲੇਮ 100 ਗ੍ਰਾਮ ਛਿੜਕੋ।"
            elif is_wheat:
                ans = f"ਕਣਕ ਵਿੱਚ ਪੀਲੀ ਕੁੰਗੀ ਦੇ ਪੀਲੇ ਧੂੜ ਵਰਗੇ ਧੱਬੇ ਦਿਖਣ 'ਤੇ ਤੁਰੰਤ ਪ੍ਰੋਪੀਕੋਨਾਜ਼ੋਲ 25 EC (ਟਿਲਟ 200 ਮਿ.ਲੀ. ਪ੍ਰਤੀ ਏਕੜ) 200 ਲੀਟਰ ਪਾਣੀ ਵਿੱਚ ਮਿਲਾ ਕੇ ਛਿੜਕੋ। ਗੁੱਲੀ ਡੰਡੇ (ਨਦੀਨ) ਦੀ ਰੋਕਥਾਮ ਲਈ ਪਿਨੌਕਸਾਡੇਨ 5 EC (400 ਮਿ.ਲੀ.) ਦੀ ਸਪਰੇਅ ਕਰੋ।"
            elif is_pr126 or is_pusa44:
                ans = f"ਤਣਾ ਛੇਦਕ ਜਾਂ ਪੱਤਾ ਲਪੇਟ ਸੁੰਡੀ ਦਿਖਣ 'ਤੇ ਕਲੋਰੈਂਟਰਾਨਿਲੀਪਰੋਲ 18.5 SC (ਕੋਰਾਜਨ 60 ਮਿ.ਲੀ. ਪ੍ਰਤੀ ਏਕੜ) 100 ਲੀਟਰ ਪਾਣੀ ਵਿੱਚ ਮਿਲਾ ਕੇ ਸਪਰੇਅ ਕਰੋ। ਸ਼ੀਥ ਬਲਾਈਟ (ਉੱਲੀ ਰੋਗ) ਦੀ ਰੋਕਥਾਮ ਲਈ ਟਿਲਟ 200 ਮਿ.ਲੀ. ਪ੍ਰਤੀ ਏਕੜ ਸਾਫ਼ ਮੌਸਮ ਵਿੱਚ ਛਿੜਕੋ।"
            elif is_basmati:
                ans = f"ਬਾਸਮਤੀ ਨੂੰ ਧੌਣ-ਮਰੋੜ (ਨੈੱਕ ਬਲਾਸਟ) ਤੋਂ ਬਚਾਉਣ ਲਈ ਨਿਸਰਣ ਸਮੇਂ ਟਰਾਈਸਾਈਕਲਾਜ਼ੋਲ 75 WP (120 ਗ੍ਰਾਮ ਪ੍ਰਤੀ ਏਕੜ) ਜਾਂ ਐਮੀਸਟਾਰ ਟਾਪ (200 ਮਿ.ਲੀ.) ਦਾ ਸਪਰੇਅ ਕਰੋ। ਜੇਕਰ ਪੱਤਾ ਲਪੇਟ ਸੁੰਡੀ ਵਧੇ ਤਾਂ ਫ਼ਲੂਬੈਂਡੀਆਮਾਈਡ 50 ਮਿ.ਲੀ. ਛਿੜਕੋ।"
            elif is_maize:
                ans = f"ਮੱਕੀ ਵਿੱਚ ਫ਼ਾਲ ਆਰਮੀਵਰਮ (ਲਸ਼ਕਰੀ ਸੁੰਡੀ) ਦੇ ਬਚਾਅ ਲਈ ਕੋਰਾਜਨ 18.5 SC (0.4 ਮਿ.ਲੀ. ਪ੍ਰਤੀ ਲੀਟਰ) ਜਾਂ ਪ੍ਰੋਕਲੇਮ 5 SG ਦਾ ਘੋਲ ਬੂਟਿਆਂ ਦੀਆਂ ਗੋਭਾਂ (ਪੱਤਿਆਂ ਦੇ ਵਿਚਕਾਰ) ਵਿੱਚ ਪਾਓ। ਸਪਰੇਅ ਸਵੇਰ ਜਾਂ ਸ਼ਾਮ ਵੇਲੇ ਹੀ ਕਰੋ।"
            elif is_sugarcane:
                ans = f"ਗੰਨੇ ਦੇ ਮੁੱਢ ਛੇਦਕ ਅਤੇ ਚੋਟੀ ਦੇ ਕੀੜੇ ਤੋਂ ਬਚਾਅ ਲਈ ਕੋਰਾਜਨ 18.5 SC (150 ਮਿ.ਲੀ. ਪ੍ਰਤੀ ਏਕੜ) ਗੰਨੇ ਦੀਆਂ ਜੜ੍ਹਾਂ ਨੇੜੇ ਪਾ ਕੇ ਹਲਕਾ ਪਾਣੀ ਲਗਾਓ। ਰੱਤਾ ਰੋਗ (ਰੈੱਡ ਰੌਟ) ਵਾਲੇ ਬੂਟੇ ਤੁਰੰਤ ਪੁੱਟ ਕੇ ਨਸ਼ਟ ਕਰੋ।"
            else:
                ans = f"{crop} ਵਿੱਚ ਕੀੜਿਆਂ ਜਾਂ ਉੱਲੀ ਦੀ ਜਾਂਚ ਪੱਤਿਆਂ ਦੇ ਹੇਠਾਂ ਕਰੋ। ਪੀ.ਏ.ਯੂ. ਵੱਲੋਂ ਸਿਫ਼ਾਰਿਸ਼ ਕੀਤੀ ਸਪਰੇਅ ਸ਼ਾਂਤ ਅਤੇ ਸਾਫ਼ ਮੌਸਮ ਵਿੱਚ ਹੀ ਕਰੋ।"
            sugg = ["ਕਿਹੜੀ ਦਵਾਈ ਦੀ ਸਪਰੇਅ ਕਰੀਏ?", "ਕੀ ਮੀਂਹ ਦਵਾਈ ਨੂੰ ਧੋ ਦੇਵੇਗਾ?", f"{crop} ਵਿੱਚ ਪਾਣੀ ਕਦੋਂ ਲਾਈਏ?"]

        elif is_rain:
            ans = f"{block} ਬਲਾਕ ਲਈ 7 ਦਿਨਾਂ ਦਾ ਮੀਂਹ ਅਨੁਮਾਨ {rain_7d} ਮਿਲੀਮੀਟਰ ਹੈ, ਜਿਸ ਵਿੱਚ ਲਗਭਗ {dry_days} ਦਿਨ ਖੁਸ਼ਕ ਰਹਿਣਗੇ। ਮੌਨਸੂਨ ਦੀ ਸਥਿਤੀ ਦੇਖਦੇ ਹੋਏ ਖੇਤਾਂ ਦੀਆਂ ਵੱਟਾਂ ਪੱਕੀਆਂ ਰੱਖੋ ਤਾਂ ਜੋ ਮੀਂਹ ਦਾ ਪਾਣੀ ਸਾਂਭਿਆ ਜਾ ਸਕੇ। ਭਾਰੀ ਮੀਂਹ ਦੀ ਚਿਤਾਵਨੀ ਦੌਰਾਨ ਕੋਈ ਵੀ ਸਪਰੇਅ ਜਾਂ ਯੂਰੀਆ ਨਾ ਪਾਓ।"
            sugg = [f"ਕੀ ਅੱਜ {crop} ਨੂੰ ਪਾਣੀ ਲਗਾਵਾਂ?", f"{crop} ਲਈ ਖਾਦ ਦੀ ਸਲਾਹ", "ਕੀੜਿਆਂ ਤੋਂ ਬਚਾਅ ਕਿਵੇਂ ਕਰੀਏ?"]

        else:
            ans = f"ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਕਿਸਾਨ ਵੀਰ ਜੀ! ਮੈਂ {block} ਬਲਾਕ ਲਈ ਤੁਹਾਡੀ {crop} ਫ਼ਸਲ ਬਾਰੇ ਮੌਸਮ, ਸਿੰਚਾਈ, ਖਾਦ ਅਤੇ ਕੀੜਿਆਂ ਦੀ ਰੋਕਥਾਮ ਦੀ ਪੂਰੀ ਸਲਾਹ ਦੇ ਸਕਦਾ ਹਾਂ। ਆਪਣਾ ਕੋਈ ਵੀ ਸਵਾਲ ਪੁੱਛੋ ਜਾਂ ਮਾਈਕ ਦਬਾ ਕੇ ਬੋਲੋ।"
            sugg = [f"{crop} ਲਈ ਖਾਦ ਦੀ ਕਿੰਨੀ ਮਾਤਰਾ ਪਾਈਏ?", f"{crop} ਵਿੱਚ ਪਾਣੀ ਕਦੋਂ ਲਗਾਈਏ?", "ਕੀੜਿਆਂ ਤੋਂ ਬਚਾਅ ਲਈ ਕਿਹੜੀ ਸਪਰੇਅ ਕਰੀਏ?"]

    # ==================== HINDI ADVISORY (DEVANAGARI) ====================
    elif lang == "hi":
        if is_sow:
            if is_pr126:
                ans = f"PR-126 की 25 से 30 दिन की पौध की रोपाई 25 जून से 10 जुलाई के बीच सबसे उत्तम रहती है। नर्सरी के लिए प्रति एकड़ 4-5 किलो बीज को फफूंदनाशी से उपचारित करके ही डालें। समय से बहुत पहले रोपाई करने से कीटों का प्रकोप और पानी का अनावश्यक खर्च बढ़ता है।"
            elif is_pusa44:
                ans = f"पूसा-44 लंबी अवधि (160 दिन) की किस्म है, इसलिए गेहूं की समय पर बिजाई के लिए इसकी रोपाई 20 जून से पहले पूरी कर लें। 30 दिन की स्वस्थ पौध लगाएं और जड़ गलन से बचाव के लिए उपचारित बीज का ही प्रयोग करें। नर्सरी की तैयारी मई के मध्य तक अवश्य शुरू कर देनी चाहिए।"
            elif is_basmati:
                ans = f"बासमती (PB-1121 और 1509) की रोपाई 1 से 15 जुलाई के बीच करना सबसे उपयुक्त है। जुलाई में रोपाई से फसल की बालियां अक्टूबर की ठंडी हवा में निकलती हैं, जिससे खुशबू और दाने की लंबाई बेहतरीन मिलती है। जड़ गलन से बचाव के लिए बीज को कार्बेन्डाजिम से 24 घंटे उपचारित करें।"
            elif is_cotton:
                ans = f"कपास और नरमा की बुवाई 15 अप्रैल से 15 मई के बीच नहरी पानी से पलेवा करके करें। कतार से कतार की दूरी 67.5 सेमी और पौधे से पौधा 60 सेमी रखें। अंकुरण सुनिश्चित करने के लिए प्रमाणित बीटी बीज का ही इस्तेमाल करें।"
            elif is_maize:
                ans = f"खरीफ मक्का (PMH-1) की बुवाई 25 मई से जून के अंत तक करें। जलभराव से बचाव के लिए मक्का को मेंड़ों पर 60 सेमी की दूरी पर बोएं। प्रति एकड़ 8 किलो बीज को कवकनाशी से उपचारित करके बोने से जड़ें स्वस्थ रहती हैं।"
            elif is_wheat:
                ans = f"गेहूं (HD-2967, PBW-725) की बुवाई का सर्वोत्तम समय 1 से 15 नवंबर है। हैप्पी सीडर या सुपर सीडर द्वारा धान की पराली में सीधी बुवाई करने से पानी और जुताई की भारी बचत होती है। प्रति एकड़ 40-45 किलो बीज का प्रयोग करें।"
            elif is_sugarcane:
                ans = f"गन्ना की शरदकालीन बुवाई सितंबर-अक्टूबर और बसंतकालीन बुवाई फरवरी-मार्च में 4 फीट चौड़ी खाइयों (ट्रेंच विधि) में करें। 2-3 आंख वाले रोगमुक्त टुकड़ों को कार्बेन्डाजिम से उपचारित करके ही लगाएं।"
            else:
                ans = f"{panchayat} में {crop} की बुवाई के लिए मिट्टी की नमी {moisture}% अनुकूल है। प्रमाणित बीज को उपचारित करके अगले 4-5 दिनों में बुवाई का काम पूरा करें।"
            sugg = [f"{crop} के लिए खाद की सही खुराक?", f"{crop} में सिंचाई कब करें?", "कीट नियंत्रण के लिए दवा?"]

        elif is_irrigation:
            if is_pr126:
                ans = f"PR-126 में रोपाई के बाद पहले 15 दिन ही खेत में 2 इंच पानी खड़ा रखें। इसके बाद 'एकान्तर गीला और सूखा' (AWD) पद्धति अपनाते हुए पानी सूखने के 2 दिन बाद ही पानी दें। इस तकनीक से 25 से 30 प्रतिशत पानी की बचत होती है।"
            elif is_pusa44:
                ans = f"पूसा-44 में पानी की खपत अधिक होती है और इसे कुल 25 से 30 सिंचाइयों की आवश्यकता पड़ती है। बालियां निकलने और फूल आने के नाजुक समय पर खेत में दरारें न पड़ने दें और हल्की नमी बनाए रखें। इस अवस्था में पानी की कमी से दाना खाली रह जाता है।"
            elif is_basmati:
                ans = f"बासमती में पहले 10 दिन हल्का पानी रखें, फिर 2-3 दिन के अंतराल पर सिंचाई करें। बालियां निकलते समय और दाना भरते समय मिट्टी में नमी बनाए रखें, पर कटाई से 15 दिन पहले पानी पूरी तरह बंद कर दें। खेत में अधिक पानी न भरने दें ताकि फसल गिरे नहीं।"
            elif is_cotton:
                ans = f"कपास को पहली सिंचाई बुवाई के 4 से 6 सप्ताह बाद ही दें। जुलाई-अगस्त की भारी बारिश में खेत से जल निकासी का उचित प्रबंध रखें क्योंकि जलभराव से पैराविल्ट (मुरझान) रोग फैलता है। फूल आने पर हल्की सिंचाई करें।"
            elif is_maize:
                ans = f"मक्का जलभराव बिल्कुल सहन नहीं कर पाती; भारी बारिश के बाद 6 घंटे के भीतर पानी की निकासी सुनिश्चित करें। घुटने की ऊंचाई और भुट्टे पर बाल (टैसलिंग) आने के समय खेत में नमी की कमी न होने दें।"
            elif is_wheat:
                ans = f"गेहूं में पहली सिंचाई बुवाई के 21 दिन बाद (क्राउन रूट इनिशिएशन स्टेज) करना अनिवार्य है। कुल 4-5 हल्की सिंचाइयां करें और दाना पकते समय तेज हवा में पानी न लगाएं ताकि फसल गिरे नहीं।"
            elif is_sugarcane:
                ans = f"गर्मियों में गन्ने को हर 10-12 दिन में पानी दें। कतारों के बीच सूखी पत्तियां (ट्रैश मल्चिंग) बिछाने से नमी सुरक्षित रहती है और 3-4 सिंचाइयों की बचत होती है।"
            else:
                ans = f"आपके खेत में नमी {moisture}% है और 7 दिन में {rain_7d} मिमी वर्षा का अनुमान है। {crop} के लिए शाम को हल्की सिंचाई करें ताकि वाष्पीकरण से पानी का नुकसान न हो।"
            sugg = [f"{crop} में खाद कब डालें?", "क्या अगले हफ्ते बारिश होगी?", "कीटों से कैसे बचाएं?"]

        elif is_fertilizer:
            if is_pr126:
                ans = f"PR-126 में प्रति एकड़ 90 किलो यूरिया तीन बराबर किस्तों में दें: एक-तिहाई रोपाई पर, एक-तिहाई 21 दिन पर और अंतिम किस्त 42वें दिन। कद्दू करते समय 25 किलो जिंक सल्फेट (21%) जरूर डालें। 45 दिन के बाद यूरिया का छिड़काव न करें।"
            elif is_pusa44:
                ans = f"रोपाई के 45 दिनों के भीतर प्रति एकड़ 110 किलो यूरिया तीन किस्तों में और 25 किलो जिंक सल्फेट डालें। पीलापन देखकर अतिरिक्त यूरिया न डालें क्योंकि पूसा-44 में बैक्टीरियल ब्लाइट रोग का भारी जोखिम रहता है। तने को मजबूत रखने हेतु 30 किलो पोटाश अवश्य दें।"
            elif is_basmati:
                ans = f"बासमती को कम नाइट्रोजन की जरूरत होती है: प्रति एकड़ केवल 54 किलो यूरिया दो किस्तों में (रोपाई व 21वें दिन) डालें। अधिक यूरिया डालने से तना कमजोर होकर फसल गिर जाती है और गर्दन तोड़ (ब्लास्ट) रोग बढ़ता है। कद्दू के समय 15 किलो जिंक सल्फेट अवश्य डालें।"
            elif is_cotton:
                ans = f"कपास में प्रति एकड़ 90 किलो यूरिया, 60 किलो एसएसपी और 20 किलो पोटाश दें। फूल आने और टिंडे बनते समय एक-एक हफ्ते के अंतराल पर 2% पोटेशियम नाइट्रेट (13:0:45) के 4 स्प्रे करें।"
            elif is_maize:
                ans = f"मक्का के लिए प्रति एकड़ 110 किलो यूरिया, 55 किलो डीएपी और 20 किलो पोटाश अनुशंसित है। यूरिया तीन बार दें: एक-तिहाई बुवाई पर, एक-तिहाई घुटने तक बढ़ने पर और एक-तिहाई भुट्टे में बूर आने पर।"
            elif is_wheat:
                ans = f"गेहूं में प्रति एकड़ 110 किलो यूरिया और 55 किलो डीएपी डालें। आधी यूरिया और पूरी डीएपी बुवाई के समय दें; शेष आधी यूरिया पहले और दूसरे पानी से पहले दो बराबर किस्तों में छिड़कें।"
            elif is_sugarcane:
                ans = f"गन्ने में प्रति एकड़ 150 किलो यूरिया, 75 किलो डीएपी और 40 किलो पोटाश की आवश्यकता होती है। यूरिया की पूरी खुराक जून के अंत तक तीन किस्तों में डालकर पूरी कर लें।"
            else:
                ans = f"{crop} में उर्वरक का उपयोग खेत में पर्याप्त नमी होने पर ही करें। यूरिया की संतुलित मात्रा शाम को डालें ताकि धूप में नाइट्रोजन गैस बनकर न उड़े।"
            sugg = ["खाद के बाद पानी कब लगाएं?", f"{crop} में कीट नियंत्रण?", "मौसम की जानकारी"]

        elif is_pest or is_disease:
            if is_cotton:
                ans = f"सफेद मक्खी की संख्या आर्थिक सीमा (6-8 वयस्क प्रति पत्ती) पार होने पर फ्लोनिकामिड 50 WG (80 ग्राम प्रति एकड़) का स्प्रे करें। गुलाबी सुंडी की निगरानी के लिए 5 फेरोमोन ट्रैप लगाएं और प्रकोप पर प्रोक्लेम 100 ग्राम छिड़कें।"
            elif is_wheat:
                ans = f"गेहूं में पीली कुंगी के पीले पाउडर वाले धब्बे दिखते ही प्रोपिकोनाज़ोल 25 EC (टिल्ट 200 मिली प्रति एकड़) 200 लीटर पानी में छिड़कें। गुल्ली डंडा खरपतवार के लिए पिनोक्साडेन 5 EC (400 मिली) का स्प्रे करें।"
            elif is_pr126 or is_pusa44:
                ans = f"तना छेदक या पत्ता लपेट सुंडी की रोकथाम के लिए क्लोरेंट्रानिलिप्रोल 18.5 SC (कोराजन 60 मिली प्रति एकड़) 100 लीटर पानी में मिलाकर छिड़कें। शीथ ब्लाइट दिखने पर टिल्ट 200 मिली का शांत मौसम में स्प्रे करें।"
            elif is_basmati:
                ans = f"बासमती को गर्दन तोड़ (ब्लास्ट) से बचाने हेतु बालियां निकलते समय ट्राईसाइक्लाज़ोल 75 WP (120 ग्राम प्रति एकड़) या एमिस्टार टॉप (200 मिली) का छिड़काव करें। पत्ता लपेट सुंडी दिखने पर फ्लूबेंडियामाइड 50 मिली स्प्रे करें।"
            elif is_maize:
                ans = f"मक्का में फॉल आर्मीवर्म (सैनिक सुंडी) के नियंत्रण के लिए कोराजन 18.5 SC (0.4 मिली प्रति लीटर) का घोल पौधों की गोभ (पत्तियों के केंद्र) में डालें। छिड़काव हमेशा सुबह या शाम को ही करें।"
            elif is_sugarcane:
                ans = f"गन्ने के तना छेदक व शीर्ष छेदक कीट से बचाव के लिए कोराजन 18.5 SC (150 मिली प्रति एकड़) जड़ों के पास डालकर हल्की सिंचाई करें। लाल सड़न (रेड रॉट) से प्रभावित पौधे उखाड़कर नष्ट करें।"
            else:
                ans = f"{crop} में कीट या फफूंद दिखने पर पत्तियों की निचली सतह की जांच करें। पीएयू द्वारा अनुशंसित कीटनाशक का छिड़काव शांत मौसम में ही करें।"
            sugg = ["कौन सी दवा का स्प्रे करें?", "क्या बारिश से दवा धुल जाएगी?", f"{crop} में सिंचाई की सलाह"]

        elif is_rain:
            ans = f"{block} ब्लॉक में 7 दिनों में {rain_7d} मिमी वर्षा का अनुमान है, जिसमें {dry_days} दिन सूखे रहेंगे। वर्षा जल संरक्षण के लिए खेत की मेड़ें मजबूत रखें। भारी बारिश की चेतावनी के दौरान कोई भी छिड़काव या यूरिया न डालें।"
            sugg = [f"क्या आज {crop} में पानी लगाएं?", f"{crop} के लिए खाद की सलाह", "कीटों से कैसे बचाएं?"]

        else:
            ans = f"नमस्ते किसान भाई! मैं {block} क्षेत्र में आपकी {crop} फसल के लिए मौसम, सिंचाई, खाद और फसल सुरक्षा से जुड़े सभी सवालों में पूरी सहायता कर सकता हूं। अपना सवाल पूछें या माइक दबाकर बोलें।"
            sugg = [f"{crop} के लिए खाद की सही खुराक?", f"{crop} में सिंचाई कब करें?", "कीट नियंत्रण के उपाय क्या हैं?"]

    # ==================== ENGLISH ADVISORY ====================
    else:
        if is_sow:
            if is_pr126:
                ans = f"Transplant 25 to 30 day old PR-126 nursery seedlings between June 25 and July 10 for peak yields. Use 4 to 5 kg certified seed per acre treated with fungicide before nursery seeding. Sowing earlier than recommended promotes excessive vegetative foliage and increases pest susceptibility."
            elif is_pusa44:
                ans = f"Pusa-44 is a long-duration variety (160 days) that requires mandatory transplanting before June 20 to safeguard wheat sowing. Use 30-day seedlings and ensure certified treated seed to minimize foot rot. Nursery sowing must begin by mid-May to prevent harvest delays."
            elif is_basmati:
                ans = f"Optimal transplanting window for PB-1121 and PB-1509 is July 1 to July 15. July planting ensures flowering coincides with cooler October temperatures, maximizing grain elongation and aroma. Soak seeds in Trichoderma or Carbendazim for 24 hours to prevent foot rot (Bakanae)."
            elif is_cotton:
                ans = f"Sow Bt Cotton between April 15 and May 15 using pre-sowing canal irrigation (Ronidhar). Maintain spacing of 67.5 cm between rows and 60 cm between plants. Use certified hybrid seeds to guarantee uniform germination and early plant vigour."
            elif is_maize:
                ans = f"Sow Kharif Maize (PMH-1, PMH-2) from May 25 through the end of June. Plant on ridges 60 cm apart to prevent waterlogging during monsoon showers. Use 8 kg treated certified seed per acre to protect germinating seedlings."
            elif is_wheat:
                ans = f"Optimal sowing window for wheat (HD-2967, PBW-725) is November 1 to 15. Direct drilling into standing paddy stubble with a Happy Seeder or Smart Seeder conserves moisture and eliminates stubble burning. Use 40 to 45 kg seed per acre."
            elif is_sugarcane:
                ans = f"Plant sugarcane in autumn (September-October) or spring (February-March) using the trench method at 4 feet row spacing. Plant only healthy 2 to 3 bud setts treated with Carbendazim fungicide."
            else:
                ans = f"Soil moisture in {panchayat} is measured at {moisture}%, which is favorable for sowing {crop}. Treat certified seeds with recommended fungicide and complete sowing within the next 4 to 6 days."
            sugg = [f"Recommended fertilizer for {crop}?", f"When to irrigate {crop}?", f"Pest and disease control for {crop}"]

        elif is_irrigation:
            if is_pr126:
                ans = f"Keep 2 inches of standing water for only the initial 15 days of PR-126 for root establishment. Afterwards, adopt Alternate Wetting and Drying (AWD) by irrigating 2 days after ponded water has fully infiltrated. This saves 25% to 30% water without any yield penalty."
            elif is_pusa44:
                ans = f"Pusa-44 has high water vulnerability and demands 25 to 30 total irrigations. Maintain continuous shallow moisture during the critical panicle emergence and flowering phases without letting soil crack. Water stress during heading directly results in unfilled grains."
            elif is_basmati:
                ans = f"Basmati requires shallow standing water for the first 10 days, followed by cyclical watering at 2-3 day intervals. Maintain gentle moisture during heading and milk stage, but stop irrigation completely 15 days before harvest. Avoid deep ponding to prevent lodging."
            elif is_cotton:
                ans = f"Apply the first irrigation to cotton 4 to 6 weeks after sowing. Ensure drainage channels are clear during July-August downpours as standing water induces parawilt. Irrigate lightly during flowering to prevent flower shedding."
            elif is_maize:
                ans = f"Maize is extremely sensitive to water stagnation; clear furrow drainage within 6 hours of heavy rainfall. Never allow moisture stress during knee-high and tasseling stages when ears are developing."
            elif is_wheat:
                ans = f"Apply the first irrigation to wheat strictly at the Crown Root Initiation (CRI) stage, 21 days after sowing. Provide 4 to 5 light irrigations overall, avoiding watering on windy days during grain filling to prevent lodging."
            elif is_sugarcane:
                ans = f"Irrigate sugarcane every 10 to 12 days during the hot pre-monsoon summer. Trash mulching between rows retains root-zone moisture and saves 3 to 4 irrigations while suppressing weed emergence."
            else:
                ans = f"Root-zone moisture is at {moisture}% with {rain_7d}mm rain expected in {block}. Apply a light evening irrigation to {crop} to prevent transpiration stress without causing root rot."
            sugg = [f"When to apply fertilizer to {crop}?", "7-day rain forecast?", "Pest management advice"]

        elif is_fertilizer:
            if is_pr126:
                ans = f"Apply 90 kg Urea per acre to PR-126 in three equal splits: at transplanting, 21 days, and 42 days. Broadcast 25 kg Zinc Sulphate (21%) at final puddling for vigorous tillering. Avoid applying urea past 45 days as it triggers false smut and sheath blight."
            elif is_pusa44:
                ans = f"Broadcast 110 kg Urea per acre in three splits within 45 days of transplanting, accompanied by 25 kg Zinc Sulphate. Do not apply surplus nitrogen for leaf greenness as Pusa-44 is highly vulnerable to Bacterial Leaf Blight. Incorporate 30 kg MOP per acre for stem resilience."
            elif is_basmati:
                ans = f"Basmati requires moderate nitrogen: apply only 54 kg Urea per acre in two equal splits at transplanting and 21 days. Excessive nitrogen weakens culms, causing lodging and severe Neck Blast. Add 15 kg Zinc Sulphate (21%) per acre at puddling."
            elif is_cotton:
                ans = f"Apply 90 kg Urea, 60 kg Single Super Phosphate, and 20 kg MOP per acre to cotton. Apply 4 foliar sprays of 2% Potassium Nitrate (13:0:45) at weekly intervals during flowering and boll maturation."
            elif is_maize:
                ans = f"Apply 110 kg Urea, 55 kg DAP, and 20 kg MOP per acre for maize. Split urea in three applications: one-third at sowing, one-third at knee-high stage, and one-third at tasseling."
            elif is_wheat:
                ans = f"Apply 110 kg Urea and 55 kg DAP per acre to wheat. Drill half the urea and all the DAP at sowing; broadcast remaining urea in two equal splits before the first and second irrigations."
            elif is_sugarcane:
                ans = f"Sugarcane requires 150 kg Urea, 75 kg DAP, and 40 kg MOP per acre. Complete all nitrogen applications in three splits by the end of June to ensure high sucrose content."
            else:
                ans = f"Apply fertilizer to {crop} only when root-zone soil moisture is adequate. Top-dress urea during late afternoon to prevent ammonia volatilization in hot sunlight."
            sugg = ["Should I water immediately after urea?", f"Pest protection for {crop}", "Rainfall forecast"]

        elif is_pest or is_disease:
            if is_cotton:
                ans = f"For whitefly exceeding the economic threshold (6-8 adults/leaf), spray Flonicamid 50 WG (@ 80g/acre) in 150L water. Install 5 pheromone traps per acre for pink bollworm and spray Emamectin Benzoate (Proclaim @ 100g/acre) if damage appears."
            elif is_wheat:
                ans = f"Inspect wheat for yellow rust (stripe rust) powder on leaves; spray Propiconazole 25 EC (Tilt @ 200 ml/acre) in 200 liters of water at first notice. Control Phalaris minor (Gulli Danda) weeds with Pinoxaden 5 EC (@ 400 ml/acre)."
            elif is_pr126 or is_pusa44:
                ans = f"For stem borer or leaf folder, spray Chlorantraniliprole 18.5 SC (Coragen @ 60 ml/acre) in 100 liters of water. For sheath blight, spray Propiconazole 25 EC (Tilt @ 200 ml/acre) during calm clear weather."
            elif is_basmati:
                ans = f"Protect Basmati from Neck Blast at heading by spraying Tricyclazole 75 WP (@ 120 g/acre) or Amistar Top (@ 200 ml/acre). For leaf folder caterpillar, apply Flubendiamide 39.35 SC (@ 50 ml/acre) when damage exceeds 10%."
            elif is_maize:
                ans = f"For Fall Armyworm (FAW) on maize, apply Chlorantraniliprole 18.5 SC (Coragen @ 0.4 ml/L) or Proclaim 5 SG directly into leaf whorls. Spray during early morning or late evening for maximum efficacy."
            elif is_sugarcane:
                ans = f"Control early shoot borer and top borer in sugarcane by applying Coragen 18.5 SC (@ 150 ml/acre) along the cane row followed by light irrigation. Rogue out and destroy any Red Rot infested clumps."
            else:
                ans = f"Inspect the undersides of {crop} leaves in the morning for pest clusters. Apply PAU-recommended sprays only under clear, calm weather and avoid spraying right before rain."
            sugg = ["Which chemical pesticide is recommended?", "Will rain wash off the spray?", f"Irrigation advice for {crop}"]

        elif is_rain:
            ans = f"The 7-day forecast for {block} projects approximately {rain_7d}mm of rainfall with {dry_days} dry days anticipated. Maintain reinforced field bunds to conserve rainwater within the plot. Postpone chemical foliar spraying and urea top-dressing during heavy rain alerts."
            sugg = [f"Should I irrigate {crop} today?", f"Optimal sowing window for {crop}", "Fertilizer recommendations"]

        else:
            ans = f"Welcome to SAARTHI Kisan AI Copilot for {block} block. I can advise you on real-time irrigation, PAU fertilizer schedules, pest management, and weather forecasts for {crop}. Type your question or click the microphone to speak."
            sugg = [f"Recommended fertilizer for {crop}?", f"When to irrigate {crop}?", f"Pest and disease control for {crop}"]

    return ans, sugg


def _generate_contextual_suggestions(query_lower: str, lang: str, crop: str) -> list[str]:
    """Generates 3 quick follow-up prompt chips matching the active crop and language."""
    if lang == "pa":
        if any(k in query_lower for k in ["ਪਾਣੀ", "ਸਿੰਚਾਈ", "ਸਿੰਜਾਈ", "water", "irrigat"]):
            return ["ਮੀਂਹ ਕਦੋਂ ਪਵੇਗਾ?", f"{crop} ਲਈ ਖਾਦ ਕਦੋਂ ਪਾਈਏ?", "ਬਿਜਾਈ ਕਦੋਂ ਕਰੀਏ?"]
        elif any(k in query_lower for k in ["ਖਾਦ", "ਯੂਰੀਆ", "fertiliz", "urea"]):
            return ["ਖਾਦ ਤੋਂ ਬਾਅਦ ਪਾਣੀ ਕਦੋਂ ਦੇਈਏ?", f"{crop} ਵਿੱਚ ਕੀੜਿਆਂ ਦਾ ਹੱਲ?", "ਮੀਂਹ ਦੀ ਰਿਪੋਰਟ ਦਿਓ"]
        elif any(k in query_lower for k in ["ਕੀੜੇ", "ਸਪਰੇਅ", "ਸੁੰਡੀ", "pest", "spray"]):
            return ["ਕਿਹੜੀ ਦਵਾਈ ਛਿੜਕੀਏ?", "ਕੀ ਮੀਂਹ ਪਵੇਗਾ?", f"{crop} ਵਿੱਚ ਸਿੰਚਾਈ ਦੀ ਸਲਾਹ"]
        elif any(k in query_lower for k in ["ਬਿਜਾਈ", "ਪਨੀਰੀ", "sow"]):
            return [f"{crop} ਲਈ ਖਾਦ ਦੀ ਕਿੰਨੀ ਮਾਤਰਾ ਪਾਈਏ?", f"{crop} ਵਿੱਚ ਪਾਣੀ ਕਦੋਂ ਲਗਾਈਏ?", "ਮੀਂਹ ਦੀ ਭਵਿੱਖਬਾਣੀ ਕੀ ਹੈ?"]
        return [f"{crop} ਲਈ ਖਾਦ ਦੀ ਸਲਾਹ", f"ਕੀ ਅੱਜ {crop} ਨੂੰ ਪਾਣੀ ਲਗਾਵਾਂ?", "ਅਗਲੇ ਹਫ਼ਤੇ ਮੀਂਹ ਕਿੰਨਾ ਪਵੇਗਾ?"]

    elif lang == "hi":
        if any(k in query_lower for k in ["पानी", "सिंचाई", "water", "irrigat"]):
            return ["बारिश कब होगी?", f"{crop} में खाद कब डालें?", "बुवाई का सही समय?"]
        elif any(k in query_lower for k in ["खाद", "यूरिया", "fertiliz", "urea"]):
            return ["खाद के बाद पानी कब लगाएं?", f"{crop} में कीट नियंत्रण?", "मौसम की जानकारी"]
        elif any(k in query_lower for k in ["कीट", "दवा", "स्प्रे", "pest", "spray"]):
            return ["कौन सा कीटनाशक डालें?", "क्या बारिश होने वाली है?", f"{crop} में सिंचाई की सलाह"]
        elif any(k in query_lower for k in ["बुवाई", "रोपाई", "sow"]):
            return [f"{crop} के लिए खाद की सही खुराक?", f"{crop} में सिंचाई कब करें?", "मौसम का पूर्वानुमान"]
        return [f"{crop} के लिए खाद की सलाह", f"क्या आज {crop} में पानी लगाएं?", "आने वाले दिनों में मौसम कैसा रहेगा?"]

    else:
        if any(k in query_lower for k in ["irrigat", "water"]):
            return ["When is rainfall expected?", f"Can I apply fertilizer to {crop} now?", f"Optimal sowing window for {crop}?"]
        elif any(k in query_lower for k in ["fertiliz", "urea"]):
            return ["Should I water right after fertilizing?", f"Pest guidance for {crop}", "Rainfall total for this week"]
        elif any(k in query_lower for k in ["pest", "spray", "disease"]):
            return ["Recommended spray dosage?", "Will rain wash off pesticide?", f"Irrigation advice for {crop}"]
        elif any(k in query_lower for k in ["sow", "plant", "variety"]):
            return [f"Fertilizer schedule for {crop}?", f"First irrigation for {crop}?", "Rainfall forecast for this week"]
        return [f"Fertilizer schedule for {crop}", f"Should I irrigate {crop} today?", "When is the next dry spell?"]

