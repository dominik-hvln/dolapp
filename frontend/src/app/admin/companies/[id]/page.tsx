'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { superAdminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Check, X, Shield, Calendar, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

export default function CompanyDetailsPage() {
    const params = useParams();
    const id = params.id as string;

    const [company, setCompany] = useState<any>(null);
    const [plans, setPlans] = useState<any[]>([]);
    const [allModules, setAllModules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const [compData, plansData, modsData] = await Promise.all([
                superAdminApi.getCompany(id),
                superAdminApi.getPlans(),
                superAdminApi.getModules()
            ]);
            setCompany(compData);
            setPlans(plansData);
            setAllModules(modsData);
        } catch (error) {
            console.error(error);
            toast.error('Błąd pobierania danych firmy');
        } finally {
            setLoading(false);
        }
    };

    const handleAssignPlan = async (planId: string) => {
        try {
            await superAdminApi.assignPlan(id, planId);
            toast.success('Plan zmieniony pomyślnie');
            fetchData(); // Refresh to show new limits/modules
        } catch (error) {
            toast.error('Błąd zmiany planu');
        }
    };

    const handleToggleModule = async (moduleCode: string, currentState: boolean) => {
        try {
            await superAdminApi.toggleModule(id, moduleCode, !currentState);
            toast.success(`Moduł ${!currentState ? 'włączony' : 'wyłączony'}`);
            fetchData();
        } catch (error) {
            toast.error('Błąd zmiany modułu');
        }
    };

    if (loading) return <div>Ładowanie danych firmy...</div>;
    if (!company) return <div>Nie znaleziono firmy.</div>;

    const currentSubscription = company.subscriptions?.[0]; // Assuming one active sub for now
    const activeModuleCodes = company.modules || [];

    return (
        <div className="space-y-8 max-w-5xl">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
                    <p className="text-sm text-gray-500 font-mono mt-1">ID: {company.id}</p>
                    <p className="text-sm text-gray-500 mt-1">
                        Utworzono: {company.created_at && format(new Date(company.created_at), 'd MMMM yyyy, HH:mm', { locale: pl })}
                    </p>
                </div>
                <div className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold border border-indigo-100">
                    Status: {currentSubscription?.status || 'Brak subskrypcji'}
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* SUBSKRYPCJA I PLAN */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-6">
                        <Shield className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-lg font-semibold">Zarządzanie Planem</h2>
                    </div>

                    <div className="space-y-6">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="text-sm text-gray-500 mb-1">Obecny Plan</div>
                            <div className="text-xl font-bold text-gray-900">
                                {plans.find(p => p.id === currentSubscription?.plan_id)?.name || 'Brak przypisanego planu'}
                            </div>
                            {currentSubscription?.trial_end && (
                                <div className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Okres próbny do: {format(new Date(currentSubscription.trial_end), 'd MMM yyyy')}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Zmień Pakiet</label>
                            <div className="grid grid-cols-1 gap-2">
                                {plans.map((plan) => (
                                    <button
                                        key={plan.id}
                                        onClick={() => handleAssignPlan(plan.id)}
                                        disabled={currentSubscription?.plan_id === plan.id}
                                        className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${currentSubscription?.plan_id === plan.id
                                                ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200'
                                                : 'hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div>
                                            <div className="font-semibold text-gray-900">{plan.name}</div>
                                            <div className="text-xs text-gray-500">{plan.price_monthly} zł/mc</div>
                                        </div>
                                        {currentSubscription?.plan_id === plan.id && <Check className="w-5 h-5 text-indigo-600" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* MODUŁY */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-6">
                        <Settings className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-lg font-semibold">Konfiguracja Modułów</h2>
                    </div>

                    <div className="space-y-4">
                        <p className="text-sm text-gray-500">
                            Możesz ręcznie włączyć/wyłączyć moduły dla tej firmy, niezależnie od wybranego planu (tzw. override).
                        </p>

                        <div className="divide-y">
                            {allModules.map((mod) => {
                                const isEnabled = activeModuleCodes.includes(mod.code);
                                return (
                                    <div key={mod.code} className="py-4 flex items-center justify-between">
                                        <div>
                                            <div className="font-medium text-gray-900">{mod.name}</div>
                                            <div className="text-xs text-gray-500">{mod.description}</div>
                                        </div>
                                        <button
                                            onClick={() => handleToggleModule(mod.code, isEnabled)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${isEnabled ? 'bg-indigo-600' : 'bg-gray-200'
                                                }`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${isEnabled ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
