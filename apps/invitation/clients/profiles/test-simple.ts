import type { ClientProfile } from '@/clients/types';
import { masterMockTestSimple } from '@/clients/mocks/masterMockTestSimple';

const testSimpleProfile: ClientProfile = {
    slug: masterMockTestSimple.profile.slug,
    coupleNames: masterMockTestSimple.profile.coupleNames,
    weddingDateLabel: masterMockTestSimple.profile.weddingDateLabel,
    locationLabel: masterMockTestSimple.profile.locationLabel,
    shortDescription: masterMockTestSimple.profile.shortDescription,
    coverImage: masterMockTestSimple.profile.coverImage,
    shareImage: masterMockTestSimple.profile.shareImage,
    metaTitle: masterMockTestSimple.profile.metaTitle,
    metaDescription: masterMockTestSimple.profile.metaDescription,
};

export default testSimpleProfile;
