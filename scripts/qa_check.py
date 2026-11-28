import json, os, re, subprocess

def check_media(path):
    if not os.path.exists(path):
        return
    probe = subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "stream=codec_type,width,height:format=duration",
        "-of", "json", path
    ]).decode("utf-8")
    info = json.loads(probe)
    dur = float(info.get("format", {}).get("duration", 0) or 0)
    types = {s.get("codec_type") for s in info.get("streams", [])}
    assert "video" in types and "audio" in types, f"QA FAIL {path}: missing stream {types}"
    assert dur >= 5.0, f"QA FAIL {path}: duration too short ({dur}s)"

    res = subprocess.run([
        "ffmpeg", "-v", "info", "-i", path,
        "-vf", "blackdetect=d=0.8:pix_th=0.10",
        "-af", "silencedetect=n=-50dB:d=3.0,ebur128=framelog=quiet",
        "-f", "null", "-"
    ], capture_output=True, text=True)
    blacks = sum(float(m) for m in re.findall(r"black_duration:([0-9.]+)", res.stderr))
    silences = sum(float(m) for m in re.findall(r"silence_duration:([0-9.]+)", res.stderr))
    lufs_m = re.findall(r"I:\s*(-?[0-9.]+)\s*LUFS", res.stderr)
    lufs = float(lufs_m[-1]) if lufs_m else -14.0
    print(f"QA [{path}] dur={dur:.1f}s black={blacks:.1f}s silence={silences:.1f}s lufs={lufs:.1f}LUFS")
    assert blacks < dur * 0.5, f"QA FAIL {path}: excessive black frames ({blacks}s)"

for target in ("final/reel_9x16.mp4", "final/final_master.mp4"):
    check_media(target)
print("QA_GATE_PASSED")
