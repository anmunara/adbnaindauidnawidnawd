'use client';

import Link from 'next/link';
import { Crown, Mail, Phone, MessageCircle, Send, Shield, Zap, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const PAYMENT_METHODS = [
    { name: 'QRIS', image: 'https://is3.cloudhost.id/carenindonesia/bisacash/qr.png' },
    { name: 'Dana', image: 'https://is3.cloudhost.id/carenindonesia/bisacash/dana.jpg' },
    { name: 'OVO', image: 'https://is3.cloudhost.id/carenindonesia/bisacash/ovo.png' },
    { name: 'ShopeePay', image: 'https://is3.cloudhost.id/carenindonesia/bisacash/shp.jpg' },
];

const FOOTER_LINKS = {
    produk: [
        { label: 'Cloud Phone', href: '/product/redfinger' },
        { label: 'Game Top Up', href: '#' },
        { label: 'Voucher Digital', href: '#' },
    ],
    bantuan: [
        { label: 'Cara Pemesanan', href: '/cara-pemesanan' },
        { label: 'Syarat & Ketentuan', href: '/syarat-ketentuan' },
        { label: 'Kebijakan Privasi', href: '/kebijakan-privasi' },
        { label: 'FAQ', href: '/faq' },
    ],
};

const TRUST_BADGES = [
    { icon: Shield, label: 'Pembayaran Aman' },
    { icon: Zap, label: 'Proses Otomatis' },
    { icon: Heart, label: 'Support 24/7' },
];

export default function Footer() {
    return (
        <footer className="relative bg-surface border-t border-border overflow-hidden">
            {/* Decorative gradient */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-brand-500/10 rounded-full blur-[100px] pointer-events-none" />

            {/* Trust Badges */}
            <div className="relative border-b border-border">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {TRUST_BADGES.map((badge, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-center gap-3 p-4 rounded-2xl glass-light hover:border-brand-500/30 transition-all duration-300"
                            >
                                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
                                    <badge.icon className="w-5 h-5 text-brand-500" />
                                </div>
                                <span className="font-semibold text-foreground">{badge.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Footer */}
            <div className="relative max-w-7xl mx-auto px-6 py-16">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
                    {/* Brand */}
                    <div className="col-span-2 lg:col-span-1">
                        <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/30 group-hover:scale-105 transition-transform">
                                    <Crown className="w-5 h-5 text-white" />
                                </div>
                                <div className="absolute inset-0 rounded-xl bg-brand-500 blur-xl opacity-30" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl font-display font-black tracking-tight gradient-text-white">
                                    KingBlox
                                </span>
                                <span className="text-[10px] text-muted-foreground tracking-widest -mt-1 uppercase">Premium Store</span>
                            </div>
                        </Link>
                        <p className="text-muted-foreground text-sm leading-relaxed mb-6 max-w-xs">
                            Platform digital terpercaya untuk cloud phone & game top-up dengan proses otomatis 24/7.
                        </p>
                        <div className="flex gap-2">
                            <a
                                href="mailto:support@kingblox.id"
                                aria-label="Email"
                                className="w-10 h-10 rounded-xl glass-light flex items-center justify-center hover:border-brand-500/40 hover:scale-105 transition-all duration-300 group"
                            >
                                <Mail className="w-4 h-4 text-muted-foreground group-hover:text-brand-500 transition-colors" />
                            </a>
                            <a
                                href="https://wa.me/6281234567890"
                                aria-label="WhatsApp"
                                className="w-10 h-10 rounded-xl glass-light flex items-center justify-center hover:border-brand-500/40 hover:scale-105 transition-all duration-300 group"
                            >
                                <MessageCircle className="w-4 h-4 text-muted-foreground group-hover:text-brand-500 transition-colors" />
                            </a>
                            <a
                                href="tel:+6281234567890"
                                aria-label="Phone"
                                className="w-10 h-10 rounded-xl glass-light flex items-center justify-center hover:border-brand-500/40 hover:scale-105 transition-all duration-300 group"
                            >
                                <Phone className="w-4 h-4 text-muted-foreground group-hover:text-brand-500 transition-colors" />
                            </a>
                        </div>
                    </div>

                    {/* Produk */}
                    <div>
                        <h4 className="font-bold text-foreground mb-5 text-sm tracking-wide uppercase">Produk</h4>
                        <ul className="space-y-3">
                            {FOOTER_LINKS.produk.map((link, i) => (
                                <li key={i}>
                                    <Link
                                        href={link.href}
                                        className="text-muted-foreground hover:text-brand-500 transition-colors text-sm inline-flex items-center gap-2 group"
                                    >
                                        <span className="w-0 group-hover:w-2 h-px bg-brand-500 transition-all duration-300" />
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Bantuan */}
                    <div>
                        <h4 className="font-bold text-foreground mb-5 text-sm tracking-wide uppercase">Bantuan</h4>
                        <ul className="space-y-3">
                            {FOOTER_LINKS.bantuan.map((link, i) => (
                                <li key={i}>
                                    <Link
                                        href={link.href}
                                        className="text-muted-foreground hover:text-brand-500 transition-colors text-sm inline-flex items-center gap-2 group"
                                    >
                                        <span className="w-0 group-hover:w-2 h-px bg-brand-500 transition-all duration-300" />
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div className="col-span-2 lg:col-span-1">
                        <h4 className="font-bold text-foreground mb-5 text-sm tracking-wide uppercase">Newsletter</h4>
                        <p className="text-muted-foreground text-sm mb-4">
                            Dapatkan promo & info terbaru langsung di inbox.
                        </p>
                        <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                            <Input
                                type="email"
                                placeholder="Email kamu"
                                icon={Mail}
                                className="h-11"
                            />
                            <Button variant="primary" size="md" className="h-11 px-4">
                                <Send className="w-4 h-4" />
                            </Button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Payment Methods */}
            <div className="border-t border-border bg-background/50">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
                        <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mr-2">
                            Metode Pembayaran
                        </span>
                        {PAYMENT_METHODS.map((method) => (
                            <div
                                key={method.name}
                                className="h-9 px-3 bg-white rounded-lg flex items-center justify-center hover:scale-105 transition-transform"
                            >
                                <img
                                    src={method.image}
                                    alt={method.name}
                                    className="h-5 object-contain"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Copyright */}
            <div className="border-t border-border">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-muted-foreground text-xs">
                            © 2026 KingBlox. All rights reserved. Made with{' '}
                            <Heart className="w-3 h-3 inline text-brand-500 fill-brand-500" /> in Indonesia.
                        </p>
                        <div className="flex items-center gap-6">
                            <Link href="/terms" className="text-muted-foreground hover:text-brand-500 text-xs transition-colors">
                                Terms
                            </Link>
                            <Link href="/privacy" className="text-muted-foreground hover:text-brand-500 text-xs transition-colors">
                                Privacy
                            </Link>
                            <Link href="/faq" className="text-muted-foreground hover:text-brand-500 text-xs transition-colors">
                                FAQ
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
