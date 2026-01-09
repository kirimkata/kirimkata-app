import { getThemeDefinition, type ThemeDefinition, type ThemeKey } from '@/themes/registry';

export function resolveTheme(key: ThemeKey): ThemeDefinition {
  const theme = getThemeDefinition(key);

  if (!theme) {
    throw new Error(`Theme with key "${key}" is not registered.`);
  }

  return theme;
}
