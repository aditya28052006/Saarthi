package com.saarthi.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

public class OutlookResponse {
    private String block;
    private String district = "Sangrur District, Punjab";
    private Map<String, Object> conditions;

    @JsonProperty("dry_spell_probability")
    private double drySpellProbability;

    private String risk;

    @JsonProperty("model_confidence")
    private double modelConfidence = 92.4;

    @JsonProperty("expected_rainfall")
    private double expectedRainfall;

    @JsonProperty("daily_rainfall")
    private List<Double> dailyRainfall;

    @JsonProperty("forecast_matrix")
    private List<ForecastDay> forecastMatrix;

    private int horizon = 30;
    private Map<String, Object> seasonal;

    @JsonProperty("rainfall_trend")
    private String rainfallTrend;

    private Map<String, Object> decision;
    private Map<String, Object> local;

    @JsonProperty("crop_advice")
    private Map<String, Object> cropAdvice;

    @JsonProperty("model_source")
    private String modelSource = "Random Forest Classifier (200 trees) — SIH26086";

    public static class ForecastDay {
        private int day;
        private String date;

        @JsonProperty("rainfall_mm")
        private double rainfallMm;

        @JsonProperty("temperature_c")
        private double temperatureC;

        @JsonProperty("soil_moisture_pct")
        private int soilMoisturePct;

        @JsonProperty("risk_status")
        private String riskStatus;

        public ForecastDay() {}

        public ForecastDay(int day, String date, double rainfallMm, double temperatureC, int soilMoisturePct, String riskStatus) {
            this.day = day;
            this.date = date;
            this.rainfallMm = rainfallMm;
            this.temperatureC = temperatureC;
            this.soilMoisturePct = soilMoisturePct;
            this.riskStatus = riskStatus;
        }

        public int getDay() { return day; }
        public void setDay(int day) { this.day = day; }

        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }

        public double getRainfallMm() { return rainfallMm; }
        public void setRainfallMm(double rainfallMm) { this.rainfallMm = rainfallMm; }

        public double getTemperatureC() { return temperatureC; }
        public void setTemperatureC(double temperatureC) { this.temperatureC = temperatureC; }

        public int getSoilMoisturePct() { return soilMoisturePct; }
        public void setSoilMoisturePct(int soilMoisturePct) { this.soilMoisturePct = soilMoisturePct; }

        public String getRiskStatus() { return riskStatus; }
        public void setRiskStatus(String riskStatus) { this.riskStatus = riskStatus; }
    }

    // Getters and setters
    public String getBlock() { return block; }
    public void setBlock(String block) { this.block = block; }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }

    public Map<String, Object> getConditions() { return conditions; }
    public void setConditions(Map<String, Object> conditions) { this.conditions = conditions; }

    public double getDrySpellProbability() { return drySpellProbability; }
    public void setDrySpellProbability(double drySpellProbability) { this.drySpellProbability = drySpellProbability; }

    public String getRisk() { return risk; }
    public void setRisk(String risk) { this.risk = risk; }

    public double getModelConfidence() { return modelConfidence; }
    public void setModelConfidence(double modelConfidence) { this.modelConfidence = modelConfidence; }

    public double getExpectedRainfall() { return expectedRainfall; }
    public void setExpectedRainfall(double expectedRainfall) { this.expectedRainfall = expectedRainfall; }

    public List<Double> getDailyRainfall() { return dailyRainfall; }
    public void setDailyRainfall(List<Double> dailyRainfall) { this.dailyRainfall = dailyRainfall; }

    public List<ForecastDay> getForecastMatrix() { return forecastMatrix; }
    public void setForecastMatrix(List<ForecastDay> forecastMatrix) { this.forecastMatrix = forecastMatrix; }

    public int getHorizon() { return horizon; }
    public void setHorizon(int horizon) { this.horizon = horizon; }

    public Map<String, Object> getSeasonal() { return seasonal; }
    public void setSeasonal(Map<String, Object> seasonal) { this.seasonal = seasonal; }

    public String getRainfallTrend() { return rainfallTrend; }
    public void setRainfallTrend(String rainfallTrend) { this.rainfallTrend = rainfallTrend; }

    public Map<String, Object> getDecision() { return decision; }
    public void setDecision(Map<String, Object> decision) { this.decision = decision; }

    public Map<String, Object> getLocal() { return local; }
    public void setLocal(Map<String, Object> local) { this.local = local; }

    public Map<String, Object> getCropAdvice() { return cropAdvice; }
    public void setCropAdvice(Map<String, Object> cropAdvice) { this.cropAdvice = cropAdvice; }

    public String getModelSource() { return modelSource; }
    public void setModelSource(String modelSource) { this.modelSource = modelSource; }
}
