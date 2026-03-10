'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import QRCode from 'react-qr-code';
import { MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AxiosError } from 'axios';

interface LocationCode {
    id: string;
    name: string;
    code_value: string;
}

export default function LocationCodesPage() {
    const [codes, setCodes] = useState<LocationCode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newCodeName, setNewCodeName] = useState('');
    const [codeToDelete, setCodeToDelete] = useState<LocationCode | null>(null);
    const [selectedCodeQr, setSelectedCodeQr] = useState<string | null>(null);
    const qrCodeRef = useRef<HTMLDivElement>(null);

    const fetchCodes = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/location-qr-codes');
            setCodes(response.data);
        } catch (error) {
            toast.error('Błąd', { description: 'Nie udało się pobrać kodów ogólnych.' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCodes();
    }, []);

    const handleAddCode = async () => {
        if (newCodeName.length < 3) {
            toast.error('Błąd', { description: 'Nazwa musi mieć co najmniej 3 znaki.' });
            return;
        }
        try {
            await api.post('/location-qr-codes', { name: newCodeName });
            toast.success('Sukces!', { description: 'Nowy kod ogólny został dodany.' });
            setNewCodeName('');
            setIsAddDialogOpen(false);
            fetchCodes();
        } catch (error) {
            toast.error('Błąd', { description: 'Nie udało się dodać kodu.' });
        }
    };

    const handleDelete = async () => {
        if (!codeToDelete) return;
        try {
            await api.delete(`/location-qr-codes/${codeToDelete.id}`);
            toast.success('Sukces!', { description: 'Kod został usunięty.' });
            fetchCodes();
        } catch (error) {
            const axiosError = error as AxiosError;
            const errorMessage = (axiosError.response?.data as { message: string })?.message;
            toast.error('Błąd', { description: errorMessage || 'Nie udało się usunąć kodu.' });
        } finally {
            setCodeToDelete(null);
        }
    };

    const handleDownloadQr = () => {
        if (!qrCodeRef.current || !selectedCodeQr) return;
        const svgElement = qrCodeRef.current.querySelector('svg');
        if (!svgElement) return;
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `qr-code-location-${selectedCodeQr}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Kody Ogólne / Lokalizacyjne</h1>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild><Button>Dodaj Kod Ogólny</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Nowy Kod Ogólny</DialogTitle>
                            <DialogDescription>
                                Stwórz kod dla miejsca, np. biura lub samochodu służbowego, aby pracownicy mogli rejestrować ogólny początek i koniec dnia pracy.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nazwa Kodu</Label>
                                <Input id="name" value={newCodeName} onChange={(e) => setNewCodeName(e.target.value)} placeholder="np. Biuro Główne, Auto 1" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleAddCode}>Dodaj</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nazwa</TableHead>
                            <TableHead>Wartość Kodu QR</TableHead>
                            <TableHead className="text-right">Akcje</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={3} className="text-center">Ładowanie...</TableCell></TableRow>
                        ) : (
                            codes.map((code) => (
                                <TableRow key={code.id}>
                                    <TableCell className="font-medium">{code.name}</TableCell>
                                    <TableCell className="font-mono text-xs">{code.code_value}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setSelectedCodeQr(code.code_value)}>Pokaż QR</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setCodeToDelete(code)} className="text-red-600">Usuń</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={!!codeToDelete} onOpenChange={() => setCodeToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Czy na pewno chcesz usunąć?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Ta operacja usunie kod i powiązany z nim QR. Nie będzie można go już używać do rejestracji czasu pracy.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Anuluj</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Tak, usuń</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={!!selectedCodeQr} onOpenChange={() => setSelectedCodeQr(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Kod QR dla Lokalizacji</DialogTitle>
                        <DialogDescription>
                            Zapisz ten kod i wydrukuj go, aby pracownicy mogli go skanować.
                        </DialogDescription>
                    </DialogHeader>
                    <div ref={qrCodeRef} className="flex items-center justify-center p-4 bg-white">
                        {selectedCodeQr && (
                            <QRCode value={selectedCodeQr} size={256} style={{ height: 'auto', maxWidth: '100%', width: '100%' }} viewBox={`0 0 256 256`} />
                        )}
                    </div>
                    <p className="text-xs text-center text-muted-foreground break-all">{selectedCodeQr}</p>
                    <DialogFooter>
                        <Button onClick={handleDownloadQr} className="w-full">
                            Pobierz jako SVG
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}