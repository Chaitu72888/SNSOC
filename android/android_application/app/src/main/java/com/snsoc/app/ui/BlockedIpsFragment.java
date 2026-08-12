package com.snsoc.app.ui;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.snsoc.app.R;
import com.snsoc.app.adapters.BlockedIpsAdapter;
import com.snsoc.app.api.ApiClient;
import com.snsoc.app.models.BlockRequest;
import com.snsoc.app.models.BlockedIpsResponse;
import com.snsoc.app.models.GenericResponse;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class BlockedIpsFragment extends Fragment implements BlockedIpsAdapter.OnUnblockListener {

    private EditText etBlockIp, etBlockReason;
    private Button btnBlockIp;
    private RecyclerView rvBlockedIps;
    private TextView tvNoBlockedIps;
    private BlockedIpsAdapter blockedAdapter;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View v = inflater.inflate(R.layout.fragment_blocked, container, false);

        etBlockIp = v.findViewById(R.id.etBlockIp);
        etBlockReason = v.findViewById(R.id.etBlockReason);
        btnBlockIp = v.findViewById(R.id.btnBlockIp);
        rvBlockedIps = v.findViewById(R.id.rvBlockedIps);
        tvNoBlockedIps = v.findViewById(R.id.tvNoBlockedIps);

        rvBlockedIps.setLayoutManager(new LinearLayoutManager(getContext()));
        blockedAdapter = new BlockedIpsAdapter(this);
        rvBlockedIps.setAdapter(blockedAdapter);

        btnBlockIp.setOnClickListener(view -> blockNewIp());

        loadBlockedIps();

        return v;
    }

    private void loadBlockedIps() {
        ApiClient.getService().getBlockedIps().enqueue(new Callback<BlockedIpsResponse>() {
            @Override
            public void onResponse(Call<BlockedIpsResponse> call, Response<BlockedIpsResponse> response) {
                if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                    if (response.body().getData() != null && !response.body().getData().isEmpty()) {
                        blockedAdapter.setItems(response.body().getData());
                        rvBlockedIps.setVisibility(View.VISIBLE);
                        tvNoBlockedIps.setVisibility(View.GONE);
                    } else {
                        rvBlockedIps.setVisibility(View.GONE);
                        tvNoBlockedIps.setVisibility(View.VISIBLE);
                    }
                }
            }

            @Override
            public void onFailure(Call<BlockedIpsResponse> call, Throwable t) {
                Toast.makeText(getContext(), "Failed to load blocked IPs", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void blockNewIp() {
        String ip = etBlockIp.getText().toString().trim();
        String reason = etBlockReason.getText().toString().trim();

        if (ip.isEmpty()) {
            Toast.makeText(getContext(), "Please enter IP address to block", Toast.LENGTH_SHORT).show();
            return;
        }

        if (reason.isEmpty()) reason = "Manual mobile operator block";

        ApiClient.getService().addBlock(new BlockRequest(ip, reason)).enqueue(new Callback<GenericResponse>() {
            @Override
            public void onResponse(Call<GenericResponse> call, Response<GenericResponse> response) {
                if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                    etBlockIp.setText("");
                    etBlockReason.setText("");
                    Toast.makeText(getContext(), "IP blocked successfully", Toast.LENGTH_SHORT).show();
                    loadBlockedIps();
                } else {
                    Toast.makeText(getContext(), "Error blocking IP", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<GenericResponse> call, Throwable t) {
                Toast.makeText(getContext(), "Network error", Toast.LENGTH_SHORT).show();
            }
        });
    }

    @Override
    public void onUnblockIp(String ip) {
        ApiClient.getService().removeBlock(ip).enqueue(new Callback<GenericResponse>() {
            @Override
            public void onResponse(Call<GenericResponse> call, Response<GenericResponse> response) {
                if (response.isSuccessful()) {
                    Toast.makeText(getContext(), "IP unblocked", Toast.LENGTH_SHORT).show();
                    loadBlockedIps();
                }
            }

            @Override
            public void onFailure(Call<GenericResponse> call, Throwable t) {
                Toast.makeText(getContext(), "Error unblocking IP", Toast.LENGTH_SHORT).show();
            }
        });
    }
}
