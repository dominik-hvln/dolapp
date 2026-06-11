'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface EmployeeCost {
    userId: string;
    firstName: string;
    lastName: string;
    hourlyRate: number;
    overtimeRate: number;
    regularMinutes: number;
    overtimeMinutes: number;
    regularCost: number;
    overtimeCost: number;
    totalCost: number;
}

interface LaborCostsData {
    dateFrom: string;
    dateTo: string;
    currency: string;
    totalCost: number;
    totalMinutes: number;
    totalOvertimeMinutes: number;
    employees: EmployeeCost[];
}

function formatMinutes(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return `${h}h ${m}m`;
}

function formatPln(value: number): string {
    return value.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' zł';
}

export function LaborCosts() {
    const [data, setData] = useState<LaborCostsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        api.get('/dashboard/labor-costs')
            .then((res) => setData(res.data))
            .catch(() => {})
            .finally(() => setIsLoading(false));
    }, []);

    return (
        <div className="glassmorphism-box p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Koszty pracy (bieżący miesiąc)</h2>
                {data && (
                    <div className="text-right">
                        <p className="text-2xl font-bold">{formatPln(data.totalCost)}</p>
                        <p className="text-xs text-muted-foreground">
                            {formatMinutes(data.totalMinutes)} łącznie, w tym {formatMinutes(data.totalOvertimeMinutes)} nadgodzin
                        </p>
                    </div>
                )}
            </div>
            {isLoading ? (
                <p className="text-muted-foreground">Ładowanie...</p>
            ) : !data || data.employees.length === 0 ? (
                <p className="text-sm text-muted-foreground">Brak danych o kosztach pracy.</p>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Pracownik</TableHead>
                            <TableHead>Czas pracy</TableHead>
                            <TableHead>Nadgodziny</TableHead>
                            <TableHead>Stawka</TableHead>
                            <TableHead className="text-right">Koszt</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.employees.map((e) => (
                            <TableRow key={e.userId}>
                                <TableCell className="font-medium">{e.firstName} {e.lastName}</TableCell>
                                <TableCell>{formatMinutes(e.regularMinutes)}</TableCell>
                                <TableCell>
                                    {e.overtimeMinutes > 0
                                        ? <span className="text-amber-600 font-medium">{formatMinutes(e.overtimeMinutes)}</span>
                                        : '-'}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {e.hourlyRate.toFixed(2)} / {e.overtimeRate.toFixed(2)} zł
                                </TableCell>
                                <TableCell className="text-right font-semibold">{formatPln(e.totalCost)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </div>
    );
}
