import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import brand from "../brand.json";
import wordsRaw from "./words.json";

type WordItem = { word: string; start: number; end: number; speaker?: string; color?: string };

const words: WordItem[] = ((wordsRaw as any[]) || []).map((w) =>
  Array.isArray(w)
    ? { start: Number(w[0]), end: Number(w[1]), word: String(w[2]), speaker: w[3], color: w[4] }
    : (w as WordItem)
);

export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const time = frame / fps;
  const isVertical = height > width;
  const fallbackColor = (brand as Record<string, string>).primary_color || "#FDE047";

  if (!words.length) return null;

  const CHUNK_SIZE = isVertical ? 4 : 6;
  let activeGroupIdx = -1;
  for (let i = 0; i < words.length; i += CHUNK_SIZE) {
    const grp = words.slice(i, i + CHUNK_SIZE);
    if (time >= grp[0].start && time <= grp[grp.length - 1].end + 0.15) {
      activeGroupIdx = i;
      break;
    }
  }
  if (activeGroupIdx === -1) return null;

  const group = words.slice(activeGroupIdx, activeGroupIdx + CHUNK_SIZE);
  const activeWord = group.find((w) => time >= w.start && time <= w.end + 0.05) || group[0];
  const speakerName = activeWord?.speaker;
  const speakerColor = activeWord?.color || fallbackColor;

  return (
    <div style={{ position: "absolute", left: isVertical ? 48 : 120, right: isVertical ? 48 : 120, bottom: isVertical ? 360 : 75, display: "flex", flexDirection: "column", alignItems: "center", zIndex: 50 }}>
      {speakerName ? (
        <div style={{ marginBottom: 8, padding: "3px 12px", borderRadius: 999, backgroundColor: "rgba(15, 23, 42, 0.85)", border: `1.5px solid ${speakerColor}`, color: speakerColor, fontFamily: "'Noto Sans Tamil', sans-serif", fontWeight: 800, fontSize: isVertical ? 20 : 18, letterSpacing: 0.8 }}>
          {speakerName}
        </div>
      ) : null}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flexWrap: "wrap", gap: isVertical ? 12 : 14, padding: "4px 8px", fontFamily: "'Noto Sans Tamil', sans-serif", fontWeight: 900, fontSize: isVertical ? 54 : 46, lineHeight: 1.25, textAlign: "center" }}>
        {group.map((w, idx) => {
          const isActive = time >= w.start && time <= w.end + 0.05;
          const c = w.color || "#FDE047";
          return (
            <span
              key={`${activeGroupIdx}-${idx}`}
              style={{
                color: isActive ? c : "#FFFFFF",
                transform: isActive ? "scale(1.12)" : "scale(1)",
                WebkitTextStroke: isVertical ? "2.8px #020617" : "2.2px #020617",
                paintOrder: "stroke fill",
                textShadow: isActive
                  ? `0 4px 0 #020617, 0 0 20px ${c}88, 0 8px 18px rgba(0,0,0,0.95)`
                  : "0 4px 0 #020617, 0 8px 18px rgba(0,0,0,0.95)",
                display: "inline-block",
              }}
            >
              {w.word}
            </span>
          );
        })}
      </div>
    </div>
  );
};
