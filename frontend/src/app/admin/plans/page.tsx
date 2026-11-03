'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Plany i moduły są ukryte (brief klienta) - każdy podmiot ma pełny dostęp.
export default function PlansPage() {
    const router = useRouter();
    useEffect(() => { router.replace('/admin/companies'); }, [router]);
    return null;
}
