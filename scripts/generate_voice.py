import os, subprocess, sys

# Usage: python3 scripts/generate_voice.py <text_file> <out_mp3> <lang: ta|en>
if len(sys.argv) < 4:
    sys.exit(0)

txt_path, out_mp3, lang = sys.argv[1], sys.argv[2], sys.argv[3]
if not os.path.exists(txt_path):
    sys.exit(0)

raw_text = open(txt_path, encoding="utf-8").read().strip()
if not raw_text:
    sys.exit(0)

# Pronunciation dictionary for clean Tamil/Sanskrit narration
PRON_MAP = {
    "AI": "ஏ ஐ",
    "YUNA": "யூனா",
}
for k, v in PRON_MAP.items():
    raw_text = raw_text.replace(k, v)

voice = "ta-IN-ValluvarNeural" if lang == "ta" else "en-US-AndrewMultilingualNeural"
raw_mp3 = out_mp3 + ".raw.mp3"

subprocess.run(["edge-tts", "--voice", voice, "--rate=-4%", "--text", raw_text, "--write-media", raw_mp3], check=True)

# Signature Majestic Voice Mastering Chain: subtle depth + warm 120Hz bass + 3kHz clarity + -14 LUFS
af = "asetrate=44100*0.93,aresample=44100,atempo=1.075,equalizer=f=120:t=q:w=1.2:g=3.5,equalizer=f=3200:t=q:w=1.5:g=2.5,acompressor=threshold=-18dB:ratio=3:attack=10:release=120,loudnorm=I=-14:TP=-1.5:LRA=11"
subprocess.run(["ffmpeg", "-y", "-i", raw_mp3, "-af", af, out_mp3], check=True)
if os.path.exists(raw_mp3):
    os.remove(raw_mp3)
print(f"Signature voice mastered: {out_mp3}")
