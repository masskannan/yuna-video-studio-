import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import timelineRaw from "../timeline.json";

const timeline = timelineRaw as Record<string, any>;

export const SafeZoneGuide: React.FC = () => {
  const { width, height } = useVideoConfig();
  if (timeline.safe_zone_preview !== true) return null;
  const isVert = height > width;
  if (!isVert) {
    return (
      <AbsoluteFill style={{ pointerEvents: "none", zIndex: 90 }}>
        <div style={{ position: "absolute", right: 20, bottom: 20, width: 220, height: 70, border: "2px dashed #EF4444", backgroundColor: "rgba(239,68,68,0.18)", color: "#FCA5A5", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
          YT Duration Badge
        </div>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 90 }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 269, borderBottom: "2px dashed #F59E0B", backgroundColor: "rgba(245,158,11,0.12)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 460, borderTop: "2px dashed #EF4444", backgroundColor: "rgba(239,68,68,0.15)" }} />
      <div style={{ position: "absolute", top: 269, bottom: 460, right: 0, width: 120, borderLeft: "2px dashed #38BDF8", backgroundColor: "rgba(56,189,248,0.10)" }} />
    </AbsoluteFill>
  );
};
