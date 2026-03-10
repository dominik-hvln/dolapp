'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogIn, LogOut, Edit, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';

// ... Interfejsy (TimeEntryDetails, AuditDetails, ActivityEvent) bez zmian ...
// Definiujemy szczegółowe typy dla `details`
interface TimeEntryDetails {
    status: 'clock_in' | 'clock_out' | 'job_change' | 'general_clock_in' | 'general_clock_out';
    task_name: string | null;
    project_name: string | null;
}
interface AuditDetails {
    change_reason: string | null;
    target_user_id: string;
    target_user_name: string;
    new_values: { status?: 'DELETED' } | null;
}
interface ActivityEvent {
    event_type: 'time_entry' | 'audit' | 'user_created';
    event_timestamp: string;
    user_id: string;
    user_name: string;
    details: TimeEntryDetails | AuditDetails | Record<string, unknown>;
}


// Komponent Wpisu Aktywności (bez zmian)
function ActivityEventItem({ event }: { event: ActivityEvent }) {
    // ... cała logika ActivityEventItem (ikony, tytuły) bez zmian ...
    const timeAgo = formatDistanceToNow(new Date(event.event_timestamp), { addSuffix: true, locale: pl });
    let Icon = LogIn; let title = ''; let description = '';
    if (event.event_type === 'time_entry') {
        const details = event.details as TimeEntryDetails;
        if (details.status === 'clock_in' || details.status === 'job_change' || details.status === 'general_clock_in') {
            Icon = LogIn; title = `${event.user_name} rozpoczął pracę`;
            description = `Zlecenie: ${details.task_name || 'Ogólne'} (${details.project_name || '-'})`;
        } else {
            Icon = LogOut; title = `${event.user_name} zakończył pracę`;
            description = `Zlecenie: ${details.task_name || 'Ogólne'} (${details.project_name || '-'})`;
        }
    } else if (event.event_type === 'audit') {
        const details = event.details as AuditDetails;
        if (details.new_values?.status === 'DELETED') {
            Icon = Trash2; title = `${event.user_name} usunął wpis`;
            description = `Powód: ${details.change_reason || '-'}`;
        } else {
            Icon = Edit; title = `${event.user_name} edytował wpis`;
            description = `Powód: ${details.change_reason || '-'}`;
        }
    }
    const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('') : '?';
    return (
        <li className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-muted"><Icon className="h-4 w-4" /></AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <p className="text-sm font-medium">{title}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <time className="text-sm text-muted-foreground self-start">{timeAgo}</time>
        </li>
    );
}

// Główny komponent feedu (zaktualizowany)
export function ActivityFeed() {
    const [events, setEvents] = useState<ActivityEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchActivity = async () => {
        try {
            const response = await api.get('/activity/feed');
            setEvents(response.data);
        } catch (error) {
            toast.error('Błąd', { description: 'Nie udało się pobrać aktywności.' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchActivity();
        const interval = setInterval(fetchActivity, 30000);
        return () => clearInterval(interval);
    }, []);

    if (isLoading) {
        return <p className="text-center text-muted-foreground">Ładowanie aktywności...</p>;
    }

    return (
        <div className="glassmorphism-box p-6 max-h-[77vh] overflow-scroll">
            <h2 className="text-xl font-semibold mb-4">Aktywność na Żywo</h2>
            <ul className="space-y-6">
                {events.length > 0 ? (
                    events.map((event, index) => (
                        <ActivityEventItem key={`${event.event_timestamp}-${index}`} event={event} />
                    ))
                ) : (
                    <p className="text-center text-muted-foreground">Brak aktywności do wyświetlenia.</p>
                )}
            </ul>
        </div>
    );
}