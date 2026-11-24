import json, math, os

MANIFEST = "chunks/master-audio/manifest.json"
if os.path.exists(MANIFEST):
    m = json.load(open(MANIFEST, encoding="utf-8"))
    total_frames = int(m["total_frames"])
    chunk_frames = int(m["chunk_frames"])
    total_sec = float(m["total_sec"])
else:
    cfg = json.load(open("timeline.json", encoding="utf-8"))
    fps = int(cfg.get("fps", 30))
    chunk_sec = int(cfg.get("chunk_sec", 30))
    raw_t = cfg.get("total_sec", 60)
    total_sec = 60.0 if str(raw_t).strip().lower() == "auto" else float(raw_t)
    total_frames = max(1, math.ceil(total_sec * fps))
    chunk_frames = max(1, chunk_sec * fps)

num_chunks = max(1, math.ceil(total_frames / chunk_frames))
only = os.environ.get("ONLY_CHUNK", "").strip()
chunks = []
for i in range(num_chunks):
    cid = f"{i:03d}"
    if only and cid != only:
        continue
    s = i * chunk_frames
    e = min(total_frames - 1, (i + 1) * chunk_frames - 1)
    if e >= s:
        chunks.append({"id": cid, "range": f"{s}-{e}"})

out = {"include": chunks}
gh_out = os.environ.get("GITHUB_OUTPUT")
if gh_out:
    with open(gh_out, "a", encoding="utf-8") as f:
        f.write(f"matrix={json.dumps(out)}\n")
        f.write(f"total_sec={total_sec}\n")
        f.write(f"total_frames={total_frames}\n")
print(json.dumps(out))
