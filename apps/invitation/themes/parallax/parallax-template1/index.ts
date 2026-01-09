import type { TemplateDefinition } from '@/themes/types';
import ParallaxTemplateThemeRenderer from './components/ParallaxTemplateThemeRenderer';
import { resolveTemplateLoadingDesign, templateLoadingConfig } from './config/loadingConfig';

const resolvedLoadingDesign = resolveTemplateLoadingDesign();
const enableCoverGate = templateLoadingConfig.enableCoverGate;

export const parallaxTemplate1ThemeDefinition: TemplateDefinition = {
    // Metadata
    metadata: {
        key: 'parallax/parallax-template1',
        name: 'Parallax Template 1',
        description: 'Modern parallax animation with composable architecture',
        preview: '/previews/parallax-template1.jpg',
        version: '2.0.0',
        tags: ['parallax', 'modern', 'composable', 'template'],
    },

    // Opening configuration - using parallax animation
    opening: {
        type: 'parallax-animation',
        enabled: true,
        loadingDesign: resolvedLoadingDesign,
        config: {
            allowSkip: false,
            autoPlayMusic: true,
            enableCoverGate,
        },
    },

    // Content layout configuration - using new standalone LayoutA
    contentLayout: {
        type: 'layout-a',
        component: null as any, // Uses InvitationParallax for now
        config: {
            showFooter: true,
            sectionOrder: ['saveTheDate', 'wishes', 'loveStory', 'gallery', 'weddingGift', 'closing'],
        },
    },

    // Theme configuration
    theme: {
        colors: {
            primary: '#10b981',
            secondary: '#34d399',
            accent: '#059669',
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

    // Use custom renderer that combines parallax opening + LayoutA
    render: ParallaxTemplateThemeRenderer,
};

export type ParallaxTemplate1ThemeDefinition = typeof parallaxTemplate1ThemeDefinition;
