'use client';

import { ActivityFeed } from '@/components/dashboard/ActivityFeed';

export default function ActivityPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Aktywność w Firmie</h1>
            <p className="text-muted-foreground mb-6">
                Zobacz na żywo, co dzieje się w Twojej firmie. Lista odświeża się automatycznie.
            </p>
            <ActivityFeed />
        </div>
    );
}