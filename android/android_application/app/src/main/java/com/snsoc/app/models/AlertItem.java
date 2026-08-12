package com.snsoc.app.models;

import com.google.gson.annotations.SerializedName;

public class AlertItem {
    private int id;
    private double timestamp;
    private String title;
    private String message;
    private String severity;

    @SerializedName("src_ip")
    private String srcIp;

    @SerializedName("dst_ip")
    private String dstIp;

    @SerializedName("dst_port")
    private Integer dstPort;

    private String protocol;
    private String status;

    @SerializedName("rule_name")
    private String ruleName;

    public int getId() { return id; }
    public double getTimestamp() { return timestamp; }
    public String getTitle() { return title; }
    public String getMessage() { return message; }
    public String getSeverity() { return severity; }
    public String getSrcIp() { return srcIp; }
    public String getDstIp() { return dstIp; }
    public Integer getDstPort() { return dstPort; }
    public String getProtocol() { return protocol; }
    public String getStatus() { return status; }
    public String getRuleName() { return ruleName; }
}
