import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FxConfig, FxMode, shouldRenderFx } from "../core/FxRegistry";

export const SpeedLinesOverlay: React.FC<{
  config?: FxConfig;
  fxMode: FxMode;
}> = ({ config, fxMode }) => {
  const frame = useCurrentFrame();
  if (!shouldRenderFx(config, fxMode, "weather_speed_lines")) return null;
  const offset = (frame * 24) % 120;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: 0.28 }}>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080">
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={i} x1={(i * 170 + offset) % 1920} y1={0} x2={(i * 170 + offset - 80) % 1920} y2={1080} stroke="#FFFFFF" strokeWidth={2} />
        ))}
      </svg>
    </AbsoluteFill>
  );
};
