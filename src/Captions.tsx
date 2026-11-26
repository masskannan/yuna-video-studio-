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

  // Balanced chunks to avoid 1-word orphan trailing lines
  const baseSize = isVertical ? 4 : 6;
  const chunks: WordItem[][] = [];
  let i = 0;
  while (i < words.length) {
    const rem = words.length - i;
    const take = rem === baseSize + 1 ? baseSize - 1 : Math.min(baseSize, rem);
    chunks.push(words.slice(i, i + take));
    i += take;
  }

  const group = chunks.find((grp) => time >= grp[0].start && time <= grp[grp.length - 1].end + 0.15);
  if (!group) return null;

  const activeWord = group.find((w) => time >= w.start && time <= w.end + 0.05) || group[0];
  const speakerName = activeWord?.speaker;
  const speakerColor = activeWord?.color || fallbackColor;

  return (
    <div style={{ position: "absolute", left: isVertical ? 36 : 120, right: isVertical ? 96 : 120, bottom: isVertical ? 235 : 70, minHeight: isVertical ? 135 : 95, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", zIndex: 50 }}>
      {speakerName ? (
        <div style={{ marginBottom: 6, padding: "3px 12px", borderRadius: 999, backgroundColor: "rgba(15, 23, 42, 0.92)", border: `1.5px solid ${speakerColor}`, color: speakerColor, fontFamily: "'Space Grotesk', 'Noto Sans Tamil', sans-serif", fontWeight: 800, fontSize: isVertical ? 18 : 17, letterSpacing: 0.6 }}>
          {speakerName}
        </div>
      ) : null}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flexWrap: "wrap", gap: isVertical ? 10 : 14, padding: "2px 6px", fontFamily: "'Space Grotesk', 'Noto Sans Tamil', sans-serif", fontWeight: 900, fontSize: isVertical ? 46 : 44, lineHeight: 1.25, textAlign: "center" }}>
        {group.map((w, idx) => {
          const isActive = time >= w.start && time <= w.end + 0.05;
          const c = w.color || "#FDE047";
          const m = w.word.match(/^(.+?)([.,!?;:]+)$/);
          const core = m ? m[1] : w.word;
          const punct = m ? m[2] : "";
          return (
            <span
              key={idx}
              style={{
                color: isActive ? c : "#FFFFFF",
                transform: isActive ? "scale(1.1)" : "scale(1)",
                WebkitTextStroke: isVertical ? "2.4px #020617" : "2px #020617",
                paintOrder: "stroke fill",
                textShadow: isActive
                  ? `0 4px 0 #020617, 0 0 18px ${c}88, 0 8px 16px rgba(0,0,0,0.95)`
                  : "0 4px 0 #020617, 0 8px 16px rgba(0,0,0,0.95)",
                paddingInline: 3,
                letterSpacing: 0.3,
                display: "inline-block",
              }}
            >
              {core}<span style={{ color: "#FFFFFF" }}>{punct}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
};
