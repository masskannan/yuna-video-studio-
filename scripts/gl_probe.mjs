import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
let ok = false, meanLuma = 0;
if (existsSync("node_modules/.bin/remotion")) {
  try {
    execFileSync("./node_modules/.bin/remotion", ["still", "src/index.ts", "MainMovie", "out/gl_probe.png", "--frame=0", "--gl=swangle"], { stdio: "pipe", timeout: 120000 });
    const out = execFileSync("ffmpeg", ["-i", "out/gl_probe.png", "-vf", "signalstats", "-f", "null", "-"], { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], timeout: 30000 });
    const m = /YAVG:([0-9.]+)/.exec(out);
    meanLuma = m ? Number(m[1]) : 0;
    ok = existsSync("out/gl_probe.png") && meanLuma > 5;
  } catch { ok = false; }
}
console.log(JSON.stringify({ gl3d_allowed: ok, mean_luma: meanLuma, gl: "swangle", mode: ok ? "HYBRID" : "SAFE" }));
