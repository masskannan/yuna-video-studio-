import json, os, subprocess, sys
txt_path, out_mp3, out_srt, lang = sys.argv[1:5]
raw = open(txt_path, encoding="utf-8").read().strip()
gloss = json.load(open("glossary.json", encoding="utf-8"))
for k, v in gloss.items():
    raw = raw.replace(k, v)
voice = "ta-IN-ValluvarNeural" if lang == "ta" else "en-US-AndrewMultilingualNeural"
raw_mp3 = out_mp3 + ".raw.mp3"
subprocess.run(["edge-tts", "--voice", voice, "--rate=-4%", "--text", raw, "--write-media", raw_mp3, "--write-subtitles", out_srt], check=True)
af = "asetrate=24000*0.93,aresample=48000,atempo=1.075,equalizer=f=120:t=q:w=1.2:g=3.5,equalizer=f=3200:t=q:w=1.5:g=2.5,acompressor=threshold=-18dB:ratio=3:attack=10:release=120,loudnorm=I=-14:TP=-1.5:LRA=11"
subprocess.run(["ffmpeg", "-y", "-i", raw_mp3, "-af", af, out_mp3], check=True)
if os.path.exists(raw_mp3):
    os.remove(raw_mp3)
