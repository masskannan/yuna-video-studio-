import glob, math, yaml

POLICY = {"cost_mode": "STRICT_ZERO", "allow_paid_api": False, "allow_paid_runner": False, "allow_paid_storage": False, "allow_local_render": False, "allow_phone_compute": False}
FORBIDDEN_DOMAINS = ("api.openai.com", "api.anthropic.com", "api.elevenlabs.io", "api.runwayml.com")

def check_budget(ratio):
    if not isinstance(ratio, (int, float)) or isinstance(ratio, bool) or math.isnan(ratio) or math.isinf(ratio) or ratio < 0:
        raise ValueError(f"Invalid budget ratio: {ratio}")
    if ratio >= 1.0: return "HARD_STOP_SAFE"
    if ratio >= 0.8: return "WARN_BLOCK_HYBRID_PRO"
    return "OK"

def lint_workflows(wf_dir=".github/workflows"):
    wfs = sorted(glob.glob(f"{wf_dir}/**/*.yml", recursive=True) + glob.glob(f"{wf_dir}/**/*.yaml", recursive=True))
    if not wfs: raise FileNotFoundError(f"No workflow files found in {wf_dir}")
    for wf in wfs:
        txt = open(wf, encoding="utf-8").read()
        data = yaml.safe_load(txt) or {}
        for jname, job in (data.get("jobs") or {}).items():
            if not isinstance(job, dict): continue
            if "uses" in job and "runs-on" not in job: continue
            ro = str(job.get("runs-on", "")).strip()
            if ro != "ubuntu-latest": raise ValueError(f"Forbidden runner {ro!r} in {wf}:{jname}")
        for dom in FORBIDDEN_DOMAINS:
            if dom in txt: raise ValueError(f"Forbidden paid API {dom} in {wf}")
    return len(wfs)
