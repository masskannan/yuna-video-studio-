import glob, os

def main():
    os.makedirs("final", exist_ok=True)
    imgs = sorted(p for p in glob.glob("assets/products/*") if not os.path.basename(p).startswith("."))
    if not imgs:
        print("No product photos in assets/products/; skipping.")
        return
    from PIL import Image
    from rembg import remove
    for idx, p in enumerate(imgs, start=1):
        fg = remove(Image.open(p).convert("RGBA"))
        fg.thumbnail((820, 820))
        bg = Image.new("RGBA", (1080, 1440), (15, 23, 42, 255))
        bg.paste(fg, ((1080 - fg.width) // 2, (1440 - fg.height) // 2), fg)
        out = f"final/product_promo_{idx}.png"
        bg.convert("RGB").save(out, "PNG")
        print(f"Saved {out}")

if __name__ == "__main__":
    main()
