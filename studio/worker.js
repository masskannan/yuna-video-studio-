const OWNER = "masskannan";
const REPO = "yuna-video-studio-";

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

export default {
  async fetch(req, env) {
    try {
      const url = new URL(req.url);
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
        try {
          const upd = await req.json().catch(() => ({}));
          const cb = upd.callback_query;
          if (cb) {
            const cid = String(cb.message?.chat?.id || "");
            if (!env.TG_CHAT_ID || cid !== String(env.TG_CHAT_ID)) return new Response("ok");
            if (cb.data === "approve") {
              const r = await gh("/actions/runs?per_page=1", env);
              const run = ((await r.json()).workflow_runs || [])[0];
              const tag = `approved-${run ? run.id : Date.now()}`;
              await gh("/releases", env, { method: "POST", body: JSON.stringify({ tag_name: tag, name: `Approved ${tag}`, target_commitish: "main" }) });
              await tgApi(env, "sendMessage", { chat_id: cid, text: `Approved & Tagged: ${tag}` });
            }
            await tgApi(env, "answerCallbackQuery", { callback_query_id: cb.id });
            return new Response("ok");
          }
          const msg = upd.message;
          const cid = String(msg?.chat?.id || "");
          if (!cid || !env.TG_CHAT_ID || cid !== String(env.TG_CHAT_ID)) return new Response("ok");
          const txt = String(msg?.text || "").trim();
          if (!txt) { await tgApi(env, "sendMessage", { chat_id: cid, text: "Please send text/script (voice or media is not supported yet)." }); return new Response("ok"); }
          if (txt === "/start" || txt === "/help") {
            await tgApi(env, "sendMessage", { chat_id: cid, text: "YUNA Video Studio Ready! Paste ANY topic or ChatGPT/Gemini content, or send /status." });
            return new Response("ok");
          }
          if (txt === "/status") {
            const r = await gh("/actions/runs?per_page=1", env);
            const run = ((await r.json()).workflow_runs || [])[0] || {};
            await tgApi(env, "sendMessage", { chat_id: cid, text: `Run ${run.id || "-"}: ${run.status || "none"} (${run.conclusion || "running"})` });
            return new Response("ok");
          }
          const topic = txt.replace(/^\/(video|script)\s*/i, "").trim().slice(0, 4000);
          if (!topic) { await tgApi(env, "sendMessage", { chat_id: cid, text: "Please send your topic or paste your ChatGPT/Gemini content directly!" }); return new Response("ok"); }
          await tgApi(env, "sendMessage", { chat_id: cid, text: "Stage 1: Optimizing script (2-3 characters) & Stage 2: Starting 5G parallel render..." });
          const res = await runDirectorAndCommit(env, topic);
          await tgApi(env, "sendMessage", { chat_id: cid, text: res.ok ? `Render queued (commit ${res.sha})! Preview MP4 will arrive here in ~3-4 mins.` : "GitHub commit failed!" });
        } catch (err) {
          if (env.TG_CHAT_ID) await tgApi(env, "sendMessage", { chat_id: String(env.TG_CHAT_ID), text: `Director error: ${String(err).slice(0, 200)}` }).catch(() => {});
        }
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
