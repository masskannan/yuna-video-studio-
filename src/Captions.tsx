import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import brand from "../brand.json";
import wordsRaw from "./words.json";

type WordItem = {
  word: string;
  start: number;
  end: number;
};

const words = (wordsRaw as WordItem[]) || [];

export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const time = frame / fps;
  const isVertical = height > width;
  const primaryColor = (brand as Record<string, string>).primary_color || "#FFD700";

  if (!words.length) return null;

  const CHUNK_SIZE = isVertical ? 4 : 6;
  let activeGroupIdx = -1;
  for (let i = 0; i < words.length; i += CHUNK_SIZE) {
    const grp = words.slice(i, i + CHUNK_SIZE);
    const start = grp[0].start;
    const end = grp[grp.length - 1].end + 0.15;
    if (time >= start && time <= end) {
      activeGroupIdx = i;
      break;
    }
  }

  if (activeGroupIdx === -1) return null;
  const group = words.slice(activeGroupIdx, activeGroupIdx + CHUNK_SIZE);

  return (
    <div
      style={{
        position: "absolute",
        left: isVertical ? 60 : 120,
        right: isVertical ? 60 : 120,
        bottom: isVertical ? 400 : 90,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexWrap: "wrap",
        gap: isVertical ? 14 : 16,
        padding: isVertical ? "18px 26px" : "14px 28px",
        backgroundColor: "rgba(0, 0, 0, 0.68)",
        borderRadius: 18,
        fontFamily: "'Noto Sans Tamil', sans-serif",
        fontWeight: 700,
        fontSize: isVertical ? 52 : 44,
        lineHeight: 1.35,
        textAlign: "center",
        zIndex: 50,
      }}
    >
      {group.map((w, idx) => {
        const isActive = time >= w.start && time <= w.end + 0.05;
        return (
          <span
            key={`${activeGroupIdx}-${idx}`}
            style={{
              color: isActive ? primaryColor : "#FFFFFF",
              transform: isActive ? "scale(1.08)" : "scale(1)",
              textShadow: isActive ? `0 0 18px ${primaryColor}66` : "0 2px 6px rgba(0,0,0,0.9)",
              display: "inline-block",
            }}
          >
            {w.word}
          </span>
        );
      })}
    </div>
  );
};
