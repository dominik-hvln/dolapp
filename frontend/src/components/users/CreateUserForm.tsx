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
});

export function CreateUserForm({ onSuccess }: { onSuccess: () => void }) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { firstName: '', lastName: '', email: '', password: '', role: 'employee' },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            await api.post('/users', values);
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
                <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                    {form.formState.isSubmitting ? 'Dodawanie...' : 'Dodaj pracownika'}
                </Button>
            </form>
        </Form>
    );
}