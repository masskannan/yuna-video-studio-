import asyncio, json, os, subprocess, sys, urllib.request, uuid
import edge_tts

NARRATION_FILE = "narration.txt"
GLOSSARY_FILE = "glossary.json"
TIMELINE_FILE = "timeline.json"
OUT_DIR = "chunks/master-audio"
RAW_MP3 = os.path.join(OUT_DIR, "raw_voice.mp3")
VOICE_WAV = os.path.join(OUT_DIR, "voice_24k_proc.wav")
MASTER_MP3 = os.path.join(OUT_DIR, "master_audio.mp3")
WORDS_JSON = os.path.join(OUT_DIR, "words.json")
SRT_FILE = os.path.join(OUT_DIR, "captions.srt")
BGM_FILE = "assets/audio/bgm.mp3"
VOICE = "ta-IN-ValluvarNeural"

os.makedirs(OUT_DIR, exist_ok=True)

def load_text():
    with open(NARRATION_FILE, "r", encoding="utf-8") as f:
        text = f.read().strip()
    if os.path.exists(GLOSSARY_FILE):
        with open(GLOSSARY_FILE, "r", encoding="utf-8") as f:
            glossary = json.load(f)
        if isinstance(glossary, dict):
            for k, v in glossary.items():
                text = text.replace(str(k), str(v))
    return text

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
        return float(tl.get("total_sec", 0.0))
    return 0.0

async def synth_edge(text):
    try:
        comm = edge_tts.Communicate(text, VOICE, boundary="WordBoundary")
    except TypeError:
        comm = edge_tts.Communicate(text, VOICE)
    words = []
    sentences = []
    with open(RAW_MP3, "wb") as f:
        async for chunk in comm.stream():
            ctype = chunk.get("type")
            if ctype == "audio":
                f.write(chunk["data"])
            elif ctype == "WordBoundary":
                start = chunk["offset"] / 10_000_000.0
                dur = chunk["duration"] / 10_000_000.0
                w = chunk.get("text", "").strip()
                if w:
                    words.append({"word": w, "start": round(start, 3), "end": round(start + dur, 3)})
            elif ctype == "SentenceBoundary":
                start = chunk["offset"] / 10_000_000.0
                dur = chunk["duration"] / 10_000_000.0
                s = chunk.get("text", "").strip()
                if s:
                    sentences.append({"text": s, "start": start, "end": start + dur})
    return words, sentences

