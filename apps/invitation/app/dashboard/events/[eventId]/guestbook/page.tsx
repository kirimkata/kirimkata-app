'use client';

import { useParams } from 'next/navigation';

export default function GuestbookDashboardPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Guestbook Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage your guestbook operations</p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start">
          <svg className="w-6 h-6 text-yellow-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">Page Under Construction</h3>
            <p className="text-yellow-800 mb-4">
              This page is currently being developed as part of FASE 2 implementation.
              For now, please use the Overview page or navigate to specific sections from the sidebar.
            </p>
            <p className="text-sm text-yellow-700">
              <strong>Coming soon:</strong> Real-time dashboard with guest statistics, recent check-ins, and quick actions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
