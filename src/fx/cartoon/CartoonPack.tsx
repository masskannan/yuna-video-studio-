import React from "react";
import { useCurrentFrame } from "remotion";
import { FxConfig, FxMode, shouldRenderFx } from "../core/FxRegistry";
import { getRangeProgress } from "../core/FrameContext";
export const ComicSpeechBubble: React.FC<{config?: FxConfig; fxMode: FxMode; text: string}> = ({config, fxMode, text}) => {
  const frame = useCurrentFrame();
  if (!shouldRenderFx(config, fxMode, "comic_speech_bubbles")) return null;
  const s = 0.85 + 0.15 * getRangeProgress(frame, 0, 12);
  return <div style={{position:"absolute",top:110,left:120,transform:`scale(${s})`,background:"#FFF",color:"#111",padding:"12px 18px",borderRadius:20,border:"3px solid #111",fontWeight:700}}>{text}</div>;
};
export const ComicStarburst: React.FC<{config?: FxConfig; fxMode: FxMode; label: string}> = ({config, fxMode, label}) => {
  const frame = useCurrentFrame();
  if (!shouldRenderFx(config, fxMode, "comic_starburst")) return null;
  const rot = (frame * 2) % 360;
  return <div style={{position:"absolute",top:90,right:90,padding:"14px 20px",background:"#FACC15",color:"#111",fontWeight:900,borderRadius:12,transform:`rotate(${Math.sin(rot/30)*4}deg)`}}>{label}</div>;
};
export const ChalkHighlight: React.FC<{config?: FxConfig; fxMode: FxMode}> = ({config, fxMode}) => {
  const frame = useCurrentFrame();
  if (!shouldRenderFx(config, fxMode, "chalk_circle_sheen")) return null;
  const p = getRangeProgress(frame, 0, 24);
  return <svg width={180} height={80} style={{position:"absolute",top:200,left:200,pointerEvents:"none"}}><ellipse cx={90} cy={40} rx={80} ry={30} fill="none" stroke="#FDE047" strokeWidth={4} strokeDasharray={360} strokeDashoffset={360*(1-p)} /></svg>;
};
