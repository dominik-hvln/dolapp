'use client';

import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="w-full py-6 px-4 mt-auto">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
                <div>
                    &copy; {new Date().getFullYear()} Dolapp. Wszystkie prawa zastrzeżone.
                </div>
                <div className="flex gap-6">
                    <Link href="/regulamin" className="hover:text-primary transition-colors">
                        Regulamin
                    </Link>
                    <Link href="/polityka-prywatnosci" className="hover:text-primary transition-colors">
                        Polityka Prywatności
                    </Link>
                </div>
            </div>
        </footer>
    );
}
