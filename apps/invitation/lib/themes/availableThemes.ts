import type { ThemeKey } from '@/themes/registry';

export interface AvailableTheme {
    key: ThemeKey;
    name: string;
    description: string;
    preview?: string;
}

export const AVAILABLE_THEMES: AvailableTheme[] = [
    {
        key: 'parallax/parallax-custom1',
        name: 'Parallax Custom 1',
        description: 'Theme parallax dengan animasi custom dan efek visual menarik',
    },
    {
        key: 'parallax/parallax-template1',
        name: 'Parallax Template 1',
        description: 'Theme parallax template standar dengan layout klasik',
    },
    {
        key: 'premium/simple1',
        name: 'Premium Simple 1',
        description: 'Theme premium minimalis dengan desain elegan',
    },
] as const;

export function getThemeByKey(key: string): AvailableTheme | undefined {
    return AVAILABLE_THEMES.find(theme => theme.key === key);
}

export function getDefaultTheme(): AvailableTheme {
    return AVAILABLE_THEMES[0];
}
