import React from 'react';
import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

type Props = {
  part: number;
  title: string;
  accent: string;
  wide: boolean;
  audioFile?: string;
};

export const ChunkScene: React.FC<Props> = ({ part, title, accent, wide, audioFile }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const prog = interpolate(frame, [0, durationInFrames], [0, 100]);

  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(circle at 30% 25%, #171333 0%, #070913 75%)',
        color: '#F8FAFC',
        fontFamily: '"Noto Sans Tamil", "Space Grotesk", system-ui, sans-serif',
        padding: wide ? '72px 96px' : '110px 56px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {audioFile ? <Audio src={staticFile(audioFile)} /> : null}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: wide ? 26 : 30, fontWeight: 700, color: accent }}>
          STAGE {part} / 3
        </div>
        <div style={{ fontSize: wide ? 22 : 24, color: '#94A3B8' }}>
          YUNA Studio
        </div>
      </div>

      <div style={{ transform: `scale(${0.92 + 0.08 * pop})` }}>
        <div style={{ fontSize: wide ? 64 : 58, fontWeight: 800, lineHeight: 1.25 }}>
          {title}
        </div>
      </div>

      <div style={{ width: '100%', height: 10, background: '#1E293B', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${prog}%`, height: '100%', background: accent }} />
      </div>
    </AbsoluteFill>
  );
};
