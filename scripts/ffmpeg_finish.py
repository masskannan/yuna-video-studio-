FINISH_FILTERS = {
    "film_grain_halation": "noise=alls=7:allf=t+u",
    "spotify_duotone": "colorchannelmixer=.3:.4:.3:0:.1:.6:.3:0:.2:.2:.6:0",
    "vhs_crt_scanlines": "drawgrid=w=iw:h=4:t=1:c=black@0.22",
}

def build_finish_chain(fx_mode="SAFE", effects=None):
    if fx_mode == "SAFE" or not effects:
        return []
    chain = []
    for k in ("film_grain_halation", "spotify_duotone", "vhs_crt_scanlines"):
        if effects.get(k, {}).get("enabled"):
            chain.append(FINISH_FILTERS[k])
    return chain

def verify_loop_continuity(first_val, last_val, tol=0.05):
    return abs(float(first_val) - float(last_val)) <= tol

if __name__ == "__main__":
    print("FFMPEG FINISH READY:", list(FINISH_FILTERS.keys()))
