import { FxLayer } from "./fx/FxLayer";
import { SplitPip } from "./modes/SplitPip";
import { CounterHook } from "./modes/CounterHook";
import { SafeZoneGuide } from "./SafeZoneGuide";
import { OverlayLayer } from "./OverlayLayer";
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import timelineRaw from "../timeline.json";
import brandRaw from "../brand.json";
import charsRaw from "../characters.json";
import wordsRaw from "./words.json";
import lipsyncRaw from "./lipsync.json";
import { Captions } from "./Captions";
import { CharacterRig, CharConfig } from "./rig/CharacterRig";
import { UiUxOverlay } from "./modes/UiUxOverlay";

const timeline = timelineRaw as Record<string, any>;
const brand = brandRaw as Record<string, any>;
const characters = charsRaw as Record<string, CharConfig>;
const words = ((wordsRaw as any[]) || []).map((w) => Array.isArray(w) ? { start: Number(w[0]), end: Number(w[1]), word: String(w[2]), speaker: w[3], color: w[4] } : w);
const lipsync = ((lipsyncRaw as any[]) || []).map((l) => Array.isArray(l) ? { start: Number(l[0]), end: Number(l[1]), mouth: String(l[2]), speaker: String(l[3] || 'YUNA') } : l);
const BG_TINTS = ["#171333", "#261136", "#0D2B2E", "#2B1612", "#1A2238", "#2E1A2B"];

type SubScene = { part: number; heading: string; accent: string; startFrame: number; endFrame: number; bgTop: string; };

function buildSubScenes(fps: number, durationInFrames: number): SubScene[] {
  const raw = Array.isArray(timeline.scenes) ? timeline.scenes : [];
  if (!raw.length) {
    return [{ part: 1, heading: brand.name || "YUNA Studio", accent: brand.primary_color || "#38BDF8", startFrame: 0, endFrame: durationInFrames, bgTop: brand.bg_top || BG_TINTS[0] }];
  }
  const out: SubScene[] = [];
  const stepFrames = fps * 10;
  raw.forEach((s: any, idx: number) => {
    const sStart = Math.round((s.start_sec ?? 0) * fps);
    const sEnd = Math.min(durationInFrames, Math.round((s.end_sec ?? (s.start_sec ?? 0) + 30) * fps));
    if (sStart >= durationInFrames || sEnd <= sStart) return;
    const heading = s.heading || s.title || "";
    const accent = s.accent || brand.primary_color || "#38BDF8";
    const part = s.part || idx + 1;
    let cur = sStart;
    while (cur < sEnd) {
      const nxt = Math.min(sEnd, cur + stepFrames);
      out.push({ part, heading, accent, startFrame: cur, endFrame: nxt, bgTop: BG_TINTS[out.length % BG_TINTS.length] });
      cur = nxt;
    }
  });
  if (out.length) out[out.length - 1].endFrame = durationInFrames;
  return out;
}

