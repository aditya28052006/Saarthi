const express = require("express");
const cors = require("cors");

const app = express();


// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());

app.use(express.json());


// ==========================================
// HOME PAGE
// ==========================================

app.get("/", (req, res) => {

    res.send("🌾 SAARTHI Backend is running!");

});


// ==========================================
// ASK SAARTHI
// ==========================================

app.post("/ask", (req, res) => {


    const question =
        req.body.question || "";


    const language =
        req.body.language || "en-IN";


    console.log("--------------------------------");

    console.log(
        "Farmer asked:",
        question
    );

    console.log(
        "Selected language:",
        language
    );

    console.log("--------------------------------");


    // Convert question to lowercase

    const q =
        question.toLowerCase();


    let answer = "";


// ======================================================
// ENGLISH
// ======================================================

    if (language === "en-IN") {


        // ------------------------------------------
        // IRRIGATION
        // ------------------------------------------

        if (

            q.includes("irrigat") ||

            q.includes("irritat") ||

            q.includes("water my crop") ||

            q.includes("water the crop") ||

            q.includes("water my field") ||

            q.includes("water the field") ||

            q.includes("paddy") ||

            q.includes("paani")

        ) {

            answer =
                "Before irrigating, check the soil moisture and rainfall forecast. If rain is expected soon, irrigation may not be necessary.";


        }


        // ------------------------------------------
        // RAIN
        // ------------------------------------------

        else if (

            q.includes("rain") ||

            q.includes("rainfall") ||

            q.includes("weather")

        ) {

            answer =
                "To give you a useful irrigation recommendation, SAARTHI needs your location and crop information.";


        }


        // ------------------------------------------
        // FERTILIZER
        // ------------------------------------------

        else if (

            q.includes("fertilizer") ||

            q.includes("fertiliser") ||

            q.includes("fertilize") ||

            q.includes("fertilise") ||

            q.includes("khad")

        ) {

            answer =
                "Fertilizer provides essential nutrients to crops and can improve plant growth. The correct fertilizer and quantity depend on your crop and soil condition.";


        }


        // ------------------------------------------
        // PEST
        // ------------------------------------------

        else if (

            q.includes("pest") ||

            q.includes("pests") ||

            q.includes("best") ||

            q.includes("insect") ||

            q.includes("insects")

        ) {

            answer =
                "If you notice pests, first inspect the leaves and stems for damage. Identify the pest before choosing a treatment.";


        }


        // ------------------------------------------
        // DISEASE
        // ------------------------------------------

        else if (

            q.includes("disease") ||

            q.includes("diseases") ||

            q.includes("infection")

        ) {

            answer =
                "If your crop shows unusual spots, yellowing or wilting, it may indicate a disease. A photo of the affected plant can help identify the problem.";


        }


        // ------------------------------------------
        // DEFAULT
        // ------------------------------------------

        else {

            answer =
                "I can help with irrigation, rainfall, fertilizer, crop diseases and pests. Please ask me a farming-related question.";

        }

    }


// ======================================================
// HINDI
// ======================================================

    else if (language === "hi-IN") {


        // ------------------------------------------
        // IRRIGATION
        // ------------------------------------------

        if (

            q.includes("पानी") ||

            q.includes("सिंचाई") ||

            q.includes("सिंचाई") ||

            q.includes("irrigat") ||

            q.includes("irritat") ||

            q.includes("paani")

        ) {

            answer =
                "सिंचाई करने से पहले मिट्टी की नमी और बारिश का पूर्वानुमान जांचें। अगर जल्द बारिश होने वाली है, तो आज सिंचाई करने की जरूरत नहीं हो सकती है।";

        }


        // ------------------------------------------
        // RAIN
        // ------------------------------------------

        else if (

            q.includes("बारिश") ||

            q.includes("वर्षा") ||

            q.includes("rain") ||

            q.includes("barish")

        ) {

            answer =
                "बारिश की जानकारी के आधार पर सही सलाह देने के लिए मुझे आपके स्थान और फसल की जानकारी चाहिए।";

        }


        // ------------------------------------------
        // FERTILIZER
        // ------------------------------------------

        else if (

            q.includes("खाद") ||

            q.includes("उर्वरक") ||

            q.includes("fertilizer") ||

            q.includes("fertiliser") ||

            q.includes("khad")

        ) {

            answer =
                "खाद फसल को जरूरी पोषक तत्व प्रदान करती है और पौधों की वृद्धि में मदद करती है। सही खाद और उसकी मात्रा आपकी फसल और मिट्टी की स्थिति पर निर्भर करती है।";

        }


        // ------------------------------------------
        // PEST
        // ------------------------------------------

        else if (

            q.includes("कीट") ||

            q.includes("कीड़ा") ||

            q.includes("कीड़े") ||

            q.includes("pest") ||

            q.includes("insect")

        ) {

            answer =
                "अगर आपकी फसल में कीट दिखाई दे रहे हैं, तो पहले पत्तियों और तनों को ध्यान से जांचें। उपचार करने से पहले कीट की पहचान करना जरूरी है।";

        }


        // ------------------------------------------
        // DISEASE
        // ------------------------------------------

        else if (

            q.includes("बीमारी") ||

            q.includes("रोग") ||

            q.includes("संक्रमण") ||

            q.includes("disease")

        ) {

            answer =
                "अगर आपकी फसल की पत्तियों पर धब्बे, पीलापन या मुरझाने के लक्षण दिखाई दें, तो यह बीमारी का संकेत हो सकता है। समस्या की पहचान करने के लिए फसल की तस्वीर उपयोगी हो सकती है।";

        }


        else {

            answer =
                "मैं सिंचाई, बारिश, खाद, फसल की बीमारी और कीटों से जुड़े सवालों में आपकी मदद कर सकता हूं।";

        }

    }


// ======================================================
// TELUGU
// ======================================================

    else if (language === "te-IN") {


        // ------------------------------------------
        // IRRIGATION
        // ------------------------------------------

        if (

            q.includes("నీరు") ||

            q.includes("నీళ్లు") ||

            q.includes("నీళ్ళు") ||

            q.includes("పారుదల") ||

            q.includes("irrigat") ||

            q.includes("irritat") ||

            q.includes("paani")

        ) {

            answer =
                "నీటిపారుదల చేయడానికి ముందు నేలలో తేమను మరియు వర్షపాతం అంచనాను పరిశీలించండి. త్వరలో వర్షం వచ్చే అవకాశం ఉంటే, ఈరోజు నీటిపారుదల అవసరం లేకపోవచ్చు.";

        }


        // ------------------------------------------
        // RAIN
        // ------------------------------------------

        else if (

            q.includes("వర్షం") ||

            q.includes("వాన") ||

            q.includes("rain")

        ) {

            answer =
                "సరైన నీటిపారుదల సలహా ఇవ్వడానికి మీ ప్రాంతం మరియు పంట వివరాలు నాకు అవసరం.";

        }


        // ------------------------------------------
        // FERTILIZER
        // ------------------------------------------

        else if (

            q.includes("ఎరువు") ||

            q.includes("ఎరువులు") ||

            q.includes("fertilizer")

        ) {

            answer =
                "ఎరువులు పంటలకు అవసరమైన పోషకాలను అందించి మొక్కల ఆరోగ్యకరమైన పెరుగుదలకు సహాయపడతాయి. సరైన ఎరువు మరియు దాని పరిమాణం పంట మరియు నేల పరిస్థితిపై ఆధారపడి ఉంటుంది.";

        }


        // ------------------------------------------
        // PEST
        // ------------------------------------------

        else if (

            q.includes("పురుగు") ||

            q.includes("పురుగులు") ||

            q.includes("కీటకం") ||

            q.includes("pest") ||

            q.includes("insect")

        ) {

            answer =
                "పంటలో పురుగులు కనిపిస్తే, ముందుగా ఆకులు మరియు కాండాలను జాగ్రత్తగా పరిశీలించండి. చికిత్స చేయడానికి ముందు పురుగును గుర్తించడం ముఖ్యం.";

        }


        // ------------------------------------------
        // DISEASE
        // ------------------------------------------

        else if (

            q.includes("వ్యాధి") ||

            q.includes("జబ్బు") ||

            q.includes("disease")

        ) {

            answer =
                "పంట ఆకులపై మచ్చలు, పసుపు రంగు లేదా వాడిపోవడం కనిపిస్తే అది వ్యాధికి సంకేతం కావచ్చు. సమస్యను గుర్తించడానికి పంట ఫోటో ఉపయోగపడుతుంది.";

        }


        else {

            answer =
                "నేను నీటిపారుదల, వర్షం, ఎరువులు, పంట వ్యాధులు మరియు పురుగుల గురించి మీకు సహాయం చేయగలను.";

        }

    }


// ======================================================
// PUNJABI 🇮🇳
// ======================================================

    else if (language === "pa-IN") {


        // ------------------------------------------
        // IRRIGATION
        // ------------------------------------------

        if (

            q.includes("ਪਾਣੀ") ||

            q.includes("ਸਿੰਚਾਈ") ||

            q.includes("ਸਿੰਜਾਈ") ||

            q.includes("ਫਸਲ") ||

            q.includes("ਫ਼ਸਲ") ||

            q.includes("irrigat") ||

            q.includes("irritat") ||

            q.includes("paani")

        ) {

            answer =
                "ਸਿੰਚਾਈ ਕਰਨ ਤੋਂ ਪਹਿਲਾਂ ਮਿੱਟੀ ਦੀ ਨਮੀ ਅਤੇ ਮੀਂਹ ਦੀ ਭਵਿੱਖਬਾਣੀ ਦੀ ਜਾਂਚ ਕਰੋ। ਜੇ ਜਲਦੀ ਮੀਂਹ ਪੈਣ ਦੀ ਸੰਭਾਵਨਾ ਹੈ, ਤਾਂ ਅੱਜ ਸਿੰਚਾਈ ਕਰਨ ਦੀ ਲੋੜ ਨਹੀਂ ਹੋ ਸਕਦੀ।";

        }


        // ------------------------------------------
        // RAIN
        // ------------------------------------------

        else if (

            q.includes("ਮੀਂਹ") ||

            q.includes("ਬਾਰਿਸ਼") ||

            q.includes("ਵਰਖਾ") ||

            q.includes("rain")

        ) {

            answer =
                "ਮੀਂਹ ਦੇ ਆਧਾਰ 'ਤੇ ਸਹੀ ਸਿੰਚਾਈ ਦੀ ਸਲਾਹ ਦੇਣ ਲਈ ਮੈਨੂੰ ਤੁਹਾਡੇ ਸਥਾਨ ਅਤੇ ਫਸਲ ਦੀ ਜਾਣਕਾਰੀ ਚਾਹੀਦੀ ਹੈ।";

        }


        // ------------------------------------------
        // FERTILIZER
        // ------------------------------------------

        else if (

            q.includes("ਖਾਦ") ||

            q.includes("ਖਾਦਾਂ") ||

            q.includes("ਉਰਵਰਕ") ||

            q.includes("fertilizer") ||

            q.includes("fertiliser") ||

            q.includes("khad")

        ) {

            answer =
                "ਖਾਦ ਫਸਲਾਂ ਨੂੰ ਜ਼ਰੂਰੀ ਪੋਸ਼ਕ ਤੱਤ ਪ੍ਰਦਾਨ ਕਰਦੀ ਹੈ ਅਤੇ ਪੌਦਿਆਂ ਦੇ ਵਾਧੇ ਵਿੱਚ ਮਦਦ ਕਰਦੀ ਹੈ। ਸਹੀ ਖਾਦ ਅਤੇ ਇਸ ਦੀ ਮਾਤਰਾ ਤੁਹਾਡੀ ਫਸਲ ਅਤੇ ਮਿੱਟੀ ਦੀ ਸਥਿਤੀ 'ਤੇ ਨਿਰਭਰ ਕਰਦੀ ਹੈ।";

        }


        // ------------------------------------------
        // PEST
        // ------------------------------------------

        else if (

            q.includes("ਕੀੜੇ") ||

            q.includes("ਕੀੜਾ") ||

            q.includes("ਕੀਟ") ||

            q.includes("pest") ||

            q.includes("insect")

        ) {

            answer =
                "ਜੇ ਤੁਹਾਡੀ ਫਸਲ ਵਿੱਚ ਕੀੜੇ ਦਿਖਾਈ ਦੇ ਰਹੇ ਹਨ, ਤਾਂ ਪਹਿਲਾਂ ਪੱਤਿਆਂ ਅਤੇ ਤਣਿਆਂ ਦੀ ਧਿਆਨ ਨਾਲ ਜਾਂਚ ਕਰੋ। ਇਲਾਜ ਕਰਨ ਤੋਂ ਪਹਿਲਾਂ ਕੀੜੇ ਦੀ ਪਛਾਣ ਕਰਨਾ ਜ਼ਰੂਰੀ ਹੈ।";

        }


        // ------------------------------------------
        // DISEASE
        // ------------------------------------------

        else if (

            q.includes("ਬਿਮਾਰੀ") ||

            q.includes("ਬੀਮਾਰੀ") ||

            q.includes("ਰੋਗ") ||

            q.includes("disease")

        ) {

            answer =
                "ਜੇ ਤੁਹਾਡੀ ਫਸਲ ਦੇ ਪੱਤਿਆਂ 'ਤੇ ਧੱਬੇ, ਪੀਲਾਪਣ ਜਾਂ ਮੁਰਝਾਉਣ ਦੇ ਲੱਛਣ ਦਿਖਾਈ ਦੇਣ, ਤਾਂ ਇਹ ਬਿਮਾਰੀ ਦਾ ਸੰਕੇਤ ਹੋ ਸਕਦਾ ਹੈ। ਸਮੱਸਿਆ ਦੀ ਪਛਾਣ ਕਰਨ ਲਈ ਫਸਲ ਦੀ ਤਸਵੀਰ ਮਦਦਗਾਰ ਹੋ ਸਕਦੀ ਹੈ।";

        }


        // ------------------------------------------
        // DEFAULT
        // ------------------------------------------

        else {

            answer =
                "ਮੈਂ ਸਿੰਚਾਈ, ਮੀਂਹ, ਖਾਦ, ਫਸਲ ਦੀਆਂ ਬਿਮਾਰੀਆਂ ਅਤੇ ਕੀੜਿਆਂ ਨਾਲ ਸਬੰਧਤ ਸਵਾਲਾਂ ਵਿੱਚ ਤੁਹਾਡੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ।";

        }

    }


// ======================================================
// SEND RESPONSE
// ======================================================

    res.json({

        answer: answer

    });

});


// ==========================================
// START SERVER
// ==========================================

app.listen(3000, () => {

    console.log(
        "🌾 SAARTHI Backend running on http://localhost:3000"
    );

});