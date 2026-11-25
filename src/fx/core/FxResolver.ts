import { FX_REGISTRY, FxConfig, FxMode, shouldRenderFx } from "./FxRegistry";

export interface SceneFxInput {
  preset?: string;
  overrides?: Record<string, Partial<FxConfig>>;
}

export function resolveEffectiveFx(
  fxMode: FxMode,
  presetEffects: Record<string, FxConfig> = {},
  sceneInput?: SceneFxInput
): Record<string, FxConfig> {
  const resolved: Record<string, FxConfig> = {};
  for (const id of Object.keys(FX_REGISTRY)) {
    const base = presetEffects[id] ?? { enabled: false };
    const override = sceneInput?.overrides?.[id] ?? {};
    const merged: FxConfig = { ...base, ...override, enabled: Boolean(override.enabled ?? base.enabled) };
    resolved[id] = shouldRenderFx(merged, fxMode, id) ? merged : { ...merged, enabled: false };
  }
  return resolved;
}
