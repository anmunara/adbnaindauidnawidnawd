'use client';

import { useState, useEffect, memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, User, History, Settings, LogOut, Menu, X, Crown, ChevronDown, LayoutDashboard } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function Navbar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);

    useEffect(() => {
        const updateCartCount = () => {
            const cart = JSON.parse(localStorage.getItem('kingblox_cart') || '[]');
            setCartCount(cart.reduce((a, b) => a + b.quantity, 0));
        };
        updateCartCount();
        window.addEventListener('storage', updateCartCount);
        const interval = setInterval(updateCartCount, 1000);
        return () => {
            window.removeEventListener('storage', updateCartCount);
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (session?.user?.email) {
            checkAdminStatus();
        }
    }, [session]);

    useEffect(() => {
        setMobileMenuOpen(false);
        setIsProfileOpen(false);
    }, [pathname]);

    const checkAdminStatus = async () => {
        try {
            const res = await fetch('/api/user/check-admin');
            const data = await res.json();
            setIsAdmin(data.isAdmin || false);
        } catch (error) {
            console.error('Error checking admin status:', error);
        }
    };

    const navLinks = [
        { href: '/', label: 'Beranda' },
        { href: '/product/redfinger', label: 'Produk' },
        { href: '/cara-pemesanan', label: 'Cara Pesan' },
        { href: '/faq', label: 'FAQ' },
    ];

    return (
        <>
            <nav className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
                scrolled
                    ? 'backdrop-blur-2xl bg-background/70 border-b border-border shadow-sm'
                    : 'bg-transparent'
            )}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-16 sm:h-20">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2 sm:gap-3 group min-w-0">
                            <div className="relative flex-shrink-0">
                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-brand-500/30">
                                    <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                </div>
                                <div className="absolute inset-0 rounded-xl bg-brand-500 blur-xl opacity-30 group-hover:opacity-60 transition-opacity" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-lg sm:text-xl font-display font-black tracking-tight gradient-text-white truncate">
                                    KingBlox
                                </span>
                                <span className="hidden xs:block text-[10px] text-muted-foreground tracking-widest -mt-1 uppercase truncate">Premium Store</span>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden lg:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
                            {navLinks.map((link) => {
                                const isActive = pathname === link.href;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={cn(
                                            "relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                                            isActive
                                                ? "text-foreground"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {isActive && (
                                            <span className="absolute inset-0 rounded-xl bg-brand-500/10 border border-brand-500/20" />
                                        )}
                                        <span className="relative">{link.label}</span>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Right Side */}
                        <div className="flex items-center gap-2 md:gap-3">
                            <ThemeToggle />

                            <Link
                                href="/cart"
                                aria-label="Shopping cart"
                                className="relative w-10 h-10 rounded-xl glass-light flex items-center justify-center hover:border-brand-500/40 hover:scale-105 transition-all duration-300 group"
                            >
                                <ShoppingCart className="w-4 h-4 text-foreground group-hover:text-brand-500 transition-colors" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-glow-sm animate-scale-in">
                                        {cartCount > 9 ? '9+' : cartCount}
                                    </span>
                                )}
                            </Link>

                            {session ? (
                                <div className="relative">
                                    <button
                                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                                        className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl glass-light hover:border-brand-500/40 transition-all duration-300 group"
                                    >
                                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                                            <User className="w-3.5 h-3.5 text-white" />
                                        </div>
                                        <span className="hidden sm:block text-xs font-semibold text-foreground max-w-[100px] truncate">
                                            {session.user?.name?.split(' ')[0] || 'User'}
                                        </span>
                                        <ChevronDown className={cn(
                                            "w-3 h-3 text-muted-foreground transition-transform duration-300 hidden sm:block",
                                            isProfileOpen && "rotate-180"
                                        )} />
                                    </button>

                                    {isProfileOpen && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-40"
                                                onClick={() => setIsProfileOpen(false)}
                                            />
                                            <div className="absolute right-0 mt-3 w-64 z-50 animate-scale-in origin-top-right">
                                                <div className="glass-strong bg-surface/95 rounded-2xl shadow-2xl overflow-hidden">
                                                    <div className="p-4 border-b border-border bg-gradient-to-br from-brand-500/5 to-transparent">
                                                        <p className="font-bold text-foreground truncate">{session.user?.name}</p>
                                                        <p className="text-xs text-muted-foreground truncate mt-0.5">{session.user?.email}</p>
                                                    </div>
                                                    <div className="p-2">
                                                        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors group">
                                                            <LayoutDashboard className="w-4 h-4 text-muted-foreground group-hover:text-brand-500 transition-colors" />
                                                            <span className="text-sm text-foreground">Dashboard</span>
                                                        </Link>
                                                        <Link href="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors group">
                                                            <User className="w-4 h-4 text-muted-foreground group-hover:text-brand-500 transition-colors" />
                                                            <span className="text-sm text-foreground">Profil</span>
                                                        </Link>
                                                        {isAdmin && (
                                                            <Link href="/dashboard/cloudphone" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-amber-500/10 transition-colors">
                                                                <Settings className="w-4 h-4 text-amber-500" />
                                                                <span className="text-sm text-amber-500 font-medium">Admin Panel</span>
                                                            </Link>
                                                        )}
                                                    </div>
                                                    <div className="p-2 border-t border-border">
                                                        <button
                                                            onClick={() => signOut()}
                                                            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 text-red-500 transition-colors"
                                                        >
                                                            <LogOut className="w-4 h-4" />
                                                            <span className="text-sm font-medium">Keluar</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <Link href="/login" className="hidden sm:block">
                                    <Button variant="primary" size="sm">
                                        <User className="w-4 h-4" />
                                        Masuk
                                    </Button>
                                </Link>
                            )}

                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                aria-label="Toggle menu"
                                className="lg:hidden w-10 h-10 rounded-xl glass-light flex items-center justify-center"
                            >
                                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            <div className={cn(
                "lg:hidden fixed inset-0 z-40 transition-all duration-500",
                mobileMenuOpen ? "visible opacity-100" : "invisible opacity-0"
            )}>
                <div
                    className="absolute inset-0 bg-background/80 backdrop-blur-xl"
                    onClick={() => setMobileMenuOpen(false)}
                />
                <div className={cn(
                    "absolute top-20 left-0 right-0 px-6 transition-all duration-500",
                    mobileMenuOpen ? "translate-y-0 opacity-100" : "-translate-y-8 opacity-0"
                )}>
                    <div className="glass-strong bg-surface/95 rounded-3xl p-4 shadow-2xl">
                        <div className="space-y-1">
                            {navLinks.map((link, i) => {
                                const isActive = pathname === link.href;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        style={{ animationDelay: `${i * 50}ms` }}
                                        className={cn(
                                            "block px-5 py-4 rounded-2xl font-medium transition-all animate-fade-in-up",
                                            isActive
                                                ? "bg-brand-500/10 text-brand-500 border border-brand-500/20"
                                                : "text-foreground hover:bg-muted"
                                        )}
                                    >
                                        {link.label}
                                    </Link>
                                );
                            })}
                        </div>
                        {!session && (
                            <Link href="/login" className="block mt-3">
                                <Button variant="primary" className="w-full" size="lg">
                                    <User className="w-4 h-4" />
                                    Masuk Sekarang
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default memo(Navbar);
