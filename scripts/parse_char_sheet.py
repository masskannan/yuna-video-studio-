import os, sys, json
from collections import deque
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from auto_rig_char import analyze_and_split

def foreground_mask(img_rgba):
    arr = np.array(img_rgba)
    alpha = arr[:, :, 3]
    if (alpha < 240).any():
        return alpha > 20
    rgb = arr[:, :, :3]
    return ~((rgb[:, :, 0] > 238) & (rgb[:, :, 1] > 238) & (rgb[:, :, 2] > 238))

def border_flood_transparent(pil_img):
    arr = np.array(pil_img.convert("RGBA"))
    if (arr[:, :, 3] < 240).any():
        return Image.fromarray(arr)
    H, W, _ = arr.shape
    near_white = (arr[:, :, 0] > 235) & (arr[:, :, 1] > 235) & (arr[:, :, 2] > 235)
    visited = np.zeros((H, W), dtype=bool)
    q = deque()
    for x in range(W):
        if near_white[0, x]: visited[0, x] = True; q.append((0, x))
        if near_white[H - 1, x]: visited[H - 1, x] = True; q.append((H - 1, x))
    for y in range(H):
        if near_white[y, 0] and not visited[y, 0]: visited[y, 0] = True; q.append((y, 0))
        if near_white[y, W - 1] and not visited[y, W - 1]: visited[y, W - 1] = True; q.append((y, W - 1))
    while q:
        cy, cx = q.popleft()
        arr[cy, cx, 3] = 0
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < H and 0 <= nx < W and not visited[ny, nx] and near_white[ny, nx]:
                visited[ny, nx] = True
                q.append((ny, nx))
    return Image.fromarray(arr)

def find_blobs_1d(proj, min_size=12, merge_gap=10):
    active = proj > 0
    blobs, in_blob, start = [], False, 0
    for i, val in enumerate(active):
        if val and not in_blob:
            start, in_blob = i, True
        elif not val and in_blob:
            if i - start >= min_size:
                blobs.append([start, i])
            in_blob = False
    if in_blob and len(active) - start >= min_size:
        blobs.append([start, len(active)])
    merged = []
    for b in blobs:
        if merged and (b[0] - merged[-1][1]) <= merge_gap:
            merged[-1][1] = b[1]
        else:
            merged.append(b)
    return merged

def crop_tight(img, pad=4):
    clean = border_flood_transparent(img)
    arr = np.array(clean)
    ys, xs = np.where(arr[:, :, 3] > 15)
    if len(ys) == 0:
        return clean
    y0, y1 = max(0, int(ys.min()) - pad), min(clean.height, int(ys.max()) + pad)
    x0, x1 = max(0, int(xs.min()) - pad), min(clean.width, int(xs.max()) + pad)
    return clean.crop((x0, y0, x1, y1))

def parse_sheet(sheet_path, char_name, out_root="public/approved/chars"):
    out_dir = os.path.join(out_root, char_name)
    os.makedirs(out_dir, exist_ok=True)
    img = Image.open(sheet_path).convert("RGBA")
    mask = foreground_mask(img)
    H, W = mask.shape

    row_blobs = find_blobs_1d(mask.sum(axis=1), min_size=max(10, int(H * 0.06)), merge_gap=max(6, int(H * 0.025)))
    if len(row_blobs) >= 2:
        top2 = sorted(sorted(row_blobs, key=lambda b: b[1] - b[0], reverse=True)[:2], key=lambda b: b[0])
        (top_y0, top_y1), (bot_y0, bot_y1) = top2[0], top2[1]
    else:
        top_y0, top_y1 = 0, int(H * 0.60)
        bot_y0, bot_y1 = int(H * 0.60), H

    top_img = img.crop((0, top_y0, W, top_y1))
    col_blobs = find_blobs_1d(mask[top_y0:top_y1, :].sum(axis=0), min_size=max(10, int(W * 0.04)), merge_gap=max(6, int(W * 0.02)))
    angle_names = ["front", "three_quarter", "side", "back"]
    if len(col_blobs) >= 4:
        top4 = sorted(sorted(col_blobs, key=lambda b: b[1] - b[0], reverse=True)[:4], key=lambda b: b[0])
        for name, (x0, x1) in zip(angle_names, top4):
            crop_tight(top_img.crop((x0, 0, x1, top_img.height))).save(os.path.join(out_dir, f"{name}.png"))
    else:
        step = W // 4
        for idx, name in enumerate(angle_names):
            crop_tight(top_img.crop((idx * step, 0, (idx + 1) * step, top_img.height))).save(os.path.join(out_dir, f"{name}.png"))

    bot_img = img.crop((0, bot_y0, W, bot_y1))
    face_blobs = find_blobs_1d(mask[bot_y0:bot_y1, :].sum(axis=0), min_size=max(8, int(W * 0.03)), merge_gap=max(4, int(W * 0.015)))
    face_names = ["face_neutral", "face_happy", "face_angry", "face_surprised", "face_blink", "face_mouth"]
    if len(face_blobs) >= 6:
        top6 = sorted(sorted(face_blobs, key=lambda b: b[1] - b[0], reverse=True)[:6], key=lambda b: b[0])
        for name, (x0, x1) in zip(face_names, top6):
            crop_tight(bot_img.crop((x0, 0, x1, bot_img.height))).save(os.path.join(out_dir, f"{name}.png"))
    else:
        step = W // 6
        for idx, name in enumerate(face_names):
            crop_tight(bot_img.crop((idx * step, 0, (idx + 1) * step, bot_img.height))).save(os.path.join(out_dir, f"{name}.png"))

    rig = analyze_and_split(os.path.join(out_dir, "front.png"), out_dir)
    rig["character_name"] = char_name
    rig["angles"] = angle_names
    rig["face_cuts"] = face_names
    with open(os.path.join(out_dir, "char_rig.json"), "w", encoding="utf-8") as f:
        json.dump(rig, f, indent=2)
    print(f"CHAR_SHEET_PARSED_OK: {char_name} -> 4 angles + 6 faces + auto-rig ({rig['body_profile']['type']})")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 scripts/parse_char_sheet.py <sheet.png> <char_name>")
        sys.exit(1)
    parse_sheet(sys.argv[1], sys.argv[2])
