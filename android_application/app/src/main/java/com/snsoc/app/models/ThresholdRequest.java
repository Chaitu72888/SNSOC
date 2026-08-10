package com.snsoc.app.models;

import com.google.gson.annotations.SerializedName;

public class ThresholdRequest {
    @SerializedName("max_packets")
    private int maxPackets;

    @SerializedName("window_seconds")
    private int windowSeconds;

    public ThresholdRequest(int maxPackets, int windowSeconds) {
        this.maxPackets = maxPackets;
        this.windowSeconds = windowSeconds;
    }

    public int getMaxPackets() { return maxPackets; }
    public int getWindowSeconds() { return windowSeconds; }
}
