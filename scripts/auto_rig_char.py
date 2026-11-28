import argparse, colorsys, json, math, os, re, sys
from collections import Counter
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

try:
    import cv2
except Exception:
    cv2 = None

try:
    import mediapipe as mp
    from mediapipe.tasks import python as mp_python
    from mediapipe.tasks.python import vision
except Exception:
    mp = None

try:
    import vtracer
except Exception:
    vtracer = None

LEFT_EYE_IDX  = [33, 133, 159, 145, 160, 144]
RIGHT_EYE_IDX = [362, 263, 386, 374, 387, 373]
MOUTH_IDX     = [61, 291, 0, 17, 13, 14, 78, 308]
HEAD_IDX      = [10, 152, 234, 454, 127, 356]
MAX_SVG_BYTES = 180_000
MAX_SVG_PATHS = 1200

def clamp01(v: float) -> float:
    return round(max(0.0, min(1.0, float(v))), 4)

def pt(x: float, y: float) -> dict:
    return {"x": clamp01(x), "y": clamp01(y)}

def bone_metrics_px(a: dict, b: dict, w: int, h: int) -> dict:
    dx = (b["x"] - a["x"]) * w
    dy = (b["y"] - a["y"]) * h
    return {"length_px": round(math.hypot(dx, dy), 2), "rest_deg": round(math.degrees(math.atan2(dy, dx)), 2)}

def count_horizontal_segments(row_mask):
    padded = np.concatenate(([False], row_mask, [False]))
    starts = np.where(~padded[:-1] & padded[1:])[0]
    ends = np.where(padded[:-1] & ~padded[1:])[0]
    return [(int(s), int(e)) for s, e in zip(starts, ends) if (e - s) >= 3]

def bbox_from_indices(lms, indices, pad_x=0.015, pad_y=0.015) -> dict:
    xs = [lms[i].x for i in indices]
    ys = [lms[i].y for i in indices]
    x0, x1 = max(0.0, min(xs) - pad_x), min(1.0, max(xs) + pad_x)
    y0, y1 = max(0.0, min(ys) - pad_y), min(1.0, max(ys) + pad_y)
    return {"x": round(x0, 4), "y": round(y0, 4), "w": round(max(0.01, x1 - x0), 4), "h": round(max(0.01, y1 - y0), 4)}

def inpaint_erase_region(rgba: Image.Image, erase_mask: np.ndarray) -> Image.Image:
    if cv2 is None:
        return rgba
    arr = np.array(rgba)
    bgr = cv2.cvtColor(arr[:, :, :3], cv2.COLOR_RGB2BGR)
    mask_u8 = (erase_mask > 127).astype(np.uint8) * 255
    mask_u8 = cv2.dilate(mask_u8, np.ones((5, 5), np.uint8), iterations=1)
    repaired_bgr = cv2.inpaint(bgr, mask_u8, inpaintRadius=5, flags=cv2.INPAINT_TELEA)
    repaired_rgb = cv2.cvtColor(repaired_bgr, cv2.COLOR_BGR2RGB)
    return Image.fromarray(np.dstack([repaired_rgb, arr[:, :, 3]]), mode="RGBA")

def build_capsule_mask(size, p0: dict, p1: dict, radius_norm: float, stop_ratio: float = 1.0) -> np.ndarray:
    w, h = size
    x0, y0 = p0["x"] * w, p0["y"] * h
    x1 = x0 + (p1["x"] * w - x0) * stop_ratio
    y1 = y0 + (p1["y"] * h - y0) * stop_ratio
    r = max(12, int(radius_norm * w))
    mask = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(mask)
    draw.line([(int(x0), int(y0)), (int(x1), int(y1))], fill=255, width=r * 2)
    draw.ellipse((int(x0 - r), int(y0 - r), int(x0 + r), int(y0 + r)), fill=255)
    draw.ellipse((int(x1 - r), int(y1 - r), int(x1 + r), int(y1 + r)), fill=255)
    return np.array(mask.filter(ImageFilter.GaussianBlur(2)))

