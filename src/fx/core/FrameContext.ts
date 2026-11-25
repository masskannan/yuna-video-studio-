export interface FrameRange {
  startFrame: number;
  endFrameExclusive: number;
}

export function resolveGlobalFrame(
  localFrame: number,
  chunkStartFrame = 0,
  sceneStartFrame = 0,
  sequenceOffset = 0
): number {
  return Math.floor(chunkStartFrame + sceneStartFrame + sequenceOffset + localFrame);
}

export function isInFrameRange(globalFrame: number, range: FrameRange): boolean {
  return globalFrame >= range.startFrame && globalFrame < range.endFrameExclusive;
}

export function getRangeProgress(globalFrame: number, startFrame: number, durationFrames: number): number {
  if (durationFrames <= 0) return 0;
  const raw = (globalFrame - startFrame) / durationFrames;
  return Math.max(0, Math.min(1, raw));
}
