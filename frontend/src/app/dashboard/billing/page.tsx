'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { stripeApi, superAdminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Check, Loader2, CreditCard, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function SubscriptionPage() {
    const { user } = useAuthStore();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    // Data
    const [subscription, setSubscription] = useState<any>(null);
    const [plans, setPlans] = useState<any[]>([]);

    // UI State
    const [isYearly, setIsYearly] = useState(false);

    useEffect(() => {
        if (user && user.role !== 'admin') {
            toast.error('Brak uprawnień. Sekcja dostępna tylko dla administratorów firmy.');
            router.push('/dashboard');
            return;
        }
        fetchData();
    }, [user, router]);

    const fetchData = async () => {
        try {
            // Check for success verification first
            const searchParams = new URLSearchParams(window.location.search);
            const success = searchParams.get('success');
            const sessionId = searchParams.get('session_id');

            if (success && sessionId) {
                toast.info('Weryfikacja płatności...');
                try {
                    await stripeApi.verifySession(sessionId);

                    // ✅ Odśwież profil użytkownika (moduły!)
                    await useAuthStore.getState().refreshSession();

                    toast.success('Płatność potwierdzona! Odświeżam dane...');
                    // Clear URL
                    window.history.replaceState({}, '', '/dashboard/billing');
                } catch (e: any) {
                    console.error(e);
                    const msg = e.response?.data?.message || e.message || 'Błąd weryfikacji';
                    toast.warning(`Błąd weryfikacji: ${msg}`);
                }
            }

            const [subData, plansData] = await Promise.all([
                stripeApi.getSubscription(),
                stripeApi.getPlans()
            ]);
            setSubscription(subData);
            setPlans(plansData);
        } catch (error) {
            console.error(error);
            toast.error('Nie udało się pobrać danych subskrypcji');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckout = async (plan: any) => {
        // @ts-ignore
        if (!user?.company_id) return;
        setProcessing(true);
        try {
            const priceId = isYearly ? plan.stripe_price_id_yearly : plan.stripe_price_id_monthly;

            if (!priceId) {
                toast.error('Ten plan nie ma skonfigurowanej ceny dla wybranego okresu.');
                return;
            }

            const { url } = await stripeApi.createCheckoutSession({
                companyId: user.company_id!,
                planId: plan.id,
                priceId: priceId,
                successUrl: window.location.href + '?success=true&session_id={CHECKOUT_SESSION_ID}',
                cancelUrl: window.location.href + '?canceled=true'
            });

            if (url) {
                window.location.href = url;
            }
        } catch (error) {
            console.error(error);
            toast.error('Błąd inicjalizacji płatności');
            setProcessing(false);
        }
    };

    const handlePortal = async () => {
        setProcessing(true);
        try {
            const { url } = await stripeApi.createPortalSession(window.location.href);
            if (url) {
                window.location.href = url;
            }
        } catch (error) {
            console.error(error);
            toast.error('Błąd otwierania panelu klienta');
            setProcessing(false);
        }
    };

    if (loading) {
        return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    const currentPlanId = subscription?.plan?.id;
    const isTrialing = subscription?.status === 'trialing';
    const isActive = subscription?.status === 'active';

    return (
        <div className="container py-10 max-w-5xl">
            <div className="mb-10 text-center">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Twoja Subskrypcja</h1>
                <p className="text-muted-foreground">Zarządzaj swoim planem i płatnościami</p>
            </div>

            {/* STATUS SEKCYJA */}
            <div className="mb-12">
                <Card className="border-l-4 border-l-primary">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Obecny Status</span>
                            {isActive ? (
                                <Badge className="bg-green-600 hover:bg-green-700">Aktywna</Badge>
                            ) : isTrialing ? (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-700">Okres Próbny</Badge>
                            ) : (
                                <Badge variant="destructive">Nieaktywna</Badge>
                            )}
                        </CardTitle>
                        <CardDescription>
                            {subscription?.plan ? `Korzystasz z planu: ${subscription.plan.name}` : 'Brak aktywnego planu'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-2">
                            {subscription?.current_period_end && (
                                <p className="text-sm">
                                    Data odnowienia/wygaśnięcia: <strong>{new Date(subscription.current_period_end).toLocaleDateString()}</strong>
                                </p>
                            )}
                            <p className="text-sm text-gray-500">
                                Wszystkie faktury i metody płatności znajdziesz w panelu klienta Stripe.
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handlePortal} variant="outline" disabled={processing} className="w-full sm:w-auto">
                            <CreditCard className="mr-2 h-4 w-4" />
                            Zarządzaj subskrypcją i fakturami
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            {/* PRZEŁĄCZNIK MIESIĄC / ROK */}
            <div className="flex justify-center items-center space-x-4 mb-8">
                <Label htmlFor="billing-mode" className={`cursor-pointer ${!isYearly ? 'font-bold' : ''}`}>Miesięcznie</Label>
                <Switch id="billing-mode" checked={isYearly} onCheckedChange={setIsYearly} />
                <Label htmlFor="billing-mode" className={`cursor-pointer ${isYearly ? 'font-bold' : ''}`}>
                    Rocznie <span className="text-xs text-green-600 font-normal ml-1">(-20% zazwyczaj)</span>
                </Label>
            </div>

            {/* LISTA PLANÓW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => {
                    const price = isYearly ? plan.price_yearly : plan.price_monthly;
                    const isCurrent = plan.id === currentPlanId;

                    return (
                        <Card key={plan.id} className={`flex flex-col ${isCurrent ? 'ring-2 ring-primary shadow-lg' : ''}`}>
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center">
                                    {plan.name}
                                    {isCurrent && <Badge>Obecny</Badge>}
                                </CardTitle>
                                <div className="mt-4">
                                    <span className="text-3xl font-bold">{price} PLN</span>
                                    <span className="text-muted-foreground"> / {isYearly ? 'rok' : 'mc'}</span>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <ul className="space-y-2 mt-4 text-sm">
                                    {(plan.limits ? Object.entries(plan.limits) : []).map(([key, val]) => (
                                        <li key={key} className="flex items-center">
                                            <Check className="h-4 w-4 mr-2 text-green-500" />
                                            {key}: <strong>{val === -1 ? 'Bez limitu' : String(val)}</strong>
                                        </li>
                                    ))}
                                    {/* Default features placeholder */}
                                    <li className="flex items-center">
                                        <Check className="h-4 w-4 mr-2 text-green-500" />
                                        Dostęp do podstawowych funkcji
                                    </li>
                                    <li className="flex items-center">
                                        <Check className="h-4 w-4 mr-2 text-green-500" />
                                        Wsparcie techniczne
                                    </li>
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    onClick={() => handleCheckout(plan)}
                                    className="w-full"
                                    variant={isCurrent ? "outline" : "default"}
                                    disabled={processing || isCurrent}
                                >
                                    {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                                        isCurrent ? 'Twój obecny plan' : 'Wybierz ten plan'
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
