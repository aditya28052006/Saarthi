package com.saarthi.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

public class MapDataResponse {
    private String district = "Sangrur District, Punjab";
    private Map<String, Object> center;
    private List<VillageData> villages;

    @JsonProperty("total_monitored")
    private int totalMonitored;

    @JsonProperty("total_panchayats")
    private String totalPanchayats = "1,200+";

    public static class VillageData {
        private String name;
        private String block;
        private double lat;
        private double lng;

        @JsonProperty("risk_score")
        private int riskScore;

        @JsonProperty("risk_level")
        private String riskLevel;

        @JsonProperty("soil_type")
        private String soilType;

        @JsonProperty("soil_moisture")
        private String soilMoisture;

        private String decision;
        private String advisory;

        public VillageData() {}

        public VillageData(String name, String block, double lat, double lng, int riskScore, String riskLevel, String soilType, String soilMoisture, String decision, String advisory) {
            this.name = name;
            this.block = block;
            this.lat = lat;
            this.lng = lng;
            this.riskScore = riskScore;
            this.riskLevel = riskLevel;
            this.soilType = soilType;
            this.soilMoisture = soilMoisture;
            this.decision = decision;
            this.advisory = advisory;
        }

        // Getters and setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getBlock() { return block; }
        public void setBlock(String block) { this.block = block; }

        public double getLat() { return lat; }
        public void setLat(double lat) { this.lat = lat; }

        public double getLng() { return lng; }
        public void setLng(double lng) { this.lng = lng; }

        public int getRiskScore() { return riskScore; }
        public void setRiskScore(int riskScore) { this.riskScore = riskScore; }

        public String getRiskLevel() { return riskLevel; }
        public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

        public String getSoilType() { return soilType; }
        public void setSoilType(String soilType) { this.soilType = soilType; }

        public String getSoilMoisture() { return soilMoisture; }
        public void setSoilMoisture(String soilMoisture) { this.soilMoisture = soilMoisture; }

        public String getDecision() { return decision; }
        public void setDecision(String decision) { this.decision = decision; }

        public String getAdvisory() { return advisory; }
        public void setAdvisory(String advisory) { this.advisory = advisory; }
    }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }

    public Map<String, Object> getCenter() { return center; }
    public void setCenter(Map<String, Object> center) { this.center = center; }

    public List<VillageData> getVillages() { return villages; }
    public void setVillages(List<VillageData> villages) { this.villages = villages; }

    public int getTotalMonitored() { return totalMonitored; }
    public void setTotalMonitored(int totalMonitored) { this.totalMonitored = totalMonitored; }

    public String getTotalPanchayats() { return totalPanchayats; }
    public void setTotalPanchayats(String totalPanchayats) { this.totalPanchayats = totalPanchayats; }
}
