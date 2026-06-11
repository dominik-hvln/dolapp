'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
    firstName: z.string().min(2, 'Imię musi mieć co najmniej 2 znaki.'),
    lastName: z.string().min(2, 'Nazwisko musi mieć co najmniej 2 znaki.'),
    role: z.enum(['employee', 'manager', 'admin']),
    hourlyRate: z.number().min(0, 'Stawka nie może być ujemna.'),
    overtimeRate: z.number().min(0, 'Stawka nie może być ujemna.'),
    dailyLimitHours: z.number().min(0).max(24, 'Limit nie może przekraczać 24h.'),
    overtimeTaskId: z.string().optional(),
});

export interface EditableUser {
    id: string;
    first_name: string;
    last_name: string;
    role: string;
    hourly_rate?: number | null;
    overtime_rate?: number | null;
    daily_limit_minutes?: number | null;
    overtime_task_id?: string | null;
}

interface TaskOption {
    id: string;
    name: string;
    project?: { name: string } | null;
}

const NO_TASK = 'none';

export function EditUserForm({ user, onSuccess }: { user: EditableUser; onSuccess: () => void }) {
    const [tasks, setTasks] = useState<TaskOption[]>([]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            firstName: user.first_name,
            lastName: user.last_name,
            role: (['employee', 'manager', 'admin'].includes(user.role) ? user.role : 'employee') as 'employee' | 'manager' | 'admin',
            hourlyRate: Number(user.hourly_rate) || 0,
            overtimeRate: Number(user.overtime_rate) || 0,
            dailyLimitHours: (Number(user.daily_limit_minutes) || 480) / 60,
            overtimeTaskId: user.overtime_task_id || NO_TASK,
        },
    });

    useEffect(() => {
        api.get('/tasks')
            .then((res) => setTasks(Array.isArray(res.data) ? res.data : []))
            .catch(() => {});
    }, []);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            await api.patch(`/users/${user.id}`, {
                firstName: values.firstName,
                lastName: values.lastName,
                role: values.role,
                hourlyRate: values.hourlyRate,
                overtimeRate: values.overtimeRate,
                dailyLimitMinutes: Math.round(values.dailyLimitHours * 60),
                overtimeTaskId: values.overtimeTaskId === NO_TASK ? null : values.overtimeTaskId,
            });
            toast.success('Sukces!', { description: 'Dane pracownika zostały zaktualizowane.' });
            onSuccess();
        } catch (error) {
            toast.error('Błąd', { description: 'Nie udało się zaktualizować pracownika.' });
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="firstName" render={({ field }) => (
                        <FormItem><FormLabel>Imię</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="lastName" render={({ field }) => (
                        <FormItem><FormLabel>Nazwisko</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                <FormField control={form.control} name="role" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Rola</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="employee">Pracownik</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="admin">Administrator</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="hourlyRate" render={({ field }) => (
                        <FormItem><FormLabel>Stawka godzinowa (PLN/h)</FormLabel><FormControl><Input type="number" step="0.01" min="0" value={field.value} onChange={(e) => field.onChange(Number(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="overtimeRate" render={({ field }) => (
                        <FormItem><FormLabel>Stawka za nadgodziny (PLN/h)</FormLabel><FormControl><Input type="number" step="0.01" min="0" value={field.value} onChange={(e) => field.onChange(Number(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                <FormField control={form.control} name="dailyLimitHours" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Dzienny limit pracy (godziny)</FormLabel>
                        <FormControl><Input type="number" step="0.5" min="0" max="24" value={field.value} onChange={(e) => field.onChange(Number(e.target.value) || 0)} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="overtimeTaskId" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Zadanie po przekroczeniu limitu (nadgodziny)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Automatycznie (projekt NADGODZINY)" /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value={NO_TASK}>Automatycznie (projekt NADGODZINY)</SelectItem>
                                {tasks.map((task) => (
                                    <SelectItem key={task.id} value={task.id}>
                                        {task.name}{task.project?.name ? ` (${task.project.name})` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
                <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                    {form.formState.isSubmitting ? 'Zapisywanie...' : 'Zapisz zmiany'}
                </Button>
            </form>
        </Form>
    );
}
