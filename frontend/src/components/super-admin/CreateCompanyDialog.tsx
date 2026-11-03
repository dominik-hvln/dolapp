'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { superAdminApi, getApiErrorMessage } from '@/lib/api';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';

const schema = z.object({
    name: z.string().trim().min(1, 'Podaj nazwę podmiotu.'),
    createAdmin: z.boolean(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    password: z.string(),
}).superRefine((values, ctx) => {
    if (!values.createAdmin) return;
    for (const key of ['firstName', 'lastName'] as const) {
        if (!values[key].trim()) ctx.addIssue({ code: 'custom', path: [key], message: 'To pole jest wymagane.' });
    }
    if (!z.email().safeParse(values.email.trim()).success) ctx.addIssue({ code: 'custom', path: ['email'], message: 'Podaj poprawny adres e-mail.' });
    if (values.password.length < 8) ctx.addIssue({ code: 'custom', path: ['password'], message: 'Hasło musi mieć co najmniej 8 znaków.' });
});

interface CreateCompanyDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function CreateCompanyDialog({ open, onOpenChange, onSuccess }: CreateCompanyDialogProps) {
    const form = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: { name: '', createAdmin: true, firstName: '', lastName: '', email: '', password: '' },
    });
    const createAdmin = form.watch('createAdmin');

    const submit = async (values: z.infer<typeof schema>) => {
        try {
            await superAdminApi.createCompany({
                name: values.name,
                ...(values.createAdmin ? { admin: { firstName: values.firstName.trim(), lastName: values.lastName.trim(), email: values.email.trim(), password: values.password } } : {}),
            });
            toast.success('Podmiot został utworzony');
            form.reset();
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            toast.error(getApiErrorMessage(error, 'Nie udało się utworzyć podmiotu.'));
        }
    };

    return (
        <Dialog open={open} onOpenChange={(value) => { if (!form.formState.isSubmitting) onOpenChange(value); }}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Dodaj podmiot</DialogTitle></DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>Nazwa podmiotu</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="createAdmin" render={({ field }) => (
                            <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value} onCheckedChange={(value) => field.onChange(value === true)} /></FormControl><FormLabel>Utwórz administratora podmiotu</FormLabel></FormItem>
                        )} />
                        {createAdmin && (['firstName', 'lastName', 'email', 'password'] as const).map((name) => (
                            <FormField key={name} control={form.control} name={name} render={({ field }) => (
                                <FormItem><FormLabel>{{ firstName: 'Imię', lastName: 'Nazwisko', email: 'E-mail', password: 'Hasło' }[name]}</FormLabel><FormControl><Input {...field} type={name === 'password' ? 'password' : name === 'email' ? 'email' : 'text'} autoComplete={name === 'password' ? 'new-password' : undefined} /></FormControl><FormMessage /></FormItem>
                            )} />
                        ))}
                        <DialogFooter>
                            <Button type="button" variant="outline" disabled={form.formState.isSubmitting} onClick={() => onOpenChange(false)}>Anuluj</Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'Tworzenie...' : 'Utwórz podmiot'}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
