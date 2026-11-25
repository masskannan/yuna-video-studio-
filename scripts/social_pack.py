import json, os

def main():
    tl = json.load(open("timeline.json", encoding="utf-8"))
    br = json.load(open("brand.json", encoding="utf-8"))
    ch = open("chapters.txt", encoding="utf-8").read().strip() if os.path.exists("chapters.txt") else "00:00 Intro"
    title = tl.get("title") or br.get("name") or "YUNA Studio"
    os.makedirs("final", exist_ok=True)
    md = f"# Social Pack: {title}\n\n## YouTube (16:9 + Thumbnails)\n- Title: {title}\n- Chapters:\n{ch}\n\n## Instagram (9:16 Reel + 3:4 Feed + 4:5 Carousel)\n- Caption: {title} | Built with YUNA Cloud Studio\n- Comment CTA: Comment YUNA for link!\n"
    open("final/social_pack.md", "w", encoding="utf-8").write(md)
    print("SOCIAL PACK OK: final/social_pack.md")

if __name__ == "__main__":
    main()
