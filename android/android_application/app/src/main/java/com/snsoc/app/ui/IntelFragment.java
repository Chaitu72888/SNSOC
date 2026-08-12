package com.snsoc.app.ui;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.snsoc.app.R;
import com.snsoc.app.api.ApiClient;
import com.snsoc.app.models.IntelRequest;
import com.snsoc.app.models.IntelResponse;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class IntelFragment extends Fragment {

    private EditText etIntelIp;
    private Spinner spZone;
    private Button btnLookup;
    private ProgressBar pbIntelLoading;
    private View cardIntelResult;
    private TextView tvResultIp, tvResultBadge, tvResultScore, tvResultDetails;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View v = inflater.inflate(R.layout.fragment_intel, container, false);

        etIntelIp = v.findViewById(R.id.etIntelIp);
        spZone = v.findViewById(R.id.spZone);
        btnLookup = v.findViewById(R.id.btnLookup);
        pbIntelLoading = v.findViewById(R.id.pbIntelLoading);
        cardIntelResult = v.findViewById(R.id.cardIntelResult);
        tvResultIp = v.findViewById(R.id.tvResultIp);
        tvResultBadge = v.findViewById(R.id.tvResultBadge);
        tvResultScore = v.findViewById(R.id.tvResultScore);
        tvResultDetails = v.findViewById(R.id.tvResultDetails);

        String[] zones = new String[]{
            "Zone 1 (Main Stadium)",
            "Zone 2 (Concourse)",
            "Zone 3 (VIP Lounge)"
        };
        ArrayAdapter<String> adapter = new ArrayAdapter<>(requireContext(), android.R.layout.simple_spinner_dropdown_item, zones);
        spZone.setAdapter(adapter);

        btnLookup.setOnClickListener(view -> performLookup());

        return v;
    }

    private void performLookup() {
        String ip = etIntelIp.getText().toString().trim();
        if (ip.isEmpty()) {
            Toast.makeText(getContext(), "Please enter an IP address", Toast.LENGTH_SHORT).show();
            return;
        }

        String zone = spZone.getSelectedItem() != null ? spZone.getSelectedItem().toString() : "Zone 1 (Main Stadium)";

        pbIntelLoading.setVisibility(View.VISIBLE);
        btnLookup.setEnabled(false);
        cardIntelResult.setVisibility(View.GONE);

        ApiClient.getService().lookupIp(new IntelRequest(ip, zone), "Android App").enqueue(new Callback<IntelResponse>() {
            @Override
            public void onResponse(Call<IntelResponse> call, Response<IntelResponse> response) {
                pbIntelLoading.setVisibility(View.GONE);
                btnLookup.setEnabled(true);

                if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                    IntelResponse.Data data = response.body().getData();
                    if (data != null) {
                        cardIntelResult.setVisibility(View.VISIBLE);
                        tvResultIp.setText(data.getIp() != null ? data.getIp() : ip);

                        int score = data.getScore();
                        tvResultScore.setText("Abuse / Threat Score: " + score + " / 100");

                        if (score > 70) {
                            tvResultBadge.setText("MALICIOUS");
                            tvResultBadge.setBackgroundResource(R.drawable.bg_badge_malicious);
                            tvResultBadge.setTextColor(getResources().getColor(R.color.status_malicious, null));
                        } else if (score > 30) {
                            tvResultBadge.setText("SUSPICIOUS");
                            tvResultBadge.setBackgroundResource(R.drawable.bg_badge_suspicious);
                            tvResultBadge.setTextColor(getResources().getColor(R.color.status_suspicious, null));
                        } else {
                            tvResultBadge.setText("CLEAN");
                            tvResultBadge.setBackgroundResource(R.drawable.bg_badge_clean);
                            tvResultBadge.setTextColor(getResources().getColor(R.color.status_clean, null));
                        }

                        String details = "Country: " + (data.getCountry() != null ? data.getCountry() : "N/A")
                                + " | ISP: " + (data.getIsp() != null ? data.getIsp() : "N/A")
                                + " | Reports: " + data.getReportsCount();
                        tvResultDetails.setText(details);
                    }
                } else {
                    Toast.makeText(getContext(), "Lookup failed", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<IntelResponse> call, Throwable t) {
                pbIntelLoading.setVisibility(View.GONE);
                btnLookup.setEnabled(true);
                Toast.makeText(getContext(), "Network error: " + t.getLocalizedMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }
}
