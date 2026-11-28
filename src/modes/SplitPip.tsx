import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, staticFile } from "remotion";
import brollMapRaw from "../broll_manifest.json";
import { CharacterRig, CharConfig } from "../rig/CharacterRig";
import { UniversalCharacter } from "../rig/UniversalCharacter";
import charsManifest from "../rig/chars_manifest.json";

const brollMap = brollMapRaw as Record<string, string>;

type Props = {
  wide: boolean;
  frame: number;
  accent: string;
  heading: string;
  mediaName?: string;
  charName: string;
  charCfg: CharConfig;
  mouth: string;
  pose?: string;
  prop?: string;
  action?: string;
};

export const SplitPip: React.FC<Props> = ({ wide, frame, accent, heading, mediaName, charName, charCfg, mouth, pose, prop, action }) => {
  const mapped = mediaName && brollMap[mediaName] ? staticFile(brollMap[mediaName]) : null;
  const isVid = mapped ? mapped.endsWith(".mp4") : false;

  return (
    <AbsoluteFill style={{ padding: wide ? "90px 70px 110px" : "130px 44px 360px", display: "flex", flexDirection: wide ? "row" : "column", gap: 20 }}>
      <div style={{ flex: 2, borderRadius: 20, overflow: "hidden", border: `2px solid ${accent}88`, backgroundColor: "#0F172A", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {mapped ? (
          isVid ? <OffthreadVideo src={mapped} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <Img src={mapped} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ padding: 28, textAlign: "center", fontSize: wide ? 40 : 34, fontWeight: 800, color: "#F8FAFC" }}>{heading}</div>
        )}
      </div>
      <div style={{ flex: 1, borderRadius: 20, border: "2px solid rgba(255,255,255,0.16)", backgroundColor: "rgba(2,6,23,0.78)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ transform: wide ? "scale(0.82)" : "scale(0.75)", transformOrigin: "bottom center", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>{(charsManifest as Record<string, any>)[String(charName || "").toLowerCase()] ? <UniversalCharacter name={charName} cfg={charCfg} mouth={mouth} frame={frame} active={true} accent={accent} lookDir={1} pose={pose} prop={prop} action={action || ""} /> : <CharacterRig name={charName} cfg={charCfg} mouth={mouth} frame={frame} active={true} accent={accent} />}</div>
      </div>
    </AbsoluteFill>
  );
};
