import glob, hashlib, json, os, subprocess

SRC_DIR = "assets/broll"
OUT_DIR = "public/broll"
MANIFEST = "src/broll_manifest.json"
os.makedirs(OUT_DIR, exist_ok=True)

def sha16(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for blk in iter(lambda: f.read(65536), b""):
            h.update(blk)
    return h.hexdigest()[:16]

def main():
    files = sorted(glob.glob(os.path.join(SRC_DIR, "*")))
    mapping = {}
    for p in files:
        base = os.path.basename(p)
        if os.path.isdir(p) or base.startswith("."):
            continue
        ext = os.path.splitext(p)[1].lower()
        key = sha16(p)
        if ext in (".mp4", ".mov", ".mkv", ".webm"):
            out_name = f"{key}.mp4"
            out_path = os.path.join(OUT_DIR, out_name)
            if not os.path.exists(out_path):
                subprocess.run([
                    "ffmpeg", "-y", "-i", p, "-an", "-r", "30",
                    "-vf", "scale='min(1920,iw)':'min(1920,ih)':force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:ceil(ih/2)*2",
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "22", "-preset", "fast", out_path
                ], check=True)
            mapping[base] = f"broll/{out_name}"
        elif ext in (".jpg", ".jpeg", ".png", ".webp"):
            from PIL import Image, ImageOps
            out_name = f"{key}.jpg"
            out_path = os.path.join(OUT_DIR, out_name)
            if not os.path.exists(out_path):
                im = ImageOps.exif_transpose(Image.open(p)).convert("RGB")
                im.thumbnail((1920, 1920))
                im.save(out_path, "JPEG", quality=92)
            mapping[base] = f"broll/{out_name}"
    json.dump(mapping, open(MANIFEST, "w", encoding="utf-8"), indent=2)
    print(f"Normalized {len(mapping)} B-Roll assets")

if __name__ == "__main__":
    main()
