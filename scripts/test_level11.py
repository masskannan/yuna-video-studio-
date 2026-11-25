import hashlib, json, os, tempfile
from agent_contract import make_contract, validate_contract, verify_done, write_done
from cost_firewall import POLICY, check_budget, lint_workflows

lock = json.load(open("baseline.lock.json", encoding="utf-8"))
for p, h in lock["file_hashes"].items():
    if hashlib.sha256(open(p, "rb").read()).hexdigest() != h: raise AssertionError(f"Hash mismatch {p}")
if lock["remotion_version"] != "4.0.250" or lock["lufs_target"] != -14.0 or lock["tp_target"] != -1.5 or lock["fx_mode_default"] != "SAFE":
    raise AssertionError("Baseline lock mismatch")
if lint_workflows(".github/workflows") < 1 or POLICY["cost_mode"] != "STRICT_ZERO":
    raise AssertionError("Cost firewall failed")

schema = json.load(open("schemas/agent_contract.schema.json", encoding="utf-8"))
c = make_contract("yuna-1", "100", "A1", "SAFE")
validate_contract(c, schema)

for bad_ratio in (-0.1, float("nan"), float("inf"), True):
    try: check_budget(bad_ratio); raise AssertionError("Should reject bad ratio")
    except ValueError: pass
for args in [("bad/id", "1", "A1", "SAFE"), ("ok1", None, "A1", "SAFE"), ("ok1", "1", "A99", "SAFE"), ("ok1", "1", "A1", "BADMODE")]:
    try: make_contract(*args); raise AssertionError(f"Should reject {args}")
    except ValueError: pass

with tempfile.TemporaryDirectory() as td:
    open(os.path.join(td, "bad.yml"), "w").write("jobs:\n  b:\n    runs-on: macos-latest\n")
    try: lint_workflows(td); raise AssertionError("Should reject macos-latest")
    except ValueError: pass
    cwd = os.getcwd(); os.chdir(td)
    try:
        open("outside.txt", "w").write("x")
        try: write_done("A1", "t1", "ok", ["outside.txt"]); raise AssertionError("Should reject outside out/")
        except ValueError: pass
        os.makedirs("out/A1/t1", exist_ok=True)
        art = "out/A1/t1/ok.txt"; open(art, "w").write("hi")
        dp = write_done("A1", "t1", "ok", [art])
        if verify_done(dp)["status"] != "ok": raise AssertionError("verify_done failed")
        open(art, "w").write("tampered")
        try: verify_done(dp); raise AssertionError("Should detect tamper")
        except ValueError: pass
        open(dp, "w").write('{"status":"ok","artifacts":"bad"}')
        try: verify_done(dp); raise AssertionError("Should reject malformed _DONE.json")
        except ValueError: pass
    finally:
        os.chdir(cwd)
print("LEVEL 11 FINAL TESTS PASSED")
