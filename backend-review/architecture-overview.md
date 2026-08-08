# Architecture Overview

## 1. System Architecture

The **SNSOC (Security Operations Center)** system is built as a hybrid real-time threat monitoring and response architecture. It consists of a Flask WSGI core application, background packet capture threads, machine learning threat scoring, operating system firewall integrations, and cross-platform REST APIs for Web and Mobile clients.

```
┌─────────────────────────────────────────────────────────┐
│                    Clients Layer                        │
│   ┌─────────────────────┐     ┌─────────────────────┐   │
│   │   Web Dashboard     │     │    Android Mobile   │   │
│   └──────────┬──────────┘     └──────────┬──────────┘   │
└──────────────┼───────────────────────────┼──────────────┘
               │ HTTP / WebSockets         │ REST / X-Platform
┌──────────────▼───────────────────────────▼──────────────┐
│                   Flask API Layer                       │
│  ┌──────────┬────────────┬───────────┬───────────────┐  │
│  │ Auth BP  │ Dashboard  │  IDS BP   │ Telemetry BP  │  │
│  └──────────┴────────────┴───────────┴───────────────┘  │
└──────────────┬───────────────────────────┬──────────────┘
               │                           │
┌──────────────▼──────────┐     ┌──────────▼──────────────┐
│ Network Engine Thread   │     │ SQLite Database Layer   │
│  - Scapy Packet Capture │     │  - Operators & Sessions │
│  - ML Scorer Engine     │     │  - Alerts & Blocked IPs │
│  - Rule Matcher         │     │  - APIDataLog & Sync    │
└─────────────────────────┘     └─────────────────────────┘
```

---

## 2. Component Design

### 2.1 API & Blueprint Layer
- `auth_bp` (`/auth`): Manages operator login, logout, and session lifecycle.
- `dashboard_bp` (`/api`): Serves real-time threat metrics, active alerts, and top traffic source IPs.
- `ids_bp` (`/api/ids`): Manages protected port lists (e.g. 22, 23, 445, 3389) and packet rate thresholds.
- `intel_bp` (`/api/intel`): Handles IP reputation lookups (AbuseIPDB mock/live mode).
- `block_bp` (`/api`): Manages active firewall blocklists and rule enforcement.
- `telemetry_bp` (`/api/telemetry`): Tracks cross-platform data usage (Android vs Web) and settings.

### 2.2 Async Threading & Packet Capture Engine
- `engine/capture.py`: Launches an asynchronous background daemon thread running `scapy.sniff()` to process incoming network frames without blocking HTTP event loops.
- `engine/scorer.py`: Computes dynamic threat scores (0–100) based on packet counts, alert frequencies, and active rule violations.

### 2.3 Operating System Firewall Integration
- `firewall/netsh.py`: Interacts with Windows Firewall via `netsh advfirewall` to execute IP blocking commands.
- `firewall/none.py`: Safe fallback driver for non-Windows platforms or test environments.

---

## 3. Data Flow

1. **Packet Capture Flow**: Scapy captures network packet -> Rule Matcher checks protected ports -> Alert saved to SQLite -> Socket.IO broadcasts alert to clients.
2. **Operator Action Flow**: Operator logs in via `/auth/login` -> Session cookie stored -> Operator issues IP block `/api/block` -> Firewall driver blocks IP -> DB records `BlockedIP`.