export const MainMovie: React.FC<{ wide?: boolean }> = ({ wide = true }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const time = frame / fps;
  const mode = String(timeline.mode || "cinema");
  const scenes = buildSubScenes(fps, durationInFrames);
  const totalParts = Array.isArray(timeline.scenes) && timeline.scenes.length ? timeline.scenes.length : 1;
  const bgBottom = brand.bg_bottom || "#070913";
  const gradeMap: Record<string, string> = { cyber: "contrast(1.12) saturate(1.25) hue-rotate(-8deg)", warm: "sepia(0.18) saturate(1.15) contrast(1.05)", noir: "grayscale(1) contrast(1.25)", none: "none" };
  const gradeFilter = gradeMap[String(timeline.grade || "none")] || "none";
  const primary = brand.primary_color || "#38BDF8";

  const active = scenes.find((s) => frame >= s.startFrame && frame < s.endFrame) || scenes[scenes.length - 1];
  const partScenes = scenes.filter((s) => s.part === active.part);
  const partStart = partScenes[0]?.startFrame ?? 0;
  const partEnd = partScenes[partScenes.length - 1]?.endFrame ?? durationInFrames;
  const partDur = Math.max(4, partEnd - partStart);
  const hFade = Math.max(1, Math.min(10, Math.floor(partDur / 3)));
  const pop = spring({ frame: Math.max(0, frame - partStart), fps, config: { damping: 14, stiffness: 130 } });
  const headingOpacity = interpolate(frame, [partStart, partStart + hFade, partEnd - hFade, partEnd], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const prog = interpolate(frame, [0, Math.max(1, durationInFrames)], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const introFrames = Math.min(45, Math.floor(durationInFrames * 0.15));
  const iFade = Math.max(1, Math.min(10, Math.floor(introFrames / 3)));
  const introOpacity = introFrames >= 4 && frame < introFrames
    ? interpolate(frame, [0, iFade, introFrames - iFade, introFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 0;
  const outroStart = Math.max(introFrames + 30, durationInFrames - 60);
  const outroEnd = Math.min(durationInFrames, outroStart + 15);
  const outroOpacity = frame >= outroStart
    ? (outroEnd > outroStart ? interpolate(frame, [outroStart, outroEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1)
    : 0;

  const activeLip = lipsync.find((l) => time >= l.start && time <= l.end);
  const activeWord = words.find((w) => time >= w.start && time <= w.end + 0.15);
  const activeSpeaker = activeLip?.speaker || activeWord?.speaker || Object.keys(characters)[0] || "YUNA";
  const charEntries = Object.entries(characters).slice(0, 3);

  return (
    <AbsoluteFill style={{ backgroundColor: bgBottom, filter: gradeFilter, overflow: "hidden", fontFamily: '"Noto Sans Tamil", "Space Grotesk", system-ui, sans-serif' }}>
      {scenes.map((sc, idx) => {
        const dur = Math.max(3, sc.endFrame - sc.startFrame);
        const fade = Math.max(1, Math.min(15, Math.floor(dur / 3)));
        if (frame < sc.startFrame - fade || frame > sc.endFrame + fade) return null;
        const opacity = idx === 0 ? 1 : interpolate(frame, [sc.startFrame - fade, sc.startFrame], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const isPunch = Boolean(activeWord?.word && (/[!?]$/.test(activeWord.word) || (activeWord.word.length >= 4 && activeWord.word === activeWord.word.toUpperCase())));
        const shakeX = isPunch ? Math.sin(frame * 1.9) * 4 : 0;
        const shakeY = isPunch ? Math.cos(frame * 2.3) * 3 : 0;
        const zoom = interpolate(frame, [sc.startFrame, sc.endFrame], [1.04, 1.11], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) + (isPunch ? 0.025 : 0);
        const panX = interpolate(frame, [sc.startFrame, sc.endFrame], [idx % 2 === 0 ? -12 : 12, idx % 2 === 0 ? 12 : -12], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const cloudX = (frame * 0.6 + idx * 120) % 1200 - 150;
        const rawSc = (Array.isArray(timeline.scenes) ? timeline.scenes : []).find((rs: any, ri: number) => (rs.part || ri + 1) === sc.part) || {};
        const stg = String(rawSc.setting || (sc as any).setting || (idx % 3 === 0 ? "village_street" : idx % 3 === 1 ? "tea_shop" : "house_room"));
        const tod = String(rawSc.time_of_day || (idx === 0 ? "morning" : idx === 1 ? "sunset" : "night"));
        const sky1 = tod === "night" ? "#0F172A" : tod === "sunset" ? "#7C2D6E" : "#38BDF8";
        const sky2 = tod === "night" ? "#1E1B4B" : tod === "sunset" ? "#F97316" : "#BAE6FD";
        const sky3 = tod === "night" ? "#312E81" : tod === "sunset" ? "#FDE047" : "#FEF3C7";
        return (
          <AbsoluteFill key={idx} style={{ opacity, transform: `scale(${zoom}) translate3d(${panX + shakeX}px, ${shakeY}px, 0)` }}>
            <svg width="100%" height="100%" viewBox="0 0 1080 1920" preserveAspectRatio="xMidYMid slice">
              <defs>
                <linearGradient id={`sky${idx}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={stg === "house_room" ? "#1E293B" : sky1} />
                  <stop offset="60%" stopColor={stg === "house_room" ? "#334155" : sky2} />
                  <stop offset="100%" stopColor={stg === "house_room" ? "#475569" : sky3} />
                </linearGradient>
              </defs>
              <rect width="1080" height="1920" fill={`url(#sky${idx})`} />
              {tod !== "night" && stg !== "house_room" ? (
                <g opacity="0.16">
                  <polygon points="860,240 240,1920 520,1920" fill="#FEF08A" />
                  <polygon points="860,240 680,1920 960,1920" fill="#FEF08A" />
                  <path d={`M ${((frame * 2.1 + 120) % 1200) - 80} 310 Q ${((frame * 2.1 + 120) % 1200) - 65} 296 ${((frame * 2.1 + 120) % 1200) - 50} 310`} stroke="#0F172A" strokeWidth="3.5" fill="none" opacity="0.65" />
                  <path d={`M ${((frame * 1.7 + 440) % 1200) - 80} 380 Q ${((frame * 1.7 + 440) % 1200) - 67} 368 ${((frame * 1.7 + 440) % 1200) - 54} 380`} stroke="#0F172A" strokeWidth="3" fill="none" opacity="0.55" />
                </g>
              ) : null}
              {tod === "night" && stg !== "house_room" ? (
                <g>
                  {[0, 1, 2, 3, 4, 5].map((fi) => (
                    <circle key={fi} cx={(160 + fi * 170 + Math.sin(frame * 0.05 + fi) * 35)} cy={(880 + (fi % 3) * 140 + Math.cos(frame * 0.06 + fi) * 28)} r="5" fill="#FDE047" opacity={0.35 + Math.abs(Math.sin(frame * 0.1 + fi)) * 0.55} />
                  ))}
                </g>
              ) : null}
              {tod === "night" && stg !== "house_room" ? (
                <g fill="#FFFFFF" opacity="0.85">
                  <circle cx="140" cy="180" r="3" /><circle cx="310" cy="120" r="4" /><circle cx="520" cy="210" r="3" />
                  <circle cx="720" cy="140" r="4" /><circle cx="940" cy="190" r="3" /><circle cx="860" cy="240" r="65" fill="#FEF08A" opacity="0.22" />
                </g>
              ) : null}
              {tod === "sunset" && stg !== "house_room" ? (
                <g>
                  <path d="M 0 640 Q 540 720 1080 640" stroke="#0F172A" strokeWidth="4" fill="none" />
                  {[120, 260, 400, 540, 680, 820, 960].map((bx, bi) => (
                    <circle key={bi} cx={bx} cy={676 - Math.abs(540 - bx) * 0.06} r="10" fill="#FEF08A" />
                  ))}
                </g>
              ) : null}
              {stg === "house_room" ? (
                <g>
                  <rect x="0" y="1120" width="1080" height="800" fill="#78350F" />
                  <rect x="330" y="260" width="420" height="320" rx="18" fill="#BAE6FD" stroke="#451A03" strokeWidth="16" />
                  <line x1="540" y1="260" x2="540" y2="580" stroke="#451A03" strokeWidth="12" />
                  <line x1="330" y1="420" x2="750" y2="420" stroke="#451A03" strokeWidth="12" />
                  <rect x="140" y="1160" width="800" height="44" rx="14" fill="#92400E" stroke="#451A03" strokeWidth="8" />
                </g>
              ) : (
                <g>
                  <circle cx="860" cy="240" r="85" fill="#FACC15" opacity="0.95" />
                  <g transform={`translate(${cloudX}, 180)`} fill="#FFFFFF" opacity="0.9">
                    <ellipse cx="120" cy="60" rx="90" ry="38" />
                    <ellipse cx="180" cy="45" rx="70" ry="42" />
                  </g>
                  <g transform={`translate(${panX * 0.45}, 0)`}>
                  <path d="M 0 1180 Q 270 960 560 1140 T 1080 1120 L 1080 1920 L 0 1920 Z" fill="#22C55E" />
                  <path d="M 0 1240 Q 420 1100 780 1230 T 1080 1210 L 1080 1920 L 0 1920 Z" fill="#16A34A" />
                  </g>
                  <g transform={`translate(${panX * 0.85}, 0)`}>
                  {/* Village House */}
                  <rect x="90" y="880" width="290" height="260" rx="10" fill="#FEF3C7" stroke="#78350F" strokeWidth="8" />
                  <polygon points="60,890 235,740 410,890" fill="#EA580C" stroke="#7C2D12" strokeWidth="8" />
                  <rect x="195" y="990" width="76" height="150" rx="8" fill="#78350F" />
                  {/* Tea Shop / Second Building */}
                  <rect x="680" y="910" width="320" height="230" rx="10" fill="#E0F2FE" stroke="#1E3A8A" strokeWidth="8" />
                  <polygon points="655,920 840,810 1025,920" fill={stg === "tea_shop" ? "#DC2626" : "#0284C7"} stroke="#0F172A" strokeWidth="8" />
                  {/* Trees */}
                  <rect x="490" y="920" width="28" height="210" fill="#78350F" />
                  <circle cx="504" cy="890" r="78" fill="#15803D" />
                  <circle cx="455" cy="925" r="55" fill="#16A34A" />
                  <circle cx="555" cy="925" r="55" fill="#16A34A" />
                  </g>
                  {/* Village Road */}
                  <polygon points="0,1260 1080,1260 1080,1920 0,1920" fill="#D97706" opacity="0.38" />
                  <rect x="0" y="1240" width="1080" height="680" fill="#334155" opacity="0.65" />
                </g>
              )}
            </svg>
          </AbsoluteFill>
        );
      })}

      <AbsoluteFill style={{ color: "#F8FAFC", padding: wide ? "56px 96px" : "130px 48px", display: "flex", flexDirection: "column", justifyContent: "space-between", zIndex: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ padding: "8px 16px", borderRadius: 999, backgroundColor: "rgba(15, 23, 42, 0.86)", border: "1.5px solid #FACC15", fontSize: wide ? 20 : 21, fontWeight: 900, color: "#FDE047", letterSpacing: 0.6 }}>
            📍 {String(((Array.isArray(timeline.scenes) ? timeline.scenes : []).find((rs: any, ri: number) => (rs.part || ri + 1) === active.part) || {}).location || "YUNA STUDIO").toUpperCase()}
          </div>
          <div style={{ padding: "6px 16px", borderRadius: 999, backgroundColor: "rgba(15, 23, 42, 0.72)", border: `1px solid ${active.accent}88`, fontSize: wide ? 22 : 24, fontWeight: 700 }}>{brand.name || "YUNA Studio"}</div>
        </div>

        {(mode === "cartoon" || mode === "cinema") && charEntries.length ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: wide ? 24 : 38, paddingBottom: wide ? 60 : 280 }}>
            <div style={{ padding: "12px 24px", borderRadius: 16, backgroundColor: "rgba(15, 23, 42, 0.78)", border: `1.5px solid ${active.accent}88`, fontSize: wide ? 36 : 38, fontWeight: 800, textAlign: "center", maxWidth: "92%", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>{active.heading}</div>
            <div style={{ position: "relative", width: "100%", display: "flex", justifyContent: "space-around", alignItems: "flex-end", paddingTop: 26 }}>
            {charEntries.map(([cname, ccfg], cIdx) => {
                const rSc = (Array.isArray(timeline.scenes) ? timeline.scenes : []).find((rs: any, ri: number) => (rs.part || ri + 1) === active.part) || {};
                return (
                  <CharacterRig
                    key={cname}
                    name={cname}
                    cfg={ccfg}
                    mouth={activeSpeaker === cname && activeLip ? activeLip.mouth : "X"}
                    frame={frame}
                    active={activeSpeaker === cname}
                    accent={active.accent}
                    lookDir={cIdx === 0 ? 1 : -1}
                    pose={rSc.pose || (cIdx === 0 ? (active.part % 2 === 1 ? "listen_ear" : "wave") : "hand_on_hip")}
                    prop={rSc.prop || (active.part === 2 ? "headband" : "camera")}
                  />
                );
              })}
            </div>
            <div style={{ width: "92%", height: 14, borderRadius: 999, background: `linear-gradient(90deg, transparent, ${active.accent}, transparent)`, opacity: 0.75 }} />
            </div>
            ) : mode === "split_pip" ? (
          <SplitPip wide={wide} frame={frame} accent={active.accent} heading={active.heading} charName={activeSpeaker} charCfg={characters[activeSpeaker] || charEntries[0]?.[1] || {}} mouth={activeLip ? activeLip.mouth : "X"} />
        ) : mode === "ui_ux" ? (
          <div style={{ paddingBottom: wide ? 70 : 280 }}>
            <UiUxOverlay frame={frame} accent={active.accent} heading={active.heading} wide={wide} />
          </div>
        ) : (
          <div style={{ transform: `scale(${0.94 + pop * 0.06})`, opacity: headingOpacity, textAlign: "center", paddingBottom: wide ? 60 : 220 }}>
            <div style={{ fontSize: wide ? 62 : 52, fontWeight: 800, lineHeight: 1.3, textShadow: "0 4px 24px rgba(0,0,0,0.75)" }}>{active.heading}</div>
          </div>
        )}

        <div style={{ width: "100%", height: 6, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ width: `${prog}%`, height: "100%", backgroundColor: active.accent }} />
        </div>
      </AbsoluteFill>

      {false && introOpacity > 0 ? (
        <AbsoluteFill style={{ opacity: introOpacity, backgroundColor: "rgba(2, 6, 23, 0.88)", justifyContent: "center", alignItems: "center", zIndex: 45 }}>
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ width: 90, height: 6, backgroundColor: active.accent, margin: "0 auto 22px", borderRadius: 4 }} />
            <div style={{ fontSize: wide ? 76 : 64, fontWeight: 800, color: "#FFFFFF" }}>{brand.name || "YUNA Studio"}</div>
            <div style={{ fontSize: wide ? 34 : 30, color: primary, marginTop: 12 }}>{brand.tagline || "AI & Tech in Tamil"}</div>
          </div>
        </AbsoluteFill>
      ) : null}

      {outroOpacity > 0 ? (
        <AbsoluteFill style={{ opacity: outroOpacity, backgroundColor: "rgba(2, 6, 23, 0.88)", justifyContent: "center", alignItems: "center", zIndex: 45 }}>
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: wide ? 64 : 54, fontWeight: 800, color: "#FFFFFF" }}>{brand.outro_text || "Subscribe & Share"}</div>
            <div style={{ width: 120, height: 6, backgroundColor: active.accent, margin: "22px auto 0", borderRadius: 4 }} />
          </div>
        </AbsoluteFill>
      ) : null}

      <div style={{ position: "absolute", left: -40, bottom: -30, width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle, rgba(2,6,23,0.45), transparent 70%)", filter: "blur(3px)", pointerEvents: "none", zIndex: 35 }} />
      <CounterHook />
      <OverlayLayer />
      <Captions />
      <SafeZoneGuide />
          <FxLayer fxMode={(timeline.fx_mode as any) ?? "SAFE"} scenes={timeline.scenes} />
    </AbsoluteFill>
  );
};
