import { parallaxCustom1ThemeDefinition } from './parallax/parallax-custom1';
import { parallaxTemplate1ThemeDefinition } from './parallax/parallax-template1';
import { premiumSimple1ThemeDefinition } from './premium/simple1/themeDefinition';
import { premiumSimple2ThemeDefinition } from './premium/simple2/themeDefinition';

export const THEME_REGISTRY = {
  'parallax/parallax-custom1': parallaxCustom1ThemeDefinition,
  'parallax/parallax-template1': parallaxTemplate1ThemeDefinition,
  'premium/simple1': premiumSimple1ThemeDefinition,
  'premium/simple2': premiumSimple2ThemeDefinition,
} as const;

export type ThemeRegistry = typeof THEME_REGISTRY;
export type ThemeKey = keyof ThemeRegistry;
export type ThemeDefinition = ThemeRegistry[ThemeKey];

export function getThemeDefinition(key: ThemeKey): ThemeDefinition | undefined {
  return THEME_REGISTRY[key];
}

export function listThemes(): ThemeDefinition[] {
  return Object.values(THEME_REGISTRY);
}
