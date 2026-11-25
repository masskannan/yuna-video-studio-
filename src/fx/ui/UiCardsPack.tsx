import React from "react";
import { useCurrentFrame } from "remotion";
import { FxConfig, FxMode, shouldRenderFx } from "../core/FxRegistry";
import { getRangeProgress } from "../core/FrameContext";
import { clampToSafeZone, ProfileAspect } from "../core/SafeZoneResolver";

export const CountdownRing: React.FC<{
  config?: FxConfig;
  fxMode: FxMode;
  startFrame: number;
  durationFrames: number;
  aspect: ProfileAspect;
}> = ({ config, fxMode, startFrame, durationFrames, aspect }) => {
  const frame = useCurrentFrame();
  if (!shouldRenderFx(config, fxMode, "countdown_ring")) return null;
  const p = getRangeProgress(frame, startFrame, durationFrames);
  const pos = clampToSafeZone(0.88, 0.18, aspect);
  const r = 36;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={90} height={90} style={{ position: "absolute", left: `${pos.x * 100}%`, top: `${pos.y * 100}%`, transform: "translate(-50%,-50%)", pointerEvents: "none" }}>
      <circle cx={45} cy={45} r={r} stroke="rgba(255,255,255,0.2)" strokeWidth={6} fill="none" />
      <circle cx={45} cy={45} r={r} stroke="#38BDF8" strokeWidth={6} fill="none" strokeDasharray={circ} strokeDashoffset={circ * (1 - p)} />
    </svg>
  );
};

export const FrostedCard: React.FC<{
  config?: FxConfig;
  fxMode: FxMode;
  title: string;
  body: string;
}> = ({ config, fxMode, title, body }) => {
  if (!shouldRenderFx(config, fxMode, "frosted_glass_cards")) return null;
  return (
    <div style={{
      position: "absolute", bottom: 160, left: 80, maxWidth: 520, padding: "16px 22px",
      borderRadius: 16, backgroundColor: "rgba(15, 23, 42, 0.72)",
      backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.18)", color: "#F8FAFC"
    }}>
      <div style={{ fontWeight: 700, fontSize: 22 }}>{title}</div>
      <div style={{ fontSize: 16, opacity: 0.9, marginTop: 4 }}>{body}</div>
    </div>
  );
};
