export interface AssetRecord {
  asset_id: string;
  type: "lottie" | "lut" | "texture" | "image" | "audio" | "plate";
  path: string;
  sha256: string;
  width?: number;
  height?: number;
  validated: boolean;
}

export interface AssetManifest {
  version: string;
  assets: Record<string, AssetRecord>;
}

export function resolveLocalAsset(manifest: AssetManifest | undefined, assetId: string): AssetRecord | null {
  if (!manifest || !manifest.assets) return null;
  const rec = manifest.assets[assetId];
  if (!rec || !rec.validated || !rec.sha256) return null;
  return rec;
}
