import React from "react";
import { useCurrentFrame } from "remotion";
import { FxConfig, FxMode, shouldRenderFx } from "../core/FxRegistry";
import { getRangeProgress } from "../core/FrameContext";
export const SvgLineChart: React.FC<{config?: FxConfig; fxMode: FxMode; values?: number[]}> = ({config, fxMode, values = [10,35,28,62,90]}) => {
  const frame = useCurrentFrame();
  if (!shouldRenderFx(config, fxMode, "svg_charts") || values.length < 2) return null;
  const maxVal = Math.max(...values.map((v)=>Math.abs(v)), 1);
  const p = getRangeProgress(frame, 0, 45);
  const pts = values.map((v,i)=>`${((i/(values.length-1))*280).toFixed(1)},${(120-(Math.max(0,v)/maxVal)*100).toFixed(1)}`).join(" ");
  return <svg width={300} height={140} style={{position:"absolute",right:70,bottom:160,backgroundColor:"rgba(15,23,42,0.78)",borderRadius:12,padding:10}}><polyline fill="none" stroke="#38BDF8" strokeWidth={4} points={pts} strokeDasharray={400} strokeDashoffset={400*(1-p)} /></svg>;
};
