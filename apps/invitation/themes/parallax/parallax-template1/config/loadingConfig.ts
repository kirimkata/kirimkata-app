import type { LoadingDesignType } from '@/themes/types';

export interface TemplateLoadingConfig {
  /**
   * Toggle to enable premium/custom loading designs for this template.
   * When set to false, Template1 will always fall back to the general loader.
   */
  enableCustomLoadingDesign: boolean;
  /**
   * Toggle cover gate animation on the opening cover.
   * When disabled, the cover shows immediately after loading without gate animation.
   */
  enableCoverGate: boolean;
  /**
   * Currently selected loading design (must exist in availableDesigns).
   * Can be 'general' to explicitly use the default loader even when custom designs are enabled.
   */
  selectedDesign: LoadingDesignType;
  /**
   * Designs that this template supports. Useful when more loaders become available.
   */
  availableDesigns: LoadingDesignType[];
}

export const templateLoadingConfig: TemplateLoadingConfig = {
  enableCustomLoadingDesign: true,
  enableCoverGate: false,
  selectedDesign: 'custom1',
  availableDesigns: ['general', 'custom1'],
};

/**
 * Resolve which loading design should be used by Template1.
 * - Respects the enableCustomLoadingDesign "gate"
 * - Ensures selected designs exist in availableDesigns list
 */
export function resolveTemplateLoadingDesign(preferredDesign?: LoadingDesignType): LoadingDesignType {
  if (!templateLoadingConfig.enableCustomLoadingDesign) {
    return 'general';
  }

  const candidate = preferredDesign ?? templateLoadingConfig.selectedDesign ?? 'general';
  return templateLoadingConfig.availableDesigns.includes(candidate)
    ? candidate
    : 'general';
}
