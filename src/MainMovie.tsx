import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import timeline from '../timeline.json';
import brand from '../brand.json';
export const MainMovie: React.FC<{ wide?: boolean }> = ({ wide = true }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const sec = frame / fps;
  const scenes = timeline.scenes || [];
  const active = scenes.find((s) => sec >= s.start_sec && sec < s.end_sec) || scenes[scenes.length - 1];
  const localFrame = Math.max(0, frame - active.start_sec * fps);
  const pop = spring({ frame: localFrame, fps, config: { damping: 14, stiffness: 130 } });
  const prog = interpolate(frame, [0, durationInFrames], [0, 100]);
  const acc = active.accent || brand.primary_color;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 30% 25%, ${brand.bg_top} 0%, ${brand.bg_bottom} 75%)`, color: '#F8FAFC', fontFamily: '"Noto Sans Tamil", "Space Grotesk", system-ui, sans-serif', padding: wide ? '72px 96px' : '110px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: wide ? 26 : 30, fontWeight: 700, color: acc }}>SCENE {active.part} / {scenes.length}</div>
        <div style={{ fontSize: wide ? 22 : 24, color: '#94A3B8' }}>{brand.brand_name}</div>
      </div>
      <div style={{ transform: `scale(${0.92 + 0.08 * pop})` }}>
        <div style={{ fontSize: wide ? 62 : 54, fontWeight: 800, lineHeight: 1.3 }}>{active.heading}</div>
      </div>
      <div style={{ width: '100%', height: 10, background: '#1E293B', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${prog}%`, height: '100%', background: acc }} />
      </div>
    </AbsoluteFill>
  );
};
