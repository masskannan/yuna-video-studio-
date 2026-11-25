import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FxConfig, FxMode, shouldRenderFx } from "../core/FxRegistry";
import { getRangeProgress } from "../core/FrameContext";
export const SpotlightMask: React.FC<{config?: FxConfig; fxMode: FxMode}> = ({config, fxMode}) => {
  const frame = useCurrentFrame();
  if (!shouldRenderFx(config, fxMode, "spotlight_focus_mask")) return null;
  const p = getRangeProgress(frame, 0, 20);
  return <AbsoluteFill style={{pointerEvents:"none",background:`radial-gradient(circle at 50% 50%, transparent 18%, rgba(0,0,0,${0.65*p}) 55%)`}} />;
};
