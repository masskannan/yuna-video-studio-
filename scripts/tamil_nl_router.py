CAPABILITY_REGISTRY = {
    "A1": {"role": "Conductor", "tier": "R1"}, "A2": {"role": "Strategist", "tier": "R0"},
    "A3": {"role": "Reverse-Engineer", "tier": "R0"}, "A4": {"role": "Memory", "tier": "R1"},
    "A5": {"role": "3D/VFX", "tier": "R2"}, "A6": {"role": "2D-in-3D Hybrid", "tier": "R1"},
    "A7": {"role": "Editor/QA", "tier": "R0"}, "A8": {"role": "UI Promo", "tier": "R1"},
    "A9": {"role": "Motion", "tier": "R0"},
}

def route_tamil_command(text):
    t = str(text or "").strip().lower()
    if any(k in t for k in ("status", "நிலை", "காட்டு", "என்ன")): return {"intent": "status", "agent": "A1", "tier": "R0"}
    if any(k in t for k in ("approve", "அப்ரூவ்", "ஓகே")): return {"intent": "approve", "agent": "A1", "tier": "R2"}
    if any(k in t for k in ("rollback", "பழைய", "திரும்பு")): return {"intent": "rollback_check", "agent": "A1", "tier": "R2"}
    if any(k in t for k in ("render", "வீடியோ", "ரெடி")): return {"intent": "plan_render", "agent": "A1", "tier": "R1"}
    return {"intent": "help", "agent": "A1", "tier": "R0"}
