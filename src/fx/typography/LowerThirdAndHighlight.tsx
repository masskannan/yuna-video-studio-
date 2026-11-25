import React from "react";
import { useCurrentFrame } from "remotion";
import { FxConfig, FxMode, shouldRenderFx } from "../core/FxRegistry";
import { getRangeProgress } from "../core/FrameContext";
import { clampToSafeZone, ProfileAspect } from "../core/SafeZoneResolver";
export const LowerThirdTitle: React.FC<{config?: FxConfig; fxMode: FxMode; aspect: ProfileAspect; title?: string}> = ({config, fxMode, aspect, title}) => {
  const frame = useCurrentFrame();
  if (!shouldRenderFx(config, fxMode, "lower_third_title")) return null;
  const p = getRangeProgress(frame, 0, 20);
  const pos = clampToSafeZone(0.08, 0.78, aspect);
  const label = (typeof config?.label === "string" ? config.label : title) || "YUNA Studio";
  return <div style={{position:"absolute",left:`${pos.x*100}%`,top:`${pos.y*100}%`,opacity:p,transform:`translateY(${(1-p)*18}px)`,backgroundColor:"rgba(15,23,42,0.85)",borderLeft:"5px solid #38BDF8",padding:"10px 18px",borderRadius:8,color:"#FFF",fontWeight:700,fontSize:24,pointerEvents:"none"}}>{label}</div>;
};
