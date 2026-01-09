import type { ThemeKey } from '@/themes/registry';
import type { LoadingDesignType } from '@/themes/types';
import type { CustomImages } from '@/lib/repositories/clientRepository';

export interface ClientProfile {
  slug: string;
  coupleNames: string;
  weddingDateLabel: string;
  locationLabel?: string;
  shortDescription?: string;
  coverImage?: string;
  shareImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  loadingDesign?: LoadingDesignType; // Loading overlay design type
  custom_images?: CustomImages; // Custom theme images for template1
}

export type ClientDataId = string;

export interface ClientThemeBinding {
  key: ThemeKey;
  dataId: ClientDataId;
}

export interface ClientDefinition {
  profile: ClientProfile;
  theme: ClientThemeBinding;
}

export type ClientSlug = string;

export type ClientRegistry = Record<ClientSlug, ClientDefinition>;
