import type { ClientDataId } from '@/clients/types';
import { masterMockPoppyFadli } from '@/clients/masterMockPoppyFadli';

export interface InvitationContentRecord {
  clientNames: string;
  eventDateLabel: string;
  locationLabel?: string;
  heroImage?: string;
  galleryImages?: string[];
  additionalNotes?: string;
}

const MOCK_INVITATION_DATA: Record<ClientDataId, InvitationContentRecord> = {
  'poppy-fadli': {
    ...masterMockPoppyFadli.invitationSummary,
    galleryImages: masterMockPoppyFadli.invitationSummary.galleryImages
      ? [...masterMockPoppyFadli.invitationSummary.galleryImages]
      : undefined,
  },
};

export async function fetchInvitationContent(dataId: ClientDataId): Promise<InvitationContentRecord> {
  const record = MOCK_INVITATION_DATA[dataId];

  if (!record) {
    throw new Error(`No invitation content found for dataId: ${dataId}`);
  }

  return record;
}
