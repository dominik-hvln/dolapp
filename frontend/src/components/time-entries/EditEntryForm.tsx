'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';

const formSchema = z.object({
    start_time: z.string().min(1, "Data rozpoczęcia jest wymagana."),
    end_time: z.string().nullable(),
    change_reason: z.string().min(5, { message: "Powód zmiany musi mieć co najmniej 5 znaków." }),
});

interface EditEntryFormProps {
    entry: { id: string; start_time: string; end_time: string | null };
    onSuccess: () => void;
}

const formatDateTimeLocal = (dateString: string | null) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        // Poprawka uwzględniająca strefę czasową użytkownika
        const timezoneOffset = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() - timezoneOffset);
        return localDate.toISOString().slice(0, 16);
    } catch (e) {
        return '';
    }
};

export function EditEntryForm({ entry, onSuccess }: EditEntryFormProps) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            start_time: formatDateTimeLocal(entry.start_time),
            end_time: formatDateTimeLocal(entry.end_time),
            change_reason: '', // Wartość początkowa
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const payload: { start_time?: string; end_time?: string | null; change_reason: string } = {
                start_time: values.start_time ? new Date(values.start_time).toISOString() : undefined,
                end_time: values.end_time ? new Date(values.end_time).toISOString() : null,
                change_reason: values.change_reason,
            };

            if (!values.end_time) {
                delete payload.end_time;
            }

            await api.patch(`/time-entries/${entry.id}`, payload);
            toast.success('Sukces!', { description: 'Wpis został zaktualizowany.' });
            onSuccess();
        } catch (error) {
            toast.error('Błąd', { description: 'Nie udało się zaktualizować wpisu.' });
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField name="start_time" render={({ field }) => ( <FormItem><FormLabel>Czas rozpoczęcia</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField name="end_time" render={({ field }) => ( <FormItem><FormLabel>Czas zakończenia</FormLabel><FormControl><Input type="datetime-local" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                <FormField
                    control={form.control}
                    name="change_reason"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Powód zmiany</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Np. korekta pomyłki w godzinach" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                    Zapisz zmiany
                </Button>
            </form>
        </Form>
    );
}