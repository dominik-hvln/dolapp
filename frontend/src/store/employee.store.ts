'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { AxiosError } from 'axios';
import {Network} from "@capacitor/network";

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
    id: string;
}

// Definicja stanu i akcji
interface EmployeeState {
    activeEntry: TimeEntry | null;
    availableTasks: Task[];
    isLoading: boolean;
    fetchData: () => Promise<void>;
    handleScan: (content: string) => Promise<void>;
    handleSwitchTask: (taskId: string) => Promise<void>;
    syncOfflineScans: (showToast?: boolean) => Promise<void>;
}

let isSyncing = false; // Flaga synchronizacji

export const useEmployeeStore = create<EmployeeState>((set, get) => ({
    activeEntry: null,
    availableTasks: [],
    isLoading: true,

    // --- AKCJA 1: POBIERANIE DANYCH ---
    fetchData: async () => {
        console.log('[Store fetchData] Start');
        set({ isLoading: true });
        try {
            const [entryRes, tasksRes] = await Promise.all([
                api.get('/time-entries/my-active'),
                api.get('/tasks/my'),
            ]);
            set({
                activeEntry: entryRes.data || null,
                availableTasks: tasksRes.data,
            });
        } catch (error: unknown) {
            console.error('[Store fetchData] Błąd:', error);
            const errorMessage = error instanceof Error ? error.message : 'Nie udało się pobrać statusu.';
            toast.error('Błąd', { description: errorMessage });
            set({ activeEntry: null });
        } finally {
            set({ isLoading: false });
            console.log('[Store fetchData] Koniec');
        }
    },

    // --- AKCJA 2: SYNCHRONIZACJA OFFLINE ---
    syncOfflineScans: async (showToast = true) => {
        if (isSyncing) { console.log('[syncOffline] Już trwa, pomijam.'); return; }
        isSyncing = true;
        console.log('[syncOffline] Start');
        try {
            const { keys } = await Preferences.keys();
            const offlineScanKeys = keys.filter(key => key.startsWith('offline_scan_'));
            if (offlineScanKeys.length === 0) {
                isSyncing = false;
                console.log('[syncOffline] Brak skanów.');
                return;
            }
            if (showToast) toast.info(`Synchronizuję ${offlineScanKeys.length} wpisów...`);
            let syncOk = true;
            for (const key of offlineScanKeys) {
                const { value } = await Preferences.get({ key });
                if (value) {
                    try {
                        const scanData: OfflineScan = JSON.parse(value);
                        await api.post('/time-entries/scan', scanData);
                        await Preferences.remove({ key });
                    } catch (error) {
                        console.error(`[syncOffline] Błąd synchronizacji skanu ${key}:`, error);
                        syncOk = false;
                        break;
                    }
                }
            }
            if (syncOk) {
                const { keys: remainingKeys } = await Preferences.keys();
                if (remainingKeys.filter(k => k.startsWith('offline_scan_')).length === 0) {
                    if (showToast) toast.success('Dane offline zostały zsynchronizowane!');
                    get().fetchData(); // Odśwież widok
                }
            }
        } finally {
            isSyncing = false;
            console.log('[syncOffline] Koniec');
        }
    },

    // --- AKCJA 3: OBSŁUGA SKANOWANIA (PRZEPISANA) ---
    handleScan: async (content: string) => {
        console.log(`[Store handleScan v3] Start. Kod: ${content}`);

        let location = null;
        try {
            if (Capacitor.isNativePlatform()) {
                await Geolocation.requestPermissions();
                const coordinates = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
                location = { latitude: coordinates.coords.latitude, longitude: coordinates.coords.longitude };
            }
        } catch (error) { console.warn('[Store handleScan v3] Błąd GPS:', error); }

        const scanData: OfflineScan = { qrCodeValue: content, location, timestamp: new Date().toISOString(), id: `offline_scan_${Date.now()}` };

        try {
            console.log('[Store handleScan v3] Wysyłam do API...');
            const response = await api.post('/time-entries/scan', scanData);

            if (!response || !response.data || typeof response.data.status !== 'string') {
                console.error('[Store handleScan v3] BŁĄD: Nieprawidłowa odpowiedź API!');
                toast.error('Błąd krytyczny: Nieprawidłowa odpowiedź serwera.');
                return;
            }

            const status = response.data.status.trim();
            const entryData = response.data.entry || response.data.newEntry ? { ...(response.data.entry || response.data.newEntry) } : null;
            console.log(`[Store handleScan v3] Otrzymany status: "${status}"`);

            if (status === 'clock_in') {
                toast.success('Rozpoczęto pracę!');
                set({ activeEntry: entryData }); // Ustawiamy stan na nowy wpis
            } else if (status === 'clock_out') {
                toast.info('Zakończono pracę!');
                set({ activeEntry: null }); // Czyścimy stan
            } else {
                toast.error(`Nieznany status operacji: ${status}`);
                get().fetchData(); // Spróbuj odświeżyć
            }

        } catch (error: unknown) {
            console.error('[Store handleScan v3] --- BŁĄD API ---');
            const axiosError = error as AxiosError;
            const networkStatus = await Network.getStatus();

            if (!networkStatus.connected || !axiosError.response) {
                console.log('[Store handleScan v3] Zapisuję offline...');
                await Preferences.set({ key: scanData.id, value: JSON.stringify(scanData) });
                toast.info('Brak połączenia. Zapisano dane offline.');

                // Optymistyczna aktualizacja UI
                const currentState = get().activeEntry;
                if(currentState) {
                    set({ activeEntry: null });
                } else {
                    const temporaryEntry: TimeEntry = {
                        id: scanData.id, start_time: scanData.timestamp, task: null, task_id: null
                    };
                    set({ activeEntry: temporaryEntry });
                }
            } else {
                console.log('[Store handleScan v3] Błąd odpowiedzi serwera.');
                const errorMessage = (axiosError.response?.data as { message: string })?.message;
                toast.error('Błąd serwera', { description: errorMessage || 'Nie udało się zarejestrować czasu.' });
            }
        }
    },

    // --- AKCJA 4: PRZEŁĄCZANIE ZADAŃ (PRZEPISANA) ---
    handleSwitchTask: async (taskId: string) => {
        console.log(`[Store handleSwitchTask v3] Start dla taska: ${taskId}`);
        let location = null;
        try {
            if (Capacitor.isNativePlatform()) {
                const coordinates = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
                location = { latitude: coordinates.coords.latitude, longitude: coordinates.coords.longitude };
            }
        } catch (e: unknown) { console.warn("[Store handleSwitchTask v3] Błąd GPS:", e); }

        try {
            console.log('[Store handleSwitchTask v3] Wysyłam do API...');
            const response = await api.post('/time-entries/switch-task', { taskId, location });
            const newEntry = response.data.newEntry ? { ...response.data.newEntry } : null;
            set({ activeEntry: newEntry }); // Ustawiamy stan bezpośrednio
            toast.success('Rozpoczęto nowe zlecenie!');
        } catch (error: unknown) {
            console.error('[Store handleSwitchTask v3] Błąd API:', error);
            const axiosError = error as AxiosError;
            const errorMessage = (axiosError.response?.data as { message: string })?.message;
            toast.error('Błąd', { description: errorMessage || 'Nie udało się rozpocząć zlecenia.' });
        }
    },
}));