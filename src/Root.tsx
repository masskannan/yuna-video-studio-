import React from 'react';
import { Composition } from 'remotion';
import { ChunkScene } from './parts/ChunkScene';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="Part1" component={ChunkScene} durationInFrames={1800} fps={30} width={1920} height={1080} defaultProps={{ part: 1, title: 'Part 1: Hook & Story Setup', accent: '#38BDF8', wide: true }} />
      <Composition id="Part2" component={ChunkScene} durationInFrames={1800} fps={30} width={1920} height={1080} defaultProps={{ part: 2, title: 'Part 2: Core Turning Point', accent: '#A855F7', wide: true }} />
      <Composition id="Part3" component={ChunkScene} durationInFrames={1800} fps={30} width={1920} height={1080} defaultProps={{ part: 3, title: 'Part 3: Climax & Takeaway', accent: '#22C55E', wide: true }} />
      <Composition id="Reel9x16" component={ChunkScene} durationInFrames={1050} fps={30} width={1080} height={1920} defaultProps={{ part: 1, title: '35s Vertical Highlight', accent: '#F59E0B', wide: false }} />
    </>
  );
};
