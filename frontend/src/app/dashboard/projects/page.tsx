'use client';
import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import QRCode from 'react-qr-code';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog';
import { CreateProjectForm } from '@/components/projects/CreateProjectForm';
import { toast } from "sonner";
import Link from 'next/link';
import { ModuleGuard } from '@/components/auth/module-guard';

interface Project {
    id: string;
    name: string;
    description: string;
    created_at: string;
}

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedProjectQr, setSelectedProjectQr] = useState<string | null>(null);
    const qrCodeRef = useRef<HTMLDivElement>(null);

    const fetchProjects = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/projects');
            // Zabezpieczenie przed błędem, gdy API zwróci coś innego niż tablicę
            if (Array.isArray(response.data)) {
                setProjects(response.data);
            } else {
                console.error('Otrzymano nieprawidłowe dane projektów:', response.data);
                setProjects([]);
            }
        } catch (error) {
            console.error('Błąd podczas pobierania projektów:', error);
            setProjects([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleProjectCreated = () => {
        setIsDialogOpen(false);
        fetchProjects();
    };

    const handleGenerateQr = async (projectId: string) => {
        try {
            const response = await api.post(`/projects/${projectId}/qr-code`);
            setSelectedProjectQr(response.data.code_value);
        } catch (error) {
            console.error(error);
            toast.error('Błąd', { description: 'Nie udało się wygenerować kodu QR.' });
        }
    };

    const handleDownloadQr = () => {
        if (!qrCodeRef.current || !selectedProjectQr) return;

        const svgElement = qrCodeRef.current.querySelector('svg');
        if (!svgElement) return;

        // Konwertujemy SVG na tekst
        const svgData = new XMLSerializer().serializeToString(svgElement);

        // Tworzymy "blob" (plik w pamięci) i link do niego
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);

        // Tworzymy tymczasowy link, nadajemy mu nazwę pliku i go "klikamy"
        const link = document.createElement('a');
        link.href = url;
        link.download = `qr-code-${selectedProjectQr}.svg`;
        document.body.appendChild(link);
        link.click();

        // Sprzątamy po sobie
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <ModuleGuard moduleCode="projects">
            <div>
                {/* ... existing content ... */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Projekty</h1>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>Dodaj Projekt</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Stwórz nowy projekt</DialogTitle>
                            </DialogHeader>
                            <CreateProjectForm onProjectCreated={handleProjectCreated} />
                        </DialogContent>
                    </Dialog>
                </div>

                {isLoading ? (
                    <p>Ładowanie...</p>
                ) : (
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nazwa</TableHead>
                                    <TableHead>Opis</TableHead>
                                    <TableHead>Data utworzenia</TableHead>
                                    <TableHead className="text-right">Akcje</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {projects.map((project) => (
                                    <TableRow key={project.id}>
                                        <TableCell className="font-medium">
                                            <Link href={`/dashboard/projects/${project.id}`} className="hover:underline">
                                                {project.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell>{project.description || '-'}</TableCell>
                                        <TableCell>
                                            {project.created_at ? new Date(project.created_at).toLocaleDateString('pl-PL') : '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" onClick={() => handleGenerateQr(project.id)}>
                                                Kod QR
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
                <Dialog open={!!selectedProjectQr} onOpenChange={() => setSelectedProjectQr(null)}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Kod QR dla Projektu</DialogTitle>
                            <DialogDescription>
                                Zapisz ten kod i wydrukuj go, aby pracownicy mogli go skanować.
                            </DialogDescription>
                        </DialogHeader>

                        {/* ✅ 5. OPAKOWUJEMY KOD W DIV Z REF'EM */}
                        <div ref={qrCodeRef} className="flex items-center justify-center p-4 bg-white">
                            {selectedProjectQr && (
                                <QRCode
                                    value={selectedProjectQr}
                                    size={256}
                                    style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                                    viewBox="0 0 256 256"
                                />
                            )}
                        </div>
                        <p className="text-xs text-center text-muted-foreground break-all">{selectedProjectQr}</p>

                        <DialogFooter>
                            <Button onClick={handleDownloadQr} className="w-full">
                                Pobierz jako SVG
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </ModuleGuard>
    );
}