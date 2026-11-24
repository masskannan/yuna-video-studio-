import json, os, subprocess, sys, urllib.error, urllib.request

def get_groq_key():
    k = os.environ.get("GROQ_API_KEY", "").strip()
    if not k and os.path.exists(".env"):
        for line in open(".env", "r", encoding="utf-8"):
            if line.startswith("GROQ_API_KEY="):
                k = line.split("=", 1)[1].strip().strip('"').strip("'")
    if not k:
        sys.exit("GROQ_API_KEY not found in env or .env")
    return k

def call_groq(system_prompt, user_prompt):
    key = get_groq_key()
    body = json.dumps({
        "model": "llama-3.3-70b-versatile",
        "response_format": {"type": "json_object"},
        "temperature": 0.2,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://api.groq.com/openai/v1/chat/completions",
        data=body,
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            res = json.loads(resp.read().decode("utf-8"))
        return json.loads(res["choices"][0]["message"]["content"])
    except urllib.error.HTTPError as e:
        sys.exit(f"Groq API HTTP {e.code}: {e.read().decode('utf-8', 'ignore')[:200]}")

def main():
    if len(sys.argv) < 2:
        sys.exit("Usage: python3 scripts/director.py \"<script or prompt>\"")
    prompt = " ".join(sys.argv[1:])
    if len(prompt) < 255 and os.path.exists(prompt):
        prompt = open(prompt, "r", encoding="utf-8").read()

    backups = {f: open(f, "r", encoding="utf-8").read() for f in ("timeline.json", "characters.json", "dialogue.json") if os.path.exists(f)}
    sys_msg = (
        "You are YUNA Video Studio Director. Convert the user's script/prompt into valid JSON with keys: "
        "'timeline' (fps=30, total_sec, reel_sec, mode in cinema|cartoon|ui_ux, use_manim, use_blender, scenes list with part,start_sec,end_sec,heading,accent), "
        "'characters' (dict of speakers with type character|worm, body_color, dress_style hoodie|suit|casual|none, dress_color, expression happy|angry|surprised|neutral, hat none|cap|crown|beanie, hat_color, mustache none|handlebar|thick|pencil, hair_color, glasses none|round|shades), "
        "'dialogue' (list of {speaker, voice, pitch 0.75-1.35, color hex, sfx ''|pop|whoosh|click|ding|boing, text}). "
        "Stay 100% faithful to the user's script without inventing unrelated scenes."
    )
    out = call_groq(sys_msg, f"Current timeline: {backups.get('timeline.json','{}')}\nCurrent characters: {backups.get('characters.json','{}')}\nScript/Prompt:\n{prompt}")
    try:
        for k in ("timeline", "characters", "dialogue"):
            if k in out:
                json.dump(out[k], open(f"{k}.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        subprocess.run(["python3", "scripts/validate_project.py"], check=True)
        print("Director split complete! Run: git add -A && git commit -m 'feat: new episode' && git push")
    except Exception:
        for f, raw in backups.items():
            open(f, "w", encoding="utf-8").write(raw)
        sys.exit("Rolled back JSONs due to validation error.")

if __name__ == "__main__":
    main()
