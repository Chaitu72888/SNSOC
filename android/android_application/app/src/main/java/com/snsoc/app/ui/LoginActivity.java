package com.snsoc.app.ui;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.snsoc.app.R;
import com.snsoc.app.api.ApiClient;
import com.snsoc.app.models.LoginRequest;
import com.snsoc.app.models.LoginResponse;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class LoginActivity extends AppCompatActivity {

    private EditText etUsername, etPassword;
    private Button btnLogin;
    private ProgressBar pbLoading;
    private TextView tvError;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        etUsername = findViewById(R.id.etUsername);
        etPassword = findViewById(R.id.etPassword);
        btnLogin = findViewById(R.id.btnLogin);
        pbLoading = findViewById(R.id.pbLoading);
        tvError = findViewById(R.id.tvError);

        btnLogin.setOnClickListener(v -> performLogin());
    }

    private void performLogin() {
        String username = etUsername.getText().toString().trim();
        String password = etPassword.getText().toString().trim();

        if (username.isEmpty() || password.isEmpty()) {
            tvError.setText("Username and password are required");
            tvError.setVisibility(View.VISIBLE);
            return;
        }

        tvError.setVisibility(View.GONE);
        pbLoading.setVisibility(View.VISIBLE);
        btnLogin.setEnabled(false);

        ApiClient.getService().login(new LoginRequest(username, password)).enqueue(new Callback<LoginResponse>() {
            @Override
            public void onResponse(Call<LoginResponse> call, Response<LoginResponse> response) {
                pbLoading.setVisibility(View.GONE);
                btnLogin.setEnabled(true);

                if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                    Toast.makeText(LoginActivity.this, "Authentication Successful!", Toast.LENGTH_SHORT).show();
                    Intent intent = new Intent(LoginActivity.this, MainActivity.class);
                    startActivity(intent);
                    finish();
                } else {
                    String err = "Invalid username or passcode";
                    if (response.body() != null && response.body().getError() != null) {
                        err = response.body().getError();
                    }
                    tvError.setText(err);
                    tvError.setVisibility(View.VISIBLE);
                }
            }

            @Override
            public void onFailure(Call<LoginResponse> call, Throwable t) {
                pbLoading.setVisibility(View.GONE);
                btnLogin.setEnabled(true);
                tvError.setText("Connection failed: " + t.getLocalizedMessage());
                tvError.setVisibility(View.VISIBLE);
            }
        });
    }
}
