import json, os, subprocess, sys

def main():
    if not (os.environ.get("KAGGLE_USERNAME") and os.environ.get("KAGGLE_KEY")):
        print("Kaggle credentials not set; using local/Remotion fallback.")
        return
    prompt = " ".join(sys.argv[1:]) or "cinematic tech studio workspace, 4k"
    os.makedirs("kaggle_job", exist_ok=True)
    json.dump({"id": f"{os.environ['KAGGLE_USERNAME']}/yuna-broll-gen", "title": "YUNA B-Roll Gen", "code_file": "gen.py", "language": "python", "kernel_type": "script", "is_private": True, "enable_gpu": True, "enable_internet": True}, open("kaggle_job/kernel-metadata.json", "w"), indent=2)
    open("kaggle_job/gen.py", "w").write(f"# Run SDXL-Turbo / Wan on Kaggle T4x2\nprint('Prompt:', {prompt!r})\n")
    subprocess.run(["kaggle", "kernels", "push", "-p", "kaggle_job"], check=False)

if __name__ == "__main__":
    main()