def save_masked_layer(rgba: Image.Image, mask: np.ndarray, out_png: Path):
    fg_alpha = np.array(rgba.getchannel("A"))
    combined = Image.fromarray(np.minimum(mask, fg_alpha))
    out = Image.new("RGBA", rgba.size, (0, 0, 0, 0))
    out.paste(rgba, (0, 0), combined)
    out.save(out_png)

def hex_to_hsl(hex_str: str):
    h = hex_str.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4))
    hue, lit, sat = colorsys.rgb_to_hls(r, g, b)
    return hue * 360.0, sat, lit

def inject_3tone_css_recolor_and_namespace(svg_text: str, css_var: str, char_id: str, layer_name: str) -> str:
    prefix = f"{char_id}_{layer_name}_"
    svg_text = re.sub(r'\bid="([^"]+)"', rf'id="{prefix}\1"', svg_text)
    svg_text = re.sub(r'url\(#([^)]+)\)', rf'url(#{prefix}\1)', svg_text)
    fills = re.findall(r'fill="(#[0-9a-fA-F]{6})"', svg_text)
    if not fills:
        return svg_text
    dom_hex, _ = Counter(fills).most_common(1)[0]
    dom_h, dom_s, dom_l = hex_to_hsl(dom_hex)
    for hx in set(fills):
        h_deg, sat, lit = hex_to_hsl(hx)
        hue_diff = min(abs(h_deg - dom_h), 360.0 - abs(h_deg - dom_h))
        if sat > 0.12 and hue_diff <= 22.0:
            delta = lit - dom_l
            if delta > 0.08:
                rep = f"color-mix(in srgb, var({css_var}, {dom_hex}), white {min(45, int(delta * 120))}%)"
            elif delta < -0.08:
                rep = f"color-mix(in srgb, var({css_var}, {dom_hex}), black {min(50, int(-delta * 130))}%)"
            else:
                rep = f"var({css_var}, {dom_hex})"
            svg_text = svg_text.replace(f'fill="{hx}"', f'fill="{rep}"')
    return re.sub(r"<svg ", f'<svg data-yuna-layer="{layer_name}" ', svg_text, count=1)

def vectorize_body_layer(png_path: Path, svg_path: Path, css_var: str, char_id: str, layer_name: str):
    if vtracer is None:
        return "raster", None
    try:
        vtracer.convert_image_to_svg_py(
            str(png_path), str(svg_path),
            colormode="color", hierarchical="cutout", mode="spline",
            filter_speckle=8, color_precision=6, layer_difference=16,
            corner_threshold=60, length_threshold=4.0, max_iterations=10,
            splice_threshold=45, path_precision=3,
        )
        if not svg_path.exists():
            return "raster", None
        raw = svg_path.read_text(encoding="utf-8")
        if svg_path.stat().st_size <= MAX_SVG_BYTES and raw.count("<path") <= MAX_SVG_PATHS:
            clean = inject_3tone_css_recolor_and_namespace(raw, css_var, char_id, layer_name)
            svg_path.write_text(clean, encoding="utf-8")
            return "inline_svg", clean
    except Exception:
        pass
    svg_path.unlink(missing_ok=True)
    return "raster", None

def generate_9_viseme_svgs(layers_dir: Path, lip_hex: str, box: dict, w: int, h: int):
    cx = (box["x"] + box["w"] / 2) * w
    cy = (box["y"] + box["h"] / 2) * h
    rw = max(14.0, box["w"] * w * 0.45)
    rh = max(8.0, box["h"] * h * 0.45)
    shapes = {
        "X": (1.00, 0.14, False), "A": (1.04, 0.18, False), "B": (1.00, 0.42, True),
        "C": (1.08, 0.68, True),  "D": (1.05, 1.00, True),  "E": (0.82, 0.78, True),
        "F": (0.94, 0.34, True),  "G": (0.98, 0.56, True),  "H": (0.68, 0.65, False),
    }
    for code, (sx, sy, teeth) in shapes.items():
        rx, ry = rw * sx, max(2.5, rh * sy)
        teeth_svg = (f'<rect x="{cx - rx * 0.65:.1f}" y="{cy - ry * 0.75:.1f}" width="{rx * 1.3:.1f}" height="{max(2.0, ry * 0.38):.1f}" rx="3" fill="#FFFDF8"/>') if teeth else ""
        svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}"><ellipse cx="{cx:.1f}" cy="{cy:.1f}" rx="{rx:.1f}" ry="{ry:.1f}" fill="#4A1218" stroke="{lip_hex}" stroke-width="5"/>{teeth_svg}</svg>'
        (layers_dir / f"mouth_{code}.svg").write_text(svg, encoding="utf-8")

