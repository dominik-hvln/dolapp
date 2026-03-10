'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Trash2, Columns, Type, Image as ImageIcon, FileSpreadsheet } from 'lucide-react';
import { TemplateField } from './TemplateBuilder'; // Upewnij się, że eksportujesz ten typ z poprzedniego pliku

// Struktury danych layoutu (muszą pasować do backendu DTO)
export interface LayoutItem {
    id: string;
    type: 'field' | 'text';
    fieldId?: string;
    content?: string;
    style?: { bold?: boolean, color?: string, fontSize?: number };
}

export interface LayoutColumn {
    id: string;
    width: number;
    items: LayoutItem[];
}

export interface LayoutRow {
    id: string;
    columns: LayoutColumn[];
}

interface LayoutBuilderProps {
    availableFields: TemplateField[];
    layout: LayoutRow[];
    setLayout: (layout: LayoutRow[]) => void;
}

export function LayoutBuilder({ availableFields, layout, setLayout }: LayoutBuilderProps) {

    const addRow = (cols: number) => {
        const newRow: LayoutRow = {
            id: `row_${Date.now()}`,
            columns: Array(cols).fill(null).map((_, i) => ({
                id: `col_${Date.now()}_${i}`,
                width: Math.floor(100 / cols),
                items: []
            }))
        };
        setLayout([...layout, newRow]);
    };

    const removeRow = (rowId: string) => {
        setLayout(layout.filter(r => r.id !== rowId));
    };

    const addItemToColumn = (rowId: string, colId: string, type: 'field' | 'text') => {
        const newItem: LayoutItem = {
            id: `item_${Date.now()}`,
            type,
            content: type === 'text' ? 'Nowy tekst' : undefined,
            fieldId: type === 'field' && availableFields.length > 0 ? availableFields[0].id : undefined
        };

        setLayout(layout.map(row => {
            if (row.id !== rowId) return row;
            return {
                ...row,
                columns: row.columns.map(col => {
                    if (col.id !== colId) return col;
                    return { ...col, items: [...col.items, newItem] };
                })
            };
        }));
    };

    const updateItem = (rowId: string, colId: string, itemId: string, updates: Partial<LayoutItem>) => {
        setLayout(layout.map(row => {
            if (row.id !== rowId) return row;
            return {
                ...row,
                columns: row.columns.map(col => {
                    if (col.id !== colId) return col;
                    return {
                        ...col,
                        items: col.items.map(item => item.id === itemId ? { ...item, ...updates } : item)
                    };
                })
            };
        }));
    };

    const removeItem = (rowId: string, colId: string, itemId: string) => {
        setLayout(layout.map(row => {
            if (row.id !== rowId) return row;
            return {
                ...row,
                columns: row.columns.map(col => {
                    if (col.id !== colId) return col;
                    return {
                        ...col,
                        items: col.items.filter(item => item.id !== itemId)
                    };
                })
            };
        }));
    };

    return (
        <div className="space-y-6">
            {/* Pasek narzędzi */}
            <div className="flex gap-2 justify-center p-4 bg-muted/20 rounded-lg border border-dashed">
                <span className="text-sm text-muted-foreground self-center mr-2">Dodaj wiersz:</span>
                <Button variant="outline" size="sm" onClick={() => addRow(1)}><Columns className="mr-2 h-4 w-4"/> 1 Kolumna</Button>
                <Button variant="outline" size="sm" onClick={() => addRow(2)}><Columns className="mr-2 h-4 w-4"/> 2 Kolumny</Button>
                <Button variant="outline" size="sm" onClick={() => addRow(3)}><Columns className="mr-2 h-4 w-4"/> 3 Kolumny</Button>
            </div>

            {/* Obszar roboczy (Canvas) */}
            <div className="space-y-4 min-h-[300px]">
                {layout.map((row) => (
                    <Card key={row.id} className="relative border-primary/20 group hover:border-primary/50 transition-colors">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute -right-3 -top-3 bg-background border shadow-sm text-destructive hover:bg-destructive/10 z-10 opacity-0 group-hover:opacity-100 transition-opacity rounded-full h-8 w-8"
                            onClick={() => removeRow(row.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>

                        <CardContent className="pt-6">
                            <div className="flex gap-4">
                                {row.columns.map((col, colIndex) => (
                                    <div key={col.id} className="flex-1 bg-muted/30 p-3 rounded-md border border-dashed min-h-[100px] relative">
                                        {/* Etykieta kolumny */}
                                        <div className="absolute top-1 left-2 text-[10px] text-muted-foreground uppercase font-bold tracking-widest opacity-50">
                                            Kolumna {colIndex + 1}
                                        </div>

                                        <div className="space-y-3 mt-4">
                                            {col.items.map((item) => (
                                                <div key={item.id} className="bg-card p-3 rounded border shadow-sm text-sm space-y-2 group/item relative">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-2">
                                                            {item.type === 'field' ? (
                                                                <span className="flex items-center gap-1 font-medium text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                                                    <FileSpreadsheet className="h-3 w-3" /> DANE
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center gap-1 font-medium text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                                                                    <Type className="h-3 w-3" /> TEKST
                                                                </span>
                                                            )}
                                                        </div>
                                                        <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover/item:opacity-100" onClick={() => removeItem(row.id, col.id, item.id)}>
                                                            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                                                        </Button>
                                                    </div>

                                                    {item.type === 'text' ? (
                                                        <Input
                                                            value={item.content}
                                                            onChange={(e) => updateItem(row.id, col.id, item.id, { content: e.target.value })}
                                                            placeholder="Wpisz tekst..."
                                                            className="h-8 text-xs"
                                                        />
                                                    ) : (
                                                        <Select
                                                            value={item.fieldId}
                                                            onValueChange={(val) => updateItem(row.id, col.id, item.id, { fieldId: val })}
                                                        >
                                                            <SelectTrigger className="h-8 text-xs">
                                                                <SelectValue placeholder="Wybierz pole..." />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {availableFields.map(f => (
                                                                    <SelectItem key={f.id} value={f.id}>
                                                                        {f.label} {f.type === 'table' ? '(Tabela)' : ''}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Przyciski dodawania elementów do kolumny */}
                                        <div className="mt-4 flex gap-2 justify-center opacity-50 hover:opacity-100 transition-opacity">
                                            <Button variant="secondary" size="sm" className="h-6 text-[10px] px-2" onClick={() => addItemToColumn(row.id, col.id, 'text')}>
                                                + Tekst
                                            </Button>
                                            <Button variant="secondary" size="sm" className="h-6 text-[10px] px-2" onClick={() => addItemToColumn(row.id, col.id, 'field')}>
                                                + Pole
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {layout.length === 0 && (
                    <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-xl bg-muted/10">
                        <Columns className="h-10 w-10 mx-auto mb-4 opacity-20" />
                        <p>Układ jest pusty.</p>
                        <p className="text-sm opacity-70">Dodaj pierwszy wiersz z paska powyżej, aby rozpocząć projektowanie.</p>
                    </div>
                )}
            </div>
        </div>
    );
}