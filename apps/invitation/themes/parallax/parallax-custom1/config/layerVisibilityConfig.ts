export interface LayerVisibilityConfig {
  background: boolean;
  coupleGroup: boolean;
  gate: boolean;
  pengantin: boolean;
  grassPengantin: boolean;
  foregroundGrass: boolean;
}

export const LAYER_VISIBILITY_CONFIG: LayerVisibilityConfig = {
  background: true,
  coupleGroup: true,
  gate: false,
  pengantin: true,
  grassPengantin: false,
  foregroundGrass: false,
};
