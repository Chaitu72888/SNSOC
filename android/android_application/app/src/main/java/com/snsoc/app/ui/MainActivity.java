package com.snsoc.app.ui;

import android.os.Bundle;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.Fragment;

import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.snsoc.app.R;

public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        BottomNavigationView bottomNav = findViewById(R.id.bottomNav);
        bottomNav.setOnItemSelectedListener(item -> {
            Fragment selectedFragment = null;
            int itemId = item.getItemId();

            if (itemId == R.id.nav_dashboard) {
                selectedFragment = new DashboardFragment();
            } else if (itemId == R.id.nav_intel) {
                selectedFragment = new IntelFragment();
            } else if (itemId == R.id.nav_ids) {
                selectedFragment = new IdsRulesFragment();
            } else if (itemId == R.id.nav_telemetry) {
                selectedFragment = new TelemetryFragment();
            } else if (itemId == R.id.nav_blocked) {
                selectedFragment = new BlockedIpsFragment();
            }

            if (selectedFragment != null) {
                getSupportFragmentManager().beginTransaction()
                        .replace(R.id.fragmentContainer, selectedFragment)
                        .commit();
                return true;
            }
            return false;
        });

        // Default layout
        if (savedInstanceState == null) {
            getSupportFragmentManager().beginTransaction()
                    .replace(R.id.fragmentContainer, new DashboardFragment())
                    .commit();
        }
    }
}
