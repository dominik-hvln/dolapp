'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api, getApiErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CompanySettings, TIME_TRACKING_MODE_OPTIONS, TimeTrackingMode } from '@/lib/users';

const formatDay = (day: string) => day.split('-').reverse().join('.');
const labelOf = (mode: TimeTrackingMode) => TIME_TRACKING_MODE_OPTIONS.find((option) => option.value === mode)?.label ?? mode;

export function CompanyTimeModeCard() {
    const role = useAuthStore((state) => state.user?.role);
    const canEdit = role === 'admin' || role === 'super_admin';
    const [settings, setSettings] = useState<CompanySettings | null>(null);
    const [selected, setSelected] = useState<TimeTrackingMode | ''>('');
    const [isSaving, setIsSaving] = useState(false);

    const apply = (data: CompanySettings) => {
        setSettings(data);
        setSelected(data.time_tracking_mode_pending?.mode ?? data.time_tracking_mode ?? '');
    };

    useEffect(() => {
        const load = () => {
            api.get<CompanySettings>('/companies/me/settings')
                .then(({ data }) => apply(data))
                .catch((error: unknown) => toast.error('Błąd', { description: getApiErrorMessage(error, 'Nie udało się pobrać sposobu liczenia czasu.') }));
        };
        load();
        // Pierwszy wybór w oknie startowym ma być od razu widoczny na tej karcie.
        window.addEventListener('time-tracking-mode-changed', load);
        return () => window.removeEventListener('time-tracking-mode-changed', load);
    }, []);

    const handleSave = async () => {
        if (!selected) return;
        setIsSaving(true);
        try {
            const { data } = await api.patch<CompanySettings>('/companies/me/settings', { time_tracking_mode: selected });
            apply(data);
            toast.success('Sukces!', {
                description: data.time_tracking_mode_pending
                    ? `Zmiana zacznie obowiązywać od ${formatDay(data.time_tracking_mode_pending.from)}.`
                    : 'Sposób liczenia czasu został zapisany.',
            });
        } catch (error) {
            toast.error('Błąd', { description: getApiErrorMessage(error, 'Nie udało się zapisać sposobu liczenia czasu.') });
        } finally {
            setIsSaving(false);
        }
    };

    const pending = settings?.time_tracking_mode_pending;
    const description = TIME_TRACKING_MODE_OPTIONS.find((option) => option.value === selected)?.description;

    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle>Sposób liczenia czasu pracy</CardTitle>
                <CardDescription>Zmiana działa najwyżej raz w miesiącu i obowiązuje od 1. dnia kolejnego miesiąca, żeby nie mieszać rozliczeń.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 sm:grid-cols-[minmax(0,420px)_auto] sm:items-end">
                    <div className="space-y-2">
                        <Label htmlFor="time-tracking-mode">Tryb</Label>
                        <Select value={selected} onValueChange={(value) => setSelected(value as TimeTrackingMode)} disabled={!settings || !canEdit}>
                            <SelectTrigger id="time-tracking-mode"><SelectValue placeholder="Wybierz sposób liczenia" /></SelectTrigger>
                            <SelectContent>
                                {TIME_TRACKING_MODE_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    {canEdit && <Button onClick={handleSave} disabled={!selected || isSaving}>{isSaving ? 'Zapisywanie...' : 'Zapisz'}</Button>}
                </div>
                {description && <p className="mt-3 text-sm text-muted-foreground">{description}</p>}
                {pending && settings?.time_tracking_mode && (
                    <p className="mt-2 text-sm font-medium">
                        Teraz obowiązuje: {labelOf(settings.time_tracking_mode)}. Od {formatDay(pending.from)}: {labelOf(pending.mode)}.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
