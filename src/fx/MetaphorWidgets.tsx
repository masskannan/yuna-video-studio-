import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

export const CardRain40: React.FC<{ title?: string; tag?: string }> = ({ title = "KEY CONCEPTS", tag = "POINT" }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const cards = Array.from({ length: 16 }, (_, i) => {
    const x = ((i * 137) % Math.max(300, width - 140)) + 40;
    const y = ((frame * (3.2 + (i % 4)) + i * 95) % 1080) - 120;
    const rot = ((i * 29) % 56) - 28;
    return { i, x, y, rot };
  });
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 18, overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 210, left: "50%", transform: "translateX(-50%)", padding: "10px 24px", borderRadius: 14, backgroundColor: "rgba(15, 23, 42, 0.92)", border: "2px solid #FACC15", color: "#FACC15", fontSize: 24, fontWeight: 900, boxShadow: "0 0 24px #FACC1555", whiteSpace: "nowrap" }}>
        {title}
      </div>
      {cards.map((c) => (
        <div key={c.i} style={{ position: "absolute", left: c.x, top: c.y, width: 92, height: 46, borderRadius: 8, backgroundColor: "rgba(15, 23, 42, 0.9)", border: "1.5px solid #38BDF8", transform: `rotate(${c.rot}deg)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#E2E8F0", fontSize: 11, fontWeight: 800, opacity: 0.85 }}>
          #{c.i + 1} {tag}
        </div>
      ))}
    </div>
  );
};

export const NeonTopicRow: React.FC<{ topics?: string[] }> = ({ topics }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const list = (Array.isArray(topics) && topics.length ? topics : ["HOOK", "CORE IDEA", "PROOF", "ACTION", "RESULT"]).slice(0, 5);
  const colors = ["#38BDF8", "#EC4899", "#F59E0B", "#22C55E", "#A855F7"];
  return (
    <div style={{ position: "absolute", top: 235, left: 24, right: 24, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 10, zIndex: 25, pointerEvents: "none" }}>
      {list.map((t, i) => {
        const s = spring({ frame: Math.max(0, frame - i * 4), fps, config: { damping: 12 } });
        const c = colors[i % colors.length];
        return (
          <div key={i} style={{ transform: `scale(${s})`, padding: "10px 14px", borderRadius: 10, backgroundColor: "rgba(15, 23, 42, 0.94)", border: `2px solid ${c}`, boxShadow: `0 0 18px ${c}88`, color: "#FFFFFF", fontSize: 16, fontWeight: 900 }}>
            <span style={{ color: c, marginRight: 6 }}>{i + 1}</span>{String(t).toUpperCase().slice(0, 18)}
          </div>
        );
      })}
    </div>
  );
};

export const BusLoadBalancer: React.FC<{ title?: string; items?: string[] }> = ({ title = "SMART FLOW: LIVE ROUTING", items }) => {
  const frame = useCurrentFrame();
  const busX = interpolate(frame % 90, [0, 90], [-180, 950]);
  const badges = (Array.isArray(items) && items.length >= 3 ? items : ["LANE 1: FAST", "LANE 2: SAFE", "LANE 3: PRO"]).slice(0, 3);
  const pills = [
    { label: "DATA", c: "#38BDF8", x: 180 + (frame * 3) % 240, y: 400 },
    { label: "SYNC", c: "#FACC15", x: 420 + (frame * 2.5) % 260, y: 375 },
    { label: "LIVE", c: "#EC4899", x: 620 - (frame * 2) % 200, y: 420 },
  ];
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 24 }}>
      <div style={{ position: "absolute", top: 215, left: "50%", transform: "translateX(-50%)", padding: "8px 20px", borderRadius: 10, backgroundColor: "#0F172A", border: "2px solid #EC4899", color: "#F8FAFC", fontSize: 18, fontWeight: 900, boxShadow: "0 0 20px #EC489966", whiteSpace: "nowrap" }}>
        {title.slice(0, 32)}
      </div>
      <div style={{ position: "absolute", top: 278, left: 60, right: 60, display: "flex", justifyContent: "space-between", gap: 8 }}>
        {badges.map((b, i) => (
          <div key={i} style={{ padding: "6px 12px", borderRadius: 8, backgroundColor: "#FACC15", color: "#020617", fontSize: 14, fontWeight: 900, border: "2px solid #0F172A" }}>{String(b).slice(0, 16)}</div>
        ))}
      </div>
      {pills.map((p, i) => (
        <div key={i} style={{ position: "absolute", left: p.x, top: p.y, padding: "4px 12px", borderRadius: 999, backgroundColor: p.c, color: "#020617", fontSize: 13, fontWeight: 900, border: "2px solid #0F172A" }}>{p.label}</div>
      ))}
      <div style={{ position: "absolute", top: 475, left: busX, width: 170, height: 60, borderRadius: 12, backgroundColor: "#0284C7", border: "3px solid #0F172A", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF", fontWeight: 900, fontSize: 14 }}>
        YUNA EXPRESS
      </div>
    </div>
  );
};

export const HotelMenuCard: React.FC<{ title?: string; items?: string[] }> = ({ title = "KEY BREAKDOWN", items }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 14 } });
  const rows = (Array.isArray(items) && items.length ? items : ["1. Understand the Core", "2. Spot the Pattern", "3. Apply in Practice"]).slice(0, 4);
  return (
    <div style={{ position: "absolute", top: 215, left: "50%", transform: `translateX(-50%) scale(${s})`, width: 440, padding: "18px 22px", borderRadius: 14, backgroundColor: "rgba(15, 23, 42, 0.95)", border: "3px solid #FACC15", boxShadow: "0 16px 36px rgba(0,0,0,0.65)", zIndex: 25, pointerEvents: "none" }}>
      <div style={{ textAlign: "center", color: "#38BDF8", fontSize: 14, fontWeight: 900, marginBottom: 6 }}>YUNA STUDIO BRIEF</div>
      <div style={{ textAlign: "center", color: "#FFFFFF", fontSize: 22, fontWeight: 900, marginBottom: 10, borderBottom: "1px dashed #475569", paddingBottom: 6 }}>{title.slice(0, 28)}</div>
      {rows.map((item, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", color: "#E2E8F0", fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
          <span>{String(item).slice(0, 34)}</span><span style={{ color: "#4ADE80" }}>✓</span>
        </div>
      ))}
    </div>
  );
};

export const PaymentStampCard: React.FC<{ title?: string; items?: string[] }> = ({ title = "ACTION SUMMARY", items }) => {
  const frame = useCurrentFrame();
  const rot = frame * 8;
  const rows = (Array.isArray(items) && items.length >= 2 ? items : ["Step 1: Problem Identified", "Step 2: Solution Verified"]).slice(0, 2);
  return (
    <div style={{ position: "absolute", top: 225, left: "50%", transform: "translateX(-50%)", width: 440, padding: 20, borderRadius: 16, backgroundColor: "rgba(248, 250, 252, 0.96)", border: "3px solid #0F172A", boxShadow: "0 20px 44px rgba(0,0,0,0.65)", zIndex: 25, pointerEvents: "none", color: "#0F172A" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 900, fontSize: 19, marginBottom: 12 }}>
        <span>{title.slice(0, 26)}</span>
        <div style={{ width: 22, height: 22, borderRadius: "50%", border: "3px solid #0284C7", borderTopColor: "transparent", transform: `rotate(${rot}deg)` }} />
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: "#1E293B" }}>• {String(rows[0]).slice(0, 38)}</div>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: "#0369A1" }}>• {String(rows[1]).slice(0, 38)}</div>
      <div style={{ display: "inline-block", padding: "6px 14px", border: "3px solid #16A34A", color: "#16A34A", fontWeight: 900, fontSize: 17, transform: "rotate(-5deg)", borderRadius: 6 }}>VERIFIED ✓</div>
    </div>
  );
};
