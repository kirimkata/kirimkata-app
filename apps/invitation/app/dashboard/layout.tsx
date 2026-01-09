'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('client_token');
    if (!token) {
      router.push('/dashboard/login');
    }
  }, [router]);

  return <>{children}</>;
}
