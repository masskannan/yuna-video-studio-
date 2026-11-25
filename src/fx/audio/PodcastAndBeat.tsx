import React from "react";
import { useCurrentFrame } from "remotion";
import { FxConfig, FxMode, shouldRenderFx } from "../core/FxRegistry";
export const PodcastSpeakerGlow: React.FC<{config?: FxConfig; fxMode: FxMode; active?: boolean}> = ({config, fxMode, active = true}) => {
  const frame = useCurrentFrame();
  if (!shouldRenderFx(config, fxMode, "podcast_speaking_glow") || !active) return null;
  const pulse = 8 + Math.sin(frame / 4) * 4;
  return <div style={{position:"absolute",inset:24,borderRadius:18,border:"3px solid #38BDF8",boxShadow:`0 0 ${pulse}px #38BDF8`,pointerEvents:"none"}} />;
};
