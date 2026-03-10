'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Building2, Layers, Users, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';

export default function AdminSidebar() {
    const pathname = usePathname();
    const { logout } = useAuthStore();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    const isActive = (path: string) => pathname === path;

    const navItems = [
        { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
        { label: 'Firmy', path: '/admin/companies', icon: Building2 },
        { label: 'Plany i Moduły', path: '/admin/plans', icon: Layers },
        // { label: 'Użytkownicy', path: '/admin/users', icon: Users },
    ];

    return (
        <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen">
            <div className="p-6 border-b border-slate-700">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    Admin Panel
                </h1>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        href={item.path}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive(item.path)
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                    </Link>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-700">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Wyloguj</span>
                </button>
            </div>
        </aside>
    );
}
