import PremiumSimpleThemeRenderer from './index';
import { simpleScrollTheme } from './config';
import type { TemplateDefinition } from '@/themes/types';
import LayoutA from './layout';

export const premiumSimple1ThemeDefinition: TemplateDefinition = {
    metadata: {
        key: simpleScrollTheme.key,
        name: simpleScrollTheme.name,
        description: simpleScrollTheme.description,
        preview: simpleScrollTheme.preview,
        version: '1.0.0',
        tags: ['premium', 'simple', 'scrollable', 'no-animation', 'fast'],
    },

    opening: {
        type: 'none',
        enabled: false,
    },

    contentLayout: {
        type: 'layout-a',
        component: LayoutA,
    },

    theme: {
        colors: {
            primary: '#6366f1',
            secondary: '#818cf8',
            accent: '#4f46e5',
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

    // Main renderer
    render: PremiumSimpleThemeRenderer,
};

export { simpleScrollTheme };
export type PremiumSimple1ThemeDefinition = typeof premiumSimple1ThemeDefinition;
