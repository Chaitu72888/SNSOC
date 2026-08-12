package com.snsoc.app.models;

import com.google.gson.annotations.SerializedName;

public class IntelResponse {
    private boolean success;
    private Data data;

    public static class Data {
        private String ip;
        private int score;
        private String country;

        @SerializedName("isp")
        private String isp;

        @SerializedName("reports_count")
        private int reportsCount;

        @SerializedName("virustotal_stats")
        private Object virustotalStats;

        public String getIp() { return ip; }
        public int getScore() { return score; }
        public String getCountry() { return country; }
        public String getIsp() { return isp; }
        public int getReportsCount() { return reportsCount; }
    }

    public boolean isSuccess() { return success; }
    public Data getData() { return data; }
}
