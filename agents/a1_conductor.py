import json, os, sys, time
sys.path.insert(0, "scripts")
from agent_contract import make_contract, write_done
from cost_firewall import check_budget

def acquire_lock(task_id, run_id, ttl_sec=900, lock_dir="out/A1/locks"):
    os.makedirs(lock_dir, exist_ok=True)
    lp = os.path.join(lock_dir, f"{task_id}.lock.json")
    now = int(time.time())
    if os.path.exists(lp):
        cur = json.load(open(lp, encoding="utf-8"))
        if cur.get("expires_at", 0) > now and cur.get("run_id") != str(run_id):
            raise RuntimeError(f"Lock held by run {cur.get('run_id')}")
    tmp = lp + ".tmp"
    json.dump({"task_id": task_id, "run_id": str(run_id), "expires_at": now + ttl_sec}, open(tmp, "w", encoding="utf-8"))
    os.replace(tmp, lp)
    return lp

def plan_dag(task_id, run_id, fx_mode="SAFE", budget_ratio=0.0):
    c = make_contract(task_id, run_id, "A1", fx_mode)
    b_state = check_budget(budget_ratio)
    eff_mode = "SAFE" if b_state != "OK" else c["fx_mode"]
    out_dir = os.path.join("out", "A1", task_id); os.makedirs(out_dir, exist_ok=True)
    dag_p, led_p = os.path.join(out_dir, "plan.dag.json"), os.path.join(out_dir, "ledger.json")
    json.dump({"task_id": task_id, "effective_fx_mode": eff_mode, "nodes": ["A1", "A2", "A7", "A9"], "edges": [["A1", "A2"], ["A1", "A7"], ["A1", "A9"], ["A2", "A9"]]}, open(dag_p, "w"), indent=2)
    json.dump({"budget_ratio": budget_ratio, "budget_state": b_state, "paid_usd": 0}, open(led_p, "w"), indent=2)
    return write_done("A1", task_id, "ok" if b_state != "HARD_STOP_SAFE" else "skipped_safe", [dag_p, led_p], {"budget_state": b_state})
