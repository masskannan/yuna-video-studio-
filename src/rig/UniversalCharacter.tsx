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
  const wave2 = Math.cos(t * Math.PI * 2 * 1.4);
  const amp = preset.amp_mult || 1.0;

  const headRot = isPair ? wave * 6 : ((act?.slice_motion?.head?.rot_deg || 3) * wave * 0.65 * amp) + (active ? wave2 * 2.5 : 0);
  const bobY = isPair ? wave * 6 : (act?.slice_motion?.head?.bob_y || 0.015) * wave * 150 * amp;
  const shiftX = isPair ? lookDir * 28 : 0;
  const torsoTilt = isPair ? lookDir * 5 : (act?.slice_motion?.torso?.tilt_deg || 0) * (0.5 + 0.3 * wave) * amp;
  const talkBounce = active && mouth !== "X" && mouth !== "M" ? 1.025 : 1.0;
  const sx = (1 + ((act?.slice_motion?.torso?.squash_x || 1) - 1) * (preset.squash_mult || 1) * (adapt.squash_bias || 1)) * talkBounce;
  const sy = (1 + ((act?.slice_motion?.torso?.stretch_y || 1) - 1) * (preset.squash_mult || 1)) * talkBounce;
  const surfaceY = (act?.surface_anchor?.y_offset || 0) * 260;

  let armLRot = active ? -18 + wave * 16 : -14 + wave * 3;
  let armRRot = active ? 18 - wave2 * 18 : 14 - wave * 3;
  if (pose === "wave" || actKey.includes("wave")) {
    armRRot = 55 + Math.sin(t * Math.PI * 6) * 24;
  } else if (pose === "arms_up" || actKey.includes("fist") || actKey.includes("jump")) {
    armLRot = -68 + wave * 10;
    armRRot = 68 - wave * 10;
  } else if (pose === "point_up" || actKey.includes("point")) {
    armRRot = 48 + wave * 10;
  } else if (pose === "hand_on_hip") {
    armLRot = -24;
    armRRot = 24;
  }

  let angle = "front";
  if (actKey.startsWith("run_") || actKey.startsWith("walk_")) angle = "side";
  else if (actKey.includes("back")) angle = "back";

  const basePath = `approved/chars/${key}`;
  const ratio = Math.max(0.28, rig.body_profile?.width_ratio || 0.48);
  const boxH = 460;
  const boxW = Math.round(boxH * ratio);

  const anch = rig.anchors_norm || {};
  const neckY = anch.neck_y ?? 0.30;
  const hipY = anch.hip_y ?? 0.65;
  const [tx0, tx1] = anch.torso_x ?? [0.25, 0.75];
  const mouthBox = anch.mouth_box ?? [0.38, 0.19, 0.24, 0.05];
  const eyeBox = anch.eye_box ?? [0.30, 0.12, 0.40, 0.05];

  const isBlink = frame % 105 >= 100;
  const isTalking = active && mouth !== "X" && mouth !== "M";
  const mouthOpenH = mouth === "A" || mouth === "O" ? 10 : isTalking ? 6 : 0;

  return (
    <div style={{ position: "relative", width: boxW, height: boxH, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ position: "absolute", bottom: -8, width: "68%", height: 22, borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(2,6,23,0.75) 0%, transparent 72%)", pointerEvents: "none" }} />
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
        {angle !== "front" ? (
          <Img src={staticFile(`${basePath}/${angle}.png`)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        ) : (
          <>
            <Img src={staticFile(`${basePath}/legs.png`)} style={{ position: "absolute", left: 0, top: `${hipY * 100}%`, width: "100%", height: `${(1 - hipY) * 100}%`, objectFit: "fill" }} />
            {tx0 > 0.05 && (
              <Img
                src={staticFile(`${basePath}/arm_l.png`)}
                style={{ position: "absolute", left: 0, top: `${neckY * 100}%`, width: `${tx0 * 100}%`, height: `${(hipY - neckY) * 100}%`, objectFit: "fill", transformOrigin: "90% 14%", transform: `rotate(${armLRot}deg)` }}
              />
            )}
            {tx1 < 0.95 && (
              <Img
                src={staticFile(`${basePath}/arm_r.png`)}
                style={{ position: "absolute", left: `${tx1 * 100}%`, top: `${neckY * 100}%`, width: `${(1 - tx1) * 100}%`, height: `${(hipY - neckY) * 100}%`, objectFit: "fill", transformOrigin: "10% 14%", transform: `rotate(${armRRot}deg)` }}
              />
            )}
            <Img src={staticFile(`${basePath}/torso.png`)} style={{ position: "absolute", left: `${tx0 * 100}%`, top: `${neckY * 100}%`, width: `${(tx1 - tx0) * 100}%`, height: `${(hipY - neckY) * 100}%`, objectFit: "fill" }} />
            <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: `${neckY * 100}%`, transformOrigin: "50% 92%", transform: `rotate(${headRot}deg)` }}>
              <Img src={staticFile(`${basePath}/head.png`)} style={{ width: "100%", height: "100%", objectFit: "fill" }} />
              {isBlink && (
                <div style={{ position: "absolute", left: `${eyeBox[0] * 100}%`, top: `${(eyeBox[1] / neckY) * 100}%`, width: `${eyeBox[2] * 100}%`, height: `${(eyeBox[3] / neckY) * 45}%`, borderRadius: 99, backgroundColor: "rgba(30,20,16,0.72)" }} />
              )}
              {mouthOpenH > 0 && (
                <div style={{ position: "absolute", left: `${(mouthBox[0] + mouthBox[2] * 0.25) * 100}%`, top: `${(mouthBox[1] / neckY) * 100}%`, width: `${mouthBox[2] * 50}%`, height: mouthOpenH, borderRadius: "40% 40% 60% 60%", backgroundColor: "#3B0D0C", border: "1.5px solid #FDE68A" }} />
              )}
            </div>
          </>
        )}
      </div>
      <div style={{ position: "absolute", bottom: -26, padding: "2px 12px", borderRadius: 999, backgroundColor: "rgba(15,23,42,0.88)", border: `1.5px solid ${active ? accent : "#475569"}`, color: active ? accent : "#CBD5E1", fontSize: 15, fontWeight: 800, letterSpacing: 0.8 }}>{name.toUpperCase()}</div>
    </div>
  );
};
