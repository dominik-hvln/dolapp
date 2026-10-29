import { differenceInMinutes, isValid } from 'date-fns';

export interface GeofencePause {
    id: string;
    paused_at: string;
    resumed_at: string | null;
    resume_source: 'auto' | 'scan' | 'switch' | 'stop' | 'auto_limit' | null;
    is_work_time?: boolean;
}

export interface TimeEntry {
    id: string;
    start_time: string;
    end_time: string | null;
    paused_at?: string | null;
    switched_by?: 'auto_limit' | null;
    duration_minutes?: number | null;
    paused_minutes?: number | null;
    outside_minutes?: number | null;
    outside_count?: number | null;
    is_overtime?: boolean;
    parent_project_id?: string | null;
    user_id?: string;
    geofence_pauses?: GeofencePause[] | null;
    user: { id?: string; first_name: string; last_name: string };
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
        if (pause.is_work_time === true) return total;
        const from = new Date(pause.paused_at);
        const to = pause.resumed_at ? new Date(pause.resumed_at) : end;
        if (!isValid(from) || !isValid(to)) return total;
        return total + clampMinutes(differenceInMinutes(to, from));
    }, 0);
}

/** Minuty poza strefą, które pozostają wliczone w czas pracy. */
export function entryOutsideMinutes(entry: TimeEntry, now: Date = new Date()): number {
    if (typeof entry.outside_minutes === 'number') return clampMinutes(entry.outside_minutes);
    const end = entry.end_time ? new Date(entry.end_time) : now;
    return (entry.geofence_pauses ?? []).reduce((total, pause) => {
        if (pause.is_work_time !== true) return total;
        const from = new Date(pause.paused_at);
        const to = pause.resumed_at ? new Date(pause.resumed_at) : end;
        if (!isValid(from) || !isValid(to)) return total;
        return total + clampMinutes(differenceInMinutes(to, from));
    }, 0);
}

export function entryOutsideCount(entry: TimeEntry): number {
    return typeof entry.outside_count === 'number'
        ? clampMinutes(entry.outside_count)
        : (entry.geofence_pauses ?? []).filter((pause) => pause.is_work_time === true).length;
}

export interface TimeEntryFilterProject {
    id: string;
    name: string;
    overtime_project: { id: string; name: string } | null;
    tasks: { id: string; name: string; is_overtime: boolean }[];
}

const warsawDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Warsaw', year: 'numeric', month: '2-digit', day: '2-digit' });
export const warsawTime = (iso: string) => new Date(iso).toLocaleTimeString('pl-PL', { timeZone: 'Europe/Warsaw', hour: '2-digit', minute: '2-digit' });

export interface TimeEntryDay {
    key: string;
    day: string;
    employee: string;
    start: string;
    duration: number;
    overtime: number;
    outside: number;
    outsideCount: number;
}

export function summarizeEntryDays(entries: TimeEntry[], now: Date = new Date()): TimeEntryDay[] {
    const days = new Map<string, TimeEntryDay>();
    for (const entry of entries) {
        const parts = warsawDay.formatToParts(new Date(entry.start_time));
        const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value;
        const day = `${part('year')}-${part('month')}-${part('day')}`;
        const employee = `${entry.user.first_name} ${entry.user.last_name}`;
        const key = JSON.stringify([entry.user_id ?? entry.user.id ?? employee, day]);
        const row = days.get(key) ?? { key, day, employee, start: entry.start_time, duration: 0, overtime: 0, outside: 0, outsideCount: 0 };
        if (new Date(entry.start_time) < new Date(row.start)) row.start = entry.start_time;
        const duration = entryDurationMinutes(entry, now);
        row.duration += duration;
        row.overtime += entry.is_overtime ? duration : 0;
        row.outside += entryOutsideMinutes(entry, now);
        row.outsideCount += entryOutsideCount(entry);
        days.set(key, row);
    }
    return [...days.values()].sort((a, b) => b.day.localeCompare(a.day) || a.employee.localeCompare(b.employee, 'pl') || a.key.localeCompare(b.key));
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
        case 'stop': return 'zakończenie pracy';
        case 'auto_limit': return 'limit dzienny';
        default: return '-';
    }
}
