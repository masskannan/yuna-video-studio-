import json, os, shutil, subprocess, sys, tempfile
sys.path.insert(0, "scripts")
from agent_contract import verify_done
from agents.a4_memory import compute_video_id, index_memory, query_memory, sync_memory_branch
from agents.a3_reverse import reverse_engineer

tid = "t_l13_ci"
try:
    vid = compute_video_id("f0", "f99", 30.0)
    dp1 = index_memory(tid, "r13", vid, {"text": "Tamil AI hook", "hook_sec": 2.5}, expected_version=0, index_root="out/A4/test_idx")
    assert verify_done(dp1)["metrics"]["version"] == 1
    assert "/" not in json.load(open("out/A4/test_idx/HEAD.json"))["records"][vid]
    try:
        index_memory(tid, "r13", vid, {"text": "stale"}, expected_version=0, index_root="out/A4/test_idx")
        raise AssertionError("Should detect CAS conflict")
    except RuntimeError: pass
    assert verify_done(query_memory(tid, "r13", "Tamil hook", index_root="out/A4/test_idx"))["metrics"]["hit_count"] == 1

    with tempfile.TemporaryDirectory() as td:
        bare = os.path.join(td, "remote.git")
        subprocess.check_call(["git", "init", "--bare", bare], stdout=subprocess.DEVNULL)
        assert sync_memory_branch("out/A4/test_idx", remote=bare, push=True)
        restored = os.path.join(td, "restored")
        assert sync_memory_branch(restored, remote=bare, push=False)
        assert os.path.isfile(os.path.join(restored, "HEAD.json"))

    assert verify_done(reverse_engineer(tid, "r13", approved=False))["status"] == "skipped_safe"
    if shutil.which("ffmpeg"):
        with tempfile.TemporaryDirectory() as td:
            mp = os.path.join(td, "cut_audio.mp4")
            subprocess.check_call(["ffmpeg", "-y", "-f", "lavfi", "-i", "color=c=black:s=64x64:d=1", "-f", "lavfi", "-i", "color=c=white:s=64x64:d=1", "-f", "lavfi", "-i", "sine=frequency=440:duration=2", "-filter_complex", "[0:v][1:v]concat=n=2:v=1:a=0[v]", "-map", "[v]", "-map", "2:a", mp], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            d = verify_done(reverse_engineer(tid, "r13", approved=True, media_path=mp))
            assert d["status"] == "ok" and d["metrics"]["cut_count"] >= 1 and "bpm" in d["metrics"]
finally:
    for p in [f"out/A4/{tid}", f"out/A3/{tid}", "out/A4/test_idx"]:
        shutil.rmtree(p, ignore_errors=True)
print("LEVEL 13 TESTS PASSED: A4 Orphan Git CAS + A3 Video/Audio OK")
