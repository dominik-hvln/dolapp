'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { Fingerprint } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import { Preferences } from '@capacitor/preferences';

/** ─────────────────────────────────────────────────────────
 *  Klucze legacy (Twoje dotychczasowe, globalne):
 *  - BIO_AUTH_EMAIL_KEY        -> email
 *  - BIO_AUTH_PASSWORD_KEY     -> password
 *  - BIO_AUTH_DECLINED_KEY     -> 'true' jeśli user odrzucił
 *  Pozostawiamy je dla kompatybilności i migrujemy do trybu per-email.
 *  ───────────────────────────────────────────────────────── */
const BIO_AUTH_EMAIL_KEY = 'bio_auth_email';
const BIO_AUTH_PASSWORD_KEY = 'bio_auth_password';
const BIO_AUTH_DECLINED_KEY = 'bio_auth_declined';

/** Nowe, bezpieczniejsze klucze per-email + wskaźnik ostatnio użytego maila */
const BIO_LAST_EMAIL_KEY = 'bio_auth:last_email';
const bioKeys = (email: string) => ({
    enrolled: `bio_auth:enrolled:${email}`,   // '1' gdy zapisano dane dla tego maila
    declined: `bio_auth:declined:${email}`,   // '1' gdy odmówił — nie pytamy ponownie
    pass: `bio_auth:password:${email}`,   // hasło dla tego maila (jak dotąd: w Preferences)
});

/** Migracja ze starych globalnych kluczy do nowych per-email (tylko jeśli pasujący e-mail) */
async function migrateLegacyIfNeeded(currentEmail: string) {
    const [legacyEmail, legacyPass, legacyDeclined] = await Promise.all([
        Preferences.get({ key: BIO_AUTH_EMAIL_KEY }),
        Preferences.get({ key: BIO_AUTH_PASSWORD_KEY }),
        Preferences.get({ key: BIO_AUTH_DECLINED_KEY }),
    ]);

    if (legacyEmail.value && legacyEmail.value === currentEmail) {
        const k = bioKeys(currentEmail);
        const enrolled = (await Preferences.get({ key: k.enrolled })).value;

        // Jeśli nie było jeszcze per-email, przepisz wartość legacy
        if (!enrolled && legacyPass.value) {
            await Preferences.set({ key: k.pass, value: legacyPass.value });
            await Preferences.set({ key: k.enrolled, value: '1' });
            await Preferences.set({ key: BIO_LAST_EMAIL_KEY, value: currentEmail });
        }
        if (legacyDeclined.value === 'true') {
            await Preferences.set({ key: k.declined, value: '1' });
        }

        // (opcjonalnie) posprzątaj stare globalne klucze
        // await Preferences.remove({ key: BIO_AUTH_EMAIL_KEY });
        // await Preferences.remove({ key: BIO_AUTH_PASSWORD_KEY });
        // await Preferences.remove({ key: BIO_AUTH_DECLINED_KEY });
    }
}

