package com.saarthi.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Map;

public class FarmerAnalysisResponse {
    private String status = "success";
    private Map<String, Object> inputs;
    private Outputs outputs;

    public static class Outputs {
        @JsonProperty("dry_spell_probability")
        private double drySpellProbability;

        @JsonProperty("risk_level")
        private String riskLevel;

        @JsonProperty("model_confidence")
        private double modelConfidence = 92.4;

        @JsonProperty("decision_tag")
        private String decisionTag;

        @JsonProperty("decision_tone")
        private String decisionTone;

        @JsonProperty("decision_color")
        private String decisionColor;

        @JsonProperty("recommended_window")
        private String recommendedWindow;

        private Map<String, String> explanation;

        @JsonProperty("four_pillars")
        private Map<String, String> fourPillars;

        @JsonProperty("root_zone_soil_moisture_pct")
        private double rootZoneSoilMoisturePct;

        @JsonProperty("crop_guidance")
        private Map<String, String> cropGuidance;

        @JsonProperty("whatsapp_share")
        private Map<String, String> whatsappShare;

        // Getters & Setters
        public double getDrySpellProbability() { return drySpellProbability; }
        public void setDrySpellProbability(double drySpellProbability) { this.drySpellProbability = drySpellProbability; }

        public String getRiskLevel() { return riskLevel; }
        public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

        public double getModelConfidence() { return modelConfidence; }
        public void setModelConfidence(double modelConfidence) { this.modelConfidence = modelConfidence; }

        public String getDecisionTag() { return decisionTag; }
        public void setDecisionTag(String decisionTag) { this.decisionTag = decisionTag; }

        public String getDecisionTone() { return decisionTone; }
        public void setDecisionTone(String decisionTone) { this.decisionTone = decisionTone; }

        public String getDecisionColor() { return decisionColor; }
        public void setDecisionColor(String decisionColor) { this.decisionColor = decisionColor; }

        public String getRecommendedWindow() { return recommendedWindow; }
        public void setRecommendedWindow(String recommendedWindow) { this.recommendedWindow = recommendedWindow; }

        public Map<String, String> getExplanation() { return explanation; }
        public void setExplanation(Map<String, String> explanation) { this.explanation = explanation; }

        public Map<String, String> getFourPillars() { return fourPillars; }
        public void setFourPillars(Map<String, String> fourPillars) { this.fourPillars = fourPillars; }

        public double getRootZoneSoilMoisturePct() { return rootZoneSoilMoisturePct; }
        public void setRootZoneSoilMoisturePct(double rootZoneSoilMoisturePct) { this.rootZoneSoilMoisturePct = rootZoneSoilMoisturePct; }

        public Map<String, String> getCropGuidance() { return cropGuidance; }
        public void setCropGuidance(Map<String, String> cropGuidance) { this.cropGuidance = cropGuidance; }

        public Map<String, String> getWhatsappShare() { return whatsappShare; }
        public void setWhatsappShare(Map<String, String> whatsappShare) { this.whatsappShare = whatsappShare; }
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Map<String, Object> getInputs() { return inputs; }
    public void setInputs(Map<String, Object> inputs) { this.inputs = inputs; }

    public Outputs getOutputs() { return outputs; }
    public void setOutputs(Outputs outputs) { this.outputs = outputs; }
}
