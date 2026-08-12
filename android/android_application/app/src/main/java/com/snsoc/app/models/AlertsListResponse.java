package com.snsoc.app.models;

import java.util.List;

public class AlertsListResponse {
    private boolean success;
    private Data data;

    public static class Data {
        private int total;
        private List<AlertItem> alerts;

        public int getTotal() { return total; }
        public List<AlertItem> getAlerts() { return alerts; }
    }

    public boolean isSuccess() { return success; }
    public Data getData() { return data; }
}
