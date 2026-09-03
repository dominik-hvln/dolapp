'use client';

import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CompanySettings, TaskOption, taskLabel } from '@/lib/users';

const NO_TASK = '__none__';

interface CompanyOvertimeSettingsCardProps {
    tasks: TaskOption[];
    onSettingsChange?: (settings: CompanySettings) => void;
}

export function CompanyOvertimeSettingsCard({ tasks, onSettingsChange }: CompanyOvertimeSettingsCardProps) {
    const [interval, setInterval] = useState<string>('60');
    const [defaultTaskId, setDefaultTaskId] = useState<string>(NO_TASK);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        let cancelled = false;
        api.get<CompanySettings>('/companies/me/settings')
            .then(({ data }) => {
                if (cancelled) return;
                setInterval(String(data.overtime_reminder_interval_minutes ?? 60));
                setDefaultTaskId(data.default_overtime_task_id ?? NO_TASK);
                onSettingsChange?.(data);
            })
            .catch((error: unknown) => {
                console.error('Błąd pobierania ustawień firmy:', error);
                if (!cancelled) toast.error('Błąd', { description: 'Nie udało się pobrać ustawień nadgodzin firmy.' });
            })
            .finally(() => { if (!cancelled) setIsLoading(false); });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSave = async () => {
        const minutes = Number(interval);
        if (!Number.isInteger(minutes) || minutes < 0 || minutes > 24 * 60) {
            toast.error('Błąd', { description: 'Interwał musi być liczbą całkowitą minut z zakresu 0-1440.' });
            return;
        }
        setIsSaving(true);
        try {
            const { data } = await api.patch<CompanySettings>('/companies/me/settings', {
                overtime_reminder_interval_minutes: minutes,
                default_overtime_task_id: defaultTaskId === NO_TASK ? null : defaultTaskId,
            });
            setInterval(String(data.overtime_reminder_interval_minutes ?? minutes));
            setDefaultTaskId(data.default_overtime_task_id ?? NO_TASK);
            onSettingsChange?.(data);
            toast.success('Sukces!', { description: 'Ustawienia nadgodzin zostały zapisane.' });
        } catch (error) {
            const axiosError = error as AxiosError<{ message?: string | string[] }>;
            const message = axiosError.response?.data?.message;
            toast.error('Błąd', {
                description: Array.isArray(message) ? message.join(', ') : message || 'Nie udało się zapisać ustawień.',
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle>Ustawienia nadgodzin firmy</CardTitle>
                <CardDescription>
                    Po osiągnięciu limitu dziennego system zamyka bieżące zadanie i przełącza pracownika na zadanie nadgodzinowe
                    (z jego profilu, a gdy nie ustawiono - domyślne firmy).
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 sm:grid-cols-[200px_1fr_auto] sm:items-end">
                    <div className="space-y-2">
                        <Label htmlFor="overtime-interval">Interwał przypomnień (min)</Label>
                        <Input
                            id="overtime-interval"
                            type="number"
                            min={0}
                            max={1440}
                            step={5}
                            value={interval}
                            disabled={isLoading}
                            onChange={(e) => setInterval(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Domyślne zadanie nadgodzinowe</Label>
                        <Select value={defaultTaskId} onValueChange={setDefaultTaskId} disabled={isLoading}>
                            <SelectTrigger><SelectValue placeholder="Wybierz zadanie" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value={NO_TASK}>Brak - wg nazwy zadania NADGODZINY</SelectItem>
                                {tasks.map((task) => (
                                    <SelectItem key={task.id} value={task.id}>{taskLabel(task)}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleSave} disabled={isLoading || isSaving}>
                        {isSaving ? 'Zapisywanie...' : 'Zapisz'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
