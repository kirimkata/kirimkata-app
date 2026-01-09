// Centralized configuration for cloud visuals (size, opacity, and text)

export type CloudRangeId = '0-1' | '4-5' | '5-6';

export interface CloudOpacityRange {
  min: number; // 0..1
  max: number; // 0..1
}

export interface CloudPositionConfig {
  baseTopPercent: number;
}

export interface CloudVisualConfig {
  // Width of the cloud image container in pixels
  width: number;
  // Opacity range used by the section logic (min/max)
  opacity: CloudOpacityRange;
  // Key used with getCloudText(textKey)
  textKey: string;
  // Position configuration
  position: CloudPositionConfig;
}

export const cloudConfig: Record<CloudRangeId, CloudVisualConfig> = {
  '0-1': {
    // Section 0 -> 1: small welcome cloud
    width: 650,
    opacity: { min: 0, max: 0 },
    textKey: 'section0',
    position: {
      baseTopPercent: 4,
    },
  },
  '4-5': {
    // Section 4 -> 5: big event cloud (Holy Matrimony + Reception)
    width: 900,
    opacity: { min: 0, max: 0.9 },
    textKey: 'section3',
    position: {
      baseTopPercent: 0,
    },
  },
  '5-6': {
    // Section 5 -> 6: small closing cloud
    width: 600,
    opacity: { min: 0, max: 0.8 },
    textKey: 'section4',
    position: {
      baseTopPercent: 0,
    },
  },
};

export function getCloudConfig(range: CloudRangeId): CloudVisualConfig {
  return cloudConfig[range];
}

export function getCloudConfigForSections(
  fromSection: number,
  toSection: number,
): CloudVisualConfig | null {
  if (
    (fromSection === 0 && toSection === 1) ||
    (fromSection === 1 && toSection === 0)
  ) {
    return cloudConfig['0-1'];
  }

  if (
    (fromSection === 4 && toSection === 5) ||
    (fromSection === 5 && toSection === 4)
  ) {
    return cloudConfig['4-5'];
  }

  if (
    (fromSection === 5 && toSection === 6) ||
    (fromSection === 6 && toSection === 5)
  ) {
    return cloudConfig['5-6'];
  }

  return null;
}