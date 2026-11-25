import React from "react";
import { useCurrentFrame } from "remotion";
import { FxConfig, FxMode, shouldRenderFx } from "../core/FxRegistry";
export const CodeTypingBox: React.FC<{config?: FxConfig; fxMode: FxMode; code: string}> = ({config, fxMode, code}) => {
  const frame = useCurrentFrame();
  if (!shouldRenderFx(config, fxMode, "animated_code_typing")) return null;
  const chars = Math.min(code.length, Math.max(0, Math.floor(frame * 1.5)));
  return <pre style={{position:"absolute",top:100,left:80,background:"#0F172A",color:"#38BDF8",padding:16,borderRadius:10,fontSize:16}}>{code.slice(0, chars)}</pre>;
};
