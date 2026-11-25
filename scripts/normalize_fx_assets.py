import hashlib, json, os
EXT = {".json":"lottie",".cube":"lut",".png":"image",".jpg":"image",".jpeg":"image",".webp":"image",".wav":"audio",".mp3":"audio"}
assets = {}
for root, _, files in os.walk("assets"):
    for fn in sorted(files):
        if fn.startswith(".") or fn == "manifest.json": continue
        t = EXT.get(os.path.splitext(fn)[1].lower())
        if not t: continue
        p = os.path.join(root, fn).replace("\\", "/")
        h = hashlib.sha256(open(p, "rb").read()).hexdigest()
        assets[os.path.splitext(fn)[0]] = {"asset_id": os.path.splitext(fn)[0], "type": t, "path": p, "sha256": h, "validated": os.path.getsize(p) > 0}
json.dump({"version": "2.3", "assets": assets}, open("assets/manifest.json", "w", encoding="utf-8"), indent=2)
print(f"ASSET MANIFEST OK: {len(assets)} assets")
