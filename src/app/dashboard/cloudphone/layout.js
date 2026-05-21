'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

const AdminLayoutContext = createContext({ openSidebar: () => {} });

export function useAdminLayout() {
    return useContext(AdminLayoutContext);
}

export default function AdminLayout({ children }) {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
        if (status === 'loading') return;
        if (!session) {
            router.replace('/login');
            return;
        }

        const checkAdmin = async () => {
            try {
                const res = await fetch('/api/user/check-admin');
                const data = await res.json();
                if (!data.isAdmin) {
                    router.replace('/dashboard');
                    return;
                }
                setAuthChecked(true);
            } catch {
                router.replace('/');
            }
        };
        checkAdmin();
    }, [session, status, router]);

    if (!authChecked) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="inline-flex w-12 h-12 rounded-2xl bg-brand-500/10 items-center justify-center animate-pulse">
                        <div className="w-6 h-6 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
                    </div>
                    <p className="text-sm text-muted-foreground">Memverifikasi akses admin...</p>
                </div>
            </div>
        );
    }

    return (
        <AdminLayoutContext.Provider value={{ openSidebar: () => setSidebarOpen(true) }}>
            <div className="min-h-screen bg-background text-foreground">
                <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <div className="lg:pl-72">
                    <div className="min-h-screen flex flex-col">
                        {children}
                    </div>
                </div>
            </div>
        </AdminLayoutContext.Provider>
    );
}
