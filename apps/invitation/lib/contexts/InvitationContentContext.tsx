'use client';

import { createContext, useContext } from 'react';
import type { FullInvitationContent } from '@/lib/repositories/invitationContentRepository';

const InvitationContentContext = createContext<FullInvitationContent | null>(null);

export interface InvitationContentProviderProps {
  value: FullInvitationContent;
  children: React.ReactNode;
}

export function InvitationContentProvider({ value, children }: InvitationContentProviderProps) {
  return <InvitationContentContext.Provider value={value}>{children}</InvitationContentContext.Provider>;
}

export function useInvitationContent(): FullInvitationContent | null {
  return useContext(InvitationContentContext);
}
