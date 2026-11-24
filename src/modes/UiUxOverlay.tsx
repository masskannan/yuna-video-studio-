import React from "react";
import { interpolate } from "remotion";

export const UiUxOverlay: React.FC<{ frame: number; accent: string; heading: string; wide: boolean }> = ({ frame, accent, heading, wide }) => {
  const cx = interpolate(frame % 120, [0, 60, 120], [180, 520, 180]);
  const cy = interpolate(frame % 120, [0, 60, 120], [260, 150, 260]);
  return (
    <div style={{ position: "relative", width: wide ? 780 : 880, margin: "0 auto", padding: 28, borderRadius: 24, backgroundColor: "rgba(15, 23, 42, 0.85)", border: `2px solid ${accent}66`, boxShadow: "0 20px 60px rgba(0,0,0,0.65)" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <div style={{ width: 12, height: 12, borderRadius: 99, backgroundColor: "#EF4444" }} />
        <div style={{ width: 12, height: 12, borderRadius: 99, backgroundColor: "#F59E0B" }} />
        <div style={{ width: 12, height: 12, borderRadius: 99, backgroundColor: "#10B981" }} />
      </div>
      <div style={{ fontSize: wide ? 34 : 30, fontWeight: 800, color: "#F8FAFC", marginBottom: 14 }}>{heading}</div>
      <div style={{ display: "flex", gap: 14 }}>
        <div style={{ flex: 1, height: 90, borderRadius: 14, backgroundColor: "rgba(56,189,248,0.14)", border: `1px solid ${accent}44` }} />
        <div style={{ flex: 1, height: 90, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} />
      </div>
      <div style={{ position: "absolute", left: cx, top: cy, width: 22, height: 22, borderRadius: 99, backgroundColor: accent, border: "3px solid #FFFFFF", boxShadow: `0 0 18px ${accent}` }} />
    </div>
  );
};
