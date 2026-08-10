"""
SNSOC — Baseline Load Test Runner
Executes concurrency and throughput benchmark tests against live backend endpoints.
Measures latency (min, avg, p50, p90, p99, max), throughput (req/sec), and error rates.
Generates: baseline-load-test-report.xlsx
"""
import sys, os, time, json, statistics, concurrent.futures
from datetime import datetime
import requests

BASE_URL = os.environ.get("SNSOC_BASE_URL", "https://snsoc-4.onrender.com")
USERNAME = os.environ.get("SNSOC_USER", "siva")
PASSWORD = os.environ.get("SNSOC_PASS", "siva2580")

RESULTS = []

print(f"\n[Baseline Load Test Suite] SNSOC Concurrency & Performance Benchmarks")
print(f"Target: {BASE_URL}")
print("=" * 65)

# Session establishment
auth_session = requests.Session()
r_login = auth_session.post(f"{BASE_URL}/auth/login", data={"username": USERNAME, "passcode": PASSWORD}, allow_redirects=True, timeout=15)
auth_cookie = auth_session.cookies.get_dict()

def run_load_scenario(scenario_id, category, scenario_name, endpoint, method, req_count, concurrency, authed=False, payload=None):
    print(f"\n[+] {scenario_id} - {scenario_name} ({req_count} reqs @ c={concurrency})")
    url = f"{BASE_URL}{endpoint}"
    
    latencies = []
    statuses = []
    errors = 0
    t_start = time.time()
    
    def worker(_):
        s = requests.Session()
        if authed and auth_cookie:
            s.cookies.update(auth_cookie)
        t0 = time.time()
        try:
            if method == "GET":
                resp = s.get(url, timeout=10)
            elif method == "POST":
                resp = s.post(url, json=payload or {}, timeout=10)
            else:
                resp = s.request(method, url, timeout=10)
            elapsed_ms = (time.time() - t0) * 1000
            return elapsed_ms, resp.status_code
        except Exception as e:
            elapsed_ms = (time.time() - t0) * 1000
            return elapsed_ms, 0

    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = [executor.submit(worker, i) for i in range(req_count)]
        for f in concurrent.futures.as_completed(futures):
            ms, code = f.result()
            latencies.append(ms)
            statuses.append(code)
            if code not in [200, 201, 302]:
                errors += 1

    t_total = time.time() - t_start
    rps = round(req_count / t_total, 2) if t_total > 0 else 0
    err_pct = round((errors / req_count) * 100, 1)
    
    sorted_lat = sorted(latencies) if latencies else [0]
    min_ms = round(sorted_lat[0], 1)
    max_ms = round(sorted_lat[-1], 1)
    avg_ms = round(statistics.mean(sorted_lat), 1)
    p50_ms = round(statistics.median(sorted_lat), 1)
    p90_ms = round(sorted_lat[int(len(sorted_lat) * 0.90) - 1], 1)
    p99_ms = round(sorted_lat[int(len(sorted_lat) * 0.99) - 1], 1)

    status_str = "PASS" if err_pct < 5.0 and p90_ms < 3000 else ("WARN" if err_pct < 15.0 else "FAIL")

    res = {
        "id": scenario_id,
        "category": category,
        "name": scenario_name,
        "endpoint": endpoint,
        "concurrency": concurrency,
        "total_requests": req_count,
        "rps": rps,
        "err_pct": err_pct,
        "min_ms": min_ms,
        "avg_ms": avg_ms,
        "p50_ms": p50_ms,
        "p90_ms": p90_ms,
        "p99_ms": p99_ms,
        "max_ms": max_ms,
        "status": status_str,
        "timestamp": datetime.now().strftime("%H:%M:%S")
    }
    RESULTS.append(res)
    icon = "PASS" if status_str == "PASS" else ("WARN" if status_str == "WARN" else "FAIL")
    print(f"    [{icon}] {rps} req/s | Avg: {avg_ms}ms | P90: {p90_ms}ms | P99: {p99_ms}ms | Err: {err_pct}%")

# ══════════════════════════════════════════════════════════════════════════════
# LOAD TEST SCENARIOS
# ══════════════════════════════════════════════════════════════════════════════
run_load_scenario("LOAD-001", "Public Pages", "Login Page Light Traffic", "/auth/login", "GET", req_count=20, concurrency=4, authed=False)
run_load_scenario("LOAD-002", "Public Pages", "Login Page High Concurrency", "/auth/login", "GET", req_count=50, concurrency=10, authed=False)
run_load_scenario("LOAD-003", "Dashboard API", "Dashboard Summary Endpoint", "/api/dashboard", "GET", req_count=30, concurrency=5, authed=True)
run_load_scenario("LOAD-004", "Alerts API", "Alerts List Pagination", "/api/alerts?limit=20", "GET", req_count=25, concurrency=5, authed=True)
run_load_scenario("LOAD-005", "Packets API", "Recent Packet Stream Lookup", "/api/packets?limit=50", "GET", req_count=30, concurrency=5, authed=True)
run_load_scenario("LOAD-006", "Intel API", "Threat Intel IP Lookups", "/api/intel/lookup", "POST", req_count=20, concurrency=4, authed=True, payload={"ip": "8.8.8.8"})
run_load_scenario("LOAD-007", "Telemetry API", "Mobile Telemetry Sync Burst", "/api/telemetry/sync", "POST", req_count=20, concurrency=4, authed=True, payload={"platform": "Android App", "bytes_transferred": 15000})

