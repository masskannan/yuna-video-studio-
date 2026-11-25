import json, os, re, subprocess, sys
sys.path.insert(0, "scripts")
from agent_contract import make_contract, write_done

def measure_lufs(media_path):
    try:
        p = subprocess.run(["ffmpeg", "-i", media_path, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True)
    except FileNotFoundError:
        return None
    m = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", p.stderr, re.S)
    return float(json.loads(m.group(0))["input_i"]) if m else None

def run_qa(task_id, run_id, media_path=None, lufs_override=None):
    make_contract(task_id, run_id, "A7", "SAFE")
    lufs = lufs_override if lufs_override is not None else (measure_lufs(media_path) if media_path and os.path.isfile(media_path) else None)
    ok_audio = (lufs is not None) and (-15.5 <= lufs <= -12.5)
    out_dir = os.path.join("out", "A7", task_id); os.makedirs(out_dir, exist_ok=True)
    qp = os.path.join(out_dir, "qa.json")
    json.dump({"lufs": lufs, "audio_ok": ok_audio, "contact_sheet_cmd": "ffmpeg -i final/final_master.mp4 -vf fps=1/3,tile=6x4 out/A7/sheet.jpg"}, open(qp, "w"), indent=2)
    return write_done("A7", task_id, "ok" if ok_audio else "failed", [qp], {"audio_ok": ok_audio})
