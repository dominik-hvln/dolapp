import { differenceInMinutes, isValid } from 'date-fns';

export interface GeofencePause {
    id: string;
    paused_at: string;
    resumed_at: string | null;
    resume_source: 'auto' | 'scan' | 'switch' | null;
}

export interface TimeEntry {
    id: string;
    start_time: string;
    end_time: string | null;
    paused_at?: string | null;
    switched_by?: 'auto_limit' | null;
    duration_minutes?: number | null;
    paused_minutes?: number | null;
    geofence_pauses?: GeofencePause[] | null;
    user: { first_name: string; last_name: string };
    project: { name: string } | null;
    task: { name: string } | null;
    was_edited: boolean;
    is_outside_geofence: boolean;
}

export interface AuditLog {
    id: number;
    editor: { first_name: string | null; last_name: string | null } | null;
    created_at: string;
    change_reason: string | null;
}

const clampMinutes = (minutes: number) => (Number.isFinite(minutes) && minutes > 0 ? Math.floor(minutes) : 0);

/**
 * Minuty przerw poza strefą - z backendu (`paused_minutes`) albo policzone z `geofence_pauses`.
 * Otwarta pauza liczona do teraz.
 */
export function entryPausedMinutes(entry: TimeEntry, now: Date = new Date()): number {
    if (typeof entry.paused_minutes === 'number') return clampMinutes(entry.paused_minutes);
    const end = entry.end_time ? new Date(entry.end_time) : now;
    return (entry.geofence_pauses ?? []).reduce((total, pause) => {
        const from = new Date(pause.paused_at);
        const to = pause.resumed_at ? new Date(pause.resumed_at) : end;
        if (!isValid(from) || !isValid(to)) return total;
        return total + clampMinutes(differenceInMinutes(to, from));
    }, 0);
}

/**
 * Czas pracy wpisu w minutach: `duration_minutes` z backendu (czas pomniejszony o pauzy),
 * fallback `end - start - pauzy`. Wpis w trakcie liczony do teraz.
 */
export function entryDurationMinutes(entry: TimeEntry, now: Date = new Date()): number {
    if (typeof entry.duration_minutes === 'number') return clampMinutes(entry.duration_minutes);
    const start = new Date(entry.start_time);
    const end = entry.end_time ? new Date(entry.end_time) : now;
    if (!isValid(start) || !isValid(end)) return 0;
    const gross = clampMinutes(differenceInMinutes(end, start));
    return Math.max(0, gross - entryPausedMinutes(entry, now));
}

export function formatMinutes(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
}

export function resumeSourceLabel(source: GeofencePause['resume_source']): string {
    switch (source) {
        case 'auto': return 'auto';
        case 'scan': return 'QR';
        case 'switch': return 'zmiana zadania';
        default: return '-';
    }
}
