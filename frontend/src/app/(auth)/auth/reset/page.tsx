'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL!;

type View = 'loading' | 'form' | 'done' | 'error';

export default function ResetPasswordPage() {
    const [view, setView] = useState<View>('loading');
    const [token, setToken] = useState<string>('');
    const [pwd, setPwd] = useState('');
    const [pwd2, setPwd2] = useState('');
    const [err, setErr] = useState<string>('');

    // prosta polityka: min 8, litera i cyfra
    const validatePassword = (p: string) => /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(p);

    useEffect(() => {
        const hash = typeof window !== 'undefined' ? window.location.hash : '';
        const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
        const t = params.get('access_token') || '';
        if (t) {
            setToken(t);
            setView('form');
        } else {
            setView('error');
            setErr('Brak lub nieprawidłowy token.');
        }
    }, []);

    const extractMessage = (body: unknown): string | undefined => {
        if (typeof body === 'object' && body !== null && 'message' in body) {
            const maybe = (body as { message?: unknown }).message;
            if (typeof maybe === 'string') return maybe;
        }
        return undefined;
    };

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErr('');

        if (pwd !== pwd2) {
            setErr('Hasła nie są takie same.');
            return;
        }
        if (!validatePassword(pwd)) {
            setErr('Hasło musi mieć min. 8 znaków, literę i cyfrę.');
            return;
        }

        try {
            const res = await fetch(`${API}/auth/password/reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password: pwd }),
            });

            if (!res.ok) {
                // bez any: parsujemy do unknown i zawężamy
                const parsed: unknown = await res
                    .json()
                    .catch(async () => {
                        const txt = await res.text().catch(() => '');
                        return txt ? { message: txt } : null;
                    });

                const msg = extractMessage(parsed) ?? 'Nie udało się ustawić hasła.';
                throw new Error(msg);
            }

            setView('done');
        } catch (e) {
            setErr(e instanceof Error ? e.message : 'Nie udało się ustawić hasła.');
        }
    };

    if (view === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-muted-foreground">Weryfikuję link…</p>
            </div>
        );
    }

    if (view === 'done') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card className="w-full max-w-sm">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Hasło zmienione 🎉</CardTitle>
                        <CardDescription>Możesz zalogować się nowym hasłem.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button asChild className="w-full">
                            <Link href="/">Przejdź do logowania</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (view === 'error') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card className="w-full max-w-sm">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Link nie działa</CardTitle>
                        <CardDescription>{err || 'Token jest nieprawidłowy lub wygasł.'}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button asChild variant="secondary" className="w-full">
                            <Link href="/auth/forgot">Wyślij link ponownie</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // view === 'form'
    return (
        <div className="flex items-center justify-center min-h-screen">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Ustaw nowe hasło</CardTitle>
                    <CardDescription>Wprowadź nowe, silne hasło.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="pwd">Nowe hasło</Label>
                            <Input
                                id="pwd"
                                type="password"
                                autoComplete="new-password"
                                value={pwd}
                                onChange={(ev) => setPwd(ev.target.value)}
                                required
                                minLength={8}
                            />
                            <p className="text-xs text-muted-foreground">Min. 8 znaków, w tym litera i cyfra.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="pwd2">Powtórz hasło</Label>
                            <Input
                                id="pwd2"
                                type="password"
                                autoComplete="new-password"
                                value={pwd2}
                                onChange={(ev) => setPwd2(ev.target.value)}
                                required
                                minLength={8}
                            />
                        </div>
                        {err && <p className="text-sm text-red-500">{err}</p>}
                        <Button type="submit" className="w-full">Ustaw hasło</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
