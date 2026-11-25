import shutil, sys
sys.path.insert(0, "scripts")
from agent_contract import verify_done
from agents.a5_blender import plan_blender_shards
from pro_gate import can_enable_pro, verify_rollback_drill

tid = "t_l15_ci"
try:
    assert verify_done(plan_blender_shards(tid, "r15", "HYBRID", True))["status"] == "skipped_safe"
    assert verify_done(plan_blender_shards(tid, "r15", "PRO", False))["status"] == "skipped_safe"
    d = verify_done(plan_blender_shards(tid, "r15", "PRO", True, total_frames=300, shard_size=150))
    assert d["status"] == "ok" and d["metrics"]["shard_count"] == 2

    assert not can_enable_pro(["ok", "ok", "ok", "ok"])
    assert not can_enable_pro(["ok", "ok", "failed", "ok", "ok", "ok"])
    assert can_enable_pro(["ok", "ok", "ok", "ok", "ok"])
    assert verify_rollback_drill("v2.3-safe")
finally:
    shutil.rmtree(f"out/A5/{tid}", ignore_errors=True)
print("LEVEL 15 TESTS PASSED: A5 Blender Shards + 5-Run PRO Gate + v2.3-safe Rollback Drill OK")
