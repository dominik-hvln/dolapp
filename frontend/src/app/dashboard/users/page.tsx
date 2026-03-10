'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CreateUserForm } from '@/components/users/CreateUserForm';

interface User { id: string; first_name: string; last_name: string; email: string; role: string; }

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Błąd podczas pobierania projektów:', error);
        } finally {
            setIsLoading(false);
        }
    };
    useEffect(() => { fetchUsers(); }, []);
    const handleUserCreated = () => { setIsDialogOpen(false); fetchUsers(); };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Użytkownicy</h1>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild><Button>Dodaj użytkownika</Button></DialogTrigger>
                    <DialogContent><DialogHeader><DialogTitle>Nowy użytkownik</DialogTitle></DialogHeader><CreateUserForm onSuccess={handleUserCreated} /></DialogContent>
                </Dialog>
            </div>
            <div className="border rounded-lg">
                <Table>
                    <TableHeader><TableRow><TableHead>Imię i nazwisko</TableHead><TableHead>E-mail</TableHead><TableHead>Rola</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>{user.first_name} {user.last_name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.role}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}