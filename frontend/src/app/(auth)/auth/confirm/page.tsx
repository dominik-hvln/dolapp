import { Suspense } from 'react';
import ConfirmEmailContent from './confirm-client';

export const dynamic = 'force-dynamic';

export default function ConfirmEmailPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-muted-foreground">Ładowanie…</p>
            </div>
        }>
            <ConfirmEmailContent />
        </Suspense>
    );
}