def generate_prebaked_rim_mask(rgba: Image.Image, out_png: Path):
    alpha = np.array(rgba.getchannel("A"))
    if cv2 is not None:
        eroded = cv2.erode(alpha, np.ones((9, 9), np.uint8), iterations=1)
        rim = cv2.subtract(alpha, eroded)
        rim_blur = cv2.GaussianBlur(rim, (11, 11), 0)
    else:
        rim_blur = alpha
    out = np.dstack([np.full_like(rim_blur, 255), np.full_like(rim_blur, 255), np.full_like(rim_blur, 255), rim_blur])
    Image.fromarray(out, mode="RGBA").save(out_png)

def analyze_and_split(png_path, out_dir):
    out_p = Path(out_dir)
    out_p.mkdir(parents=True, exist_ok=True)
    layers_dir = out_p / "layers"
    layers_dir.mkdir(parents=True, exist_ok=True)
    char_id = out_p.name.lower()

    img = Image.open(png_path).convert("RGBA")
    alpha = np.array(img)[:, :, 3] > 15
    ys, xs = np.where(alpha)
    if len(ys) == 0:
        raise ValueError("Empty transparent PNG")

    y0, y1 = int(ys.min()), int(ys.max()) + 1
    x0, x1 = int(xs.min()), int(xs.max()) + 1
    cropped = img.crop((x0, y0, x1, y1))
    full_path = out_p / "char_full.png"
    cropped.save(full_path)

    c_alpha = np.array(cropped)[:, :, 3] > 15
    H, W = c_alpha.shape
    row_widths = c_alpha.sum(axis=1)
    n_start, n_end = max(1, int(H * 0.18)), min(H - 1, int(H * 0.42))
    neck_y = n_start + int(np.argmin(row_widths[n_start:n_end]))
    hip_y = int(H * 0.65)
    for y in range(int(H * 0.45), int(H * 0.82)):
        if len(count_horizontal_segments(c_alpha[y])) >= 2:
            hip_y = y
            break
    col_density = c_alpha[neck_y:hip_y, :].mean(axis=0)
    core_cols = np.where(col_density > 0.45)[0]
    torso_x0 = int(core_cols.min()) if len(core_cols) > 0 else int(W * 0.25)
    torso_x1 = int(core_cols.max()) + 1 if len(core_cols) > 0 else int(W * 0.75)

    width_ratio = round(W / max(1, H), 3)
    head_ratio = round(neck_y / H, 3)
    torso_ratio = round((hip_y - neck_y) / H, 3)
    leg_ratio = round((H - hip_y) / H, 3)
    if width_ratio >= 0.52:
        body_type, squash_bias, arm_clear = "chubby", 1.22, 1.25
    elif width_ratio >= 0.36:
        body_type, squash_bias, arm_clear = "balanced", 1.00, 1.00
    else:
        body_type, squash_bias, arm_clear = "slim", 0.88, 0.85
    stride_mult = round(max(0.55, min(1.35, leg_ratio / 0.35)), 3)
    cycle_hz_mult = round(max(0.75, min(1.35, 0.35 / max(0.18, leg_ratio))), 3)

    # Legacy v2 crops preserved
    cropped.crop((0, 0, W, neck_y)).save(out_p / "head.png")
    cropped.crop((torso_x0, neck_y, torso_x1, hip_y)).save(out_p / "torso.png")
    if torso_x0 > 4:
        cropped.crop((0, neck_y, torso_x0, hip_y)).save(out_p / "arm_l.png")
    if torso_x1 < W - 4:
        cropped.crop((torso_x1, neck_y, W, hip_y)).save(out_p / "arm_r.png")
    cropped.crop((0, hip_y, W, H)).save(out_p / "legs.png")

    # v3.1 MediaPipe + Inpainting + VTracer + 9 Visemes
    pose_m = Path("models/pose_landmarker_heavy.task")
    face_m = Path("models/face_landmarker.task")
    framing, confidence, fallback_mode = "full_body", 0.0, "silhouette_fallback"
    floor_y = clamp01(0.945)

    pivots = {
        "root_floor": pt(0.5, floor_y), "pelvis": pt(0.5, hip_y / H), "neck_pivot": pt(0.5, neck_y / H),
        "shoulder_l": pt(torso_x0 / W, (neck_y / H) + 0.03), "elbow_l": pt(max(0.08, (torso_x0 / W) - 0.06), (neck_y / H) + 0.16), "wrist_l": pt(max(0.05, (torso_x0 / W) - 0.10), (hip_y / H) - 0.02),
        "shoulder_r": pt(torso_x1 / W, (neck_y / H) + 0.03), "elbow_r": pt(min(0.92, (torso_x1 / W) + 0.06), (neck_y / H) + 0.16), "wrist_r": pt(min(0.95, (torso_x1 / W) + 0.10), (hip_y / H) - 0.02),
    }
    face_boxes = {
        "head_box": {"x": 0.20, "y": 0.02, "w": 0.60, "h": round(max(0.22, neck_y / H), 4)},
        "eye_box": {"x": 0.34, "y": round((neck_y / H) * 0.42, 4), "w": 0.32, "h": 0.07},
        "mouth_box": {"x": 0.40, "y": round((neck_y / H) * 0.68, 4), "w": 0.20, "h": 0.05},
        "jaw_pivot": pt(0.50, (neck_y / H) * 0.64),
    }

    if mp is not None and pose_m.exists() and face_m.exists():
        try:
            mp_img = mp.Image.create_from_file(str(full_path))
            with vision.PoseLandmarker.create_from_options(vision.PoseLandmarkerOptions(base_options=mp_python.BaseOptions(model_asset_path=str(pose_m)), running_mode=vision.RunningMode.IMAGE)) as pdet:
                pres = pdet.detect(mp_img)
            with vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(base_options=mp_python.BaseOptions(model_asset_path=str(face_m)), running_mode=vision.RunningMode.IMAGE, num_faces=1)) as fdet:
                fres = fdet.detect(mp_img)
            if pres.pose_landmarks:
                pl = pres.pose_landmarks[0]
                confidence = round(float(np.mean([pl[i].visibility for i in (11, 12, 13, 14, 23, 24)])), 3)
                if float(np.mean([pl[i].visibility for i in (25, 26, 27, 28)])) < 0.45:
                    framing = "half_body"
                lp = (pl[12], pl[14], pl[16]) if pl[12].x < pl[11].x else (pl[11], pl[13], pl[15])
                rp = (pl[11], pl[13], pl[15]) if pl[12].x < pl[11].x else (pl[12], pl[14], pl[16])
                hl, hr = (pl[24], pl[23]) if pl[24].x < pl[23].x else (pl[23], pl[24])
                pivots = {
                    "root_floor": pt((hl.x + hr.x) / 2, floor_y), "pelvis": pt((hl.x + hr.x) / 2, (hl.y + hr.y) / 2),
                    "neck_pivot": pt((lp[0].x + rp[0].x) / 2, ((lp[0].y + rp[0].y) / 2) - 0.035),
                    "shoulder_l": pt(lp[0].x, lp[0].y), "elbow_l": pt(lp[1].x, lp[1].y), "wrist_l": pt(lp[2].x, lp[2].y),
                    "shoulder_r": pt(rp[0].x, rp[0].y), "elbow_r": pt(rp[1].x, rp[1].y), "wrist_r": pt(rp[2].x, rp[2].y),
                }
                fallback_mode = "none"
            if fres.face_landmarks:
                fl = fres.face_landmarks[0]
                el = bbox_from_indices(fl, LEFT_EYE_IDX, 0.012, 0.012)
                er = bbox_from_indices(fl, RIGHT_EYE_IDX, 0.012, 0.012)
                mouth = bbox_from_indices(fl, MOUTH_IDX, 0.015, 0.012)
                head = bbox_from_indices(fl, HEAD_IDX, 0.06, 0.08)
                face_boxes = {
                    "head_box": head,
                    "eye_box": {"x": round(min(el["x"], er["x"]), 4), "y": round(min(el["y"], er["y"]), 4), "w": round(max(el["x"] + el["w"], er["x"] + er["w"]) - min(el["x"], er["x"]), 4), "h": round(max(el["y"] + el["h"], er["y"] + er["h"]) - min(el["y"], er["y"]), 4)},
                    "mouth_box": mouth,
                    "jaw_pivot": pt(fl[1].x, (fl[1].y + fl[13].y) / 2),
                }
        except Exception as me:
            print("MEDIAPIPE_FALLBACK:", me)

    bones_px = {
        "upper_arm_l": bone_metrics_px(pivots["shoulder_l"], pivots["elbow_l"], W, H),
        "forearm_l":   bone_metrics_px(pivots["elbow_l"],    pivots["wrist_l"], W, H),
        "upper_arm_r": bone_metrics_px(pivots["shoulder_r"], pivots["elbow_r"], W, H),
        "forearm_r":   bone_metrics_px(pivots["elbow_r"],    pivots["wrist_r"], W, H),
    }

    eb, mb, hb = face_boxes["eye_box"], face_boxes["mouth_box"], face_boxes["head_box"]
    eye_m = np.zeros((H, W), dtype=np.uint8)
    eye_m[int(eb["y"]*H):int((eb["y"]+eb["h"])*H), int(eb["x"]*W):int((eb["x"]+eb["w"])*W)] = 255
    mouth_m = np.zeros((H, W), dtype=np.uint8)
    mouth_m[int(mb["y"]*H):int((mb["y"]+mb["h"])*H), int(mb["x"]*W):int((mb["x"]+mb["w"])*W)] = 255
    save_masked_layer(cropped, eye_m, layers_dir / "eyes_open.png")
    head_clean = inpaint_erase_region(cropped, np.maximum(eye_m, mouth_m))
    head_m = np.zeros((H, W), dtype=np.uint8)
    head_m[int(hb["y"]*H):int((hb["y"]+hb["h"])*H), int(hb["x"]*W):int((hb["x"]+hb["w"])*W)] = 255
    save_masked_layer(head_clean, head_m, layers_dir / "head.png")

    bh_m = np.zeros((H, W), dtype=np.uint8)
    bh_m[max(0, int((hb["y"]-0.05)*H)):min(H, int((pivots["neck_pivot"]["y"]+0.08)*H)), max(0, int((hb["x"]-0.05)*W)):min(W, int((hb["x"]+hb["w"]+0.05)*W))] = 255
    save_masked_layer(cropped, bh_m, layers_dir / "back_hair.png")
    generate_prebaked_rim_mask(cropped, layers_dir / "rim_mask.png")

    ua_l_m = build_capsule_mask((W, H), pivots["shoulder_l"], pivots["elbow_l"], 0.055, 1.0)
    fa_l_m = build_capsule_mask((W, H), pivots["elbow_l"], pivots["wrist_l"], 0.045, 0.92)
    ua_r_m = build_capsule_mask((W, H), pivots["shoulder_r"], pivots["elbow_r"], 0.055, 1.0)
    fa_r_m = build_capsule_mask((W, H), pivots["elbow_r"], pivots["wrist_r"], 0.045, 0.92)
    for lm, ln in [(ua_l_m, "upper_arm_l"), (fa_l_m, "forearm_l"), (ua_r_m, "upper_arm_r"), (fa_r_m, "forearm_r")]:
        save_masked_layer(cropped, lm, layers_dir / f"{ln}.png")

    torso_clean = inpaint_erase_region(cropped, np.maximum.reduce([ua_l_m, fa_l_m, ua_r_m, fa_r_m]))
    torso_m = np.zeros((H, W), dtype=np.uint8)
    torso_m[int(pivots["neck_pivot"]["y"]*H):int(pivots["pelvis"]["y"]*H), int(max(0, pivots["shoulder_l"]["x"]-0.04)*W):int(min(1, pivots["shoulder_r"]["x"]+0.04)*W)] = 255
    save_masked_layer(torso_clean, torso_m, layers_dir / "torso.png")

    legs_m = np.zeros((H, W), dtype=np.uint8)
    legs_m[int(pivots["pelvis"]["y"]*H):H, 0:W] = 255
    save_masked_layer(cropped, legs_m, layers_dir / "legs.png")

    generate_9_viseme_svgs(layers_dir, "#B5525C", mb, W, H)

    body_specs = [("legs", "--pant-color", 20, 0.0), ("upper_arm_l", "--shirt-color", 26, 0.25), ("forearm_l", "--shirt-color", 27, 0.28), ("torso", "--shirt-color", 30, 0.20), ("upper_arm_r", "--shirt-color", 50, 0.30), ("forearm_r", "--shirt-color", 51, 0.33)]
    layers_meta = {"back_hair": {"src": "layers/back_hair.png", "type": "raster", "z": 10, "parallax": -0.40}}
    inline_svgs = {}
    for lname, css_var, z, parallax in body_specs:
        ltype, svg_txt = vectorize_body_layer(layers_dir / f"{lname}.png", layers_dir / f"{lname}.svg", css_var, char_id, lname)
        ext = "svg" if ltype == "inline_svg" else "png"
        layers_meta[lname] = {"src": f"layers/{lname}.{ext}", "type": ltype, "z": z, "parallax": parallax, "recolor_var": css_var}
        if svg_txt:
            inline_svgs[lname] = svg_txt
    layers_meta.update({
        "head": {"src": "layers/head.png", "type": "raster", "z": 40, "parallax": 1.00},
        "eyes": {"src": "layers/eyes_open.png", "type": "raster", "z": 45, "parallax": 1.20},
        "rim_mask": {"src": "layers/rim_mask.png", "type": "raster", "z": 60, "parallax": 0.00},
    })
    (out_p / "rig_svgs.json").write_text(json.dumps(inline_svgs), encoding="utf-8")

    rig = {
        "schema_version": "3.1.0",
        "character_id": char_id,
        "rig_tier": "fast_auto_slice",
        "framing": framing,
        "rig_confidence": confidence,
        "fallback_mode": fallback_mode,
        "canvas": {"width": W, "height": H, "floor_y": floor_y, "contact_shadow_rx": 0.19},
        "pivots": pivots,
        "bones_px": bones_px,
        "face_boxes": face_boxes,
        "layers": layers_meta,
        "mouth_visemes": {c: f"layers/mouth_{c}.svg" for c in "ABCDEFGHX"},
        "size": [W, H],
        "neck_y": neck_y, "hip_y": hip_y, "torso_x": [torso_x0, torso_x1],
        "body_profile": {"type": body_type, "width_ratio": width_ratio, "head_ratio": head_ratio, "torso_ratio": torso_ratio, "leg_ratio": leg_ratio},
        "physics_adapt": {"stride_mult": stride_mult, "cycle_hz_mult": cycle_hz_mult, "squash_bias": squash_bias, "arm_clearance": arm_clear},
        "mouth_box": mb, "eye_box": eb,
        "parts": {"head": "head.png", "torso": "torso.png", "arm_l": "arm_l.png", "arm_r": "arm_r.png", "legs": "legs.png"},
    }
    (out_p / "char_rig.json").write_text(json.dumps(rig, indent=2), encoding="utf-8")
    print(f"AUTO_RIG_V31_OK: {out_dir} ({framing}, conf={confidence})")
    return rig

if __name__ == "__main__":
    if len(sys.argv) >= 3 and not sys.argv[1].startswith("--"):
        analyze_and_split(sys.argv[1], sys.argv[2])
    else:
        ap = argparse.ArgumentParser()
        ap.add_argument("--input", required=True)
        ap.add_argument("--out", required=True)
        args = ap.parse_args()
        analyze_and_split(args.input, args.out)
