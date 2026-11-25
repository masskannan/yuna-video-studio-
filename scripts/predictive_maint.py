import json, statistics, sys
sys.path.insert(0, "scripts")
from cost_firewall import check_budget

def run_predictive_check(cache_gb=0.0, quota_ratio=0.0, recent_secs=None):
    alerts = []
    if cache_gb >= 8.0:
        alerts.append({"type": "cache_pressure", "cache_gb": cache_gb, "action": "prune_stale_cache"})
    b_state = check_budget(quota_ratio)
    if b_state != "OK":
        alerts.append({"type": "quota_forecast", "state": b_state})
    secs = list(recent_secs or [])
    if len(secs) >= 3 and secs[-1] > 1.5 * statistics.median(secs[:-1]):
        alerts.append({"type": "duration_anomaly", "latest_sec": secs[-1]})
    pkg = json.load(open("package.json", encoding="utf-8"))
    lock = json.load(open("baseline.lock.json", encoding="utf-8"))
    if pkg["dependencies"]["remotion"] != lock["remotion_version"]:
        alerts.append({"type": "dependency_drift", "expected": lock["remotion_version"]})
    return {"healthy": len(alerts) == 0, "alerts": alerts}
