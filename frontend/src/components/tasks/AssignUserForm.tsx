'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { X, Check } from 'lucide-react';

interface User {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
}

interface AssignedUser extends User {
    assignment_id: string;
}

interface AssignUserFormProps {
    taskId: string;
    companyUsers: User[]; // Lista wszystkich użytkowników w firmie
}

export function AssignUserForm({ taskId, companyUsers }: AssignUserFormProps) {
    const [assignedUsers, setAssignedUsers] = useState<AssignedUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [open, setOpen] = useState(false);

    // Funkcja do pobierania przypisanych użytkowników
    const fetchAssignedUsers = async () => {
        try {
            const response = await api.get(`/tasks/${taskId}/assignments`);
            setAssignedUsers(response.data);
        } catch (error) {
            toast.error('Błąd', { description: 'Nie udało się pobrać przypisanych użytkowników.' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAssignedUsers();
    }, [taskId]);

    // Funkcja do dodawania przypisania
    const handleAssign = async (userId: string) => {
        try {
            await api.post(`/tasks/${taskId}/assignments`, { userId });
            toast.success('Dodano pracownika');
            fetchAssignedUsers(); // Odśwież listę
            setOpen(false); // Zamknij popover
        } catch (error) {
            toast.error('Błąd', { description: 'Nie udało się przypisać pracownika.' });
        }
    };

    // Funkcja do usuwania przypisania
    const handleUnassign = async (userId: string) => {
        try {
            // Używamy userId jako query param, zgodnie z naszym API
            await api.delete(`/tasks/${taskId}/assignments?userId=${userId}`);
            toast.success('Usunięto pracownika');
            fetchAssignedUsers(); // Odśwież listę
        } catch (error) {
            toast.error('Błąd', { description: 'Nie udało się usunąć przypisania.' });
        }
    };

    // Filtruj użytkowników, którzy nie są jeszcze przypisani
    const unassignedUsers = companyUsers.filter(
        (user) => !assignedUsers.some((assigned) => assigned.id === user.id)
    );

    return (
        <div className="space-y-4">
            <div>
                <h4 className="text-sm font-medium mb-2">Przypisani pracownicy</h4>
                {isLoading ? (
                    <p className="text-sm text-muted-foreground">Ładowanie...</p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {assignedUsers.length > 0 ? (
                            assignedUsers.map((user) => (
                                <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
                                    {user.first_name} {user.last_name}
                                    <button onClick={() => handleUnassign(user.id)} className="rounded-full hover:bg-muted-foreground/20">
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">Brak przypisanych pracowników.</p>
                        )}
                    </div>
                )}
            </div>

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">
                        + Przypisz pracownika
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                        <CommandInput placeholder="Wyszukaj pracownika..." />
                        <CommandList>
                            <CommandEmpty>Brak wyników.</CommandEmpty>
                            <CommandGroup>
                                {unassignedUsers.map((user) => (
                                    <CommandItem
                                        key={user.id}
                                        value={`${user.first_name} ${user.last_name} ${user.email}`}
                                        onSelect={() => handleAssign(user.id)}
                                    >
                                        <Check className="mr-2 h-4 w-4 opacity-0" />
                                        {user.first_name} {user.last_name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}