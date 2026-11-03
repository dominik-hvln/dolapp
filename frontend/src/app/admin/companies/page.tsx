'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { superAdminApi, getApiErrorMessage, SuperAdminCompany } from '@/lib/api';
import { useCompanyContextStore } from '@/store/company-context.store';
import { CreateCompanyDialog } from '@/components/super-admin/CreateCompanyDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

export default function CompaniesPage() {
    const [companies, setCompanies] = useState<SuperAdminCompany[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [renaming, setRenaming] = useState<SuperAdminCompany | null>(null);
    const [name, setName] = useState('');
    const [saving, setSaving] = useState(false);
    const { enterCompany } = useCompanyContextStore();
    const router = useRouter();

    const fetchCompanies = async () => {
        setLoading(true);
        try {
            setCompanies(await superAdminApi.getCompanies());
        } catch (error) {
            toast.error(getApiErrorMessage(error, 'Nie udało się pobrać podmiotów.'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCompanies(); }, []);

    const rename = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!renaming || !name.trim()) return;
        setSaving(true);
        try {
            const updated = await superAdminApi.updateCompany(renaming.id, { name: name.trim() });
            const context = useCompanyContextStore.getState();
            if (context.activeCompany?.id === updated.id) context.enterCompany({ id: updated.id, name: updated.name });
            toast.success('Nazwa podmiotu została zmieniona');
            setRenaming(null);
            await fetchCompanies();
        } catch (error) {
            toast.error(getApiErrorMessage(error, 'Nie udało się zmienić nazwy podmiotu.'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Podmioty</h1>
                <Button onClick={() => setIsCreateOpen(true)}>Dodaj podmiot</Button>
            </div>
            <CreateCompanyDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} onSuccess={fetchCompanies} />
            <div className="bg-white rounded-lg border overflow-hidden">
                <Table>
                    <TableHeader><TableRow><TableHead>Nazwa podmiotu</TableHead><TableHead>Pracownicy</TableHead><TableHead>Projekty</TableHead><TableHead>Data utworzenia</TableHead><TableHead className="text-right">Akcje</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {loading ? <TableRow><TableCell colSpan={5}>Ładowanie...</TableCell></TableRow> : companies.map((company) => (
                            <TableRow key={company.id}>
                                <TableCell className="font-medium">{company.name}</TableCell>
                                <TableCell>{company.users_count}</TableCell><TableCell>{company.projects_count}</TableCell>
                                <TableCell>{company.created_at ? format(new Date(company.created_at), 'd MMM yyyy', { locale: pl }) : '-'}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button size="sm" onClick={() => { enterCompany({ id: company.id, name: company.name }); router.push('/dashboard'); }}>Zarządzaj</Button>
                                    <Button size="sm" variant="outline" onClick={() => { setRenaming(company); setName(company.name); }}>Zmień nazwę</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!loading && companies.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8">Brak podmiotów w systemie.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </div>
            <Dialog open={!!renaming} onOpenChange={(open) => { if (!open && !saving) setRenaming(null); }}>
                <DialogContent><DialogHeader><DialogTitle>Zmień nazwę podmiotu</DialogTitle></DialogHeader>
                    <form onSubmit={rename} className="space-y-4">
                        <Label htmlFor="company-name">Nazwa podmiotu</Label><Input id="company-name" value={name} onChange={(event) => setName(event.target.value)} required />
                        <Button type="submit" disabled={saving || !name.trim()}>{saving ? 'Zapisywanie...' : 'Zapisz'}</Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
