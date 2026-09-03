'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Play, Square, LogOut, LogIn, Clock } from 'lucide-react';
import {
    TimeEntry,
    AuditLog,
    entryDurationMinutes,
    entryPausedMinutes,
    formatMinutes,
    resumeSourceLabel,
} from '@/lib/time-entries';

interface EntryDetailsDialogProps {
    entry: TimeEntry | null;
    onClose: () => void;
}

const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
const fmtDateTime = (iso: string) => new Date(iso).toLocaleString('pl-PL');

export function EntryDetailsDialog({ entry, onClose }: EntryDetailsDialogProps) {
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);

    useEffect(() => {
        if (!entry) {
            setAuditLogs([]);
            return;
        }
        let cancelled = false;
        setIsLoadingLogs(true);
        api.get(`/time-entries/${entry.id}/audit-logs`)
            .then((response) => { if (!cancelled) setAuditLogs(response.data); })
            .catch((error: unknown) => {
                console.error('Błąd pobierania historii wpisu:', error);
                if (!cancelled) toast.error('Błąd', { description: 'Nie udało się pobrać historii zmian.' });
            })
            .finally(() => { if (!cancelled) setIsLoadingLogs(false); });
        return () => { cancelled = true; };
    }, [entry]);

    if (!entry) return null;

    const pauses = [...(entry.geofence_pauses ?? [])].sort(
        (a, b) => new Date(a.paused_at).getTime() - new Date(b.paused_at).getTime(),
    );
    const workMinutes = entryDurationMinutes(entry);
    const pausedMinutes = entryPausedMinutes(entry);
    const isOngoing = !entry.end_time;

    return (
        <Dialog open={!!entry} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Szczegóły wpisu</DialogTitle>
                    <DialogDescription>
                        {entry.user.first_name} {entry.user.last_name} - {entry.project?.name || '-'} / {entry.task?.name || 'Ogólny'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <SummaryTile label="Czas pracy" value={formatMinutes(workMinutes)} />
                        <SummaryTile label="Poza strefą" value={formatMinutes(pausedMinutes)} />
                        <SummaryTile label="Przerwy" value={String(pauses.length)} />
                        <SummaryTile label="Status" value={isOngoing ? (entry.paused_at ? 'Wstrzymany' : 'W trakcie') : 'Zakończony'} />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {entry.switched_by === 'auto_limit' && <Badge variant="secondary">auto: nadgodziny</Badge>}
                        {entry.was_edited && <Badge variant="outline">Edytowany</Badge>}
                        {entry.is_outside_geofence && <Badge variant="destructive">Rozpoczęty poza strefą</Badge>}
                    </div>

                    <section>
                        <h4 className="font-semibold mb-3">Oś czasu</h4>
                        <ol className="relative border-l pl-6 space-y-4">
                            <TimelineItem icon={<Play className="h-3 w-3" />} title="Start pracy" time={fmtDateTime(entry.start_time)} />
                            {pauses.map((pause) => (
                                <li key={pause.id} className="space-y-3">
                                    <TimelineItem
                                        nested
                                        icon={<LogOut className="h-3 w-3" />}
                                        title={`Wyjście ze strefy ${fmtTime(pause.paused_at)}`}
                                        time={fmtDateTime(pause.paused_at)}
                                    />
                                    <TimelineItem
                                        nested
                                        icon={<LogIn className="h-3 w-3" />}
                                        title={pause.resumed_at
                                            ? `Powrót do strefy ${fmtTime(pause.resumed_at)} (${resumeSourceLabel(pause.resume_source)})`
                                            : entry.end_time
                                                ? `Powrót niezarejestrowany - przerwa do końca wpisu ${fmtTime(entry.end_time)}`
                                                : 'Powrót do strefy - oczekuje'}
                                        time={pause.resumed_at ? fmtDateTime(pause.resumed_at) : entry.end_time ? fmtDateTime(entry.end_time) : 'brak'}
                                    />
                                </li>
                            ))}
                            {entry.end_time ? (
                                <TimelineItem icon={<Square className="h-3 w-3" />} title="Koniec pracy" time={fmtDateTime(entry.end_time)} />
                            ) : (
                                <TimelineItem icon={<Clock className="h-3 w-3" />} title="W trakcie" time="liczone do teraz" />
                            )}
                        </ol>
                    </section>

                    <section>
                        <h4 className="font-semibold mb-3">Historia zmian</h4>
                        {isLoadingLogs ? (
                            <p className="text-sm text-muted-foreground">Ładowanie...</p>
                        ) : auditLogs.length > 0 ? (
                            <ul className="space-y-3">
                                {auditLogs.map((log) => (
                                    <li key={log.id} className="p-3 border rounded-md">
                                        <p className="font-semibold">
                                            {log.editor ? `${log.editor.first_name ?? ''} ${log.editor.last_name ?? ''}`.trim() || 'Nieznany' : 'System'}
                                            <span className="font-normal text-muted-foreground"> - {fmtDateTime(log.created_at)}</span>
                                        </p>
                                        <p className="text-sm text-muted-foreground">{log.change_reason || '-'}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground">Brak historii zmian dla tego wpisu.</p>
                        )}
                    </section>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-semibold">{value}</p>
        </div>
    );
}

function TimelineItem({ icon, title, time, nested }: { icon: React.ReactNode; title: string; time: string; nested?: boolean }) {
    const content = (
        <>
            <span className={`absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full border ${nested ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                {icon}
            </span>
            <p className="font-medium leading-6">{title}</p>
            <p className="text-sm text-muted-foreground">{time}</p>
        </>
    );
    return nested ? <div className="relative">{content}</div> : <li className="relative">{content}</li>;
}
