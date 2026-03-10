'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { ActivityFeed } from './ActivityFeed';
import { useAuthStore } from '@/store/auth.store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

// Definicja typu dla danych użytkownika pobieranych ze store
interface AuthUser {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: 'admin' | 'manager' | 'employee' | 'super_admin';
}

// Typ dla danych podsumowania z API
interface DashboardSummary {
    projects: number;
    tasks: number;
    employees: number;
    recentTasks: {
        id: string;
        name: string;
        created_at: string;
        project: { name: string };
    }[];
}

// Karta Podsumowania (zgodna z designem)
function SummaryCard({ title, value, bgColorClass }: { title: string, value: number | string, bgColorClass: string }) {

    const updateTime = format(new Date(), 'dd MMM, HH:mm', { locale: pl });

    return (
        <div className={`glassmorphism-box p-5 ${bgColorClass} bg-opacity-70 flex flex-col justify-between min-h-[140px]`}>

            <p className="text-sm font-medium text-gray-700">{title}</p>

            <div className="flex justify-between items-end">
                <div>
                    <p className="text-xs text-gray-600">Zaktualizowano</p>
                    <p className="text-xs font-medium text-gray-700">{updateTime}</p>
                </div>

                {/* ✅ POPRAWKA: Tło kółka to teraz bg-black/20 (czarny 20% opacity) */}
                <div className="h-11 w-11 rounded-full bg-black/10 text-black flex items-center justify-center font-bold text-lg">
                    {value}
                </div>
            </div>
        </div>
    );
}

// Karta Danych Użytkownika (bez zmian)
function UserInfoCard({ user }: { user: AuthUser }) {
    const getInitials = (firstName?: string, lastName?: string) => {
        if (!firstName || !lastName) return 'U';
        return `${firstName[0]}${lastName[0]}`.toUpperCase();
    };

    return (
        <div className="glassmorphism-box p-6">
            <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                    <AvatarImage src="" alt="Avatar" />
                    <AvatarFallback className="text-2xl">
                        {getInitials(user?.first_name, user?.last_name)}
                    </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                    <h3 className="text-xl font-bold">{user?.first_name} {user?.last_name}</h3>
                    <p className="text-sm text-muted-foreground">{user?.role === 'admin' ? 'Administrator' : 'Manager'}</p>
                </div>
            </div>
            <div className="mt-4 space-y-2 border-t pt-4">
                <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{user?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">(Brak numeru telefonu)</span>
                </div>
            </div>
        </div>
    );
}

// Główny komponent Dashboardu (bez zmian)
export function AdminDashboard() {
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const { user } = useAuthStore();

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const response = await api.get('/dashboard/summary');
                setSummary(response.data);
            } catch (error) {
                toast.error('Błąd', { description: 'Nie udało się pobrać podsumowania.' });
            } finally {
                setIsLoading(false);
            }
        };
        fetchSummary();
    }, []);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

            {/* Kolumna lewa (szersza) */}
            <div className="lg:col-span-2 space-y-6">

                {user && <UserInfoCard user={user} />}

                <div className="glassmorphism-box p-6">
                    <h2 className="text-xl font-semibold mb-4">Podsumowanie</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {isLoading ? <p className="text-muted-foreground">Ładowanie...</p> : (
                            <>
                                <SummaryCard title="Projekty" value={summary?.projects ?? 0} bgColorClass="bg-lime-100" />
                                <SummaryCard title="Zlecenia" value={summary?.tasks ?? 0} bgColorClass="bg-violet-100" />
                                <SummaryCard title="Pracownicy" value={summary?.employees ?? 0} bgColorClass="bg-rose-100" />
                            </>
                        )}
                    </div>
                </div>

                <div className="glassmorphism-box p-6">
                    <h2 className="text-xl font-semibold mb-4">Ostatnio utworzone zlecenia</h2>
                    <div className="space-y-4">
                        {isLoading ? <p className="text-muted-foreground">Ładowanie...</p> : (
                            summary?.recentTasks && summary.recentTasks.length > 0 ? (
                                summary.recentTasks.map(task => (
                                    <div key={task.id} className="flex justify-between items-center">
                                        <div>
                                            <p className="font-medium">{task.name}</p>
                                            <p className="text-sm text-muted-foreground">{task.project.name}</p>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {format(new Date(task.created_at), 'dd.MM.yyyy', { locale: pl })}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">Brak nowych zleceń.</p>
                            )
                        )}
                    </div>
                </div>

            </div>

            {/* Kolumna prawa (węższa) - Aktywności */}
            <div className="lg:col-span-1 space-y-6">
                <h2 className="text-xl font-semibold">Aktywność na Żywo</h2>
                <ActivityFeed />
            </div>
        </div>
    );
}