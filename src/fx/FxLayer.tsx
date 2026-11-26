import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { FxMode } from "./core/FxRegistry";
import { ProfileAspect } from "./core/SafeZoneResolver";
import { CinematicLetterbox } from "./camera/CinematicLetterbox";
import { SpotlightMask } from "./camera/CameraExtended";
import { LowerThirdTitle } from "./typography/LowerThirdAndHighlight";
import { CountdownRing } from "./ui/UiCardsPack";
import { ChatBubble, CursorRipple } from "./ui/UiExtendedPack";
import { SvgLineChart } from "./charts/SvgCharts";
import { SpeedLinesOverlay } from "./motion/SpeedLinesAndMask";
import { AudioWaveformGlow } from "./audio/AudioReactive";
import { PodcastSpeakerGlow } from "./audio/PodcastAndBeat";
import { BokehBackdrop } from "./motion/ParticlesAndBlur";
import { SceneTransition } from "./transitions/SceneTransition";
import { ComicSpeechBubble, ComicStarburst, ChalkHighlight } from "./cartoon/CartoonPack";
import { CardRain40, NeonTopicRow, BusLoadBalancer, HotelMenuCard, PaymentStampCard } from "./MetaphorWidgets";

export const FxLayer: React.FC<{fxMode?: FxMode; scenes?: any[]}> = ({fxMode = "SAFE", scenes = []}) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  if (fxMode === "SAFE") return null;
  const aspect: ProfileAspect = width > height ? "16:9" : "9:16";
  const count = Math.max(1, scenes.length || 1);
  const seg = Math.max(1, Math.floor(durationInFrames / count));
  const idx = Math.min(count - 1, Math.floor(frame / seg));
  const cur = scenes[idx] || {};
  const title = String(cur.heading || "YUNA Studio");
  const metaphor = String(cur.metaphor || "");
  const on = { enabled: true };

  const renderMetaphor = () => {
    if (metaphor === "card_rain" || (!metaphor && idx === 0)) return <CardRain40 title={title.slice(0, 22)} />;
    if (metaphor === "neon_topics" || (!metaphor && idx === 1)) return <NeonTopicRow />;
    if (metaphor === "bus_balancer") return <BusLoadBalancer />;
    if (metaphor === "hotel_menu") return <HotelMenuCard />;
    if (metaphor === "payment_stamp") return <PaymentStampCard />;
    return <NeonTopicRow />;
  };

  return (
    <>
      <BokehBackdrop config={on} fxMode={fxMode} />
      <AudioWaveformGlow config={on} fxMode={fxMode} />
      <PodcastSpeakerGlow config={on} fxMode={fxMode} active={true} />
      <LowerThirdTitle config={on} fxMode={fxMode} aspect={aspect} title={title} />
      <SceneTransition config={on} fxMode={fxMode} startFrame={idx * seg} durationFrames={12} kind={idx % 2 === 0 ? "wipe" : "slide"} />
      {renderMetaphor()}
      {idx === 0 ? (
        <>
          <SpeedLinesOverlay config={on} fxMode={fxMode} />
          <ComicStarburst config={on} fxMode={fxMode} label="HOT" />
          <CountdownRing config={on} fxMode={fxMode} startFrame={0} durationFrames={seg} aspect={aspect} />
        </>
      ) : idx === 1 ? (
        <>
          <ComicSpeechBubble config={on} fxMode={fxMode} text={title} />
          <SvgLineChart config={on} fxMode={fxMode} values={[18, 42, 36, 74, 96]} />
          <ChalkHighlight config={on} fxMode={fxMode} />
        </>
      ) : (
        <>
          <SpotlightMask config={on} fxMode={fxMode} />
          <ChatBubble config={on} fxMode={fxMode} sender="YUNA" msg={title} />
          <CursorRipple config={on} fxMode={fxMode} x={0.72} y={0.36} />
          <CinematicLetterbox config={on} fxMode={fxMode} />
        </>
      )}
    </>
  );
};
