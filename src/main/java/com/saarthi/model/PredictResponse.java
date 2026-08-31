package com.saarthi.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class PredictResponse {
    private String block;
    private double probability;
    private String risk;
    
    @JsonProperty("rainfall_outlook")
    private double rainfallOutlook;

    @JsonProperty("root_zone_moisture")
    private double rootZoneMoisture;

    @JsonProperty("model_confidence")
    private double modelConfidence = 92.4;

    @JsonProperty("model_source")
    private String modelSource;

    private String advisory;

    public String getBlock() { return block; }
    public void setBlock(String block) { this.block = block; }

    public double getProbability() { return probability; }
    public void setProbability(double probability) { this.probability = probability; }

    public String getRisk() { return risk; }
    public void setRisk(String risk) { this.risk = risk; }

    public double getRainfallOutlook() { return rainfallOutlook; }
    public void setRainfallOutlook(double rainfallOutlook) { this.rainfallOutlook = rainfallOutlook; }

    public double getRootZoneMoisture() { return rootZoneMoisture; }
    public void setRootZoneMoisture(double rootZoneMoisture) { this.rootZoneMoisture = rootZoneMoisture; }

    public double getModelConfidence() { return modelConfidence; }
    public void setModelConfidence(double modelConfidence) { this.modelConfidence = modelConfidence; }

    public String getModelSource() { return modelSource; }
    public void setModelSource(String modelSource) { this.modelSource = modelSource; }

    public String getAdvisory() { return advisory; }
    public void setAdvisory(String advisory) { this.advisory = advisory; }
}
