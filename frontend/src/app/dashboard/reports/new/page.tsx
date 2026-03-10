'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
// ✅ IMPORTUJEMY AnswerValue, żeby typy były zgodne
import { ReportRenderer, AnswerValue } from '@/components/reports/ReportRenderer';
import { TemplateField } from '@/components/reports/TemplateBuilder';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { FileText, ArrowLeft, Mail } from 'lucide-react';

interface ReportTemplate {
    id: string;
    name: string;
    fields: TemplateField[];
}

interface UserWithCompany {
    company_id?: string;
}

export default function NewReportPage() {
    const router = useRouter();
    const { user } = useAuthStore();

    const [templates, setTemplates] = useState<ReportTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [reportTitle, setReportTitle] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchTemplates = async () => {
            const companyId = (user as unknown as UserWithCompany)?.company_id;
            if (!companyId) return;

            try {
                const { data } = await api.get<ReportTemplate[]>(`/report-templates/company/${companyId}`);
                setTemplates(data);
            } catch (error) {
                console.error(error);
                toast.error('Błąd pobierania szablonów');
            } finally {
                setLoading(false);
            }
        };

        fetchTemplates();
    }, [user]);

    const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

    // Używamy zaimportowanego typu AnswerValue
    const handleReportSubmit = async (answers: Record<string, AnswerValue>) => {
        if (!reportTitle.trim()) {
            toast.error('Podaj tytuł raportu (np. nazwa klienta)');
            return;
        }

        setSubmitting(true);
        const companyId = (user as unknown as UserWithCompany)?.company_id;

        try {
            await api.post('/reports', {
                templateId: selectedTemplateId,
                companyId: companyId,
                title: reportTitle,
                clientEmail: clientEmail || null,
                answers: answers,
            });

            toast.success('Raport został wysłany!');
            router.push('/dashboard/reports');
        } catch (error) {
            console.error(error);
            toast.error('Nie udało się zapisać raportu');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Ładowanie...</div>;
    }

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Nowy Raport</h1>
                    <p className="text-muted-foreground">Wypełnij dokument na podstawie szablonu.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Dane podstawowe</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Wybierz Szablon</Label>
                        <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Wybierz z listy..." />
                            </SelectTrigger>
                            <SelectContent>
                                {templates.map((t) => (
                                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedTemplate && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                            <div className="space-y-2">
                                <Label>Tytuł Raportu / Nazwa Klienta</Label>
                                <Input
                                    placeholder="np. Serwis u Jana Kowalskiego"
                                    value={reportTitle}
                                    onChange={(e) => setReportTitle(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    Email Klienta (opcjonalnie)
                                </Label>
                                <Input
                                    type="email"
                                    placeholder="klient@firma.pl"
                                    value={clientEmail}
                                    onChange={(e) => setClientEmail(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Jeśli podasz email, wyślemy na niego wygenerowany plik PDF.
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {selectedTemplate && (
                <Card className="border-primary/20 shadow-md">
                    <CardHeader className="bg-muted/30 pb-4">
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            <CardTitle>{selectedTemplate.name}</CardTitle>
                        </div>
                        <CardDescription>Uzupełnij poniższe pola.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <ReportRenderer
                            fields={selectedTemplate.fields}
                            onSubmit={handleReportSubmit}
                            isSubmitting={submitting}
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}