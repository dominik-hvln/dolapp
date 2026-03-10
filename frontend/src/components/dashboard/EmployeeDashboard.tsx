'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import { Geolocation } from '@capacitor/geolocation';
import { api } from '@/lib/api';
import { Network } from '@capacitor/network';
import { Preferences } from '@capacitor/preferences';
import { Scanner as WebScanner, IDetectedBarcode } from '@yudiel/react-qr-scanner';
import { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } from '@capacitor/barcode-scanner';
import type { AxiosError } from 'axios';
import { TimeEntryCard } from './TimeEntryCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Definicje typów
interface Task {
    id: string;
    name: string;
    project: { name: string };
}
interface TimeEntry {
    id: string;
    start_time: string;
    task: { name: string } | null;
    task_id: string | null;
}
interface OfflineScan {
    qrCodeValue: string;
    location: { latitude: number; longitude: number } | null;
    timestamp: string;
    id: string; // klucz w Preferences przy trybie offline
}

// --- Normalizacja kształtu wpisu z API (bez `any`) ---
// Dopuszczamy różne kształty nazw pól z backendu i mapujemy je na TimeEntry
type RawEntry = {
    id: string;
    start_time?: string;
    startTime?: string;
    task_id?: string | null;
    taskId?: string | null;
    task?: { id?: string | null; name?: string } | null;
    taskName?: string;
};

const normalizeEntry = (e: unknown): TimeEntry | null => {
    if (!e || typeof e !== 'object') return null;
    const obj = e as Record<string, unknown>;
    const id = obj['id'];
    if (typeof id !== 'string') return null;

    const start_time =
        typeof obj['start_time'] === 'string'
            ? (obj['start_time'] as string)
            : typeof obj['startTime'] === 'string'
                ? (obj['startTime'] as string)
                : '';

    const taskObj = obj['task'] && typeof obj['task'] === 'object' ? (obj['task'] as Record<string, unknown>) : null;

    const task_id =
        typeof obj['task_id'] === 'string' || obj['task_id'] === null
            ? (obj['task_id'] as string | null)
            : typeof obj['taskId'] === 'string' || obj['taskId'] === null
                ? (obj['taskId'] as string | null)
                : taskObj && typeof taskObj['id'] === 'string'
                    ? (taskObj['id'] as string)
                    : null;

    const task =
        taskObj && typeof taskObj['name'] === 'string'
            ? { name: taskObj['name'] as string }
            : typeof obj['taskName'] === 'string'
                ? { name: obj['taskName'] as string }
                : null;

    return { id, start_time, task_id, task } as TimeEntry;
};

const SCAN_COOLDOWN_MS = 1500; // ochrona przed dublami

