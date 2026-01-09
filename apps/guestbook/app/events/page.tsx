'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, Users, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui';

interface Event {
  id: string;
  event_name: string;
  event_date: string | null;
  venue_name: string | null;
  venue_address: string | null;
}

interface EventStats {
  total_guests: number;
  checked_in: number;
  check_in_rate: number;
}

export default function EventsPage() {
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('staff_token');
    const staffData = localStorage.getItem('staff_data');

    if (!token || !staffData) {
      router.push('/login');
      return;
    }

    const staff = JSON.parse(staffData);
    
    // Auto-redirect to check-in if staff has event_id
    if (staff.event_id) {
      router.push(`/events/${staff.event_id}/checkin`);
    } else {
      setError('Staff tidak memiliki event yang ditugaskan');
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Kembali ke Login
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
