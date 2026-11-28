import React from "react";
import { Img, staticFile, useVideoConfig } from "remotion";
import actionsDb from "../../actions_db.json";
import charsManifest from "./chars_manifest.json";

export interface UniversalCharProps {
  name: string;
  cfg: any;
  mouth: string;
  frame: number;
  active: boolean;
  accent: string;
  lookDir: number;
  pose?: string;
  prop?: string;
  action?: string;
}

const POSE_TO_ACTION: Record<string, string> = {
  wave: "wave_hello_energetic",
  arms_up: "happy_fist_pump",
  point_up: "explain_point_board",
  hand_on_hip: "idle_arms_crossed",
  listen_ear: "confused_head_scratch",
  idle: "idle_breathe",
};

export const UniversalCharacter: React.FC<UniversalCharProps> = ({
  name,
  cfg,
  mouth,
  frame,
  active,
  accent,
  lookDir,
  pose = "idle",
  action = "",
}) => {
  const { fps } = useVideoConfig();
  const key = name.toLowerCase();
  const rig: any = (charsManifest as Record<string, any>)[key];
  if (!rig) return null;

  const db: any = actionsDb;
  const presetKey = cfg?.style_preset || (active ? "energetic_youth" : "calm_boss");
  const preset = db.style_presets?.[presetKey] || db.style_presets?.tech_precise || {
    speed_mult: 1.0,
    amp_mult: 1.0,
    squash_mult: 1.0,
    phase_offset: 0,
  };

  const mapped = POSE_TO_ACTION[pose] || (active ? "talk_casual_gesture" : (preset.default_idle || "idle_breathe"));
  const actKey = action && db.actions?.[action] ? action : mapped;
  const act = db.actions?.[actKey] || db.actions?.idle_breathe;
  const adapt = rig.physics_adapt || { squash_bias: 1.0, cycle_hz_mult: 1.0 };

  const t = (frame / Math.max(1, fps)) * preset.speed_mult + (preset.phase_offset || 0);
  const isPair = act?.category === "pair_interaction";
  const hz = (isPair ? (act?.bob_hz || 2.2) : (act?.slice_motion?.legs?.cycle_hz || 2.0)) * (adapt.cycle_hz_mult || 1.0);
  const wave = Math.sin(t * Math.PI * 2 * Math.max(0.8, hz));
  const amp = preset.amp_mult || 1.0;

  const bobY = isPair ? wave * 6 : (act?.slice_motion?.head?.bob_y || 0.015) * wave * 140 * amp;
  const shiftX = isPair ? lookDir * 24 : 0;
  const torsoTilt = isPair ? lookDir * 4 : (act?.slice_motion?.torso?.tilt_deg || 0) * (0.4 + 0.3 * wave) * amp;
  const rotY = active ? Math.sin(t * Math.PI * 1.4) * 9 : 0;
  const talkBounce = active && mouth !== "X" && mouth !== "M" ? 1.022 : 1.0;
  const sx = (1 + ((act?.slice_motion?.torso?.squash_x || 1) - 1) * (preset.squash_mult || 1) * (adapt.squash_bias || 1)) * talkBounce;
  const sy = (1 + ((act?.slice_motion?.torso?.stretch_y || 1) - 1) * (preset.squash_mult || 1)) * talkBounce;
  const surfaceY = (act?.surface_anchor?.y_offset || 0) * 240;

  let angle = active ? "three_quarter" : "front";
  if (actKey.startsWith("run_") || actKey.startsWith("walk_")) angle = "side";
  else if (actKey.includes("back")) angle = "back";

  const basePath = `approved/chars/${key}`;
  const ratio = Math.max(0.32, rig.body_profile?.width_ratio || 0.48);
  const boxH = 460;
  const boxW = Math.round(boxH * ratio);

  const anch = rig.anchors_norm || {};
  const mouthBox = anch.mouth_box ?? [0.40, 0.19, 0.20, 0.045];
  const eyeBox = anch.eye_box ?? [0.32, 0.12, 0.36, 0.045];

  const isBlink = frame % 105 >= 100;
  const isTalking = active && mouth !== "X" && mouth !== "M";
  const mouthOpenH = mouth === "A" || mouth === "O" ? 11 : mouth === "E" || mouth === "C" ? 7 : isTalking ? 5 : 0;

  return (
    <div style={{ position: "relative", width: boxW, height: boxH, display: "flex", alignItems: "flex-end", justifyContent: "center", perspective: 900 }}>
      <div style={{ position: "absolute", bottom: -8, width: "68%", height: 22, borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(2,6,23,0.75) 0%, transparent 72%)", pointerEvents: "none" }} />
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          transform: `translate(${shiftX}px, ${bobY + surfaceY}px) scaleX(${lookDir < 0 ? -1 : 1}) rotateY(${rotY}deg) scale(${sx}, ${sy}) rotate(${torsoTilt}deg)`,
          transformOrigin: "bottom center",
          filter: active ? `drop-shadow(0 0 20px ${accent}77)` : "drop-shadow(0 10px 18px rgba(0,0,0,0.6))",
        }}
      >
        <Img src={staticFile(`${basePath}/${angle}.png`)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        {isBlink && angle !== "back" && (
          <div style={{ position: "absolute", left: `${eyeBox[0] * 100}%`, top: `${eyeBox[1] * 100}%`, width: `${eyeBox[2] * 100}%`, height: `${eyeBox[3] * 55}%`, borderRadius: 99, backgroundColor: "rgba(30,20,16,0.78)" }} />
        )}
        {mouthOpenH > 0 && angle !== "back" && (
          <div style={{ position: "absolute", left: `${(mouthBox[0] + mouthBox[2] * 0.25) * 100}%`, top: `${mouthBox[1] * 100}%`, width: `${mouthBox[2] * 48}%`, height: mouthOpenH, borderRadius: "40% 40% 60% 60%", backgroundColor: "#3B0D0C", border: "1.5px solid #FDE68A" }} />
        )}
      </div>
      <div style={{ position: "absolute", bottom: -26, padding: "2px 12px", borderRadius: 999, backgroundColor: "rgba(15,23,42,0.88)", border: `1.5px solid ${active ? accent : "#475569"}`, color: active ? accent : "#CBD5E1", fontSize: 15, fontWeight: 800, letterSpacing: 0.8 }}>{name.toUpperCase()}</div>
    </div>
  );
};
