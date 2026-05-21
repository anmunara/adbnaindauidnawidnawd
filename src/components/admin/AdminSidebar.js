'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
    LayoutDashboard, Package, Ticket, ShoppingBag, LogOut,
    Crown, X, ChevronRight, ArrowLeft, Settings
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
    {
        href: '/dashboard/cloudphone',
        label: 'Analytics',
        icon: LayoutDashboard,
        exact: true,
        description: 'Overview & insights'
    },
    {
        href: '/dashboard/cloudphone/types',
        label: 'Types',
        icon: Package,
        description: 'Manage product types'
    },
    {
        href: '/dashboard/cloudphone/codes',
        label: 'Codes',
        icon: Ticket,
        description: 'Redeem code inventory'
    },
    {
        href: '/dashboard/cloudphone/orders',
        label: 'Orders',
        icon: ShoppingBag,
        description: 'Customer transactions'
    },
];

export function AdminSidebar({ open, onClose }) {
    const pathname = usePathname();
    const { data: session } = useSession();

    return (
        <>
            {/* Mobile overlay backdrop */}
            <div
                className={cn(
                    "fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity lg:hidden",
                    open ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed top-0 left-0 z-50 h-screen w-72 transform transition-transform duration-300 lg:translate-x-0",
                    open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                <div className="relative h-full flex flex-col bg-surface border-r border-border">
                    <div className="absolute top-0 -right-0 w-px h-full bg-gradient-to-b from-brand-500/0 via-brand-500/20 to-brand-500/0" />

                    {/* Logo */}
                    <div className="px-6 py-6 border-b border-border flex items-center justify-between">
                        <Link href="/dashboard/cloudphone" className="flex items-center gap-3 group">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/30 group-hover:scale-110 transition-transform">
                                    <Crown className="w-5 h-5 text-white" />
                                </div>
                                <div className="absolute inset-0 rounded-xl bg-brand-500 blur-xl opacity-30 group-hover:opacity-60 transition-opacity" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-base font-display font-black tracking-tight">
                                    KingBlox
                                </span>
                                <span className="text-[10px] text-brand-500 font-semibold tracking-widest uppercase -mt-0.5">
                                    Admin Panel
                                </span>
                            </div>
                        </Link>

                        <button
                            onClick={onClose}
                            aria-label="Close sidebar"
                            className="lg:hidden w-8 h-8 rounded-lg glass-light flex items-center justify-center hover:border-brand-500/40 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Nav */}
                    <nav className="flex-1 px-3 py-4 overflow-y-auto">
                        <div className="space-y-1">
                            {NAV_ITEMS.map((item) => {
                                const isActive = item.exact
                                    ? pathname === item.href
                                    : pathname?.startsWith(item.href);

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={onClose}
                                        className={cn(
                                            "group relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200",
                                            isActive
                                                ? "bg-brand-500/10 text-brand-500 border border-brand-500/20"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all",
                                                isActive
                                                    ? "bg-brand-500/20"
                                                    : "bg-muted/50 group-hover:bg-muted"
                                            )}
                                        >
                                            <item.icon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-semibold leading-tight">
                                                {item.label}
                                            </div>
                                            <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                                                {item.description}
                                            </div>
                                        </div>
                                        {isActive && (
                                            <ChevronRight className="w-4 h-4 text-brand-500 flex-shrink-0" />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>

                        <div className="mt-6 pt-4 border-t border-border space-y-1">
                            <Link
                                href="/"
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors group"
                            >
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                                <span>Kembali ke Website</span>
                            </Link>
                        </div>
                    </nav>

                    {/* User footer */}
                    <div className="px-3 py-3 border-t border-border">
                        <div className="glass-light rounded-2xl p-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                    {session?.user?.name?.[0]?.toUpperCase() || 'A'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold truncate">
                                        {session?.user?.name || 'Admin'}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground truncate">
                                        {session?.user?.email || 'admin@kingblox.id'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => signOut({ callbackUrl: '/' })}
                                    aria-label="Sign out"
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors flex-shrink-0"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                                <span className="text-[11px] text-muted-foreground">Tema</span>
                                <ThemeToggle />
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
