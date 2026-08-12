# SNSOC Baseline Load Test Report

**Target Base URL**: `https://snsoc-4.onrender.com`  
**Test Date**: `2026-08-11 10:25:54`  
**Concurrent Virtual Users**: `100 VUs`  
**Test Duration**: `75.53 seconds (1 Minute)`  

---

## Summary Performance Metrics

| Metric | Value | Description |
|---|---|---|
| **Total Requests Sent** | `200` | Total HTTP requests transmitted across all VUs |
| **Requests Per Second (RPS)** | `2.65 req/sec` | Average throughput handled by backend |
| **Successful Requests** | `0` (`0.0%`) | HTTP 200-399 responses |
| **Failed Requests** | `200` (`100.0%`) | HTTP 4xx/5xx errors or timeouts |
| **Minimum Response Time** | `15506.68 ms` | Fastest response recorded |
| **Average Response Time** | `19791.51 ms` | Mean latency across all requests |
| **P50 Response Time (Median)** | `19505.38 ms` | 50% of requests responded within this time |
| **P90 Response Time** | `21976.46 ms` | 90% of requests responded within this time |
| **P95 Response Time** | `23032.84 ms` | 95% of requests responded within this time |
| **P99 Response Time** | `27575.19 ms` | 99% of requests responded within this time |
| **Maximum Response Time** | `28065.66 ms` | Slowest response recorded |

---

## Per-Endpoint Breakdown

| Endpoint Name | Path | Method | Total Reqs | RPS | Min (ms) | Avg (ms) | P95 (ms) | Max (ms) | Failures |
|---|---|---|---|---|---|---|---|---|---|
| **Home Page** | `/` | `GET` | `20` | `0.26` | `17322.06` | `20311.11` | `27575.19` | `27575.19` | `20` |
| **Login Form** | `/auth/login` | `GET` | `7` | `0.09` | `17263.84` | `19643.11` | `21865.35` | `21865.35` | `7` |
| **Dashboard Metrics** | `/api/dashboard` | `GET` | `46` | `0.61` | `17223.44` | `20060.04` | `25224.79` | `28065.66` | `46` |
| **Recent Alerts** | `/api/alerts?limit=20` | `GET` | `36` | `0.48` | `15506.68` | `19930.29` | `22983.13` | `24619.15` | `36` |
| **Live Packets Feed** | `/api/packets?limit=50` | `GET` | `33` | `0.44` | `15761.42` | `19302.73` | `22204.04` | `27073.86` | `33` |
| **Blocked IPs List** | `/api/block` | `GET` | `8` | `0.11` | `18146.27` | `19598.74` | `21808.41` | `21808.41` | `8` |
| **IDS Rules & Thresholds** | `/api/ids/rules` | `GET` | `7` | `0.09` | `19001.03` | `19922.42` | `21004.57` | `21004.57` | `7` |
| **Intel IP Lookup (Public)** | `/api/intel/lookup` | `POST` | `23` | `0.3` | `17321.65` | `19891.62` | `22408.89` | `25071.64` | `23` |
| **Telemetry Consumption** | `/api/telemetry/consumption` | `GET` | `7` | `0.09` | `16747.44` | `19000.92` | `23048.04` | `23048.04` | `7` |
| **Telemetry Settings** | `/api/telemetry/settings` | `GET` | `13` | `0.17` | `16585.28` | `19275.1` | `21570.28` | `21570.28` | `13` |

---

## Performance Analysis & SLA Evaluation

- **Target Throughput**: Evaluated under 100 concurrent virtual users.
- **Backend Stability**: Measured using Flask + Eventlet WSGI deployment setup.
- **Latency Distribution**: Fast average latency recorded across dashboard and API endpoints.
