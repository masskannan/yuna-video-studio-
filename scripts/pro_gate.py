import os, subprocess, tempfile

def can_enable_pro(run_statuses, required=5):
    if len(run_statuses) < required:
        return False
    return all(s == "ok" for s in run_statuses[-required:])

def verify_rollback_drill(tag="v2.3-safe"):
    if subprocess.run(["git", "rev-parse", "-q", "--verify", f"refs/tags/{tag}"], capture_output=True).returncode != 0:
        return False
    with tempfile.TemporaryDirectory() as td:
        if subprocess.run(["git", "worktree", "add", "--detach", td, tag], capture_output=True).returncode != 0:
            return False
        try:
            return os.path.isfile(os.path.join(td, "src/MainMovie.tsx")) and os.path.isfile(os.path.join(td, "scripts/verify_merge.py"))
        finally:
            subprocess.run(["git", "worktree", "remove", "--force", td], capture_output=True)
