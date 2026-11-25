import json, math, os, struct, tempfile, wave
from analyze_audio_fx import analyze_wav
from ffmpeg_finish import build_finish_chain, verify_loop_continuity

with tempfile.TemporaryDirectory() as td:
    wp = os.path.join(td, "test.wav")
    ep = os.path.join(td, "env.json")
    with wave.open(wp, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(48000)
        samples = [int(25000 * math.sin(2 * math.pi * 440 * i / 48000)) for i in range(48000)]
        w.writeframes(struct.pack("<" + "h" * len(samples), *samples))
    d = analyze_wav(wp, fps=30, out_json=ep)
    assert len(d["frame_envelopes"]) == 30 and len(d["beat_samples"]) > 0
    assert all(isinstance(b, int) for b in d["beat_samples"])

assert build_finish_chain("SAFE", {"film_grain_halation": {"enabled": True}}) == []
assert len(build_finish_chain("PRO", {"film_grain_halation": {"enabled": True}, "spotify_duotone": {"enabled": True}})) == 2
assert verify_loop_continuity(0.10, 0.12) and not verify_loop_continuity(0.10, 0.90)
assert json.load(open("src/fx/audio_envelope.json"))["version"] == "2.3"
print("V2.3 P2 TESTS PASSED: Audio Envelope + Integer Beats + Single Finishing Owner + Loop Check OK")
