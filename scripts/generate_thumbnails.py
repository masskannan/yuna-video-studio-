import glob, json, os, subprocess
from PIL import Image, ImageDraw, ImageFont, features

OUT_DIR = "final"
os.makedirs(OUT_DIR, exist_ok=True)

def load_json(path, default):
    return json.load(open(path, "r", encoding="utf-8")) if os.path.exists(path) else default

def find_tamil_font():
    try:
        out = subprocess.check_output(["fc-match", "-f", "%{file}", "Noto Sans Tamil:bold"], stderr=subprocess.DEVNULL).decode().strip()
        if out and os.path.exists(out):
            return out
    except Exception:
        pass
    for pat in ["/usr/share/fonts/**/NotoSansTamil*Bold*.ttf", "/usr/share/fonts/**/NotoSansTamil*.ttf", "/usr/share/fonts/**/Lohit-Tamil*.ttf"]:
        hits = glob.glob(pat, recursive=True)
        if hits:
            return hits[0]
    return None

def load_font(path, size):
    if not path:
        return ImageFont.load_default()
    try:
        return ImageFont.truetype(path, size=size, layout_engine=ImageFont.Layout.RAQM)
    except Exception:
        return ImageFont.truetype(path, size=size)

def wrap_text(draw, text, font, max_w):
    lines, cur = [], ""
    for w in text.split():
        test = f"{cur} {w}".strip()
        box = draw.textbbox((0, 0), test, font=font, stroke_width=6)
        if box[2] - box[0] <= max_w or not cur:
            cur = test
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines[:4]

def make_gradient(w, h, top_hex, bot_hex):
    def h2rgb(hx):
        hx = hx.lstrip("#")
        return tuple(int(hx[i:i+2], 16) for i in (0, 2, 4))
    c1, c2 = h2rgb(top_hex), h2rgb(bot_hex)
    img = Image.new("RGB", (w, h))
    draw = ImageDraw.Draw(img)
    for y in range(h):
        t = y / max(1, h - 1)
        draw.line([(0, y), (w, y)], fill=(int(c1[0]+(c2[0]-c1[0])*t), int(c1[1]+(c2[1]-c1[1])*t), int(c1[2]+(c2[2]-c1[2])*t)))
    return img

def draw_ss(draw, xy, text, font, fill, sw=6):
    x, y = xy
    draw.text((x + 4, y + 6), text, font=font, fill=(0, 0, 0), stroke_width=sw, stroke_fill=(0, 0, 0))
    draw.text((x, y), text, font=font, fill=fill, stroke_width=sw, stroke_fill="#000000")

def render_card(out_path, W, H, title, sub, badge, top_hex, bot_hex, accent_hex, title_fill, split=False, centered=False):
    img = make_gradient(W, H, top_hex, bot_hex)
    draw = ImageDraw.Draw(img)
    fpath = find_tamil_font()
    f_title = load_font(fpath, 68 if W >= 1200 else 60)
    f_sub = load_font(fpath, 36 if W >= 1200 else 34)
    f_badge = load_font(fpath, 28)

    if split:
        draw.polygon([(0, 0), (int(W * 0.42), 0), (int(W * 0.33), H), (0, H)], fill="#1E1B4B")
        draw.line([(int(W * 0.42), 0), (int(W * 0.33), H)], fill=accent_hex, width=10)
        draw.rectangle([0, 0, 16, H], fill=accent_hex)
    else:
        draw.rectangle([0, 0, 22, H], fill=accent_hex)
        draw.rectangle([int(W * 0.65), 0, W, 12], fill=accent_hex)

    bx, by = 60, int(H * 0.08) if not centered else int(H * 0.28)
    draw.rounded_rectangle([bx, by, bx + 310, by + 54], radius=14, fill="#0F172A", outline=accent_hex, width=3)
    draw.text((bx + 20, by + 10), badge, font=f_badge, fill="#F8FAFC")

    lines = wrap_text(draw, title, f_title, W - 140)
    y = int(H * 0.28) if not centered else int(H * 0.38)
    for ln in lines:
        draw_ss(draw, (60, y), ln, f_title, title_fill, sw=6)
        y += 92

    sub_y = min(H - 90, int(H * 0.80)) if not centered else int(H * 0.68)
    draw_ss(draw, (60, sub_y), sub, f_sub, accent_hex if not split else "#FFFFFF", sw=4)
    img.save(out_path, "JPEG", quality=92)
    print(f"Saved {out_path} ({W}x{H}, raqm={features.check('raqm')})")

def main():
    brand = load_json("brand.json", {})
    tl = load_json("timeline.json", {})
    scenes = tl.get("scenes") or []
    h1 = scenes[0].get("heading", "AI Video Studio") if scenes else "AI Video Studio"
    h2 = scenes[-1].get("heading", h1) if len(scenes) > 1 else h1
    accent = (scenes[0].get("accent") if scenes else None) or brand.get("primary_color", "#38BDF8")
    name = brand.get("name", "YUNA Studio")
    tagline = brand.get("tagline", "AI & Tech in Tamil")
    top_c, bot_c = brand.get("bg_top", "#171333"), brand.get("bg_bottom", "#070913")

    render_card(os.path.join(OUT_DIR, "thumb_A.jpg"), 1280, 720, h1, tagline, name, top_c, bot_c, accent, "#FFFFFF", split=False)
    render_card(os.path.join(OUT_DIR, "thumb_B.jpg"), 1280, 720, h2, f"{name} • HD", "MUST WATCH", "#2B102E", "#090D16", "#FACC15", "#FACC15", split=True)
    render_card(os.path.join(OUT_DIR, "ig_post_3x4.jpg"), 1080, 1440, h1, tagline, name, top_c, bot_c, accent, "#FFFFFF", split=False)
    render_card(os.path.join(OUT_DIR, "ig_carousel_4x5.jpg"), 1080, 1350, h2, f"{name} • Swipe", "CAROUSEL", "#1E1B4B", "#070913", "#FACC15", "#FACC15", split=True)
    render_card(os.path.join(OUT_DIR, "reel_cover_9x16.jpg"), 1080, 1920, h1, tagline, name, top_c, bot_c, accent, "#FFFFFF", split=False, centered=True)

if __name__ == "__main__":
    main()
