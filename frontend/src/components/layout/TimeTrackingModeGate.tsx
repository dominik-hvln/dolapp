'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api, getApiErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useCompanyContextStore } from '@/store/company-context.store';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CompanySettings, TIME_TRACKING_MODE_OPTIONS, TimeTrackingMode } from '@/lib/users';

/** Admin nowej firmy musi wybrać sposób liczenia czasu, zanim zacznie korzystać z panelu. */
export function TimeTrackingModeGate() {
    const role = useAuthStore((state) => state.user?.role);
    const activeCompanyId = useCompanyContextStore((state) => state.activeCompany?.id);
    const canConfigure = role === 'admin' || (role === 'super_admin' && !!activeCompanyId);
    const [mustChoose, setMustChoose] = useState(false);
    const [saving, setSaving] = useState<TimeTrackingMode | null>(null);

    useEffect(() => {
        if (!canConfigure) return;
        let cancelled = false;
        api.get<CompanySettings>('/companies/me/settings')
            .then(({ data }) => { if (!cancelled) setMustChoose(data.time_tracking_mode === null); })
            .catch((error: unknown) => console.error('Błąd pobierania sposobu liczenia czasu:', error));
        return () => { cancelled = true; };
    }, [canConfigure, activeCompanyId]);

    const choose = async (mode: TimeTrackingMode) => {
        setSaving(mode);
        try {
            await api.patch('/companies/me/settings', { time_tracking_mode: mode });
            setMustChoose(false);
            window.dispatchEvent(new Event('time-tracking-mode-changed'));
            toast.success('Sukces!', { description: 'Sposób liczenia czasu został zapisany.' });
        } catch (error) {
            toast.error('Błąd', { description: getApiErrorMessage(error, 'Nie udało się zapisać sposobu liczenia czasu.') });
        } finally {
            setSaving(null);
        }
    };

    return (
        <AlertDialog open={mustChoose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Jak liczyć czas pracy w tej firmie?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Wybierz sposób liczenia, zanim zaczniesz korzystać z aplikacji. Później można go zmienić najwyżej raz w miesiącu, ze skutkiem od 1. dnia kolejnego miesiąca.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="grid gap-3">
                    {TIME_TRACKING_MODE_OPTIONS.map((option) => (
                        <Button
                            key={option.value}
                            variant="outline"
                            className="h-auto w-full flex-col items-start gap-1 whitespace-normal p-4 text-left"
                            disabled={saving !== null}
                            onClick={() => choose(option.value)}
                        >
                            <span className="font-semibold">{saving === option.value ? 'Zapisywanie...' : option.label}</span>
                            <span className="text-sm font-normal text-muted-foreground">{option.description}</span>
                        </Button>
                    ))}
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}
