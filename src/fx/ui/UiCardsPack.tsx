import React from "react";
import { useCurrentFrame } from "remotion";
import { FxConfig, FxMode, shouldRenderFx } from "../core/FxRegistry";
import { getRangeProgress } from "../core/FrameContext";
import { clampToSafeZone, ProfileAspect } from "../core/SafeZoneResolver";
export const CountdownRing: React.FC<{config?: FxConfig; fxMode: FxMode; startFrame: number; durationFrames: number; aspect: ProfileAspect}> = ({config, fxMode, startFrame, durationFrames, aspect}) => {
  const frame = useCurrentFrame();
  if (!shouldRenderFx(config, fxMode, "countdown_ring")) return null;
  const p = getRangeProgress(frame, startFrame, durationFrames);
  const pos = clampToSafeZone(0.88, 0.18, aspect);
  const c = 2 * Math.PI * 36;
  return <svg width={90} height={90} style={{position:"absolute",left:`${pos.x*100}%`,top:`${pos.y*100}%`,transform:"translate(-50%,-50%)",pointerEvents:"none"}}><circle cx={45} cy={45} r={36} stroke="rgba(255,255,255,0.2)" strokeWidth={6} fill="none" /><circle cx={45} cy={45} r={36} stroke="#38BDF8" strokeWidth={6} fill="none" strokeDasharray={c} strokeDashoffset={c*(1-p)} /></svg>;
};
