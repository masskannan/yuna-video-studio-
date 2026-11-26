import json, os, sys
sys.path.insert(0, "scripts")
from cost_firewall import POLICY, lint_workflows
from pro_gate import verify_rollback_drill

pkg = json.load(open("package.json", encoding="utf-8"))
assert pkg["dependencies"]["remotion"] == "4.0.250"  # G01
assert os.path.isfile("src/fx/core/FrameContext.ts")  # G02
assert os.path.isfile("scripts/generate_voice.py") and os.path.isfile("scripts/verify_merge.py")  # G03-G05
assert len(json.load(open("schemas/fx.schema.json"))["feature_ids"]) == 45  # G06
tl = json.load(open("timeline.json", encoding="utf-8"))
assert tl.get("fx_mode", "SAFE") in ("SAFE", "HYBRID", "PRO") and '?? "SAFE"' in open("src/MainMovie.tsx").read()  # G07
w = open("studio/worker.js", encoding="utf-8").read()
assert all(r in w for r in ("/office", "/api/apk/dispatch", "/api/ig/webhook", "/manifest.json", "/sw.js"))  # G08
assert POLICY["cost_mode"] == "STRICT_ZERO" and lint_workflows(".github/workflows") >= 1  # G09-G10
assert os.path.isfile("baseline.lock.json") and verify_rollback_drill("v2.3-safe")  # G11-G12
for a in ("a1_conductor", "a2_strategist", "a3_reverse", "a4_memory", "a5_blender", "a6_hybrid", "a7_editor_qa", "a8_uipromo", "a9_motion"):
    assert os.path.isfile(f"agents/{a}.py"), f"Missing {a}"  # G13-G15
print("ALL G01-G15 ACCEPTANCE GATES PASSED!")
