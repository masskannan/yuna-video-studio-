import React from "react";
import { useCurrentFrame } from "remotion";
import { FxConfig, FxMode, shouldRenderFx } from "../core/FxRegistry";
import { getRangeProgress } from "../core/FrameContext";
export const ChatBubble: React.FC<{config?: FxConfig; fxMode: FxMode; sender: string; msg: string}> = ({config, fxMode, sender, msg}) => {
  const frame = useCurrentFrame();
  if (!shouldRenderFx(config, fxMode, "chat_bubbles")) return null;
  const p = getRangeProgress(frame, 0, 12);
  return <div style={{position:"absolute",top:220,right:70,opacity:p,background:"#1E293B",color:"#F8FAFC",padding:"10px 16px",borderRadius:14,maxWidth:360}}><strong>{sender}:</strong> {msg}</div>;
};
export const CursorRipple: React.FC<{config?: FxConfig; fxMode: FxMode; x?: number; y?: number}> = ({config, fxMode, x = 0.5, y = 0.5}) => {
  const frame = useCurrentFrame();
  if (!shouldRenderFx(config, fxMode, "cursor_ripple_drag")) return null;
  const r = 10 + ((frame * 2) % 30);
  return <div style={{position:"absolute",left:`${x*100}%`,top:`${y*100}%`,width:r*2,height:r*2,marginLeft:-r,marginTop:-r,borderRadius:"50%",border:"2px solid #38BDF8",pointerEvents:"none"}} />;
};
