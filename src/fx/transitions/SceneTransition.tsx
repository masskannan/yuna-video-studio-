import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FxConfig, FxMode, shouldRenderFx } from "../core/FxRegistry";
import { getRangeProgress } from "../core/FrameContext";
export const SceneTransition: React.FC<{config?: FxConfig; fxMode: FxMode; startFrame: number; durationFrames?: number; kind?: "slide"|"wipe"|"flip"}> = ({config, fxMode, startFrame, durationFrames = 15, kind = "wipe"}) => {
  const frame = useCurrentFrame();
  if (!shouldRenderFx(config, fxMode, "scene_transitions")) return null;
  const p = getRangeProgress(frame, startFrame, durationFrames);
  if (p <= 0 || p >= 1) return null;
  return <AbsoluteFill style={{backgroundColor:"rgba(15,23,42,0.35)",transform:kind==="slide"?`translateX(${(1-p)*100}%)`:undefined,clipPath:kind==="wipe"?`inset(0 ${(1-p)*100}% 0 0)`:undefined,pointerEvents:"none"}} />;
};
