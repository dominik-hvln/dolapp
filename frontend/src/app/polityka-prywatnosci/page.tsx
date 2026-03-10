'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function PolitykaPrywatnosciPage() {
    const router = useRouter();

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <Card className="w-full max-w-4xl glassmorphism-box">
                <CardHeader className="flex flex-row items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <CardTitle className="text-2xl">Polityka prywatności (RODO) systemu Dolapp</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none">
                    <p className="text-muted-foreground italic mb-6">
                        Model współpracy: Klient jako Administrator danych, Dolapp jako Podmiot Przetwarzający
                    </p>

                    <h2>1. Role w przetwarzaniu danych</h2>
                    <p>
                        W zakresie danych osobowych pracowników i innych Użytkowników wprowadzanych do Systemu,
                        <strong> Klient (firma) jest Administratorem danych osobowych</strong>, a Usługodawca (Dolapp) działa jako
                        <strong> Podmiot Przetwarzający (procesor)</strong> na podstawie art. 28 RODO.
                    </p>
                    <p>
                        W zakresie danych kontaktowych osób reprezentujących Klienta (np. administrator konta, osoba do kontaktu),
                        Usługodawca może występować jako samodzielny Administrator danych.
                    </p>

                    <h2>2. Jakie dane mogą być przetwarzane w Systemie</h2>
                    <p>W zależności od konfiguracji wybranej przez Klienta, w Systemie mogą być przetwarzane m.in.:</p>
                    <ul>
                        <li><strong>Dane identyfikacyjne:</strong> imię, nazwisko, identyfikator pracowniczy, e-mail służbowy.</li>
                        <li><strong>Ewidencja czasu pracy:</strong> godziny start/stop, przerwy, nadgodziny, grafiki.</li>
                        <li><strong>Nieobecności:</strong> wnioski urlopowe, statusy akceptacji, rodzaje absencji.</li>
                        <li><strong>Dane lokalizacyjne:</strong> związane z rejestracją czasu pracy (tylko jeśli funkcja jest włączona).</li>
                        <li><strong>Dane techniczne:</strong> logi dostępu, identyfikatory sesji (niezbędne dla bezpieczeństwa usługi).</li>
                    </ul>

                    <h2>3. Cele przetwarzania</h2>
                    <p>Dane są przetwarzane w szczególności w celu:</p>
                    <ul>
                        <li>świadczenia usługi Dolapp (ewidencja czasu pracy, obsługa urlopów, raportowanie),</li>
                        <li>zapewnienia bezpieczeństwa Systemu oraz zapobiegania nadużyciom,</li>
                        <li>obsługi zgłoszeń i wsparcia technicznego dla Użytkowników,</li>
                        <li>rozliczeń i fakturowania pomiędzy Usługodawcą a Klientem.</li>
                    </ul>

                    <h2>4. Podstawa prawna i odpowiedzialność Klienta</h2>
                    <p>
                        Klient jako Administrator danych odpowiada za zapewnienie podstawy prawnej przetwarzania danych Użytkowników,
                        spełnienie obowiązku informacyjnego oraz realizację praw osób, których dane dotyczą.
                    </p>
                    <p>
                        Usługodawca przetwarza dane <strong>wyłącznie na polecenie Klienta</strong>, w zakresie niezbędnym do świadczenia
                        usługi, zgodnie z zawartą umową powierzenia przetwarzania danych.
                    </p>

                    <h2>5. Odbiorcy danych i podwykonawcy</h2>
                    <p>
                        Dane mogą być powierzane podwykonawcom Usługodawcy (np. dostawcy hostingu, infrastruktury chmurowej, usług e-mail)
                        wyłącznie na podstawie odpowiednich umów powierzenia.
                    </p>
                    <blockquote>
                        Ważne: Dane nie są sprzedawane ani wykorzystywane do celów marketingowych w odniesieniu do Użytkowników Klienta.
                    </blockquote>

                    <h2>6. Bezpieczeństwo</h2>
                    <p>Usługodawca stosuje adekwatne środki techniczne i organizacyjne w celu ochrony danych, w tym:</p>
                    <ul>
                        <li>szyfrowanie transmisji danych (SSL/TLS),</li>
                        <li>restrykcyjną kontrolę dostępu i systemy uwierzytelniania,</li>
                        <li>regularne wykonywanie kopii zapasowych,</li>
                        <li>ciągły monitoring bezpieczeństwa infrastruktury.</li>
                    </ul>

                    <h2>7. Okres przechowywania danych</h2>
                    <p>
                        Dane Użytkowników są przechowywane przez czas trwania umowy z Klientem. Po jej zakończeniu dane mogą zostać
                        wyeksportowane przez Klienta, a następnie są <strong>trwale usuwane po okresie retencji (np. 30 dni)</strong>.
                    </p>
                    <p>
                        Dane rozliczeniowe (np. faktury) są przechowywane zgodnie z wymogami przepisów podatkowych i rachunkowych.
                    </p>

                    <h2>8. Prawa osób, których dane dotyczą</h2>
                    <p>
                        Wnioski Użytkowników dotyczące realizacji praw RODO (dostęp, sprostowanie, usunięcie) powinny być kierowane
                        bezpośrednio do <strong>Klienta jako Administratora danych</strong>.
                    </p>
                    <p>
                        Usługodawca aktywnie wspiera Klienta w realizacji tych wniosków w zakresie przewidzianym przez prawo i umowę powierzenia.
                    </p>

                    <h2>9. Kontakt</h2>
                    <p>Wszelkie zapytania dotyczące ochrony danych osobowych prosimy kierować na:</p>
                    <ul>
                        <li>E-mail: <strong>rodo@dolapp.pl</strong> lub <strong>kontakt@dolapp.pl</strong></li>
                    </ul>
                    <p>W przypadku pytań bezpośrednich od pracowników, zalecamy w pierwszej kolejności kontakt z wewnętrznym działem HR Klienta.</p>
                </CardContent>
            </Card>
        </div>
    );
}
