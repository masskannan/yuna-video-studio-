import hashlib, json, math, os, struct, sys, wave

def analyze_wav(wav_path, fps=30, out_json="src/fx/audio_envelope.json"):
    sha = hashlib.sha256(open(wav_path, "rb").read()).hexdigest()
    with wave.open(wav_path, "rb") as w:
        sr, ch, sw, nframes = w.getframerate(), w.getnchannels(), w.getsampwidth(), w.getnframes()
        raw = w.readframes(nframes)
    step = max(1, sr // fps)
    fmt = "<" + ("h" * (len(raw) // 2))
    samples = struct.unpack(fmt, raw[: (len(raw) // 2) * 2]) if sw == 2 else [0]
    mono = samples[::ch] if ch > 1 else samples
    envs, beats = [], []
    for i in range(0, len(mono), step):
        chunk = mono[i : i + step]
        rms = math.sqrt(sum(s * s for s in chunk) / max(1, len(chunk))) / 32768.0
        val = round(min(1.0, rms * 2.5), 4)
        envs.append(val)
        if val > 0.45:
            beats.append(i)
    data = {"version": "2.3", "audio_sha256": sha, "sample_rate": sr, "sample_count": len(mono), "fps": fps, "beat_samples": beats, "frame_envelopes": envs}
    json.dump(data, open(out_json, "w", encoding="utf-8"), indent=2)
    return data

if __name__ == "__main__":
    p = sys.argv[1] if len(sys.argv) > 1 else "chunks/master-audio/master_audio.wav"
    if os.path.exists(p):
        d = analyze_wav(p)
        print(f"AUDIO FX OK: {len(d['frame_envelopes'])} frames, {len(d['beat_samples'])} beats")
    else:
        print("AUDIO FX SKIP: no wav input")
