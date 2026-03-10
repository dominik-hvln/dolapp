'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Calendar, User, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface Report {
    id: string;
    title: string;
    created_at: string;
    report_templates: {
        name: string;
    };
    users: {
        first_name: string;
        last_name: string;
    };
}

interface UserWithCompany {
    company_id?: string;
}

export default function ReportsListPage() {
    const { user } = useAuthStore();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            const companyId = (user as unknown as UserWithCompany)?.company_id;
            if (!companyId) {
                setLoading(false);
                return;
            }

            try {
                const { data } = await api.get<Report[]>(`/reports/company/${companyId}`);
                setReports(data);
            } catch (error) {
                console.error(error);
                toast.error('Nie udało się pobrać listy raportów');
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, [user]);

    const handleDownloadPDF = async (reportId: string, title: string) => {
        try {
            toast.message('Generowanie PDF...', { description: 'Proszę czekać.' });
            const response = await api.get(`/reports/${reportId}/pdf`, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            link.setAttribute('download', `raport_${safeTitle}.pdf`);
            document.body.appendChild(link);
            link.click();

            // Sprzątanie
            if (link.parentNode) link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('Pobrano plik PDF');
        } catch (error) {
            console.error(error);
            toast.error('Błąd pobierania PDF', { description: 'Spróbuj ponownie później.' });
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Raporty</h1>
                    <p className="text-muted-foreground">Przeglądaj dokumentację techniczną i generuj pliki PDF.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/dashboard/reports/templates">
                        <Button variant="outline">Szablony</Button>
                    </Link>
                    <Link href="/dashboard/reports/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Nowy Raport
                        </Button>
                    </Link>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Ostatnie Raporty</CardTitle>
                    <CardDescription>Lista dokumentów przesłanych przez pracowników.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">Ładowanie...</div>
                    ) : reports.length === 0 ? (
                        <div className="text-center py-12 flex flex-col items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                <FileText className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="font-medium text-lg">Brak raportów</h3>
                            <p className="text-muted-foreground max-w-sm text-center">
                                Nikt jeszcze nie wypełnił żadnego raportu.
                            </p>
                            <Link href="/dashboard/reports/new">
                                <Button variant="outline" className="mt-2">Dodaj pierwszy raport</Button>
                            </Link>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tytuł / Klient</TableHead>
                                    <TableHead>Szablon</TableHead>
                                    <TableHead>Pracownik</TableHead>
                                    <TableHead>Data</TableHead>
                                    <TableHead className="text-right">Akcje</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reports.map((report) => (
                                    <TableRow key={report.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-primary" />
                                                {report.title}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="font-normal">
                                                {report.report_templates?.name || 'Nieznany szablon'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-sm">
                                                <User className="h-3 w-3 text-muted-foreground" />
                                                {report.users
                                                    ? `${report.users.first_name} ${report.users.last_name}`
                                                    : 'Nieznany'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(report.created_at).toLocaleDateString('pl-PL')}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="ghost" size="sm" onClick={() => handleDownloadPDF(report.id, report.title)}>
                                                <Download className="h-4 w-4 mr-1" /> PDF
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );

}