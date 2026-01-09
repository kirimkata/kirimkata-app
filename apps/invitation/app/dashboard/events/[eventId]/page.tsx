'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function EventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;

  useEffect(() => {
    // Redirect to overview page
    router.push(`/dashboard/events/${eventId}/overview`);
  }, [eventId, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}
