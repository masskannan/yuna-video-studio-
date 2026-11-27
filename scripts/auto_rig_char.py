import os, sys, json
import numpy as np
from PIL import Image

def count_horizontal_segments(row_mask):
    padded = np.concatenate(([False], row_mask, [False]))
    starts = np.where(~padded[:-1] & padded[1:])[0]
    ends = np.where(padded[:-1] & ~padded[1:])[0]
    return [(int(s), int(e)) for s, e in zip(starts, ends) if (e - s) >= 3]

def analyze_and_split(png_path, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    img = Image.open(png_path).convert("RGBA")
    alpha = np.array(img)[:, :, 3] > 15
    ys, xs = np.where(alpha)
    if len(ys) == 0:
        raise ValueError("Empty transparent PNG")

    y0, y1 = int(ys.min()), int(ys.max()) + 1
    x0, x1 = int(xs.min()), int(xs.max()) + 1
    cropped = img.crop((x0, y0, x1, y1))
    cropped.save(os.path.join(out_dir, "char_full.png"))

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

    cropped.crop((0, 0, W, neck_y)).save(os.path.join(out_dir, "head.png"))
    cropped.crop((torso_x0, neck_y, torso_x1, hip_y)).save(os.path.join(out_dir, "torso.png"))
    if torso_x0 > 4:
        cropped.crop((0, neck_y, torso_x0, hip_y)).save(os.path.join(out_dir, "arm_l.png"))
    if (W - torso_x1) > 4:
        cropped.crop((torso_x1, neck_y, W, hip_y)).save(os.path.join(out_dir, "arm_r.png"))
    cropped.crop((0, hip_y, W, H)).save(os.path.join(out_dir, "legs.png"))

    rig = {
        "source_size": [img.width, img.height],
        "cropped_size": [W, H],
        "body_profile": {"type": body_type, "width_ratio": width_ratio, "head_ratio": head_ratio, "torso_ratio": torso_ratio, "leg_ratio": leg_ratio},
        "physics_adapt": {"squash_bias": squash_bias, "arm_clearance_mult": arm_clear, "stride_px_mult": stride_mult, "cycle_hz_mult": cycle_hz_mult},
        "anchors_norm": {
            "neck_y": head_ratio,
            "hip_y": round(hip_y / H, 3),
            "torso_x": [round(torso_x0 / W, 3), round(torso_x1 / W, 3)],
            "shoulder_l": [round(torso_x0 / W, 3), round((neck_y + (hip_y - neck_y) * 0.12) / H, 3)],
            "shoulder_r": [round(torso_x1 / W, 3), round((neck_y + (hip_y - neck_y) * 0.12) / H, 3)],
            "mouth_box": [0.38, round((neck_y * 0.65) / H, 3), 0.24, round((neck_y * 0.18) / H, 3)],
            "eye_box": [0.30, round((neck_y * 0.40) / H, 3), 0.40, round((neck_y * 0.18) / H, 3)],
            "foot_center": [0.50, 1.00]
        }
    }
    with open(os.path.join(out_dir, "char_rig.json"), "w", encoding="utf-8") as f:
        json.dump(rig, f, indent=2)
    return rig

if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(1)
    res = analyze_and_split(sys.argv[1], sys.argv[2])
    print("AUTO_RIG_OK:", json.dumps(res["body_profile"]), json.dumps(res["physics_adapt"]))
