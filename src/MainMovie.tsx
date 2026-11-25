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
  const charEntries = Object.entries(characters).slice(0, 2);

  return (
    <AbsoluteFill style={{ backgroundColor: bgBottom, filter: gradeFilter, overflow: "hidden", fontFamily: '"Noto Sans Tamil", "Space Grotesk", system-ui, sans-serif' }}>
      {scenes.map((sc, idx) => {
        const dur = Math.max(3, sc.endFrame - sc.startFrame);
        const fade = Math.max(1, Math.min(15, Math.floor(dur / 3)));
        if (frame < sc.startFrame - fade || frame > sc.endFrame + fade) return null;
        const opacity = idx === 0 ? 1 : interpolate(frame, [sc.startFrame - fade, sc.startFrame], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const zoom = interpolate(frame, [sc.startFrame, sc.endFrame], [1.05, 1.12], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const panX = interpolate(frame, [sc.startFrame, sc.endFrame], [idx % 2 === 0 ? -12 : 12, idx % 2 === 0 ? 12 : -12], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return <AbsoluteFill key={idx} style={{ opacity, background: `radial-gradient(circle at 30% 25%, ${sc.bgTop} 0%, ${bgBottom} 75%)`, transform: `scale(${zoom}) translate3d(${panX}px, 0, 0)` }} />;
      })}

      <AbsoluteFill style={{ color: "#F8FAFC", padding: wide ? "56px 96px" : "96px 48px", display: "flex", flexDirection: "column", justifyContent: "space-between", zIndex: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: wide ? 26 : 28, fontWeight: 700, color: active.accent }}>STAGE {active.part} / {totalParts}</div>
          <div style={{ padding: "6px 16px", borderRadius: 999, backgroundColor: "rgba(15, 23, 42, 0.72)", border: `1px solid ${active.accent}88`, fontSize: wide ? 22 : 24, fontWeight: 700 }}>{brand.name || "YUNA Studio"}</div>
        </div>

        {mode === "cartoon" && charEntries.length ? (
          <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", paddingBottom: wide ? 80 : 320 }}>
            {charEntries.map(([cname, ccfg]) => (
              <CharacterRig
                key={cname}
                name={cname}
                cfg={ccfg}
                mouth={activeSpeaker === cname && activeLip ? activeLip.mouth : "X"}
                frame={frame}
                active={activeSpeaker === cname}
                accent={active.accent}
              />
            ))}
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

      {introOpacity > 0 ? (
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

      <CounterHook />
      <OverlayLayer />
      <Captions />
      <SafeZoneGuide />
    </AbsoluteFill>
  );
};
