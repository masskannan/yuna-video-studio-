import React from "react";
import { useCurrentFrame } from "remotion";
import { FxConfig, FxMode, shouldRenderFx } from "../core/FxRegistry";

export const AudioWaveformGlow: React.FC<{config?: FxConfig; fxMode: FxMode; envelope?: number[]}> = ({config, fxMode, envelope = []}) => {
  const frame = useCurrentFrame();
  if (!shouldRenderFx(config, fxMode, "audio_waveform_glow")) return null;
  const amp = envelope[frame] ?? 0.25;
  return <div style={{position:"absolute",bottom:40,left:"50%",transform:"translateX(-50%)",width:220+amp*120,height:10,borderRadius:99,backgroundColor:"#38BDF8",boxShadow:`0 0 ${12+amp*24}px #38BDF8`,pointerEvents:"none"}} />;
};
