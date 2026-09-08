package com.saarthi.service;

import com.saarthi.model.PredictRequest;
import com.saarthi.model.PredictResponse;
import org.springframework.stereotype.Service;

@Service
public class MlPredictionService {

    public static final String MODEL_SOURCE = "Pending New Model Integration";

    /**
     * Placeholder calculation for dry spell probability.
     * Replace this method when integrating your new ML model.
     */
    public double calculateDrySpellProbability(double r3, double r7, double r14, double r30, double d7, double d14) {
        // Simple placeholder estimation until new ML model is attached
        return 0.15;
    }

    public String classifyRisk(double probability) {
        if (probability >= 0.60) return "High";
        if (probability >= 0.30) return "Moderate";
        return "Low";
    }

    public PredictResponse predict(PredictRequest req) {
        double prob = calculateDrySpellProbability(
                req.getRain3d(), req.getRain7d(), req.getRain14d(),
                req.getRain30d(), req.getDryDays7d(), req.getDryDays14d()
        );

        String risk = classifyRisk(prob);

        PredictResponse resp = new PredictResponse();
        resp.setBlock(req.getBlock() != null ? req.getBlock() : "Sangrur");
        resp.setProbability(Math.round(prob * 1000.0) / 10.0);
        resp.setRisk(risk);
        resp.setRainfallOutlook(25.0);
        resp.setRootZoneMoisture(45.0);
        resp.setModelConfidence(0.0);
        resp.setModelSource(MODEL_SOURCE);
        resp.setAdvisory("Awaiting new ML model integration for updated advisory output.");

        return resp;
    }
}

