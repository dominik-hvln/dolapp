'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, Users, Search, RefreshCcw, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { CreateCompanyDialog } from '@/components/super-admin/CreateCompanyDialog';
import { CreateUserDialog } from '@/components/super-admin/CreateUserDialog';

interface Company {
    id: string;
    name: string | null;
    created_at: string;
}

interface User {
    id: string;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
    role: string | null;
    company_id: string | null;
    created_at: string;
}

export default function SuperAdminPage() {
    const [activeTab, setActiveTab] = useState<'companies' | 'users'>('companies');
    const [companies, setCompanies] = useState<Company[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateCompanyOpen, setIsCreateCompanyOpen] = useState(false);
    const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);

    // Funkcja pobierająca dane
    const fetchData = async () => {
        setLoading(true);
        try {
            const results = await Promise.allSettled([
                api.get<Company[]>('/super-admin/companies'),
                api.get<User[]>('/super-admin/users')
            ]);

            if (results[0].status === 'fulfilled') {
                setCompanies(results[0].value.data);
            } else {
                console.error('Błąd firm:', results[0].reason);
                toast.error('Nie udało się pobrać listy firm');
            }

            if (results[1].status === 'fulfilled') {
                setUsers(results[1].value.data);
            } else {
                console.error('Błąd userów:', results[1].reason);
                // Nie wyświetlamy błędu userowi od razu, żeby nie straszyć przy pustej bazie
            }
        } catch (error) {
            console.error('Krytyczny błąd:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // ✅ Bezpieczne filtrowanie
    const getFilteredData = () => {
        const lowerSearch = searchTerm.toLowerCase();

        if (activeTab === 'companies') {
            return companies.filter(c =>
                (c.name || '').toLowerCase().includes(lowerSearch) ||
                c.id.toLowerCase().includes(lowerSearch)
            );
        } else {
            return users.filter(u =>
                (u.email || '').toLowerCase().includes(lowerSearch) ||
                (u.last_name || '').toLowerCase().includes(lowerSearch) ||
                (u.first_name || '').toLowerCase().includes(lowerSearch)
            );
        }
    };

    const filteredData = getFilteredData();

    return (
        <div className="p-6 space-y-6 h-full flex flex-col">
            {/* Nagłówek */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Panel Super Admina</h1>
                    <p className="text-muted-foreground">Zarządzanie globalne systemem SaaS.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
                        <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button onClick={() => activeTab === 'companies' ? setIsCreateCompanyOpen(true) : setIsCreateUserOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        {activeTab === 'companies' ? 'Dodaj Firmę' : 'Dodaj Usera'}
                    </Button>
                </div>
            </div>

            {/* Karty Statystyk */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Liczba Firm</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{companies.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Liczba Użytkowników</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{users.length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Kontrolki (Tabs + Search) */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b pb-4">
                <div className="flex p-1 bg-muted rounded-lg">
                    <button
                        onClick={() => setActiveTab('companies')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                            activeTab === 'companies' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Firmy
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                            activeTab === 'users' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Użytkownicy
                    </button>
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={activeTab === 'companies' ? "Szukaj firmy..." : "Szukaj po nazwisku lub email..."}
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Główna Tabela Danych */}
            <Card className="flex-1 overflow-hidden">
                <div className="h-full overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {activeTab === 'companies' ? (
                                    <>
                                        <TableHead>Nazwa Firmy</TableHead>
                                        <TableHead>Data Utworzenia</TableHead>
                                        <TableHead>ID</TableHead>
                                        <TableHead className="text-right">Akcje</TableHead>
                                    </>
                                ) : (
                                    <>
                                        <TableHead>Użytkownik</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Rola</TableHead>
                                        <TableHead>Firma (ID)</TableHead>
                                        <TableHead className="text-right">Akcje</TableHead>
                                    </>
                                )}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* WIDOK FIRM */}
                            {activeTab === 'companies' && (filteredData as Company[]).map((company) => (
                                <TableRow key={company.id}>
                                    <TableCell className="font-medium">{company.name || <span className="text-muted-foreground italic">Bez nazwy</span>}</TableCell>
                                    <TableCell>{new Date(company.created_at).toLocaleDateString('pl-PL')}</TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground">{company.id}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm">Edytuj</Button>
                                    </TableCell>
                                </TableRow>
                            ))}

                            {/* WIDOK UŻYTKOWNIKÓW */}
                            {activeTab === 'users' && (filteredData as User[]).map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">
                                        {user.first_name || user.last_name
                                            ? `${user.first_name || ''} ${user.last_name || ''}`
                                            : <span className="text-muted-foreground italic">Brak danych</span>}
                                    </TableCell>
                                    <TableCell>{user.email || <span className="text-red-400 text-xs">Brak email</span>}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === 'super_admin' ? 'destructive' : 'secondary'}>
                                            {user.role || 'brak roli'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                        {user.company_id ? user.company_id.slice(0, 8) + '...' : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm">Edytuj</Button>
                                    </TableCell>
                                </TableRow>
                            ))}

                            {filteredData.length === 0 && (
                                <TableRow>
                                    {/* ✅ POPRAWKA: Używamy &quot; zamiast " dla lintera */}
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        Brak wyników dla &quot;{searchTerm}&quot;
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
            <CreateCompanyDialog
                open={isCreateCompanyOpen}
                onOpenChange={setIsCreateCompanyOpen}
                onSuccess={fetchData}
            />
            <CreateUserDialog
                open={isCreateUserOpen}
                onOpenChange={setIsCreateUserOpen}
                onSuccess={fetchData}
            />
        </div>
    );
}