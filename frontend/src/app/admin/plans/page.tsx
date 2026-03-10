'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { superAdminApi } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, Trash2, Edit2, Archive } from 'lucide-react';

export default function PlansPage() {
    const [plans, setPlans] = useState<any[]>([]);
    const [modules, setModules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<any | null>(null);
    const [planData, setPlanData] = useState({
        code: '',
        name: '',
        price_monthly: 0,
        price_yearly: 0,
        limits: {},
        is_active: true
    });
    const [planModules, setPlanModules] = useState<string[]>([]); // Selected modules for plan

    const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
    const [editingModule, setEditingModule] = useState<any | null>(null);
    const [moduleData, setModuleData] = useState({
        code: '',
        name: '',
        description: '',
        is_active: true
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [plansData, modulesData] = await Promise.all([
                superAdminApi.getPlans(),
                superAdminApi.getModules()
            ]);
            setPlans(plansData);
            setModules(modulesData);
        } catch (error) {
            console.error(error);
            toast.error('Błąd pobierania danych');
        } finally {
            setLoading(false);
        }
    };

    // --- PLANS ---

    const handleCreatePlan = () => {
        setEditingPlan(null);
        setPlanData({
            code: '',
            name: '',
            price_monthly: 0,
            price_yearly: 0,
            limits: {},
            is_active: true
        });
        setPlanModules([]);
        setIsPlanModalOpen(true);
    };

    const handleEditPlan = async (plan: any) => {
        setEditingPlan(plan);
        setPlanData({
            code: plan.code,
            name: plan.name,
            price_monthly: plan.price_monthly,
            price_yearly: plan.price_yearly,
            limits: plan.limits || {},
            is_active: plan.is_active
        });
        // Fetch assigned modules
        try {
            const assignedModules = await superAdminApi.getPlanModules(plan.id);
            setPlanModules(assignedModules);
        } catch (e) {
            setPlanModules([]);
        }
        setIsPlanModalOpen(true);
    };

    const handleSavePlan = async () => {
        try {
            let planId = editingPlan?.id;
            if (editingPlan) {
                await superAdminApi.updatePlan(editingPlan.id, planData);
                toast.success('Plan zaktualizowany (Stripe zsynchronizowany)');
            } else {
                const newPlan = await superAdminApi.createPlan(planData);
                planId = newPlan.id;
                toast.success('Plan utworzony (Produkt w Stripe dodany)');
            }
            // Save modules
            if (planId) {
                await superAdminApi.setPlanModules(planId, planModules);
            }
            setIsPlanModalOpen(false);
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error('Błąd zapisu planu');
        }
    };

    const handleDeletePlan = async (id: string) => {
        if (!confirm('Czy na pewno chcesz usunąć ten plan? Zostanie on zarchiwizowany w Stripe.')) return;
        try {
            await superAdminApi.deletePlan(id);
            toast.success('Plan usunięty');
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error('Błąd usuwania planu');
        }
    };

    // --- MODULES ---

    const handleCreateModule = () => {
        setEditingModule(null);
        setModuleData({ code: '', name: '', description: '', is_active: true });
        setIsModuleModalOpen(true);
    };

    const handleEditModule = (module: any) => {
        setEditingModule(module);
        setModuleData({
            code: module.code,
            name: module.name,
            description: module.description,
            is_active: module.is_active !== false
        });
        setIsModuleModalOpen(true);
    };

    const handleSaveModule = async () => {
        try {
            if (editingModule) {
                await superAdminApi.updateModule(editingModule.code, moduleData);
                toast.success('Moduł zaktualizowany');
            } else {
                await superAdminApi.createModule(moduleData);
                toast.success('Moduł utworzony');
            }
            setIsModuleModalOpen(false);
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error('Błąd zapisu modułu');
        }
    };

    const handleDeleteModule = async (code: string) => {
        if (!confirm('Czy na pewno chcesz usunąć ten moduł? Może to wpłynąć na działanie firm.')) return;
        try {
            await superAdminApi.deleteModule(code);
            toast.success('Moduł usunięty');
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error('Błąd usuwania modułu');
        }
    };


    if (loading) return <div>Ładowanie danych...</div>;

    return (
        <div className="space-y-12">
            {/* PLANS SECTION */}
            <div>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Plany Subskrypcyjne</h2>
                        <p className="text-muted-foreground text-sm">Zarządzaj ofertą. Zmiany są automatycznie synchronizowane ze Stripe.</p>
                    </div>
                    <Button onClick={handleCreatePlan}><Plus className="mr-2 h-4 w-4" /> Dodaj Plan</Button>
                </div>

                <div className="bg-white rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nazwa (Stripe Product)</TableHead>
                                <TableHead>Kod</TableHead>
                                <TableHead className="text-right">Cena PLN/mc</TableHead>
                                <TableHead className="text-right">Cena PLN/rok</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="text-right">Akcje</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {plans.map((plan) => (
                                <TableRow key={plan.id} className={!plan.is_active ? 'opacity-50 bg-gray-50' : ''}>
                                    <TableCell className="font-medium">
                                        {plan.name}
                                        {plan.stripe_product_id && <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Stripe Synced</span>}
                                    </TableCell>
                                    <TableCell>{plan.code}</TableCell>
                                    <TableCell className="text-right">{plan.price_monthly} PLN</TableCell>
                                    <TableCell className="text-right">{plan.price_yearly} PLN</TableCell>
                                    <TableCell className="text-center">
                                        {plan.is_active ? <span className="text-green-600 font-medium">Aktywny</span> : <span className="text-gray-500">Archiwalny</span>}
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleEditPlan(plan)}>
                                            <Edit2 className="h-4 w-4 text-gray-500" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeletePlan(plan.id)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* MODULES SECTION */}
            <div>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Moduły Systemowe</h2>
                        <p className="text-muted-foreground text-sm">Definiuj funkcje dostępne w systemie (Feature Toggles).</p>
                    </div>
                    <Button variant="outline" onClick={handleCreateModule}><Plus className="mr-2 h-4 w-4" /> Dodaj Moduł</Button>
                </div>

                <div className="bg-white rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nazwa</TableHead>
                                <TableHead>Kod (Klucz w kodzie)</TableHead>
                                <TableHead>Opis</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="text-right">Akcje</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {modules.map((module) => (
                                <TableRow key={module.code} className={module.is_active === false ? 'opacity-50 bg-gray-50' : ''}>
                                    <TableCell className="font-medium">{module.name}</TableCell>
                                    <TableCell className="font-mono text-xs">{module.code}</TableCell>
                                    <TableCell className="text-gray-500">{module.description}</TableCell>
                                    <TableCell className="text-center">
                                        {module.is_active !== false ? <span className="text-green-600 text-xs font-semibold">Aktywny</span> : <span className="text-gray-400 text-xs">Wyłączony</span>}
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleEditModule(module)}>
                                            <Edit2 className="h-4 w-4 text-gray-500" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteModule(module.code)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* PLAN MODAL */}
            <Dialog open={isPlanModalOpen} onOpenChange={setIsPlanModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingPlan ? 'Edytuj Plan' : 'Dodaj Nowy Plan'}</DialogTitle>
                        <DialogDescription>
                            Zmiany w nazwie i cenie zostaną automatycznie wysłane do Stripe.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Nazwa</Label>
                            <Input
                                id="name"
                                value={planData.name}
                                onChange={(e) => setPlanData({ ...planData, name: e.target.value })}
                                className="col-span-3"
                                placeholder="np. Plan Pro"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="code" className="text-right">Kod</Label>
                            <Input
                                id="code"
                                value={planData.code}
                                disabled={!!editingPlan}
                                onChange={(e) => setPlanData({ ...planData, code: e.target.value })}
                                className="col-span-3"
                                placeholder="np. pro (unikalny)"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price_monthly" className="text-right">Cena/mc</Label>
                            <Input
                                id="price_monthly"
                                type="number"
                                value={planData.price_monthly}
                                onChange={(e) => setPlanData({ ...planData, price_monthly: Number(e.target.value) })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price_yearly" className="text-right">Cena/rok</Label>
                            <Input
                                id="price_yearly"
                                type="number"
                                value={planData.price_yearly}
                                onChange={(e) => setPlanData({ ...planData, price_yearly: Number(e.target.value) })}
                                className="col-span-3"
                            />
                        </div>

                        {/* MODULE SELECTION */}
                        <div className="border-t pt-4 mt-4">
                            <Label className="text-sm font-medium mb-3 block">Przypisane moduły</Label>
                            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                                {modules.map((mod) => (
                                    <label key={mod.code} className="flex items-center space-x-2 text-sm cursor-pointer p-2 rounded hover:bg-gray-50">
                                        <input
                                            type="checkbox"
                                            checked={planModules.includes(mod.code)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setPlanModules([...planModules, mod.code]);
                                                } else {
                                                    setPlanModules(planModules.filter(c => c !== mod.code));
                                                }
                                            }}
                                            className="rounded border-gray-300"
                                        />
                                        <span>{mod.name}</span>
                                    </label>
                                ))}
                            </div>
                            {modules.length === 0 && <p className="text-sm text-gray-500">Brak zdefiniowanych modułów.</p>}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPlanModalOpen(false)}>Anuluj</Button>
                        <Button onClick={handleSavePlan}>Zapisz</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MODULE MODAL */}
            <Dialog open={isModuleModalOpen} onOpenChange={setIsModuleModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingModule ? 'Edytuj Moduł' : 'Dodaj Nowy Moduł'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="m_name" className="text-right">Nazwa</Label>
                            <Input
                                id="m_name"
                                value={moduleData.name}
                                onChange={(e) => setModuleData({ ...moduleData, name: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="m_code" className="text-right">Kod</Label>
                            <Input
                                id="m_code"
                                value={moduleData.code}
                                disabled={!!editingModule}
                                onChange={(e) => setModuleData({ ...moduleData, code: e.target.value })}
                                className="col-span-3"
                                placeholder="np. time_tracking (używane w @RequiredModules)"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="m_desc" className="text-right">Opis</Label>
                            <Input
                                id="m_desc"
                                value={moduleData.description}
                                onChange={(e) => setModuleData({ ...moduleData, description: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="m_active" className="text-right">Aktywny</Label>
                            <div className="col-span-3 flex items-center space-x-2">
                                <Switch
                                    id="m_active"
                                    checked={moduleData.is_active}
                                    onCheckedChange={(checked) => setModuleData({ ...moduleData, is_active: checked })}
                                />
                                <span className="text-sm text-gray-500">{moduleData.is_active ? 'Tak, dostępny w systemie' : 'Nie, ukryty (soft delete)'}</span>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModuleModalOpen(false)}>Anuluj</Button>
                        <Button onClick={handleSaveModule}>Zapisz</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
