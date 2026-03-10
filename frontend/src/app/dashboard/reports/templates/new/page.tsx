'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { TemplateBuilder, TemplateField } from '@/components/reports/TemplateBuilder';
import { LayoutBuilder, LayoutRow } from '@/components/reports/LayoutBuilder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

interface UserWithCompany {
    company_id?: string;
}

export default function NewTemplatePage() {
    const router = useRouter();
    const { user } = useAuthStore();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [fields, setFields] = useState<TemplateField[]>([]);

    // Layout i Style
    const [layout, setLayout] = useState<LayoutRow[]>([]);
    const [primaryColor, setPrimaryColor] = useState('#0f172a');
    const [headerText, setHeaderText] = useState('');
    const [footerText, setFooterText] = useState('');
    const [logoUrl, setLogoUrl] = useState('');

    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error('Podaj nazwę szablonu');
            return;
        }
        if (fields.length === 0) {
            toast.error('Dodaj przynajmniej jedno pole');
            return;
        }

        setLoading(true);
        try {
            const companyId = (user as unknown as UserWithCompany)?.company_id;
            if (!companyId) {
                toast.error('Błąd: Brak ID firmy.');
                return;
            }

            // Jeśli layout jest pusty, generujemy prosty, domyślny (jeden pod drugim)
            const finalLayout = layout.length > 0 ? layout : fields.map(f => ({
                id: `auto_row_${f.id}`,
                columns: [{
                    id: `auto_col_${f.id}`,
                    width: 100,
                    items: [{ id: `auto_item_${f.id}`, type: 'field' as const, fieldId: f.id }]
                }]
            }));

            await api.post('/report-templates', {
                name,
                description,
                companyId,
                fields,
                layout: finalLayout, // ✅ Wysyłamy strukturę
                style: { primaryColor, headerText, footerText, logoUrl }
            });

            toast.success('Szablon zapisany pomyślnie');
            router.push('/dashboard/reports/templates');
        } catch (error) {
            console.error(error);
            toast.error('Nie udało się zapisać szablonu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Nowy Szablon Raportu</h1>
                        <p className="text-muted-foreground">Zdefiniuj dane i zaprojektuj wygląd PDF.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.back()}>Anuluj</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        <Save className="mr-2 h-4 w-4" />
                        {loading ? 'Zapisywanie...' : 'Zapisz Szablon'}
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="data" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
                    <TabsTrigger value="data">1. Dane i Pola</TabsTrigger>
                    <TabsTrigger value="design">2. Układ PDF</TabsTrigger>
                </TabsList>

                <TabsContent value="data" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="md:col-span-1 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Informacje</CardTitle>
                                    <CardDescription>Podstawowe dane.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nazwa szablonu</Label>
                                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="np. Raport Serwisowy" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="desc">Opis</Label>
                                        <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opcjonalny opis" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Style PDF</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Kolor przewodni</Label>
                                        <div className="flex items-center gap-2">
                                            <Input type="color" className="w-12 h-10 p-1 cursor-pointer" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
                                            <span className="text-sm text-muted-foreground">{primaryColor}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Nagłówek</Label>
                                        <Input value={headerText} onChange={(e) => setHeaderText(e.target.value)} placeholder="np. RAPORT" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Stopka</Label>
                                        <Input value={footerText} onChange={(e) => setFooterText(e.target.value)} placeholder="np. Adres firmy..." />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="md:col-span-2">
                            <Card className="min-h-[600px]">
                                <CardHeader>
                                    <CardTitle>Definicja Pól</CardTitle>
                                    <CardDescription>Jakie informacje ma zebrać pracownik?</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <TemplateBuilder fields={fields} setFields={setFields} />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="design">
                    <Card>
                        <CardHeader>
                            <CardTitle>Projektowanie Układu</CardTitle>
                            <CardDescription>
                                Przeciągaj pola zdefiniowane w kroku 1 do kolumn.
                                <br/>
                                <span className="text-xs text-muted-foreground">Wskazówka: Jeśli zostawisz to puste, system automatycznie ułoży pola jedno pod drugim.</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <LayoutBuilder
                                availableFields={fields}
                                layout={layout}
                                setLayout={setLayout}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}