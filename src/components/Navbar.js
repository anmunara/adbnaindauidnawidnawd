'use client';

import { useState, useEffect, memo } from 'react';
import Link from 'next/link';
import { ShoppingCart, User, History, Settings, LogOut, Menu, X, Crown } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';

function Navbar() {
    const { data: session } = useSession();
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
    ];

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            scrolled 
                ? 'bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/10' 
                : 'bg-transparent'
        }`}>
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Crown className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                            KingBlox
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center gap-4">
                        {/* Cart */}
                        <Link 
                            href="/cart" 
                            className="relative p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                        >
                            <ShoppingCart className="w-5 h-5 text-gray-300" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                    {cartCount > 9 ? '9+' : cartCount}
                                </span>
                            )}
                        </Link>

                        {/* Auth */}
                        {session ? (
                            <div className="relative">
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center">
                                        <User className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="hidden sm:block text-sm font-medium text-gray-300">
                                        {session.user?.name?.split(' ')[0] || 'User'}
                                    </span>
                                </button>

                                {/* Dropdown */}
                                {isProfileOpen && (
                                    <div className="absolute right-0 mt-3 w-64 bg-[#141419] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                                        <div className="p-4 border-b border-white/10">
                                            <p className="font-semibold text-white">{session.user?.name}</p>
                                            <p className="text-sm text-gray-500 truncate">{session.user?.email}</p>
                                        </div>
                                        <div className="p-2">
                                            <Link href="/history" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors">
                                                <History className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-300">Riwayat</span>
                                            </Link>
                                            <Link href="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors">
                                                <User className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-300">Profil</span>
                                            </Link>
                                            {isAdmin && (
                                                <Link href="/dashboard/cloudphone" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-amber-500/10 transition-colors">
                                                    <Settings className="w-4 h-4 text-amber-400" />
                                                    <span className="text-sm text-amber-400">Admin</span>
                                                </Link>
                                            )}
                                        </div>
                                        <div className="p-2 border-t border-white/10">
                                            <button
                                                onClick={() => signOut()}
                                                className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 text-red-400 transition-colors"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                <span className="text-sm">Keluar</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl font-medium transition-all"
                            >
                                <User className="w-4 h-4" />
                                <span className="hidden sm:block">Masuk</span>
                            </Link>
                        )}

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2.5 rounded-xl bg-white/5 border border-white/10"
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-white/10">
                    <div className="px-6 py-4 space-y-2">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className="block px-4 py-3 rounded-xl hover:bg-white/5 text-gray-300"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </nav>
    );
}

export default memo(Navbar);
