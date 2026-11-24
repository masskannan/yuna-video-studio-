import React from 'react';
import { Composition } from 'remotion';
import timeline from '../timeline.json';
import { MainMovie } from './MainMovie';
export const RemotionRoot: React.FC = () => {
  const fps = timeline.fps || 30;
  return (
    <>
      <Composition id="MainMovie" component={MainMovie} durationInFrames={(timeline.total_sec || 60) * fps} fps={fps} width={1920} height={1080} defaultProps={{ wide: true }} />
      <Composition id="Reel9x16" component={MainMovie} durationInFrames={(timeline.reel_sec || 35) * fps} fps={fps} width={1080} height={1920} defaultProps={{ wide: false }} />
    </>
  );
};
