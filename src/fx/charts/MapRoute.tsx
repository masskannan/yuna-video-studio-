import React from "react";
import { useCurrentFrame } from "remotion";
import { FxConfig, FxMode, shouldRenderFx } from "../core/FxRegistry";
import { getRangeProgress } from "../core/FrameContext";
export const MapRoutePin: React.FC<{config?: FxConfig; fxMode: FxMode}> = ({config, fxMode}) => {
  const frame = useCurrentFrame();
  if (!shouldRenderFx(config, fxMode, "map_pin_route")) return null;
  const p = getRangeProgress(frame, 0, 45);
  return <svg width={240} height={120} style={{position:"absolute",left:80,top:100,background:"rgba(15,23,42,0.8)",borderRadius:10}}><path d="M20,90 Q120,20 220,80" fill="none" stroke="#38BDF8" strokeWidth={4} strokeDasharray={260} strokeDashoffset={260*(1-p)} /></svg>;
};
