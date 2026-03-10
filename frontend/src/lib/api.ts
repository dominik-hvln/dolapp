import axios, { AxiosError } from 'axios';
import { useAuthStore } from '../store/auth.store';
import { toast } from 'sonner';

// Odczytujemy zmienne środowiskowe
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY;

export const api = axios.create({
    baseURL: API_URL,
});

// Interceptor ŻĄDANIA (Request) - dołącza token
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor ODPOWIEDZI (Response) - obsługuje wygaśnięcie sesji
api.interceptors.response.use(
    (response) => {
        // Jeśli odpowiedź jest poprawna, po prostu ją zwróć
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config;

        // @ts-expect-error _retry to niestandardowa właściwość
        if (error.response?.status === 401 && !originalRequest._retry) {
            // @ts-expect-error _retry to niestandardowa właściwość
            originalRequest._retry = true; // Oznaczamy żądanie jako ponawiane
            console.log('Access token wygasł. Próbuję odświeżyć...');

            const { refreshToken, setSession } = useAuthStore.getState();

            if (!refreshToken || !SUPABASE_URL || !SUPABASE_KEY) {
                console.log('Brak refresh tokenu lub konfiguracji Supabase. Wylogowuję.');
                useAuthStore.getState().logout();
                window.location.href = '/'; // Twarde przekierowanie
                return Promise.reject(error);
            }

            try {
                // 1. Spróbuj uzyskać nowy token od Supabase
                const { data } = await axios.post(
                    `${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
                    { refresh_token: refreshToken },
                    { headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' } }
                );

                const { access_token, refresh_token: newRefreshToken } = data;

                const oldUser = useAuthStore.getState().user;
                if (oldUser) {
                    setSession(access_token, newRefreshToken, oldUser);
                } else {
                    throw new Error('Brak danych starego użytkownika podczas odświeżania sesji.');
                }

                console.log('Token odświeżony. Ponawiam oryginalne żądanie...');

                // 3. Zaktualizuj nagłówek i ponów oryginalne żądanie
                if (originalRequest) {
                    originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // 4. Jeśli odświeżenie się nie uda
                console.error('Nie udało się odświeżyć tokenu. Wylogowuję.', refreshError);

                // Najpierw wyczyść stan w store
                useAuthStore.getState().logout();
                window.location.href = '/login';

                toast.error('Sesja wygasła', { description: 'Proszę zalogować się ponownie.' });
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// --- SUPER ADMIN API ---
export const superAdminApi = {
    // FIRMY
    getCompanies: async () => {
        const { data } = await api.get('/super-admin/companies');
        return data;
    },
    getStats: async () => {
        const { data } = await api.get('/super-admin/stats');
        return data;
    },
    getCompany: async (id: string) => {
        const { data } = await api.get(`/super-admin/companies/${id}`);
        return data;
    },
    createCompany: async (dto: { name: string }) => {
        const { data } = await api.post('/super-admin/companies', dto);
        return data;
    },
    // UŻYTKOWNICY
    getUsers: async () => {
        const { data } = await api.get('/super-admin/users');
        return data;
    },
    createUser: async (dto: any) => {
        const { data } = await api.post('/super-admin/users', dto);
        return data;
    },

    // PLANY
    getPlans: async () => {
        const { data } = await api.get('/super-admin/plans');
        return data;
    },
    createPlan: async (dto: any) => {
        const { data } = await api.post('/super-admin/plans', dto);
        return data;
    },
    updatePlan: async (id: string, dto: any) => {
        const { data } = await api.put(`/super-admin/plans/${id}`, dto);
        return data;
    },
    deletePlan: async (id: string) => {
        const { data } = await api.delete(`/super-admin/plans/${id}`);
        return data;
    },

    // MODUŁY
    getModules: async () => {
        const { data } = await api.get('/super-admin/modules');
        return data;
    },
    createModule: async (dto: any) => {
        const { data } = await api.post('/super-admin/modules', dto);
        return data;
    },
    updateModule: async (code: string, dto: any) => {
        const { data } = await api.put(`/super-admin/modules/${code}`, dto);
        return data;
    },
    deleteModule: async (code: string) => {
        const { data } = await api.delete(`/super-admin/modules/${code}`);
        return data;
    },

    // PLAN MODULES
    getPlanModules: async (planId: string) => {
        const { data } = await api.get(`/super-admin/plans/${planId}/modules`);
        return data;
    },
    setPlanModules: async (planId: string, moduleCodes: string[]) => {
        const { data } = await api.put(`/super-admin/plans/${planId}/modules`, { moduleCodes });
        return data;
    },

    // ZARZĄDZANIE SUBSKRYPCJAMI
    assignPlan: async (companyId: string, planId: string) => {
        const { data } = await api.post(`/super-admin/companies/${companyId}/plan`, { planId });
        return data;
    },
    toggleModule: async (companyId: string, moduleCode: string, isEnabled: boolean) => {
        const { data } = await api.post(`/super-admin/companies/${companyId}/module`, { moduleCode, isEnabled });
        return data;
    },
};

// --- STRIPE & SUBSCRIPTIONS ---
export const stripeApi = {
    getPlans: async () => {
        const { data } = await api.get('/stripe/plans');
        return data;
    },
    getSubscription: async () => {
        const { data } = await api.get('/stripe/subscription');
        return data;
    },
    createCheckoutSession: async (dto: { priceId: string, companyId: string, planId: string, successUrl: string, cancelUrl: string }) => {
        const { data } = await api.post('/stripe/checkout', dto);
        return data;
    },
    createPortalSession: async (returnUrl: string) => {
        const { data } = await api.post('/stripe/portal', { returnUrl });
        return data;
    },
    verifySession: async (sessionId: string) => {
        const { data } = await api.post('/stripe/verify-session', { sessionId });
        return data;
    },
};