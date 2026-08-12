package com.snsoc.app.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.snsoc.app.R;
import com.snsoc.app.models.BlockedIpItem;

import java.util.ArrayList;
import java.util.List;

public class BlockedIpsAdapter extends RecyclerView.Adapter<BlockedIpsAdapter.ViewHolder> {

    public interface OnUnblockListener {
        void onUnblockIp(String ip);
    }

    private List<BlockedIpItem> items = new ArrayList<>();
    private final OnUnblockListener listener;

    public BlockedIpsAdapter(OnUnblockListener listener) {
        this.listener = listener;
    }

    public void setItems(List<BlockedIpItem> items) {
        this.items = items != null ? items : new ArrayList<>();
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_blocked_ip, parent, false);
        return new ViewHolder(v);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        BlockedIpItem item = items.get(position);
        holder.tvIp.setText(item.getIp());
        holder.tvReason.setText(item.getReason() != null ? item.getReason() : "Manual block");
        holder.btnUnblock.setOnClickListener(v -> {
            if (listener != null) {
                listener.onUnblockIp(item.getIp());
            }
        });
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        TextView tvIp, tvReason;
        Button btnUnblock;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            tvIp = itemView.findViewById(R.id.tvBlockedIp);
            tvReason = itemView.findViewById(R.id.tvBlockedReason);
            btnUnblock = itemView.findViewById(R.id.btnUnblock);
        }
    }
}
