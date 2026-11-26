import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { FxMode } from "./core/FxRegistry";
import { AudioWaveformGlow } from "./audio/AudioReactive";
import { BokehBackdrop } from "./motion/ParticlesAndBlur";
import { SceneTransition } from "./transitions/SceneTransition";
import { SpeedLinesOverlay } from "./motion/SpeedLinesAndMask";
import { ComicStarburst } from "./cartoon/CartoonPack";
import { CursorRipple } from "./ui/UiExtendedPack";
import { CardRain40, NeonTopicRow, BusLoadBalancer, HotelMenuCard, PaymentStampCard } from "./MetaphorWidgets";

export const FxLayer: React.FC<{fxMode?: FxMode; scenes?: any[]}> = ({fxMode = "SAFE", scenes = []}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  if (fxMode === "SAFE") return null;
  const count = Math.max(1, scenes.length || 1);
  const seg = Math.max(1, Math.floor(durationInFrames / count));
  const idx = Math.min(count - 1, Math.floor(frame / seg));
  const cur = scenes[idx] || {};
  const title = String(cur.heading || "YUNA Studio");
  const metaphor = String(cur.metaphor || "");
  const topics = Array.isArray(cur.topics) && cur.topics.length ? cur.topics : undefined;
  const items = Array.isArray(cur.metaphor_items) && cur.metaphor_items.length ? cur.metaphor_items : topics;
  const on = { enabled: true };

  const renderMetaphor = () => {
    if (metaphor === "card_rain" || (!metaphor && idx === 0)) return <CardRain40 title={title.slice(0, 24)} />;
    if (metaphor === "bus_balancer") return <BusLoadBalancer title={title} items={items} />;
    if (metaphor === "hotel_menu") return <HotelMenuCard title={title} items={items} />;
    if (metaphor === "payment_stamp") return <PaymentStampCard title={title} items={items} />;
    return <NeonTopicRow topics={topics} />;
  };

  return (
    <>
      <BokehBackdrop config={on} fxMode={fxMode} />
      <AudioWaveformGlow config={on} fxMode={fxMode} />
      <SceneTransition config={on} fxMode={fxMode} startFrame={idx * seg} durationFrames={10} kind={idx % 2 === 0 ? "wipe" : "slide"} />
      {renderMetaphor()}
      {idx === 0 ? (
        <>
          <SpeedLinesOverlay config={on} fxMode={fxMode} />
          <ComicStarburst config={on} fxMode={fxMode} label="NEW!" />
        </>
      ) : (
        <CursorRipple config={on} fxMode={fxMode} x={0.72} y={0.38} />
      )}
    </>
  );
};