export default function LoginPage() {
    const router = useRouter();
    const { setSession, isAuthenticated, isHydrating } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [canUseBiometrics, setCanUseBiometrics] = useState(false);
    const [isNative, setIsNative] = useState(false);

    useEffect(() => {
        const checkPlatform = async () => {
            const native = Capacitor.isNativePlatform();
            setIsNative(native);
            if (native) {
                const { isAvailable } = await NativeBiometric.isAvailable().catch(() => ({ isAvailable: false }));
                setCanUseBiometrics(!!isAvailable);
            }
        };

        if (isHydrating) return;
        if (isAuthenticated) {
            router.push('/dashboard/');
            return;
        }
        checkPlatform();
    }, [isHydrating, isAuthenticated, router]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await api.post('/auth/login', { email, password });
            const { session, profile } = response.data;
            if (!session || !profile) {
                throw new Error('Nieprawidłowa odpowiedź serwera.');
            }

            setSession(session.access_token, session.refresh_token, profile);

            // 🔁 Migracja z legacy (jeśli kiedyś zapisano globalne klucze)
            await migrateLegacyIfNeeded(email);

            // ✅ Jednorazowe pytanie per-email (z pamiętaniem decyzji)
            if (isNative && canUseBiometrics) {
                const k = bioKeys(email);
                const [enrolled, declined] = await Promise.all([
                    Preferences.get({ key: k.enrolled }),
                    Preferences.get({ key: k.declined }),
                ]);

                // Jeżeli już zapisane albo wcześniej odrzucono — NIE pytamy
                if (enrolled.value === '1' || declined.value === '1') {
                    // jeśli zapisane, zaktualizuj hasło (gdyby się zmieniło)
                    if (enrolled.value === '1') {
                        await Preferences.set({ key: k.pass, value: password });
                        await Preferences.set({ key: BIO_LAST_EMAIL_KEY, value: email });
                    }
                } else {
                    const wantsSave = window.confirm(
                        'Czy chcesz zapisać te dane logowania, aby używać biometrii do autouzupełniania w przyszłości?'
                    );
                    if (wantsSave) {
                        await Preferences.set({ key: k.pass, value: password });
                        await Preferences.set({ key: k.enrolled, value: '1' });
                        await Preferences.set({ key: BIO_LAST_EMAIL_KEY, value: email });
                        toast.success('Dane do biometrii zapisane!');
                    } else {
                        await Preferences.set({ key: k.declined, value: '1' });
                    }
                }
            }

            router.push('/dashboard/');
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                setError(err.response?.data?.message || 'Wystąpił nieoczekiwany błąd.');
            } else {
                const errorMessage = err instanceof Error ? err.message : 'Wystąpił nieznany błąd.';
                setError(errorMessage);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleBiometricAutofill = async () => {
        if (!isNative) return;
        setIsLoading(true);
        try {
            await NativeBiometric.verifyIdentity({
                reason: 'Użyj biometrii, aby uzupełnić dane logowania',
                title: 'Weryfikacja tożsamości',
            });

            // najpierw zajrzyj do nowego trybu per-email
            const lastEmail = (await Preferences.get({ key: BIO_LAST_EMAIL_KEY })).value;
            if (lastEmail) {
                const pass = (await Preferences.get({ key: bioKeys(lastEmail).pass })).value;
                if (pass) {
                    setEmail(lastEmail);
                    setPassword(pass);
                    toast.success("Dane uzupełnione. Kliknij 'Zaloguj się'.");
                    setIsLoading(false);
                    return;
                }
            }

            // fallback: legacy klucze globalne
            const [emailResult, passwordResult] = await Promise.all([
                Preferences.get({ key: BIO_AUTH_EMAIL_KEY }),
                Preferences.get({ key: BIO_AUTH_PASSWORD_KEY }),
            ]);

            if (!emailResult.value || !passwordResult.value) {
                toast.error('Brak zapisanych danych do autouzupełnienia.');
                setIsLoading(false);
                return;
            }

            setEmail(emailResult.value);
            setPassword(passwordResult.value);
            toast.success("Dane uzupełnione. Kliknij 'Zaloguj się'.");
        } catch (e: unknown) {
            console.error(e);
            const errorMessage = e instanceof Error ? e.message : 'Błąd biometrii';
            if (
                !errorMessage.toLowerCase().includes('canceled') &&
                !errorMessage.toLowerCase().includes('user interaction failed')
            ) {
                toast.error('Logowanie biometryczne nie powiodło się.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (isHydrating) {
        return <div className="flex items-center justify-center min-h-screen bg-gray-100">Ładowanie sesji...</div>;
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Zaloguj się</CardTitle>
                    <CardDescription>Witaj! Podaj swoje dane.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Adres e-mail</Label>
                                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Hasło</Label>
                                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                            </div>
                            <Button type="submit" disabled={isLoading} className="w-full">
                                {isLoading ? 'Logowanie...' : 'Zaloguj się'}
                            </Button>
                            {error && <p className="text-sm font-medium text-destructive text-center">{error}</p>}
                        </div>
                    </form>

                    {isNative && canUseBiometrics && (
                        <>
                            <div className="relative my-4">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">Lub</span>
                                </div>
                            </div>
                            <Button variant="outline" onClick={handleBiometricAutofill} disabled={isLoading} className="w-full">
                                <Fingerprint className="mr-2 h-4 w-4" />
                                Autouzupełnij biometrią
                            </Button>
                        </>
                    )}

                    {!isNative && (
                        <div className="mt-4 text-center text-sm">
                            Nie masz konta?{' '}
                            <Link href="/register" className="underline">
                                Zarejestruj się
                            </Link>
                        </div>
                    )}
                    <div className="mt-2 text-center text-sm text-muted-foreground">
                        Zapomniałeś hasła?{' '}
                        <a className="underline hover:no-underline" href="/auth/forgot">Zresetuj</a>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
