package com.saarthi.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Map;

public class PredictRequest {
    @JsonProperty("rain_3d")
    private Double rain3d = 0.0;

    @JsonProperty("rain_7d")
    private Double rain7d = 0.0;

    @JsonProperty("rain_14d")
    private Double rain14d = 0.0;

    @JsonProperty("rain_30d")
    private Double rain30d = 0.0;

    @JsonProperty("dry_days_7d")
    private Double dryDays7d = 0.0;

    @JsonProperty("dry_days_14d")
    private Double dryDays14d = 0.0;

    private String block = "Sangrur";

    public Double getRain3d() { return rain3d != null ? rain3d : 0.0; }
    public void setRain3d(Double rain3d) { this.rain3d = rain3d; }

    public Double getRain7d() { return rain7d != null ? rain7d : 0.0; }
    public void setRain7d(Double rain7d) { this.rain7d = rain7d; }

    public Double getRain14d() { return rain14d != null ? rain14d : 0.0; }
    public void setRain14d(Double rain14d) { this.rain14d = rain14d; }

    public Double getRain30d() { return rain30d != null ? rain30d : 0.0; }
    public void setRain30d(Double rain30d) { this.rain30d = rain30d; }

    public Double getDryDays7d() { return dryDays7d != null ? dryDays7d : 0.0; }
    public void setDryDays7d(Double dryDays7d) { this.dryDays7d = dryDays7d; }

    public Double getDryDays14d() { return dryDays14d != null ? dryDays14d : 0.0; }
    public void setDryDays14d(Double dryDays14d) { this.dryDays14d = dryDays14d; }

    public String getBlock() { return block != null ? block : "Sangrur"; }
    public void setBlock(String block) { this.block = block; }
}
