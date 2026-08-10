package com.snsoc.app.models;

import java.util.List;

public class BlockedIpsResponse {
    private boolean success;
    private List<BlockedIpItem> data;

    public boolean isSuccess() { return success; }
    public List<BlockedIpItem> getData() { return data; }
}
