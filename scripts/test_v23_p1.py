import json
pkg = json.load(open("package.json", encoding="utf-8"))
assert pkg["dependencies"]["@remotion/lottie"] == "4.0.250" and pkg["dependencies"]["@remotion/transitions"] == "4.0.250"
preset = json.load(open("fx/presets/hybrid_default.json", encoding="utf-8"))
schema = json.load(open("schemas/fx.schema.json", encoding="utf-8"))
assert all(k in schema["feature_ids"] for k in preset["effects"])
mm = open("src/MainMovie.tsx", encoding="utf-8").read()
assert "FxLayer" in mm and '?? "SAFE"' in mm
assert json.load(open("assets/manifest.json", encoding="utf-8"))["version"] == "2.3"
print("V2.3 P1 TESTS PASSED")
