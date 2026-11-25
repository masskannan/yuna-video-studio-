import json, os, sys
sys.path.insert(0, "scripts")
from agent_contract import make_contract, write_done

def plan_hybrid_scene(task_id, run_id, fx_mode="SAFE", gl3d_allowed=False, comp="MainMovie"):
    allowed = (gl3d_allowed is True)
    c = make_contract(task_id, run_id, "A6", fx_mode, {"gl3d_allowed": allowed, "comp": comp})
    out_dir = os.path.join("out", "A6", task_id); os.makedirs(out_dir, exist_ok=True)
    pp = os.path.join(out_dir, "hybrid_scene.props.json")
    if c["fx_mode"] == "SAFE" or not allowed:
        json.dump({"skipped": True, "fallback": "2d_flat_safe"}, open(pp, "w"), indent=2)
        return write_done("A6", task_id, "skipped_safe", [pp], {"gl3d_allowed": allowed})
    json.dump({"comp": comp, "gl": "swangle", "camera_orbit": [0, 12, 420], "characters": ["YUNA", "KAVI"]}, open(pp, "w"), indent=2)
    return write_done("A6", task_id, "ok", [pp], {"gl3d_allowed": True})
