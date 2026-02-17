'use client';

import { useTheme } from '@/lib/contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function GlobalDashboard() {
  const { colors } = useTheme();
  const router = useRouter();

  // For now, redirect to invitations as it is the main view requested
  useEffect(() => {
    router.push('/client-dashboard/invitations');
  }, [router]);

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.text, marginBottom: '16px' }}>
        Redirecting...
      </h1>
    </div>
  );
}
