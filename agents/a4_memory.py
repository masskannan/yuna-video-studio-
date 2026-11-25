import hashlib, json, os, shutil, subprocess, sys, tempfile
sys.path.insert(0, "scripts")
from agent_contract import make_contract, write_done

MAX_INDEX_MB = 300

def compute_video_id(first_sig, last_sig, duration_s):
    return hashlib.sha256(f"{first_sig}|{last_sig}|{round(float(duration_s), 2)}".encode()).hexdigest()[:16]

def sync_memory_branch(index_root="out/A4/index", remote="origin", branch="studio-memory", push=False):
    os.makedirs(index_root, exist_ok=True)
    with tempfile.TemporaryDirectory() as td:
        has_rem = subprocess.run(["git", "ls-remote", "--exit-code", "--heads", remote, branch], capture_output=True).returncode == 0
        if has_rem:
            subprocess.run(["git", "clone", "--branch", branch, "--single-branch", remote, td], check=True, capture_output=True)
            if not push:
                shutil.copytree(td, index_root, dirs_exist_ok=True, ignore=shutil.ignore_patterns(".git"))
                return True
        else:
            if not push: return False
            subprocess.run(["git", "init", td], check=True, capture_output=True)
            subprocess.run(["git", "-C", td, "checkout", "--orphan", branch], check=True, capture_output=True)
            subprocess.run(["git", "-C", td, "remote", "add", "origin", remote], check=True, capture_output=True)
        for fn in os.listdir(index_root):
            src = os.path.join(index_root, fn)
            if os.path.isfile(src): shutil.copy2(src, os.path.join(td, fn))
        subprocess.run(["git", "-C", td, "add", "."], check=True)
        if subprocess.run(["git", "-C", td, "diff", "--cached", "--quiet"]).returncode == 0:
            return True
        subprocess.run(["git", "-C", td, "-c", "user.name=YUNA", "-c", "user.email=yuna@local", "commit", "-m", "chore(a4): sync memory"], check=True, capture_output=True)
        return subprocess.run(["git", "-C", td, "push", "origin" if not has_rem else remote, f"HEAD:refs/heads/{branch}"], capture_output=True).returncode == 0

def index_memory(task_id, run_id, video_id, features, expected_version=None, index_root="out/A4/index"):
    make_contract(task_id, run_id, "A4", "SAFE", {"op": "index", "video_id": video_id})
    os.makedirs(index_root, exist_ok=True)
    head_p = os.path.join(index_root, "HEAD.json")
    head = json.load(open(head_p, encoding="utf-8")) if os.path.isfile(head_p) else {"version": 0, "records": {}, "total_bytes": 0}
    if expected_version is not None and head.get("version", 0) != expected_version:
        raise RuntimeError(f"CAS conflict: expected v{expected_version}, got v{head.get('version', 0)}")
    rec = {"video_id": video_id, "text": str(features.get("text", "")), "hook_sec": float(features.get("hook_sec", 3.0)), "cut_rate": float(features.get("cut_rate", 1.5))}
    fn = f"shard_{video_id}.json"
    json.dump(rec, open(os.path.join(index_root, fn), "w", encoding="utf-8"), indent=2)
    head["records"][video_id] = fn
    total_b = sum(os.path.getsize(os.path.join(index_root, f)) for f in head["records"].values() if os.path.isfile(os.path.join(index_root, f)))
    if total_b > MAX_INDEX_MB * 1024 * 1024: raise MemoryError("VideoRAG 300 MB cap exceeded")
    head["version"] = head.get("version", 0) + 1
    head["total_bytes"] = total_b
    tmp = head_p + ".tmp"
    json.dump(head, open(tmp, "w", encoding="utf-8"), indent=2)
    os.replace(tmp, head_p)
    out_dir = os.path.join("out", "A4", task_id); os.makedirs(out_dir, exist_ok=True)
    rep_p = os.path.join(out_dir, "rag_index.json")
    json.dump({"indexed_id": video_id, "version": head["version"], "count": len(head["records"]), "total_bytes": total_b}, open(rep_p, "w"), indent=2)
    return write_done("A4", task_id, "ok", [rep_p], {"version": head["version"], "count": len(head["records"])})

def query_memory(task_id, run_id, query, k=3, index_root="out/A4/index"):
    make_contract(task_id, run_id, "A4", "SAFE", {"op": "query", "q": query})
    head_p = os.path.join(index_root, "HEAD.json")
    terms, hits = set(query.lower().split()), []
    if os.path.isfile(head_p):
        head = json.load(open(head_p, encoding="utf-8"))
        for vid, fn in head.get("records", {}).items():
            sp = os.path.join(index_root, os.path.basename(fn))
            if not os.path.isfile(sp): continue
            rec = json.load(open(sp, encoding="utf-8"))
            score = sum(1 for t in terms if t in rec.get("text", "").lower())
            if score > 0: hits.append({"video_id": vid, "score": score, "hook_sec": rec["hook_sec"], "cut_rate": rec["cut_rate"]})
    hits.sort(key=lambda x: x["score"], reverse=True)
    out_dir = os.path.join("out", "A4", task_id); os.makedirs(out_dir, exist_ok=True)
    hp = os.path.join(out_dir, "rag_hits.json")
    json.dump({"query": query, "hits": hits[:k]}, open(hp, "w"), indent=2)
    return write_done("A4", task_id, "ok", [hp], {"hit_count": len(hits[:k])})
