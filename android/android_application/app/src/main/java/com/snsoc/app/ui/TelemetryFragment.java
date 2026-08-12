package com.snsoc.app.ui;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.widget.SwitchCompat;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.snsoc.app.R;
import com.snsoc.app.adapters.TelemetryLogsAdapter;
import com.snsoc.app.api.ApiClient;
import com.snsoc.app.models.GenericResponse;
import com.snsoc.app.models.TelemetryResponse;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class TelemetryFragment extends Fragment {

    private TextView tvMonthlyUsage, tvWeeklyAndroid, tvWeeklyWeb, tvPlatformPctLabel;
    private ProgressBar pbPlatformPct;
    private SwitchCompat swLowDataMode;
    private Button btnSyncNow;
    private RecyclerView rvTelemetryLogs;
    private TelemetryLogsAdapter logsAdapter;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View v = inflater.inflate(R.layout.fragment_telemetry, container, false);

        tvMonthlyUsage = v.findViewById(R.id.tvMonthlyUsage);
        tvWeeklyAndroid = v.findViewById(R.id.tvWeeklyAndroid);
        tvWeeklyWeb = v.findViewById(R.id.tvWeeklyWeb);
        tvPlatformPctLabel = v.findViewById(R.id.tvPlatformPctLabel);
        pbPlatformPct = v.findViewById(R.id.pbPlatformPct);
        swLowDataMode = v.findViewById(R.id.swLowDataMode);
        btnSyncNow = v.findViewById(R.id.btnSyncNow);
        rvTelemetryLogs = v.findViewById(R.id.rvTelemetryLogs);

        rvTelemetryLogs.setLayoutManager(new LinearLayoutManager(getContext()));
        logsAdapter = new TelemetryLogsAdapter();
        rvTelemetryLogs.setAdapter(logsAdapter);

        btnSyncNow.setOnClickListener(view -> triggerSync());

        loadTelemetryData();

        return v;
    }

    private void loadTelemetryData() {
        ApiClient.getService().getTelemetryConsumption().enqueue(new Callback<TelemetryResponse>() {
            @Override
            public void onResponse(Call<TelemetryResponse> call, Response<TelemetryResponse> response) {
                if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                    TelemetryResponse.Data data = response.body().getData();
                    if (data != null) {
                        tvMonthlyUsage.setText(data.getMonthlyUsageKb() + " KB");
                        tvWeeklyAndroid.setText("Android: " + data.getAndroidWeeklyMb() + " MB");
                        tvWeeklyWeb.setText("Web: " + data.getWebWeeklyMb() + " MB");

                        int androidPct = data.getAndroidPct();
                        int webPct = data.getWebPct();
                        pbPlatformPct.setProgress(androidPct);
                        tvPlatformPctLabel.setText("Android: " + androidPct + "% | Web: " + webPct + "%");

                        if (data.getRecentLookups() != null) {
                            logsAdapter.setLogs(data.getRecentLookups());
                        }
                    }
                }
            }

            @Override
            public void onFailure(Call<TelemetryResponse> call, Throwable t) {
                Toast.makeText(getContext(), "Failed to load telemetry metrics", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void triggerSync() {
        btnSyncNow.setEnabled(false);
        ApiClient.getService().syncTelemetry("Android App").enqueue(new Callback<GenericResponse>() {
            @Override
            public void onResponse(Call<GenericResponse> call, Response<GenericResponse> response) {
                btnSyncNow.setEnabled(true);
                if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                    Toast.makeText(getContext(), "Mobile Telemetry Synced with Web Server!", Toast.LENGTH_SHORT).show();
                    loadTelemetryData();
                } else {
                    Toast.makeText(getContext(), "Sync complete", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<GenericResponse> call, Throwable t) {
                btnSyncNow.setEnabled(true);
                Toast.makeText(getContext(), "Sync error: " + t.getLocalizedMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }
}
