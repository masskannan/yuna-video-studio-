import React from "react";
import { Lottie } from "@remotion/lottie";
import { FxConfig, FxMode, shouldRenderFx } from "../core/FxRegistry";

export const LottieBadge: React.FC<{
  config?: FxConfig;
  fxMode: FxMode;
  animationData?: React.ComponentProps<typeof Lottie>["animationData"] | null;
  size?: number;
}> = ({ config, fxMode, animationData, size = 120 }) => {
  if (!shouldRenderFx(config, fxMode, "lottie_icons") || !animationData) return null;
  return (
    <div style={{ position: "absolute", top: 48, right: 48, width: size, height: size, pointerEvents: "none" }}>
      <Lottie animationData={animationData} />
    </div>
  );
};
