import type { ClientProfile } from '@/clients/types';
import { masterMockTest2 } from '@/clients/mocks/masterMockTest2';

const test2Profile: ClientProfile = {
    slug: masterMockTest2.profile.slug,
    coupleNames: masterMockTest2.profile.coupleNames,
    weddingDateLabel: masterMockTest2.profile.weddingDateLabel,
    locationLabel: masterMockTest2.profile.locationLabel,
    shortDescription: masterMockTest2.profile.shortDescription,
    coverImage: masterMockTest2.profile.coverImage,
    shareImage: masterMockTest2.profile.shareImage,
    metaTitle: masterMockTest2.profile.metaTitle,
    metaDescription: masterMockTest2.profile.metaDescription,
};

export default test2Profile;
