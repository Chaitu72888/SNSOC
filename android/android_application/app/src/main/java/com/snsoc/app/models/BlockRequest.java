package com.snsoc.app.models;

public class BlockRequest {
    private String ip;
    private String reason;

    public BlockRequest(String ip, String reason) {
        this.ip = ip;
        this.reason = reason;
    }

    public String getIp() { return ip; }
    public String getReason() { return reason; }
}
