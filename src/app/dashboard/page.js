'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import {
  User, Mail, Shield, LogOut, Settings, ShoppingBag, History,
  Sparkles, Crown, Star, TrendingUp, Package, ChevronRight, Bell, Activity
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Container } from '@/components/ui/container';
import { AnimatedBg } from '@/components/ui/animated-bg';
import { Spotlight } from '@/components/ui/spotlight';
import { cn } from '@/lib/utils';

export default function Dashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/login');
        if (session?.user?.email) {
            fetch('/api/user/check-admin')
                .then(r => r.json())
                .then(d => setIsAdmin(d.isAdmin || false))
                .catch(() => {});
        }
    }, [session, status, router]);

    if (status === 'loading' || !session) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="spinner text-brand-500" />
            </div>
        );
    }

    const userName = session.user?.name || session.user?.email?.split('@')[0] || 'User';
    const initials = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="pt-28 pb-20 relative">
                <AnimatedBg variant="orbs" className="opacity-40" />
                <Container>
                    {/* Welcome Header */}
                    <Card variant="glass" padding="lg" className="mb-8 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-display font-black text-xl md:text-2xl shadow-glow-md">
                                        {initials}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-4 border-background flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Sparkles className="w-3 h-3 text-brand-500" />
                                        <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Welcome back</span>
                                    </div>
                                    <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight">
                                        Hai, <span className="gradient-text">{userName.split(' ')[0]}</span>
                                    </h1>
                                    <p className="text-sm text-muted-foreground mt-0.5">{session.user?.email}</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {isAdmin && (
                                    <Link href="/dashboard/cloudphone">
                                        <Button variant="outline" size="md">
                                            <Crown className="w-4 h-4 text-amber-500" />
                                            Admin Panel
                                        </Button>
                                    </Link>
                                )}
                                <Link href="/profile">
                                    <Button variant="primary" size="md">
                                        <Settings className="w-4 h-4" />
                                        Edit Profil
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </Card>

                    {/* Quick Stats - Bento Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {[
                            { icon: ShoppingBag, label: 'Total Pesanan', value: '0', color: 'text-blue-500', bg: 'bg-blue-500/10' },
                            { icon: History, label: 'Aktif', value: '0', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                            { icon: Star, label: 'Poin Reward', value: '0', color: 'text-amber-500', bg: 'bg-amber-500/10' },
                            { icon: TrendingUp, label: 'Hemat', value: 'Rp 0', color: 'text-purple-500', bg: 'bg-purple-500/10' },
                        ].map((stat, i) => (
                            <Spotlight key={i} className="rounded-2xl">
                                <Card variant="default" hover="lift" padding="md" className="h-full">
                                    <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center mb-3", stat.bg)}>
                                        <stat.icon className={cn("w-5 h-5", stat.color)} />
                                    </div>
                                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">{stat.label}</p>
                                    <p className="text-2xl md:text-3xl font-display font-black">{stat.value}</p>
                                </Card>
                            </Spotlight>
                        ))}
                    </div>

                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Account Info */}
                        <Card variant="default" padding="lg" className="lg:col-span-2">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
                                    <User className="w-5 h-5 text-brand-500" />
                                </div>
                                <div>
                                    <h2 className="font-display font-bold text-lg">Informasi Akun</h2>
                                    <p className="text-xs text-muted-foreground">Detail akun KingBlox kamu</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-xs text-muted-foreground">Email</p>
                                            <p className="font-semibold text-sm truncate">{session.user?.email}</p>
                                        </div>
                                    </div>
                                    <Badge variant="success">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        Verified
                                    </Badge>
                                </div>

                                <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Shield className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-xs text-muted-foreground">User ID</p>
                                            <p className="font-mono text-xs truncate">{session.user?.id}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50">
                                    <div className="flex items-center gap-3">
                                        <Activity className="w-4 h-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Status</p>
                                            <p className="font-semibold text-sm">Aktif</p>
                                        </div>
                                    </div>
                                    <Badge variant="success">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Online
                                    </Badge>
                                </div>
                            </div>
                        </Card>

                        {/* Quick Actions */}
                        <Card variant="default" padding="lg">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-brand-500" />
                                </div>
                                <div>
                                    <h2 className="font-display font-bold text-lg">Quick Actions</h2>
                                    <p className="text-xs text-muted-foreground">Akses cepat</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {[
                                    { href: '/product/redfinger', icon: Package, label: 'Beli Produk', desc: 'Cloud Phone' },
                                    { href: '/cart', icon: ShoppingBag, label: 'Keranjang', desc: 'Lihat item' },
                                    { href: '/profile', icon: User, label: 'Profil', desc: 'Edit akun' },
                                    { href: '/faq', icon: Bell, label: 'FAQ', desc: 'Bantuan' },
                                ].map((action, i) => (
                                    <Link
                                        key={i}
                                        href={action.href}
                                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-all duration-200 group"
                                    >
                                        <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center group-hover:bg-brand-500/10 transition-colors">
                                            <action.icon className="w-4 h-4 text-muted-foreground group-hover:text-brand-500 transition-colors" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm">{action.label}</p>
                                            <p className="text-xs text-muted-foreground">{action.desc}</p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                                    </Link>
                                ))}

                                <div className="border-t border-border pt-3 mt-3">
                                    <button
                                        onClick={() => signOut()}
                                        className="flex items-center gap-3 p-3 w-full rounded-xl hover:bg-red-500/10 transition-all group"
                                    >
                                        <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center">
                                            <LogOut className="w-4 h-4 text-red-500" />
                                        </div>
                                        <span className="font-semibold text-sm text-red-500">Keluar</span>
                                    </button>
                                </div>
                            </div>
                        </Card>
                    </div>
                </Container>
            </main>
            <Footer />
        </div>
    );
}
