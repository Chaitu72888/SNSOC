package com.snsoc.app.models;

import com.google.gson.annotations.SerializedName;

public class DashboardResponse {
    private boolean success;
    private Data data;

    public static class Data {
        @SerializedName("total_packets")
        private int totalPackets;

        @SerializedName("suspicious_packets")
        private int suspiciousPackets;

        @SerializedName("blocked_ips")
        private int blockedIps;

        @SerializedName("active_alerts")
        private int activeAlerts;

        @SerializedName("threat_score")
        private float threatScore;

        @SerializedName("threat_level")
        private String threatLevel;

        @SerializedName("system_status")
        private String systemStatus;

        public int getTotalPackets() { return totalPackets; }
        public int getSuspiciousPackets() { return suspiciousPackets; }
        public int getBlockedIps() { return blockedIps; }
        public int getActiveAlerts() { return activeAlerts; }
        public float getThreatScore() { return threatScore; }
        public String getThreatLevel() { return threatLevel; }
        public String getSystemStatus() { return systemStatus; }
    }

    public boolean isSuccess() { return success; }
    public Data getData() { return data; }
}
