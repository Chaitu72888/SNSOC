package com.snsoc.app.api;

import com.snsoc.app.models.*;
import retrofit2.Call;
import retrofit2.http.*;

public interface ApiService {

    @POST("auth/login")
    Call<LoginResponse> login(@Body LoginRequest request);

    @POST("auth/logout")
    Call<GenericResponse> logout();

    @GET("api/dashboard")
    Call<DashboardResponse> getDashboard();

    @GET("api/alerts")
    Call<AlertsListResponse> getAlerts(@Query("limit") int limit);

    @POST("api/intel/lookup")
    Call<IntelResponse> lookupIp(@Body IntelRequest request, @Header("X-Platform") String platform);

    @GET("api/ids/rules")
    Call<IdsRulesResponse> getIdsRules();

    @POST("api/ids/rules/ports")
    Call<GenericResponse> addPort(@Body PortAddRequest request);

    @DELETE("api/ids/rules/ports/{port}")
    Call<GenericResponse> removePort(@Path("port") int port);

    @POST("api/ids/thresholds")
    Call<GenericResponse> updateThreshold(@Body ThresholdRequest request);

    @GET("api/telemetry/consumption")
    Call<TelemetryResponse> getTelemetryConsumption();

    @POST("api/telemetry/sync")
    Call<GenericResponse> syncTelemetry(@Header("X-Platform") String platform);

    @GET("api/block")
    Call<BlockedIpsResponse> getBlockedIps();

    @POST("api/block")
    Call<GenericResponse> addBlock(@Body BlockRequest request);

    @DELETE("api/block/{ip}")
    Call<GenericResponse> removeBlock(@Path("ip") String ip);
}
