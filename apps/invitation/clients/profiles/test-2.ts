import type { ClientProfile } from '@/clients/types';
import { masterMockTest2 } from '@/clients/mocks/masterMockTest2';

const test2Profile: ClientProfile = {
    slug: masterMockTest2.clientProfile.slug,
    coupleNames: masterMockTest2.clientProfile.coupleNames,
    weddingDateLabel: masterMockTest2.clientProfile.weddingDateLabel,
    locationLabel: masterMockTest2.clientProfile.locationLabel,
    shortDescription: masterMockTest2.clientProfile.shortDescription,
    coverImage: masterMockTest2.clientProfile.coverImage,
    shareImage: masterMockTest2.clientProfile.shareImage,
    metaTitle: masterMockTest2.clientProfile.metaTitle,
    metaDescription: masterMockTest2.clientProfile.metaDescription,
};

export default test2Profile;
