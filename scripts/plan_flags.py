import json, os

tl = json.load(open("timeline.json", "r", encoding="utf-8")) if os.path.exists("timeline.json") else {}
um = "true" if tl.get("use_manim") else "false"
ub = "true" if tl.get("use_blender") else "false"
out = os.environ.get("GITHUB_OUTPUT")
if out:
    with open(out, "a", encoding="utf-8") as f:
        f.write(f"use_manim={um}\nuse_blender={ub}\n")
print(f"Flags: use_manim={um}, use_blender={ub}")
