import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import timelineRaw from "../../timeline.json";

const timeline = timelineRaw as Record<string, any>;

export const CounterHook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVert = height > width;
  const hookText = String(timeline.hook_text || "").trim();
  const counters = Array.isArray(timeline.counters) ? timeline.counters : [];

  const hookEnd = Math.max(10, Math.round(3 * fps));
  const showHook = hookText.length > 0 && frame < hookEnd;
  const hookScale = showHook ? interpolate(frame, [0, 8, hookEnd], [1.18, 1.0, 1.0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;

  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 48 }}>
      {showHook ? (
        <div style={{ position: "absolute", top: isVert ? 290 : 120, left: "8%", right: "8%", transform: `scale(${hookScale})`, padding: "14px 24px", borderRadius: 16, backgroundColor: "rgba(239, 68, 68, 0.92)", color: "#FFFFFF", fontWeight: 900, fontSize: isVert ? 42 : 48, textAlign: "center", boxShadow: "0 12px 32px rgba(0,0,0,0.6)" }}>
          {hookText}
        </div>
      ) : null}

      {counters.map((c: any, idx: number) => {
        const st = Math.round(Number(c.start_sec ?? 0) * fps);
        const en = Math.round(Number(c.end_sec ?? 0) * fps);
        if (en <= st || frame < st || frame >= en) return null;
        const fromV = Number(c.from ?? 0);
        const toV = Number(c.to ?? 100);
        const val = Math.round(interpolate(frame, [st, en], [fromV, toV], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
        return (
          <div key={idx} style={{ position: "absolute", top: isVert ? 190 : 95, left: "50%", transform: "translateX(-50%)", padding: "10px 26px", borderRadius: 14, backgroundColor: "rgba(15, 23, 42, 0.9)", border: "2px solid #38BDF8", color: "#F8FAFC", textAlign: "center" }}>
            <div style={{ fontSize: 18, color: "#94A3B8" }}>{String(c.label || "")}</div>
            <div style={{ fontSize: isVert ? 48 : 54, fontWeight: 900, color: "#38BDF8" }}>{`${c.prefix || ""}${val.toLocaleString("en-IN")}${c.suffix || ""}`}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
