import React from "react";
import { Img, interpolate, random, spring, staticFile, useVideoConfig } from "remotion";
import actionsDb from "../../actions_db.json";
import charsManifest from "./chars_manifest.json";
import charsSvgsManifest from "./chars_svgs_manifest.json";

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
  emotion?: string;
  neonRim?: { color: string; intensity: number };
}

const POSE_TO_ACTION: Record<string, string> = {
  wave: "wave_hello_energetic",
  arms_up: "happy_fist_pump",
  point_up: "explain_point_board",
  hand_on_hip: "idle_arms_crossed",
  listen_ear: "confused_head_scratch",
  idle: "idle_breathe",
};

const VISEME_JAW: Record<string, number> = { X: 0, A: 0, B: 2, C: 4, D: 7, E: 5, F: 1, G: 3, H: 3 };
const RHUBARB_OPEN: Record<string, number> = { D: 15, C: 11, E: 9, G: 7, H: 7, B: 5, F: 3, A: 0, X: 0 };

export function solveRestRelativeTwoBoneIK(
  shoulder: { x: number; y: number },
  target: { x: number; y: number },
  L1: number,
  L2: number,
  restUpperDeg: number,
  restForeDeg: number,
  elbowBendDir: 1 | -1 = 1
) {
  const dx = target.x - shoulder.x;
  const dy = target.y - shoulder.y;
  const rawDist = Math.hypot(dx, dy) || 0.001;
  const d = Math.max(Math.abs(L1 - L2) + 8, Math.min((L1 + L2) * 0.98, rawDist));
  const baseAng = Math.atan2(dy, dx);
  const cosA = Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d)));
  const theta1 = baseAng + elbowBendDir * Math.acos(cosA);
  const elbowX = shoulder.x + L1 * Math.cos(theta1);
  const elbowY = shoulder.y + L1 * Math.sin(theta1);
  const wristX = shoulder.x + (dx / rawDist) * d;
  const wristY = shoulder.y + (dy / rawDist) * d;
  const theta1Deg = (theta1 * 180) / Math.PI;
  const foreWorldDeg = (Math.atan2(wristY - elbowY, wristX - elbowX) * 180) / Math.PI;
  const upperDeltaDeg = theta1Deg - restUpperDeg;
  const foreRelativeDeg = (foreWorldDeg - restForeDeg) - upperDeltaDeg;
  return { upperDeltaDeg, foreRelativeDeg };
}

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
  emotion = "neutral",
  neonRim,
}) => {
  const { fps } = useVideoConfig();
  const key = name.toLowerCase();
  const rig: any = (charsManifest as Record<string, any>)[key];
  if (!rig) return null;

  const inlineSvgs: Record<string, string> = (charsSvgsManifest as Record<string, any>)[key] || {};
  const db: any = actionsDb;
  const presetKey = cfg?.style_preset || (active ? "energetic_youth" : "calm_boss");
  const preset = db.style_presets?.[presetKey] || db.style_presets?.tech_precise || { speed_mult: 1.0, amp_mult: 1.0, squash_mult: 1.0, phase_offset: 0 };
  const mapped = POSE_TO_ACTION[pose] || (active ? "talk_casual_gesture" : (preset.default_idle || "idle_breathe"));
  const actKey = action && db.actions?.[action] ? action : mapped;
  const act = db.actions?.[actKey] || db.actions?.idle_breathe;
  const adapt = rig.physics_adapt || { squash_bias: 1.0, cycle_hz_mult: 1.0 };

  const timeSec = frame / Math.max(1, fps);
  const t = timeSec * preset.speed_mult + (preset.phase_offset || 0);
  const isPair = act?.category === "pair_interaction";
  const hz = (isPair ? (act?.bob_hz || 2.2) : (act?.slice_motion?.legs?.cycle_hz || 2.0)) * (adapt.cycle_hz_mult || 1.0);
  const wave = Math.sin(t * Math.PI * 2 * Math.max(0.8, hz));
  const amp = preset.amp_mult || 1.0;

  const isTalking = active && mouth !== "X" && mouth !== "A";
  const basePath = `approved/chars/${key}`;
  const isV31 = Boolean(rig.schema_version && String(rig.schema_version).startsWith("3.1") && rig.layers?.torso && rig.bones_px?.upper_arm_r);

  const cw = rig.canvas?.width || 1024;
  const ch = rig.canvas?.height || 1536;
  const boxH = 460;
  const ratio = Math.max(0.32, rig.body_profile?.width_ratio || (cw / Math.max(1, ch)));
  const boxW = Math.round(boxH * ratio);

  if (isV31) {
    const shR = { x: rig.pivots.shoulder_r.x * cw, y: rig.pivots.shoulder_r.y * ch };
    const ub = rig.bones_px.upper_arm_r;
    const fb = rig.bones_px.forearm_r;
    const pSpring = spring({ frame: Math.max(0, frame), fps, config: { damping: 14, stiffness: 140 } });
    let tgt = { x: shR.x + (isTalking ? 120 + Math.sin(timeSec * 3.0) * 26 : 70), y: shR.y + (isTalking ? 85 + Math.cos(timeSec * 3.0) * 18 : 200) };
    if (actKey.includes("high_five")) tgt = { x: shR.x + 125, y: shR.y - 165 * pSpring };
    else if (actKey.includes("handshake")) tgt = { x: shR.x + 185 * pSpring, y: shR.y + 70 + Math.sin(timeSec * 6.5) * 14 };
    const armIK = solveRestRelativeTwoBoneIK(shR, tgt, ub.length_px, fb.length_px, ub.rest_deg, fb.rest_deg, 1);

    const blinkBucket = Math.floor(frame / (Math.max(1, fps) * 3.8));
    const blinkStart = blinkBucket * Math.round(fps * 3.8) + Math.floor(random(`${key}-b-${blinkBucket}`) * fps * 1.4);
    const fInBlink = frame - blinkStart;
    const blinkScaleY = fInBlink >= 0 && fInBlink <= 8 ? interpolate(fInBlink, [0, 3, 5, 8], [1, 0.06, 0.06, 1]) : 1;
    const saccadeStep = Math.floor(frame / (Math.max(1, fps) * 1.8));
    const saccadeX = (random(`${key}-gx-${saccadeStep}`) - 0.5) * 3.0;
    const saccadeY = (random(`${key}-gy-${saccadeStep}`) - 0.5) * 1.8;

    const sc = boxH / ch;
    const yawDeg = active ? Math.sin(t * Math.PI * 1.4) * 8 : 0;
    const pxUnit = yawDeg * 1.8;
    const foreshortenX = Math.cos((yawDeg * Math.PI) / 180);
    const shiftFor = (m: number) => pxUnit * m;
    const torsoBreathY = Math.sin(timeSec * 2.2) * 3.5;
    const torsoLeanDeg = isPair ? lookDir * 4 : (act?.slice_motion?.torso?.tilt_deg || 0) * (0.4 + 0.3 * wave) * amp;
    const headRotDeg = (emotion === "thinking" ? -6.0 : emotion === "angry" ? 4.0 : 0) + (isTalking ? Math.sin(timeSec * 11) * 2.0 : 0);
    const jawY = VISEME_JAW[mouth] ?? 0;

    const renderLayer = (lkey: string, style: React.CSSProperties) => {
      const meta = rig.layers[lkey];
      if (!meta) return null;
      if (meta.type === "inline_svg" && inlineSvgs[lkey]) {
        return <div style={style} dangerouslySetInnerHTML={{ __html: inlineSvgs[lkey] }} />;
      }
      return <Img src={staticFile(`${basePath}/${meta.src}`)} style={style} />;
    };

    const pelvisOrigin = `${rig.pivots.pelvis.x * 100}% ${rig.pivots.pelvis.y * 100}%`;
    const neckOrigin = `${rig.pivots.neck_pivot.x * 100}% ${rig.pivots.neck_pivot.y * 100}%`;
    const shROrigin = `${rig.pivots.shoulder_r.x * 100}% ${rig.pivots.shoulder_r.y * 100}%`;
    const elROrigin = `${rig.pivots.elbow_r.x * 100}% ${rig.pivots.elbow_r.y * 100}%`;
    const vCode = rig.mouth_visemes?.[mouth] ? mouth : "X";

    return (
      <div style={{ position: "relative", width: boxW, height: boxH, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        <div style={{ position: "absolute", bottom: -8, width: "68%", height: 22, borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(2,6,23,0.75) 0%, transparent 72%)", pointerEvents: "none" }} />
        <div
          style={{
            position: "absolute",
            width: cw,
            height: ch,
            bottom: 0,
            transform: `scale(${sc}) scaleX(${lookDir < 0 ? -1 : 1})`,
            transformOrigin: "bottom center",
            ["--shirt-color" as any]: cfg?.dress_color || cfg?.body_color || "#2563EB",
            ["--pant-color" as any]: cfg?.pant_color || "#1E293B",
          }}
        >
          {rig.framing !== "half_body" && renderLayer("legs", { position: "absolute", inset: 0, zIndex: 20 })}
          <div style={{ position: "absolute", inset: 0, zIndex: 30, transformOrigin: pelvisOrigin, transform: `translateY(${torsoBreathY}px) rotate(${torsoLeanDeg}deg)` }}>
            {renderLayer("back_hair", { position: "absolute", inset: 0, zIndex: 10, transform: `translateX(${shiftFor(-0.4)}px)` })}
            {renderLayer("upper_arm_l", { position: "absolute", inset: 0, zIndex: 26, transform: `translateX(${shiftFor(0.25)}px)` })}
            {renderLayer("forearm_l", { position: "absolute", inset: 0, zIndex: 27, transform: `translateX(${shiftFor(0.28)}px)` })}
            {renderLayer("torso", { position: "absolute", inset: 0, zIndex: 30, transform: `translateX(${shiftFor(0.20)}px)` })}
            <div style={{ position: "absolute", inset: 0, zIndex: 40, transformOrigin: neckOrigin, transform: `rotate(${headRotDeg}deg) scaleX(${foreshortenX})` }}>
              {renderLayer("head", { position: "absolute", inset: 0, zIndex: 40, transform: `translateX(${shiftFor(1.0)}px)` })}
              <div style={{ position: "absolute", inset: 0, zIndex: 45, transformOrigin: `${(rig.face_boxes.eye_box.x + rig.face_boxes.eye_box.w / 2) * 100}% ${(rig.face_boxes.eye_box.y + rig.face_boxes.eye_box.h / 2) * 100}%`, transform: `translate(${shiftFor(1.2) + saccadeX}px, ${saccadeY}px) scaleY(${blinkScaleY})` }}>
                {renderLayer("eyes", { width: "100%", height: "100%" })}
              </div>
              {rig.mouth_visemes?.[vCode] && (
                <div style={{ position: "absolute", inset: 0, zIndex: 46, transform: `translate(${shiftFor(1.2)}px, ${jawY}px)` }}>
                  <Img src={staticFile(`${basePath}/${rig.mouth_visemes[vCode]}`)} style={{ width: "100%", height: "100%" }} />
                </div>
              )}
            </div>
            <div style={{ position: "absolute", inset: 0, zIndex: 50, transformOrigin: shROrigin, transform: `translateX(${shiftFor(0.30)}px) rotate(${armIK.upperDeltaDeg}deg)` }}>
              {renderLayer("upper_arm_r", { position: "absolute", inset: 0 })}
              <div style={{ position: "absolute", inset: 0, transformOrigin: elROrigin, transform: `rotate(${armIK.foreRelativeDeg}deg)` }}>
                {renderLayer("forearm_r", { position: "absolute", inset: 0 })}
              </div>
            </div>
            {neonRim && neonRim.intensity > 0.05 && rig.layers.rim_mask && (
              <div style={{ position: "absolute", inset: 0, zIndex: 60, backgroundColor: neonRim.color, opacity: neonRim.intensity * 0.45, mixBlendMode: "screen", WebkitMaskImage: `url(${staticFile(`${basePath}/${rig.layers.rim_mask.src}`)})`, WebkitMaskSize: "100% 100%", pointerEvents: "none" }} />
            )}
          </div>
        </div>
        <div style={{ position: "absolute", bottom: -26, padding: "2px 12px", borderRadius: 999, backgroundColor: "rgba(15,23,42,0.88)", border: `1.5px solid ${active ? accent : "#475569"}`, color: active ? accent : "#CBD5E1", fontSize: 15, fontWeight: 800, letterSpacing: 0.8 }}>{name.toUpperCase()}</div>
      </div>
    );
  }

  // Legacy v2 safe fallback
  const bobY = isPair ? wave * 6 : (act?.slice_motion?.head?.bob_y || 0.015) * wave * 140 * amp;
  const shiftX = isPair ? lookDir * 24 : 0;
  const torsoTilt = isPair ? lookDir * 4 : (act?.slice_motion?.torso?.tilt_deg || 0) * (0.4 + 0.3 * wave) * amp;
  const rotY = active ? Math.sin(t * Math.PI * 1.4) * 9 : 0;
  const talkBounce = isTalking ? 1.022 : 1.0;
  const sx = (1 + ((act?.slice_motion?.torso?.squash_x || 1) - 1) * (preset.squash_mult || 1) * (adapt.squash_bias || 1)) * talkBounce;
  const sy = (1 + ((act?.slice_motion?.torso?.stretch_y || 1) - 1) * (preset.squash_mult || 1)) * talkBounce;
  const surfaceY = (act?.surface_anchor?.y_offset || 0) * 240;

  let angle = "front";
  if (actKey.startsWith("run_") || actKey.startsWith("walk_")) angle = "side";
  else if (actKey.includes("back")) angle = "back";

  const anch = rig.anchors_norm || {};
  const mouthBox = anch.mouth_box ?? [0.40, 0.19, 0.20, 0.045];
  const eyeBox = anch.eye_box ?? [0.32, 0.12, 0.36, 0.045];
  const isBlink = frame % 105 >= 100;
  const mouthOpenH = isTalking ? (RHUBARB_OPEN[mouth] ?? 6) : 0;

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
          <div style={{ position: "absolute", left: `${(mouthBox[0] + mouthBox[2] * 0.25) * 100}%`, top: `${mouthBox[1] * 100}%`, width: `${mouthBox[2] * 48}%`, height: mouthOpenH, borderRadius: "40% 40% 60% 60%", backgroundColor: "#3B0D0C", border: "1.5px solid #991B1B" }} />
        )}
      </div>
      <div style={{ position: "absolute", bottom: -26, padding: "2px 12px", borderRadius: 999, backgroundColor: "rgba(15,23,42,0.88)", border: `1.5px solid ${active ? accent : "#475569"}`, color: active ? accent : "#CBD5E1", fontSize: 15, fontWeight: 800, letterSpacing: 0.8 }}>{name.toUpperCase()}</div>
    </div>
  );
};
