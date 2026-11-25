import hashlib, json, os

EXT_TYPES = {
    ".json": "lottie",
    ".cube": "lut",
    ".png": "image",
    ".jpg": "image",
    ".jpeg": "image",
    ".webp": "image",
    ".wav": "audio",
    ".mp3": "audio",
}

def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()

def main():
    assets = {}
    if os.path.isdir("assets"):
        for root, _, files in os.walk("assets"):
            for fn in sorted(files):
                if fn.startswith(".") or fn == "manifest.json":
                    continue
                ext = os.path.splitext(fn)[1].lower()
                atype = EXT_TYPES.get(ext)
                if not atype:
                    continue
                full = os.path.join(root, fn).replace("\\", "/")
                aid = os.path.splitext(fn)[0]
                assets[aid] = {
                    "asset_id": aid,
                    "type": atype,
                    "path": full,
                    "sha256": sha256_file(full),
                    "validated": os.path.getsize(full) > 0,
                }
    manifest = {"version": "2.3", "assets": assets}
    with open("assets/manifest.json", "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    print(f"ASSET MANIFEST OK: {len(assets)} assets indexed")

if __name__ == "__main__":
    main()
