import json, os, sys

VALID_TOOLS = {"remotion", "manim", "blender"}
VALID_LOCATIONS = {"village_street", "tea_shop", "house_room"}
VALID_TOD = {"morning", "sunset", "night"}
VALID_POSES = {"idle", "hand_on_hip", "listen_ear", "wave", "arms_up", "point_up"}
VALID_PROPS = {"none", "camera", "headband", "mic"}
VALID_EXPR = {"happy", "angry", "surprised", "neutral"}
VALID_SFX = {"", "pop", "whoosh", "click", "ding", "boing"}

def norm_look(v):
    if isinstance(v, (int, float)):
        return max(-1.0, min(1.0, float(v)))
    s = str(v or "").strip().lower()
    if s == "left": return -1
    if s == "right": return 1
    try:
        return max(-1.0, min(1.0, float(s)))
    except Exception:
        return 0

def safe_loc(loc):
    if loc in VALID_LOCATIONS and os.path.exists(f"public/approved/bg_{loc}.jpg"):
        return loc, False
    return "house_room", True

def normalize_shot_list(data):
    if not isinstance(data, dict) or not isinstance(data.get("shots"), list) or not data["shots"]:
        raise ValueError("shot_list.json must be an object with non-empty 'shots' list")
    out_shots = []
    fallbacks = 0
    for i, s in enumerate(data["shots"]):
        if not isinstance(s, dict):
            continue
        tool = str(s.get("tool", "remotion")).lower()
        raw_loc = str(s.get("location", "house_room"))
        loc, did_fb = safe_loc(raw_loc)
        if did_fb and raw_loc != loc:
            fallbacks += 1
        tod = str(s.get("time_of_day", "morning"))
        sfx = str(s.get("sfx", ""))
        cast_out = []
        for c in (s.get("cast") or []):
            if not isinstance(c, dict): continue
            pose = str(c.get("pose", "hand_on_hip"))
            expr = str(c.get("expression", "happy"))
            prop = str(c.get("prop", "none"))
            cast_out.append({
                "name": str(c.get("name", "KANNAN")),
                "pose": pose if pose in VALID_POSES else "hand_on_hip",
                "expression": expr if expr in VALID_EXPR else "happy",
                "lookDir": norm_look(c.get("lookDir", 0)),
                "prop": prop if prop in VALID_PROPS else "none"
            })
        line = s.get("line") if isinstance(s.get("line"), dict) else {}
        out_shots.append({
            "id": f"{i:03d}",
            "duration_s": max(2, min(20, int(s.get("duration_s", 5) or 5))),
            "tool": tool if tool in VALID_TOOLS else "remotion",
            "fallback": "preset",
            "location": loc,
            "time_of_day": tod if tod in VALID_TOD else "morning",
            "camera": s.get("camera") if isinstance(s.get("camera"), dict) else {"move": "punch_in", "focus": "KANNAN"},
            "cast": cast_out,
            "line": {
                "speaker": str(line.get("speaker", "KANNAN")),
                "text": str(line.get("text", "")),
                "voice": str(line.get("voice", "ta-IN-ValluvarNeural"))
            },
            "widget": str(s.get("widget", "")),
            "sfx": sfx if sfx in VALID_SFX else "",
            "notes": str(s.get("notes", ""))
        })
    return {"version": "1.0", "shots": out_shots}, fallbacks

if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "shot_list.json"
    if not os.path.exists(path):
        print("SHOT_LIST_SKIP: file not present (V2.3 compatible)")
        sys.exit(0)
    raw = json.load(open(path, encoding="utf-8"))
    norm, fb = normalize_shot_list(raw)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(norm, f, ensure_ascii=False, indent=2)
    print(f"SHOTS_VALIDATED_OK: {len(norm['shots'])} shots (safe_fallbacks={fb})")
