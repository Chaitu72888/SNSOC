# API Endpoint Inventory

This inventory documents all **18 REST API endpoints** provided by the SNSOC Flask application.

---

## 📋 Complete API Table

| Endpoint Route | HTTP Method | Auth Required | Expected Roles | Controller / File Location | Description |
| :--- | :---: | :---: | :---: | :--- | :--- |
| `/auth/login` | GET | No | Public | `auth.py:login` | Render login form |
| `/auth/login` | POST | No | Public | `auth.py:login` | Authenticate operator credentials |
| `/auth/logout` | GET, POST | Yes | Operator | `auth.py:logout` | Invalidate operator session |
| `/api/dashboard` | GET | Yes | Operator | `api/dashboard.py:get_dashboard` | Fetch live threat metrics & alert counts |
| `/api/alerts` | GET | Yes | Operator | `api/dashboard.py:get_alerts` | Paginated query for recent security alerts |
| `/api/packets` | GET | Yes | Operator | `api/dashboard.py:get_packets` | Fetch recent captured network packets |
| `/api/ids/rules` | GET | Yes | Operator | `api/ids.py:get_rules` | Get protected ports & packet thresholds |
| `/api/ids/rules/ports` | POST | Yes | Operator | `api/ids.py:add_port` | Add a new protected port to IDS |
| `/api/ids/rules/ports/<port>` | DELETE | Yes | Operator | `api/ids.py:remove_port` | Delete a protected port from IDS |
| `/api/ids/thresholds` | POST | Yes | Operator | `api/ids.py:update_threshold` | Update packet window & rate threshold |
| `/api/intel/config` | POST | Yes | Operator | `api/intel.py:update_config` | Update AbuseIPDB API key & mock mode |
| `/api/intel/lookup` | POST | No* | Public / App | `api/intel.py:lookup_ip` | Perform IP threat lookup & reputation check |
| `/api/block` | GET | Yes | Operator | `api/block.py:get_blocks` | Fetch list of all blocked IP addresses |
| `/api/block` | POST | Yes | Operator | `api/block.py:add_block` | Block an IP address on system firewall |
| `/api/block/<ip>` | DELETE | Yes | Operator | `api/block.py:remove_block` | Unblock an IP address on system firewall |
| `/api/telemetry/consumption` | GET | No | Public / App | `api/telemetry.py:get_consumption` | Fetch 30-day & 7-day data consumption |
| `/api/telemetry/sync` | GET, POST | No | Public / App | `api/telemetry.py:handle_sync` | Sync platform last active timestamp |
| `/api/telemetry/settings` | GET, POST | No | Public / App | `api/telemetry.py:handle_settings` | Get / update data usage settings |

*\*Note: Mobile API endpoints (`/api/intel/lookup`, `/api/telemetry/*`) accept client requests using `X-Platform` header headers for cross-platform Android/Web app synchronization.*
