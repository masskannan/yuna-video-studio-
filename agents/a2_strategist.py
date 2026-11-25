import json, os, sys
sys.path.insert(0, "scripts")
from agent_contract import make_contract, write_done

HOOKS = ["Curiosity Gap: Why nobody talks about this", "Specificity: 3 steps in 60 seconds", "Pattern Interrupt: Stop doing this today"]

def run_strategist(task_id, run_id, topic="YUNA Studio", candidates=None):
    make_contract(task_id, run_id, "A2", "SAFE", {"topic": topic})
    cands = candidates or [f"{topic} — 3 Pro Tricks!", f"How {topic} Works"]
    scored = sorted([{"title": t, "score": min(100, 40 + (15 if any(c.isdigit() for c in t) else 0) + (20 if 25 <= len(t) <= 60 else 5))} for t in cands], key=lambda x: x["score"], reverse=True)
    out_dir = os.path.join("out", "A2", task_id); os.makedirs(out_dir, exist_ok=True)
    sp = os.path.join(out_dir, "strategy.json")
    json.dump({"topic": topic, "titles": scored, "hook": HOOKS[0]}, open(sp, "w"), indent=2)
    return write_done("A2", task_id, "ok", [sp], {"top_score": scored[0]["score"]})
