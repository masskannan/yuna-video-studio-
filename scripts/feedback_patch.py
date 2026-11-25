import json, os, subprocess, sys
from director import call_groq

def deep_merge(base, upd):
    for k, v in upd.items():
        if isinstance(v, dict) and isinstance(base.get(k), dict):
            deep_merge(base[k], v)
        else:
            base[k] = v
    return base

def apply_rfc6902(cur, ops):
    for op in ops:
        act = op.get("op")
        parts = [p.replace("~1", "/").replace("~0", "~") for p in str(op.get("path", "")).split("/") if p]
        if not parts:
            continue
        ref = cur
        for p in parts[:-1]:
            ref = ref[int(p)] if isinstance(ref, list) else ref.setdefault(p, {})
        last = int(parts[-1]) if isinstance(ref, list) else parts[-1]
        if act in ("replace", "add"):
            if isinstance(ref, list) and last == len(ref):
                ref.append(op.get("value"))
            else:
                ref[last] = op.get("value")
        elif act == "remove" and ((isinstance(ref, list) and 0 <= last < len(ref)) or (isinstance(ref, dict) and last in ref)):
            del ref[last]

def main():
    if len(sys.argv) < 2:
        sys.exit("Usage: python3 scripts/feedback_patch.py \"<feedback>\"")
    fb = " ".join(sys.argv[1:])
    files = ("timeline.json", "characters.json", "dialogue.json", "overlays.json")
    backups = {f: open(f, "r", encoding="utf-8").read() for f in files if os.path.exists(f)}
    cur = {k: json.loads(backups.get(f"{k}.json", "[]" if k in ("dialogue", "overlays") else "{}")) for k in ("timeline", "characters", "dialogue", "overlays")}
    sys_msg = (
        "You are a surgical video patcher. Prefer RFC 6902 JSON Patch under 'ops': "
        "[{\"op\":\"replace|add|remove\",\"path\":\"/characters/YUNA/hat_color\",\"value\":\"#EF4444\"}]. "
        "Root keys are characters, timeline, dialogue, overlays. Do NOT alter unrequested fields."
    )
    patch = call_groq(sys_msg, f"Current:\n{json.dumps(cur, ensure_ascii=False)}\nFeedback:\n{fb}")
    try:
        if "ops" in patch and isinstance(patch["ops"], list):
            apply_rfc6902(cur, patch["ops"])
            for k in ("characters", "timeline", "dialogue", "overlays"):
                json.dump(cur[k], open(f"{k}.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
            print(f"Applied {len(patch['ops'])} RFC-6902 patch ops")
        else:
            for k in ("characters", "timeline"):
                if k in patch and isinstance(patch[k], dict):
                    json.dump(deep_merge(cur[k], patch[k]), open(f"{k}.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
            for lk in ("dialogue", "overlays"):
                if lk in patch and isinstance(patch[lk], list):
                    json.dump(patch[lk], open(f"{lk}.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        subprocess.run(["python3", "scripts/validate_project.py"], check=True)
        subprocess.run(["git", "diff", "--stat"])
    except Exception:
        for f, raw in backups.items():
            open(f, "w", encoding="utf-8").write(raw)
        sys.exit("Rolled back JSONs due to validation error.")

if __name__ == "__main__":
    main()
