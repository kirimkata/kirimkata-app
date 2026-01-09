const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export const DEFAULT_METADATA = {
  title: 'KirimKata - Digital Wedding Invitation',
  description: 'Undangan pernikahan digital yang elegan dan interaktif',
  siteName: 'KirimKata',
  baseUrl: 'https://kirimkata.com',
};

export function absoluteUrl(path: string): string {
  return `${DEFAULT_METADATA.baseUrl}${path}`;
}
