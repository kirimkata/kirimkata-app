import Simple2Renderer from './index';
import { simple2ThemeConfig } from './config/themeConfig';
import type { TemplateDefinition } from '@/themes/types';
import LayoutSimple2 from './layout';

export const premiumSimple2ThemeDefinition: TemplateDefinition = {
    metadata: {
        key: simple2ThemeConfig.key,
        name: simple2ThemeConfig.name,
        description: simple2ThemeConfig.description,
        preview: simple2ThemeConfig.preview,
        version: '1.0.0',
        tags: ['premium', 'static', 'cover', 'video', 'slideshow', 'elegant'],
    },

    opening: {
        type: 'static-cover',
        enabled: true,
        config: {
            allowSkip: false,
            autoPlayMusic: false,
        },
    },

    contentLayout: {
        type: 'layout-a',
        component: LayoutSimple2,
    },

    theme: {
        colors: simple2ThemeConfig.colors,
        fonts: simple2ThemeConfig.fonts,
        spacing: simple2ThemeConfig.spacing,
    },

    // Main renderer
    render: Simple2Renderer,
};

export { simple2ThemeConfig };
export type PremiumSimple2ThemeDefinition = typeof premiumSimple2ThemeDefinition;
