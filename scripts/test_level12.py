import json, os, shutil, subprocess, time
import sys; sys.path.insert(0, "scripts")
from agent_contract import verify_done
from agents.a1_conductor import acquire_lock, plan_dag
from agents.a2_strategist import run_strategist
from agents.a7_editor_qa import run_qa
from agents.a9_motion import compile_motion

tid = "t_l12_ci"
try:
    lp = acquire_lock(tid, "run_1", ttl_sec=60)
    try:
        acquire_lock(tid, "run_2", ttl_sec=60)
        raise AssertionError("Should reject concurrent run_2")
    except RuntimeError:
        pass
    d = json.load(open(lp)); d["expires_at"] = int(time.time()) - 5
    json.dump(d, open(lp, "w"))
    acquire_lock(tid, "run_2", ttl_sec=60)

    dp1 = plan_dag(tid, "run_2", "HYBRID", 0.85)
    assert verify_done(dp1)["status"] == "ok"
    assert json.load(open(f"out/A1/{tid}/plan.dag.json"))["effective_fx_mode"] == "SAFE"
    assert len(json.load(open(f"out/A1/{tid}/plan.dag.json"))["edges"]) >= 3

    dp2 = run_strategist(tid, "run_2", "YUNA AI")
    assert verify_done(dp2)["status"] == "ok"

    dp7_ok = run_qa(tid, "run_2", lufs_override=-14.1)
    assert verify_done(dp7_ok)["status"] == "ok"
    dp7_bad = run_qa(tid, "run_2", lufs_override=-24.0)
    assert verify_done(dp7_bad)["status"] == "failed"

    s1 = verify_done(compile_motion(tid, "run_2", 3))["metrics"]["seed"]
    s2 = verify_done(compile_motion(tid, "run_2", 3))["metrics"]["seed"]
    assert s1 == s2

    if shutil.which("node"):
        out = subprocess.check_output(["node", "scripts/gl_probe.mjs", "--gl=swangle"], text=True)
        assert "gl3d_allowed" in json.loads(out)
finally:
    for d in [f"out/A1/{tid}", f"out/A2/{tid}", f"out/A7/{tid}", f"out/A9/{tid}", f"out/A1/locks/{tid}.lock.json"]:
        if os.path.isdir(d): shutil.rmtree(d, ignore_errors=True)
        elif os.path.isfile(d): os.remove(d)

print("LEVEL 12 TESTS PASSED: A1 + A2 + A7 + A9 + gl_probe OK")
