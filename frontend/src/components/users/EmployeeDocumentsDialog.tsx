'use client';

import { useEffect, useRef, useState } from 'react';
import { FileImage, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api';
import { EmployeeDocument, employeeDocumentsApi } from '@/lib/employee-documents';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EmployeeDocumentsDialogProps {
    user: { id: string; first_name: string; last_name: string };
    onClose: () => void;
}

const formatSize = (bytes: number) => bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toLocaleString('pl-PL', { maximumFractionDigits: 2 })} MB`
    : `${(bytes / 1024).toLocaleString('pl-PL', { maximumFractionDigits: 1 })} KB`;

export function EmployeeDocumentsDialog({ user, onClose }: EmployeeDocumentsDialogProps) {
    const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [reload, setReload] = useState(0);
    const [busy, setBusy] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [file, setFile] = useState<File | null>(null);
    const [uploadName, setUploadName] = useState('');
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [renameName, setRenameName] = useState('');
    const [toDelete, setToDelete] = useState<EmployeeDocument | null>(null);
    const fileInput = useRef<HTMLInputElement>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setLoadError(false);
        employeeDocumentsApi.list(user.id)
            .then((data) => { if (!cancelled) setDocuments(data); })
            .catch((error: unknown) => {
                if (!cancelled) {
                    setLoadError(true);
                    toast.error(getApiErrorMessage(error, 'Nie udało się pobrać dokumentów.'));
                }
            })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [user.id, reload]);

    const selectFile = (selected: File | null) => {
        setFile(null);
        if (!selected) return;
        let message: string | null = null;
        if (!['image/jpeg', 'image/png', 'application/pdf'].includes(selected.type)) message = 'Dozwolone są tylko pliki JPG, PNG i PDF.';
        else if (selected.size > 10 * 1024 * 1024) message = 'Plik jest za duży (maksymalnie 10 MB).';
        if (message) {
            toast.error(message);
            if (fileInput.current) fileInput.current.value = '';
            return;
        }
        setFile(selected);
    };

    const upload = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!file || busy) return;
        if (uploadName && (!uploadName.trim() || uploadName.trim().length > 120)) {
            toast.error('Nazwa pliku musi mieć od 1 do 120 znaków.');
            return;
        }
        setBusy(true);
        setUploading(true);
        setProgress(0);
        try {
            const document = await employeeDocumentsApi.upload(user.id, file, uploadName, setProgress);
            setDocuments((current) => [document, ...current]);
            setFile(null);
            setUploadName('');
            if (fileInput.current) fileInput.current.value = '';
            toast.success('Dokument został dodany');
        } catch (error) {
            toast.error(getApiErrorMessage(error, 'Nie udało się przesłać dokumentu.'));
        } finally {
            setBusy(false);
            setUploading(false);
        }
    };

    const rename = async (event: React.FormEvent, id: string) => {
        event.preventDefault();
        if (busy) return;
        const name = renameName.trim();
        if (!name || name.length > 120) {
            toast.error('Nazwa pliku musi mieć od 1 do 120 znaków.');
            return;
        }
        setBusy(true);
        try {
            const updated = await employeeDocumentsApi.rename(id, name);
            setDocuments((current) => current.map((document) => document.id === id ? updated : document));
            setRenamingId(null);
            toast.success('Nazwa dokumentu została zmieniona');
        } catch (error) {
            toast.error(getApiErrorMessage(error, 'Nie udało się zmienić nazwy dokumentu.'));
        } finally {
            setBusy(false);
        }
    };

    const remove = async () => {
        if (!toDelete || busy) return;
        setBusy(true);
        try {
            await employeeDocumentsApi.remove(toDelete.id);
            setDocuments((current) => current.filter((document) => document.id !== toDelete.id));
            setToDelete(null);
            toast.success('Dokument został usunięty');
        } catch (error) {
            toast.error(getApiErrorMessage(error, 'Nie udało się usunąć dokumentu.'));
        } finally {
            setBusy(false);
        }
    };

    const download = async (id: string) => {
        if (busy) return;
        setBusy(true);
        try {
            const { url } = await employeeDocumentsApi.getUrl(id);
            window.open(url, '_blank', 'noopener');
        } catch (error) {
            toast.error(getApiErrorMessage(error, 'Nie udało się pobrać dokumentu.'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Teczka pracownika</DialogTitle><DialogDescription>{user.first_name} {user.last_name}</DialogDescription></DialogHeader>
                {loading ? <p>Ładowanie dokumentów...</p> : loadError ? (
                    <div className="space-y-2"><p>Nie udało się pobrać dokumentów.</p><Button variant="outline" onClick={() => setReload((value) => value + 1)}>Spróbuj ponownie</Button></div>
                ) : documents.length === 0 ? <p className="text-muted-foreground">Brak dokumentów w teczce.</p> : (
                    <ul className="space-y-3">
                        {documents.map((document) => (
                            <li key={document.id} className="rounded-lg border p-3 space-y-2">
                                <div className="flex items-start gap-2">
                                    {document.mime_type === 'application/pdf' ? <FileText aria-label="PDF" className="h-5 w-5 shrink-0" /> : <FileImage aria-label="Obraz" className="h-5 w-5 shrink-0" />}
                                    <div className="min-w-0 flex-1">
                                        {renamingId === document.id ? (
                                            <form onSubmit={(event) => rename(event, document.id)} className="flex flex-wrap gap-2">
                                                <Input aria-label="Nazwa dokumentu" autoFocus value={renameName} minLength={1} maxLength={120} disabled={busy} onChange={(event) => setRenameName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); if (!busy) setRenamingId(null); } }} />
                                                <Button size="sm" type="submit" disabled={busy}>Zapisz</Button><Button size="sm" variant="outline" type="button" disabled={busy} onClick={() => setRenamingId(null)}>Anuluj</Button>
                                            </form>
                                        ) : <p className="font-medium break-words">{document.display_name}</p>}
                                        <p className="text-xs text-muted-foreground">{formatSize(document.size_bytes)} · {document.uploaded_by_name ?? document.uploaded_by ?? 'Usunięty użytkownik'} · {new Date(document.created_at).toLocaleString('pl-PL')}</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Button size="sm" variant="outline" disabled={busy} onClick={() => download(document.id)}>Pobierz</Button>
                                    <Button size="sm" variant="outline" disabled={busy} onClick={() => { setRenamingId(document.id); setRenameName(document.display_name); }}>Zmień nazwę</Button>
                                    <Button size="sm" variant="destructive" disabled={busy} onClick={() => setToDelete(document)}>Usuń</Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
                <form onSubmit={upload} className="space-y-3 border-t pt-4">
                    <Label htmlFor="employee-document-file">Dodaj dokument (JPG, PNG lub PDF, maksymalnie 10 MB)</Label>
                    <Input id="employee-document-file" ref={fileInput} type="file" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" disabled={busy || loading || loadError} onChange={(event) => selectFile(event.target.files?.[0] ?? null)} />
                    <Label htmlFor="employee-document-name">Nazwa (opcjonalnie)</Label>
                    <Input id="employee-document-name" maxLength={120} value={uploadName} disabled={busy} onChange={(event) => setUploadName(event.target.value)} />
                    {uploading && <div role="status"><progress value={progress} max={100} className="w-full" /><p className="text-sm">{progress < 100 ? `Przesyłanie: ${progress}%` : 'Zapisywanie dokumentu...'}</p></div>}
                    <Button type="submit" disabled={!file || busy || loading || loadError}>{uploading ? 'Przesyłanie...' : 'Prześlij dokument'}</Button>
                </form>
                <AlertDialog open={!!toDelete} onOpenChange={(open) => { if (!open && !busy) setToDelete(null); }}>
                    <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Usunąć dokument „{toDelete?.display_name}”?</AlertDialogTitle><AlertDialogDescription>Dokument zostanie usunięty z teczki pracownika.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel disabled={busy}>Anuluj</AlertDialogCancel><AlertDialogAction disabled={busy} onClick={(event) => { event.preventDefault(); remove(); }}>{busy ? 'Usuwanie...' : 'Usuń'}</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </DialogContent>
        </Dialog>
    );
}
