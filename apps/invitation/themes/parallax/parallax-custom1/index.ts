import ParallaxCustomThemeRenderer from './components/ParallaxCustomThemeRenderer';
import { getAssetManifest } from './config/assetManifest';
import { animationConfig } from './config/animationConfig';
import { getThemeTextConfig } from './config/textConfig';
import type { TemplateDefinition } from '@/themes/types';

export const themeLoadingDesign = 'custom1';
export const parallaxCustom1ThemeDefinition: TemplateDefinition = {
  // Metadata
  metadata: {
    key: 'parallax/parallax-custom1',
    name: 'Parallax Custom 1',
    description: 'Elegant 3D parallax animation with integrated scrollable content',
    preview: '/previews/parallax-custom1.jpg',
    version: '1.0.0',
    tags: ['parallax', '3d', 'animation', 'premium'],
  },

  // Opening configuration (will be extracted later)
  opening: {
    type: 'parallax-animation',
    enabled: true,
    loadingDesign: 'custom1', // Use custom animated loading overlay
    config: {
      allowSkip: false,
      autoPlayMusic: true,
    },
  },

  // Content layout configuration (will be extracted later)
  contentLayout: {
    type: 'layout-a',
    component: null as any, // Temporary, will be set after extraction
    config: {
      showFooter: true,
      sectionOrder: ['saveTheDate', 'wishes', 'loveStory', 'gallery', 'weddingGift', 'closing'],
    },
  },

  // Theme configuration
  theme: {
    colors: {
      primary: '#3b82f6',
      secondary: '#60a5fa',
      accent: '#1e40af',
      background: '#ffffff',
      text: '#1f2937',
    },
    fonts: {
      heading: 'Tangerine',
      body: 'Segoe UI',
      signature: 'Tangerine',
    },
    spacing: {
      section: '5rem',
      container: '1.5rem',
    },
  },

  // Legacy support - use existing CustomThemeRenderer during migration
  render: ParallaxCustomThemeRenderer,

  // Existing configs
  getAssetManifest,
  animationConfig,
  textConfig: getThemeTextConfig,
};

export type ParallaxCustom1ThemeDefinition = typeof parallaxCustom1ThemeDefinition;
