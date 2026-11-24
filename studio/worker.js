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
</script></body></html>`;
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

export default {
  async fetch(req, env) {
    try {
      const url = new URL(req.url);
      if (url.pathname === "/") {
        return new Response(htmlPage(), { headers: { "Content-Type": "text/html; charset=utf-8" } });
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
