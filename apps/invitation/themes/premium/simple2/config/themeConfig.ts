/**
 * Simple2 Theme - Theme Configuration
 * 
 * Colors, fonts, and spacing for the Simple2 theme
 */

export const simple2ThemeConfig = {
    key: 'simple2',
    name: 'Simple 2 - Premium Static',
    description: 'Elegant static cover with dynamic backgrounds and Cormorant typography',
    preview: '/previews/simple2.jpg',
    category: 'premium',
    features: [
        'Static cover with video/photo backgrounds',
        'Auto-rotating photo slideshow',
        'Cormorant elegant typography',
        'Fast loading',
        'Mobile optimized',
    ],

    colors: {
        primary: '#2c2c2c',
        secondary: '#6b6b6b',
        accent: '#8b7355',
        background: '#ffffff',
        text: '#1f2937',
        textLight: '#6b7280',
        overlay: 'rgba(0, 0, 0, 0.5)',
    },

    fonts: {
        heading: 'Cormorant Garamond',
        body: 'Inter',
        signature: 'Cormorant Garamond',
    },

    spacing: {
        section: '4rem',
        container: '1.5rem',
    },
};

export type Simple2ThemeConfig = typeof simple2ThemeConfig;
