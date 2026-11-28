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

# 4. REMBG_CHAR_CUTOUT: Conditional Transparent PNG Cutouts for assets/raw_chars/*
raw_chars_dir = Path("assets/raw_chars")
if raw_chars_dir.exists():
    raw_imgs = [p for p in raw_chars_dir.iterdir() if p.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp")]
    need_cut = [p for p in raw_imgs if not Path(f"public/approved/chars/{p.stem}.png").exists()]
    if need_cut:
        subprocess.run(["pip", "install", "-q", "rembg", "onnxruntime"], check=False)
        try:
            from rembg import remove, new_session
            sess = new_session("isnet-anime")
            out_c = Path("/kaggle/working/out_chars")
            out_c.mkdir(parents=True, exist_ok=True)
            for p in need_cut:
                res_bytes = remove(p.read_bytes(), session=sess, alpha_matting=False, post_process_mask=True)
                (out_c / f"{p.stem}.png").write_bytes(res_bytes)
                print("REMBG_CUTOUT_OK:", p.stem)
        except Exception as re_e:
            print("REMBG_SKIP:", re_e)


# 5. TRIPOSR_3D_MESH: Auto .glb 3D Model generation when shot_list uses blender + custom char exists
try:
    sl_data = json.loads(Path("shot_list.json").read_text(encoding="utf-8")) if Path("shot_list.json").exists() else {}
    has_3d_shot = any(s.get("tool") == "blender" for s in sl_data.get("shots", []))
except Exception:
    has_3d_shot = False

if has_3d_shot:
    for fp in Path("public/approved/chars").glob("*/front.png"):
        cname = fp.parent.name
        out_3d = Path(f"/kaggle/working/out_chars/{cname}_3d")
        if not out_3d.exists() and not (fp.parent / "model.glb").exists():
            try:
                if not Path("/kaggle/working/TripoSR").exists():
                    subprocess.run(["git", "clone", "-q", "https://github.com/VAST-AI-Research/TripoSR.git", "/kaggle/working/TripoSR"], check=True)
                    subprocess.run(["pip", "install", "-q", "-r", "/kaggle/working/TripoSR/requirements.txt"], check=False)
                subprocess.run(["python3", "/kaggle/working/TripoSR/run.py", str(fp), "--output-dir", str(out_3d), "--model-save-format", "glb", "--bake-texture"], check=True)
                print("TRIPOSR_3D_OK:", cname)
            except Exception as te:
                print("TRIPOSR_SKIP:", cname, te)


# 6. DEPTH_ANYTHING_V2_BOKEH: One-time DSLR Bokeh pass for public/approved/bg_*.jpg
if has_gpu:
    bokeh_targets = [Path(bp) for bp in loc_map.values() if Path(bp).exists() and not Path(bp).name.endswith("_bokeh.jpg")]
    need_bokeh = [bp for bp in bokeh_targets if not Path(f"public/approved/{bp.stem}_bokeh.jpg").exists()]
    if need_bokeh:
        try:
            from transformers import pipeline as hf_pipe
            from PIL import ImageFilter
            import numpy as np
            depth_est = hf_pipe("depth-estimation", model="depth-anything/Depth-Anything-V2-Small-hf", device=0)
            out_bk = Path("/kaggle/working/out_bokeh")
            out_bk.mkdir(parents=True, exist_ok=True)
            for bp in need_bokeh:
                im = Image.open(bp).convert("RGB")
                d_im = depth_est(im)["depth"].resize(im.size)
                d_arr = np.array(d_im, dtype=np.float32) / 255.0
                blur_im = im.filter(ImageFilter.GaussianBlur(radius=8))
                fg = np.array(im, dtype=np.float32)
                bg_b = np.array(blur_im, dtype=np.float32)
                alpha = np.clip(d_arr, 0.0, 1.0)[..., None]
                comp = (fg * alpha + bg_b * (1.0 - alpha)).astype(np.uint8)
                Image.fromarray(comp).save(out_bk / f"{bp.stem}_bokeh.jpg", "JPEG", quality=92)
                print("BOKEH_OK:", bp.stem)
            del depth_est
            torch.cuda.empty_cache()
        except Exception as bk_e:
            print("BOKEH_SKIP:", bk_e)

# 7. MUSICGEN_3MOOD_BGM: One-time 3-mood royalty-free BGM pack (upbeat, tech, suspense)
bgm_moods = {
    "upbeat": "energetic upbeat lo-fi electronic Tamil tech vlog background beat, crisp drums, clean synth, no vocals",
    "tech": "modern futuristic clean tech explainer ambient electronic pulse, subtle bass, no vocals",
    "suspense": "cinematic tense mystery investigative documentary pulse, deep sub bass, no vocals",
}
need_bgm = {k: v for k, v in bgm_moods.items() if not Path(f"assets/audio/bgm_{k}.mp3").exists()}
if has_gpu and need_bgm:
    try:
        from transformers import AutoProcessor, MusicgenForConditionalGeneration
        import scipy.io.wavfile as wavfile
        proc = AutoProcessor.from_pretrained("facebook/musicgen-small")
        mg = MusicgenForConditionalGeneration.from_pretrained("facebook/musicgen-small").to("cuda:0")
        out_au = Path("/kaggle/working/out_audio")
        out_au.mkdir(parents=True, exist_ok=True)
        for mk, mp in need_bgm.items():
            inp = proc(text=[mp], padding=True, return_tensors="pt").to("cuda:0")
            audio_vals = mg.generate(**inp, max_new_tokens=512)
            sr = mg.config.audio_encoder.sampling_rate
            w_tmp = out_au / f"bgm_{mk}.wav"
            wavfile.write(str(w_tmp), rate=sr, data=audio_vals[0, 0].cpu().numpy())
            subprocess.run(["ffmpeg", "-y", "-i", str(w_tmp), "-b:a", "192k", str(out_au / f"bgm_{mk}.mp3")], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            w_tmp.unlink(missing_ok=True)
            print("MUSICGEN_BGM_OK:", mk)
        del mg
        torch.cuda.empty_cache()
    except Exception as mg_e:
        print("MUSICGEN_SKIP:", mg_e)


# 8. OPTIONAL_GITHUB_SYNC: Auto-commit bgm_*.mp3 & bg_*_bokeh.jpg if GH_TOKEN is in Kaggle Secrets
try:
    import base64
    gh_tok = os.environ.get("GH_TOKEN", "")
    if not gh_tok:
        try:
            from kaggle_secrets import UserSecretsClient
            gh_tok = UserSecretsClient().get_secret("GH_TOKEN") or ""
        except Exception:
            gh_tok = ""
    if gh_tok:
        def gh_put(repo_path, data_bytes, msg):
            api = f"https://api.github.com/repos/masskannan/yuna-video-studio-/contents/{repo_path}"
            hdr = {"Authorization": f"Bearer {gh_tok}", "Accept": "application/vnd.github+json", "User-Agent": "YunaKaggle"}
            sha = None
            try:
                meta = json.loads(urllib.request.urlopen(urllib.request.Request(api + "?ref=main", headers=hdr)).read())
                sha = meta.get("sha")
            except Exception:
                pass
            body = {"message": msg, "content": base64.b64encode(data_bytes).decode(), "branch": "main"}
            if sha:
                body["sha"] = sha
            urllib.request.urlopen(urllib.request.Request(api, data=json.dumps(body).encode(), headers={**hdr, "Content-Type": "application/json"}, method="PUT"))
            print("GH_SYNC_OK:", repo_path)

        for mp in sorted(Path("/kaggle/working/out_audio").glob("bgm_*.mp3")) if Path("/kaggle/working/out_audio").exists() else []:
            gh_put(f"assets/audio/{mp.name}", mp.read_bytes(), f"feat(audio): MusicGen {mp.name} [skip ci]")
        bg_man = json.loads(Path("src/bg_manifest.json").read_text(encoding="utf-8")) if Path("src/bg_manifest.json").exists() else {}
        changed_bm = False
        for bp in sorted(Path("/kaggle/working/out_bokeh").glob("bg_*_bokeh.jpg")) if Path("/kaggle/working/out_bokeh").exists() else []:
            gh_put(f"public/approved/{bp.name}", bp.read_bytes(), f"feat(bokeh): {bp.name} [skip ci]")
            loc_key = bp.stem.replace("bg_", "", 1).replace("_bokeh", "")
            bg_man[loc_key] = f"approved/{bp.name}"
            changed_bm = True
        if changed_bm:
            gh_put("src/bg_manifest.json", (json.dumps(bg_man, indent=2) + "\n").encode(), "chore(bokeh): update bg_manifest.json [skip ci]")
    else:
        print("GH_SYNC_SKIP: add GH_TOKEN in Kaggle Secrets for auto-sync")
except Exception as gse:
    print("GH_SYNC_ERR:", gse)


# 9. NICHE_BG_BANK_V31: 8-Niche Dual-Orientation SDXL-Lightning + Depth-Anything-V2 Bokeh Bank
if has_gpu:
    try:
        from diffusers import EulerDiscreteScheduler, StableDiffusionXLPipeline
        from huggingface_hub import hf_hub_download
        from transformers import AutoImageProcessor, AutoModelForDepthEstimation
        import cv2, numpy as np
        NICHES = {
            "cyber_desk":      ("3D Pixar style cybersecurity desk, glowing cyan monitors, clean floor plane, no people", "#22D3EE", 0.80),
            "modern_office":   ("3D Pixar style bright modern corporate glass office, warm sunlight, wooden floor, no people", "#FDE68A", 0.28),
            "tech_lab":        ("3D Pixar style robotics and AI hardware lab, clean workbench, blue rim lights, no people", "#38BDF8", 0.70),
            "bank_counter":    ("3D Pixar style Indian modern bank branch interior, warm marble floor, teller counter, no people", "#FBBF24", 0.25),
            "mobile_studio":   ("3D Pixar style creator podcast studio, acoustic panels, amber and magenta neon, no people", "#F472B6", 0.85),
            "classroom_board": ("3D Pixar style bright Indian smart classroom with green board and sunlit floor, no people", "#FEF08A", 0.20),
            "clinic_consult":  ("3D Pixar style clean friendly doctor consultation room, soft teal walls, no people", "#5EEAD4", 0.35),
            "street_market":   ("3D Pixar style colorful South Indian morning street shop backdrop, golden hour, no people", "#FB923C", 0.42),
        }
        bg_dir = Path("/kaggle/working/out_bg_bank")
        bg_dir.mkdir(parents=True, exist_ok=True)
        need_niches = [k for k in NICHES if not (Path("public/bg_bank") / f"{k}_shorts_v1.webp").exists()]
        if need_niches:
            dev_gen = "cuda:0"
            dev_dep = "cuda:1" if torch.cuda.device_count() > 1 else "cuda:0"
            spipe = StableDiffusionXLPipeline.from_pretrained("stabilityai/stable-diffusion-xl-base-1.0", torch_dtype=torch.float16, variant="fp16").to(dev_gen)
            lora_p = hf_hub_download("ByteDance/SDXL-Lightning", "sdxl_lightning_4step_lora.safetensors")
            spipe.load_lora_weights(lora_p); spipe.fuse_lora()
            spipe.scheduler = EulerDiscreteScheduler.from_config(spipe.scheduler.config, timestep_spacing="trailing")
            d_proc = AutoImageProcessor.from_pretrained("depth-anything/Depth-Anything-V2-Small-hf")
            d_mod = AutoModelForDepthEstimation.from_pretrained("depth-anything/Depth-Anything-V2-Small-hf").to(dev_dep)
            man = json.loads(Path("src/bg_manifest.json").read_text()) if Path("src/bg_manifest.json").exists() else {}
            for nk in need_niches:
                pr, rc, ri = NICHES[nk]
                for ori, gw, gh, ow, oh in [("shorts", 432, 768, 1080, 1920), ("landscape", 768, 432, 1280, 720)]:
                    im = spipe(prompt=pr, num_inference_steps=4, guidance_scale=0.0, width=gw, height=gh).images[0].resize((ow, oh), Image.Resampling.LANCZOS)
                    inp = d_proc(images=im, return_tensors="pt").to(dev_dep)
                    with torch.no_grad():
                        dep = d_mod(**inp).predicted_depth.squeeze().cpu().numpy()
                    dep_r = cv2.resize(dep, (ow, oh), interpolation=cv2.INTER_CUBIC)
                    dep_n = (dep_r - dep_r.min()) / (dep_r.max() - dep_r.min() + 1e-6)
                    rgb = np.array(im)
                    bm = cv2.GaussianBlur(rgb, (15, 15), 0)
                    bf = cv2.GaussianBlur(rgb, (35, 35), 0)
                    fg = np.linspace(1.0, 0.25, oh)[:, None, None]
                    wf = np.clip((1.0 - dep_n) * 1.35, 0.0, 1.0)[..., None] * fg
                    comp = np.clip(rgb * (1 - wf) + (0.4 * bm + 0.6 * bf) * wf, 0, 255).astype(np.uint8)
                    out_f = bg_dir / f"{nk}_{ori}_v1.webp"
                    Image.fromarray(comp).save(out_f, "WEBP", quality=86)
                    if ori == "shorts":
                        man[nk] = f"bg_bank/{out_f.name}"
                print("BG_BANK_NICHE_OK:", nk)
            (bg_dir / "bg_manifest.json").write_text(json.dumps(man, indent=2), encoding="utf-8")
            del spipe, d_mod; torch.cuda.empty_cache()
    except Exception as bge:
        print("BG_BANK_SKIP:", bge)
