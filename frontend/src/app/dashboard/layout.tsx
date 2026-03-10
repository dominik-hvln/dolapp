// src/app/(dashboard)/layout.tsx LUB src/app/(app)/layout.tsx
'use client';

import { useEffect } from 'react'; // Przywróć importy
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store'; // Upewnij się, że ścieżka jest poprawna
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { Toaster } from '@/components/ui/sonner'; // Przenieś Toaster tutaj LUB zostaw w RootLayout

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isHydrating } = useAuthStore();
    const router = useRouter();

    // ✅ PRZYWRÓCONA LOGIKA OCHRONY
    useEffect(() => {
        // Czekamy na wczytanie stanu
        if (isHydrating) return;
        // Jeśli wczytanie zakończone i użytkownik NIE jest zalogowany
        if (!isAuthenticated) {
            router.replace('/'); // Przekieruj na stronę główną (która jest teraz logowaniem)
        }
    }, [isAuthenticated, isHydrating, router]);

    // Pokaż loader podczas wczytywania lub jeśli przekierowujemy
    if (isHydrating || !isAuthenticated) {
        return <div>Ładowanie...</div>; // Lub lepszy loader
    }

    // Jeśli zalogowany, pokaż layout
    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
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