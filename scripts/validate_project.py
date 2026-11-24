import json, os, re, sys

VALID_MODES = {"cinema", "cartoon", "ui_ux", "split_pip"}
VALID_SFX = {"", "pop", "whoosh", "click", "ding", "boing"}
VALID_HATS = {"none", "cap", "crown", "beanie"}
VALID_MUSTACHES = {"none", "handlebar", "thick", "pencil"}
VALID_GLASSES = {"none", "round", "shades"}
VALID_EXPR = {"happy", "angry", "surprised", "neutral"}
VALID_DRESS = {"hoodie", "suit", "casual", "none"}

def fail(msg):
    print(f"VALIDATION ERROR: {msg}", file=sys.stderr)
    sys.exit(1)

def load_req(path):
    if not os.path.exists(path):
        fail(f"Missing {path}")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def main():
    tl = load_req("timeline.json")
    dl = load_req("dialogue.json")
    ch = load_req("characters.json")
    load_req("brand.json")

    if str(tl.get("grade", "none")) not in {"none", "cyber", "warm", "noir"}:
        fail(f"Invalid timeline.grade: {tl.get('grade')}")
    if tl.get("mode", "cinema") not in VALID_MODES:
        fail(f"Invalid timeline.mode: {tl.get('mode')}")
    raw_t = tl.get("total_sec", 0)
    if str(raw_t).strip().lower() != "auto":
        try:
            if float(raw_t) <= 0: fail("timeline.total_sec must be > 0")
        except (TypeError, ValueError):
            fail(f"Invalid timeline.total_sec: {raw_t}")
    scenes = tl.get("scenes") or []
    if not scenes:
        fail("timeline.scenes cannot be empty")
    for i, s in enumerate(scenes):
        if float(s.get("end_sec", 0)) <= float(s.get("start_sec", 0)):
            fail(f"scene[{i}] end_sec must be > start_sec")
        if not str(s.get("heading", "")).strip():
            fail(f"scene[{i}] missing heading")
        acc = str(s.get("accent", "#38BDF8"))
        if not re.match(r"^#[0-9A-Fa-f]{6}$", acc):
            fail(f"scene[{i}] invalid accent hex: {acc}")

    if not isinstance(dl, list) or not dl:
        fail("dialogue.json must be a non-empty list")
    for i, d in enumerate(dl):
        if not str(d.get("text", "")).strip():
            fail(f"dialogue[{i}] empty text")
        p = float(d.get("pitch", 1.0))
        if not (0.75 <= p <= 1.35):
            fail(f"dialogue[{i}] pitch {p} out of range [0.75, 1.35]")
        if str(d.get("sfx", "")) not in VALID_SFX:
            fail(f"dialogue[{i}] invalid sfx: {d.get('sfx')}")
        spk = str(d.get("speaker", ""))
        if spk and spk not in ch:
            fail(f"dialogue[{i}] speaker '{spk}' missing in characters.json")

    for name, c in ch.items():
        if c.get("hat", "none") not in VALID_HATS:
            fail(f"char {name} invalid hat")
        if c.get("mustache", "none") not in VALID_MUSTACHES:
            fail(f"char {name} invalid mustache")
        if c.get("glasses", "none") not in VALID_GLASSES:
            fail(f"char {name} invalid glasses")
        if c.get("expression", "happy") not in VALID_EXPR:
            fail(f"char {name} invalid expression")
        if c.get("dress_style", "casual") not in VALID_DRESS:
            fail(f"char {name} invalid dress_style")


    if os.path.exists("overlays.json"):
        ovs = load_req("overlays.json")
        if not isinstance(ovs, list):
            fail("overlays.json must be a list")
        seen_ids = set()
        for i, o in enumerate(ovs):
            oid = str(o.get("id", "")).strip()
            if not oid or oid in seen_ids:
                fail(f"overlay[{i}] missing or duplicate id")
            seen_ids.add(oid)
            if not str(o.get("text", "")).strip():
                fail(f"overlay[{i}] empty text")
            if float(o.get("end_sec", 0)) <= float(o.get("start_sec", 0)):
                fail(f"overlay[{i}] end_sec must be > start_sec")
            if not (0.0 <= float(o.get("x", 0.5)) <= 1.0 and 0.0 <= float(o.get("y", 0.5)) <= 1.0):
                fail(f"overlay[{i}] x,y must be in [0.0, 1.0]")

    print("VALIDATION PASSED (timeline + dialogue + characters + brand OK)")

if __name__ == "__main__":
    main()
