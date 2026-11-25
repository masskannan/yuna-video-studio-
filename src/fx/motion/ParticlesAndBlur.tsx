import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FxConfig, FxMode, shouldRenderFx } from "../core/FxRegistry";

export const BokehBackdrop: React.FC<{config?: FxConfig; fxMode: FxMode}> = ({config, fxMode}) => {
  const frame = useCurrentFrame();
  if (!shouldRenderFx(config, fxMode, "ui_tilt_bokeh")) return null;
  return (
    <AbsoluteFill style={{pointerEvents:"none",opacity:0.25}}>
      {Array.from({length:8}).map((_,i)=><div key={i} style={{position:"absolute",left:`${(i*13+(frame*0.3))%95}%`,top:`${(i*19+Math.sin(frame/20+i)*6)%90}%`,width:48+(i%3)*24,height:48+(i%3)*24,borderRadius:"50%",backgroundColor:"#38BDF8",filter:"blur(6px)"}} />)}
    </AbsoluteFill>
  );
};
