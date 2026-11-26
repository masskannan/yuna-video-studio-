import json, os, subprocess, torch
from pathlib import Path
from diffusers import AutoPipelineForText2Image

print("CUDA Available:", torch.cuda.is_available(), "| Device:", torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU")

# 1. Clone latest YUNA Studio project & install edge-tts
subprocess.run(["git", "clone", "--depth", "1", "https://github.com/masskannan/yuna-video-studio-.git", "/kaggle/working/studio"], check=True)
os.chdir("/kaggle/working/studio")
subprocess.run(["pip", "install", "-q", "edge-tts"], check=True)

# 2. Generate Multi-Voice Master Audio + SRT
subprocess.run(["python3", "scripts/generate_voice.py"], check=True)

# 3. Generate Realistic 2D/3D Scene Art on T4 GPU using SDXL-Turbo
tl = json.loads(Path("timeline.json").read_text(encoding="utf-8"))
scenes = tl.get("scenes") or [{"part": 1, "heading": "YUNA Studio", "setting": "tea_shop", "time_of_day": "sunset"}]

pipe = AutoPipelineForText2Image.from_pretrained("stabilityai/sdxl-turbo", torch_dtype=torch.float16, variant="fp16").to("cuda")
os.makedirs("/kaggle/working/scenes", exist_ok=True)
img_clips = []

for i, sc in enumerate(scenes):
    st = float(sc.get("start_sec", i * 12))
    en = float(sc.get("end_sec", st + 12))
    dur = max(4.0, en - st)
    prompt = f"Pixar 3D and stylized 2D cinematic animation frame, {sc.get('setting','tea_shop').replace('_',' ')}, {sc.get('time_of_day','sunset')} lighting, {sc.get('heading','tech story')}, ultra detailed, vibrant colors, no text, no watermark"
    img = pipe(prompt=prompt, num_inference_steps=4, guidance_scale=0.0, width=576, height=1024).images[0]
    p_img = f"/kaggle/working/scenes/scene_{i}.png"
    img.save(p_img)
    p_clip = f"/kaggle/working/scenes/clip_{i}.mp4"
    frames = int(dur * 30)
    subprocess.run([
        "ffmpeg", "-y", "-loop", "1", "-i", p_img,
        "-vf", f"scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='min(zoom+0.0012,1.15)':d={frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30",
        "-t", f"{dur:.2f}", "-c:v", "libx264", "-pix_fmt", "yuv420p", p_clip
    ], check=True)
    img_clips.append(p_clip)

# 4. Concat Clips + Mux Master Audio + Burn Bold Captions
concat_f = "/kaggle/working/scenes/concat.txt"
Path(concat_f).write_text("\n".join(f"file '{c}'" for c in img_clips) + "\n")
raw_vid = "/kaggle/working/raw_gpu.mp4"
subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", concat_f, "-c", "copy", raw_vid], check=True)

aud = "chunks/master-audio/master_audio.mp3"
srt = "chunks/master-audio/captions.srt"
adur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", aud]).decode().strip())
out_mp4 = "/kaggle/working/yuna_gpu_reel.mp4"
sub_filter = f"subtitles={srt}:force_style='FontName=Noto Sans Tamil,FontSize=18,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2.5,Shadow=1,MarginV=75'" if os.path.exists(srt) else "null"

subprocess.run([
    "ffmpeg", "-y", "-i", raw_vid, "-i", aud,
    "-vf", sub_filter, "-af", f"apad=whole_dur={adur:.2f}",
    "-t", f"{adur:.2f}", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
    "-c:a", "aac", "-b:a", "192k", out_mp4
], check=True)
print("KAGGLE_GPU_VIDEO_READY:", out_mp4)
