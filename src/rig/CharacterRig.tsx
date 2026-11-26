import React from "react";

export type CharConfig = {
  type?: "character" | "worm" | "robot";
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
  pose?: "idle" | "hand_on_hip" | "listen_ear" | "wave" | "arms_up" | "point_up";
  prop?: "none" | "camera" | "headband" | "mic";
  lookDir?: number;
};

export const CharacterRig: React.FC<Props> = ({
  name,
  cfg,
  mouth,
  frame,
  active,
  accent,
  pose = "hand_on_hip",
  prop = "camera",
  lookDir = 0,
}) => {
  const uid = name.replace(/[^a-zA-Z0-9]/g, "") || "c";
  const blink = frame % 105 < 4;
  const bounce = active ? Math.sin(frame * 0.24) * 4 : Math.sin(frame * 0.08) * 1.2;
  const nod = !active ? Math.sin(frame * 0.14) * 2.4 : 0;
  const tilt = (active ? Math.sin(frame * 0.14) * 2.2 : 0) + nod;
  const squashY = active ? 1 + Math.sin(frame * 0.24) * 0.022 : 1 + Math.sin(frame * 0.09) * 0.012;
  const squashX = active ? 1 - Math.sin(frame * 0.24) * 0.014 : 1;
  const lookX = !active ? lookDir * 2.6 : Math.sin(frame * 0.06) * 1.1;
  const body = cfg.body_color || "#D99B66";
  const dress = cfg.dress_color || "#FACC15";
  const hatColor = cfg.hat_color || accent;
  const hair = cfg.hair_color || "#1E293B";
  const expr = cfg.expression || "happy";
  const isWorm = cfg.type === "worm";
  const isRobot = cfg.type === "robot" || ["BUGGY", "BOT", "AI"].includes(name.toUpperCase());

  const renderMouth = () => {
    if (mouth === "X") return <path d="M 96 128 Q 110 136 124 128" stroke="#1E293B" strokeWidth="3.8" fill="none" strokeLinecap="round" />;
    if (mouth === "C" || mouth === "D") return (
      <g>
        <ellipse cx="110" cy="130" rx="14" ry="10" fill="#7F1D1D" stroke="#0F172A" strokeWidth="3" />
        <path d="M 99 124 Q 110 127 121 124" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
        <ellipse cx="110" cy="136" rx="7" ry="3.5" fill="#FB7185" />
      </g>
    );
    if (mouth === "E" || mouth === "F") return <circle cx="110" cy="130" r="8" fill="#7F1D1D" stroke="#0F172A" strokeWidth="3" />;
    return (
      <g>
        <ellipse cx="110" cy="129" rx="11" ry="5" fill="#7F1D1D" stroke="#0F172A" strokeWidth="2.8" />
        <path d="M 102 126 Q 110 128 118 126" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
      </g>
    );
  };

  if (isRobot) {
    const hover = Math.sin(frame * 0.16) * 7;
    const flame = 11 + Math.sin(frame * 0.6) * 5;
    return (
      <div style={{ zIndex: active ? 28 : 22, display: "flex", flexDirection: "column", alignItems: "center", transform: `translateY(${hover}px) scale(${active ? 0.96 : 0.82})`, transformOrigin: "bottom center", opacity: active ? 1 : 0.88, filter: active ? "drop-shadow(0 0 16px rgba(56,189,248,0.55))" : "drop-shadow(0 8px 14px rgba(0,0,0,0.4))" }}>
        <svg width="175" height="250" viewBox="0 0 200 265">
          <defs>
            <linearGradient id={`rb_${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="65%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>
          </defs>
          <ellipse cx="100" cy="248" rx="44" ry="8" fill="#020617" opacity="0.32" />
          <ellipse cx="86" cy={205 + flame * 0.4} rx="9" ry={flame} fill="#38BDF8" opacity="0.85" />
          <ellipse cx="114" cy={205 + flame * 0.4} rx="9" ry={flame} fill="#38BDF8" opacity="0.85" />
          <ellipse cx="100" cy={208 + flame * 0.5} rx="12" ry={flame * 1.2} fill="#BAE6FD" opacity="0.95" />
          <line x1="100" y1="34" x2="100" y2="54" stroke="#64748B" strokeWidth="5" strokeLinecap="round" />
          <circle cx="100" cy="28" r="7" fill="#38BDF8" stroke="#0F172A" strokeWidth="3" />
          <rect x="46" y="52" width="108" height="74" rx="24" fill={`url(#rb_${uid})`} stroke="#0F172A" strokeWidth="4.5" />
          <rect x="34" y="72" width="12" height="32" rx="6" fill="#38BDF8" stroke="#0F172A" strokeWidth="3.5" />
          <rect x="154" y="72" width="12" height="32" rx="6" fill="#38BDF8" stroke="#0F172A" strokeWidth="3.5" />
          <rect x="58" y="66" width="84" height="44" rx="14" fill="#0F172A" />
          <path d="M 64 72 L 94 72 L 74 102 L 64 102 Z" fill="#FFFFFF" opacity="0.08" />
          {expr === "happy" && !active ? (
            <g stroke="#38BDF8" strokeWidth="4" fill="none" strokeLinecap="round">
              <path d="M 74 88 Q 82 78 90 88" /><path d="M 110 88 Q 118 78 126 88" />
            </g>
          ) : (
            <g>
              <circle cx={82 + lookX} cy="86" r={blink ? 2 : 7} fill="#38BDF8" />
              <circle cx={118 + lookX} cy="86" r={blink ? 2 : 7} fill="#38BDF8" />
            </g>
          )}
          <path d="M 88 99 Q 100 107 112 99" stroke="#38BDF8" strokeWidth="3.2" fill="none" strokeLinecap="round" />
          <rect x="64" y="130" width="72" height="66" rx="16" fill={`url(#rb_${uid})`} stroke="#0F172A" strokeWidth="4.5" />
          <rect x="82" y="148" width="36" height="24" rx="6" fill="#0F172A" />
          <text x="100" y="165" textAnchor="middle" fill="#38BDF8" fontSize="13" fontWeight="900" fontFamily="sans-serif">AI</text>
          <path d="M 64 146 Q 48 156 40 162" stroke="#94A3B8" strokeWidth="9" fill="none" strokeLinecap="round" />
          <circle cx="36" cy="164" r="8" fill="#38BDF8" stroke="#0F172A" strokeWidth="3" />
          <path d="M 136 146 Q 150 152 160 156" stroke="#94A3B8" strokeWidth="9" fill="none" strokeLinecap="round" />
          <polygon points="154,146 186,134 186,174 154,162" fill="#F97316" stroke="#0F172A" strokeWidth="3.5" />
        </svg>
        <div style={{ marginTop: -8, padding: "4px 12px", borderRadius: 999, backgroundColor: active ? "#38BDF8" : "rgba(15,23,42,0.85)", color: active ? "#020617" : "#E2E8F0", fontSize: 14, fontWeight: 800, border: "1.5px solid rgba(56,189,248,0.6)" }}>{name}</div>
      </div>
    );
  }

  const waveY = Math.sin(frame * 0.35) * 14;
  const kneeShift = active ? Math.sin(frame * 0.24) * 2.5 : 0;
  return (
    <div style={{ zIndex: active ? 28 : 22, display: "flex", flexDirection: "column", alignItems: "center", transform: `translateY(${bounce}px) scale(${active ? 1.02 : 0.84})`, transformOrigin: "bottom center", opacity: active ? 1 : 0.84, filter: active ? `drop-shadow(0 0 16px ${accent}55) drop-shadow(0 12px 22px rgba(0,0,0,0.45))` : "drop-shadow(0 6px 12px rgba(0,0,0,0.3))" }}>
      <svg width="205" height="320" viewBox="0 0 220 335">
        <defs>
          <radialGradient id={`sk_${uid}`} cx="42%" cy="35%" r="65%">
            <stop offset="0%" stopColor={body} />
            <stop offset="100%" stopColor="#B47342" />
          </radialGradient>
        </defs>
        <ellipse cx="110" cy="316" rx="54" ry="10" fill="#020617" opacity="0.38" />

        {isWorm ? (
          <g>
            <circle cx="80" cy="245" r="28" fill={`url(#sk_${uid})`} stroke="#0F172A" strokeWidth="4" />
            <circle cx="105" cy="215" r="32" fill={`url(#sk_${uid})`} stroke="#0F172A" strokeWidth="4" />
            <circle cx="110" cy="175" r="36" fill={`url(#sk_${uid})`} stroke="#0F172A" strokeWidth="4" />
          </g>
        ) : (
          <g transform={`scale(${squashX}, ${squashY})`} style={{ transformOrigin: "110px 310px" }}>
            <path d={`M 93 232 Q ${91 + kneeShift} 268 93 304`} stroke="#1E293B" strokeWidth="22" strokeLinecap="round" fill="none" />
            <path d={`M 127 232 Q ${129 - kneeShift} 268 127 304`} stroke="#1E293B" strokeWidth="22" strokeLinecap="round" fill="none" />
            <path d="M 74 302 Q 92 294 106 304 L 106 314 L 74 314 Z" fill="#F1F5F9" stroke="#0F172A" strokeWidth="3.5" />
            <path d="M 114 304 Q 128 294 146 302 L 146 314 L 114 314 Z" fill="#F1F5F9" stroke="#0F172A" strokeWidth="3.5" />

            {pose === "arms_up" ? (
              <g>
                <path d="M 64 172 Q 44 145 34 114" stroke={dress} strokeWidth="17" fill="none" strokeLinecap="round" />
                <circle cx="32" cy="108" r="10.5" fill={body} stroke="#0F172A" strokeWidth="3.5" />
                <path d="M 156 172 Q 176 145 186 114" stroke={dress} strokeWidth="17" fill="none" strokeLinecap="round" />
                <circle cx="188" cy="108" r="10.5" fill={body} stroke="#0F172A" strokeWidth="3.5" />
              </g>
            ) : pose === "listen_ear" ? (
              <g>
                <path d="M 64 172 Q 40 200 68 220" stroke={dress} strokeWidth="16" fill="none" strokeLinecap="round" />
                <circle cx="68" cy="220" r="10" fill={body} stroke="#0F172A" strokeWidth="3.5" />
                <path d="M 156 172 Q 182 146 154 112" stroke={dress} strokeWidth="16" fill="none" strokeLinecap="round" />
                <circle cx="152" cy="108" r="10.5" fill={body} stroke="#0F172A" strokeWidth="3.5" />
                <path d="M 168 88 Q 182 104 168 122" stroke="#4ADE80" strokeWidth="3.5" fill="none" strokeLinecap="round" opacity={0.4 + Math.abs(Math.sin(frame * 0.2)) * 0.6} />
                <path d="M 178 80 Q 196 104 178 130" stroke="#FDE047" strokeWidth="3.5" fill="none" strokeLinecap="round" opacity={0.3 + Math.abs(Math.cos(frame * 0.2)) * 0.7} />
              </g>
            ) : pose === "wave" || pose === "point_up" ? (
              <g>
                <path d="M 64 172 Q 40 200 68 220" stroke={dress} strokeWidth="16" fill="none" strokeLinecap="round" />
                <circle cx="68" cy="220" r="10" fill={body} stroke="#0F172A" strokeWidth="3.5" />
                <path d={`M 156 172 Q 178 148 182 ${126 + waveY * 0.4}`} stroke={dress} strokeWidth="16" fill="none" strokeLinecap="round" />
                <circle cx="184" cy={120 + waveY * 0.4} r="10.5" fill={body} stroke="#0F172A" strokeWidth="3.5" />
              </g>
            ) : (
              <g>
                <path d="M 64 172 Q 40 200 68 220" stroke={dress} strokeWidth="16" fill="none" strokeLinecap="round" />
                <circle cx="68" cy="220" r="10" fill={body} stroke="#0F172A" strokeWidth="3.5" />
                <path d={`M 156 172 Q 174 188 178 ${196 + waveY * 0.5}`} stroke={dress} strokeWidth="16" fill="none" strokeLinecap="round" />
                <circle cx="180" cy={200 + waveY * 0.5} r="10" fill={body} stroke="#0F172A" strokeWidth="3.5" />
              </g>
            )}

            <path d="M 60 238 C 60 176 72 158 110 158 C 148 158 160 176 160 238 Z" fill={cfg.dress_style === "none" ? body : dress} stroke="#0F172A" strokeWidth="4.2" />
            <path d="M 110 158 C 148 158 160 176 160 238 L 110 238 Z" fill="#0F172A" opacity="0.10" />
            <rect x="96" y="138" width="28" height="24" rx="10" fill={body} stroke="#0F172A" strokeWidth="3.5" />
            <ellipse cx="110" cy="146" rx="12" ry="4" fill="#0F172A" opacity="0.2" />

            {cfg.dress_style === "suit" ? (
              <g>
                <polygon points="92,158 110,192 128,158" fill="#F8FAFC" stroke="#0F172A" strokeWidth="2.5" />
                <polygon points="110,162 102,202 110,222 118,202" fill="#EF4444" stroke="#0F172A" strokeWidth="2" />
              </g>
            ) : (
              <g>
                <path d="M 84 158 Q 110 176 136 158" fill="none" stroke="#0F172A" strokeWidth="4" />
                <rect x="84" y="198" width="52" height="26" rx="8" fill="#0F172A" opacity="0.14" stroke="#0F172A" strokeWidth="2.5" />
                <line x1="96" y1="168" x2="95" y2="188" stroke="#F8FAFC" strokeWidth="2.8" strokeLinecap="round" />
                <line x1="124" y1="168" x2="125" y2="188" stroke="#F8FAFC" strokeWidth="2.8" strokeLinecap="round" />
              </g>
            )}

            {prop === "camera" ? (
              <g>
                <path d="M 92 156 L 96 184 M 128 156 L 124 184" stroke="#EF4444" strokeWidth="3.5" strokeLinecap="round" />
                <rect x="90" y="182" width="40" height="26" rx="6" fill="#1E293B" stroke="#0F172A" strokeWidth="3" />
                <circle cx="110" cy="195" r="8.5" fill="#0284C7" stroke="#0F172A" strokeWidth="2.5" />
                <circle cx="107" cy="192" r="2.5" fill="#FFFFFF" opacity="0.85" />
              </g>
            ) : null}
          </g>
        )}

        <g transform={`rotate(${tilt} 110 110)`}>
          <circle cx="67" cy="106" r="10" fill={body} stroke="#0F172A" strokeWidth="3.5" />
          <circle cx="153" cy="106" r="10" fill={body} stroke="#0F172A" strokeWidth="3.5" />
          <path d="M 70 96 C 70 58 150 58 150 96 C 150 132 132 146 110 146 C 88 146 70 132 70 96 Z" fill={`url(#sk_${uid})`} stroke="#0F172A" strokeWidth="4.2" />
          <ellipse cx="84" cy="114" rx="8" ry="4" fill="#FB7185" opacity="0.22" />
          <ellipse cx="136" cy="114" rx="8" ry="4" fill="#FB7185" opacity="0.22" />
          <path d="M 108 102 L 106 113 Q 110 116 114 113" stroke="#78350F" strokeWidth="2.6" fill="none" strokeLinecap="round" opacity="0.7" />

          {cfg.hat === "none" || !cfg.hat ? (
            <g fill={hair}>
              <circle cx="80" cy="64" r="16" />
              <circle cx="100" cy="54" r="18" />
              <circle cx="122" cy="54" r="18" />
              <circle cx="140" cy="66" r="16" />
            </g>
          ) : null}

          {prop === "headband" ? (
            <rect x="70" y="72" width="80" height="10" rx="4" fill="#EF4444" stroke="#0F172A" strokeWidth="2.5" />
          ) : null}

          {expr === "angry" ? (
            <g stroke="#0F172A" strokeWidth="3.8" strokeLinecap="round">
              <line x1="80" y1="82" x2="102" y2="89" /><line x1="140" y1="82" x2="118" y2="89" />
            </g>
          ) : expr === "surprised" ? (
            <g stroke="#0F172A" strokeWidth="3.5" fill="none" strokeLinecap="round">
              <path d="M 80 80 Q 92 72 102 80" /><path d="M 118 80 Q 128 72 140 80" />
            </g>
          ) : (
            <g stroke="#0F172A" strokeWidth="3.5" fill="none" strokeLinecap="round">
              <path d="M 80 86 Q 92 80 102 86" /><path d="M 118 86 Q 128 80 140 86" />
            </g>
          )}

          <ellipse cx="92" cy="100" rx="8" ry={blink ? 1.5 : 8} fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.5" />
          <ellipse cx="128" cy="100" rx="8" ry={blink ? 1.5 : 8} fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.5" />
          {!blink ? (
            <g>
              <circle cx={93 + lookX} cy="100" r="4.2" fill="#0F172A" />
              <circle cx={129 + lookX} cy="100" r="4.2" fill="#0F172A" />
              <circle cx={94.5 + lookX} cy="98" r="1.6" fill="#FFFFFF" />
              <circle cx={130.5 + lookX} cy="98" r="1.6" fill="#FFFFFF" />
            </g>
          ) : null}

          {cfg.mustache !== "none" ? (
            <path d="M 94 119 Q 110 112 126 119 Q 110 123 94 119 Z" fill={hair} stroke="#0F172A" strokeWidth="2" />
          ) : null}

          {renderMouth()}

          {cfg.hat === "cap" ? (
            <g>
              <path d="M 68 76 C 72 48 148 48 152 76 Z" fill={hatColor} stroke="#0F172A" strokeWidth="3.5" />
              <path d="M 66 76 L 166 76" stroke="#0F172A" strokeWidth="6" strokeLinecap="round" />
            </g>
          ) : cfg.hat === "crown" ? (
            <polygon points="78,72 86,44 102,60 110,38 118,60 134,44 142,72" fill="#FACC15" stroke="#0F172A" strokeWidth="3.5" />
          ) : null}
        </g>
      </svg>
      <div style={{ marginTop: -8, padding: "4px 12px", borderRadius: 999, backgroundColor: active ? accent : "rgba(15,23,42,0.85)", color: active ? "#020617" : "#E2E8F0", fontSize: 14, fontWeight: 800, border: `1.5px solid ${accent}` }}>{name}</div>
    </div>
  );
};
