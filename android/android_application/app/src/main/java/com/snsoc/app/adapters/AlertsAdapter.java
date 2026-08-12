package com.snsoc.app.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.snsoc.app.R;
import com.snsoc.app.models.AlertItem;

import java.util.ArrayList;
import java.util.List;

public class AlertsAdapter extends RecyclerView.Adapter<AlertsAdapter.ViewHolder> {

    private List<AlertItem> alerts = new ArrayList<>();

    public void setAlerts(List<AlertItem> alerts) {
        this.alerts = alerts != null ? alerts : new ArrayList<>();
        notifyDataSetChanged();
    }

    public void addAlertToTop(AlertItem alert) {
        if (alert != null) {
            this.alerts.add(0, alert);
            notifyItemInserted(0);
        }
    }


    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_alert, parent, false);
        return new ViewHolder(v);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        AlertItem alert = alerts.get(position);
        holder.tvTitle.setText(alert.getTitle() != null ? alert.getTitle() : "Security Event");
        holder.tvMessage.setText(alert.getMessage() != null ? alert.getMessage() : "");
        
        String severity = alert.getSeverity() != null ? alert.getSeverity().toUpperCase() : "MEDIUM";
        holder.tvSeverity.setText(severity);

        String meta = "Src: " + (alert.getSrcIp() != null ? alert.getSrcIp() : "N/A");
        if (alert.getDstPort() != null) {
            meta += " -> Port: " + alert.getDstPort();
        }
        if (alert.getRuleName() != null) {
            meta += " | Rule: " + alert.getRuleName();
        }
        holder.tvMeta.setText(meta);
    }

    @Override
    public int getItemCount() {
        return alerts.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        TextView tvTitle, tvSeverity, tvMessage, tvMeta;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            tvTitle = itemView.findViewById(R.id.tvAlertTitle);
            tvSeverity = itemView.findViewById(R.id.tvAlertSeverity);
            tvMessage = itemView.findViewById(R.id.tvAlertMessage);
            tvMeta = itemView.findViewById(R.id.tvAlertMeta);
        }
    }
}
