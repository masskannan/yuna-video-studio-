import hashlib, json, os, sys
sys.path.insert(0, "scripts")
from agent_contract import make_contract, write_done

STYLES = [f"mg_style_{i:02d}" for i in range(1, 16)]

def compile_motion(task_id, run_id, style_idx=1):
    make_contract(task_id, run_id, "A9", "SAFE")
    idx = max(1, min(15, int(style_idx)))
    seed = int(hashlib.sha256(f"{task_id}:{idx}".encode()).hexdigest()[:8], 16)
    out_dir = os.path.join("out", "A9", task_id); os.makedirs(out_dir, exist_ok=True)
    mp = os.path.join(out_dir, "motion.props.json")
    json.dump({"style": STYLES[idx - 1], "seed": seed, "webgl_required": False}, open(mp, "w"), indent=2)
    return write_done("A9", task_id, "ok", [mp], {"seed": seed})
