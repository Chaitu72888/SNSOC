package com.snsoc.app.models;

import com.google.gson.annotations.SerializedName;

public class BlockedIpItem {
    private int id;
    private String ip;
    private String reason;

    @SerializedName("blocked_at")
    private String blockedAt;

    @SerializedName("blocked_by")
    private String blockedBy;

    public int getId() { return id; }
    public String getIp() { return ip; }
    public String getReason() { return reason; }
    public String getBlockedAt() { return blockedAt; }
    public String getBlockedBy() { return blockedBy; }
}
