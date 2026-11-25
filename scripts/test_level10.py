import os, subprocess
subprocess.check_call(["python3", "scripts/youtube_upload.py"])
subprocess.check_call(["python3", "scripts/social_pack.py"])
assert os.path.exists("final/social_pack.md")
w = open("studio/worker.js", encoding="utf-8").read()
for r in ["/office", "/api/stream", "/api/apk/dispatch", "/api/ig/webhook", "/api/status", "/api/approve"]:
    assert r in w, f"Missing route {r}"
assert "env.DB" not in w and "D1Database" not in w and "api.telegram.org" not in w
print("LEVEL 10 TESTS PASSED: YouTube + Social Pack + Worker v2 (Office/SSE/APK/IG) OK")
