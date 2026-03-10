'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { Toaster } from '@/components/ui/sonner';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isHydrating, user } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (isHydrating) return;

        if (!isAuthenticated) {
            router.replace('/');
            return;
        }

        // Proste sprawdzenie roli
        if (user?.role !== 'super_admin') {
            router.replace('/dashboard'); // Zwykły user ucieka do dashboardu
        }
    }, [isAuthenticated, isHydrating, user, router]);

    if (isHydrating || !isAuthenticated) {
        return <div className="flex h-screen items-center justify-center">Ładowanie Panelu...</div>;
    }

    if (user?.role !== 'super_admin') {
        return null; // Zapobieganie mignięciu
    }

    return (
        <div className="flex h-screen bg-slate-50">
            <AdminSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
                    <h2 className="text-gray-500 font-medium">Strefa Super Administratora</h2>
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                            SA
                        </div>
                        <span className="text-sm font-semibold">{user?.email}</span>
                    </div>
                </header>
                <main className="flex-1 p-8 overflow-y-auto">
                    {children}
                </main>
                <Toaster richColors />
            </div>
        </div>
    );
}
