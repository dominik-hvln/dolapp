'use client';

import { Suspense, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { api, getApiErrorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { endOfDay, format, isValid } from 'date-fns';
import { Calendar as CalendarIcon, MoreHorizontal, AlertTriangle } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EditEntryForm } from '@/components/time-entries/EditEntryForm';
import { EntryDetailsDialog } from '@/components/time-entries/EntryDetailsDialog';
import { TimeEntry, AuditLog, entryDurationMinutes, entryPausedMinutes, entryOutsideMinutes, entryOutsideCount, formatMinutes, TimeEntryFilterProject, summarizeEntryDays, warsawTime } from '@/lib/time-entries';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // Poprawiony import Label
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileDown } from 'lucide-react';

interface User { id: string; first_name: string; last_name: string; }

export default function TimeEntriesPage() {
    return <Suspense fallback={<p>Ładowanie ewidencji...</p>}><TimeEntriesContent /></Suspense>;
}

function TimeEntriesContent() {
    const [entries, setEntries] = useState<TimeEntry[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const [filterProjects, setFilterProjects] = useState<TimeEntryFilterProject[]>([]);
    const requestNumber = useRef(0);
    const selectedUserId = searchParams.get('userId') || 'all';
    const selectedProjectId = searchParams.get('projectId') || 'all';
    const selectedTaskId = selectedProjectId === 'all' ? 'all' : searchParams.get('taskId') || 'all';
    const rawKind = searchParams.get('kind');
    const selectedKind = rawKind === 'regular' || rawKind === 'overtime' ? rawKind : 'all';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const date = useMemo<DateRange | undefined>(() => {
        const from = dateFrom ? new Date(dateFrom) : undefined;
        const to = dateTo ? new Date(dateTo) : undefined;
        return from && isValid(from) ? { from, to: to && isValid(to) ? to : undefined } : undefined;
    }, [dateFrom, dateTo]);
    const updateFilters = (values: Record<string, string | undefined>) => {
        const params = new URLSearchParams(searchParams.toString());
        for (const [key, value] of Object.entries(values)) {
            if (!value || value === 'all') params.delete(key);
            else params.set(key, value);
        }
        router.replace(`${pathname}${params.size ? `?${params}` : ''}`, { scroll: false });
    };
    const setDate = (range: DateRange | undefined) => updateFilters({
        dateFrom: range?.from?.toISOString(),
        dateTo: range?.from ? endOfDay(range.to ?? range.from).toISOString() : undefined,
    });
    const selectedProject = filterProjects.find((project) => project.id === selectedProjectId);
    const query = new URLSearchParams();
    if (date?.from) query.set('dateFrom', date.from.toISOString());
    if (date?.to) query.set('dateTo', date.to.toISOString());
    if (selectedUserId !== 'all') query.set('userId', selectedUserId);
    if (selectedProjectId !== 'all') query.set('projectId', selectedProjectId);
    if (selectedTaskId !== 'all') query.set('taskId', selectedTaskId);
    if (selectedKind !== 'all') query.set('kind', selectedKind);
    const queryString = query.toString();
    const [entryToEdit, setEntryToEdit] = useState<TimeEntry | null>(null);
    const [entryToDelete, setEntryToDelete] = useState<TimeEntry | null>(null);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [deleteReason, setDeleteReason] = useState('');
    const [entryDetails, setEntryDetails] = useState<TimeEntry | null>(null);

    // Tabela, podsumowanie i eksporty korzystają z tego samego zestawu wpisów.
    const totalDurationMinutes = useMemo(
        () => entries.reduce((total, entry) => total + entryDurationMinutes(entry), 0),
        [entries],
    );
    const totalPausedMinutes = useMemo(
        () => entries.reduce((total, entry) => total + entryPausedMinutes(entry), 0),
        [entries],
    );

    const totalOutsideMinutes = useMemo(() => entries.reduce((total, entry) => total + entryOutsideMinutes(entry), 0), [entries]);
    const totalOutsideCount = useMemo(() => entries.reduce((total, entry) => total + entryOutsideCount(entry), 0), [entries]);
    const totalOvertimeMinutes = useMemo(() => entries.reduce((total, entry) => total + (entry.is_overtime ? entryDurationMinutes(entry) : 0), 0), [entries]);
    const days = useMemo(() => summarizeEntryDays(entries), [entries]);

    const totalHours = Math.floor(totalDurationMinutes / 60);
    const totalMinutes = totalDurationMinutes % 60;

    const handleExportCSV = () => {
        const headers = 'Pracownik;Projekt;Zlecenie;Data Rozpoczęcia;Czas Rozpoczęcia;Data Zakończenia;Czas Zakończenia;Czas Trwania (min);Rodzaj;Poza strefą (min);Przerwy poza strefą;Uwagi\n';

        // Escapowanie cudzysłowów i ochrona przed CSV/formula injection (komórki zaczynające się od = + - @).
        const csvCell = (value: string) => {
            const escaped = String(value).replace(/"/g, '""');
            return `"${/^[=+\-@\t\r]/.test(escaped) ? `'${escaped}` : escaped}"`;
        };
        const rows = entries.map(entry => {
            const start = new Date(entry.start_time);
            const end = entry.end_time ? new Date(entry.end_time) : null;
            const durationMin = entryDurationMinutes(entry);
            const notes = [
                entry.switched_by === 'auto_limit' ? 'auto: nadgodziny' : null,
                !entry.end_time ? 'w trakcie' : null,
            ].filter(Boolean).join(', ');

            return [
                csvCell(`${entry.user.first_name} ${entry.user.last_name}`),
                csvCell(entry.project?.name || '-'),
                csvCell(entry.task?.name || 'Ogólny'),
                start.toLocaleDateString('pl-PL'),
                start.toLocaleTimeString('pl-PL'),
                end ? end.toLocaleDateString('pl-PL') : '-',
                end ? end.toLocaleTimeString('pl-PL') : '-',
                durationMin,
                entry.is_overtime ? 'Nadgodziny' : 'Podstawowy',
                entryOutsideMinutes(entry),
                entryOutsideCount(entry),
                csvCell(notes)
            ].join(';');
        }).join('\n');

        const csvContent = headers + rows;
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' }); // \uFEFF dla poprawnego kodowania polskich znaków w Excelu
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'raport_czasu_pracy.csv';
        link.click();
        URL.revokeObjectURL(link.href);
    };

    const handleExportPDF = async () => {
        // 1. Funkcja musi być teraz asynchroniczna
        const doc = new jsPDF({ orientation: 'landscape' });

        try {
            // 2. Pobierz plik czcionki z folderu /public
            const fontResponse = await fetch('/fonts/Roboto-Regular.ttf');
            if (!fontResponse.ok) {
                throw new Error('Nie udało się załadować czcionki');
            }
            const fontBlob = await fontResponse.blob();

            // 3. Przeczytaj czcionkę jako Base64
            const reader = new FileReader();

            // Używamy Promise, aby poczekać na wczytanie pliku
            await new Promise<void>((resolve, reject) => {
                reader.onerror = () => reject(new Error('Nie udało się odczytać czcionki.'));
                reader.onload = () => {
                    // Otrzymujemy string base64
                    const fontBase64 = (reader.result as string).split(',')[1];

                    // 4. Zarejestruj czcionkę w jsPDF
                    doc.addFileToVFS('Roboto-Regular.ttf', fontBase64);
                    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
                    doc.setFont('Roboto'); // Ustaw ją jako domyślną

                    resolve();
                };
                reader.readAsDataURL(fontBlob);
            });

            // 5. Cała reszta logiki generowania PDF (teraz z poprawną czcionką)
            doc.text("Raport Ewidencji Czasu Pracy", 14, 20);
            doc.setFontSize(10);
            doc.text(`Filtry: ${date?.from ? format(date.from, 'dd.MM.yyyy') : ''} - ${date?.to ? format(date.to, 'dd.MM.yyyy') : ''}`, 14, 25);

            const tableColumn = ['Pracownik', 'Projekt / Zlecenie', 'Start', 'Koniec', 'Czas pracy', 'Rodzaj', 'Poza strefą (min)', 'Przerwy poza strefą'];
            const tableRows: (string | number)[][] = [];

            entries.forEach(entry => {
                const row = [
                    `${entry.user.first_name} ${entry.user.last_name}`,
                    `${entry.project?.name || '-'} / ${entry.task?.name || 'Ogólny'}`,
                    new Date(entry.start_time).toLocaleString('pl-PL'),
                    entry.end_time ? new Date(entry.end_time).toLocaleString('pl-PL') : '-',
                    formatDuration(entry),
                    entry.is_overtime ? 'Nadgodziny' : 'Podstawowy',
                    entryOutsideMinutes(entry),
                    entryOutsideCount(entry)
                ];
                tableRows.push(row);
            });

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 35,
                styles: {
                    font: 'Roboto', // Używamy naszej nowej czcionki
                },
            });

            const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
            doc.setFont('Roboto');
            doc.setFontSize(12);

            // Ta linia teraz zadziała poprawnie
            doc.text(`Łączny czas pracy: ${totalHours}h ${totalMinutes}m (poza strefą: ${formatMinutes(totalOutsideMinutes)}, wliczone w czas pracy)`, 14, finalY + 10);

            doc.save('raport_czasu_pracy.pdf');

        } catch (error) {
            console.error("Błąd podczas generowania PDF:", error);
            toast.error('Błąd', { description: getApiErrorMessage(error, 'Nie udało się wygenerować PDF. Sprawdź, czy plik czcionki jest dostępny.') });
        }
    };

    const fetchTimeEntries = useCallback(async () => {
        const currentRequest = ++requestNumber.current;
        setIsLoading(true);
        try {
            const response = await api.get<TimeEntry[]>(`/time-entries?${queryString}`);
            if (currentRequest === requestNumber.current) setEntries(response.data);
        } catch (error) {
            if (currentRequest === requestNumber.current) {
                setEntries([]);
                toast.error(getApiErrorMessage(error, 'Nie udało się pobrać ewidencji.'));
            }
        } finally {
            if (currentRequest === requestNumber.current) setIsLoading(false);
        }
    }, [queryString]);

    useEffect(() => {
        let cancelled = false;
        api.get<User[]>('/users')
            .then(({ data }) => { if (!cancelled) setUsers(data); })
            .catch((error: unknown) => { if (!cancelled) toast.error(getApiErrorMessage(error, 'Nie udało się pobrać pracowników.')); });
        api.get<{ projects: TimeEntryFilterProject[] }>('/time-entries/filters')
            .then(({ data }) => { if (!cancelled) setFilterProjects(data.projects); })
            .catch((error: unknown) => { if (!cancelled) toast.error(getApiErrorMessage(error, 'Nie udało się pobrać filtrów ewidencji.')); });
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        fetchTimeEntries();
        return () => { requestNumber.current += 1; };
    }, [fetchTimeEntries]);

    const formatDuration = (entry: TimeEntry) => {
        const label = formatMinutes(entryDurationMinutes(entry));
        return entry.end_time ? label : `${label} (w trakcie)`;
    };

    const handleDelete = async () => {
        if (!entryToDelete) return;
        try {
            await api.delete(`/time-entries/${entryToDelete.id}`, {
                data: { reason: deleteReason }
            });
            toast.success('Sukces!', { description: 'Wpis został usunięty.' });
            fetchTimeEntries();
        } catch (error) {
            toast.error(getApiErrorMessage(error, 'Nie udało się usunąć wpisu.'));
        } finally {
            setEntryToDelete(null);
            setDeleteReason('');
        }
    };

    const handleUpdateSuccess = () => {
        setEntryToEdit(null);
        fetchTimeEntries();
    };

    const handleShowHistory = async (entryId: string) => {
        try {
            const response = await api.get(`/time-entries/${entryId}/audit-logs`);
            setAuditLogs(response.data);
            setIsHistoryOpen(true);
        } catch (error) {
            toast.error(getApiErrorMessage(error, 'Nie udało się pobrać historii zmian.'));
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Ewidencja Czasu Pracy</h1>

            <div className="flex flex-wrap items-center gap-4 mb-4 p-4 border rounded-lg bg-card">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-[280px] justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date?.from ? (date.to ? `${format(date.from, 'dd.MM.yyyy')} - ${format(date.to, 'dd.MM.yyyy')}` : format(date.from, 'dd.MM.yyyy')) : <span>Wybierz zakres dat</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start"><Calendar mode="range" selected={date} onSelect={setDate} numberOfMonths={2} /></PopoverContent>
                </Popover>

                <Select value={selectedUserId} onValueChange={(value) => updateFilters({ userId: value })}>
                    <SelectTrigger aria-label="Pracownik" className="w-full sm:w-[280px]"><SelectValue placeholder="Filtruj po pracowniku" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Wszyscy pracownicy</SelectItem>
                        {users.map(user => <SelectItem key={user.id} value={user.id}>{user.first_name} {user.last_name}</SelectItem>)}
                    </SelectContent>
                </Select>

                <div className="space-y-1">
                    <Label>Projekt</Label>
                    <Select value={selectedProjectId} onValueChange={(value) => updateFilters({ projectId: value, taskId: undefined })}>
                        <SelectTrigger aria-label="Projekt" className="w-full sm:w-[240px]"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="all">Wszystkie projekty</SelectItem>{filterProjects.map((project) => <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label>Zlecenie</Label>
                    <Select value={selectedTaskId} disabled={selectedProjectId === 'all'} onValueChange={(value) => updateFilters({ taskId: value })}>
                        <SelectTrigger aria-label="Zlecenie" className="w-full sm:w-[260px]"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="all">Wszystkie zlecenia</SelectItem>{selectedProject?.tasks.map((task) => <SelectItem key={task.id} value={task.id}>{task.name}{task.is_overtime && <Badge variant="secondary" className="ml-2">Nadgodziny</Badge>}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label>Rodzaj</Label>
                    <Select value={selectedKind} onValueChange={(value) => updateFilters({ kind: value })}>
                        <SelectTrigger aria-label="Rodzaj" className="w-full sm:w-[200px]"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="all">Wszystko</SelectItem><SelectItem value="regular">Czas podstawowy</SelectItem><SelectItem value="overtime">Nadgodziny</SelectItem></SelectContent>
                    </Select>
                </div>
                <Button onClick={fetchTimeEntries} disabled={isLoading}>Filtruj</Button>
                <div className="flex gap-2 ml-auto">
                    <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={isLoading}>
                        <FileDown className="mr-2 h-4 w-4" /> CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={isLoading}>
                        <FileDown className="mr-2 h-4 w-4" /> PDF
                    </Button>
                </div>
            </div>
            <div className="mb-4">
                <h3 className="text-lg font-semibold">
                    Podsumowanie dla wybranych filtrów
                </h3>
                <p className="text-muted-foreground">
                    Łączny czas pracy: <span className="font-bold text-primary">{totalHours} godzin {totalMinutes} minut</span>
                    <span> (poza strefą: {formatMinutes(totalOutsideMinutes)}, wliczone w czas pracy)</span>
                    {totalPausedMinutes > 0 && <span className="block text-sm">Pauza (stary tryb): {totalPausedMinutes} min</span>}
                </p>
            </div>
            <details className="mb-6 rounded-lg border p-4" open>
                <summary className="cursor-pointer font-semibold">Podsumowanie dni</summary>
                <Table>
                    <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Pracownik</TableHead><TableHead>Rozpoczęcie</TableHead><TableHead>Czas pracy</TableHead><TableHead>w tym nadgodziny</TableHead><TableHead>Poza strefą</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {isLoading ? <TableRow><TableCell colSpan={6}>Ładowanie...</TableCell></TableRow> : days.map((day) => (
                            <TableRow key={day.key}><TableCell>{day.day.split('-').reverse().join('.')}</TableCell><TableCell>{day.employee}</TableCell><TableCell>{warsawTime(day.start)}</TableCell><TableCell>{formatMinutes(day.duration)}</TableCell><TableCell>{formatMinutes(day.overtime)}</TableCell><TableCell title="Wliczone w czas pracy">{day.outsideCount} ({day.outside} min)</TableCell></TableRow>
                        ))}
                        {!isLoading && days.length === 0 && <TableRow><TableCell colSpan={6}>Brak wpisów dla wybranych filtrów.</TableCell></TableRow>}
                        {!isLoading && <TableRow className="font-semibold"><TableCell>Łącznie</TableCell><TableCell /><TableCell /><TableCell>{formatMinutes(totalDurationMinutes)}</TableCell><TableCell>{formatMinutes(totalOvertimeMinutes)}</TableCell><TableCell title="Wliczone w czas pracy">{totalOutsideCount} ({totalOutsideMinutes} min)</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </details>
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Pracownik</TableHead>
                            <TableHead>Projekt / Zlecenie</TableHead>
                            <TableHead>Start</TableHead>
                            <TableHead>Koniec</TableHead>
                            <TableHead>Czas trwania</TableHead>
                            <TableHead>Poza strefą</TableHead>
                            <TableHead className="text-right">Akcje</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={7} className="text-center">Ładowanie...</TableCell></TableRow>
                        ) : (
                            entries.map((entry) => (
                                <TableRow key={entry.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-1"> {/* Zmniejszony odstęp */}
                                            <span>{entry.user.first_name} {entry.user.last_name}</span>
                                            {entry.was_edited && <Badge variant="outline" className="ml-1 px-1 text-xs">Edyt.</Badge>} {/* Zmniejszony badge */}
                                            {entry.is_outside_geofence && (
                                                <TooltipProvider delayDuration={100}>
                                                    <Tooltip>
                                                        <TooltipTrigger className="ml-1">
                                                            <AlertTriangle className="h-4 w-4 text-destructive" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Wpis zarejestrowany poza strefą</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <span>{entry.project?.name || '-'} / {entry.task?.name || 'Ogólny'}</span>
                                            {entry.is_overtime && <Badge variant="secondary">Nadgodziny</Badge>}
                                            {entry.switched_by === 'auto_limit' && (
                                                <TooltipProvider delayDuration={100}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Badge variant="secondary" className="ml-1 px-1 text-xs">auto: nadgodziny</Badge>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Wpis utworzony automatycznie po osiągnięciu limitu dziennego</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>{new Date(entry.start_time).toLocaleString('pl-PL')}</TableCell>
                                    <TableCell>{entry.end_time ? new Date(entry.end_time).toLocaleString('pl-PL') : '-'}</TableCell>
                                    <TableCell className="font-medium">{formatDuration(entry)}</TableCell>
                                    <TableCell>
                                        <TooltipProvider><Tooltip>
                                            <TooltipTrigger asChild><span className="cursor-help">{entryOutsideCount(entry)} ({entryOutsideMinutes(entry)} min)</span></TooltipTrigger>
                                            <TooltipContent>Wliczone w czas pracy</TooltipContent>
                                        </Tooltip></TooltipProvider>
                                        {entryPausedMinutes(entry) > 0 && <p className="text-xs text-muted-foreground">Pauza (stary tryb): {entryPausedMinutes(entry)} min</p>}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Otwórz menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setEntryDetails(entry)}>Szczegóły</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setEntryToEdit(entry)}>Edytuj</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleShowHistory(entry.id)}>Pokaż historię</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setEntryToDelete(entry)} className="text-red-600">Usuń</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <EntryDetailsDialog entry={entryDetails} onClose={() => setEntryDetails(null)} />

            <Dialog open={!!entryToEdit} onOpenChange={() => setEntryToEdit(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edytuj wpis czasu pracy</DialogTitle>
                        <DialogDescription>
                            Wprowadź poprawki i obowiązkowo podaj powód zmiany.
                        </DialogDescription>
                    </DialogHeader>
                    {entryToEdit && <EditEntryForm entry={entryToEdit} onSuccess={handleUpdateSuccess} />}
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!entryToDelete} onOpenChange={() => setEntryToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Czy na pewno chcesz usunąć?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tej operacji nie można cofnąć. Proszę, podaj krótki powód usunięcia.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                        <Label htmlFor="delete-reason">Powód usunięcia</Label> {/* Poprawiony Label */}
                        <Input
                            id="delete-reason"
                            value={deleteReason}
                            onChange={(e) => setDeleteReason(e.target.value)}
                            placeholder="Np. duplikat wpisu"
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Anuluj</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={deleteReason.length < 5} className="bg-destructive hover:bg-destructive/90">
                            Tak, usuń
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Historia Zmian Wpisu</DialogTitle>
                        <DialogDescription>
                            Zobacz historię zmian.
                        </DialogDescription>
                    </DialogHeader>
                    <div>
                        {auditLogs.length > 0 ? (
                            <ul className="space-y-4 max-h-[60vh] overflow-y-auto"> {/* Dodano scrollowanie */}
                                {auditLogs.map((log: AuditLog) => ( // Typ 'any' tymczasowo
                                    <li key={log.id} className="p-3 border rounded-md">
                                        <p className="font-semibold">
                                            {log.editor ? `${log.editor.first_name ?? ''} ${log.editor.last_name ?? ''}`.trim() || 'Nieznany' : 'System'}
                                            <span className="font-normal text-muted-foreground"> - {new Date(log.created_at).toLocaleString('pl-PL')}</span>
                                        </p>
                                        <p className="text-sm text-muted-foreground">{log.change_reason || '-'}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : <p>Brak historii zmian dla tego wpisu.</p>}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}