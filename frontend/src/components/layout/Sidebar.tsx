import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home,
    FolderKanban,
    Users,
    Clock,
    MapPin,
    Activity,
    FileText,
    ShieldCheck,
    CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';

interface NavLink {
    href: string;
    label: string;
    icon: React.ElementType;
    roles?: string[];
    moduleCode?: string;
}

export const navLinks: NavLink[] = [
    { href: '/dashboard', label: 'Panel Główny', icon: Home },
    { href: '/dashboard/activity', label: 'Aktywność', icon: Activity, roles: ['admin', 'manager'] },
    { href: '/dashboard/entries', label: 'Ewidencja Czasu', icon: Clock, roles: ['admin', 'manager'] },
    { href: '/dashboard/projects', label: 'Projekty', icon: FolderKanban, moduleCode: 'projects', roles: ['admin', 'manager'] },
    { href: '/dashboard/reports', label: 'Raporty', icon: FileText, moduleCode: 'reports', roles: ['admin', 'manager'] },
    { href: '/dashboard/users', label: 'Użytkownicy', icon: Users, roles: ['admin', 'manager'] },
    { href: '/dashboard/locations', label: 'Kody Ogólne', icon: MapPin, moduleCode: 'geolocation', roles: ['admin', 'manager'] },
    {
        href: '/dashboard/super-admin',
        label: 'Super Admin',
        icon: ShieldCheck,
        roles: ['super_admin']
    },

];

interface SidebarProps {
    isMobile?: boolean;
}

export default function Sidebar({ isMobile = false }: SidebarProps) {
    const pathname = usePathname();
    const { user } = useAuthStore();

    // ✅ Filtrujemy linki
    const visibleLinks = navLinks.filter(link => {
        if (!user) return false;

        // 1. Sprawdź rolę
        if (link.roles && !link.roles.includes(user.role)) return false;

        // 2. Sprawdź moduł (Dla super_admin pomijamy sprawdzanie modułów, ma wszystko)
        if (user.role !== 'super_admin' && link.moduleCode) {
            // Jeśli user nie ma listy modułów (np. stary stan), ukryj lub pokaż (bezpieczniej: ukryj)
            if (!user.modules) return false;
            // Sprawdź czy moduł jest na liście aktywnych u użytkownika
            return user.modules.includes(link.moduleCode);
        }

        return true;
    });

    const renderNavLinks = () => (
        <nav className="flex-1 space-y-2 px-4">
            {visibleLinks.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);

                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            "flex items-center gap-3 rounded-[25px] px-3 py-2 transition-all",
                            isActive
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted"
                        )}
                    >
                        <div className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center",
                            isActive ? "bg-primary-foreground/20" : "bg-muted"
                        )}>
                            <link.icon className={cn(
                                "h-4 w-4",
                                isActive ? "text-primary-foreground" : "text-primary"
                            )} />
                        </div>
                        <span className="font-medium">{link.label}</span>
                    </Link>
                );
            })}
        </nav>
    );

    if (isMobile) {
        return (
            <div className="flex h-full flex-col py-6">
                {renderNavLinks()}
            </div>
        );
    }

    return (
        <aside className={cn("hidden md:flex h-full w-72 flex-col")}>
            <div className="flex h-[72px] items-center px-8">
                <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                    <span className="text-xl">TwojaAplikacja</span>
                </Link>
            </div>
            <div className="flex-1 overflow-y-auto">
                {renderNavLinks()}
            </div>
        </aside>
    );
}