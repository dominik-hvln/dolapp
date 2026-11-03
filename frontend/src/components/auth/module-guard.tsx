'use client';

import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ModuleGuardProps {
    children: React.ReactNode;
    moduleCode: string; // The code of the module required
}

export function ModuleGuard({ children, moduleCode }: ModuleGuardProps) {
    const { user, isHydrating } = useAuthStore();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        if (isHydrating) return;

        if (!user) {
            // Not logged in, redirect to login (or let middleware handle it)
            // But for module check, wait until user is loaded.
            return;
        }

        if (user.role === 'super_admin') {
            setIsAuthorized(true);
            return;
        }

        if (user.modules && user.modules.includes(moduleCode)) {
            setIsAuthorized(true);
        } else {
            setIsAuthorized(false);
        }
    }, [user, isHydrating, moduleCode]);

    if (isHydrating || isAuthorized === null) {
        return <div className="p-8 flex items-center justify-center">Sprawdzanie uprawnień...</div>;
    }

    if (!isAuthorized) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4 text-center">
                <ShieldAlert className="w-16 h-16 text-red-500" />
                <h1 className="text-2xl font-bold text-gray-900">Moduł niedostępny</h1>
                <p className="text-gray-500 max-w-md">
                    Ta funkcja nie jest włączona dla Twojej firmy. Wyloguj się i zaloguj ponownie, a jeśli to nie pomoże, skontaktuj się z administratorem.
                </p>
                <div className="flex gap-4">
                    <Button variant="outline" onClick={() => router.push('/dashboard')}>
                        Wróć do Panelu
                    </Button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
