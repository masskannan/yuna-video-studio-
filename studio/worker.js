const OWNER = "masskannan";
const REPO = "yuna-video-studio-";


function officeMiniAppHtml(pin) {
  const safePinJson = JSON.stringify(String(pin || ""));
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<title>YUNA 2050 Bento Studio</title>
<script src="https://telegram.org/js/telegram-web-app.js"></script>
<style>
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
  body{margin:0;background:#050811;color:#F8FAFC;font-family:system-ui,-apple-system,sans-serif;padding:14px}
  .wrap{max-width:540px;margin:0 auto;display:flex;flex-direction:column;gap:12px}
  .bar{display:flex;justify-content:space-between;align-items:center}
  .brand{display:flex;align-items:center;gap:8px;font-size:16px;font-weight:800;letter-spacing:-0.3px}
  .pill{font-size:11px;font-weight:700;padding:4px 10px;border-radius:999px;background:#0F172A;border:1px solid #38BDF8;color:#38BDF8}
  .track{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;background:#0B1120;border:1px solid #1E293B;border-radius:14px;padding:10px}
  .step{display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center}
  .sico{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:#111827;border:1px solid #334155;color:#94A3B8}
  .sico.ok{border-color:#10B981;color:#34D399;background:#052E16}
  .sico.run{border-color:#F59E0B;color:#FBBF24;background:#2E1A05;animation:pulse 1.2s infinite}
  .sico.err{border-color:#EF4444;color:#F87171;background:#2E0505}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
  .slbl{font-size:10px;color:#94A3B8;font-weight:700}
  .bento{display:grid;grid-template-columns:118px 1fr;gap:10px}
  .phone{background:linear-gradient(160deg,#0F172A,#1E1B4B);border:2px solid #334155;border-radius:18px;padding:10px 8px;display:flex;flex-direction:column;justify-content:space-between;min-height:190px;position:relative;overflow:hidden}
  .phone.cyber{background:linear-gradient(160deg,#090D24,#3B0764)}
  .phone.warm{background:linear-gradient(160deg,#1F1205,#451A03)}
  .phone.noir{background:linear-gradient(160deg,#09090B,#27272A)}
  .ptag{font-size:9px;font-weight:800;color:#38BDF8;text-transform:uppercase;text-align:center}
  .pcast{display:flex;justify-content:center;gap:6px;font-size:20px;margin:8px 0}
  .psub{background:rgba(0,0,0,.75);border-radius:8px;padding:5px;font-size:10px;font-weight:800;text-align:center;color:#FACC15}
  .panel{background:#0B1120;border:1px solid #1E293B;border-radius:16px;padding:12px;display:flex;flex-direction:column;gap:8px}
  .lbl{font-size:10px;font-weight:800;color:#64748B;text-transform:uppercase;letter-spacing:.6px}
  .row{display:flex;gap:6px;flex-wrap:wrap}
  .chip{flex:1;min-width:58px;padding:7px 6px;border-radius:9px;border:1px solid #1E293B;background:#111827;color:#CBD5E1;font-size:11px;font-weight:700;cursor:pointer;text-align:center}
  .chip.on{background:#0284C7;border-color:#38BDF8;color:#fff}
  .swatches{display:flex;gap:8px;align-items:center}
  .sw{width:26px;height:26px;border-radius:999px;border:2px solid #334155;cursor:pointer}
  .sw.on{border-color:#fff;transform:scale(1.12)}
  .card{background:#0B1120;border:1px solid #1E293B;border-radius:16px;padding:12px}
  .recipes{display:flex;gap:6px;overflow-x:auto;padding-bottom:8px}
  .rcp{white-space:nowrap;padding:6px 10px;border-radius:999px;background:#111827;border:1px solid #334155;color:#E2E8F0;font-size:11px;font-weight:700;cursor:pointer}
  textarea{width:100%;height:78px;border-radius:10px;border:1px solid #334155;background:#020617;color:#F8FAFC;padding:10px;font-size:13px;resize:none;font-family:inherit}
  .actions{display:flex;gap:8px;margin-top:8px}
  .btn-sub{padding:11px 12px;border-radius:10px;border:1px solid #334155;background:#111827;color:#38BDF8;font-size:12px;font-weight:800;cursor:pointer}
  .btn-go{flex:1;padding:12px;border:0;border-radius:10px;background:linear-gradient(90deg,#0EA5E9,#6366F1);color:#fff;font-size:14px;font-weight:800;cursor:pointer}
  .btn-go:disabled{opacity:.55;cursor:not-allowed}
  .log{font-family:monospace;font-size:11px;color:#34D399;background:#020617;border:1px solid #1E293B;border-radius:10px;padding:8px 10px;min-height:32px}
</style></head><body>
<div class="wrap">
  <div class="bar">
    <div class="brand">🎬 YUNA Studio <span style="font-size:11px;color:#64748B">2050</span></div>
    <div class="pill" id="runPill">LIVE SYNC</div>
  </div>
  <div class="track" id="track"></div>
  <div class="bento">
    <div class="phone cyber" id="phone">
      <div class="ptag" id="ptag">9:16 REEL • CARTOON</div>
      <div class="pcast" id="pcast">🧑🏽‍💼 👩🏽‍💻</div>
      <div class="psub" id="psub">45s • CYBER</div>
    </div>
    <div class="panel">
      <div class="lbl">Target &amp; Cast</div>
      <div class="row" id="tgtRow">
        <div class="chip" data-v="reel:0" onclick="setTgt('reel',false,this)">📱 Reel</div>
        <div class="chip" data-v="reel:1" onclick="setTgt('reel',true,this)">🎭 +Cameo</div>
        <div class="chip" data-v="yt:0" onclick="setTgt('yt',false,this)">📺 16:9</div>
        <div class="chip" data-v="both:0" onclick="setTgt('both',false,this)">🎬 Both</div>
      </div>
      <div class="lbl">Mode &amp; Color</div>
      <div class="row" id="modeRow">
        <div class="chip" data-v="cartoon" onclick="setMode('cartoon',this)">🎨 Cartoon</div>
        <div class="chip" data-v="ui_ux" onclick="setMode('ui_ux',this)">💻 UI/UX</div>
        <div class="chip" data-v="cinema" onclick="setMode('cinema',this)">🎬 Cinema</div>
        <div class="chip" data-v="split_pip" onclick="setMode('split_pip',this)">🔀 Split</div>
      </div>
      <div class="row" style="align-items:center;justify-content:space-between">
        <div class="swatches" id="gradeRow">
          <div class="sw" data-v="none" title="Clean" style="background:#E2E8F0" onclick="setGrade('none',this)"></div>
          <div class="sw" data-v="cyber" title="Cyber" style="background:#7C3AED" onclick="setGrade('cyber',this)"></div>
          <div class="sw" data-v="warm" title="Warm" style="background:#F59E0B" onclick="setGrade('warm',this)"></div>
          <div class="sw" data-v="noir" title="Noir" style="background:#18181B" onclick="setGrade('noir',this)"></div>
        </div>
        <div class="row" id="durRow" style="flex:0 0 auto">
          <div class="chip" data-v="45" style="min-width:40px" onclick="setDur(45,this)">45s</div>
          <div class="chip" data-v="60" style="min-width:40px" onclick="setDur(60,this)">60s</div>
        </div>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="recipes">
      <div class="rcp" onclick="fill('AI வேலைவாய்ப்பை எப்படி மாற்றும்? 2 நண்பர்கள் உரையாடல்')">🔥 Tech Debate</div>
      <div class="rcp" onclick="fill('இந்த 3 தவறுகள் Mobile-ல் செய்யாதீங்க! Quick tips')">⚠️ 3 Mistakes</div>
      <div class="rcp" onclick="fill('புதிய AI Tool 30 நொடியில் வீடியோ எடிட்டிங் demo')">💻 Tool Demo</div>
      <div class="rcp" onclick="fill('50% Offer! Smart Watch honest review & price slash')">🛍️ Product Ad</div>
    </div>
    <textarea id="txt" placeholder="Paste topic or Tamil/English script..."></textarea>
    <div class="actions">
      <button class="btn-sub" onclick="surprise()">🎲 Idea</button>
      <button class="btn-go" id="goBtn" onclick="go()">🚀 Start Render</button>
    </div>
  </div>
  <div class="log" id="log">&gt; Ready. Tap a recipe or paste script.</div>
</div>
<script>
const PIN = ${safePinJson};
try { if (window.Telegram && Telegram.WebApp) { Telegram.WebApp.ready(); Telegram.WebApp.expand(); } } catch {}
function buzz(){ try { Telegram.WebApp.HapticFeedback.impactOccurred('light'); } catch {} }
const SVGS = [
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.7-3.3 6l-.7 3H9l-.7-3A7 7 0 0 1 12 2z"/></svg>',
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>',
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>',
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M10 9l5 3-5 3V9z"/></svg>',
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/></svg>',
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>'
];
const LBLS = ["Director", "Voice", "3D/FX", "Render", "Merge", "Pack"];
let cfg = { tgt: "reel", cameo: false, mode: "cartoon", grade: "cyber", dur: 45 };
try { const saved = JSON.parse(localStorage.getItem("yuna_cfg") || "null"); if (saved) cfg = Object.assign(cfg, saved); } catch {}
function saveCfg(){ try { localStorage.setItem("yuna_cfg", JSON.stringify(cfg)); } catch {} syncUi(); }
function syncUi(){
  const p = document.getElementById('phone');
  p.className = 'phone ' + cfg.grade;
  document.getElementById('ptag').textContent = (cfg.tgt === 'yt' ? '16:9 YT' : '9:16 REEL') + ' • ' + cfg.mode.toUpperCase();
  document.getElementById('pcast').textContent = cfg.cameo ? '🧑🏽‍💼 👩🏽‍💻 🐛' : '🧑🏽‍💼 👩🏽‍💻';
  document.getElementById('psub').textContent = cfg.dur + 's • ' + cfg.grade.toUpperCase();
  const mark = (id, val) => document.querySelectorAll('#' + id + ' [data-v]').forEach(x => x.classList.toggle('on', x.getAttribute('data-v') === String(val)));
  mark('tgtRow', cfg.tgt + ':' + (cfg.cameo ? '1' : '0'));
  mark('modeRow', cfg.mode);
  mark('gradeRow', cfg.grade);
  mark('durRow', cfg.dur);
}
function setTgt(t, c){ cfg.tgt = t; cfg.cameo = c; buzz(); saveCfg(); }
function setMode(m){ cfg.mode = m; buzz(); saveCfg(); }
function setGrade(g){ cfg.grade = g; buzz(); saveCfg(); }
function setDur(d){ cfg.dur = d; buzz(); saveCfg(); }
function fill(s){ buzz(); document.getElementById('txt').value = s; }
function surprise(){
  const list = [
    "2026-ல் AI Coding கற்றுக்கொண்டால் சம்பளம் எப்படி உயரும்? 2 நண்பர்கள் பேச்சு",
    "Smartphone Battery 2 மடங்கு நீடிக்க 3 Secret Settings",
    "Online Scam-லிருந்து தப்பிக்க 3 Golden Rules — Tamil Awareness"
  ];
  fill(list[Math.floor(Math.random() * list.length)]);
}
function stCls(s){
  s = String(s || "").toLowerCase();
  if (s === "completed" || s === "success" || s === "ready") return "ok";
  if (s === "in_progress" || s === "queued") return "run";
  if (s === "failure" || s === "cancelled") return "err";
  return "";
}
function renderTrack(desks){
  document.getElementById('track').innerHTML = LBLS.map((l, i) => {
    const st = (desks && desks[i] && desks[i].status) || "idle";
    return '<div class="step"><div class="sico ' + stCls(st) + '">' + SVGS[i] + '</div><div class="slbl">' + l + '</div></div>';
  }).join('');
}
renderTrack([]); syncUi();
const es = new EventSource('/api/stream?pin=' + encodeURIComponent(PIN));
es.onmessage = (e) => {
  try {
    const d = JSON.parse(e.data);
    if (d.run_id) document.getElementById('runPill').textContent = 'RUN #' + d.run_id;
    if (d.desks) renderTrack(d.desks);
  } catch {}
};
async function go(){
  const topic = document.getElementById('txt').value.trim();
  const log = document.getElementById('log');
  const btn = document.getElementById('goBtn');
  if (!topic) { log.textContent = '> ⚠️ Enter a topic or tap a recipe first.'; return; }
  buzz();
  btn.disabled = true; btn.textContent = '⏳ Queuing...';
  log.textContent = '> AI Director building scenes (' + cfg.mode + ', ' + cfg.grade + ')...';
  try {
    const r = await fetch('/api/miniapp/render?pin=' + encodeURIComponent(PIN), {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ topic, target: cfg.tgt, cameo: cfg.cameo, mode: cfg.mode, grade: cfg.grade, reel_sec: cfg.dur })
    });
    const d = await r.json();
    log.textContent = d.ok ? '> 🚀 Queued! Commit ' + d.sha + ' | ' + d.mode + ' | ' + d.target : '> ❌ ' + (d.error || 'Failed');
  } catch (err) {
    log.textContent = '> ❌ Network error';
  }
  btn.disabled = false; btn.textContent = '🚀 Start Render';
}
</script></body></html>`;
}

function htmlPage() {
  return `<!doctype html>
<html lang="ta"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>YUNA Video Studio</title>
<style>
  body{margin:0;background:#070913;color:#F8FAFC;font-family:system-ui,sans-serif;padding:18px}
  .card{background:#111827;border:1px solid #1E293B;border-radius:16px;padding:18px;max-width:520px;margin:0 auto 16px}
  h1{font-size:20px;margin:0 0 6px;color:#38BDF8}
  .muted{color:#94A3B8;font-size:13px}
  .row{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}
  button,a.btn{flex:1;min-width:130px;padding:12px 14px;border-radius:10px;border:0;font-weight:700;font-size:14px;cursor:pointer;text-align:center;text-decoration:none}
  .ok{background:#10B981;color:#052E16}
  .warn{background:#F59E0B;color:#1F1300}
  .pri{background:#38BDF8;color:#082F49}
  input{width:100%;box-sizing:border-box;padding:10px;border-radius:8px;border:1px solid #334155;background:#0F172A;color:#fff;margin-top:10px}
  pre{background:#020617;padding:10px;border-radius:8px;font-size:12px;overflow:auto;color:#A5F3FC}
</style></head><body>
<div class="card">
  <h1>YUNA Video Studio</h1>
  <div class="muted">Cloud Render + Approve Gate (No Telegram, No D1)</div>
  <input id="pin" type="password" placeholder="Studio PIN (if set)">
  <div class="row">
    <button class="pri" onclick="loadStatus()">Refresh Status</button>
    <a id="dl" class="btn pri" href="#" style="display:none">Download Pack ZIP</a>
  </div>
  <div class="row">
    <button class="ok" onclick="act('/api/approve',{})">Approve &amp; Tag</button>
    <button class="warn" onclick="act('/api/revise',{chunk:'000'})">Revise 000</button>
    <button class="warn" onclick="act('/api/revise',{chunk:'001'})">Revise 001</button>
  </div>
  <pre id="out">Loading...</pre>
</div>
<script>
const out = document.getElementById('out');
const dl = document.getElementById('dl');
const hdr = () => ({'Content-Type':'application/json','X-Studio-Pin':document.getElementById('pin').value});
async function loadStatus(){
  out.textContent = 'Checking GitHub Actions...';
  const r = await fetch('/api/status', {headers: hdr()});
  const d = await r.json();
  out.textContent = JSON.stringify(d, null, 2);
  if(d.artifact_id){
    dl.style.display='block';
    dl.href='/api/artifact/' + d.artifact_id + '?pin=' + encodeURIComponent(document.getElementById('pin').value);
  }
}
async function act(url, body){
  out.textContent = 'Running...';
  const r = await fetch(url, {method:'POST', headers: hdr(), body: JSON.stringify(body)});
  out.textContent = JSON.stringify(await r.json(), null, 2);
}
loadStatus();
</script><script>if("serviceWorker"in navigator)navigator.serviceWorker.register("/sw.js");</script></body></html>`;
}

async function gh(path, env, opts = {}) {
  return fetch(`https://api.github.com/repos/${OWNER}/${REPO}${path}`, {
    ...opts,
    headers: {
      "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
      "Accept": "application/vnd.github+json",
      "User-Agent": "YUNA-Video-Studio",
      ...(opts.headers || {}),
    },
  });
}

function checkPin(req, url, env) {
  if (!env.STUDIO_PIN) return true;
  const p = req.headers.get("X-Studio-Pin") || url.searchParams.get("pin") || "";
  return p === env.STUDIO_PIN;
}

async function tgApi(env, method, body) {
  return fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/${method}`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body)
  });
}

async function runDirectorAndCommit(env, topic) {
  const VOICES = ["ta-IN-ValluvarNeural","ta-IN-PallaviNeural","ta-SG-VenbaNeural","en-US-AndrewNeural","en-US-AvaNeural","en-IN-PrabhatNeural","en-IN-NeerjaNeural"];
  let cleanScript = topic;
  try {
    const optRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${env.GROQ_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ model: "llama-3.3-70b-versatile", temperature: 0.3, max_tokens: 600, messages: [
        { role: "system", content: "You are a Script Optimizer Agent. Convert ANY raw ChatGPT/Gemini article, notes, or topic into a crisp 90-second 2-or-3-character dialogue script (max 160 words, 6-10 short alternating lines). Strip markdown/URLs/hashtags. Keep the same language (Tamil or English). Format: SPEAKER: line." },
        { role: "user", content: topic }
      ] })
    });
    if (optRes.ok) { const od = await optRes.json(); const t = od.choices?.[0]?.message?.content?.trim(); if (t) cleanScript = t; }
  } catch (_) {}
  const sys = "You are YUNA Video Studio Director. Return ONLY valid JSON with keys: timeline (fps=30, total_sec=90, reel_sec=30, mode in cartoon|cinema|ui_ux, scenes list of 3 scenes part 1..3 covering 0..total_sec with heading,accent), characters (ALWAYS 2 to 3 DISTINCT speakers with different type character|worm, body_color, dress_style hoodie|suit|casual, dress_color, expression, hat none|cap|crown|beanie, hat_color, mustache, hair_color, glasses none|round|shades), dialogue_pipe (6-10 alternating lines: 'SPEAKER|VOICE|PITCH|COLOR|SFX|TEXT', voices ONLY from: ta-IN-ValluvarNeural, ta-IN-PallaviNeural, ta-SG-VenbaNeural, en-US-AndrewNeural, en-US-AvaNeural, en-IN-PrabhatNeural, en-IN-NeerjaNeural).";
  let out = null, lastErr = "unknown";
  for (const model of ["openai/gpt-oss-120b", "llama-3.3-70b-versatile", "llama-3.1-8b-instant"]) {
    try {
      const gr = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${env.GROQ_API_KEY}`, "content-type": "application/json" },
        body: JSON.stringify({ model, response_format: { type: "json_object" }, temperature: 0.2, messages: [{ role: "system", content: sys }, { role: "user", content: `Optimized Script:\n${cleanScript}` }] })
      });
      if (!gr.ok) { lastErr = `${model}:${gr.status}`; continue; }
      const gd = await gr.json();
      let raw = (gd.choices?.[0]?.message?.content || "").trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
      out = JSON.parse(raw);
      if (out && out.timeline) break;
    } catch (e) { lastErr = String(e); }
  }
  if (!out || !out.timeline) throw new Error("Groq director failed: " + lastErr);
  out.timeline.fx_mode = "SAFE";
  out.timeline.fps = 30;
  out.timeline.chunk_sec = 60;
  out.timeline.use_manim = false;
  out.timeline.use_blender = false;
  const tsec = Math.min(300, Math.max(30, parseInt(out.timeline.total_sec || 90, 10) || 90));
  out.timeline.total_sec = tsec;
  out.timeline.reel_sec = Math.min(45, Math.max(15, parseInt(out.timeline.reel_sec || 30, 10) || 30));
  if (!Array.isArray(out.timeline.scenes) || !out.timeline.scenes.length) {
    const s = Math.floor(tsec / 3);
    out.timeline.scenes = [{ part: 1, start_sec: 0, end_sec: s, heading: "Part 1: Hook", accent: "#38BDF8" }, { part: 2, start_sec: s, end_sec: s * 2, heading: "Part 2: Core", accent: "#A855F7" }, { part: 3, start_sec: s * 2, end_sec: tsec, heading: "Part 3: Takeaway", accent: "#22C55E" }];
  } else {
    out.timeline.scenes[0].start_sec = 0;
    out.timeline.scenes[out.timeline.scenes.length - 1].end_sec = tsec;
  }
  if (Array.isArray(out.dialogue_pipe)) {
    const parsed = out.dialogue_pipe.map(r => String(r).split("|", 6).map(x => x.trim())).filter(p => p.length === 6 && p[5]).map(p => ({ speaker: p[0] || "YUNA", voice: VOICES.includes(p[1]) ? p[1] : "ta-IN-ValluvarNeural", pitch: Math.min(1.25, Math.max(0.75, parseFloat(p[2] || "1") || 1.0)), color: /^#[0-9A-Fa-f]{6}$/.test(p[3]) ? p[3] : "#38BDF8", sfx: p[4] || "none", text: p[5] }));
    if (parsed.length) out.dialogue = parsed;
  }
  if (!Array.isArray(out.dialogue) || !out.dialogue.length) {
    out.dialogue = [{ speaker: "KANNAN", voice: "ta-IN-ValluvarNeural", pitch: 1.0, color: "#38BDF8", sfx: "whoosh", text: cleanScript.slice(0, 140) }, { speaker: "YUNA", voice: "ta-IN-PallaviNeural", pitch: 1.05, color: "#A855F7", sfx: "none", text: "Let us explore this step by step!" }];
  } else {
    out.dialogue = out.dialogue.map(d => ({ speaker: String(d.speaker || "YUNA"), voice: VOICES.includes(d.voice) ? d.voice : "ta-IN-ValluvarNeural", pitch: Math.min(1.25, Math.max(0.75, parseFloat(d.pitch || 1) || 1.0)), color: /^#[0-9A-Fa-f]{6}$/.test(d.color || "") ? d.color : "#38BDF8", sfx: d.sfx || "none", text: String(d.text || "").slice(0, 300) }));
  }
  out.characters = (out.characters && typeof out.characters === "object") ? out.characters : {};
  const defaults = [
    { type: "character", body_color: "#38BDF8", dress_style: "suit", dress_color: "#0F172A", expression: "happy", hat: "none", hat_color: "#F59E0B", mustache: "none", hair_color: "#1E293B", glasses: "round" },
    { type: "character", body_color: "#A855F7", dress_style: "hoodie", dress_color: "#312E81", expression: "surprised", hat: "cap", hat_color: "#22C55E", mustache: "none", hair_color: "#0F172A", glasses: "none" }
  ];
  let di = 0;
  for (const d of out.dialogue) { if (!out.characters[d.speaker]) out.characters[d.speaker] = defaults[di++ % 2]; }
  if (Object.keys(out.characters).length < 2) out.characters["YUNA_COHOST"] = defaults[1];
  const ref = await (await gh("/git/ref/heads/main", env)).json();
  const baseSha = ref.object.sha;
  const baseCommit = await (await gh(`/git/commits/${baseSha}`, env)).json();
  const files = { "timeline.json": JSON.stringify(out.timeline, null, 2) + "\n", "characters.json": JSON.stringify(out.characters, null, 2) + "\n", "dialogue.json": JSON.stringify(out.dialogue, null, 2) + "\n" };
  const treeRes = await (await gh("/git/trees", env, { method: "POST", body: JSON.stringify({ base_tree: baseCommit.tree.sha, tree: Object.entries(files).map(([path, content]) => ({ path, mode: "100644", type: "blob", content })) }) })).json();
  const newCommit = await (await gh("/git/commits", env, { method: "POST", body: JSON.stringify({ message: `feat(director): ${topic.slice(0, 50).replace(/\s+/g, " ")}`, tree: treeRes.sha, parents: [baseSha] }) })).json();
  const patchRes = await gh("/git/refs/heads/main", env, { method: "PATCH", body: JSON.stringify({ sha: newCommit.sha }) });
  return { ok: patchRes.ok, sha: (newCommit.sha || "").slice(0, 7) };
}


const escH = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function callAiPool(env, messages, wantJson = false) {
  const groqKeys = [env.GROQ_API_KEY, env.GROQ_API_KEY_2, env.GROQ_API_KEY_3].filter(Boolean);
  const models = wantJson ? ["llama-3.3-70b-versatile", "openai/gpt-oss-120b"] : ["llama-3.1-8b-instant", "llama-3.3-70b-versatile"];
  for (const key of groqKeys) {
    for (const model of models) {
      try {
        const payload = { model, temperature: 0.25, messages };
        if (wantJson) payload.response_format = { type: "json_object" };
        const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (r.ok) {
          const d = await r.json();
          const c = d?.choices?.[0]?.message?.content;
          if (c) return c;
        }
      } catch {}
    }
  }
  if (env.NVIDIA_API_KEY) {
    try {
      const r = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${env.NVIDIA_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "meta/llama-3.3-70b-instruct", temperature: 0.2, messages })
      });
      if (r.ok) {
        const d = await r.json();
        const c = d?.choices?.[0]?.message?.content;
        if (c) return c;
      }
    } catch {}
  }
  throw new Error("All AI pool keys exhausted");
}



async function sendJobStatusCard(env, cid, runId = null) {
  let run = null;
  if (runId) {
    run = await gh(`/actions/runs/${runId}`, env).then(r => r.json()).catch(() => null);
  } else {
    const d = await gh("/actions/runs?per_page=1", env).then(r => r.json()).catch(() => ({}));
    run = (d.workflow_runs || [])[0];
  }
  if (!run || !run.id) { await tgApi(env, "sendMessage", { chat_id: cid, text: "No runs found." }); return; }
  const jd = await gh(`/actions/runs/${run.id}/jobs`, env).then(r => r.json()).catch(() => ({}));
  const jobs = jd.jobs || [];
  const lines = jobs.map(j => {
    const ic = j.conclusion === "success" ? "✅" : j.conclusion === "failure" ? "❌" : j.conclusion === "skipped" ? "⏭️" : j.status === "in_progress" ? "🟡" : "⏸️";
    const sec = j.started_at ? Math.max(0, Math.round(((j.completed_at ? Date.parse(j.completed_at) : Date.now()) - Date.parse(j.started_at)) / 1000)) + "s" : "";
    const failStep = (j.steps || []).find(s => s.conclusion === "failure");
    return `${ic} <b>${escH(j.name)}</b> ${sec ? `(${sec})` : ""}${failStep ? ` → <i>${escH(failStep.name)}</i>` : ""}`;
  });
  const hasFail = jobs.some(j => j.conclusion === "failure");
  const kb = hasFail ? { inline_keyboard: [[{ text: "🔍 View Error Log", callback_data: `view_logs:${run.id}` }, { text: "🔁 Re-Run Failed", callback_data: `rerun_failed:${run.id}` }], [{ text: "🛡️ Retry SAFE Mode", callback_data: "retry_safe" }]] } : undefined;
  await tgApi(env, "sendMessage", {
    chat_id: cid,
    parse_mode: "HTML",
    text: `📊 <b>Run #${escH(run.id)}</b> — <code>${escH(run.conclusion || run.status)}</code>\n${lines.join("\n") || "Starting..."}`,
    ...(kb ? { reply_markup: kb } : {})
  });
}

async function sendFailLogCard(env, cid, runId = null) {
  let rid = runId;
  if (!rid) {
    const d = await gh("/actions/runs?per_page=3", env).then(r => r.json()).catch(() => ({}));
    const fr = (d.workflow_runs || []).find(r => r.conclusion === "failure") || (d.workflow_runs || [])[0];
    rid = fr?.id;
  }
  if (!rid) { await tgApi(env, "sendMessage", { chat_id: cid, text: "No failed run found." }); return; }
  const jd = await gh(`/actions/runs/${rid}/jobs`, env).then(r => r.json()).catch(() => ({}));
  const fj = (jd.jobs || []).find(j => j.conclusion === "failure");
  if (!fj) { await tgApi(env, "sendMessage", { chat_id: cid, text: `Run #${rid} has no failed jobs.` }); return; }
  const fstep = (fj.steps || []).find(s => s.conclusion === "failure")?.name || "unknown";
  const rawLog = await gh(`/actions/jobs/${fj.id}/logs`, env).then(r => r.text()).catch(() => "");
  const tail = rawLog.split(/\r?\n/).filter(Boolean).slice(-12).join("\n").slice(-1600);
  let tamilTip = "";
  try {
    tamilTip = await callAiPool(env, [{ role: "system", content: "Explain this CI error in 1 simple Tamil sentence (with English technical terms). No markdown." }, { role: "user", content: tail }], false);
  } catch {}
  await tgApi(env, "sendMessage", {
    chat_id: cid,
    parse_mode: "HTML",
    text: `🚨 <b>Failed:</b> <code>${escH(fj.name)}</code> → <b>${escH(fstep)}</b>\n${tamilTip ? `💡 <b>காரணம்:</b> ${escH(tamilTip)}\n\n` : ""}<code>${escH(tail || "Log unavailable")}</code>`,
    reply_markup: { inline_keyboard: [[{ text: "🔁 Re-Run Failed Only", callback_data: `rerun_failed:${rid}` }, { text: "🛡️ Retry SAFE Mode", callback_data: "retry_safe" }]] }
  });
}

async function loadCharBible(env) {
  try {
    const r = await gh("/contents/characters_db.json?ref=main", env);
    if (r.ok) {
      const d = await r.json();
      return JSON.parse(decodeURIComponent(escape(atob(String(d.content || "").replace(/\s/g, "")))));
    }
  } catch {}
  return {
    main: { name: "KANNAN", type: "character", body_color: "#38BDF8", dress_style: "suit", expression: "happy", hat: "none", mustache: "none", glasses: "round", voice: "ta-IN-ValluvarNeural" },
    sub: { name: "YUNA", type: "character", body_color: "#A855F7", dress_style: "hoodie", expression: "surprised", hat: "cap", mustache: "none", glasses: "none", voice: "ta-IN-PallaviNeural" },
    cameo: { name: "BUGGY", type: "worm", body_color: "#22C55E", dress_style: "none", expression: "happy", hat: "none", mustache: "none", glasses: "shades", voice: "ta-SG-VenbaNeural" },
    custom: {}
  };
}

async function runDirectorAndCommitV2(env, rawText, target = "both", useCameo = false, opts = {}) {
  let scriptText = String(rawText || "").trim();
  if (scriptText.length > 2500) {
    scriptText = await callAiPool(env, [
      { role: "system", content: "Condense this content into 3-5 punchy spoken scenes (max 200 words total) for 2-3 characters (KANNAN, YUNA, BUGGY) in the same language (Tamil/English). Output plain dialogue lines." },
      { role: "user", content: scriptText.slice(0, 12000) }
    ], false);
  }
  const sys = `Return ONLY valid JSON with keys: timeline, characters, dialogue.
- timeline: { fps: 30, total_sec: "auto", reel_sec: 55, mode: "cartoon"|"cinema"|"ui_ux"|"split_pip", grade: "none"|"cyber"|"warm"|"noir", fx_mode: "HYBRID", render_target: "${target}", use_manim: false, use_blender: false, scenes: [{ part: 1, heading: "...", accent: "#38BDF8", bgTop: "#0F172A" }] }
- characters: dict of 2-3 speakers (e.g. KANNAN, YUNA, BUGGY) with { type: "character"|"worm", body_color: "#38BDF8", dress_style: "suit"|"hoodie"|"casual"|"none", expression: "happy"|"angry"|"surprised"|"neutral", hat: "none"|"cap"|"crown"|"beanie", mustache: "none"|"handlebar"|"thick"|"pencil", glasses: "none"|"round"|"shades", voice: "ta-IN-ValluvarNeural"|"ta-IN-PallaviNeural"|"ta-SG-VenbaNeural"|"en-US-AndrewNeural"|"en-US-AvaNeural" }
- dialogue: list of { speaker, text, sfx: ""|"pop"|"whoosh"|"click"|"ding"|"boing" } (8-14 short lines).`;
  const rawJson = await callAiPool(env, [{ role: "system", content: sys }, { role: "user", content: scriptText.slice(0, 3500) }], true);
  const cleaned = rawJson.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  const parsed = JSON.parse(cleaned);
  const tl = parsed.timeline || {};
  tl.fps = 30;
  tl.total_sec = "auto";
  tl.fx_mode = "HYBRID";
  tl.render_target = ["reel", "yt", "both"].includes(target) ? target : "both";
  tl.use_manim = false;
  tl.use_blender = false;
  if (opts.mode && ["cinema", "cartoon", "ui_ux", "split_pip"].includes(opts.mode)) tl.mode = opts.mode;
  if (!["cinema", "cartoon", "ui_ux", "split_pip"].includes(tl.mode)) tl.mode = "cartoon";
  if (opts.grade && ["none", "cyber", "warm", "noir"].includes(opts.grade)) tl.grade = opts.grade;
  if (opts.reel_sec) tl.reel_sec = Math.min(90, Math.max(20, Number(opts.reel_sec) || 45));
  if (!["none", "cyber", "warm", "noir"].includes(tl.grade)) tl.grade = "cyber";
  if (!Array.isArray(tl.scenes) || !tl.scenes.length) tl.scenes = [{ part: 1, heading: "YUNA Studio", accent: "#38BDF8", bgTop: "#0F172A" }];
  tl.scenes = tl.scenes.map((s, i) => { const rawSt = Number(s.start_sec); const st = Number.isFinite(rawSt) ? rawSt : i * 15; const rawEn = Number(s.end_sec); const en = (Number.isFinite(rawEn) && rawEn > st) ? rawEn : st + 15; return { ...s, part: s.part || i + 1, start_sec: st, end_sec: en }; });
  const bible = await loadCharBible(env);
  const chars = {};
  chars[bible.main.name || "KANNAN"] = bible.main;
  chars[bible.sub.name || "YUNA"] = bible.sub;
  if (useCameo && bible.cameo) chars[bible.cameo.name || "BUGGY"] = bible.cameo;
  const _unusedChars = parsed.characters && Object.keys(parsed.characters).length ? parsed.characters : {
    KANNAN: { type: "character", body_color: "#38BDF8", dress_style: "suit", expression: "happy", hat: "none", mustache: "none", glasses: "round", voice: "ta-IN-ValluvarNeural" },
    YUNA: { type: "character", body_color: "#A855F7", dress_style: "hoodie", expression: "surprised", hat: "cap", mustache: "none", glasses: "none", voice: "ta-IN-PallaviNeural" }
  };
  const dlgRaw = Array.isArray(parsed.dialogue) && parsed.dialogue.length ? parsed.dialogue : [{ speaker: Object.keys(chars)[0], text: scriptText.slice(0, 140), sfx: "pop" }];
  const castKeys = Object.keys(chars);
  const dlg = dlgRaw.slice(0, 10).map((d, i) => ({
    ...d,
    speaker: castKeys.includes(d.speaker) ? d.speaker : castKeys[i % castKeys.length],
    sfx: ["", "pop", "whoosh", "click", "ding", "boing"].includes(d.sfx) ? d.sfx : "pop"
  }));

  let upRes = { ok: false }, ncData = {};
  for (let attempt = 0; attempt < 3; attempt++) {
    const refRes = await gh("/git/ref/heads/main", env);
    const refData = await refRes.json();
    const baseSha = refData?.object?.sha;
    if (!baseSha) throw new Error("Missing main ref");
    const commitRes = await gh(`/git/commits/${baseSha}`, env);
    const baseTree = (await commitRes.json())?.tree?.sha;
    const treeRes = await gh("/git/trees", env, {
      method: "POST",
      body: JSON.stringify({
        base_tree: baseTree,
        tree: [
          { path: "timeline.json", mode: "100644", type: "blob", content: JSON.stringify(tl, null, 2) },
          { path: "characters.json", mode: "100644", type: "blob", content: JSON.stringify(chars, null, 2) },
          { path: "dialogue.json", mode: "100644", type: "blob", content: JSON.stringify(dlg, null, 2) }
        ]
      })
    });
    const treeData = await treeRes.json();
    const ncRes = await gh("/git/commits", env, {
      method: "POST",
      body: JSON.stringify({ message: `feat(director): [${target}] [${tl.mode}]`, tree: treeData.sha, parents: [baseSha] })
    });
    ncData = await ncRes.json();
    upRes = await gh("/git/refs/heads/main", env, { method: "PATCH", body: JSON.stringify({ sha: ncData.sha }) });
    if (upRes.ok) break;
    await new Promise(r => setTimeout(r, 400));
  }
  return { ok: upRes.ok, sha: String(ncData.sha || "").slice(0, 7), mode: tl.mode, grade: tl.grade, lines: dlg.length, target };
}

export default {
  async fetch(req, env, ctx) {
    try {
      const url = new URL(req.url);
      if (url.pathname === "/api/tg/fail") {
        if (!checkPin(req, url, env)) return new Response("Invalid PIN", { status: 401 });
        const rid = url.searchParams.get("run_id") || null;
        if (env.TG_CHAT_ID) await sendFailLogCard(env, String(env.TG_CHAT_ID), rid);
        return Response.json({ ok: true });
      }
      if (url.pathname === "/office") {
        if (!checkPin(req, url, env)) return new Response("Invalid PIN", { status: 401 });
        return new Response(officeMiniAppHtml(url.searchParams.get("pin") || ""), { headers: { "content-type": "text/html; charset=utf-8" } });
      }
      if (url.pathname === "/api/miniapp/render" && req.method === "POST") {
        if (!checkPin(req, url, env)) return Response.json({ error: "Invalid PIN" }, { status: 401 });
        const b = await req.json().catch(() => ({}));
        const topic = String(b.topic || "").trim();
        if (!topic) return Response.json({ error: "Empty topic" }, { status: 400 });
        const res = await runDirectorAndCommitV2(env, topic, String(b.target || "reel"), Boolean(b.cameo), b);
        return Response.json(res);
      }

      if (url.pathname === "/") {
        return new Response(htmlPage(), { headers: { "Content-Type": "text/html; charset=utf-8" } });
      }
      if (url.pathname === "/manifest.json") return new Response(JSON.stringify({ name: "YUNA Studio", short_name: "YUNA", start_url: "/office", display: "standalone", background_color: "#070913", theme_color: "#38BDF8" }), { headers: { "content-type": "application/manifest+json" } });
      if (url.pathname === "/sw.js") return new Response("self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));", { headers: { "content-type": "application/javascript" } });
      if (url.pathname === "/office") {
        const html = `<!doctype html><html><head><link rel="manifest" href="/manifest.json"><meta name="theme-color" content="#38BDF8"></head><body style="background:#0f172a;color:#f8fafc;font-family:sans-serif;padding:24px"><h2>YUNA Virtual AI Office (6 Desks)</h2><div id="desks" style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px"></div><script>const es=new EventSource('/api/stream'+location.search);es.onmessage=e=>{const j=JSON.parse(e.data);document.getElementById('desks').innerHTML=(j.desks||[]).map(d=>'<div style="padding:14px;border-radius:12px;background:#1e293b"><b>'+d.desk+'</b><div>'+d.status+'</div></div>').join('');};</script><script>if("serviceWorker"in navigator)navigator.serviceWorker.register("/sw.js");</script></body></html>`;
        return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
      }
      if (url.pathname === "/api/stream") {
        const r = await gh("/actions/runs?per_page=1", env);
        const run = (await r.json()).workflow_runs?.[0] || {};
        const desks = [
          { desk: "1. Director (Groq)", status: run.status || "idle" },
          { desk: "2. Voice + Beats", status: run.status || "idle" },
          { desk: "3. Manim / Blender", status: "conditional" },
          { desk: "4. Remotion 4.0.250", status: run.conclusion || run.status || "idle" },
          { desk: "5. Merge + -14 LUFS", status: run.conclusion || "pending" },
          { desk: "6. Social + APK", status: "ready" }
        ];
        return new Response("retry: 15000\ndata: " + JSON.stringify({ run_id: run.id, desks }) + "\n\n", { headers: { "content-type": "text/event-stream", "cache-control": "no-cache" } });
      }
      if (url.pathname === "/api/apk/dispatch" && req.method === "POST") {
        const b = await req.json();
        const mode = ["SAFE", "HYBRID", "PRO"].includes(b.fx_mode) ? b.fx_mode : "SAFE";
        const res = await gh("/actions/workflows/render.yml/dispatches", env, { method: "POST", body: JSON.stringify({ ref: "main", inputs: { only_chunk: String(b.only_chunk || "") } }) });
        return new Response(JSON.stringify({ ok: res.ok, fx_mode: mode }), { status: res.ok ? 200 : 502, headers: { "content-type": "application/json" } });
      }
      if (url.pathname === "/api/ig/webhook") {
        if (req.method === "GET") {
          if (url.searchParams.get("hub.verify_token") === env.IG_VERIFY_TOKEN) return new Response(url.searchParams.get("hub.challenge") || "ok");
          return new Response("Forbidden", { status: 403 });
        }
        const ev = await req.json().catch(() => ({}));
        const cid = ev?.entry?.[0]?.changes?.[0]?.value?.id;
        if (cid && env.IG_USER_ID && env.IG_ACCESS_TOKEN) {
          await fetch(`https://graph.facebook.com/v21.0/${env.IG_USER_ID}/messages?access_token=${env.IG_ACCESS_TOKEN}`, {
            method: "POST", headers: { "content-type": "application/json" },
            body: JSON.stringify({ recipient: { comment_id: cid }, message: { text: "Check your DM for the YUNA Studio link!" } })
          });
        }
        return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
      }
      if (url.pathname === "/api/tg/webhook" && req.method === "POST") {
        const upd = await req.json().catch(() => ({}));
        const work = (async () => {
          try {
            const cb = upd.callback_query;
            if (cb) {
              const cid = String(cb.message?.chat?.id || "");
              if (!env.TG_CHAT_ID || cid !== String(env.TG_CHAT_ID)) return;
              if (cb.data === "approve") {
                const r = await gh("/actions/runs?per_page=1", env);
                const run = ((await r.json()).workflow_runs || [])[0];
                const tag = `approved-${run ? run.id : Date.now()}`;
                await gh("/releases", env, { method: "POST", body: JSON.stringify({ tag_name: tag, name: `Approved ${tag}`, target_commitish: "main" }) });
                await tgApi(env, "sendMessage", { chat_id: cid, parse_mode: "HTML", text: `✅ <b>Approved &amp; Tagged:</b> <code>${escH(tag)}</code>` });
                            } else if (cb.data.startsWith("rerun_failed:")) {
                const rid = cb.data.split(":")[1];
                const rr = await gh(`/actions/runs/${rid}/rerun-failed-jobs`, env, { method: "POST" });
                await tgApi(env, "sendMessage", { chat_id: cid, parse_mode: "HTML", text: rr.ok ? `🔁 <b>Re-running failed jobs for #${escH(rid)}!</b>` : `❌ Re-run failed (${rr.status})` });
              } else if (cb.data.startsWith("view_logs:")) {
                await sendFailLogCard(env, cid, cb.data.split(":")[1]);
              } else if (cb.data === "retry_safe") {
                const f = await gh("/contents/timeline.json?ref=main", env).then(x => x.json());
                const tl = JSON.parse(decodeURIComponent(escape(atob(String(f.content || "").replace(/\s/g, "")))));
                tl.fx_mode = "SAFE"; tl.use_manim = false; tl.use_blender = false;
                await gh("/contents/timeline.json", env, { method: "PUT", body: JSON.stringify({ message: "chore(retry): SAFE mode fallback", content: btoa(unescape(encodeURIComponent(JSON.stringify(tl, null, 2)))), sha: f.sha }) });
                await tgApi(env, "sendMessage", { chat_id: cid, parse_mode: "HTML", text: "🛡️ <b>Retrying in SAFE Mode!</b>" });
              }
              }
              await tgApi(env, "answerCallbackQuery", { callback_query_id: cb.id });
              return;
            }
            const msg = upd.message;
            const cid = String(msg?.chat?.id || "");
            if (!cid || !env.TG_CHAT_ID || cid !== String(env.TG_CHAT_ID)) return;
            let txt = String(msg?.text || msg?.caption || "").trim();
            if (!txt && msg?.voice && env.TG_BOT_TOKEN) {
              const gf = await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/getFile?file_id=${msg.voice.file_id}`).then(r => r.json());
              const fp = gf?.result?.file_path;
              if (fp) {
                const audioBlob = await fetch(`https://api.telegram.org/file/bot${env.TG_BOT_TOKEN}/${fp}`).then(r => r.blob());
                for (const gk of [env.GROQ_API_KEY, env.GROQ_API_KEY_2, env.GROQ_API_KEY_3].filter(Boolean)) {
                  const fd = new FormData();
                  fd.append("file", audioBlob, "voice.ogg");
                  fd.append("model", "whisper-large-v3-turbo");
                  const tr = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", { method: "POST", headers: { "Authorization": `Bearer ${gk}` }, body: fd }).then(r => r.json()).catch(() => ({}));
                  if (tr?.text) { txt = "/reel " + tr.text; break; }
                }
              }
            }
            if (!txt && Array.isArray(msg?.photo) && msg.photo.length && env.TG_BOT_TOKEN) {
              const fid = msg.photo[msg.photo.length - 1].file_id;
              const gf = await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/getFile?file_id=${fid}`).then(r => r.json());
              const fp = gf?.result?.file_path;
              if (fp) {
                const imgUrl = `https://api.telegram.org/file/bot${env.TG_BOT_TOKEN}/${fp}`;
                for (const gk of [env.GROQ_API_KEY, env.GROQ_API_KEY_2, env.GROQ_API_KEY_3].filter(Boolean)) {
                  const vr = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${gk}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ model: "meta-llama/llama-4-scout-17b-16e-instruct", temperature: 0.3, messages: [{ role: "user", content: [{ type: "text", text: "Write a punchy 60-sec Tamil+English product promo script with 2 speakers (KANNAN, YUNA) for this product." }, { type: "image_url", image_url: { url: imgUrl } }] }] })
                  }).then(r => r.json()).catch(() => ({}));
                  const desc = vr?.choices?.[0]?.message?.content;
                  if (desc) { txt = "/reel " + desc; break; }
                }
              }
            }
            if (!txt && msg?.document && env.TG_BOT_TOKEN) {
              const gf = await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/getFile?file_id=${msg.document.file_id}`).then(r => r.json());
              const fp = gf?.result?.file_path;
              if (fp) txt = await fetch(`https://api.telegram.org/file/bot${env.TG_BOT_TOKEN}/${fp}`).then(r => r.text()).then(t => t.slice(0, 15000));
            }
            if (!txt) { await tgApi(env, "sendMessage", { chat_id: cid, text: "Text, Script, or .txt file அனுப்புங்கள் (/reel, /yt, /both, /status, /cancel)." }); return; }
            if (txt === "/start" || txt === "/help") {
              await tgApi(env, "sendMessage", {
                chat_id: cid,
                parse_mode: "HTML",
                text: "🎬 <b>YUNA 2050 Studio Live!</b>\n• <code>/reel &lt;script&gt;</code> — 9:16 மட்டும் (அதிவேகம்)\n• <code>/yt &lt;script&gt;</code> — 16:9 மட்டும்\n• <code>/both &lt;script&gt;</code> — இரண்டும் (Text / .txt / Voice / Photo)\n• <code>/status</code> | <code>/cancel</code>",
                reply_markup: { inline_keyboard: [[{ text: "🎛️ Open Studio Mini App", web_app: { url: "https://yuna-video-studio.masskannan719.workers.dev/office?pin=yuna2026" } }]] }
              });
              return;
            }
            if (txt === "/cast") {
              const b = await loadCharBible(env);
              await tgApi(env, "sendMessage", { chat_id: cid, parse_mode: "HTML", text: `🎭 <b>Saved Character Bible</b>\n• <b>Main:</b> <code>${escH(b.main.name)}</code> (${escH(b.main.dress_style)}, ${escH(b.main.voice)})\n• <b>Sub:</b> <code>${escH(b.sub.name)}</code> (${escH(b.sub.dress_style)}, ${escH(b.sub.voice)})\n• <b>Cameo:</b> <code>${escH(b.cameo?.name || "BUGGY")}</code> (${escH(b.cameo?.type || "worm")})\n\nUse <code>/cameo &lt;script&gt;</code> for 3rd guest, or <code>/addchar NAME suit cap shades</code>` });
              return;
            }
            if (/^\/\s*addchar\b/i.test(txt)) {
              const parts = txt.replace(/^\/\s*addchar\s*/i, "").trim().split(/\s+/);
              const cname = (parts[0] || "GUEST").toUpperCase().slice(0, 14);
              const dress = ["suit","hoodie","casual","none"].includes(parts[1]) ? parts[1] : "casual";
              const hat = ["none","cap","crown","beanie"].includes(parts[2]) ? parts[2] : "none";
              const glasses = ["none","round","shades"].includes(parts[3]) ? parts[3] : "none";
              const b = await loadCharBible(env);
              b.cameo = { name: cname, type: "character", body_color: "#F59E0B", dress_style: dress, expression: "happy", hat, mustache: "none", glasses, voice: "ta-SG-VenbaNeural" };
              const r = await gh("/contents/characters_db.json?ref=main", env).then(x => x.json()).catch(() => ({}));
              await gh("/contents/characters_db.json", env, { method: "PUT", body: JSON.stringify({ message: `chore(cast): update cameo ${cname} [skip ci]`, content: btoa(unescape(encodeURIComponent(JSON.stringify(b, null, 2)))), sha: r.sha }) });
              await tgApi(env, "sendMessage", { chat_id: cid, parse_mode: "HTML", text: `✅ <b>Cameo Saved:</b> <code>${escH(cname)}</code> (${dress}, ${hat}, ${glasses})` });
              return;
            }
            if (txt === "/status") {
              await sendJobStatusCard(env, cid);
              return;
            }
            if (txt === "/logs") {
              await sendFailLogCard(env, cid);
              return;
            }
            if (txt === "/cancel") {
              const r = await gh("/actions/runs?per_page=1", env);
              const run = ((await r.json()).workflow_runs || [])[0];
              if (run && run.status !== "completed") {
                await gh(`/actions/runs/${run.id}/cancel`, env, { method: "POST" });
                await tgApi(env, "sendMessage", { chat_id: cid, parse_mode: "HTML", text: `🛑 <b>Cancelled Run #${escH(run.id)}</b>` });
              } else {
                await tgApi(env, "sendMessage", { chat_id: cid, text: "தற்போது எந்த render-ம் ஓடவில்லை." });
              }
              return;
            }
            let target = "both";
            const useCameo = /^(\/\s*)?cameo\b/i.test(txt);
            if (/^(\/\s*)?(reel|cameo)\b/i.test(txt)) target = "reel";
            else if (/^(\/\s*)?yt\b/i.test(txt)) target = "yt";
            const topic = txt.replace(/^(\/\s*)?(reel|cameo|yt|both|video|script)\s*/i, "").trim();
            if (!topic) { await tgApi(env, "sendMessage", { chat_id: cid, text: "Topic அல்லது Script-ஐச் சேர்த்து அனுப்புங்கள்!" }); return; }
            await tgApi(env, "sendMessage", { chat_id: cid, parse_mode: "HTML", text: `⚡ <b>Target:</b> <code>${target.toUpperCase()}</code> | <b>FX:</b> <code>HYBRID</code>\nAI Director script-ஐத் தயார் செய்கிறது...` });
            const res = await runDirectorAndCommitV2(env, topic, target, useCameo);
            await tgApi(env, "sendMessage", { chat_id: cid, parse_mode: "HTML", text: res.ok ? `🚀 <b>Render Queued!</b>\nCommit: <code>${escH(res.sha)}</code> | Mode: <code>${escH(res.mode)}</code> | Grade: <code>${escH(res.grade)}</code>\nLines: ${res.lines} | Target: <code>${escH(res.target)}</code>` : "❌ GitHub commit failed!" });
          } catch (err) {
            if (env.TG_CHAT_ID) await tgApi(env, "sendMessage", { chat_id: String(env.TG_CHAT_ID), text: `Director error: ${String(err).slice(0, 200)}` }).catch(() => {});
          }
        })();
        if (ctx && typeof ctx.waitUntil === "function") ctx.waitUntil(work);
        else await work;
        return new Response("ok");
      }
      if (!checkPin(req, url, env)) {
        return Response.json({ error: "Invalid PIN" }, { status: 401 });
      }
      if (url.pathname === "/api/status") {
        const r = await gh("/actions/runs?per_page=1", env);
        const data = await r.json();
        const run = (data.workflow_runs || [])[0];
        if (!run) return Response.json({ error: "No runs found" });
        const ar = await gh(`/actions/runs/${run.id}/artifacts`, env);
        const ad = await ar.json();
        const pack = (ad.artifacts || []).find((a) => a.name === "pro-studio-delivery-pack");
        return Response.json({
          run_id: run.id, status: run.status, conclusion: run.conclusion,
          commit: (run.head_sha || "").slice(0, 7), artifact_id: pack ? pack.id : null,
        });
      }
      if (url.pathname.startsWith("/api/artifact/")) {
        const id = url.pathname.split("/").pop();
        const r = await gh(`/actions/artifacts/${id}/zip`, env, { redirect: "manual" });
        const loc = r.headers.get("location");
        if (!loc) return Response.json({ error: "Artifact unavailable" }, { status: 404 });
        return fetch(loc);
      }
      if (url.pathname === "/api/revise" && req.method === "POST") {
        const body = await req.json().catch(() => ({}));
        const r = await gh("/actions/workflows/render.yml/dispatches", env, {
          method: "POST",
          body: JSON.stringify({ ref: "main", inputs: { only_chunk: String(body.chunk || "") } }),
        });
        return Response.json({ ok: r.status === 204, status: r.status, chunk: body.chunk || "all" });
      }
      if (url.pathname === "/api/approve" && req.method === "POST") {
        const r = await gh("/actions/runs?per_page=1", env);
        const run = ((await r.json()).workflow_runs || [])[0];
        const tag = `approved-${run ? run.id : Date.now()}`;
        const rel = await gh("/releases", env, {
          method: "POST",
          body: JSON.stringify({ tag_name: tag, name: `Approved ${tag}`, target_commitish: "main" }),
        });
        return Response.json({ ok: rel.ok, tag, status: rel.status });
      }
      return Response.json({ error: "Not found" }, { status: 404 });
    } catch (e) {
      return Response.json({ error: String(e) }, { status: 500 });
    }
  },
};
