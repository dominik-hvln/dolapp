'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Calendar, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
// ✅ 1. Importujemy typ pola, który zdefiniowaliśmy wcześniej
import { TemplateField } from '@/components/reports/TemplateBuilder';

// ✅ 2. Używamy tego typu w interfejsie
interface ReportTemplate {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
    fields: TemplateField[]; // Zamiast any[]
}

// Pomocniczy typ dla usera
interface UserWithCompany {
    company_id?: string;
}

export default function TemplatesListPage() {
    const { user } = useAuthStore();
    const [templates, setTemplates] = useState<ReportTemplate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTemplates = async () => {
            // Rzutowanie typu dla bezpieczeństwa
            const companyId = (user as unknown as UserWithCompany)?.company_id;

            if (!companyId) {
                setLoading(false);
                return;
            }

            try {
                const response = await api.get<ReportTemplate[]>(`/report-templates/company/${companyId}`);
                setTemplates(response.data);
            } catch (error) {
                console.error(error);
                toast.error('Nie udało się pobrać listy szablonów');
            } finally {
                setLoading(false);
            }
        };

        fetchTemplates();
    }, [user]);

    return (
        <div className="p-6 space-y-6">
            {/* Nagłówek */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Szablony Raportów</h1>
                    <p className="text-muted-foreground">Zarządzaj wzorami dokumentów dla swoich pracowników.</p>
                </div>
                <Link href="/dashboard/reports/templates/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Nowy Szablon
                    </Button>
                </Link>
            </div>

            {/* Lista */}
            <Card>
                <CardHeader>
                    <CardTitle>Dostępne Szablony</CardTitle>
                    <CardDescription>Lista wszystkich aktywnych szablonów w firmie.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">Ładowanie szablonów...</div>
                    ) : templates.length === 0 ? (
                        <div className="text-center py-12 flex flex-col items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                <FileText className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="font-medium text-lg">Brak szablonów</h3>
                            <p className="text-muted-foreground max-w-sm text-center">
                                Nie masz jeszcze żadnych szablonów raportów. Utwórz pierwszy, aby pracownicy mogli z niego korzystać.
                            </p>
                            <Link href="/dashboard/reports/templates/new">
                                <Button variant="outline" className="mt-2">Stwórz pierwszy szablon</Button>
                            </Link>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nazwa Szablonu</TableHead>
                                    <TableHead>Opis</TableHead>
                                    <TableHead>Liczba Pól</TableHead>
                                    <TableHead>Data Utworzenia</TableHead>
                                    <TableHead className="text-right">Akcje</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {templates.map((template) => (
                                    <TableRow key={template.id}>
                                        <TableCell className="font-medium flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-blue-500" />
                                            {template.name}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {template.description || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{template.fields?.length || 0} pól</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(template.created_at).toLocaleDateString('pl-PL')}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="ghost" size="icon">
                                                <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                                                <Trash2 className="h-4 w-4" />
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