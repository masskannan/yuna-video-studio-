import React from "react";
import { useCurrentFrame } from "remotion";
import { FxConfig, FxMode, shouldRenderFx } from "../core/FxRegistry";
import { getRangeProgress } from "../core/FrameContext";
export const PriceSlashOffer: React.FC<{config?: FxConfig; fxMode: FxMode; oldPrice: string; newPrice: string}> = ({config, fxMode, oldPrice, newPrice}) => {
  const frame = useCurrentFrame();
  if (!shouldRenderFx(config, fxMode, "price_slash_offer")) return null;
  const p = getRangeProgress(frame, 0, 18);
  return <div style={{position:"absolute",bottom:140,right:80,background:"#111827",padding:"12px 18px",borderRadius:12,color:"#FFF",opacity:p}}><span style={{textDecoration:"line-through",opacity:0.6,marginRight:10}}>{oldPrice}</span><span style={{color:"#22C55E",fontWeight:800,fontSize:26}}>{newPrice}</span></div>;
};
export const FiveStarCard: React.FC<{config?: FxConfig; fxMode: FxMode; rating?: number; quote: string}> = ({config, fxMode, rating = 5, quote}) => {
  if (!shouldRenderFx(config, fxMode, "five_star_reviews")) return null;
  const stars = "★".repeat(Math.max(1, Math.min(5, Math.round(rating))));
  return <div style={{position:"absolute",top:140,left:80,background:"rgba(15,23,42,0.88)",padding:"12px 18px",borderRadius:12,color:"#FACC15",maxWidth:420}}><div>{stars}</div><div style={{color:"#FFF",fontSize:16,marginTop:4}}>{quote}</div></div>;
};
