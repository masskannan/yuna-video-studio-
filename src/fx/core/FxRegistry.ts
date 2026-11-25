export type FxMode = "SAFE" | "HYBRID" | "PRO";
export type FxPlacement = "remotion-native" | "hybrid" | "offline" | "blender";

export interface FxFeatureMeta {
  id: string;
  num: number;
  placement: FxPlacement;
  minMode: FxMode;
}

export interface FxConfig {
  enabled: boolean;
  [key: string]: unknown;
}

const MODE_RANK: Record<FxMode, number> = { SAFE: 0, HYBRID: 1, PRO: 2 };

export const FX_REGISTRY: Record<string, FxFeatureMeta> = {
  lottie_icons: { id: "lottie_icons", num: 1, placement: "remotion-native", minMode: "HYBRID" },
  scene_transitions: { id: "scene_transitions", num: 2, placement: "remotion-native", minMode: "HYBRID" },
  ui_tilt_bokeh: { id: "ui_tilt_bokeh", num: 3, placement: "hybrid", minMode: "HYBRID" },
  audio_waveform_glow: { id: "audio_waveform_glow", num: 4, placement: "hybrid", minMode: "HYBRID" },
  asset_vault: { id: "asset_vault", num: 5, placement: "offline", minMode: "HYBRID" },
  cinematic_letterbox: { id: "cinematic_letterbox", num: 6, placement: "remotion-native", minMode: "HYBRID" },
  dolly_zoom: { id: "dolly_zoom", num: 7, placement: "blender", minMode: "PRO" },
  rack_focus: { id: "rack_focus", num: 8, placement: "hybrid", minMode: "PRO" },
  focal_point_zoom: { id: "focal_point_zoom", num: 9, placement: "remotion-native", minMode: "HYBRID" },
  animated_code_typing: { id: "animated_code_typing", num: 10, placement: "remotion-native", minMode: "HYBRID" },
  device_mockups_3d: { id: "device_mockups_3d", num: 11, placement: "blender", minMode: "PRO" },
  cursor_ripple_drag: { id: "cursor_ripple_drag", num: 12, placement: "remotion-native", minMode: "HYBRID" },
  frosted_glass_cards: { id: "frosted_glass_cards", num: 13, placement: "remotion-native", minMode: "HYBRID" },
  chat_bubbles: { id: "chat_bubbles", num: 14, placement: "remotion-native", minMode: "HYBRID" },
  magnifier_loupe: { id: "magnifier_loupe", num: 15, placement: "hybrid", minMode: "HYBRID" },
  browser_scroll_theme: { id: "browser_scroll_theme", num: 16, placement: "remotion-native", minMode: "HYBRID" },
  vertical_timeline: { id: "vertical_timeline", num: 17, placement: "remotion-native", minMode: "HYBRID" },
  countdown_ring: { id: "countdown_ring", num: 18, placement: "remotion-native", minMode: "HYBRID" },
  comic_speech_bubbles: { id: "comic_speech_bubbles", num: 19, placement: "remotion-native", minMode: "HYBRID" },
  four_layer_parallax: { id: "four_layer_parallax", num: 20, placement: "blender", minMode: "PRO" },
  character_action_cycles: { id: "character_action_cycles", num: 21, placement: "hybrid", minMode: "HYBRID" },
  weather_speed_lines: { id: "weather_speed_lines", num: 22, placement: "remotion-native", minMode: "HYBRID" },
  spotlight_focus_mask: { id: "spotlight_focus_mask", num: 23, placement: "remotion-native", minMode: "HYBRID" },
  svg_charts: { id: "svg_charts", num: 24, placement: "remotion-native", minMode: "HYBRID" },
  map_pin_route: { id: "map_pin_route", num: 25, placement: "remotion-native", minMode: "HYBRID" },
  lower_third_title: { id: "lower_third_title", num: 26, placement: "remotion-native", minMode: "HYBRID" },
  podcast_speaking_glow: { id: "podcast_speaking_glow", num: 27, placement: "hybrid", minMode: "HYBRID" },
  comic_starburst: { id: "comic_starburst", num: 28, placement: "remotion-native", minMode: "HYBRID" },
  before_after_wipe: { id: "before_after_wipe", num: 29, placement: "remotion-native", minMode: "HYBRID" },
  floating_product_reflection: { id: "floating_product_reflection", num: 30, placement: "blender", minMode: "PRO" },
  price_slash_offer: { id: "price_slash_offer", num: 31, placement: "remotion-native", minMode: "HYBRID" },
  box_ebook_3d: { id: "box_ebook_3d", num: 32, placement: "blender", minMode: "PRO" },
  five_star_reviews: { id: "five_star_reviews", num: 33, placement: "remotion-native", minMode: "HYBRID" },
  masked_text_highlighter: { id: "masked_text_highlighter", num: 34, placement: "remotion-native", minMode: "HYBRID" },
  chalk_circle_sheen: { id: "chalk_circle_sheen", num: 35, placement: "hybrid", minMode: "HYBRID" },
  glitch_rgb_split: { id: "glitch_rgb_split", num: 36, placement: "hybrid", minMode: "PRO" },
  film_grain_halation: { id: "film_grain_halation", num: 37, placement: "offline", minMode: "PRO" },
  beat_synced_pulse: { id: "beat_synced_pulse", num: 38, placement: "hybrid", minMode: "PRO" },
  polaroid_collage: { id: "polaroid_collage", num: 39, placement: "remotion-native", minMode: "HYBRID" },
  whip_pan_blur: { id: "whip_pan_blur", num: 40, placement: "hybrid", minMode: "PRO" },
  spotify_duotone: { id: "spotify_duotone", num: 41, placement: "offline", minMode: "PRO" },
  vhs_crt_scanlines: { id: "vhs_crt_scanlines", num: 42, placement: "offline", minMode: "PRO" },
  seamless_reel_loop: { id: "seamless_reel_loop", num: 43, placement: "offline", minMode: "PRO" },
  global_color_grade_lut: { id: "global_color_grade_lut", num: 44, placement: "offline", minMode: "PRO" },
  safe_zone_autoclamp: { id: "safe_zone_autoclamp", num: 45, placement: "remotion-native", minMode: "HYBRID" }
};

export function shouldRenderFx(
  config: FxConfig | undefined | null,
  mode: FxMode = "SAFE",
  featureId?: string
): boolean {
  if (mode === "SAFE") return false;
  if (!config || !config.enabled) return false;
  if (featureId && FX_REGISTRY[featureId]) {
    return MODE_RANK[mode] >= MODE_RANK[FX_REGISTRY[featureId].minMode];
  }
  return true;
}
