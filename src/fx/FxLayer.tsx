import React from "react";
import { useVideoConfig } from "remotion";
import { FxMode } from "./core/FxRegistry";
import { resolveEffectiveFx } from "./core/FxResolver";
import { ProfileAspect } from "./core/SafeZoneResolver";
import { CinematicLetterbox } from "./camera/CinematicLetterbox";
import { LowerThirdTitle } from "./typography/LowerThirdAndHighlight";
import { CountdownRing } from "./ui/UiCardsPack";
import { SvgLineChart } from "./charts/SvgCharts";
import { SpeedLinesOverlay } from "./motion/SpeedLinesAndMask";
export const FxLayer: React.FC<{fxMode?: FxMode; scenes?: any[]}> = ({fxMode = "SAFE"}) => {
  const { width, height, durationInFrames } = useVideoConfig();
  if (fxMode === "SAFE") return null;
  const aspect: ProfileAspect = width > height ? "16:9" : "9:16";
  const r = resolveEffectiveFx(fxMode, {cinematic_letterbox:{enabled:true,bar_pct:0.08},lower_third_title:{enabled:true}});
  return <><SpeedLinesOverlay config={r.weather_speed_lines} fxMode={fxMode} /><CinematicLetterbox config={r.cinematic_letterbox} fxMode={fxMode} /><LowerThirdTitle config={r.lower_third_title} fxMode={fxMode} aspect={aspect} /><CountdownRing config={r.countdown_ring} fxMode={fxMode} startFrame={0} durationFrames={durationInFrames} aspect={aspect} /><SvgLineChart config={r.svg_charts} fxMode={fxMode} /></>;
};
