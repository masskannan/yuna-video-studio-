import React from "react";
import { AbsoluteFill } from "remotion";
import { FxConfig, FxMode, shouldRenderFx } from "../core/FxRegistry";
export const CinematicLetterbox: React.FC<{config?: FxConfig; fxMode: FxMode}> = ({config, fxMode}) => {
  if (!shouldRenderFx(config, fxMode, "cinematic_letterbox")) return null;
  const pct = typeof config?.bar_pct === "number" ? Math.max(0.04, Math.min(0.12, config.bar_pct)) : 0.08;
  return <AbsoluteFill style={{pointerEvents:"none"}}><div style={{position:"absolute",top:0,left:0,right:0,height:`${pct*100}%`,backgroundColor:"#000"}} /><div style={{position:"absolute",bottom:0,left:0,right:0,height:`${pct*100}%`,backgroundColor:"#000"}} /></AbsoluteFill>;
};
