'use client';

import { useEffect, useState } from 'react';
import { superAdminApi } from '@/lib/api';
import { toast } from 'sonner';

export default function AdminDashboardPage() {
    const [stats, setStats] = useState({
        totalCompanies: 0,
        newCompanies: 0,
        activeSubscriptions: 0,
        mrr: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const data = await superAdminApi.getStats();
            setStats(data);
        } catch (error) {
            console.error(error);
            toast.error('Błąd pobierania statystyk');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Ładowanie danych...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-sm font-medium text-gray-500">Wszystkie Firmy</div>
                    <div className="mt-2 text-3xl font-bold text-gray-900">{stats.totalCompanies}</div>
                    <div className="text-xs text-green-600 mt-1">+{stats.newCompanies} w tym miesiącu</div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-sm font-medium text-gray-500">Aktywne Subskrypcje</div>
                    <div className="mt-2 text-3xl font-bold text-gray-900">{stats.activeSubscriptions}</div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-sm font-medium text-gray-500">Przychód MRR</div>
                    <div className="mt-2 text-3xl font-bold text-gray-900">{stats.mrr} PLN</div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-64 flex items-center justify-center text-gray-400">
                    Wykres Przyrostu Firm (Wkrótce)
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-64 flex items-center justify-center text-gray-400">
                    Ostatnie Logowania (Wkrótce)
                </div>
            </div>
        </div>
    );
}
