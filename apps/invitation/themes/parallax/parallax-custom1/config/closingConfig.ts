export interface ClosingConfig {
  /** Warna background utama section, mis. beige */
  backgroundColor: string;
  /** Path foto utama (polaroid) dari folder public */
  photoSrc: string;
  photoAlt: string;
  /** Teks miring di bawah foto, biasanya nama pasangan */
  namesScript: string;
  /** Pesan penutup di bawah kartu, per baris */
  messageLines: string[];
}

const defaultClosingConfig: ClosingConfig = {
  backgroundColor: '#d7d1c6',
  photoSrc: '/placeholder-closing.jpg',
  photoAlt: 'Closing portrait',
  namesScript: '[COUPLE_NAMES]',
  messageLines: [
    '[CLOSING_LINE_1]',
    '[CLOSING_LINE_2]',
  ],
};

export function getClosingConfig(): ClosingConfig {
  return defaultClosingConfig;
}
