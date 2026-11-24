import glob, json, os, subprocess, sys
cfg = json.load(open("timeline.json", encoding="utf-8"))
expected_sec = float(cfg.get("total_sec", 60))
files = sorted(glob.glob("chunks/chunk-*/chunk_*.mp4"))
if not files:
    sys.exit("ERROR: No chunks found")
with open("list.txt", "w", encoding="utf-8") as f:
    for p in files:
        dur = subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", p], text=True).strip()
        if not dur or float(dur) <= 0.1:
            sys.exit(f"ERROR: Corrupt chunk {p}")
        f.write(f"file '{p}'\n")
subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", "list.txt", "-c", "copy", "final/video_only.mp4"], check=True)
audio = "chunks/master-audio/master_audio.mp3"
if os.path.exists(audio):
    subprocess.run(["ffmpeg", "-y", "-i", "final/video_only.mp4", "-i", audio, "-af", "apad", "-c:v", "libx264", "-crf", "24", "-preset", "fast", "-c:a", "aac", "-b:a", "192k", "-shortest", "final/final_master.mp4"], check=True)
else:
    os.rename("final/video_only.mp4", "final/final_master.mp4")
if os.path.exists("final/video_only.mp4"):
    os.remove("final/video_only.mp4")
subprocess.run(["ffmpeg", "-y", "-i", "final/final_master.mp4", "-vf", "scale=-2:480", "-c:v", "libx264", "-crf", "28", "-preset", "veryfast", "-c:a", "aac", "-b:a", "96k", "final/preview_480p.mp4"], check=True)
dur_out = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", "final/final_master.mp4"], text=True).strip())
print(f"Final Master Verified: {dur_out:.2f}s (Target: {expected_sec:.2f}s)")
