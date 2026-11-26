import React from "react";

export type CharConfig = {
  type?: "character" | "worm";
  body_color?: string;
  dress_style?: "hoodie" | "suit" | "casual" | "none";
  dress_color?: string;
  expression?: "happy" | "angry" | "surprised" | "neutral";
  hat?: "none" | "cap" | "crown" | "beanie";
  hat_color?: string;
  mustache?: "none" | "handlebar" | "thick" | "pencil";
  hair_color?: string;
  glasses?: "none" | "round" | "shades";
};

type Props = {
  name: string;
  cfg: CharConfig;
  mouth: string;
  frame: number;
  active: boolean;
  accent: string;
};

export const CharacterRig: React.FC<Props> = ({ name, cfg, mouth, frame, active, accent }) => {
  const blink = frame % 105 < 4;
  const bounce = active ? Math.sin(frame * 0.24) * 5 : Math.sin(frame * 0.08) * 1.5;
  const tilt = active ? Math.sin(frame * 0.14) * 2.6 : 0;
  const breath = 1 + Math.sin(frame * 0.09) * 0.015;
  const body = cfg.body_color || "#FDE68A";
  const dress = cfg.dress_color || "#0284C7";
  const hatColor = cfg.hat_color || accent;
  const hair = cfg.hair_color || "#1E293B";
  const isWorm = cfg.type === "worm";

  const renderMouth = () => {
    if (mouth === "X") return <path d="M 86 128 Q 100 136 114 128" stroke="#1E293B" strokeWidth="3.8" fill="none" strokeLinecap="round" />;
    if (mouth === "C" || mouth === "D") return (
      <g>
        <ellipse cx="100" cy="130" rx="14" ry="10" fill="#7F1D1D" stroke="#0F172A" strokeWidth="3" />
        <path d="M 89 124 Q 100 127 111 124" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
        <ellipse cx="100" cy="136" rx="7" ry="3.5" fill="#FB7185" />
      </g>
    );
    if (mouth === "E" || mouth === "F") return <circle cx="100" cy="130" r="8" fill="#7F1D1D" stroke="#0F172A" strokeWidth="3" />;
    return (
      <g>
        <ellipse cx="100" cy="129" rx="11" ry="5" fill="#7F1D1D" stroke="#0F172A" strokeWidth="2.8" />
        <path d="M 92 126 Q 100 128 108 126" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
      </g>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", transform: `translateY(${bounce}px) scale(${active ? 1.38 : 1.08})`, opacity: active ? 1 : 0.65, filter: active ? `drop-shadow(0 0 22px ${accent}55)` : "none" }}>
      <svg width="220" height="260" viewBox="0 0 200 240">
        {isWorm ? (
          <g>
            <circle cx="70" cy="195" r="26" fill={body} stroke="#0F172A" strokeWidth="4" />
            <circle cx="95" cy="180" r="30" fill={body} stroke="#0F172A" strokeWidth="4" />
            <circle cx="100" cy="145" r="34" fill={body} stroke="#0F172A" strokeWidth="4" />
          </g>
        ) : (
          <g transform={`scale(1, ${breath})`} style={{ transformOrigin: "100px 230px" }}>
            {/* Shoulders & Torso */}
            <path d="M 40 236 C 42 178 58 158 100 158 C 142 158 158 178 160 236 Z" fill={cfg.dress_style === "none" ? body : dress} stroke="#0F172A" strokeWidth="4" />
            {/* Neck */}
            <rect x="86" y="138" width="28" height="26" rx="10" fill={body} stroke="#0F172A" strokeWidth="3.5" />
            {/* Outfit Details */}
            {cfg.dress_style === "suit" ? (
              <g>
                <polygon points="82,158 100,192 118,158" fill="#F8FAFC" stroke="#0F172A" strokeWidth="2.5" />
                <polygon points="100,162 92,202 100,222 108,202" fill="#EF4444" stroke="#0F172A" strokeWidth="2" />
                <path d="M 68 162 L 86 205 L 74 210 L 58 172 Z" fill="#0F172A" opacity="0.28" />
                <path d="M 132 162 L 114 205 L 126 210 L 142 172 Z" fill="#0F172A" opacity="0.28" />
              </g>
            ) : cfg.dress_style === "hoodie" ? (
              <g>
                <path d="M 74 158 Q 100 176 126 158" fill="none" stroke="#0F172A" strokeWidth="4" />
                <line x1="88" y1="170" x2="86" y2="202" stroke="#F8FAFC" strokeWidth="3" strokeLinecap="round" />
                <line x1="112" y1="170" x2="114" y2="202" stroke="#F8FAFC" strokeWidth="3" strokeLinecap="round" />
              </g>
            ) : (
              <path d="M 80 158 Q 100 172 120 158" fill="none" stroke="#F8FAFC" strokeWidth="3.5" />
            )}
            {/* Animated Hands */}
            <circle cx="40" cy={active ? 176 - Math.sin(frame * 0.35) * 14 : 196} r="13" fill={body} stroke="#0F172A" strokeWidth="3.8" />
            <circle cx="160" cy={active ? 176 + Math.cos(frame * 0.35) * 14 : 196} r="13" fill={body} stroke="#0F172A" strokeWidth="3.8" />
          </g>
        )}

        <g transform={`rotate(${tilt} 100 140)`}>
          {/* Ears */}
          {!isWorm ? (
            <g>
              <ellipse cx="48" cy="105" rx="9" ry="13" fill={body} stroke="#0F172A" strokeWidth="3.5" />
              <ellipse cx="152" cy="105" rx="9" ry="13" fill={body} stroke="#0F172A" strokeWidth="3.5" />
            </g>
          ) : null}

          {/* Humanoid Head with Jawline */}
          <path d="M 52 94 C 52 54 148 54 148 94 C 148 130 132 148 100 150 C 68 148 52 130 52 94 Z" fill={body} stroke={active ? accent : "#0F172A"} strokeWidth={active ? 4.8 : 4} />

          {/* Layered Hair */}
          {!isWorm && cfg.hat === "none" ? (
            <path d="M 50 92 C 48 44 152 44 150 92 C 138 66 116 62 100 66 C 82 62 62 68 50 92 Z" fill={hair} stroke="#0F172A" strokeWidth="3" />
          ) : null}

          {/* Hats */}
          {cfg.hat === "cap" ? (
            <g>
              <path d="M 50 78 C 56 40 144 40 150 78 Z" fill={hatColor} stroke="#0F172A" strokeWidth="3.5" />
              <path d="M 46 78 L 166 84 C 166 88 130 88 46 82 Z" fill={hatColor} stroke="#0F172A" strokeWidth="3" />
            </g>
          ) : cfg.hat === "crown" ? (
            <polygon points="62,64 72,32 90,52 100,26 110,52 128,32 138,64" fill="#FACC15" stroke="#0F172A" strokeWidth="3.5" />
          ) : cfg.hat === "beanie" ? (
            <path d="M 52 76 C 58 34 142 34 148 76 Z" fill={hatColor} stroke="#0F172A" strokeWidth="3.5" />
          ) : null}

          {/* Sclera + Iris Eyes */}
          {blink ? (
            <g stroke="#0F172A" strokeWidth="3.8" strokeLinecap="round">
              <path d="M 70 98 Q 81 103 92 98" fill="none" />
              <path d="M 108 98 Q 119 103 130 98" fill="none" />
            </g>
          ) : (
            <g>
              <ellipse cx="81" cy="98" rx="11" ry="10" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.5" />
              <ellipse cx="119" cy="98" rx="11" ry="10" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.5" />
              <circle cx="82" cy="98" r="5.5" fill="#0F172A" />
              <circle cx="120" cy="98" r="5.5" fill="#0F172A" />
              <circle cx="84" cy="95" r="2" fill="#FFFFFF" />
              <circle cx="122" cy="95" r="2" fill="#FFFFFF" />
            </g>
          )}

          {/* Expressive Eyebrows */}
          {cfg.expression === "angry" ? (
            <g stroke={hair} strokeWidth="4" strokeLinecap="round">
              <line x1="68" y1="81" x2="91" y2="87" />
              <line x1="132" y1="81" x2="109" y2="87" />
            </g>
          ) : cfg.expression === "surprised" ? (
            <g stroke={hair} strokeWidth="3.8" fill="none" strokeLinecap="round">
              <path d="M 69 80 Q 81 71 92 80" />
              <path d="M 108 80 Q 119 71 131 80" />
            </g>
          ) : (
            <g stroke={hair} strokeWidth="3.5" fill="none" strokeLinecap="round">
              <path d="M 70 83 Q 81 79 91 83" />
              <path d="M 109 83 Q 119 79 130 83" />
            </g>
          )}

          {/* Subtle Nose */}
          <path d="M 100 102 L 97 114 L 103 115" fill="none" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />

          {/* Glasses */}
          {cfg.glasses === "round" ? (
            <g stroke="#0F172A" strokeWidth="3.2" fill="rgba(255,255,255,0.18)">
              <circle cx="81" cy="98" r="14" />
              <circle cx="119" cy="98" r="14" />
              <line x1="95" y1="98" x2="105" y2="98" />
            </g>
          ) : cfg.glasses === "shades" ? (
            <g fill="#0F172A" stroke="#F8FAFC" strokeWidth="2">
              <rect x="65" y="88" width="30" height="19" rx="5" />
              <rect x="105" y="88" width="30" height="19" rx="5" />
              <line x1="95" y1="96" x2="105" y2="96" stroke="#0F172A" strokeWidth="3" />
            </g>
          ) : null}

          {/* Mustache */}
          {cfg.mustache === "handlebar" ? (
            <path d="M 80 121 Q 92 115 100 120 Q 108 115 120 121" stroke={hair} strokeWidth="4.5" fill="none" strokeLinecap="round" />
          ) : cfg.mustache === "thick" ? (
            <rect x="82" y="117" width="36" height="7" rx="3.5" fill={hair} />
          ) : cfg.mustache === "pencil" ? (
            <line x1="84" y1="120" x2="116" y2="120" stroke={hair} strokeWidth="2.8" strokeLinecap="round" />
          ) : null}

          {/* 6-Shape Lip-Sync Mouth */}
          {renderMouth()}
        </g>

        {/* Studio Mic for Active Speaker */}
        {active && !isWorm ? (
          <g>
            <rect x="94" y="206" width="12" height="22" rx="6" fill="#334155" stroke="#0F172A" strokeWidth="2.5" />
            <line x1="100" y1="228" x2="100" y2="240" stroke="#64748B" strokeWidth="4" />
          </g>
        ) : null}
      </svg>
      <div style={{ marginTop: -8, padding: "4px 14px", borderRadius: 999, backgroundColor: active ? accent : "rgba(15,23,42,0.85)", color: active ? "#020617" : "#CBD5E1", fontWeight: 800, fontSize: 18 }}>
        {name}
      </div>
    </div>
  );
};
