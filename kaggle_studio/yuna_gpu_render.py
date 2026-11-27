import json, os, shutil, subprocess, time, torch, urllib.request
from pathlib import Path
from PIL import Image, ImageDraw

has_gpu = torch.cuda.is_available()
print("CUDA:", has_gpu, "| Count:", torch.cuda.device_count() if has_gpu else 0)

try:
    urllib.request.urlopen("https://github.com", timeout=10)
except Exception as net_e:
    raise RuntimeError(f"KAGGLE_INTERNET_OFF: {net_e}")

for attempt in range(3):
    shutil.rmtree("/kaggle/working/studio", ignore_errors=True)
    r = subprocess.run(["git", "clone", "--depth", "1", "https://github.com/masskannan/yuna-video-studio-.git", "/kaggle/working/studio"])
    if r.returncode == 0:
        break
    time.sleep(2)
else:
    raise RuntimeError("git clone failed")

os.chdir("/kaggle/working/studio")
subprocess.run(["bash", "-c", "apt-get -qq update || true; apt-get -qq install -y fonts-lohit-taml ffmpeg || true"], check=True)
subprocess.run(["pip", "install", "-q", "edge-tts"], check=True)

subprocess.run(["python3", "scripts/generate_voice.py"], check=True)
aud = "chunks/master-audio/master_audio.mp3"
srt = "chunks/master-audio/captions.srt"
adur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", aud]).decode().strip())
print("AUDIO_DUR:", round(adur, 2))

shots = []
if os.path.exists("shot_list.json"):
    shots = json.load(open("shot_list.json", encoding="utf-8")).get("shots", [])
if not shots:
    shots = [{"location": "village_street", "tool": "remotion"}, {"location": "tea_shop", "tool": "remotion"}, {"location": "house_room", "tool": "remotion"}]

# 1. Conditional SDXL-Turbo (0s cache hit if bg_<loc>.jpg already in public/approved/)
out_dir = Path("/kaggle/working/out_assets")
out_dir.mkdir(parents=True, exist_ok=True)
req_locs = []
for s in shots:
    loc = str(s.get("location", "village_street"))
    if loc not in req_locs:
        req_locs.append(loc)

missing_locs = [loc for loc in req_locs if not os.path.exists(f"public/approved/bg_{loc}.jpg")]
print("LOC_CACHE_HIT:", [l for l in req_locs if l not in missing_locs], "| NEED_SDXL:", missing_locs)

pipe = None
if has_gpu and missing_locs:
    try:
        from diffusers import AutoPipelineForText2Image
        pipe = AutoPipelineForText2Image.from_pretrained("stabilityai/sdxl-turbo", torch_dtype=torch.float16, variant="fp16")
        pipe.to("cuda:0")
        pipe.enable_attention_slicing()
    except Exception as e:
        print("SDXL_FALLBACK_PIL:", e)
        pipe = None

loc_map = {}
for idx, loc in enumerate(req_locs):
    cached = f"public/approved/bg_{loc}.jpg"
    if os.path.exists(cached):
        loc_map[loc] = cached
        continue
    gen_p = out_dir / f"bg_{loc}.jpg"
    if pipe is not None:
        try:
            prompt = f"cinematic stylized 2d animation background, {loc.replace('_', ' ')}, South Indian atmosphere, warm lighting, no text, high detail"
            pipe(prompt=prompt, num_inference_steps=4, guidance_scale=0.0, width=576, height=1024).images[0].save(gen_p, "JPEG", quality=92)
            torch.cuda.empty_cache()
        except Exception as ge:
            print("SDXL_GEN_ERR:", ge)
    if not gen_p.exists():
        im = Image.new("RGB", (576, 1024), (20 + idx * 12, 28 + idx * 10, 50))
        ImageDraw.Draw(im).rectangle([40, 80, 536, 944], outline=(245, 196, 81), width=4)
        im.save(gen_p, "JPEG", quality=90)
    loc_map[loc] = str(gen_p)

