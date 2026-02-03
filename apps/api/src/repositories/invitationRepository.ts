// This file is deprecated - no longer using mock invitation data
// The invitation content is now compiled from normalized tables via invitationCompilerService
// This file can be safely deleted

export interface InvitationContentRecord {
  clientNames: string;
  eventDateLabel: string;
  locationLabel?: string;
  heroImage?: string;
  galleryImages?: string[];
  additionalNotes?: string;
}

export async function fetchInvitationContent(dataId: string): Promise<InvitationContentRecord> {
  throw new Error('This function is deprecated. Use invitationContentRepository.fetchFullInvitationContent instead.');
}
