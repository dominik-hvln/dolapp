import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { toast } from 'sonner';
import { Preferences } from '@capacitor/preferences';

export interface CompanyContext {
    id: string;
    name: string;
}

interface CompanyContextState {
    activeCompany: CompanyContext | null;
    isHydrating: boolean;
    enterCompany: (company: CompanyContext) => void;
    exitCompany: () => void;
}

const storage = {
    getItem: async (name: string) => (await Preferences.get({ key: name })).value,
    setItem: async (name: string, value: string) => { await Preferences.set({ key: name, value }); },
    removeItem: async (name: string) => { await Preferences.remove({ key: name }); },
};

export const useCompanyContextStore = create<CompanyContextState>()(
    persist(
        (set) => ({
            activeCompany: null,
            isHydrating: true,
            enterCompany: (company) => set({ activeCompany: company }),
            exitCompany: () => set({ activeCompany: null }),
        }),
        {
            name: 'company-context-storage',
            skipHydration: typeof window === 'undefined',
            storage: createJSONStorage(() => storage),
            partialize: (state) => ({ activeCompany: state.activeCompany }),
            onRehydrateStorage: () => (_state, error) => {
                if (error) toast.error('Nie udało się wczytać kontekstu podmiotu.');
                useCompanyContextStore.setState({ isHydrating: false });
            },
        },
    ),
);
