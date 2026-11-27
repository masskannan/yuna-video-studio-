import json, os, shutil, subprocess, time, torch, urllib.request
from pathlib import Path
from PIL import Image, ImageDraw

has_gpu = torch.cuda.is_available()
gpu_count = torch.cuda.device_count() if has_gpu else 0
print("CUDA:", has_gpu, "| Count:", gpu_count, "| Dev0:", torch.cuda.get_device_name(0) if has_gpu else "CPU")

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

subprocess.run(["python3", "scripts/generate_voice.py"], check=True)
aud = "chunks/master-audio/master_audio.mp3"
srt = "chunks/master-audio/captions.srt"
adur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", aud]).decode().strip())
print("AUDIO_DUR:", round(adur, 2))

manifest = json.load(open("assets_manifest.json")) if os.path.exists("assets_manifest.json") else {}
approved = set(manifest.get("approved_gpu_assets", {}).keys())
bgs = manifest.get("backgrounds", ["village_street", "tea_shop", "house_room"])
missing_bgs = [b for b in bgs if f"bg_{b}" not in approved and not os.path.exists(f"assets/approved/bg_{b}.jpg")][:3]
print("DELTA_MISSING_BGS:", missing_bgs)

out_dir = Path("/kaggle/working/out_assets")
out_dir.mkdir(parents=True, exist_ok=True)

pipe = None
if has_gpu and missing_bgs:
    try:
        from diffusers import AutoPipelineForText2Image
        pipe = AutoPipelineForText2Image.from_pretrained("stabilityai/sdxl-turbo", torch_dtype=torch.float16, variant="fp16")
        pipe.to("cuda:0")
        pipe.enable_attention_slicing()
        print("SDXL_TURBO_LOADED_ON_CUDA0")
    except Exception as e:
        print("SDXL_LOAD_FALLBACK_TO_PIL:", e)
        pipe = None

generated = []
for idx, bg in enumerate(missing_bgs or ["default_scene"]):
    out_img = out_dir / f"bg_{bg}.jpg"
    if pipe is not None:
        try:
            prompt = f"cinematic stylized 2d animation background, {bg.replace('_', ' ')}, South Indian village atmosphere, warm lighting, clean composition, no text, high detail"
            img = pipe(prompt=prompt, num_inference_steps=4, guidance_scale=0.0, width=576, height=1024).images[0]
            img.save(out_img, "JPEG", quality=92)
            torch.cuda.empty_cache()
        except Exception as ge:
            print("SDXL_GEN_ERR_PIL_FALLBACK:", ge)
            pipe = None
    if not out_img.exists():
        im = Image.new("RGB", (576, 1024), (18 + idx * 12, 26 + idx * 10, 48))
        dr = ImageDraw.Draw(im)
        dr.rectangle([40, 80, 536, 944], outline=(245, 196, 81), width=4)
        im.save(out_img, "JPEG", quality=90)
    generated.append((bg, str(out_img)))

del pipe
if has_gpu:
    torch.cuda.empty_cache()

preview_mp4 = "/kaggle/working/final_kaggle_preview.mp4"
first_img = generated[0][1]
vcodec = "h264_nvenc" if has_gpu else "libx264"
vf = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920"
if os.path.exists(srt) and os.path.getsize(srt) > 10:
    vf += f",subtitles={srt}:force_style='FontName=Noto Sans Tamil,FontSize=14,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,Alignment=2,MarginV=120'"
cmd = ["ffmpeg", "-y", "-loop", "1", "-i", first_img, "-i", aud, "-vf", vf, "-c:v", vcodec, "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-shortest", preview_mp4]
r = subprocess.run(cmd)
if r.returncode != 0 and vcodec != "libx264":
    cmd[cmd.index("h264_nvenc")] = "libx264"
    subprocess.run(cmd, check=True)
print("PREVIEW_MP4_OK:", os.path.exists(preview_mp4))

tg_tok, tg_chat = "", "5819971947"
try:
    from kaggle_secrets import UserSecretsClient
    us = UserSecretsClient()
    tg_tok = us.get_secret("TG_BOT_TOKEN")
except Exception:
    tg_tok = ""

if tg_tok:
    for bg, img_path in generated:
        key = f"bg_{bg}"[:40]
        kb = json.dumps({"inline_keyboard": [
            [{"text": "✅ Approve to Library", "callback_data": f"gpu_app:{key}"}],
            [{"text": "🔄 Regenerate", "callback_data": f"gpu_reg:{key}"}, {"text": "❌ Skip", "callback_data": f"gpu_skip:{key}"}]
        ]})
        boundary = "----YunaBoundary7MA4YWxkTrZu0gW"
        data = open(img_path, "rb").read()
        parts = []
        for name, val in [("chat_id", tg_chat), ("caption", f"🎨 Kaggle T4 Asset: {bg}"), ("reply_markup", kb)]:
            parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"\r\n\r\n{val}\r\n".encode())
        parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"photo\"; filename=\"{key}.jpg\"\r\nContent-Type: image/jpeg\r\n\r\n".encode() + data + b"\r\n")
        parts.append(f"--{boundary}--\r\n".encode())
        body = b"".join(parts)
        req = urllib.request.Request(f"https://api.telegram.org/bot{tg_tok}/sendPhoto", data=body, headers={"Content-Type": f"multipart/form-data; boundary={boundary}"})
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                print("TG_PHOTO_SENT:", bg, resp.status)
        except Exception as te:
            print("TG_PHOTO_ERR:", bg, te)
