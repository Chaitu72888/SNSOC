package com.snsoc.app.models;

import com.google.gson.annotations.SerializedName;
import java.util.List;

public class IdsRulesResponse {
    private boolean success;
    private Data data;

    public static class Data {
        @SerializedName("protected_ports")
        private List<Integer> protectedPorts;

        private Threshold threshold;

        public List<Integer> getProtectedPorts() { return protectedPorts; }
        public Threshold getThreshold() { return threshold; }
    }

    public static class Threshold {
        @SerializedName("max_packets")
        private int maxPackets;

        @SerializedName("window_seconds")
        private int windowSeconds;

        public int getMaxPackets() { return maxPackets; }
        public int getWindowSeconds() { return windowSeconds; }
    }

    public boolean isSuccess() { return success; }
    public Data getData() { return data; }
}
