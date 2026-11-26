import json, os, shutil, subprocess, time, torch, urllib.request
from pathlib import Path
from PIL import Image, ImageDraw

has_gpu = torch.cuda.is_available()
print("CUDA:", has_gpu, "| Device:", torch.cuda.get_device_name(0) if has_gpu else "CPU")

# Scenario 1: Internet & Git Clone 3x Retry
try:
    urllib.request.urlopen("https://github.com", timeout=10)
except Exception as net_e:
    raise RuntimeError(f"KAGGLE_INTERNET_OFF (Verify phone in kaggle.com/settings): {net_e}")

for attempt in range(3):
    shutil.rmtree("/kaggle/working/studio", ignore_errors=True)
    r = subprocess.run(["git", "clone", "--depth", "1", "https://github.com/masskannan/yuna-video-studio-.git", "/kaggle/working/studio"])
    if r.returncode == 0:
        break
    time.sleep(2)
else:
    raise RuntimeError("git clone failed after 3 attempts")

os.chdir("/kaggle/working/studio")
subprocess.run(["bash", "-c", "apt-get -qq update && apt-get -qq install -y fonts-noto-core fonts-lohit-taml ffmpeg"], check=True)
subprocess.run(["pip", "install", "-q", "edge-tts"], check=True)

# 2. Generate Multi-Voice Master Audio + SRT
subprocess.run(["python3", "scripts/generate_voice.py"], check=True)
aud = "chunks/master-audio/master_audio.mp3"
srt = "chunks/master-audio/captions.srt"
adur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", aud]).decode().strip())

# Scenario 2 & 3: Safe GPU SDXL-Turbo load with CPU/PIL fallback
pipe = None
if has_gpu:
    from diffusers import AutoPipelineForText2Image
    for kw in ({"torch_dtype": torch.float16, "variant": "fp16"}, {"torch_dtype": torch.float16}):
        try:
            pipe = AutoPipelineForText2Image.from_pretrained("stabilityai/sdxl-turbo", **kw).to("cuda")
            pipe.enable_attention_slicing()
            break
        except Exception as e:
            print("SDXL load retry:", e)

# Scenario 4: Match Scene Durations to Master Audio Duration (zero cut-off)
tl = json.loads(Path("timeline.json").read_text(encoding="utf-8"))
scenes = tl.get("scenes") or [{"part": 1, "heading": "YUNA Studio", "setting": "tea_shop", "time_of_day": "sunset"}]
raw_durs = [max(4.0, float(sc.get("end_sec", (i + 1) * 12)) - float(sc.get("start_sec", i * 12))) for i, sc in enumerate(scenes)]
scale_f = (adur + 0.5) / max(1.0, sum(raw_durs))

os.makedirs("/kaggle/working/scenes", exist_ok=True)
img_clips = []
for i, sc in enumerate(scenes):
    dur = raw_durs[i] * scale_f
    p_img = f"/kaggle/working/scenes/scene_{i}.png"
    if pipe is not None:
        prompt = f"Pixar 3D and stylized 2D cinematic animation frame, {sc.get('setting','tea_shop').replace('_',' ')}, {sc.get('time_of_day','sunset')} lighting, {sc.get('heading','tech story')}, ultra detailed, vibrant colors, no text, no watermark"
        img = pipe(prompt=prompt, num_inference_steps=4, guidance_scale=0.0, width=576, height=1024).images[0]
        img.save(p_img)
    else:
        im = Image.new("RGB", (576, 1024), (15, 23, 42))
        dr = ImageDraw.Draw(im)
        dr.ellipse([90, 140, 486, 536], fill=(56, 189, 248))
        im.save(p_img)
    p_clip = f"/kaggle/working/scenes/clip_{i}.mp4"
    frames = max(30, int(dur * 30))
    subprocess.run([
        "ffmpeg", "-y", "-loop", "1", "-i", p_img,
        "-vf", f"scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,zoompan=z='min(zoom+0.0012,1.15)':d={frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30",
        "-t", f"{dur:.2f}", "-r", "30", "-c:v", "libx264", "-pix_fmt", "yuv420p", p_clip
    ], check=True)
    img_clips.append(p_clip)

# Scenario 5: Safe Concat + /tmp/cap.srt Subtitle Burn
concat_f = "/kaggle/working/scenes/concat.txt"
Path(concat_f).write_text("\n".join(f"file '{c}'" for c in img_clips) + "\n")
raw_vid = "/kaggle/working/raw_gpu.mp4"
subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", concat_f, "-c", "copy", raw_vid], check=True)

out_mp4 = "/kaggle/working/yuna_gpu_reel.mp4"
vf = "null"
if os.path.exists(srt) and os.path.getsize(srt) > 10:
    shutil.copy2(srt, "/tmp/cap.srt")
    vf = "subtitles=/tmp/cap.srt:force_style='FontName=Noto Sans Tamil,FontSize=18,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2.5,Shadow=1,MarginV=75'"

subprocess.run([
    "ffmpeg", "-y", "-i", raw_vid, "-i", aud,
    "-vf", vf, "-af", f"apad=whole_dur={adur:.2f}",
    "-t", f"{adur:.2f}", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
    "-c:a", "aac", "-b:a", "192k", out_mp4
], check=True)
print("KAGGLE_GPU_VIDEO_READY:", out_mp4)
