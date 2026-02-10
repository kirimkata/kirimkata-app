import { masterMockPoppyFadli } from '@/clients/mocks/masterMockPoppyFadli';

export const masterMockBudiAni = {
  ...masterMockPoppyFadli,
  clientProfile: {
    ...masterMockPoppyFadli.profile,
    slug: 'budi-ani',
    coupleNames: 'Budi & Ani',
    metaTitle: 'Wedding Budi & Ani',
    metaDescription:
      'Undangan digital pernikahan Budi & Ani. Konten awal diambil dari masterMockPoppyFadli.',
  },
} as const;

export type MasterMockBudiAni = typeof masterMockBudiAni;
