import asyncio, hashlib, json, os, subprocess, urllib.request, uuid
import edge_tts

DIALOGUE_FILE = "dialogue.json"
NARRATION_FILE = "narration.txt"
GLOSSARY_FILE = "glossary.json"
TIMELINE_FILE = "timeline.json"
OUT_DIR = "chunks/master-audio"
CACHE_DIR = "chunks/voice-cache"
VOICE_WAV = os.path.join(OUT_DIR, "voice_24k_proc.wav")
SFX_WAV = os.path.join(OUT_DIR, "sfx_bus.wav")
VOICE_SFX_WAV = os.path.join(OUT_DIR, "voice_plus_sfx.wav")
MASTER_MP3 = os.path.join(OUT_DIR, "master_audio.mp3")
WORDS_JSON = os.path.join(OUT_DIR, "words.json")
LINE_TIMINGS_JSON = os.path.join(OUT_DIR, "line_timings.json")
SRT_FILE = os.path.join(OUT_DIR, "captions.srt")
BGM_FILE = "assets/audio/bgm.mp3"

os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(CACHE_DIR, exist_ok=True)

def apply_glossary(text):
    if os.path.exists(GLOSSARY_FILE):
        with open(GLOSSARY_FILE, "r", encoding="utf-8") as f:
            glossary = json.load(f)
        if isinstance(glossary, dict):
            for k, v in glossary.items():
                text = text.replace(str(k), str(v))
    return text.strip()

def load_lines():
    if os.path.exists(DIALOGUE_FILE):
        with open(DIALOGUE_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, list) and data:
            return [{
                "speaker": str(d.get("speaker", "YUNA")),
                "voice": str(d.get("voice", "ta-IN-ValluvarNeural")),
                "pitch": float(d.get("pitch", 0.93)),
                "color": str(d.get("color", "#38BDF8")),
                "sfx": str(d.get("sfx", "")).strip(),
                "text": apply_glossary(str(d.get("text", ""))),
            } for d in data if str(d.get("text", "")).strip()]
    with open(NARRATION_FILE, "r", encoding="utf-8") as f:
        txt = apply_glossary(f.read())
    return [{"speaker": "YUNA", "voice": "ta-IN-ValluvarNeural", "pitch": 0.93, "color": "#38BDF8", "sfx": "", "text": txt}]

def get_duration(path):
    out = subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", path
    ]).decode().strip()
    return float(out)

def get_timeline_sec():
    if os.path.exists(TIMELINE_FILE):
        with open(TIMELINE_FILE, "r", encoding="utf-8") as f:
            tl = json.load(f)
            raw_t = tl.get("total_sec", 0.0)
            if str(raw_t).strip().lower() == "auto":
                vis = max([float(s.get("end_sec", 0)) for s in (tl.get("scenes") or [])], default=0.0)
                outro = float(tl.get("outro_sec", 2.0)) if not tl.get("outro_included", False) else 0.0
                return vis + outro
            return float(raw_t)
    return 0.0

async def synth_edge(text, voice, raw_mp3):
    try:
        comm = edge_tts.Communicate(text, voice, boundary="WordBoundary")
    except TypeError:
        comm = edge_tts.Communicate(text, voice)
    words, sentences = [], []
    with open(raw_mp3, "wb") as f:
        async for chunk in comm.stream():
            ctype = chunk.get("type")
            if ctype == "audio":
                f.write(chunk["data"])
            elif ctype == "WordBoundary":
                st, dur = chunk["offset"] / 10_000_000.0, chunk["duration"] / 10_000_000.0
                w = chunk.get("text", "").strip()
                if w:
                    words.append({"word": w, "start": st, "end": st + dur})
            elif ctype == "SentenceBoundary":
                st, dur = chunk["offset"] / 10_000_000.0, chunk["duration"] / 10_000_000.0
                s = chunk.get("text", "").strip()
                if s:
                    sentences.append({"text": s, "start": st, "end": st + dur})
    return words, sentences

