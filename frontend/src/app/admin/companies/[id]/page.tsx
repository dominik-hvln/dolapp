'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Szczegóły z planem i modułami są ukryte (brief klienta) - wszystko o podmiocie jest na liście podmiotów.
export default function CompanyDetailsPage() {
    const router = useRouter();
    useEffect(() => { router.replace('/admin/companies'); }, [router]);
    return null;
}
