import glob, hashlib, json, os, re, subprocess, sys

MANIFEST = "chunks/master-audio/manifest.json"
if os.path.exists(MANIFEST):
    m = json.load(open(MANIFEST, encoding="utf-8"))
    expected_sec = float(m["total_sec"])
    expected_frames = int(m["total_frames"])
else:
    cfg = json.load(open("timeline.json", encoding="utf-8"))
    raw_t = cfg.get("total_sec", 60)
    expected_sec = 60.0 if str(raw_t).strip().lower() == "auto" else float(raw_t)
    expected_frames = int(expected_sec * int(cfg.get("fps", 30)))

files = sorted(glob.glob("chunks/chunk-*/chunk_*.mp4"))
if not files:
    sys.exit("ERROR: No chunks found")

with open("list.txt", "w", encoding="utf-8") as f:
    for p in files:
        dur = subprocess.check_output([
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", p
        ], text=True).strip()
        if not dur or float(dur) <= 0.1:
            sys.exit(f"ERROR: Corrupt chunk {p}")
        f.write(f"file '{p}'\n")

subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", "list.txt", "-c", "copy", "final/video_only.mp4"], check=True)
audio = "chunks/master-audio/master_audio.mp3"
if os.path.exists(audio):
    subprocess.run([
        "ffmpeg", "-y", "-i", "final/video_only.mp4", "-i", audio, "-af", "apad",
        "-c:v", "libx264", "-crf", "24", "-preset", "fast", "-c:a", "aac", "-b:a", "192k",
        "-shortest", "final/final_master.mp4"
    ], check=True)
else:
    os.rename("final/video_only.mp4", "final/final_master.mp4")

if os.path.exists("final/video_only.mp4"):
    os.remove("final/video_only.mp4")

subprocess.run(["ffmpeg", "-v", "error", "-i", "final/final_master.mp4", "-f", "null", "-"], check=True)
subprocess.run([
    "ffmpeg", "-y", "-i", "final/final_master.mp4", "-vf", "scale=-2:480",
    "-c:v", "libx264", "-crf", "28", "-preset", "veryfast", "-c:a", "aac", "-b:a", "96k",
    "final/preview_480p.mp4"
], check=True)

dur_out = float(subprocess.check_output([
    "ffprobe", "-v", "error", "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1", "final/final_master.mp4"
], text=True).strip())

ln = subprocess.run([
    "ffmpeg", "-i", "final/final_master.mp4", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"
], capture_output=True, text=True)
m_json = re.search(r"\{[\s\S]*\"input_i\"[\s\S]*\}", ln.stderr)
lufs_info = {}
if m_json:
    try:
        lufs_info = json.loads(m_json.group(0))
    except Exception:
        pass

sha = hashlib.sha256(open("final/final_master.mp4", "rb").read()).hexdigest()
report = {
    "expected_frames": expected_frames,
    "expected_sec": expected_sec,
    "actual_sec": round(dur_out, 3),
    "input_i_lufs": lufs_info.get("input_i"),
    "input_tp": lufs_info.get("input_tp"),
    "sha256": sha,
}
json.dump(report, open("final/run_report.json", "w", encoding="utf-8"), indent=2)
print(f"Final Master Verified: {dur_out:.2f}s (Target: {expected_sec:.2f}s, LUFS={report['input_i_lufs']}, TP={report['input_tp']})")
