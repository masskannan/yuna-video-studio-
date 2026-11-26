import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

export const CardRain40: React.FC<{ title?: string; tag?: string }> = ({ title = "40 CONCEPTS", tag = "CONCEPT" }) => {
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
      <div style={{ position: "absolute", top: 210, left: "50%", transform: "translateX(-50%)", padding: "10px 24px", borderRadius: 14, backgroundColor: "rgba(15, 23, 42, 0.92)", border: "2px solid #FACC15", color: "#FACC15", fontSize: 26, fontWeight: 900, boxShadow: "0 0 24px #FACC1555", whiteSpace: "nowrap" }}>
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
  const list = (Array.isArray(topics) && topics.length ? topics : ["CORE", "SYSTEM", "LOGIC", "SCALE", "RESULT"]).slice(0, 5);
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

export const BusLoadBalancer: React.FC<{ title?: string }> = ({ title = "LOAD BALANCER: SPLITS TRAFFIC" }) => {
  const frame = useCurrentFrame();
  const busX = interpolate(frame % 90, [0, 90], [-180, 950]);
  const pills = [
    { label: "REQ", c: "#38BDF8", x: 180 + (frame * 3) % 240, y: 400 },
    { label: "REQ", c: "#FACC15", x: 420 + (frame * 2.5) % 260, y: 375 },
    { label: "REQ", c: "#EC4899", x: 620 - (frame * 2) % 200, y: 420 },
  ];
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 24 }}>
      <div style={{ position: "absolute", top: 215, left: "50%", transform: "translateX(-50%)", padding: "8px 20px", borderRadius: 10, backgroundColor: "#0F172A", border: "2px solid #EC4899", color: "#F8FAFC", fontSize: 18, fontWeight: 900, boxShadow: "0 0 20px #EC489966", whiteSpace: "nowrap" }}>
        {title}
      </div>
      <div style={{ position: "absolute", top: 278, left: 60, right: 60, display: "flex", justifyContent: "space-between" }}>
        {["BAY 1: 2", "BAY 2: 2", "BAY 3: 1"].map((b, i) => (
          <div key={i} style={{ padding: "6px 14px", borderRadius: 8, backgroundColor: "#FACC15", color: "#020617", fontSize: 15, fontWeight: 900, border: "2px solid #0F172A" }}>{b}</div>
        ))}
      </div>
      {pills.map((p, i) => (
        <div key={i} style={{ position: "absolute", left: p.x, top: p.y, padding: "4px 12px", borderRadius: 999, backgroundColor: p.c, color: "#020617", fontSize: 13, fontWeight: 900, border: "2px solid #0F172A" }}>{p.label}</div>
      ))}
      <div style={{ position: "absolute", top: 475, left: busX, width: 170, height: 60, borderRadius: 12, backgroundColor: "#0284C7", border: "3px solid #0F172A", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF", fontWeight: 900, fontSize: 14 }}>
        EXPRESS BAY
      </div>
    </div>
  );
};

export const HotelMenuCard: React.FC<{ title?: string }> = ({ title = "API: REQUEST → RESPONSE" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 14 } });
  return (
    <div style={{ position: "absolute", top: 215, left: "50%", transform: `translateX(-50%) scale(${s})`, width: 420, padding: "18px 22px", borderRadius: 14, backgroundColor: "rgba(15, 23, 42, 0.95)", border: "3px solid #FACC15", boxShadow: "0 16px 36px rgba(0,0,0,0.65)", zIndex: 25, pointerEvents: "none" }}>
      <div style={{ textAlign: "center", color: "#38BDF8", fontSize: 14, fontWeight: 900, marginBottom: 8 }}>{title}</div>
      <div style={{ textAlign: "center", color: "#FFFFFF", fontSize: 26, fontWeight: 900, marginBottom: 10, borderBottom: "1px dashed #475569", paddingBottom: 6 }}>MENU</div>
      {[["Idli", "30"], ["Dosa", "60"], ["Pongal", "50"], ["Filter Coffee", "20"]].map(([item, price], i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", color: "#E2E8F0", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
          <span>{item}</span><span style={{ color: "#FACC15" }}>₹{price}</span>
        </div>
      ))}
    </div>
  );
};

export const PaymentStampCard: React.FC = () => {
  const frame = useCurrentFrame();
  const rot = frame * 8;
  return (
    <div style={{ position: "absolute", top: 225, left: "50%", transform: "translateX(-50%)", width: 440, padding: 20, borderRadius: 16, backgroundColor: "rgba(248, 250, 252, 0.96)", border: "3px solid #0F172A", boxShadow: "0 20px 44px rgba(0,0,0,0.65)", zIndex: 25, pointerEvents: "none", color: "#0F172A" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 900, fontSize: 20, marginBottom: 12 }}>
        <span>FEE PAYMENT • ₹500</span>
        <div style={{ width: 22, height: 22, borderRadius: "50%", border: "3px solid #38BDF8", borderTopColor: "transparent", transform: `rotate(${rot}deg)` }} />
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>1. DEBIT Mani: <span style={{ color: "#DC2626" }}>-₹500</span></div>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>2. CREDIT College: <span style={{ color: "#16A34A" }}>+₹500</span></div>
      <div style={{ display: "inline-block", padding: "6px 14px", border: "3px solid #16A34A", color: "#16A34A", fontWeight: 900, fontSize: 18, transform: "rotate(-6deg)", borderRadius: 6 }}>ALL OR NOTHING ✓</div>
    </div>
  );
};
