import os, sys, json, urllib.request

msg_text = sys.argv[1] if len(sys.argv) > 1 else ""
bot = os.environ.get("BOT", "").strip()
chat = os.environ.get("CHAT", "").strip()
if not (msg_text and bot and chat and os.path.exists("timeline.json")):
    sys.exit(0)

try:
    tl = json.load(open("timeline.json", encoding="utf-8"))
    mid = tl.get("tg_msg_id")
    if not mid:
        sys.exit(0)
    payload = json.dumps({"chat_id": chat, "message_id": int(mid), "parse_mode": "HTML", "text": msg_text}).encode("utf-8")
    req = urllib.request.Request(f"https://api.telegram.org/bot{bot}/editMessageText", data=payload, method="POST", headers={"Content-Type": "application/json"})
    urllib.request.urlopen(req, timeout=10).read()
except Exception:
    pass
