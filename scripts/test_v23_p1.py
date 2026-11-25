import json

pkg = json.load(open("package.json", encoding="utf-8"))
assert pkg["dependencies"]["@remotion/lottie"] == "4.0.250", "lottie version mismatch"
assert pkg["dependencies"]["@remotion/transitions"] == "4.0.250", "transitions version mismatch"

preset = json.load(open("fx/presets/hybrid_default.json", encoding="utf-8"))
schema = json.load(open("schemas/fx.schema.json", encoding="utf-8"))
for k in preset["effects"]:
    assert k in schema["feature_ids"], f"Unknown preset FX key: {k}"

mm = open("src/MainMovie.tsx", encoding="utf-8").read()
assert "FxLayer" in mm and '?? "SAFE"' in mm, "MainMovie.tsx missing SAFE-default FxLayer"

manifest = json.load(open("assets/manifest.json", encoding="utf-8"))
assert manifest["version"] == "2.3", "assets/manifest.json version mismatch"

print("V2.3 P1 TESTS PASSED: Remotion 4.0.250 pins + Asset Manifest + Hybrid Preset + MainMovie SAFE Gate OK")
