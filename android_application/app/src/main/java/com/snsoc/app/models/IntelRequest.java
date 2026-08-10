package com.snsoc.app.models;

public class IntelRequest {
    private String ip;
    private String zone;
    private String platform;

    public IntelRequest(String ip, String zone) {
        this.ip = ip;
        this.zone = zone;
        this.platform = "Android App";
    }

    public String getIp() { return ip; }
    public String getZone() { return zone; }
    public String getPlatform() { return platform; }
}