def groq_whisper_words(audio_path):
    api_key = os.environ.get("GROQ_API_KEY", "").strip()
    if not api_key:
        return []
    boundary = uuid.uuid4().hex
    with open(audio_path, "rb") as f:
        audio_bytes = f.read()
    parts = []
    def add_field(name, val):
        parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"\r\n\r\n{val}\r\n".encode())
    add_field("model", "whisper-large-v3")
    add_field("language", "ta")
    add_field("response_format", "verbose_json")
    add_field("timestamp_granularities[]", "word")
    parts.append(
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"voice.mp3\"\r\nContent-Type: audio/mpeg\r\n\r\n".encode()
        + audio_bytes + b"\r\n"
    )
    parts.append(f"--{boundary}--\r\n".encode())
    body = b"".join(parts)
    req = urllib.request.Request(
        "https://api.groq.com/openai/v1/audio/transcriptions",
        data=body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        out = []
        for w in data.get("words", []):
            txt = str(w.get("word", "")).strip()
            if txt:
                out.append({"word": txt, "start": round(float(w["start"]), 3), "end": round(float(w["end"]), 3)})
        return out
    except Exception as e:
        print(f"Groq Whisper fallback failed: {e}", file=sys.stderr)
        return []

def proportional_words(text, total_dur, offset=0.0):
    tokens = [t for t in text.split() if t.strip()]
    if not tokens:
        return []
    weights = [max(1, len(t)) for t in tokens]
    total_w = sum(weights)
    cur = offset
    out = []
    for t, w in zip(tokens, weights):
        dur = total_dur * (w / total_w)
        out.append({"word": t, "start": round(cur, 3), "end": round(cur + dur, 3)})
        cur += dur
    return out

def sentence_bounded_words(scaled_sentences):
    out = []
    for s in scaled_sentences:
        dur = max(0.05, s["end"] - s["start"])
        out.extend(proportional_words(s["text"], dur, offset=s["start"]))
    return out

def write_srt(words):
    lines = []
    idx = 1
    for i in range(0, len(words), 5):
        grp = words[i:i+5]
        if not grp:
            continue
        def fmt(sec):
            ms = int(round(sec * 1000))
            h, ms = divmod(ms, 3600000)
            m, ms = divmod(ms, 60000)
            s, ms = divmod(ms, 1000)
            return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"
        lines.append(f"{idx}\n{fmt(grp[0]['start'])} --> {fmt(grp[-1]['end'])}\n{' '.join(x['word'] for x in grp)}\n")
        idx += 1
    with open(SRT_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

def main():
    text = load_text()
    words, sentences = asyncio.run(synth_edge(text))
    raw_dur = get_duration(RAW_MP3)

    voice_af = (
        "asetrate=24000*0.93,aresample=48000,atempo=1.075,"
        "equalizer=f=120:width_type=h:width=100:g=3.5,"
        "equalizer=f=3200:width_type=h:width=800:g=2.5,"
        "acompressor=threshold=-18dB:ratio=3:attack=10:release=120"
    )
    subprocess.run(["ffmpeg", "-y", "-i", RAW_MP3, "-af", voice_af, VOICE_WAV], check=True)
    proc_dur = get_duration(VOICE_WAV)
    target = max(proc_dur, get_timeline_sec())
    scale = proc_dur / raw_dur if raw_dur > 0 else 1.0

    scaled_sentences = [
        {"text": s["text"], "start": s["start"] * scale, "end": s["end"] * scale}
        for s in sentences
    ]

    if words:
        print(f"Using edge-tts WordBoundary ({len(words)} words)")
        words = [{"word": w["word"], "start": round(w["start"] * scale, 3), "end": round(w["end"] * scale, 3)} for w in words]
    else:
        g_words = groq_whisper_words(VOICE_WAV)
        nar_tokens = [t for t in text.split() if t.strip()]
        if g_words and len(g_words) == len(nar_tokens):
            words = [
                {"word": tok, "start": gw["start"], "end": gw["end"]}
                for tok, gw in zip(nar_tokens, g_words)
            ]
            print(f"Using Groq Whisper mapped to narration.txt ({len(words)} words)")
        elif scaled_sentences:
            words = sentence_bounded_words(scaled_sentences)
            print(f"Using sentence-bounded proportional ({len(words)} words, {len(scaled_sentences)} sentences)")
        else:
            words = proportional_words(text, proc_dur)
            print("Using full proportional word timing fallback")

    with open(WORDS_JSON, "w", encoding="utf-8") as f:
        json.dump(words, f, ensure_ascii=False, indent=2)
    write_srt(words)

    if os.path.exists(BGM_FILE):
        print(f"Mixing BGM with sidechaincompress ducking (target={target:.2f}s) -> -14 LUFS, TP -1.5")
        fc = (
            f"[0:a]apad=whole_dur={target:.3f},asplit=2[v_mix][v_sc];"
            "[1:a]aresample=48000,volume=0.22[bgm];"
            "[bgm][v_sc]sidechaincompress=threshold=0.02:ratio=6:attack=40:release=350:makeup=1[bgm_ducked];"
            "[v_mix][bgm_ducked]amix=inputs=2:duration=first:dropout_transition=2,"
            "loudnorm=I=-14:TP=-1.5:LRA=11[out]"
        )
        subprocess.run([
            "ffmpeg", "-y", "-i", VOICE_WAV, "-stream_loop", "-1", "-i", BGM_FILE,
            "-filter_complex", fc, "-map", "[out]", "-t", f"{target:.3f}",
            "-ar", "48000", "-b:a", "192k", MASTER_MP3
        ], check=True)
    else:
        subprocess.run([
            "ffmpeg", "-y", "-i", VOICE_WAV,
            "-af", "loudnorm=I=-14:TP=-1.5:LRA=11",
            "-ar", "48000", "-b:a", "192k", MASTER_MP3
        ], check=True)

if __name__ == "__main__":
    main()
