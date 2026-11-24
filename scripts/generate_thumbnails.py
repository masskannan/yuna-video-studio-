import glob, json, os, subprocess
from PIL import Image, ImageDraw, ImageFont, features

OUT_DIR = "final"
os.makedirs(OUT_DIR, exist_ok=True)

def load_json(path, default):
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return default

def find_tamil_font():
    try:
        out = subprocess.check_output(
            ["fc-match", "-f", "%{file}", "Noto Sans Tamil:bold"], stderr=subprocess.DEVNULL
        ).decode().strip()
        if out and os.path.exists(out):
            return out
    except Exception:
        pass
    for pat in [
        "/usr/share/fonts/**/NotoSansTamil*Bold*.ttf",
        "/usr/share/fonts/**/NotoSansTamil*.ttf",
        "/usr/share/fonts/**/Lohit-Tamil*.ttf",
    ]:
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
    words = text.split()
    lines, cur = [], ""
    for w in words:
        test = f"{cur} {w}".strip()
        box = draw.textbbox((0, 0), test, font=font, stroke_width=6)
        if box[2] - box[0] <= max_w or not cur:
            cur = test
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines[:3]

def make_gradient(w, h, top_hex, bot_hex):
    def h2rgb(hx):
        hx = hx.lstrip("#")
        return tuple(int(hx[i:i+2], 16) for i in (0, 2, 4))
    c1, c2 = h2rgb(top_hex), h2rgb(bot_hex)
    img = Image.new("RGB", (w, h))
    draw = ImageDraw.Draw(img)
    for y in range(h):
        t = y / max(1, h - 1)
        r = int(c1[0] + (c2[0] - c1[0]) * t)
        g = int(c1[1] + (c2[1] - c1[1]) * t)
        b = int(c1[2] + (c2[2] - c1[2]) * t)
        draw.line([(0, y), (w, y)], fill=(r, g, b))
    return img

def draw_stroke_shadow(draw, xy, text, font, fill, stroke_fill="#000000", sw=6):
    x, y = xy
    draw.text((x + 4, y + 6), text, font=font, fill=(0, 0, 0), stroke_width=sw, stroke_fill=(0, 0, 0))
    draw.text((x, y), text, font=font, fill=fill, stroke_width=sw, stroke_fill=stroke_fill)

def render_thumb(out_path, title, sub, badge, top_hex, bot_hex, accent_hex, title_fill, split=False):
    W, H = 1280, 720
    img = make_gradient(W, H, top_hex, bot_hex)
    draw = ImageDraw.Draw(img)
    fpath = find_tamil_font()
    f_title = load_font(fpath, 72)
    f_sub = load_font(fpath, 38)
    f_badge = load_font(fpath, 30)

    if split:
        draw.polygon([(0, 0), (540, 0), (420, H), (0, H)], fill="#1E1B4B")
        draw.line([(540, 0), (420, H)], fill=accent_hex, width=10)
        draw.rectangle([0, 0, 18, H], fill=accent_hex)
    else:
        draw.rectangle([0, 0, 24, H], fill=accent_hex)
        draw.rectangle([860, 0, W, 14], fill=accent_hex)

    bx, by = 64, 54
    draw.rounded_rectangle([bx, by, bx + 320, by + 58], radius=14, fill="#0F172A", outline=accent_hex, width=3)
    draw.text((bx + 22, by + 11), badge, font=f_badge, fill="#F8FAFC")

    lines = wrap_text(draw, title, f_title, 1060)
    y = 210
    for ln in lines:
        draw_stroke_shadow(draw, (64, y), ln, f_title, title_fill, sw=7)
        y += 105

    draw_stroke_shadow(draw, (64, 590), sub, f_sub, accent_hex if not split else "#FFFFFF", sw=4)
    img.save(out_path, "JPEG", quality=92)
    print(f"Saved {out_path} (font={fpath}, raqm={features.check('raqm')})")

def main():
    brand = load_json("brand.json", {})
    tl = load_json("timeline.json", {})
    scenes = tl.get("scenes") or []
    h1 = scenes[0].get("heading", "AI Video Studio") if scenes else "AI Video Studio"
    h2 = scenes[-1].get("heading", h1) if len(scenes) > 1 else h1
    accent = (scenes[0].get("accent") if scenes else None) or brand.get("primary_color", "#38BDF8")
    name = brand.get("name", "YUNA Studio")
    tagline = brand.get("tagline", "AI & Tech in Tamil")

    render_thumb(
        os.path.join(OUT_DIR, "thumb_A.jpg"),
        h1, tagline, name,
        brand.get("bg_top", "#171333"), brand.get("bg_bottom", "#070913"),
        accent, "#FFFFFF", split=False
    )
    render_thumb(
        os.path.join(OUT_DIR, "thumb_B.jpg"),
        h2, f"{name} • HD", "MUST WATCH",
        "#2B102E", "#090D16",
        "#FACC15", "#FACC15", split=True
    )

if __name__ == "__main__":
    main()
