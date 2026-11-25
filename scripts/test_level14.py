import hashlib, os, shutil, sys
sys.path.insert(0, "scripts")
from agent_contract import verify_done
from agents.a6_hybrid import plan_hybrid_scene
from agents.a8_uipromo import run_ui_promo

tid = "t_l14_ci"
bp = f"out/A8/{tid}/mock_bin"
try:
    assert verify_done(plan_hybrid_scene(tid, "r14", "SAFE", True))["status"] == "skipped_safe"
    assert verify_done(plan_hybrid_scene(tid, "r14", "HYBRID", "false"))["status"] == "skipped_safe"
    assert verify_done(plan_hybrid_scene(tid, "r14", "HYBRID", True))["status"] == "ok"

    assert verify_done(run_ui_promo(tid, "r14", "https://example.com", "mobile"))["status"] == "skipped_safe"
    for bad in ("file:///etc/passwd", "http://169.254.169.254/latest"):
        try: run_ui_promo(tid, "r14", bad); raise AssertionError(f"Should reject {bad}")
        except ValueError: pass
    os.makedirs(os.path.dirname(bp), exist_ok=True)
    open(bp, "wb").write(b"fakebin")
    os.chmod(bp, 0o755)
    good_sha = hashlib.sha256(b"fakebin").hexdigest()
    assert verify_done(run_ui_promo(tid, "r14", "https://example.com", "desktop", bp, good_sha))["status"] == "ok"
    try: run_ui_promo(tid, "r14", "https://example.com", "desktop", bp, "0" * 64); raise AssertionError("Should reject bad sha")
    except ValueError: pass

    w = open("studio/worker.js", encoding="utf-8").read()
    assert "/manifest.json" in w and "/sw.js" in w and 'rel="manifest"' in w and "serviceWorker.register" in w and "env.DB" not in w
finally:
    for p in [f"out/A6/{tid}", f"out/A8/{tid}"]:
        shutil.rmtree(p, ignore_errors=True)
print("LEVEL 14 TESTS PASSED: A6 Hybrid + A8 UI Promo + Mobile PWA OK")
