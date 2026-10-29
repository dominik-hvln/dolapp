// src/app/(dashboard)/layout.tsx LUB src/app/(app)/layout.tsx
'use client';

import { useEffect, useRef } from 'react'; // Przywróć importy
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store'; // Upewnij się, że ścieżka jest poprawna
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { Toaster } from '@/components/ui/sonner'; // Przenieś Toaster tutaj LUB zostaw w RootLayout

import { useCompanyContextStore } from '@/store/company-context.store';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isHydrating, user } = useAuthStore();
    const router = useRouter();

    const { activeCompany, isHydrating: contextHydrating, exitCompany } = useCompanyContextStore();
    const redirecting = useRef(false);

    // ✅ PRZYWRÓCONA LOGIKA OCHRONY
    useEffect(() => {
        // Czekamy na wczytanie stanu
        if (isHydrating || contextHydrating) return;
        // Jeśli wczytanie zakończone i użytkownik NIE jest zalogowany
        if (!isAuthenticated) {
            router.replace('/'); // Przekieruj na stronę główną (która jest teraz logowaniem)
        } else if (user?.role === 'super_admin' && !activeCompany && !redirecting.current) {
            redirecting.current = true;
            toast.info('Wybierz podmiot, którym chcesz zarządzać.', { id: 'select-company' });
            router.replace('/admin/companies');
        }
    }, [isAuthenticated, isHydrating, contextHydrating, user, activeCompany, router]);

    // Pokaż loader podczas wczytywania lub jeśli przekierowujemy
    if (isHydrating || contextHydrating || !isAuthenticated || (user?.role === 'super_admin' && !activeCompany)) {
        return <div>Ładowanie...</div>; // Lub lepszy loader
    }

    // Jeśli zalogowany, pokaż layout
    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                {user?.role === 'super_admin' && activeCompany && (
                    <div className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-2 border-b bg-amber-100 px-6 py-3" role="status">
                        <span>Zarządzasz podmiotem: <strong>{activeCompany.name}</strong></span>
                        <Button variant="outline" onClick={() => { redirecting.current = true; exitCompany(); router.push('/admin/companies'); }}>
                            Wróć do panelu super admina
                        </Button>
                    </div>
                )}
                <Header />
                <main className="flex-1 p-6 overflow-y-auto flex flex-col">
                    <div className="flex-1">
                        {children}
                    </div>
                </main>
                <Toaster richColors />
            </div>
        </div>
    );
}