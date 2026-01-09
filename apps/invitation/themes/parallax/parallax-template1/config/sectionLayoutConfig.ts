export type LayerPose = {
  scale: number;
  x: number;
  y: number;
};

export type GrassPose = {
  scale: number;
  y: number;
  opacity?: number;
};

export interface SectionLayout {
  background: LayerPose;
  couple: LayerPose;
  grass?: GrassPose;
}

export const SECTION_LAYOUTS: Record<number, SectionLayout> = {
  1: {
    background: { scale: 1.1, x: 10, y: 5 },
    couple: { scale: 0.10, x: 0, y: -300 },
    grass: { scale: 1.4, y: 30, opacity: 1 },
  },
  2: {
    background: { scale: 1.5, x: -30, y: 15 },
    couple: { scale: 0.2, x: -700, y: 400 },
    grass: { scale: 1.8, y: 30, opacity: 1 },
  },
  3: {
    background: { scale: 1.5, x: 30, y: 15 },
    couple: { scale: 0.2, x: 700, y: 400 },
    grass: { scale: 1.8, y: 30, opacity: 1 },
  },
  4: {
    background: { scale: 1.452, x: 18, y: 9 },
    couple: { scale: 0.14, x: 0, y: 400 },
    grass: { scale: 1.54, y: 270, opacity: 1 },
  },
  5: {
    background: { scale: 1.1, x: 0, y: -10 },
    couple: { scale: 0.13, x: 0, y: 220 },
    grass: { scale: 1.3, y: 50, opacity: 1 },
  },
  6: {
    background: { scale: 1.1, x: 0, y: -30 },
    couple: { scale: 0.12, x: 0, y: -450 },
    grass: { scale: 1.2, y: -50, opacity: 1 },
  },
};