function EmployeeDashboard() {
    const [isNative, setIsNative] = useState(false);
    const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
    const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isScanning, setIsScanning] = useState(false); // natywny stan skanera (lock)

    // Refs do anty-dubla
    const lastScanRef = useRef<{ value: string; at: number } | null>(null);
    const nativeScanLockRef = useRef(false); // natychmiastowy lock na iOS/Android

    // --- 1. POBIERANIE DANYCH ---
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [entryRes, tasksRes] = await Promise.all([
                api.get('/time-entries/my-active'),
                api.get('/tasks/my'),
            ]);
            setActiveEntry(normalizeEntry(entryRes.data));
            setAvailableTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
        } catch (error) {
            console.error('[fetchData] Błąd:', error);
            toast.error('Nie udało się pobrać statusu.');
            setActiveEntry(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // --- 2. SYNCHRONIZACJA OFFLINE ---
    const isSyncingRef = useRef(false);
    const syncOfflineScans = useCallback(async (showToast = true) => {
        if (isSyncingRef.current) return;
        isSyncingRef.current = true;
        try {
            const { keys } = await Preferences.keys();
            const offlineScanKeys = keys.filter((k) => k.startsWith('offline_scan_'));
            if (offlineScanKeys.length === 0) return;
            if (showToast) toast.info(`Synchronizuję ${offlineScanKeys.length} wpisów…`);
            for (const key of offlineScanKeys) {
                const { value } = await Preferences.get({ key });
                if (!value) continue;
                try {
                    const scanData: OfflineScan = JSON.parse(value);
                    await api.post('/time-entries/scan', scanData);
                    await Preferences.remove({ key });
                } catch (e) {
                    console.warn('Błąd synchronizacji wpisu', key, e);
                }
            }
            if (showToast) toast.success('Synchronizacja offline zakończona.');
            await fetchData();
        } finally {
            isSyncingRef.current = false;
        }
    }, [fetchData]);

    // --- 3. EFFECT ---
    useEffect(() => {
        setIsNative(Capacitor.isNativePlatform());
        fetchData();
        // uruchom sync po odzyskaniu sieci
        const networkListenerPromise = Network.addListener('networkStatusChange', async (status) => {
            if (status.connected) await syncOfflineScans(false);
        });
        return () => {
            networkListenerPromise.then((l) => l.remove());
        };
    }, [fetchData, syncOfflineScans]);

    // --- 4. OBSŁUGA SKANU ---
    const handleScanResult = async (code: string) => {
        if (!code) return;

        // globalna anty-powtórka (web + native)
        const now = Date.now();
        const last = lastScanRef.current;
        if (last && last.value === code && now - last.at < SCAN_COOLDOWN_MS) {
            return;
        }
        lastScanRef.current = { value: code, at: now };

        if (isSubmitting) return;
        setIsSubmitting(true);

        // spróbuj pobrać lokalizację (opcjonalna)
        let location: { latitude: number; longitude: number } | null = null;
        try {
            if (Capacitor.isNativePlatform()) {
                await Geolocation.requestPermissions();
                const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
                location = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
            }
        } catch (e) {
            console.warn('[GPS] Nie udało się pobrać lokalizacji:', e);
        }

        // payload zgodny z backendem
        const scanData: OfflineScan = {
            qrCodeValue: code,
            location,
            timestamp: new Date().toISOString(),
            id: `offline_scan_${Date.now()}`,
        };

        try {
            const response = await api.post('/time-entries/scan', scanData);
            const status = String(response?.data?.status || '').trim();
            const raw = response?.data?.entry ?? response?.data?.newEntry ?? null;
            const entry = normalizeEntry(raw);

            if (status === 'clock_in') {
                setActiveEntry(entry);
                toast.success(entry?.task ? 'Rozpoczęto pracę nad zleceniem!' : 'Dzień pracy rozpoczęty.');
            } else if (status === 'clock_out') {
                setActiveEntry(null);
                toast.info('Zakończono pracę!');
            } else {
                toast.error('Nieznany status odpowiedzi z serwera.');
            }
        } catch (err) {
            const axiosError = err as AxiosError<unknown, unknown>;
            const net = await Network.getStatus();
            if (!net.connected || !axiosError.response) {
                // zapisz offline i zaktualizuj UI orientacyjnie
                await Preferences.set({ key: scanData.id, value: JSON.stringify(scanData) });
                toast.info('Brak połączenia. Zapisano wpis offline.');
                if (!activeEntry) {
                    setActiveEntry({ id: scanData.id, start_time: scanData.timestamp, task: null, task_id: null });
                } else {
                    setActiveEntry(null);
                }
            } else {
                const msg = (axiosError.response.data as { message?: string } | undefined)?.message;
                toast.error('Błąd serwera', { description: msg || 'Nie udało się zarejestrować czasu.' });
            }
        } finally {
            // krótki cooldown, aby zapobiec dublom
            setTimeout(() => setIsSubmitting(false), 800);
        }
    };

    // --- 5. SCAN: NATIVE (z twardym lockiem, by nie uruchomić 2x) ---
    const startNativeScan = async () => {
        if (nativeScanLockRef.current || isSubmitting) return;
        nativeScanLockRef.current = true;
        setIsScanning(true);
        try {
            const res = await CapacitorBarcodeScanner.scanBarcode({ hint: CapacitorBarcodeScannerTypeHint.QR_CODE });
            const code = (res as unknown as { ScanResult?: string }).ScanResult || '';
            if (code) await handleScanResult(code);
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            if (!/cancelled|canceled/i.test(msg)) toast.error('Błąd skanera', { description: msg });
        } finally {
            setIsScanning(false);
            nativeScanLockRef.current = false;
        }
    };

    // --- 6. SCAN: WEB ---
    const handleWebScanSuccess = (result: IDetectedBarcode[]) => {
        const code = result?.[0]?.rawValue;
        if (code) void handleScanResult(code);
    };
    const handleWebScanError = (error: unknown) => {
        if (error instanceof Error && !error.message.includes('No QR code found')) {
            console.error('Błąd skanera webowego:', error.message);
        }
    };

    // --- 7. PRZEŁĄCZANIE ZLECENIA Z LISTY ---
    const handleSwitchTask = async (taskId: string) => {
        if (!taskId || isSubmitting) return;
        setIsSubmitting(true);
        let location: { latitude: number; longitude: number } | null = null;
        try {
            if (Capacitor.isNativePlatform()) {
                const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
                location = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
            }
        } catch (e) {
            console.warn('[GPS] (switch) Nie udało się pobrać lokalizacji:', e);
        }

        try {
            const response = await api.post('/time-entries/switch-task', { taskId, location });
            const raw = response?.data?.entry ?? response?.data?.newEntry ?? null;
            const newEntry = normalizeEntry(raw);
            setActiveEntry(newEntry);
            toast.success('Rozpoczęto nowe zlecenie!');
        } catch (err) {
            const axiosError = err as AxiosError<unknown, unknown>;
            const msg = (axiosError.response?.data as { message?: string } | undefined)?.message;
            toast.error('Nie udało się przełączyć zlecenia.', { description: msg });
        } finally {
            setTimeout(() => setIsSubmitting(false), 800);
        }
    };

    // --- 8. RENDEROWANIE ---
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-muted-foreground">Ładowanie statusu…</p>
            </div>
        );
    }

    // Widok: NIE W PRACY
    if (!activeEntry) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-4 pt-12 md:pt-4">
                <h1 className="text-3xl font-bold mb-8 text-center">Gotowy do pracy?</h1>
                {isNative ? (
                    <Button onClick={startNativeScan} className="h-16 text-xl w-full max-w-xs" disabled={isSubmitting || isScanning}>
                        {isSubmitting || isScanning ? 'Przetwarzanie…' : 'Skanuj Kod QR'}
                    </Button>
                ) : (
                    <div className="w-full max-w-sm border-2 border-dashed rounded-lg p-2">
                        <WebScanner onScan={handleWebScanSuccess} onError={handleWebScanError} constraints={{ facingMode: 'environment' }} allowMultiple={false} />
                        <p className="text-xs text-muted-foreground mt-2">Zeskanuj kod zlecenia lub kod ogólny (np. „Biuro”).</p>
                    </div>
                )}
            </div>
        );
    }

    // Widok: W PRACY — OGÓLNY (bez task_id)
    if (activeEntry && !activeEntry.task_id) {
        return (
            <div className="p-4 pt-12 md:pt-4 space-y-6">
                <TimeEntryCard entry={activeEntry} />
                <div className="space-y-2">
                    <p className="text-sm">Wybierz zlecenie, aby zacząć nad nim pracę:</p>
                    <Select onValueChange={handleSwitchTask} disabled={isSubmitting}>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Wybierz zlecenie" /></SelectTrigger>
                        <SelectContent>
                            {availableTasks.map((t) => (
                                <SelectItem key={t.id} value={t.id}>{t.name} ({t.project?.name || 'Brak proj.'})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <p className="text-xs text-muted-foreground mb-2">Lub zakończ dzień pracy, skanując kod ogólny:</p>
                    <Button onClick={isNative ? startNativeScan : undefined} className="w-full" variant="secondary" disabled={isSubmitting || isScanning}>
                        {isSubmitting || isScanning ? 'Przetwarzanie…' : 'Zeskanuj kod ogólny'}
                    </Button>
                    {!isNative && (
                        <div className="mt-4">
                            <WebScanner onScan={handleWebScanSuccess} onError={handleWebScanError} constraints={{ facingMode: 'environment' }} allowMultiple={false} />
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Widok: W PRACY — KONKRETNE ZLECENIE (ma task_id)
    return (
        <div className="p-4 pt-12 md:pt-4">
            <TimeEntryCard entry={activeEntry} />
            <Button onClick={isNative ? startNativeScan : undefined} className="w-full mt-6" variant="destructive" disabled={isSubmitting || isScanning}>
                {isSubmitting || isScanning ? 'Przetwarzanie…' : 'Zakończ zlecenie (Zeskanuj QR)'}
            </Button>
            {!isNative && (
                <div className="mt-4">
                    <WebScanner onScan={handleWebScanSuccess} onError={handleWebScanError} constraints={{ facingMode: 'environment' }} allowMultiple={false} />
                </div>
            )}
        </div>
    );
}

export default EmployeeDashboard;
export { EmployeeDashboard };
