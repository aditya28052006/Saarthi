package com.saarthi.controller;

import com.saarthi.model.*;
import com.saarthi.service.AgronomyService;
import com.saarthi.service.DistrictDataService;
import com.saarthi.service.MlPredictionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ApiController {

    @Autowired
    private DistrictDataService districtService;

    @Autowired
    private MlPredictionService mlService;

    @Autowired
    private AgronomyService agronomyService;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("status", "ready");
        resp.put("backend_runtime", "Java 17 · Spring Boot 3.3.3");
        resp.put("district", "Sangrur District, Punjab");
        resp.put("blocks_monitored", districtService.getBlocks().size());
        resp.put("panchayats_indexed", "1,200+");
        resp.put("model_source", MlPredictionService.MODEL_SOURCE);
        resp.put("features", Arrays.asList("rain_3d", "rain_7d", "rain_14d", "rain_30d", "dry_days_7d", "dry_days_14d"));
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/panchayats")
    public ResponseEntity<Map<String, Object>> getPanchayats(@RequestParam(value = "block", required = false) String block) {
        Map<String, Object> resp = new LinkedHashMap<>();
        if (block != null && !block.isEmpty()) {
            List<String> list = districtService.getPanchayats(block);
            resp.put("block", block);
            resp.put("panchayats", list);
            resp.put("total_in_block", list.size());
            return ResponseEntity.ok(resp);
        }
        resp.put("district", "Sangrur");
        resp.put("blocks", districtService.getBlocks());
        resp.put("panchayats_by_block", DistrictDataService.BLOCK_PANCHAYATS);
        resp.put("total_indexed", "1,200+");
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/map-data")
    public ResponseEntity<MapDataResponse> getMapData() {
        MapDataResponse resp = new MapDataResponse();
        resp.setDistrict("Sangrur District, Punjab");
        Map<String, Object> center = new LinkedHashMap<>();
        center.put("lat", 30.2458);
        center.put("lng", 75.8421);
        center.put("zoom", 10);
        resp.setCenter(center);
        resp.setVillages(districtService.getVillages());
        resp.setTotalMonitored(districtService.getVillages().size());
        resp.setTotalPanchayats("1,200+");
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/outlook/{block}")
    public ResponseEntity<OutlookResponse> getOutlook(
            @PathVariable("block") String block,
            @RequestParam(value = "days", defaultValue = "30") int days) {

        Map<String, Double> cond = districtService.getConditions(block);
        double r3 = cond.get("rain_3d");
        double r7 = cond.get("rain_7d");
        double r14 = cond.get("rain_14d");
        double r30 = cond.get("rain_30d");
        double d7 = cond.get("dry_days_7d");
        double d14 = cond.get("dry_days_14d");

        double prob = mlService.calculateDrySpellProbability(r3, r7, r14, r30, d7, d14);
        String risk = mlService.classifyRisk(prob);
        double probPct = Math.round(prob * 1000.0) / 10.0;

        double nextWeekRain = Math.max(0.0, Math.round(r7 * (1.35 - prob) * 10.0) / 10.0);
        int blockIndex = Math.max(0, DistrictDataService.BLOCKS.indexOf(block));

        // Generate day-by-day probabilistic daily sequence matching pattern
        double[] pattern = {0.10, 0.20, 0.06, 0.25, 0.11, 0.18, 0.10};
        List<Double> dailyRain = new ArrayList<>();
        List<OutlookResponse.ForecastDay> matrix = new ArrayList<>();
        LocalDate today = LocalDate.now();
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd MMM");

        double baseMoisture = 38.0;
        Map<String, Object> details = districtService.getBlockDetails(block);
        if (details != null && details.containsKey("soil_val")) {
            baseMoisture = ((Number) details.get("soil_val")).doubleValue();
        }

        double cumRain = 0.0;
        for (int i = 0; i < days; i++) {
            LocalDate date = today.plusDays(i);
            double r = Math.round(((nextWeekRain / 7.0) * pattern[i % 7] * 7.0 + ((blockIndex + i) % 3) * 0.4) * 10.0) / 10.0;
            dailyRain.add(r);
            cumRain += r;

            double temp = Math.round((34.2 - Math.min(i, 14) * 0.15 + (i % 4) * 0.6 - (r > 5.0 ? 1.5 : 0.0)) * 10.0) / 10.0;
            double m = Math.max(18.0, Math.min(55.0, Math.round(baseMoisture + cumRain * 0.4 - i * 0.7)));
            int moistPct = (int) Math.round(m);
            String dayRisk = r < 1.5 && moistPct < 28 ? "High" : (r < 4.0 || moistPct < 38 ? "Moderate" : "Low");

            matrix.add(new OutlookResponse.ForecastDay(i + 1, date.format(dtf), r, temp, moistPct, dayRisk));
        }

        String[] windows = districtService.getMonsoonWindow(block);
        Map<String, Object> seasonal = new LinkedHashMap<>();
        seasonal.put("onset", windows[0]);
        seasonal.put("withdrawal", windows[1]);
        seasonal.put("onset_confidence", Math.round(82.0 - prob * 24.0));
        seasonal.put("dry_spell_window", prob >= 0.60 ? "Next 2–8 days" : prob >= 0.30 ? "Next 5–11 days" : "Low likelihood in next 7 days");
        seasonal.put("confidence", 92.4);

        Map<String, Object> decision = new LinkedHashMap<>();
        if (prob >= 0.60) {
            decision.put("status", "Wait before sowing");
            decision.put("decision_tag", "WAIT / DELAY SOWING");
            decision.put("days", 7);
            decision.put("tone", "wait");
            decision.put("message", "A severe dry spell is likely in this block. Hold seed sowing for about 7 days and protect available root-zone soil moisture.");
            decision.put("punjabi", "ਅਗਲੇ 7 ਦਿਨ ਬੀਜ ਨਾ ਬੀਜੋ। ਖੇਤ ਦੀ ਨਮੀ ਬਚਾਓ ਅਤੇ ਸਿੰਚਾਈ ਦਾ ਪ੍ਰਬੰਧ ਰੱਖੋ।");
            decision.put("hindi", "अगले 7 दिन बुवाई न करें। खेत की नमी बचाएँ और सिंचाई की व्यवस्था रखें।");
        } else if (prob >= 0.30) {
            decision.put("status", "Wait and review");
            decision.put("decision_tag", "EXERCISE CAUTION");
            decision.put("days", 3);
            decision.put("tone", "review");
            decision.put("message", "Rainfall is uncertain. Review the outlook in 3 days before sowing, and keep supplemental irrigation ready.");
            decision.put("punjabi", "ਬੀਜਾਈ ਤੋਂ ਪਹਿਲਾਂ 3 ਦਿਨ ਉਡੀਕੋ ਅਤੇ ਮੌਸਮ ਦੀ ਜਾਣਕਾਰੀ ਮੁੜ ਵੇਖੋ। ਸਿੰਚਾਈ ਤਿਆਰ ਰੱਖੋ।");
            decision.put("hindi", "बुवाई से पहले 3 दिन प्रतीक्षा करें और मौसम का पूर्वानुमान फिर देखें। सिंचाई तैयार रखें।");
        } else {
            decision.put("status", "Suitable to sow");
            decision.put("decision_tag", "SAFE TO SOW");
            decision.put("days", 0);
            decision.put("tone", "sow");
            decision.put("message", "Moisture conditions look favourable (<30% risk). You can proceed with planned sowing while monitoring local updates.");
            decision.put("punjabi", "ਨਮੀ ਦੀ ਸਥਿਤੀ ਠੀਕ ਹੈ। ਤਿਆਰ ਖੇਤਾਂ ਵਿੱਚ ਬੀਜਾਈ ਕੀਤੀ ਜਾ ਸਕਦੀ ਹੈ ਅਤੇ ਸਥਾਨਕ ਅੱਪਡੇਟ ਵੇਖਦੇ ਰਹੋ।");
            decision.put("hindi", "नमी की स्थिति अनुकूल है। तैयार खेतों में बुवाई की जा सकती है और स्थानीय अपडेट देखते रहें।");
        }

        double expectedRainfallSum = 0.0;
        for (Double r : dailyRain) expectedRainfallSum += r;
        expectedRainfallSum = Math.round(expectedRainfallSum * 10.0) / 10.0;

        OutlookResponse resp = new OutlookResponse();
        resp.setBlock(block);
        resp.setConditions(new LinkedHashMap<>(cond));
        resp.setDrySpellProbability(probPct);
        resp.setRisk(risk);
        resp.setExpectedRainfall(expectedRainfallSum);
        resp.setDailyRainfall(dailyRain);
        resp.setForecastMatrix(matrix);
        resp.setHorizon(days);
        resp.setSeasonal(seasonal);
        resp.setRainfallTrend(prob >= 0.60 ? "Below normal" : prob >= 0.30 ? "Near normal" : "Favourable");
        resp.setDecision(decision);
        resp.setLocal(details);
        resp.setCropAdvice(new LinkedHashMap<>(agronomyService.getAllCropAdvice(prob)));

        return ResponseEntity.ok(resp);
    }

    @PostMapping("/predict")
    public ResponseEntity<PredictResponse> predict(@RequestBody PredictRequest req) {
        return ResponseEntity.ok(mlService.predict(req));
    }

    @PostMapping("/farmer-analysis")
    public ResponseEntity<FarmerAnalysisResponse> farmerAnalysis(@RequestBody FarmerAnalysisRequest req) {
        return ResponseEntity.ok(agronomyService.computeFarmerAnalysis(req));
    }
}
