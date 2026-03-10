'use client';

import { useAuthStore } from '../../store/auth.store';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Link from 'next/link';

// Importujemy Sidebar (dla wersji mobilnej) oraz listę linków
import Sidebar, { navLinks } from './Sidebar';

export default function Header() {
    const { user, logout } = useAuthStore();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const getInitials = (firstName?: string, lastName?: string) => {
        if (!firstName || !lastName) return 'U';
        return `${firstName[0]}${lastName[0]}`.toUpperCase();
    };

    return (
        // Header jest teraz "przezroczysty" i dopasowuje się do tła
        <header className="p-4 py-6 lg:p-8 flex justify-between items-center">
            {/* Hamburger Menu widoczne tylko na mobile */}
            <div className="md:hidden">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0">
                        {/* Renderujemy Sidebar wewnątrz Sheet na mobile */}
                        <Sidebar isMobile={true} />
                    </SheetContent>
                </Sheet>
            </div>

            {/* Pusta przestrzeń po lewej na desktopie (na przyszłą wyszukiwarkę) */}
            <div className="hidden md:block">
                {/* <Input placeholder="Szukaj..." className="w-64" /> */}
            </div>

            {/* Menu użytkownika po prawej */}
            <div className="flex items-center gap-4 bg-[#fff]/65 px-4 py-2 rounded-full shadow-sm">
        <span className="text-sm text-gray-600">
          Witaj, <strong>{user?.first_name || 'Użytkowniku'}</strong>!
        </span>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                            <Avatar className="h-10 w-10 bg-[#fff]">
                                <AvatarImage src="" alt="Avatar" />
                                <AvatarFallback className="text-sm ">
                                    {getInitials(user?.first_name, user?.last_name)}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">
                                    {user?.first_name} {user?.last_name}
                                </p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {user?.email}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Wyloguj się</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}