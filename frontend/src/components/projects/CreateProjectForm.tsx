// src/components/projects/CreateProjectForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { api, getApiErrorMessage } from '@/lib/api';
import { toast } from 'sonner';

const formSchema = z.object({
    name: z.string().min(3, { message: 'Nazwa musi mieć co najmniej 3 znaki.' }),
    description: z.string().optional(),
});

interface CreateProjectFormProps {
    onProjectCreated: () => void;
}

export function CreateProjectForm({ onProjectCreated }: CreateProjectFormProps) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { name: '', description: '' },
    });

    const projectName = form.watch('name').trim();

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            await api.post('/projects', values);
            toast.success('Sukces!', {
                description: 'Nowy projekt został pomyślnie utworzony.',
            });
            onProjectCreated();
        } catch (error) {
            const description = getApiErrorMessage(error, 'Nie udało się utworzyć projektu.');

            toast.error('Błąd', {
                description: description,
            });
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nazwa projektu</FormLabel>
                            <FormControl>
                                <Input placeholder="Np. Projekt nowej strony" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <p className="text-sm text-muted-foreground">
                    {projectName
                        ? `Automatycznie utworzymy też projekt „${projectName} nadgodziny”, który pracownik dostaje po przepracowaniu swojego limitu godzin.`
                        : 'Automatycznie utworzymy też projekt nadgodzin, który pracownik dostaje po przepracowaniu swojego limitu godzin.'}
                </p>
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Opis (opcjonalnie)</FormLabel>
                            <FormControl>
                                <Input placeholder="Krótki opis projektu" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Zapisywanie...' : 'Zapisz'}
                </Button>
            </form>
        </Form>
    );
}