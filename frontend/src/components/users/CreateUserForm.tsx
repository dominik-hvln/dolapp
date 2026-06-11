// src/components/users/CreateUserForm.tsx
'use client';

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
    firstName: z.string().min(2, "Imię musi mieć co najmniej 2 znaki."),
    lastName: z.string().min(2, "Nazwisko musi mieć co najmniej 2 znaki."),
    email: z.string().email("Niepoprawny adres e-mail."),
    password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków."),
    role: z.enum(['employee', 'manager']),
    hourlyRate: z.number().min(0, "Stawka nie może być ujemna."),
    overtimeRate: z.number().min(0, "Stawka nie może być ujemna."),
    dailyLimitHours: z.number().min(0).max(24, "Limit nie może przekraczać 24h."),
});

export function CreateUserForm({ onSuccess }: { onSuccess: () => void }) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { firstName: '', lastName: '', email: '', password: '', role: 'employee', hourlyRate: 0, overtimeRate: 0, dailyLimitHours: 8 },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const { dailyLimitHours, ...rest } = values;
            await api.post('/users', { ...rest, dailyLimitMinutes: Math.round(dailyLimitHours * 60) });
            toast.success('Sukces!', {
                description: 'Nowy pracownik został pomyślnie dodany.',
            });
            onSuccess();
        } catch (error) {
            toast.error('Błąd', {
                description: 'Nie udało się dodać pracownika.',
            });
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField name="firstName" render={({ field }) => ( <FormItem><FormLabel>Imię</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField name="lastName" render={({ field }) => ( <FormItem><FormLabel>Nazwisko</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField name="email" render={({ field }) => ( <FormItem><FormLabel>E-mail</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField name="password" render={({ field }) => ( <FormItem><FormLabel>Hasło tymczasowe</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="role" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Rola</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="employee">Pracownik</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="hourlyRate" render={({ field }) => ( <FormItem><FormLabel>Stawka godzinowa (PLN/h)</FormLabel><FormControl><Input type="number" step="0.01" min="0" value={field.value} onChange={(e) => field.onChange(Number(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="overtimeRate" render={({ field }) => ( <FormItem><FormLabel>Stawka za nadgodziny (PLN/h)</FormLabel><FormControl><Input type="number" step="0.01" min="0" value={field.value} onChange={(e) => field.onChange(Number(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem> )} />
                </div>
                <FormField control={form.control} name="dailyLimitHours" render={({ field }) => ( <FormItem><FormLabel>Dzienny limit pracy (godziny)</FormLabel><FormControl><Input type="number" step="0.5" min="0" max="24" value={field.value} onChange={(e) => field.onChange(Number(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem> )} />
                <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                    {form.formState.isSubmitting ? 'Dodawanie...' : 'Dodaj pracownika'}
                </Button>
            </form>
        </Form>
    );
}