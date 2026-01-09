export interface GalleryImage {
  src: string;
  alt: string;
}

export interface GalleryConfig {
  mainTitle: string;
  backgroundColor: string;
  topRowImages: GalleryImage[];
  middleImages: GalleryImage[];
  bottomGridImages: GalleryImage[];
  youtubeEmbedUrl?: string;
  showYoutube?: boolean;
}

const defaultGalleryConfig: GalleryConfig = {
  mainTitle: '[GALLERY_TITLE]',
  backgroundColor: '#d7d1c6',
  topRowImages: [],
  middleImages: [],
  bottomGridImages: [],
  youtubeEmbedUrl: undefined,
  showYoutube: false,
};

export function getGalleryConfig(): GalleryConfig {
  return defaultGalleryConfig;
}
