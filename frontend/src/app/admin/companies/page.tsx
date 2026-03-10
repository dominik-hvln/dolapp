'use client';

import { useEffect, useState } from 'react';
import { superAdminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

export default function CompaniesPage() {
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newCompany, setNewCompany] = useState({ name: '' });
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        setLoading(true);
        try {
            const data = await superAdminApi.getCompanies();
            setCompanies(data);
        } catch (error) {
            console.error(error);
            toast.error('Błąd pobierania firm');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCompany = async () => {
        try {
            await superAdminApi.createCompany(newCompany);
            toast.success('Firma utworzona');
            setIsDialogOpen(false);
            setNewCompany({ name: '' });
            fetchCompanies();
        } catch (error) {
            toast.error('Błąd tworzenia firmy');
        }
    };

    if (loading) return <div>Ładowanie...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Wszystkie Firmy</h1>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>Dodaj Nową Firmę</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Dodaj nową firmę</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <Input
                                placeholder="Nazwa firmy"
                                value={newCompany.name}
                                onChange={(e) => setNewCompany({ name: e.target.value })}
                            />
                            <Button onClick={handleCreateCompany} className="w-full">
                                Utwórz
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nazwa Firmy</TableHead>
                            <TableHead>ID</TableHead>
                            <TableHead>Data utworzenia</TableHead>
                            <TableHead className="text-right">Akcje</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {companies.map((company) => (
                            <TableRow key={company.id}>
                                <TableCell className="font-medium text-indigo-900">{company.name}</TableCell>
                                <TableCell className="font-mono text-xs text-gray-500">{company.id}</TableCell>
                                <TableCell>
                                    {company.created_at && format(new Date(company.created_at), 'd MMM yyyy', { locale: pl })}
                                </TableCell>
                                <TableCell className="text-right">
                                    <a href={`/admin/companies/${company.id}`}>
                                        <Button variant="outline" size="sm">Szczegóły</Button>
                                    </a>
                                </TableCell>
                            </TableRow>
                        ))}
                        {companies.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                    Brak firm w systemie.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div >
    );
}
