import json, os

def main():
    tl = json.load(open("timeline.json", encoding="utf-8"))
    br = json.load(open("brand.json", encoding="utf-8"))
    scenes = tl.get("scenes") or []
    ch = open("chapters.txt", encoding="utf-8").read().strip() if os.path.exists("chapters.txt") else "00:00 Hook"
    first_h = (scenes[0].get("heading") if scenes else "") or ""
    title = tl.get("title") or first_h or br.get("name") or "YUNA Studio"
    topics = []
    for s in scenes:
        for t in (s.get("topics") or []):
            w = "".join(c for c in str(t).title() if c.isalnum())
            if w and f"#{w}" not in topics:
                topics.append(f"#{w}")
    tags = " ".join((topics[:4] + ["#TamilTech", "#Shorts", "#Reels"]))
    os.makedirs("final", exist_ok=True)
    md = f"# Social Pack: {title}\n\n## YouTube\n- Title: {title}\n- Chapters:\n{ch}\n\n## Instagram\n- Caption: {title}\n- Tags: {tags}\n"
    open("final/social_pack.md", "w", encoding="utf-8").write(md)
    tg = f"📦 Ready-to-Post Packaging:\n\n🎬 Title: {title}\n💬 Caption: {first_h or title} — உங்கள் கருத்து என்ன?\n🏷️ Tags: {tags}"
    open("final/social_tg.txt", "w", encoding="utf-8").write(tg)
    print("SOCIAL PACK OK: final/social_pack.md + social_tg.txt")

if __name__ == "__main__":
    main()
