export interface LoveStoryBlock {
  title: string;
  body: string;
}

export interface LoveStoryConfig {
  /** Judul utama dengan font script, mis. "Our Love Story" */
  mainTitle: string;
  /** Path gambar background dari folder public, mis. "/love-story-bg.webp" */
  backgroundImage: string;
  /** Opacity overlay hitam di atas foto (0..1) */
  overlayOpacity: number;
  /** Daftar blok cerita (judul + isi) */
  blocks: LoveStoryBlock[];
}

const defaultLoveStoryConfig: LoveStoryConfig = {
  mainTitle: '[LOVE_STORY_TITLE]',
  backgroundImage: '',
  overlayOpacity: 0.6,
  blocks: [
    {
      title: '[LOVE_STORY_BLOCK_TITLE]',
      body: '[LOVE_STORY_BLOCK_BODY]',
    },
  ],
};

export function getLoveStoryConfig(): LoveStoryConfig {
  return defaultLoveStoryConfig;
}
