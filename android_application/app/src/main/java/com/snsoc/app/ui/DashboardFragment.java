package com.snsoc.app.ui;

import android.os.Bundle;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.google.gson.Gson;
import com.snsoc.app.R;
import com.snsoc.app.adapters.AlertsAdapter;
import com.snsoc.app.api.ApiClient;
import com.snsoc.app.api.SocketManager;
import com.snsoc.app.models.AlertItem;
import com.snsoc.app.models.AlertsListResponse;
import com.snsoc.app.models.DashboardResponse;

import org.json.JSONObject;

import io.socket.emitter.Emitter;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class DashboardFragment extends Fragment {

    private static final String TAG = "DashboardFragment";

    private TextView tvThreatScore, tvThreatLevel, tvActiveAlerts, tvTotalPackets, tvBlockedIpsCount, tvSuspiciousPackets, tvNoAlerts;
    private ProgressBar pbThreatGauge;
    private SwipeRefreshLayout swipeRefresh;
    private RecyclerView rvAlerts;
    private AlertsAdapter alertsAdapter;
    private Gson gson = new Gson();

    // Socket Event Listeners
    private Emitter.Listener onThreatUpdate = args -> {
        if (getActivity() == null || args.length == 0) return;
        getActivity().runOnUiThread(() -> {
            try {
                JSONObject data = (JSONObject) args[0];
                double scoreVal = data.optDouble("score", 0.0);
                String level = data.optString("level", "LOW");

                int score = (int) Math.round(scoreVal);
                tvThreatScore.setText(score + " / 100");
                pbThreatGauge.setProgress(score);
                tvThreatLevel.setText(level);

                updateThreatLevelBadge(level);
            } catch (Exception e) {
                Log.e(TAG, "Error parsing threat_update: " + e.getMessage());
            }
        });
    };

    private Emitter.Listener onStatsUpdate = args -> {
        if (getActivity() == null || args.length == 0) return;
        getActivity().runOnUiThread(() -> {
            try {
                JSONObject data = (JSONObject) args[0];
                int totalPackets = data.optInt("total_packets", 0);
                tvTotalPackets.setText(String.valueOf(totalPackets));
            } catch (Exception e) {
                Log.e(TAG, "Error parsing stats_update: " + e.getMessage());
            }
        });
    };

    private Emitter.Listener onNewAlert = args -> {
        if (getActivity() == null || args.length == 0) return;
        getActivity().runOnUiThread(() -> {
            try {
                JSONObject data = (JSONObject) args[0];
                AlertItem alert = gson.fromJson(data.toString(), AlertItem.class);
                if (alert != null) {
                    alertsAdapter.addAlertToTop(alert);
                    rvAlerts.setVisibility(View.VISIBLE);
                    tvNoAlerts.setVisibility(View.GONE);
                    rvAlerts.smoothScrollToPosition(0);

                    // Update active alerts count
                    try {
                        int currentActive = Integer.parseInt(tvActiveAlerts.getText().toString());
                        tvActiveAlerts.setText(String.valueOf(currentActive + 1));
                    } catch (Exception ignored) {}
                }
            } catch (Exception e) {
                Log.e(TAG, "Error parsing new_alert: " + e.getMessage());
            }
        });
    };

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View v = inflater.inflate(R.layout.fragment_dashboard, container, false);

        tvThreatScore = v.findViewById(R.id.tvThreatScore);
        tvThreatLevel = v.findViewById(R.id.tvThreatLevel);
        tvActiveAlerts = v.findViewById(R.id.tvActiveAlerts);
        tvTotalPackets = v.findViewById(R.id.tvTotalPackets);
        tvBlockedIpsCount = v.findViewById(R.id.tvBlockedIpsCount);
        tvSuspiciousPackets = v.findViewById(R.id.tvSuspiciousPackets);
        tvNoAlerts = v.findViewById(R.id.tvNoAlerts);
        pbThreatGauge = v.findViewById(R.id.pbThreatGauge);
        swipeRefresh = v.findViewById(R.id.swipeRefresh);
        rvAlerts = v.findViewById(R.id.rvAlerts);

        rvAlerts.setLayoutManager(new LinearLayoutManager(getContext()));
        alertsAdapter = new AlertsAdapter();
        rvAlerts.setAdapter(alertsAdapter);

        swipeRefresh.setOnRefreshListener(this::loadDashboardData);

        loadDashboardData();

        return v;
    }

    @Override
    public void onStart() {
        super.onStart();
        // Register Socket.IO listeners for real-time live streaming
        SocketManager socketManager = SocketManager.getInstance();
        socketManager.on("threat_update", onThreatUpdate);
        socketManager.on("stats_update", onStatsUpdate);
        socketManager.on("new_alert", onNewAlert);
        socketManager.connect();
    }

    @Override
    public void onStop() {
        super.onStop();
        // Unregister listeners to avoid leaks
        SocketManager socketManager = SocketManager.getInstance();
        socketManager.off("threat_update", onThreatUpdate);
        socketManager.off("stats_update", onStatsUpdate);
        socketManager.off("new_alert", onNewAlert);
    }

    private void updateThreatLevelBadge(String level) {
        if ("HIGH".equalsIgnoreCase(level) || "CRITICAL".equalsIgnoreCase(level)) {
            tvThreatLevel.setBackgroundResource(R.drawable.bg_badge_malicious);
            tvThreatLevel.setTextColor(getResources().getColor(R.color.status_malicious, null));
        } else if ("MEDIUM".equalsIgnoreCase(level)) {
            tvThreatLevel.setBackgroundResource(R.drawable.bg_badge_suspicious);
            tvThreatLevel.setTextColor(getResources().getColor(R.color.status_suspicious, null));
        } else {
            tvThreatLevel.setBackgroundResource(R.drawable.bg_badge_clean);
            tvThreatLevel.setTextColor(getResources().getColor(R.color.status_clean, null));
        }
    }

    private void loadDashboardData() {
        swipeRefresh.setRefreshing(true);

        ApiClient.getService().getDashboard().enqueue(new Callback<DashboardResponse>() {
            @Override
            public void onResponse(Call<DashboardResponse> call, Response<DashboardResponse> response) {
                if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                    DashboardResponse.Data data = response.body().getData();
                    if (data != null) {
                        int score = Math.round(data.getThreatScore());
                        tvThreatScore.setText(score + " / 100");
                        pbThreatGauge.setProgress(score);
                        
                        String level = data.getThreatLevel() != null ? data.getThreatLevel() : "LOW";
                        tvThreatLevel.setText(level);
                        updateThreatLevelBadge(level);

                        tvActiveAlerts.setText(String.valueOf(data.getActiveAlerts()));
                        tvTotalPackets.setText(String.valueOf(data.getTotalPackets()));
                        tvBlockedIpsCount.setText(String.valueOf(data.getBlockedIps()));
                        tvSuspiciousPackets.setText(String.valueOf(data.getSuspiciousPackets()));
                    }
                }
                loadAlerts();
            }

            @Override
            public void onFailure(Call<DashboardResponse> call, Throwable t) {
                loadAlerts();
            }
        });
    }

    private void loadAlerts() {
        ApiClient.getService().getAlerts(20).enqueue(new Callback<AlertsListResponse>() {
            @Override
            public void onResponse(Call<AlertsListResponse> call, Response<AlertsListResponse> response) {
                swipeRefresh.setRefreshing(false);
                if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                    AlertsListResponse.Data data = response.body().getData();
                    if (data != null && data.getAlerts() != null && !data.getAlerts().isEmpty()) {
                        alertsAdapter.setAlerts(data.getAlerts());
                        rvAlerts.setVisibility(View.VISIBLE);
                        tvNoAlerts.setVisibility(View.GONE);
                    } else {
                        rvAlerts.setVisibility(View.GONE);
                        tvNoAlerts.setVisibility(View.VISIBLE);
                    }
                }
            }

            @Override
            public void onFailure(Call<AlertsListResponse> call, Throwable t) {
                swipeRefresh.setRefreshing(false);
                Toast.makeText(getContext(), "Failed to refresh dashboard", Toast.LENGTH_SHORT).show();
            }
        });
    }
}
