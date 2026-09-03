'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CreateUserForm } from '@/components/users/CreateUserForm';
import { EditUserForm, EditableUser } from '@/components/users/EditUserForm';
import { Pencil } from 'lucide-react';
import { CompanyOvertimeSettingsCard } from '@/components/users/CompanyOvertimeSettingsCard';
import type { TaskOption } from '@/lib/users';

interface User extends EditableUser {
    email: string;
    is_active?: boolean;
}

function formatRate(value: number | null | undefined): string {
    return `${(Number(value) || 0).toFixed(2)} zł/h`;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editedUser, setEditedUser] = useState<User | null>(null);
    const [tasks, setTasks] = useState<TaskOption[]>([]);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Błąd podczas pobierania użytkowników:', error);
        } finally {
            setIsLoading(false);
        }
    };
    const toggleActive = async (userId: string, currentlyActive: boolean) => {
        try {
            const endpoint = currentlyActive ? `/users/${userId}/deactivate` : `/users/${userId}/activate`;
            await api.patch(endpoint);
            fetchUsers();
        } catch (error) {
            console.error('Błąd zmiany statusu:', error);
        }
    };
    useEffect(() => {
        fetchUsers();
        api.get<TaskOption[]>('/tasks')
            .then(({ data }) => setTasks(Array.isArray(data) ? data : []))
            .catch((error) => console.error('Błąd podczas pobierania zadań:', error));
    }, []);
    const handleUserCreated = () => { setIsDialogOpen(false); fetchUsers(); };
    const handleUserUpdated = () => { setEditedUser(null); fetchUsers(); };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Użytkownicy</h1>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild><Button>Dodaj użytkownika</Button></DialogTrigger>
                    <DialogContent><DialogHeader><DialogTitle>Nowy użytkownik</DialogTitle></DialogHeader><CreateUserForm onSuccess={handleUserCreated} /></DialogContent>
                </Dialog>
            </div>
            <div className="mb-6">
                <CompanyOvertimeSettingsCard tasks={tasks} onSettingsChange={() => fetchUsers()} />
            </div>
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Imię i nazwisko</TableHead>
                            <TableHead>E-mail</TableHead>
                            <TableHead>Rola</TableHead>
                            <TableHead>Stawka</TableHead>
                            <TableHead>Nadgodziny</TableHead>
                            <TableHead>Limit dzienny</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>{user.first_name} {user.last_name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.role}</TableCell>
                                <TableCell>{formatRate(user.hourly_rate)}</TableCell>
                                <TableCell>{formatRate(user.overtime_rate)}</TableCell>
                                <TableCell>{((Number(user.daily_limit_minutes) || 480) / 60).toFixed(1).replace('.0', '')} h</TableCell>
                                <TableCell>
                                    <Button
                                        variant={user.is_active ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => toggleActive(user.id, !!user.is_active)}
                                    >
                                        {user.is_active ? 'Aktywny' : 'Nieaktywny'}
                                    </Button>
                                </TableCell>
                                <TableCell>
                                    <Button variant="outline" size="sm" onClick={() => setEditedUser(user)}>
                                        <Pencil className="h-4 w-4 mr-1" /> Edytuj
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={!!editedUser} onOpenChange={(open) => { if (!open) setEditedUser(null); }}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Edytuj pracownika</DialogTitle></DialogHeader>
                    {editedUser && <EditUserForm user={editedUser} onSuccess={handleUserUpdated} />}
                </DialogContent>
            </Dialog>
        </div>
    );
}
