package com.snsoc.app.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.snsoc.app.R;

import java.util.ArrayList;
import java.util.List;

public class PortsAdapter extends RecyclerView.Adapter<PortsAdapter.ViewHolder> {

    public interface OnPortDeleteListener {
        void onDeletePort(int port);
    }

    private List<Integer> ports = new ArrayList<>();
    private final OnPortDeleteListener listener;

    public PortsAdapter(OnPortDeleteListener listener) {
        this.listener = listener;
    }

    public void setPorts(List<Integer> ports) {
        this.ports = ports != null ? ports : new ArrayList<>();
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_port, parent, false);
        return new ViewHolder(v);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        int port = ports.get(position);
        holder.tvPort.setText("Port " + port);
        holder.btnRemove.setOnClickListener(v -> {
            if (listener != null) {
                listener.onDeletePort(port);
            }
        });
    }

    @Override
    public int getItemCount() {
        return ports.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        TextView tvPort;
        Button btnRemove;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            tvPort = itemView.findViewById(R.id.tvPortNumber);
            btnRemove = itemView.findViewById(R.id.btnRemovePort);
        }
    }
}
