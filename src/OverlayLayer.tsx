import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import timelineRaw from "../timeline.json";
import overlaysRaw from "../overlays.json";

type OverlayItem = {
  id: string;
  type?: "text" | "badge";
  text: string;
  x: number;
  y: number;
  start_sec: number;
  end_sec: number;
  layer?: number;
  size?: number;
  color?: string;
  bg?: string;
};

const timeline = timelineRaw as Record<string, any>;
const overlays = (Array.isArray(overlaysRaw) ? overlaysRaw : []) as OverlayItem[];

export const OverlayLayer: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  if (timeline.enable_overlays === false || !overlays.length) return null;

  const sorted = [...overlays].sort((a, b) => (a.layer ?? 55) - (b.layer ?? 55) || String(a.id).localeCompare(String(b.id)));
  const isVertical = height > width;

  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 55 }}>
      {sorted.map((ov) => {
        const st = Math.round((ov.start_sec ?? 0) * fps);
        const en = Math.round((ov.end_sec ?? 0) * fps);
        const dur = en - st;
        if (dur <= 0 || frame < st || frame >= en) return null;

        const fade = Math.min(8, Math.floor(dur / 3));
        const opacity = dur >= 4 && fade >= 1
          ? interpolate(frame, [st, st + fade, en - fade, en], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
          : 1;
        const scale = dur >= 4 && fade >= 1
          ? interpolate(frame, [st, st + fade], [0.9, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
          : 1;

        const leftPct = Math.max(5, Math.min(95, (ov.x ?? 0.5) * 100));
        const topPct = Math.max(8, Math.min(92, (ov.y ?? 0.5) * 100));
        const fontSize = Math.max(20, Math.min(96, ov.size ?? (isVertical ? 46 : 52)));

        return (
          <div
            key={ov.id}
            style={{
              position: "absolute",
              left: `${leftPct}%`,
              top: `${topPct}%`,
              transform: `translate(-50%, -50%) scale(${scale})`,
              opacity,
              maxWidth: "84%",
              padding: ov.type === "badge" ? "8px 20px" : "12px 24px",
              borderRadius: ov.type === "badge" ? 999 : 16,
              backgroundColor: ov.bg || "rgba(15, 23, 42, 0.85)",
              border: `2px solid ${ov.color || "#FACC15"}`,
              color: ov.color || "#FACC15",
              fontFamily: '"Noto Sans Tamil", "Space Grotesk", system-ui, sans-serif',
              fontWeight: 800,
              fontSize,
              lineHeight: 1.3,
              textAlign: "center",
              wordBreak: "break-word",
              boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
              zIndex: ov.layer ?? 55,
            }}
          >
            {ov.text}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
