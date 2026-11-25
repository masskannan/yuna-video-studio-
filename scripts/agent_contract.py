import hashlib, json, os, re, tempfile

VALID_AGENTS = {"A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9"}
VALID_MODES = {"SAFE", "HYBRID", "PRO"}
VALID_STATUSES = {"ok", "skipped_safe", "failed"}
TASK_RE = re.compile(r"^[A-Za-z0-9_-]{1,64}$")

def _atomic_write(path, data):
    d = os.path.dirname(path) or "."
    with tempfile.NamedTemporaryFile("w", dir=d, delete=False, encoding="utf-8") as f:
        json.dump(data, f, indent=2)
        tmp = f.name
    os.replace(tmp, path)

def _check_jail(p, allowed_root="out"):
    root_real = os.path.realpath(allowed_root)
    ap_real = os.path.realpath(p)
    if not ap_real.startswith(root_real + os.sep):
        raise ValueError(f"Artifact outside {allowed_root}: {p}")
    return ap_real

def validate_contract(c, schema):
    if not isinstance(c, dict): raise ValueError("Contract must be dict")
    req = set(schema["required"])
    if not req.issubset(c.keys()) or (schema.get("additionalProperties") is False and not set(c.keys()).issubset(schema["properties"].keys())):
        raise ValueError("Contract keys mismatch schema")
    for k, rule in schema["properties"].items():
        v = c[k]
        if "const" in rule and v != rule["const"]: raise ValueError(f"{k} const mismatch")
        if "enum" in rule and v not in rule["enum"]: raise ValueError(f"{k} enum mismatch")
        if "pattern" in rule and (not isinstance(v, str) or not re.fullmatch(rule["pattern"], v)): raise ValueError(f"{k} pattern mismatch")
    return True

def make_contract(task_id, run_id, agent_id, fx_mode="SAFE", inp=None):
    if not isinstance(task_id, str) or not TASK_RE.fullmatch(task_id): raise ValueError(f"Invalid task_id: {task_id!r}")
    if run_id is None or not str(run_id).strip() or str(run_id) == "None" or len(str(run_id)) > 64: raise ValueError(f"Invalid run_id: {run_id!r}")
    if agent_id not in VALID_AGENTS or fx_mode not in VALID_MODES: raise ValueError("Invalid agent_id or fx_mode")
    if inp is not None and not isinstance(inp, dict): raise ValueError("input must be dict")
    return {
        "contract_version": "1.0", "task_id": task_id, "run_id": str(run_id), "agent_id": agent_id, "fx_mode": fx_mode,
        "budget": {"timeout_seconds": 120, "max_retries": 1}, "input": inp or {},
        "constraints": {"cost_mode": "STRICT_ZERO", "allow_paid_api": False, "allow_paid_runner": False, "allow_production_write": False},
    }

def write_done(agent_id, task_id, status, artifact_paths=None, metrics=None, rollback_plan="git checkout -b rollback-v23 v2.3-safe", allowed_root="out"):
    if agent_id not in VALID_AGENTS or status not in VALID_STATUSES or not isinstance(task_id, str) or not TASK_RE.fullmatch(task_id):
        raise ValueError("Invalid agent_id, task_id, or status")
    out_dir = os.path.join(allowed_root, agent_id, task_id)
    os.makedirs(out_dir, exist_ok=True)
    arts = []
    for p in (artifact_paths or []):
        ap_real = _check_jail(p, allowed_root)
        if not os.path.isfile(ap_real): raise FileNotFoundError(f"Missing regular artifact: {p}")
        arts.append({"path": p, "sha256": hashlib.sha256(open(ap_real, "rb").read()).hexdigest()})
    dp = os.path.join(out_dir, "_DONE.json")
    _atomic_write(dp, {"contract_version": "1.0", "agent_id": agent_id, "task_id": task_id, "status": status, "artifacts": arts, "metrics": metrics or {}, "cost": {"paid_usd": 0, "provider_units": 0}, "rollback_plan": rollback_plan})
    return dp

def verify_done(done_path, allowed_root="out"):
    if not os.path.isfile(done_path): raise FileNotFoundError(done_path)
    d = json.load(open(done_path, encoding="utf-8"))
    if not isinstance(d, dict) or d.get("status") not in VALID_STATUSES or not isinstance(d.get("artifacts"), list) or not isinstance(d.get("cost"), dict):
        raise ValueError("Malformed _DONE.json")
    for a in d["artifacts"]:
        if not isinstance(a, dict) or not isinstance(a.get("path"), str) or not isinstance(a.get("sha256"), str):
            raise ValueError("Invalid artifact entry")
        ap_real = _check_jail(a["path"], allowed_root)
        if not os.path.isfile(ap_real) or hashlib.sha256(open(ap_real, "rb").read()).hexdigest() != a["sha256"]:
            raise ValueError(f"Artifact checksum mismatch: {a['path']}")
    return d
