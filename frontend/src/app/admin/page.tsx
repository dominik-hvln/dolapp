'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Panel super admina to lista podmiotów (brief klienta: bez planów, subskrypcji i przychodów).
export default function AdminDashboardPage() {
    const router = useRouter();
    useEffect(() => { router.replace('/admin/companies'); }, [router]);
    return null;
}
