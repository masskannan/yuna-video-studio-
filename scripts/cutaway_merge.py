import glob, json, os, shutil, subprocess

REEL = "chunks/chunk-reel/reel_9x16.mp4"
if not os.path.exists(REEL):
    print("CUTAWAY_SKIP: no reel_9x16.mp4")
    raise SystemExit(0)

manim_clips = sorted(glob.glob("chunks/**/*manim*.mp4", recursive=True))
blender_clips = sorted(glob.glob("chunks/**/*blender*.mp4", recursive=True) + glob.glob("chunks/**/*blender*.mkv", recursive=True))
if not manim_clips and not blender_clips:
    print("CUTAWAY_SKIP: no pro clips in chunks/ (pure Remotion)")
    raise SystemExit(0)

shots = []
if os.path.exists("shot_list.json"):
    shots = json.load(open("shot_list.json", encoding="utf-8")).get("shots", [])
if not shots:
    print("CUTAWAY_SKIP: no shot_list.json")
    raise SystemExit(0)

vdur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", REEL]).decode().strip() or "30")
tot_w = sum(max(1.0, float(s.get("duration_s", 5))) for s in shots)

manim_win, blender_win = [], []
cur = 0.0
for s in shots:
    d = vdur * (max(1.0, float(s.get("duration_s", 5))) / tot_w)
    t = str(s.get("tool", "remotion")).lower()
    if t == "manim" and manim_clips:
        manim_win.append((cur, cur + d))
    elif t == "blender" and blender_clips:
        blender_win.append((cur, cur + d))
    cur += d

if not manim_win and not blender_win:
    print("CUTAWAY_SKIP: no matching manim/blender shot windows")
    raise SystemExit(0)

inputs = ["-i", REEL]
fchains = []
last_v = "[0:v]"
idx = 1

for wins, clip in [(manim_win, manim_clips[0] if manim_clips else None), (blender_win, blender_clips[0] if blender_clips else None)]:
    if not wins or not clip:
        continue
    inputs += ["-stream_loop", "-1", "-i", clip]
    cond = "+".join([f"between(t,{a:.2f},{b:.2f})" for a, b in wins])
    fchains.append(f"[{idx}:v]scale=-2:1120,setsar=1,format=yuv420p,pad=iw+16:ih+16:8:8:color=0x06B6D4,pad=iw+8:ih+8:4:4:color=0x0F172A[ov{idx}]")
    fchains.append(f"{last_v}[ov{idx}]overlay=(W-w)/2:240:enable='{cond}'[v{idx}]")
    last_v = f"[v{idx}]"
    idx += 1

tmp_out = REEL + ".cutaway.mp4"
cmd = ["ffmpeg", "-y"] + inputs + ["-filter_complex", ";".join(fchains), "-map", last_v, "-t", f"{vdur:.2f}", "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p", tmp_out]
r = subprocess.run(cmd, capture_output=True, text=True)
if r.returncode == 0 and os.path.exists(tmp_out) and os.path.getsize(tmp_out) > 10000:
    shutil.move(tmp_out, REEL)
    print(f"CUTAWAY_MERGE_OK: manim={len(manim_win)} blender={len(blender_win)}")
else:
    print("CUTAWAY_FALLBACK_SAFE:", r.stderr[-250:])
    if os.path.exists(tmp_out):
        os.remove(tmp_out)
