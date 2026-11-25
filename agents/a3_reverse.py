import json, os, re, subprocess, sys, tempfile
sys.path.insert(0, "scripts")
from agent_contract import make_contract, write_done
from analyze_audio_fx import analyze_wav

def detect_scenes_and_beats(media_path, thresh=0.3):
    try:
        p = subprocess.run(["ffmpeg", "-i", media_path, "-vf", f"select='gt(scene,{thresh})',showinfo", "-f", "null", "-"], capture_output=True, text=True, timeout=60)
    except FileNotFoundError:
        return None, [], 0
    cuts = [round(float(x), 3) for x in re.findall(r"pts_time:([0-9.]+)", p.stderr)]
    beats, bpm = [], 0
    with tempfile.TemporaryDirectory() as td:
        wp = os.path.join(td, "a.wav")
        if subprocess.run(["ffmpeg", "-y", "-i", media_path, "-vn", "-ac", "1", "-ar", "16000", wp], capture_output=True).returncode == 0 and os.path.isfile(wp):
            d = analyze_wav(wp, fps=30, out_json=os.path.join(td, "e.json"))
            beats = [round(s / 16000.0, 3) for s in d["beat_samples"][:40]]
            if len(beats) >= 2:
                avg_dt = (beats[-1] - beats[0]) / max(1, len(beats) - 1)
                bpm = round(60.0 / avg_dt) if avg_dt > 0 else 0
    return cuts, beats, bpm

def reverse_engineer(task_id, run_id, approved=False, media_path=None):
    make_contract(task_id, run_id, "A3", "SAFE", {"approved": bool(approved)})
    out_dir = os.path.join("out", "A3", task_id); os.makedirs(out_dir, exist_ok=True)
    ap = os.path.join(out_dir, "edit_ast.json")
    if not approved or not media_path or not os.path.isfile(media_path):
        json.dump({"skipped": True, "reason": "approval_or_media_missing"}, open(ap, "w"), indent=2)
        return write_done("A3", task_id, "skipped_safe", [ap], {"approved": bool(approved)})
    cuts, beats, bpm = detect_scenes_and_beats(media_path)
    if cuts is None:
        json.dump({"skipped": True, "reason": "ffmpeg_missing"}, open(ap, "w"), indent=2)
        return write_done("A3", task_id, "skipped_safe", [ap], {"ffmpeg": False})
    ast = {"cuts": cuts, "beats": beats, "bpm": bpm, "engine_hint": "remotion", "frames_retained": 0}
    json.dump(ast, open(ap, "w"), indent=2)
    return write_done("A3", task_id, "ok", [ap], {"cut_count": len(cuts), "bpm": bpm, "frames_retained": 0})