def groq_whisper_words(audio_path):
    api_key = os.environ.get("GROQ_API_KEY", "").strip()
    if not api_key:
        return []
    boundary = uuid.uuid4().hex
    audio_bytes = open(audio_path, "rb").read()
    parts = []
    for k, v in [("model", "whisper-large-v3"), ("response_format", "verbose_json"), ("timestamp_granularities[]", "word")]:
        parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"{k}\"\r\n\r\n{v}\r\n".encode())
    parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"v.wav\"\r\nContent-Type: audio/wav\r\n\r\n".encode() + audio_bytes + b"\r\n")
    parts.append(f"--{boundary}--\r\n".encode())
    req = urllib.request.Request(
        "https://api.groq.com/openai/v1/audio/transcriptions",
        data=b"".join(parts),
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        return [{"word": str(w.get("word", "")).strip(), "start": float(w["start"]), "end": float(w["end"])} for w in data.get("words", []) if str(w.get("word", "")).strip()]
    except Exception:
        return []

def proportional_words(text, total_dur, offset=0.0):
    tokens = [t for t in text.split() if t.strip()]
    if not tokens:
        return []
    weights = [max(1, len(t)) for t in tokens]
    tw = sum(weights)
    cur, out = offset, []
    for t, w in zip(tokens, weights):
        dur = total_dur * (w / tw)
        out.append({"word": t, "start": cur, "end": cur + dur})
        cur += dur
    return out

def process_line(line):
    key = hashlib.sha256(f"{line['voice']}|{line['pitch']}|{line['text']}".encode("utf-8")).hexdigest()[:16]
    wav_path = os.path.join(CACHE_DIR, f"{key}.wav")
    meta_path = os.path.join(CACHE_DIR, f"{key}.json")

    if os.path.exists(wav_path) and os.path.exists(meta_path):
        print(f"Cache HIT [{line['speaker']}]: {key}")
        return wav_path, json.load(open(meta_path, "r", encoding="utf-8"))

    raw_mp3 = os.path.join(CACHE_DIR, f"{key}_raw.mp3")
    words, sentences = asyncio.run(synth_edge(line["text"], line["voice"], raw_mp3))
    raw_dur = get_duration(raw_mp3)

    p = max(0.75, min(1.35, line["pitch"]))
    af = (
        f"asetrate=24000*{p:.4f},aresample=48000,atempo={1.0/p:.4f},"
        "equalizer=f=120:width_type=h:width=100:g=3.5,"
        "equalizer=f=3200:width_type=h:width=800:g=2.5,"
        "acompressor=threshold=-18dB:ratio=3:attack=10:release=120"
    )
    subprocess.run(["ffmpeg", "-y", "-i", raw_mp3, "-af", af, wav_path], check=True)
    proc_dur = get_duration(wav_path)
    scale = proc_dur / raw_dur if raw_dur > 0 else 1.0

    if words:
        wlist = [{"word": w["word"], "start": w["start"] * scale, "end": w["end"] * scale} for w in words]
        mode = "WordBoundary"
    else:
        gw = groq_whisper_words(wav_path)
        toks = [t for t in line["text"].split() if t.strip()]
        if gw and len(gw) == len(toks):
            wlist = [{"word": t, "start": g["start"], "end": g["end"]} for t, g in zip(toks, gw)]
            mode = "Groq"
        elif sentences:
            wlist = []
            for s in sentences:
                wlist.extend(proportional_words(s["text"], max(0.05, (s["end"] - s["start"]) * scale), offset=s["start"] * scale))
            mode = "SentenceBounded"
        else:
            wlist = proportional_words(line["text"], proc_dur)
            mode = "Proportional"

    meta = {"duration": proc_dur, "words": wlist, "mode": mode}
    json.dump(meta, open(meta_path, "w", encoding="utf-8"), ensure_ascii=False)
    print(f"Using {mode} [{line['speaker']}] ({len(wlist)} words, {proc_dur:.2f}s)")
    return wav_path, meta


def write_lipsync(words, out_path):
    shapes = ["B", "C", "D", "E", "C"]
    frames = []
    for idx, w in enumerate(words):
        st, en = float(w["start"]), float(w["end"])
        mid = (st + en) / 2.0
        frames.append([round(st, 3), round(mid, 3), shapes[idx % len(shapes)], w.get("speaker", "YUNA")])
        frames.append([round(mid, 3), round(en, 3), shapes[(idx + 2) % len(shapes)], w.get("speaker", "YUNA")])
    json.dump(frames, open(out_path, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

def write_srt(words):
    lines, idx = [], 1
    for i in range(0, len(words), 5):
        grp = words[i:i+5]
        def fmt(sec):
            ms = int(round(sec * 1000))
            h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
            return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"
        lines.append(f"{idx}\n{fmt(grp[0]['start'])} --> {fmt(grp[-1]['end'])}\n{' '.join(x['word'] for x in grp)}\n")
        idx += 1
    open(SRT_FILE, "w", encoding="utf-8").write("\n".join(lines))

def main():
    lines = load_lines()
    wavs, all_words, line_timings, sfx_events = [], [], [], []
    cursor = 0.0

    for ln in lines:
        wpath, meta = process_line(ln)
        wavs.append(wpath)
        if ln["sfx"]:
            sfx_path = os.path.join("assets/sfx", f"{ln['sfx']}.wav")
            if os.path.exists(sfx_path):
                sfx_events.append((sfx_path, cursor))
        line_timings.append({"speaker": ln["speaker"], "start": round(cursor, 3), "end": round(cursor + meta["duration"], 3)})
        for w in meta["words"]:
            all_words.append({
                "word": w["word"],
                "start": round(cursor + w["start"], 3),
                "end": round(cursor + w["end"], 3),
                "speaker": ln["speaker"],
                "color": ln["color"],
            })
        cursor += meta["duration"]

    concat_txt = os.path.join(OUT_DIR, "concat.txt")
    with open(concat_txt, "w", encoding="utf-8") as f:
        for w in wavs:
            f.write(f"file '{os.path.abspath(w)}'\n")
    subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", concat_txt, "-c", "copy", VOICE_WAV], check=True)

    proc_dur = get_duration(VOICE_WAV)
    target = max(proc_dur, get_timeline_sec())

    packed_words = [[w["start"], w["end"], w["word"], w["speaker"], w["color"]] for w in all_words]
    json.dump(packed_words, open(WORDS_JSON, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    json.dump(line_timings, open(LINE_TIMINGS_JSON, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    write_srt(all_words)
    write_lipsync(all_words, os.path.join(OUT_DIR, 'lipsync.json'))

    voice_bus = VOICE_WAV
    if sfx_events:
        cmd = ["ffmpeg", "-y", "-i", VOICE_WAV]
        fc_parts = ["[0:a]volume=1.0[v0]"]
        mix_labels = ["[v0]"]
        for i, (spath, st) in enumerate(sfx_events, start=1):
            cmd.extend(["-i", spath])
            ms = int(round(st * 1000))
            fc_parts.append(f"[{i}:a]aresample=48000,adelay={ms}:all=1,volume=0.45[s{i}]")
            mix_labels.append(f"[s{i}]")
        fc_parts.append(f"{''.join(mix_labels)}amix=inputs={len(mix_labels)}:duration=first:normalize=0[out]")
        cmd.extend(["-filter_complex", ";".join(fc_parts), "-map", "[out]", VOICE_SFX_WAV])
        subprocess.run(cmd, check=True)
        voice_bus = VOICE_SFX_WAV
        print(f"Mixed {len(sfx_events)} CC0 SFX into Bus 2")

    mood = str(json.load(open(TIMELINE_FILE, "r", encoding="utf-8")).get("bgm", "default")) if os.path.exists(TIMELINE_FILE) else "default"
    mood_bgm = f"assets/audio/bgm_{mood}.mp3"
    active_bgm = mood_bgm if os.path.exists(mood_bgm) else BGM_FILE
    if os.path.exists(active_bgm):
        print(f"Mixing BGM with sidechaincompress ducking (target={target:.2f}s) -> -14 LUFS, TP -1.5")
        fc = (
            f"[0:a]apad=whole_dur={target:.3f}[v_pad];"
            f"[1:a]apad=whole_dur={target:.3f}[v_sc];"
            "[2:a]aresample=48000,volume=0.22[bgm];"
            "[bgm][v_sc]sidechaincompress=threshold=0.02:ratio=6:attack=40:release=350:makeup=1[bgm_ducked];"
            "[v_pad][bgm_ducked]amix=inputs=2:duration=first:dropout_transition=2,"
            f"afade=t=in:st=0:d={min(1.0, target/2.0):.3f},afade=t=out:st={max(0.0, target - min(1.0, target/2.0)):.3f}:d={min(1.0, target/2.0):.3f},loudnorm=I=-14:TP=-1.5:LRA=11[out]"
        )
        subprocess.run([
            "ffmpeg", "-y", "-i", voice_bus, "-i", VOICE_WAV, "-stream_loop", "-1", "-i", active_bgm,
            "-filter_complex", fc, "-map", "[out]", "-t", f"{target:.3f}",
            "-ar", "48000", "-b:a", "192k", MASTER_MP3
        ], check=True)
    else:
        subprocess.run([
            "ffmpeg", "-y", "-i", voice_bus,
            "-af", "loudnorm=I=-14:TP=-1.5:LRA=11",
            "-ar", "48000", "-b:a", "192k", MASTER_MP3
        ], check=True)

if __name__ == "__main__":
    main()
