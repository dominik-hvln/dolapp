'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AxiosError } from 'axios';
import { Capacitor } from '@capacitor/core';

export default function RegisterPage() {
    const router = useRouter();

    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
            router.replace('/');
        }
    }, [router]);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [companyName, setCompanyName] = useState('');

    // ✅ NOWY STAN: Przełączanie widoku po sukcesie
    const [isSuccess, setIsSuccess] = useState(false);

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (password.length < 8) {
            setError('Hasło musi mieć co najmniej 8 znaków.');
            return;
        }
        setError('');
        setIsLoading(true);

        try {
            await api.post('/auth/register', {
                email,
                password,
                firstName,
                lastName,
                companyName,
            });

            // ✅ SUKCES: Pokaż widok "Sprawdź e-mail"
            setIsSuccess(true);

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

    // --- Widok po udanej rejestracji ---
    if (isSuccess) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <Card className="w-full max-w-sm">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Rejestracja udana!</CardTitle>
                        <CardDescription>
                            Wysłaliśmy link aktywacyjny na Twój adres e-mail.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-center text-muted-foreground">
                            Proszę, kliknij link w wiadomości, aby aktywować swoje konto. (Sprawdź folder spam!)
                        </p>
                        <Button asChild className="w-full mt-6">
                            <Link href="/">Wróć do logowania</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // --- Domyślny formularz rejestracji ---
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Stwórz konto</CardTitle>
                    <CardDescription>Rozpocznij darmowy okres próbny.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="companyName">Nazwa firmy</Label>
                                <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="firstName">Imię</Label>
                                    <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="lastName">Nazwisko</Label>
                                    <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Adres e-mail</Label>
                                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Hasło (min. 8 znaków)</Label>
                                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                            </div>
                            <Button type="submit" disabled={isLoading} className="w-full">
                                {isLoading ? 'Tworzenie konta...' : 'Zarejestruj się'}
                            </Button>
                            {error && <p className="text-sm font-medium text-destructive text-center">{error}</p>}
                        </div>
                    </form>
                    <div className="mt-4 text-center text-sm">
                        Masz już konto?{' '}
                        <Link href="/" className="underline">
                            Zaloguj się
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}