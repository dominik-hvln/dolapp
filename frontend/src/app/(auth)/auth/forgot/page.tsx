'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const API = process.env.NEXT_PUBLIC_API_URL!; // np. https://aplikacja-czasu-pracy-backend.onrender.com

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [err, setErr] = useState<string>('');

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErr('');
        setSubmitting(true);
        try {
            await fetch(`${API}/auth/forgot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            setDone(true); // zawsze sukces (bez ujawniania, czy email istnieje)
        } catch (e) {
            setErr('Wystąpił błąd. Spróbuj ponownie później.');
        } finally {
            setSubmitting(false);
        }
    };

    if (done) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card className="w-full max-w-sm">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Sprawdź skrzynkę 📧</CardTitle>
                        <CardDescription>
                            Jeśli konto istnieje, wysłaliśmy e-mail z instrukcją resetu hasła.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Reset hasła</CardTitle>
                    <CardDescription>Podaj adres e-mail powiązany z kontem.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">E-mail</Label>
                            <Input
                                id="email"
                                type="email"
                                required
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        {err && <p className="text-sm text-red-500">{err}</p>}
                        <Button type="submit" className="w-full" disabled={submitting}>
                            {submitting ? 'Wysyłanie…' : 'Wyślij instrukcje'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
