package com.snsoc.app.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.snsoc.app.R;
import com.snsoc.app.models.TelemetryResponse;

import java.util.ArrayList;
import java.util.List;

public class TelemetryLogsAdapter extends RecyclerView.Adapter<TelemetryLogsAdapter.ViewHolder> {

    private List<TelemetryResponse.ApiLogItem> logs = new ArrayList<>();

    public void setLogs(List<TelemetryResponse.ApiLogItem> logs) {
        this.logs = logs != null ? logs : new ArrayList<>();
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_log, parent, false);
        return new ViewHolder(v);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        TelemetryResponse.ApiLogItem log = logs.get(position);
        holder.tvEndpoint.setText(log.getEndpoint() != null ? log.getEndpoint() : "/api/intel/lookup");
        
        String meta = "Platform: " + (log.getPlatform() != null ? log.getPlatform() : "Android App")
                + " | Sent: " + log.getBytesSent() + "B, Recv: " + log.getBytesRecv() + "B";
        holder.tvMeta.setText(meta);

        String status = log.getStatus() != null ? log.getStatus() : "Clean";
        holder.tvStatus.setText(status);
    }

    @Override
    public int getItemCount() {
        return logs.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        TextView tvEndpoint, tvMeta, tvStatus;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            tvEndpoint = itemView.findViewById(R.id.tvLogEndpoint);
            tvMeta = itemView.findViewById(R.id.tvLogMeta);
            tvStatus = itemView.findViewById(R.id.tvLogStatus);
        }
    }
}
