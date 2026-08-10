package com.snsoc.app.ui;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.snsoc.app.R;
import com.snsoc.app.adapters.PortsAdapter;
import com.snsoc.app.api.ApiClient;
import com.snsoc.app.models.GenericResponse;
import com.snsoc.app.models.IdsRulesResponse;
import com.snsoc.app.models.PortAddRequest;
import com.snsoc.app.models.ThresholdRequest;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class IdsRulesFragment extends Fragment implements PortsAdapter.OnPortDeleteListener {

    private EditText etNewPort, etMaxPackets, etWindowSeconds;
    private Button btnAddPort, btnSaveThreshold;
    private RecyclerView rvPorts;
    private PortsAdapter portsAdapter;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View v = inflater.inflate(R.layout.fragment_ids, container, false);

        etNewPort = v.findViewById(R.id.etNewPort);
        etMaxPackets = v.findViewById(R.id.etMaxPackets);
        etWindowSeconds = v.findViewById(R.id.etWindowSeconds);
        btnAddPort = v.findViewById(R.id.btnAddPort);
        btnSaveThreshold = v.findViewById(R.id.btnSaveThreshold);
        rvPorts = v.findViewById(R.id.rvPorts);

        rvPorts.setLayoutManager(new LinearLayoutManager(getContext()));
        portsAdapter = new PortsAdapter(this);
        rvPorts.setAdapter(portsAdapter);

        btnAddPort.setOnClickListener(view -> addPort());
        btnSaveThreshold.setOnClickListener(view -> saveThreshold());

        loadRules();

        return v;
    }

    private void loadRules() {
        ApiClient.getService().getIdsRules().enqueue(new Callback<IdsRulesResponse>() {
            @Override
            public void onResponse(Call<IdsRulesResponse> call, Response<IdsRulesResponse> response) {
                if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                    IdsRulesResponse.Data data = response.body().getData();
                    if (data != null) {
                        if (data.getProtectedPorts() != null) {
                            portsAdapter.setPorts(data.getProtectedPorts());
                        }
                        if (data.getThreshold() != null) {
                            etMaxPackets.setText(String.valueOf(data.getThreshold().getMaxPackets()));
                            etWindowSeconds.setText(String.valueOf(data.getThreshold().getWindowSeconds()));
                        }
                    }
                }
            }

            @Override
            public void onFailure(Call<IdsRulesResponse> call, Throwable t) {
                Toast.makeText(getContext(), "Failed to load IDS rules", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void addPort() {
        String pStr = etNewPort.getText().toString().trim();
        if (pStr.isEmpty()) return;
        try {
            int port = Integer.parseInt(pStr);
            ApiClient.getService().addPort(new PortAddRequest(port)).enqueue(new Callback<GenericResponse>() {
                @Override
                public void onResponse(Call<GenericResponse> call, Response<GenericResponse> response) {
                    if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                        etNewPort.setText("");
                        loadRules();
                        Toast.makeText(getContext(), "Protected port added", Toast.LENGTH_SHORT).show();
                    }
                }

                @Override
                public void onFailure(Call<GenericResponse> call, Throwable t) {
                    Toast.makeText(getContext(), "Error adding port", Toast.LENGTH_SHORT).show();
                }
            });
        } catch (NumberFormatException e) {
            Toast.makeText(getContext(), "Invalid port number", Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    public void onDeletePort(int port) {
        ApiClient.getService().removePort(port).enqueue(new Callback<GenericResponse>() {
            @Override
            public void onResponse(Call<GenericResponse> call, Response<GenericResponse> response) {
                if (response.isSuccessful()) {
                    loadRules();
                    Toast.makeText(getContext(), "Port removed", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<GenericResponse> call, Throwable t) {
                Toast.makeText(getContext(), "Error removing port", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void saveThreshold() {
        String maxStr = etMaxPackets.getText().toString().trim();
        String winStr = etWindowSeconds.getText().toString().trim();

        if (maxStr.isEmpty() || winStr.isEmpty()) return;

        try {
            int maxP = Integer.parseInt(maxStr);
            int winS = Integer.parseInt(winStr);

            ApiClient.getService().updateThreshold(new ThresholdRequest(maxP, winS)).enqueue(new Callback<GenericResponse>() {
                @Override
                public void onResponse(Call<GenericResponse> call, Response<GenericResponse> response) {
                    if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                        Toast.makeText(getContext(), "Threshold rules updated successfully!", Toast.LENGTH_SHORT).show();
                    }
                }

                @Override
                public void onFailure(Call<GenericResponse> call, Throwable t) {
                    Toast.makeText(getContext(), "Error saving threshold rules", Toast.LENGTH_SHORT).show();
                }
            });
        } catch (NumberFormatException e) {
            Toast.makeText(getContext(), "Invalid numeric value", Toast.LENGTH_SHORT).show();
        }
    }
}
