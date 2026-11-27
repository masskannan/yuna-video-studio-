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

  const headRot = isPair ? wave * 6 : (act?.slice_motion?.head?.rot_deg || 0) * wave * 0.6 * amp;
  const bobY = isPair ? wave * 6 : (act?.slice_motion?.head?.bob_y || 0.015) * wave * 180 * amp;
  const shiftX = isPair ? lookDir * 28 : 0;
  const torsoTilt = isPair ? lookDir * 6 : (act?.slice_motion?.torso?.tilt_deg || 0) * (0.6 + 0.4 * wave) * amp;
  const talkBounce = active && mouth !== "X" && mouth !== "M" ? 1.02 : 1.0;
  const sx = (1 + ((act?.slice_motion?.torso?.squash_x || 1) - 1) * (preset.squash_mult || 1) * (adapt.squash_bias || 1)) * talkBounce;
  const sy = (1 + ((act?.slice_motion?.torso?.stretch_y || 1) - 1) * (preset.squash_mult || 1)) * talkBounce;
  const surfaceY = (act?.surface_anchor?.y_offset || 0) * 260;

  let angle = "front";
  if (actKey.startsWith("run_") || actKey.startsWith("walk_")) angle = "side";
  else if (actKey.includes("back")) angle = "back";
  else if (isPair || (active && Math.abs(lookDir) > 0.5)) angle = "three_quarter";

  const basePath = `approved/chars/${key}`;
  const boxH = 460;
  const ratio = rig.body_profile?.width_ratio || 0.45;
  const boxW = Math.round(boxH * ratio);

  return (
    <div style={{ position: "relative", width: Math.max(210, boxW), height: boxH, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ position: "absolute", bottom: -8, width: "68%", height: 22, borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(2,6,23,0.72) 0%, transparent 72%)", pointerEvents: "none" }} />
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          transform: `translate(${shiftX}px, ${bobY + surfaceY}px) scaleX(${lookDir < 0 ? -1 : 1}) scale(${sx}, ${sy}) rotate(${torsoTilt}deg)`,
          transformOrigin: "bottom center",
          filter: active ? `drop-shadow(0 0 20px ${accent}77)` : "drop-shadow(0 10px 18px rgba(0,0,0,0.6))",
        }}
      >
        <Img
          src={staticFile(`${basePath}/${angle}.png`)}
          style={{ width: "100%", height: "100%", objectFit: "contain", transform: `rotate(${headRot * 0.25}deg)` }}
        />
      </div>
    </div>
  );
};
