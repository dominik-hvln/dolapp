'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { cn } from '@/lib/utils'; // Importujemy cn

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isHydrating } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (isHydrating) return;
        if (!isAuthenticated) {
            router.replace('/');
        }
    }, [isAuthenticated, isHydrating, router]);

    if (isHydrating || !isAuthenticated) {
        return (
            <div className="flex h-screen items-center justify-center">
                Ładowanie...
            </div>
        );
    }

    return (
        <div className="flex h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Header />
                <main
                    className={cn(
                        "flex-1 p-6 lg:p-8 overflow-y-auto",
                        "pt-12 md:pt-6" // 48px paddingu na mobile, 24px na desktopie
                    )}
                    style={{
                        paddingTop: 'calc(env(safe-area-inset-top, 0rem) + 1.5rem)',
                    }}
                >
                    {children}
                </main>
            </div>
        </div>
    );
}