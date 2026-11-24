import json, os, subprocess, sys
from director import call_groq

def deep_merge(base, upd):
    for k, v in upd.items():
        if isinstance(v, dict) and isinstance(base.get(k), dict):
            deep_merge(base[k], v)
        else:
            base[k] = v
    return base

def main():
    if len(sys.argv) < 2:
        sys.exit("Usage: python3 scripts/feedback_patch.py \"<feedback>\"")
    fb = " ".join(sys.argv[1:])
    backups = {f: open(f, "r", encoding="utf-8").read() for f in ("timeline.json", "characters.json", "dialogue.json") if os.path.exists(f)}
    cur = {k: json.loads(backups[f"{k}.json"]) for k in ("timeline", "characters", "dialogue")}
    sys_msg = (
        "You are a surgical video patcher. Given current JSONs and user feedback (in Tamil or English), "
        "return ONLY a JSON object containing ONLY the changed keys ('characters', 'timeline', or 'dialogue'). "
        "For 'characters' and 'timeline', you may return partial nested dicts with only changed fields. "
        "For 'dialogue', return the full updated list if dialogue changed. Do NOT alter anything unrequested."
    )
    patch = call_groq(sys_msg, f"Current:\n{json.dumps(cur, ensure_ascii=False)}\nFeedback:\n{fb}")
    try:
        for k in ("characters", "timeline"):
            if k in patch and isinstance(patch[k], dict):
                merged = deep_merge(cur[k], patch[k])
                json.dump(merged, open(f"{k}.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
                print(f"Patched {k}.json")
        if "dialogue" in patch and isinstance(patch["dialogue"], list):
            json.dump(patch["dialogue"], open("dialogue.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
            print("Patched dialogue.json")
        subprocess.run(["python3", "scripts/validate_project.py"], check=True)
        subprocess.run(["git", "diff", "--stat"])
    except Exception:
        for f, raw in backups.items():
            open(f, "w", encoding="utf-8").write(raw)
        sys.exit("Rolled back JSONs due to validation error.")

if __name__ == "__main__":
    main()
