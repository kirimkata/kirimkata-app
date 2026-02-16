import type { ClientProfile } from '@/clients/types';
import { masterMockTestSimple } from '@/clients/mocks/masterMockTestSimple';

const testSimpleProfile: ClientProfile = {
    slug: masterMockTestSimple.clientProfile.slug,
    coupleNames: masterMockTestSimple.clientProfile.coupleNames,
    weddingDateLabel: masterMockTestSimple.clientProfile.weddingDateLabel,
    locationLabel: masterMockTestSimple.clientProfile.locationLabel,
    shortDescription: masterMockTestSimple.clientProfile.shortDescription,
    coverImage: masterMockTestSimple.clientProfile.coverImage,
    shareImage: masterMockTestSimple.clientProfile.shareImage,
    metaTitle: masterMockTestSimple.clientProfile.metaTitle,
    metaDescription: masterMockTestSimple.clientProfile.metaDescription,
};

export default testSimpleProfile;
