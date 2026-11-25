export type ProfileAspect = "16:9" | "9:16" | "3:4" | "4:5";

export interface SafeZoneBox {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

const SAFE_ZONES: Record<ProfileAspect, SafeZoneBox> = {
  "16:9": { top: 0.05, bottom: 0.12, left: 0.05, right: 0.05 },
  "9:16": { top: 0.14, bottom: 0.35, left: 0.06, right: 0.11 },
  "3:4": { top: 0.06, bottom: 0.10, left: 0.06, right: 0.06 },
  "4:5": { top: 0.06, bottom: 0.10, left: 0.06, right: 0.06 }
};

export function getSafeZone(aspect: ProfileAspect): SafeZoneBox {
  return SAFE_ZONES[aspect] ?? SAFE_ZONES["16:9"];
}

export function clampToSafeZone(x: number, y: number, aspect: ProfileAspect): { x: number; y: number } {
  const z = getSafeZone(aspect);
  return {
    x: Math.max(z.left, Math.min(1 - z.right, x)),
    y: Math.max(z.top, Math.min(1 - z.bottom, y))
  };
}
