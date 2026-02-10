/**
 * Image Configuration
 * Centralized image path management
 */

import type { CustomImages } from '@/lib/repositories/clientRepository';

type ImageStyle = {
  left?: string;
  right?: string;
  top?: string;
  bottom?: string;
  width?: string;
  height?: string;
  transform?: string;
  zIndex?: number;
  rotate?: string;
  scale?: number;
};

// Centralized image keys so usage is consistent across components
export const IMAGE_KEYS = {
  COVER: 'cover',
  BACKGROUND: 'background',
  GATE: 'gate',
  PENGANTIN: 'pengantin',
  PENGANTIN_JAWA: 'pengantin_jawa',
  BACKGROUND_LIMASAN: 'background_limasan',
  GRASS: 'grass',
  GRASS_PENGANTIN: 'grass_pengantin',
  CLOUD_SMALL: 'cloud',
  CLOUD_BIG: 'cloudbig',
  GUNUNGAN_WAYANG: 'gunungan_wayang',
} as const;

export type ImageKey = (typeof IMAGE_KEYS)[keyof typeof IMAGE_KEYS];

// Default image paths mapping
const DEFAULT_IMAGE_PATHS: Record<ImageKey | string, string> = {
  cover: 'https://media.kirimkata.com/poppy_fadli-cover_fadli.jpg',
  background: 'https://media.kirimkata.com/limasan.jpg',
  gate: '',
  pengantin: 'https://media.kirimkata.com/poppy_fadli-pengantin_fadli_1280.png',
  grass: '',
  grass_pengantin: '',
  cloud: '/cloudsmall.webp',
  cloudbig: '/cloudbig.webp',
  gunungan_wayang: '',
  pengantin_jawa: 'https://media.kirimkata.com/poppy_fadli-fadli_jawa.png',
  background_limasan: 'https://media.kirimkata.com/rumah_gadang.jpg',
};

// Runtime custom images override (set by theme renderer)
let customImagesOverride: CustomImages | null = null;

/**
 * Set custom images override for this theme instance
 * Called by theme renderer with client's custom images
 */
export function setCustomImages(customImages: CustomImages | null) {
  customImagesOverride = customImages;
}

/**
 * Get current image paths with custom overrides applied
 */
function getImagePaths(): Record<ImageKey | string, string> {
  if (!customImagesOverride) {
    return DEFAULT_IMAGE_PATHS;
  }

  return {
    ...DEFAULT_IMAGE_PATHS,
    ...(customImagesOverride.background && { background: customImagesOverride.background }),
    ...(customImagesOverride.background_limasan && { background_limasan: customImagesOverride.background_limasan }),
    ...(customImagesOverride.pengantin && { pengantin: customImagesOverride.pengantin }),
    ...(customImagesOverride.pengantin_jawa && { pengantin_jawa: customImagesOverride.pengantin_jawa }),
  };
}

// Image position presets for layered scenes
const IMAGE_POSITIONS: Record<string, ImageStyle> = {
  gate: {
    left: '0',
    bottom: '0px',
    width: '1080px',
    height: 'auto',
    // 1500 / 1080 ≈ 1.3889 to preserve previous visual size after width update
    transform: 'translate3d(0, 0, 0) scale(1.3889)',
  },
};

type CoupleImageKey =
  | 'gate'
  | 'pengantin'
  | 'grass_pengantin'
  | 'gunungan_left'
  | 'gunungan_right'
  | 'gunungan_left2'
  | 'gunungan_right2'
  | 'gunungan_left3'
  | 'gunungan_right3';

const COUPLE_GROUP_POSITIONS: Record<CoupleImageKey, ImageStyle> = {
  gate: {
    left: '750px',
    bottom: '1100px',
    width: '1080px',
    height: 'auto',
    // 3000 / 1080 ≈ 2.7778 to preserve previous visual size
    scale: 3.2,
  },
  pengantin: {
    left: '170px',
    bottom: '-150px',
    width: '1125px',
    height: 'auto',
    // 1500 / 960 = 1.5625
    scale: 3,
  },
  grass_pengantin: {
    left: '240px',
    bottom: '-300px',
    width: '1000px',
    height: 'auto',
    zIndex: 4,
    // 2500 / 1000 = 2.5
    scale: 2.9,
  },
  gunungan_left: {
    left: '-1100px',
    bottom: '-800px',
    width: '1000px',
    height: 'auto',
    zIndex: 5,
    scale: 1.05,
  },
  gunungan_right: {
    left: '1600px',
    bottom: '-800px',
    width: '1000px',
    height: 'auto',
    zIndex: 5,
    scale: 1.05,
  },
  gunungan_left2: {
    left: '-1600px',
    bottom: '-1300px',
    width: '1000px',
    height: 'auto',
    zIndex: 5,
    scale: 1.3,
  },
  gunungan_right2: {
    left: '2100px',
    bottom: '-1300px',
    width: '1000px',
    height: 'auto',
    zIndex: 5,
    scale: 1.3,
  },
  gunungan_left3: {
    left: '-1900px',
    bottom: '-1550px',
    width: '1000px',
    height: 'auto',
    zIndex: 5,
    scale: 1.4,
  },
  gunungan_right3: {
    left: '2400px',
    bottom: '-1550px',
    width: '1000px',
    height: 'auto',
    zIndex: 5,
    scale: 1.4,
  },
};

/**
 * Get image path by key
 * @param key - Image key
 * @param fallback - Fallback path if key not found
 * @returns Image path
 */
export function getImage(key: ImageKey | string, fallback?: string): string {
  const imagePaths = getImagePaths();
  return imagePaths[key] || fallback || imagePaths.background;
}

/**
 * Get image position style by key
 * @param key - Image key
 * @returns Style object or undefined
 */
export function getImagePosition(key: string): ImageStyle | undefined {
  return IMAGE_POSITIONS[key];
}

export function getCoupleGroupPosition(key: CoupleImageKey): ImageStyle | undefined {
  return COUPLE_GROUP_POSITIONS[key];
}

/**
 * Get all image paths for asset preloading
 * @returns Array of image paths
 */
export function getAllImagePaths(): string[] {
  const imagePaths = getImagePaths();
  return Array.from(new Set(Object.values(imagePaths)));
}
