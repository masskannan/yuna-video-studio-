import subprocess, sys
sys.path.insert(0, "scripts")
from predictive_maint import run_predictive_check
from tamil_nl_router import CAPABILITY_REGISTRY, route_tamil_command

assert len(CAPABILITY_REGISTRY) == 9
assert run_predictive_check(2.0, 0.2, [60, 62, 61])["healthy"]
bad = run_predictive_check(9.0, 0.85, [60, 60, 120])
assert not bad["healthy"] and len(bad["alerts"]) == 3
assert route_tamil_command("வீடியோ ரெடி பண்ணு")["intent"] == "plan_render"
assert route_tamil_command("status காட்டு")["intent"] == "status"
assert route_tamil_command("approve")["tier"] == "R2"
subprocess.check_call(["python3", "scripts/verify_g0_g15.py"])
print("LEVEL 16 TESTS PASSED: Predictive Maint + Tamil NL Router + G01-G15 OK")
