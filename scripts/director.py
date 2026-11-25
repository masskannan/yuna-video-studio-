import json, os, subprocess, sys, urllib.error, urllib.request

MODELS = ["openai/gpt-oss-120b", "qwen/qwen3.8-27b", "openai/gpt-oss-20b"]

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
    last_err = None
    for model_id in MODELS:
        body = json.dumps({
            "model": model_id,
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
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json", "User-Agent": "Mozilla/5.0"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                res = json.loads(resp.read().decode("utf-8"))
            return json.loads(res["choices"][0]["message"]["content"])
        except urllib.error.HTTPError as e:
            last_err = f"HTTP {e.code} ({model_id}): {e.read().decode('utf-8', 'ignore')[:160]}"
            if e.code in (400, 404, 429):
                continue
            sys.exit(last_err)
    nv = os.environ.get("NVIDIA_API_KEY", "").strip()
    if not nv and os.path.exists(".env"):
        for line in open(".env", "r", encoding="utf-8"):
            if line.startswith("NVIDIA_API_KEY="): nv = line.split("=", 1)[1].strip().strip('"').strip("'")
    if nv:
        nreq = urllib.request.Request(
            "[https://integrate.api.nvidia.com/v1/chat/completions](https://integrate.api.nvidia.com/v1/chat/completions)",
            data=json.dumps({"model": "meta/llama-3.1-70b-instruct", "temperature": 0.2, "messages": [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}]}).encode("utf-8"),
            headers={"Authorization": f"Bearer {nv}", "Content-Type": "application/json", "User-Agent": "Mozilla/5.0"},
            method="POST",
        )
        with urllib.request.urlopen(nreq, timeout=60) as resp:
            txt = json.loads(resp.read().decode("utf-8"))["choices"][0]["message"]["content"]
            clean = txt.strip().strip("`").strip()
            if clean.startswith("json"): clean = clean[4:].strip()
            return json.loads(clean)
    sys.exit(f"All Groq models failed: {last_err}")

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
        "'dialogue_pipe' (list of compact pipe strings: 'SPEAKER|VOICE|PITCH|COLOR|SFX|TEXT', e.g. 'YUNA|ta-IN-ValluvarNeural|0.93|#38BDF8|whoosh|Hello'). "
        "Stay 100% faithful to the user's script."
    )
    out = call_groq(sys_msg, f"Current timeline: {backups.get('timeline.json','{}')}\nCurrent characters: {backups.get('characters.json','{}')}\nScript/Prompt:\n{prompt}")
    try:
        if "dialogue_pipe" in out and isinstance(out["dialogue_pipe"], list):
            parsed = []
            for row in out["dialogue_pipe"]:
                parts = [p.strip() for p in str(row).split("|", 5)]
                if len(parts) == 6:
                    parsed.append({"speaker": parts[0], "voice": parts[1], "pitch": float(parts[2] or 1.0), "color": parts[3], "sfx": parts[4], "text": parts[5]})
            if parsed:
                out["dialogue"] = parsed
        for k in ("timeline", "characters", "dialogue"):
            if k in out:
                json.dump(out[k], open(f"{k}.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        subprocess.run(["python3", "scripts/validate_project.py"], check=True)
        print("Director split complete!")
    except Exception:
        for f, raw in backups.items():
            open(f, "w", encoding="utf-8").write(raw)
        sys.exit("Rolled back JSONs due to validation error.")

if __name__ == "__main__":
    main()
