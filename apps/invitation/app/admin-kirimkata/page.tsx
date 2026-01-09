'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to clients page
        router.push('/admin-kirimkata/clients');
    }, [router]);

    return null;
}
