export interface BackgroundOverlayConfig {
  /** Aktif/nonaktif overlay */
  enabled: boolean;
  /** Warna dasar overlay, bisa rgba/hex */
  color: string;
  /** Opacity overlay 0..1 */
  opacity: number;
  /** Besar blur dalam pixel (backdrop-filter) */
  blurPx: number;
}

export const BACKGROUND_OVERLAY_CONFIG: BackgroundOverlayConfig = {
  enabled: true,
  // Hitam transparan
  color: 'rgba(0, 0, 0, 1)',
  // Seberapa gelap overlay (0..1)
  opacity: 0.45,
  // Blur latar belakang di balik overlay
  blurPx: 6,
};
