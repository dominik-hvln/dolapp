'use client';

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GripVertical, Trash2, Plus, X } from 'lucide-react';

// Typy pól
export type FieldType = 'text' | 'textarea' | 'number' | 'checkbox' | 'photo' | 'section' | 'signature' | 'table';

export interface TemplateField {
    id: string;
    type: FieldType;
    label: string;
    required: boolean;
    columns?: string[]; // ✅ Nazwy kolumn dla tabeli
}

function SortableField({ field, onRemove, onUpdate }: { field: TemplateField, onRemove: (id: string) => void, onUpdate: (id: string, field: Partial<TemplateField>) => void }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: field.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    // Funkcje do zarządzania kolumnami tabeli
    const addColumn = () => {
        const currentCols = field.columns || [];
        onUpdate(field.id, { columns: [...currentCols, `Kolumna ${currentCols.length + 1}`] });
    };

    const updateColumn = (index: number, val: string) => {
        const newCols = [...(field.columns || [])];
        newCols[index] = val;
        onUpdate(field.id, { columns: newCols });
    };

    const removeColumn = (index: number) => {
        const newCols = [...(field.columns || [])];
        newCols.splice(index, 1);
        onUpdate(field.id, { columns: newCols });
    };

    return (
        <div ref={setNodeRef} style={style} className="bg-card border rounded-lg p-4 mb-3 shadow-sm space-y-4">
            <div className="flex items-center gap-4">
                <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                    <GripVertical className="h-5 w-5" />
                </div>

                <div className="w-[160px]">
                    <Select
                        value={field.type}
                        onValueChange={(val) => onUpdate(field.id, { type: val as FieldType, columns: val === 'table' ? ['Nazwa', 'Ilość'] : undefined })}
                    >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="text">Tekst krótki</SelectItem>
                            <SelectItem value="textarea">Opis długi</SelectItem>
                            <SelectItem value="number">Liczba</SelectItem>
                            <SelectItem value="checkbox">Checkbox</SelectItem>
                            <SelectItem value="photo">Zdjęcie</SelectItem>
                            <SelectItem value="table">Tabela</SelectItem> {/* ✅ Nowa opcja */}
                            <SelectItem value="signature">Podpis</SelectItem>
                            <SelectItem value="section">---- Sekcja ----</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex-1">
                    <Input
                        value={field.label}
                        onChange={(e) => onUpdate(field.id, { label: e.target.value })}
                        placeholder="Nazwa pola (np. Lista Materiałów)"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Label htmlFor={`req-${field.id}`} className="text-sm text-muted-foreground whitespace-nowrap">
                        Wymagane?
                    </Label>
                    <input
                        type="checkbox"
                        id={`req-${field.id}`}
                        checked={field.required}
                        onChange={(e) => onUpdate(field.id, { required: e.target.checked })}
                        className="h-4 w-4"
                    />
                </div>

                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => onRemove(field.id)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            {/* ✅ Edytor Kolumn Tabeli */}
            {field.type === 'table' && (
                <div className="pl-10 pr-4 pt-2 border-t border-dashed">
                    <Label className="text-xs text-muted-foreground mb-2 block">Definicja Kolumn</Label>
                    <div className="space-y-2">
                        {field.columns?.map((col, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                                <span className="text-xs text-muted-foreground w-6">{idx + 1}.</span>
                                <Input
                                    value={col}
                                    onChange={(e) => updateColumn(idx, e.target.value)}
                                    className="h-8"
                                    placeholder="Nazwa kolumny"
                                />
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeColumn(idx)}>
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={addColumn} className="mt-2 text-xs">
                            <Plus className="h-3 w-3 mr-1" /> Dodaj Kolumnę
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

interface TemplateBuilderProps {
    fields: TemplateField[];
    setFields: (fields: TemplateField[]) => void;
}

export function TemplateBuilder({ fields, setFields }: TemplateBuilderProps) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const oldIndex = fields.findIndex((i) => i.id === active.id);
            const newIndex = fields.findIndex((i) => i.id === over?.id);
            setFields(arrayMove(fields, oldIndex, newIndex));
        }
    };

    const addField = () => {
        const newField: TemplateField = {
            id: `field_${Date.now()}`,
            type: 'text',
            label: '',
            required: false,
        };
        setFields([...fields, newField]);
    };

    const removeField = (id: string) => {
        setFields(fields.filter(f => f.id !== id));
    };

    const updateField = (id: string, updates: Partial<TemplateField>) => {
        setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Pola Raportu</h3>
                <Button onClick={addField} variant="outline" size="sm">
                    <Plus className="mr-2 h-4 w-4" /> Dodaj Pole
                </Button>
            </div>

            <div className="bg-muted/30 rounded-xl p-4 border border-dashed min-h-[200px]">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={fields} strategy={verticalListSortingStrategy}>
                        {fields.map((field) => (
                            <SortableField
                                key={field.id}
                                field={field}
                                onRemove={removeField}
                                onUpdate={updateField}
                            />
                        ))}
                    </SortableContext>
                </DndContext>

                {fields.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground">
                        {'Kliknij "Dodaj Pole", aby zdefiniować dane.'}
                    </div>
                )}
            </div>
        </div>
    );
}