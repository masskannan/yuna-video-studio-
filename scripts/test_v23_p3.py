import glob, json, re

schema = json.load(open("schemas/fx.schema.json", encoding="utf-8"))
assert len(schema["feature_ids"]) == 45

all_code = "\n".join(open(p, encoding="utf-8").read() for p in glob.glob("src/fx/**/*.tsx", recursive=True) + ["scripts/ffmpeg_finish.py", "scripts/normalize_fx_assets.py"])
# Also verify all 45 IDs exist in FxRegistry.ts and presets validate
reg = open("src/fx/core/FxRegistry.ts", encoding="utf-8").read()
for fid in schema["feature_ids"]:
    assert fid in reg, f"Missing {fid} in FxRegistry"

for pf in glob.glob("fx/presets/*.json"):
    d = json.load(open(pf, encoding="utf-8"))
    assert d["fx_mode"] in schema["modes"]
    for k in d.get("effects", {}):
        assert k in schema["feature_ids"], f"Invalid FX {k} in {pf}"

mc = json.load(open("schemas/mobile_control.schema.json", encoding="utf-8"))
assert mc["secrets_backend_only"] is True
assert "fx_mode" not in json.load(open("timeline.json", encoding="utf-8")) or json.load(open("timeline.json", encoding="utf-8")).get("fx_mode") == "SAFE"
print("V2.3 P3 ACCEPTANCE TESTS PASSED: 45/45 Registry + Presets + Mobile Schema + SAFE Default OK")
