import hashlib, json, math, os, subprocess

TL_FILE = "timeline.json"
MANIFEST_OUT = "chunks/master-audio/manifest.json"
AUDIO_WAV = "chunks/master-audio/voice_24k_proc.wav"

def get_dur(path):
    if not os.path.exists(path):
        return 0.0
    out = subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", path
    ], text=True).strip()
    return float(out) if out else 0.0

def main():
    tl = json.load(open(TL_FILE, "r", encoding="utf-8"))
    fps_num = int(tl.get("fps_num", tl.get("fps", 30)))
    fps_den = int(tl.get("fps_den", 1))
    fps = fps_num / fps_den
    chunk_sec = int(tl.get("chunk_sec", 30))
    chunk_frames = max(1, round(chunk_sec * fps))

    raw_total = tl.get("total_sec", 60)
    if str(raw_total).strip().lower() == "auto":
        audio_sec = get_dur(AUDIO_WAV)
        scenes = tl.get("scenes") or []
        vis_sec = max([float(s.get("end_sec", 0)) for s in scenes], default=0.0)
        outro_sec = float(tl.get("outro_sec", 2.0)) if not tl.get("outro_included", False) else 0.0
        base_sec = max(audio_sec, vis_sec, 5.0)
        total_frames = max(1, math.ceil((base_sec + outro_sec) * fps))
    else:
        total_frames = max(1, math.ceil(float(raw_total) * fps))

    total_sec = round(total_frames / fps, 3)
    digest = hashlib.sha256(
        json.dumps({"tl": tl, "total_frames": total_frames}, sort_keys=True).encode("utf-8")
    ).hexdigest()[:16]

    manifest = {
        "duration_mode": "resolved",
        "total_frames": total_frames,
        "total_sec": total_sec,
        "fps_num": fps_num,
        "fps_den": fps_den,
        "chunk_frames": chunk_frames,
        "manifest_hash": digest,
        "timeline_version": 1,
    }
    os.makedirs(os.path.dirname(MANIFEST_OUT), exist_ok=True)
    json.dump(manifest, open(MANIFEST_OUT, "w", encoding="utf-8"), indent=2)
    print(f"Manifest Finalized: {total_frames} frames ({total_sec}s, hash={digest})")

if __name__ == "__main__":
    main()
