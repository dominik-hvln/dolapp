'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

// Raporty są wyłączone dla klientów - wejście po adresie przekierowuje na panel główny
export default function ReportsLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuthStore();
    const router = useRouter();
    const allowed = user?.role === 'super_admin';

    useEffect(() => {
        if (!allowed) router.replace('/dashboard');
    }, [allowed, router]);

    if (!allowed) return null;

    return <>{children}</>;
}
