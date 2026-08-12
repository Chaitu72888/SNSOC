package com.snsoc.app.models;

import com.google.gson.annotations.SerializedName;
import java.util.List;

public class TelemetryResponse {
    private boolean success;
    private Data data;

    public static class Data {
        @SerializedName("monthly_usage_kb")
        private double monthlyUsageKb;

        @SerializedName("android_weekly_mb")
        private double androidWeeklyMb;

        @SerializedName("web_weekly_mb")
        private double webWeeklyMb;

        @SerializedName("android_pct")
        private int androidPct;

        @SerializedName("web_pct")
        private int webPct;

        @SerializedName("recent_lookups")
        private List<ApiLogItem> recentLookups;

        public double getMonthlyUsageKb() { return monthlyUsageKb; }
        public double getAndroidWeeklyMb() { return androidWeeklyMb; }
        public double getWebWeeklyMb() { return webWeeklyMb; }
        public int getAndroidPct() { return androidPct; }
        public int getWebPct() { return webPct; }
        public List<ApiLogItem> getRecentLookups() { return recentLookups; }
    }

    public static class ApiLogItem {
        private int id;
        private double timestamp;
        private String endpoint;
        private String platform;

        @SerializedName("bytes_sent")
        private int bytesSent;

        @SerializedName("bytes_recv")
        private int bytesRecv;

        private String ip;
        private String zone;
        private String status;
        private int score;

        public int getId() { return id; }
        public double getTimestamp() { return timestamp; }
        public String getEndpoint() { return endpoint; }
        public String getPlatform() { return platform; }
        public int getBytesSent() { return bytesSent; }
        public int getBytesRecv() { return bytesRecv; }
        public String getIp() { return ip; }
        public String getZone() { return zone; }
        public String getStatus() { return status; }
        public int getScore() { return score; }
    }

    public boolean isSuccess() { return success; }
    public Data getData() { return data; }
}
