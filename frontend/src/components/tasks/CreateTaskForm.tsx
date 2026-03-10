'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const formSchema = z.object({
    name: z.string().min(3, 'Nazwa musi mieć co najmniej 3 znaki.'),
    description: z.string().optional(),
});

interface CreateTaskFormProps {
    projectId: string;
    onSuccess: () => void;
}

export function CreateTaskForm({ projectId, onSuccess }: CreateTaskFormProps) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { name: '', description: '' },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            // ✅ POPRAWIONY ADRES URL
            await api.post(`/tasks/in-project/${projectId}`, values);
            toast.success('Sukces!', { description: 'Nowe zlecenie zostało dodane.' });
            onSuccess();
        } catch (error) {
            toast.error('Błąd', { description: 'Nie udało się dodać zlecenia.' });
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField name="name" render={({ field }) => ( <FormItem><FormLabel>Nazwa zlecenia</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField name="description" render={({ field }) => ( <FormItem><FormLabel>Opis (opcjonalnie)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                    Dodaj zlecenie
                </Button>
            </form>
        </Form>
    );
}