if pipe is not None:
    del pipe
    if has_gpu:
        torch.cuda.empty_cache()

# 2. Conditional Blender CUDA (only if any shot has tool == 'blender')
has_blender = any(str(s.get("tool", "")).lower() == "blender" for s in shots)
blender_clip = "/kaggle/working/blender_3d.mp4"
if has_blender and os.path.exists("scenes/blender_scene.py"):
    print("BLENDER_REQUESTED: installing & running...")
    subprocess.run(["bash", "-c", "apt-get -qq install -y blender || true"], check=False)
    br = subprocess.run(["blender", "-b", "--python", "scenes/blender_scene.py", "--", "--out", blender_clip], capture_output=True)
    if br.returncode != 0 or not os.path.exists(blender_clip):
        print("BLENDER_FALLBACK_TO_PRESET")
        blender_clip = ""
else:
    print("BLENDER_SKIPPED: no blender shots (0s)")
    blender_clip = ""

# 3. Multi-scene NVENC render
seg_dur = max(1.5, adur / max(1, len(shots)))
seg_dir = Path("/kaggle/working/segs")
seg_dir.mkdir(parents=True, exist_ok=True)
vcodec = "h264_nvenc" if has_gpu else "libx264"

concat_lines = []
for i, s in enumerate(shots):
    seg_mp4 = seg_dir / f"seg_{i:03d}.mp4"
    if str(s.get("tool", "")).lower() == "blender" and blender_clip and os.path.exists(blender_clip):
        subprocess.run(["ffmpeg", "-y", "-i", blender_clip, "-t", f"{seg_dur:.2f}", "-vf", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,format=yuv420p", "-c:v", vcodec, str(seg_mp4)], check=False)
    if not seg_mp4.exists() or seg_mp4.stat().st_size < 1000:
        bg = loc_map.get(str(s.get("location", "village_street")), "public/approved/bg_village_street.jpg")
        zoom_expr = "min(zoom+0.0012,1.12)" if i % 2 == 0 else "if(eq(on,1),1.12,max(zoom-0.0012,1.0))"
        vf = f"scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='{zoom_expr}':d={int(seg_dur*30)}:s=1080x1920:fps=30,format=yuv420p"
        cmd = ["ffmpeg", "-y", "-i", bg, "-vf", vf, "-t", f"{seg_dur:.2f}", "-c:v", vcodec, str(seg_mp4)]
        res = subprocess.run(cmd, capture_output=True)
        if res.returncode != 0 and vcodec != "libx264":
            cmd[cmd.index("h264_nvenc")] = "libx264"
            subprocess.run(cmd, check=True)
    concat_lines.append(f"file '{seg_mp4}'\n")

concat_txt = seg_dir / "concat.txt"
concat_txt.write_text("".join(concat_lines))
merged_v = "/kaggle/working/merged_video.mp4"
subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(concat_txt), "-c", "copy", merged_v], check=True)

final_mp4 = "/kaggle/working/final_kaggle_hybrid.mp4"
sub_vf = "null"
if os.path.exists(srt) and os.path.getsize(srt) > 10:
    sub_vf = f"subtitles={srt}:force_style='FontName=Noto Sans Tamil,FontSize=15,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,Alignment=2,MarginV=120'"
fcmd = ["ffmpeg", "-y", "-i", merged_v, "-i", aud, "-vf", sub_vf, "-c:v", vcodec, "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-shortest", final_mp4]
fres = subprocess.run(fcmd, capture_output=True)
if fres.returncode != 0 and vcodec != "libx264":
    fcmd[fcmd.index("h264_nvenc")] = "libx264"
    subprocess.run(fcmd, check=True)
print("FINAL_KAGGLE_HYBRID_OK:", os.path.exists(final_mp4), os.path.getsize(final_mp4))
