'use client';

import { useState, useRef } from 'react';
import { TemplateField } from '@/components/reports/TemplateBuilder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Camera, Plus, Trash2, Eraser } from 'lucide-react'; // 1. Usunięto PenTool
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import SignatureCanvas from 'react-signature-canvas';

// Eksportujemy typy, aby używać ich w pliku page.tsx
export type TableRowData = Record<string, string>;
export type AnswerValue = string | number | boolean | TableRowData[];

interface ReportRendererProps {
    fields: TemplateField[];
    onSubmit: (answers: Record<string, AnswerValue>) => void;
    isSubmitting: boolean;
}

export function ReportRenderer({ fields, onSubmit, isSubmitting }: ReportRendererProps) {
    const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});

    // Referencje do podpisów (potrzebne do czyszczenia/pobierania obrazka)
    const sigPadRefs = useRef<Record<string, SignatureCanvas | null>>({});

    // Uniwersalna funkcja zmiany stanu
    const handleChange = (fieldId: string, value: AnswerValue) => {
        setAnswers((prev) => ({ ...prev, [fieldId]: value }));
    };

    // --- OBSŁUGA PODPISU ---
    const handleSignatureEnd = (fieldId: string) => {
        const ref = sigPadRefs.current[fieldId];
        if (ref) {
            if (ref.isEmpty()) {
                handleChange(fieldId, '');
            } else {
                // Pobieramy obrazek jako Base64 (PNG)
                const base64 = ref.getTrimmedCanvas().toDataURL('image/png');
                handleChange(fieldId, base64);
            }
        }
    };

    const clearSignature = (fieldId: string) => {
        const ref = sigPadRefs.current[fieldId];
        if (ref) {
            ref.clear();
            handleChange(fieldId, ''); // Czyścimy wartość w stanie
        }
    };

    // --- OBSŁUGA TABELI ---
    const addTableRow = (fieldId: string, columns: string[]) => {
        const currentRows = (answers[fieldId] as TableRowData[]) || [];
        // Tworzymy pusty wiersz z kluczami odpowiadającymi nazwom kolumn
        const newRow: TableRowData = columns.reduce((acc, col) => ({ ...acc, [col]: '' }), {});
        handleChange(fieldId, [...currentRows, newRow]);
    };

    const removeTableRow = (fieldId: string, index: number) => {
        const currentRows = (answers[fieldId] as TableRowData[]) || [];
        const newRows = currentRows.filter((_, i) => i !== index);
        handleChange(fieldId, newRows);
    };

    const updateTableRow = (fieldId: string, index: number, colName: string, val: string) => {
        const currentRows = [...((answers[fieldId] as TableRowData[]) || [])];
        if (!currentRows[index]) return;
        currentRows[index] = { ...currentRows[index], [colName]: val };
        handleChange(fieldId, currentRows);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(answers);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {fields.map((field) => {
                // 1. Sekcja (Nagłówek)
                if (field.type === 'section') {
                    return (
                        <div key={field.id} className="pt-4 pb-2 border-b">
                            <h3 className="text-lg font-semibold text-foreground">{field.label}</h3>
                        </div>
                    );
                }

                // 2. Tabela (Dynamiczne wiersze)
                if (field.type === 'table') {
                    const columns = field.columns || ['Kolumna 1'];
                    const rows = (answers[field.id] as TableRowData[]) || [];

                    return (
                        <div key={field.id} className="space-y-2">
                            <Label>{field.label}</Label>
                            <div className="border rounded-md overflow-hidden bg-card">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            {columns.map((col, idx) => (
                                                <TableHead key={idx}>{col}</TableHead>
                                            ))}
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rows.map((row, rowIndex) => (
                                            <TableRow key={rowIndex}>
                                                {columns.map((col, colIndex) => (
                                                    <TableCell key={colIndex} className="p-2">
                                                        <Input
                                                            value={row[col] || ''}
                                                            onChange={(e) => updateTableRow(field.id, rowIndex, col, e.target.value)}
                                                            className="h-8"
                                                        />
                                                    </TableCell>
                                                ))}
                                                <TableCell className="p-2">
                                                    <Button variant="ghost" size="icon" onClick={() => removeTableRow(field.id, rowIndex)}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {rows.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={columns.length + 1} className="text-center text-sm text-muted-foreground py-4">
                                                    {/* 2. Poprawiono cudzysłowy dla JSX */}
                                                    {'Brak danych. Kliknij "Dodaj wiersz".'}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={() => addTableRow(field.id, columns)}>
                                <Plus className="h-4 w-4 mr-2" /> Dodaj wiersz
                            </Button>
                        </div>
                    );
                }

                // 3. Pozostałe typy pól
                return (
                    <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.id}>
                            {field.label}
                            {field.required && <span className="text-destructive ml-1">*</span>}
                        </Label>

                        {field.type === 'text' && (
                            <Input
                                id={field.id}
                                required={field.required}
                                value={(answers[field.id] as string) || ''}
                                onChange={(e) => handleChange(field.id, e.target.value)}
                                placeholder="Wpisz tekst..."
                            />
                        )}

                        {field.type === 'textarea' && (
                            <Textarea
                                id={field.id}
                                required={field.required}
                                value={(answers[field.id] as string) || ''}
                                onChange={(e) => handleChange(field.id, e.target.value)}
                                className="min-h-[100px]"
                            />
                        )}

                        {field.type === 'number' && (
                            <Input
                                id={field.id}
                                type="number"
                                required={field.required}
                                value={(answers[field.id] as string) || ''}
                                onChange={(e) => handleChange(field.id, e.target.value)}
                            />
                        )}

                        {field.type === 'checkbox' && (
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id={field.id}
                                    checked={!!answers[field.id]}
                                    onCheckedChange={(checked) => handleChange(field.id, checked === true)}
                                />
                                <Label htmlFor={field.id} className="font-normal cursor-pointer text-muted-foreground">
                                    Zaznacz jeśli dotyczy
                                </Label>
                            </div>
                        )}

                        {field.type === 'photo' && (
                            <Card className="border-dashed">
                                <CardContent className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                                    <Camera className="h-8 w-8 mb-2 opacity-50" />
                                    <p className="text-sm">Kliknij, aby dodać zdjęcie</p>
                                    <Input
                                        type="text"
                                        placeholder="Nazwa pliku (symulacja)"
                                        className="mt-2"
                                        onChange={(e) => handleChange(field.id, e.target.value)}
                                    />
                                </CardContent>
                            </Card>
                        )}

                        {/* ✅ PODPIS Z NAPRAWĄ MOBILNĄ */}
                        {field.type === 'signature' && (
                            <Card className="border bg-white overflow-hidden shadow-sm">
                                <div className="relative h-40 w-full bg-white">
                                    <SignatureCanvas
                                        ref={(ref) => { sigPadRefs.current[field.id] = ref; }}
                                        penColor="black"
                                        backgroundColor="rgba(255,255,255,0)"
                                        canvasProps={{
                                            className: 'w-full h-full cursor-crosshair'
                                        }}
                                        onEnd={() => handleSignatureEnd(field.id)}
                                        clearOnResize={false} // ⚠️ KLUCZOWA POPRAWKA
                                    />
                                    {!answers[field.id] && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-muted-foreground/30 text-2xl">
                                            Podpisz tutaj
                                        </div>
                                    )}
                                </div>
                                <div className="border-t bg-muted/20 p-2 flex justify-end">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs h-7 hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => clearSignature(field.id)}
                                    >
                                        <Eraser className="h-3 w-3 mr-1" /> Wyczyść
                                    </Button>
                                </div>
                            </Card>
                        )}
                    </div>
                );
            })}

            <div className="pt-4">
                <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                    {isSubmitting ? 'Wysyłanie raportu...' : 'Zatwierdź Raport'}
                </Button>
            </div>
        </form>
    );
}