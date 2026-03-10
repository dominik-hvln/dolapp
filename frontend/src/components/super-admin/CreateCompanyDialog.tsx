'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface CreateCompanyDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void; // Callback do odświeżenia listy po sukcesie
}

export function CreateCompanyDialog({ open, onOpenChange, onSuccess }: CreateCompanyDialogProps) {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        try {
            await api.post('/super-admin/companies', { name });
            toast.success('Firma została utworzona');
            setName(''); // Reset formularza
            onSuccess(); // Odśwież dane rodzica
            onOpenChange(false); // Zamknij modal
        } catch (error) {
            console.error(error);
            toast.error('Nie udało się utworzyć firmy');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Dodaj nową firmę</DialogTitle>
                        <DialogDescription>
                            Utwórz nową organizację w systemie. Później będziesz mógł przypisać do niej użytkowników.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Nazwa
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="col-span-3"
                                placeholder="Np. Acme Corp"
                                autoFocus
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Anuluj
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Tworzenie...' : 'Utwórz firmę'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}