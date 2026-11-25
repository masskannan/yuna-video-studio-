import json, os, shutil, subprocess, sys
sys.path.insert(0, "scripts")
from agent_contract import make_contract, write_done

def plan_blender_shards(task_id, run_id, fx_mode="SAFE", approved=False, total_frames=300, shard_size=150, execute=False):
    c = make_contract(task_id, run_id, "A5", fx_mode, {"approved": approved is True, "total_frames": int(total_frames)})
    out_dir = os.path.join("out", "A5", task_id); os.makedirs(out_dir, exist_ok=True)
    sp = os.path.join(out_dir, "blender_shards.json")
    if c["fx_mode"] != "PRO" or approved is not True:
        json.dump({"skipped": True, "fallback": "2d_safe_shot"}, open(sp, "w"), indent=2)
        return write_done("A5", task_id, "skipped_safe", [sp], {"pro_allowed": False})
    shards = [{"shard": i, "start": s, "end_exclusive": min(total_frames, s + shard_size)} for i, s in enumerate(range(0, total_frames, shard_size))]
    if execute and not shutil.which("blender"):
        json.dump({"skipped": True, "reason": "blender_missing", "shards": shards}, open(sp, "w"), indent=2)
        return write_done("A5", task_id, "skipped_safe", [sp], {"blender_present": False})
    json.dump({"preset": "draft", "fps": 30, "pix_fmt": "yuv420p", "shards": shards}, open(sp, "w"), indent=2)
    return write_done("A5", task_id, "ok", [sp], {"shard_count": len(shards), "pro_allowed": True})
