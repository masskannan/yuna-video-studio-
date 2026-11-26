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
  const blink = frame % 110 < 4;
  const bounce = active ? Math.sin(frame * 0.25) * 6 : Math.sin(frame * 0.08) * 2;
  const body = cfg.body_color || "#FDE68A";
  const dress = cfg.dress_color || "#0284C7";
  const hatColor = cfg.hat_color || accent;
  const hair = cfg.hair_color || "#1E293B";
  const isWorm = cfg.type === "worm";

  const renderMouth = () => {
    if (mouth === "X") return <path d="M 84 128 Q 100 133 116 128" stroke="#1E293B" strokeWidth="4" fill="none" strokeLinecap="round" />;
    if (mouth === "C" || mouth === "D") return <ellipse cx="100" cy="130" rx="14" ry="10" fill="#7F1D1D" stroke="#1E293B" strokeWidth="3" />;
    if (mouth === "E" || mouth === "F") return <circle cx="100" cy="130" r="8" fill="#7F1D1D" stroke="#1E293B" strokeWidth="3" />;
    return <ellipse cx="100" cy="129" rx="12" ry="5" fill="#7F1D1D" stroke="#1E293B" strokeWidth="3" />;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", transform: `translateY(${bounce}px) scale(${active ? 1.38 : 1.08})`, opacity: active ? 1 : 0.62, filter: active ? `drop-shadow(0 0 22px ${accent}55)` : "none" }}>
      <svg width="220" height="260" viewBox="0 0 200 240">
        {/* Body / Dress */}
        {isWorm ? (
          <g>
            <circle cx="70" cy="195" r="26" fill={body} stroke="#0F172A" strokeWidth="4" />
            <circle cx="95" cy="180" r="30" fill={body} stroke="#0F172A" strokeWidth="4" />
            <circle cx="100" cy="145" r="34" fill={body} stroke="#0F172A" strokeWidth="4" />
          </g>
        ) : (
          <g>
            <rect x="52" y="152" width="96" height="82" rx="28" fill={cfg.dress_style === "none" ? body : dress} stroke="#0F172A" strokeWidth="4" />
            {cfg.dress_style === "suit" ? <polygon points="100,156 88,200 100,220 112,200" fill="#EF4444" /> : null}
          </g>
        )}

        {/* Animated Hands */}
          {!isWorm ? (
            <g>
              <circle cx="44" cy={active ? 172 - Math.sin(frame * 0.35) * 14 : 188} r="13" fill={body} stroke="#0F172A" strokeWidth="4" />
              <circle cx="156" cy={active ? 172 + Math.cos(frame * 0.35) * 14 : 188} r="13" fill={body} stroke="#0F172A" strokeWidth="4" />
            </g>
          ) : null}
        {/* Head */}
        <circle cx="100" cy="105" r="52" fill={body} stroke={active ? accent : "#0F172A"} strokeWidth={active ? 5 : 4} />

        {/* Eyes + Expression Brows */}
        {blink ? (
          <g stroke="#0F172A" strokeWidth="4" strokeLinecap="round">
            <line x1="74" y1="98" x2="88" y2="98" />
            <line x1="112" y1="98" x2="126" y2="98" />
          </g>
        ) : (
          <g>
            <circle cx="81" cy="98" r="7" fill="#0F172A" />
            <circle cx="119" cy="98" r="7" fill="#0F172A" />
            <circle cx="83" cy="95" r="2.5" fill="#FFFFFF" />
            <circle cx="121" cy="95" r="2.5" fill="#FFFFFF" />
          </g>
        )}
        {cfg.expression === "angry" ? (
          <g stroke={hair} strokeWidth="4" strokeLinecap="round">
            <line x1="70" y1="82" x2="90" y2="88" />
            <line x1="130" y1="82" x2="110" y2="88" />
          </g>
        ) : cfg.expression === "surprised" ? (
          <g stroke={hair} strokeWidth="4" fill="none">
            <path d="M 72 80 Q 81 72 90 80" />
            <path d="M 110 80 Q 119 72 128 80" />
          </g>
        ) : null}

        {/* Hair + Studio Mic */}
          {!isWorm && cfg.hat === "none" ? (
            <path d="M 52 92 Q 100 32 148 92 Q 125 66 100 68 Q 75 66 52 92 Z" fill={hair} />
          ) : null}
          {active && !isWorm ? (
            <g>
              <rect x="94" y="206" width="12" height="22" rx="6" fill="#334155" stroke="#0F172A" strokeWidth="2.5" />
              <line x1="100" y1="228" x2="100" y2="240" stroke="#64748B" strokeWidth="4" />
            </g>
          ) : null}
        {/* Glasses */}
        {cfg.glasses === "round" ? (
          <g stroke="#0F172A" strokeWidth="3.5" fill="rgba(255,255,255,0.18)">
            <circle cx="81" cy="98" r="14" />
            <circle cx="119" cy="98" r="14" />
            <line x1="95" y1="98" x2="105" y2="98" />
          </g>
        ) : cfg.glasses === "shades" ? (
          <g fill="#020617" stroke="#38BDF8" strokeWidth="2.5">
            <rect x="64" y="86" width="32" height="22" rx="6" />
            <rect x="104" y="86" width="32" height="22" rx="6" />
            <line x1="96" y1="95" x2="104" y2="95" />
          </g>
        ) : null}

        {/* Mustache */}
        {cfg.mustache === "handlebar" ? (
          <path d="M 74 118 Q 88 110 100 118 Q 112 110 126 118 Q 114 124 100 120 Q 86 124 74 118 Z" fill={hair} />
        ) : cfg.mustache === "thick" ? (
          <rect x="78" y="114" width="44" height="9" rx="4" fill={hair} />
        ) : cfg.mustache === "pencil" ? (
          <line x1="80" y1="118" x2="120" y2="118" stroke={hair} strokeWidth="3.5" strokeLinecap="round" />
        ) : null}

        {/* Lip-Sync Mouth */}
        {renderMouth()}

        {/* Hat */}
        {cfg.hat === "cap" ? (
          <g>
            <path d="M 52 72 Q 100 28 148 72 Z" fill={hatColor} stroke="#0F172A" strokeWidth="3" />
            <rect x="92" y="66" width="68" height="10" rx="5" fill={hatColor} stroke="#0F172A" strokeWidth="3" />
          </g>
        ) : cfg.hat === "crown" ? (
          <polygon points="62,64 72,30 100,52 128,30 138,64" fill={hatColor} stroke="#0F172A" strokeWidth="3" />
        ) : cfg.hat === "beanie" ? (
          <g>
            <path d="M 52 74 Q 100 24 148 74 Z" fill={hatColor} stroke="#0F172A" strokeWidth="3" />
            <circle cx="100" cy="34" r="9" fill="#FFFFFF" stroke="#0F172A" strokeWidth="3" />
          </g>
        ) : null}
      </svg>
      <div style={{ marginTop: -8, padding: "4px 14px", borderRadius: 999, backgroundColor: active ? accent : "rgba(15,23,42,0.8)", color: active ? "#020617" : "#CBD5E1", fontWeight: 800, fontSize: 18 }}>
        {name}
      </div>
    </div>
  );
};