# ══════════════════════════════════════════════════════════════════════════════
# GENERATE EXCEL REPORT
# ══════════════════════════════════════════════════════════════════════════════
print("\nGenerating Baseline Load Excel Report...")
import openpyxl
from openpyxl.styles import PatternFill, Font, Alignment, Border, Side
from openpyxl.utils import get_column_letter

os.makedirs("test-reports", exist_ok=True)

wb = openpyxl.Workbook()

def mk_b():
    s = Side(style="thin")
    return Border(left=s, right=s, top=s, bottom=s)

# Results Sheet
ws = wb.active
ws.title = "Load Benchmarks"
ws.sheet_view.showGridLines = False
ws.freeze_panes = "A3"

ws.merge_cells("A1:N1")
c = ws["A1"]
c.value = f"SNSOC BASELINE LOAD & PERFORMANCE TEST REPORT  |  {datetime.now().strftime('%Y-%m-%d %H:%M')}  |  Target: {BASE_URL}"
c.fill = PatternFill("solid", fgColor="0B3C5D")
c.font = Font(bold=True, color="FFFFFF", size=13, name="Calibri")
c.alignment = Alignment(horizontal="center", vertical="center")
ws.row_dimensions[1].height = 36

hdrs = ["ID", "Category", "Scenario Name", "Endpoint", "Concurrency", "Total Reqs", "Req/Sec", "Err %", "Min (ms)", "Avg (ms)", "P50 (ms)", "P90 (ms)", "P99 (ms)", "Status"]
widths = [10, 18, 30, 25, 12, 12, 12, 10, 10, 10, 10, 10, 10, 10]
STATUS_C = {"PASS": "27AE60", "WARN": "F39C12", "FAIL": "E74C3C"}

for ci, (h, w) in enumerate(zip(hdrs, widths), 1):
    cell = ws.cell(row=2, column=ci, value=h)
    cell.fill = PatternFill("solid", fgColor="0B3C5D")
    cell.font = Font(bold=True, color="FFFFFF", size=10, name="Calibri")
    cell.alignment = Alignment(horizontal="center", vertical="center")
    cell.border = mk_b()
    ws.column_dimensions[get_column_letter(ci)].width = w

for i, res in enumerate(RESULTS):
    row = i + 3
    bg = "F4F6F7" if i % 2 else "FFFFFF"
    sc = STATUS_C.get(res["status"], "95A5A6")

    def dc(c, v, b=bg, f="000000", bold=False, align="left"):
        cell = ws.cell(row=row, column=c, value=v)
        cell.fill = PatternFill("solid", fgColor=b)
        cell.font = Font(bold=bold, color=f, size=10, name="Calibri")
        cell.alignment = Alignment(horizontal=align, vertical="center", wrap_text=True)
        cell.border = mk_b()

    dc(1, res["id"], bold=True, align="center")
    dc(2, res["category"])
    dc(3, res["name"])
    dc(4, res["endpoint"])
    dc(5, res["concurrency"], align="center")
    dc(6, res["total_requests"], align="center")
    dc(7, res["rps"], align="center", bold=True)
    dc(8, f"{res['err_pct']}%", align="center", f="E74C3C" if res["err_pct"] > 0 else "000000")
    dc(9, res["min_ms"], align="center")
    dc(10, res["avg_ms"], align="center")
    dc(11, res["p50_ms"], align="center")
    dc(12, res["p90_ms"], align="center", bold=True)
    dc(13, res["p99_ms"], align="center")
    dc(14, res["status"], b=sc, f="FFFFFF", bold=True, align="center")
    ws.row_dimensions[row].height = 32

# Summary Sheet
ws2 = wb.create_sheet("Performance Summary")
ws2.sheet_view.showGridLines = False

total_tests = len(RESULTS)
passed = sum(1 for r in RESULTS if r["status"] == "PASS")
warned = sum(1 for r in RESULTS if r["status"] == "WARN")
failed = sum(1 for r in RESULTS if r["status"] == "FAIL")

cards = [
    ("Total Scenarios", total_tests, "3498DB"),
    ("Passed", passed, "27AE60"),
    ("Warnings", warned, "F39C12"),
    ("Failed", failed, "E74C3C"),
    ("Pass Rate", f"{round(passed/total_tests*100)}%" if total_tests else "0%", "8E44AD"),
]

for ci, (label, val, color) in enumerate(cards, 1):
    ws2.column_dimensions[get_column_letter(ci)].width = 20
    c1 = ws2.cell(row=1, column=ci, value=label)
    c1.fill = PatternFill("solid", fgColor=color)
    c1.font = Font(bold=True, color="FFFFFF", size=11, name="Calibri")
    c1.alignment = Alignment(horizontal="center", vertical="center")
    c1.border = mk_b()

    c2 = ws2.cell(row=2, column=ci, value=val)
    c2.fill = PatternFill("solid", fgColor="F2F3F4")
    c2.font = Font(bold=True, color="000000", size=14, name="Calibri")
    c2.alignment = Alignment(horizontal="center", vertical="center")
    c2.border = mk_b()

    ws2.row_dimensions[1].height = 30
    ws2.row_dimensions[2].height = 40

out = os.path.join("test-reports", "baseline-load-test-report.xlsx")
wb.save(out)
print(f"[OK] Report saved: {out}")
print(f"     PASS={passed}  WARN={warned}  FAIL={failed}  Total={total_tests}")
sys.exit(0 if failed == 0 else 1)
