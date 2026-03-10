'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function RegulaminPage() {
    const router = useRouter();

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <Card className="w-full max-w-4xl glassmorphism-box">
                <CardHeader className="flex flex-row items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <CardTitle className="text-2xl">Regulamin korzystania z systemu Dolapp</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none">
                    <h2>1. Informacje ogólne</h2>
                    <p>
                        Niniejszy Regulamin określa zasady korzystania z systemu Dolapp – aplikacji webowej i mobilnej
                        typu SaaS służącej do ewidencji i rozliczania czasu pracy oraz powiązanych procesów kadrowych
                        w firmach (B2B).
                    </p>
                    <p>
                        Właścicielem i operatorem systemu jest: <strong>Appity Mikołaj Lubawy</strong> ul. Ogrodnicza 13 62-006
                        Janikowo, NIP 7781463016, REGON 540670410 zwany dalej „Usługodawca”.
                    </p>
                    <p>
                        Klientem systemu jest przedsiębiorca (firma), który udostępnia Dolapp swoim pracownikom lub
                        współpracownikom w celu rejestrowania czasu pracy i korzystania z funkcji systemu, dalej: „Klient”.
                    </p>

                    <h2>2. Definicje</h2>
                    <ul>
                        <li><strong>Dolapp / System</strong> – aplikacja webowa i mobilna udostępniana w modelu SaaS.</li>
                        <li><strong>Klient</strong> – podmiot gospodarczy (B2B), który zawiera umowę subskrypcyjną i zarządza dostępami.</li>
                        <li><strong>Użytkownik</strong> – osoba fizyczna (np. pracownik Klienta) korzystająca z Systemu na podstawie uprawnień nadanych przez Klienta.</li>
                        <li><strong>Konto</strong> – konto Klienta lub Użytkownika w Systemie.</li>
                        <li><strong>Subskrypcja / Abonament</strong> – odpłatny dostęp do Systemu na czas określony (miesiąc/rok) zgodnie z wybranym planem.</li>
                        <li><strong>Zasoby</strong> – zawartość i funkcjonalności serwisu (Systemu) dostępne pod adresem systemowym.</li>
                    </ul>

                    <h2>3. Zakres usług</h2>
                    <p>System Dolapp umożliwia w szczególności:</p>
                    <ul>
                        <li>rejestrację czasu pracy (start/stop), w tym w terenie i w biurze,</li>
                        <li>rejestrację lokalizacji (np. geofencing) – jeśli Klient włączy taką funkcję,</li>
                        <li>rejestrację zdarzeń w oparciu o aplikację mobilną i kody QR,</li>
                        <li>zarządzanie zleceniami i zadaniami,</li>
                        <li>obsługę urlopów, nieobecności, nadgodzin (zgłoszenia/akceptacje), <em>[w trakcie wdrożenia]</em></li>
                        <li>generowanie raportów i dokumentów oraz eksport danych (np. CSV, XLS, PDF, JSON).</li>
                    </ul>
                    <p>Zakres funkcjonalności może zależeć od wybranego planu subskrypcyjnego oraz ustawień Klienta.</p>

                    <h2>4. Wymagania techniczne i przerwy</h2>
                    <p>1. Do korzystania z Zasobów na urządzeniach końcowych niezbędne jest:</p>
                    <ul>
                        <li>podłączenie urządzenia do sieci internet,</li>
                        <li>aktywne konto poczty elektronicznej (e-mail),</li>
                        <li>system operacyjny: Windows 7+, Mac OS X 10.7+, Android 5.1+ lub iOS 9.3+,</li>
                        <li>przeglądarka z obsługą HTML5 i JavaScript oraz włączona obsługa plików cookies.</li>
                    </ul>
                    <p>2. Usługodawca zastrzega sobie prawo do przerw technicznych w celu modernizacji lub konserwacji urządzeń oraz przerw spowodowanych siłą wyższą.</p>
                    <p>3. Majątkowe prawa autorskie do Zasobów należą do Usługodawcy i podlegają ochronie prawnej.</p>
                    <p>4. Użytkownik nie może udostępniać swojego hasła osobom trzecim.</p>
                    <p>5. Usługodawca nie ponosi odpowiedzialności za problemy wynikające z przyczyn leżących po stronie Użytkownika, błędne działanie łącza internetowego lub skutki siły wyższej.</p>

                    <h2>5. Zawarcie umowy i dostęp do Systemu</h2>
                    <p>Umowa zostaje zawarta z chwilą rejestracji Konta Klienta, akceptacji Regulaminu i opłacenia Subskrypcji.</p>
                    <p>Klient jest odpowiedzialny za tworzenie kont Użytkowników, nadawanie ról oraz aktualność wprowadzanych danych.</p>
                    <p>Użytkownicy logują się do Systemu w celu ewidencji czasu pracy oraz korzystania z funkcji udostępnionych przez Klienta.</p>

                    <h2>6. Subskrypcja i płatności</h2>
                    <p>Korzystanie z Dolapp odbywa się wyłącznie w modelu subskrypcyjnym (brak jednorazowych opłat licencyjnych).</p>
                    <p>Opłaty naliczane są z góry za wybrany okres rozliczeniowy zgodnie z obowiązującym cennikiem.</p>
                    <p>W przypadku braku płatności, Usługodawca może ograniczyć lub zablokować dostęp do Systemu.</p>

                    <h2>7. Obowiązki Klienta i Użytkowników</h2>
                    <p>Klient zobowiązuje się korzystać z Systemu zgodnie z prawem oraz poinformować pracowników o zasadach przetwarzania ich danych (w tym lokalizacyjnych).</p>
                    <p>Użytkownik zobowiązuje się do rzetelnego raportowania pracy i ochrony swoich danych dostępowych.</p>

                    <h2>8. Odpowiedzialność</h2>
                    <p>Usługodawca nie odpowiada za sposób wykorzystania Systemu przez Klienta, w szczególności za decyzje kadrowe i rozliczeniowe podejmowane na podstawie wygenerowanych danych.</p>
                    <p>Klient ponosi pełną odpowiedzialność za działania swoich Użytkowników wewnątrz Systemu.</p>

                    <h2>9. Reklamacje i wsparcie</h2>
                    <p>Zgłoszenia oraz reklamacje należy kierować na adres e-mail: <strong>kontakt@dolapp.pl</strong>.</p>
                    <p>Usługodawca rozpatruje reklamacje w terminie 14 dni roboczych.</p>

                    <h2>10. Wypowiedzenie i zakończenie korzystania</h2>
                    <p>Klient może zrezygnować z Subskrypcji w dowolnym momencie. Umowa wygasa z końcem opłaconego okresu.</p>
                    <p>Po zakończeniu subskrypcji dane są przechowywane przez okres retencji (np. 30 dni), po czym zostają trwale usunięte.</p>

                    <h2>11. Postanowienia końcowe</h2>
                    <p>Regulamin podlega prawu polskiemu. Usługodawca zastrzega sobie prawo do zmian w Regulaminie z ważnych przyczyn, o czym poinformuje z min. 7-dniowym wyprzedzeniem.</p>
                </CardContent>
            </Card>
        </div>
    );
}
