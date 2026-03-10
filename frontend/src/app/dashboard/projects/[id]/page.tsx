'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import QRCode from 'react-qr-code';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CreateTaskForm } from '@/components/tasks/CreateTaskForm';
import { AssignUserForm } from '@/components/tasks/AssignUserForm';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Definicje typów dla danych
interface Project {
    id: string;
    name: string;
    description: string;
    address: string;
    geo_latitude: number | null;
    geo_longitude: number | null;
    geo_radius_meters: number | null;
}
interface Task { id: string; name: string; description: string; }
interface User { id: string; first_name: string; last_name: string; email: string; }

export default function ProjectDetailsPage() {
    const params = useParams();
    const projectId = params.id as string;
    const qrCodeRef = useRef<HTMLDivElement>(null);

    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [companyUsers, setCompanyUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
    const [selectedTaskQr, setSelectedTaskQr] = useState<string | null>(null);
    const [taskToAssign, setTaskToAssign] = useState<Task | null>(null);

    // Stany dla edycji geofence
    const [geofence, setGeofence] = useState({ lat: 52.4064, lng: 16.9252 });
    const [radius, setRadius] = useState(500);

    // Dynamiczne ładowanie komponentu mapy
    const GeofenceMap = useMemo(() => dynamic(() =>
            import('@/components/projects/GeofenceMap').then(mod => mod.GeofenceMap),
        { ssr: false }
    ), []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [projectRes, tasksRes, usersRes] = await Promise.all([
                api.get(`/projects/${projectId}`),
                api.get(`/tasks/in-project/${projectId}`),
                api.get('/users'), // Pobieramy listę wszystkich użytkowników w firmie
            ]);
            setProject(projectRes.data);
            setTasks(tasksRes.data);
            setCompanyUsers(usersRes.data);

            if (projectRes.data.geo_latitude && projectRes.data.geo_longitude) {
                setGeofence({ lat: projectRes.data.geo_latitude, lng: projectRes.data.geo_longitude });
                setRadius(projectRes.data.geo_radius_meters || 500);
            }
        } catch (error) {
            toast.error('Błąd', { description: 'Nie udało się pobrać danych projektu.' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { if (projectId) fetchData(); }, [projectId]);

    const handleSaveGeofence = async () => {
        try {
            await api.patch(`/projects/${projectId}`, {
                geo_latitude: geofence.lat,
                geo_longitude: geofence.lng,
                geo_radius_meters: Number(radius),
            });
            toast.success('Sukces!', { description: 'Strefa geofence została zaktualizowana.' });
        } catch (error) {
            toast.error('Błąd', { description: 'Nie udało się zapisać strefy.' });
        }
    };

    const handleGenerateQr = async (taskId: string) => {
        try {
            // ✅ POPRAWIONY ADRES URL
            const response = await api.post(`/tasks/in-project/${projectId}/${taskId}/qr-code`);
            setSelectedTaskQr(response.data.code_value);
        } catch (error) {
            toast.error('Błąd', { description: 'Nie udało się wygenerować kodu QR.' });
        }
    };

    const handleDownloadQr = () => {
        if (!qrCodeRef.current || !selectedTaskQr) return;
        const svgElement = qrCodeRef.current.querySelector('svg');
        if (!svgElement) return;
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `qr-code-task-${selectedTaskQr}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleTaskCreated = () => {
        setIsTaskDialogOpen(false);
        fetchData();
    };

    if (isLoading) return <div className="p-4">Ładowanie...</div>;
    if (!project) return <div className="p-4">Nie znaleziono projektu.</div>;

    return (
        <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <p className="text-muted-foreground">{project.description}</p>
            <p className="text-sm text-muted-foreground mt-1">Adres: {project.address || 'Brak'}</p>

            <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4">Strefa Geofence</h2>
                <div className="grid gap-6">
                    <GeofenceMap
                        center={[geofence.lat, geofence.lng]}
                        radius={radius}
                        onCenterChange={(latlng) => setGeofence(latlng)}
                    />
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="grid gap-2 flex-grow">
                            <Label htmlFor="radius">Promień (w metrach)</Label>
                            <Input id="radius" type="number" value={radius} onChange={(e) => setRadius(Number(e.target.value))} />
                        </div>
                        <Button onClick={handleSaveGeofence} className="self-end">Zapisz strefę</Button>
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Zlecenia (Taski)</h2>
                    <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
                        <DialogTrigger asChild><Button>Dodaj Zlecenie</Button></DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Nowe zlecenie dla: {project.name}</DialogTitle></DialogHeader>
                            <CreateTaskForm projectId={projectId} onSuccess={handleTaskCreated} />
                        </DialogContent>
                    </Dialog>
                </div>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nazwa zlecenia</TableHead>
                                <TableHead>Opis</TableHead>
                                <TableHead className="text-right">Akcje</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tasks.length > 0 ? (
                                tasks.map((task) => (
                                    <TableRow key={task.id}>
                                        <TableCell>{task.name}</TableCell>
                                        <TableCell>{task.description}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="outline" size="sm" onClick={() => setTaskToAssign(task)}>Zarządzaj</Button>
                                            <Button variant="outline" size="sm" onClick={() => handleGenerateQr(task.id)}>Generuj QR</Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={3} className="text-center">Brak zdefiniowanych zleceń.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog open={!!selectedTaskQr} onOpenChange={() => setSelectedTaskQr(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Kod QR dla zlecenia</DialogTitle>
                        <DialogDescription>
                            Zapisz ten kod i wydrukuj go, aby pracownicy mogli go skanować.
                        </DialogDescription>
                    </DialogHeader>
                    <div ref={qrCodeRef} className="flex items-center justify-center p-4 bg-white">
                        {selectedTaskQr && (
                            <QRCode value={selectedTaskQr} size={256} style={{ height: 'auto', maxWidth: '100%', width: '100%' }} viewBox={`0 0 256 256`} />
                        )}
                    </div>
                    <p className="text-xs text-center text-muted-foreground break-all">{selectedTaskQr}</p>
                    <DialogFooter>
                        <Button onClick={handleDownloadQr} className="w-full">
                            Pobierz jako SVG
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={!!taskToAssign} onOpenChange={() => setTaskToAssign(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Przypisz do zlecenia</DialogTitle>
                        <DialogDescription>{taskToAssign?.name}</DialogDescription>
                    </DialogHeader>
                    {taskToAssign && <AssignUserForm taskId={taskToAssign.id} companyUsers={companyUsers} />}
                </DialogContent>
            </Dialog>
        </div>
    );
}