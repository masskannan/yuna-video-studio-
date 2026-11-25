import hashlib, json, os, subprocess, sys
sys.path.insert(0, "scripts")
from agent_contract import make_contract, write_done

BLOCKED_HOSTS = ("169.254.", "metadata.google.internal")

def run_ui_promo(task_id, run_id, url, device="mobile", bin_path="", expected_sha256="", execute=False):
    if not isinstance(url, str) or not (url.startswith("https://") or url.startswith("http://")) or any(h in url for h in BLOCKED_HOSTS):
        raise ValueError(f"Unsafe URL: {url!r}")
    if device not in ("mobile", "desktop"): raise ValueError(f"Invalid device: {device!r}")
    make_contract(task_id, run_id, "A8", "SAFE", {"url": url, "device": device})
    out_dir = os.path.join("out", "A8", task_id); os.makedirs(out_dir, exist_ok=True)
    rp = os.path.join(out_dir, "uipromo.json")
    if not bin_path or not os.path.isfile(bin_path) or not os.access(bin_path, os.X_OK):
        json.dump({"skipped": True, "fallback": "screenshot_fallback", "url": url}, open(rp, "w"), indent=2)
        return write_done("A8", task_id, "skipped_safe", [rp], {"binary_present": False})
    actual = hashlib.sha256(open(bin_path, "rb").read()).hexdigest()
    if expected_sha256 and actual != expected_sha256: raise ValueError(f"go-loadshow SHA256 mismatch: {actual}")
    mp4 = os.path.join(out_dir, "promo_ui.mp4")
    if execute: subprocess.run([bin_path, "record", url, "-p", device, "-o", mp4], check=True, timeout=180)
    json.dump({"url": url, "device": device, "bin_sha256": actual, "fps": 30, "pix_fmt": "yuv420p"}, open(rp, "w"), indent=2)
    return write_done("A8", task_id, "ok", [rp], {"binary_present": True})
