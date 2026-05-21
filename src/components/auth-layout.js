'use client';

import Link from 'next/link';
import { Crown, Shield, Zap, Star, ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export function AuthLayout({ children, title, subtitle, showBack = false }) {
    return (
        <div className="min-h-screen flex bg-background">
            {/* Left side - Branding (Desktop only) */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-950">
                {/* Animated gradient orbs */}
                <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-400 rounded-full blur-[120px] opacity-40 animate-float" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-500 rounded-full blur-[120px] opacity-30 animate-float" style={{ animationDelay: '2s' }} />
                </div>

                {/* Grid pattern overlay */}
                <div className="absolute inset-0 grid-bg opacity-30" />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between p-12 w-full text-white">
                    <Link href="/" className="inline-flex items-center gap-3 group w-fit">
                        <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Crown className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-xl font-display font-black">KingBlox</p>
                            <p className="text-[10px] text-white/60 tracking-widest uppercase -mt-0.5">Premium Store</p>
                        </div>
                    </Link>

                    <div className="space-y-8">
                        <div>
                            <h1 className="text-5xl xl:text-6xl font-display font-black leading-tight mb-4 text-balance">
                                Marketplace digital untuk para pro.
                            </h1>
                            <p className="text-lg text-white/80 max-w-md">
                                Bergabung dengan 50,000+ pengguna yang telah memilih KingBlox sebagai partner digital mereka.
                            </p>
                        </div>

                        <div className="space-y-3">
                            {[
                                { icon: Zap, text: 'Setup instant, kurang dari 1 menit' },
                                { icon: Shield, text: 'Transaksi aman & terenkripsi' },
                                { icon: Star, text: 'Rating 4.9/5 dari ribuan pengguna' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                                        <item.icon className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm">{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-white/60">
                        <div className="flex -space-x-2">
                            {['A', 'B', 'C', 'D'].map((l, i) => (
                                <div key={i} className="w-7 h-7 rounded-full bg-white/20 border-2 border-brand-700 flex items-center justify-center text-[10px] font-bold">
                                    {l}
                                </div>
                            ))}
                        </div>
                        <span>50,000+ pengguna terdaftar</span>
                    </div>
                </div>
            </div>

            {/* Right side - Form */}
            <div className="flex-1 flex flex-col">
                {/* Mobile/Top bar */}
                <div className="flex items-center justify-between p-4 sm:p-6">
                    <Link href="/" className="lg:hidden inline-flex items-center gap-2 group">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/30">
                            <Crown className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-display font-black text-lg">KingBlox</span>
                    </Link>
                    <div className="lg:ml-auto flex items-center gap-2">
                        {showBack && (
                            <Link href="/login" className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-muted-foreground hover:text-foreground transition-colors text-sm">
                                <ArrowLeft className="w-4 h-4" />
                                <span className="hidden sm:inline">Login</span>
                            </Link>
                        )}
                        <ThemeToggle />
                    </div>
                </div>

                {/* Form Content */}
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="w-full max-w-md">
                        <div className="text-center lg:text-left mb-8">
                            <h2 className="text-3xl md:text-4xl font-display font-black tracking-tight mb-2">
                                {title}
                            </h2>
                            {subtitle && (
                                <p className="text-muted-foreground">{subtitle}</p>
                            )}
                        </div>
                        {children}
                    </div>
                </div>

                {/* Bottom decoration on mobile */}
                <div className="lg:hidden p-6 pt-0">
                    <div className="text-center text-xs text-muted-foreground">
                        © 2026 KingBlox. All rights reserved.
                    </div>
                </div>
            </div>
        </div>
    );
}
