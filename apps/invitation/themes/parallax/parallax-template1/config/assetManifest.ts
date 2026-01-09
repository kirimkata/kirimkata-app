import { getAllImagePaths } from './imageConfig';
import { getGalleryConfig } from './galleryConfig';
import { getLoveStoryConfig } from './loveStoryConfig';
import { getWeddingGiftConfig } from './weddingGiftConfig';

export type AssetType = 'image' | 'audio' | 'data';

export interface AssetResource {
  src: string;
  type?: AssetType;
  registerAsBackgroundAudio?: boolean;
  loop?: boolean;
}

const collectConfigImageSources = (): string[] => {
  const sources: string[] = [];

  const gallery = getGalleryConfig();
  const loveStory = getLoveStoryConfig();
  const weddingGift = getWeddingGiftConfig();

  const pushImages = (items?: { src: string }[]) => {
    items?.forEach((item) => {
      if (item?.src) {
        sources.push(item.src);
      }
    });
  };

  pushImages(gallery.topRowImages);
  pushImages(gallery.middleImages);
  pushImages(gallery.bottomGridImages);

  if (loveStory.backgroundImage) {
    sources.push(loveStory.backgroundImage);
  }

  if (weddingGift.giftImageSrc) {
    sources.push(weddingGift.giftImageSrc);
  }

  weddingGift.cards.forEach((card) => {
    if (card.type === 'bank') {
      if (card.logoSrc) sources.push(card.logoSrc);
      if (card.cardBgSrc) sources.push(card.cardBgSrc);
      if (card.chipSrc) sources.push(card.chipSrc);
    }
  });

  return sources;
};

const buildManifest = (): AssetResource[] => {
  const uniqueAssets = new Map<string, AssetResource>();

  const add = (asset: AssetResource) => {
    if (!asset.src) return;
    if (uniqueAssets.has(asset.src)) return;
    uniqueAssets.set(asset.src, { type: 'image', ...asset });
  };

  // PRIORITY 1: Load gate images first (critical for opening animation)
  [
    { src: 'https://media.kirimkata.com/gate_left.png' },
    { src: 'https://media.kirimkata.com/gate_right.png' },
  ].forEach((asset) => add(asset));

  // PRIORITY 2: Load other critical assets for opening
  [
    { src: 'https://media.kirimkata.com/limasan.jpg' },
    { src: '/music-disc.svg' },
  ].forEach((asset) => add(asset));

  // PRIORITY 3: Load animation images
  getAllImagePaths().forEach((src) => add({ src }));

  // PRIORITY 4: Load content images (gallery, love story, etc.)
  collectConfigImageSources().forEach((src) => add({ src }));

  // PRIORITY 5: Load data and audio
  add({ src: '/swipeup.json', type: 'data' });

  add({
    src: 'https://media.kirimkata.com/ladygaga-closetoyou.mp3',
    type: 'audio',
    registerAsBackgroundAudio: true,
    loop: true,
  });

  return Array.from(uniqueAssets.values());
};

export const ASSET_MANIFEST = buildManifest();

export function getAssetManifest(): AssetResource[] {
  return ASSET_MANIFEST;
}
