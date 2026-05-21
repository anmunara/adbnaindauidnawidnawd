'use client';

import Link from 'next/link';
import {
    ShoppingCart, User, CreditCard, CheckCircle, Package, ArrowRight,
    MessageCircle, QrCode, Building2, Wallet, Store, Smartphone, Sparkles
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Container } from '@/components/ui/container';
import { Section, SectionHeader } from '@/components/ui/section';
import { AnimatedBg } from '@/components/ui/animated-bg';
import { Spotlight } from '@/components/ui/spotlight';

const STEPS = [
    {
        icon: User,
        title: 'Login / Daftar',
        description: 'Buat akun atau login ke akun KingBlox Anda untuk memulai pemesanan.',
        color: 'from-blue-500 to-cyan-500',
        iconColor: 'text-blue-500'
    },
    {
        icon: ShoppingCart,
        title: 'Pilih Produk',
        description: 'Pilih paket Cloud Phone yang sesuai kebutuhan Anda dari halaman produk.',
        color: 'from-brand-500 to-brand-700',
        iconColor: 'text-brand-500'
    },
    {
        icon: Package,
        title: 'Masukkan User ID',
        description: 'Masukkan User ID Redfinger Anda atau buat akun baru jika belum punya.',
        color: 'from-amber-500 to-orange-500',
        iconColor: 'text-amber-500'
    },
    {
        icon: CreditCard,
        title: 'Pilih Pembayaran',
        description: 'Pilih metode pembayaran (QRIS, Virtual Account, E-Wallet, atau Retail).',
        color: 'from-emerald-500 to-green-500',
        iconColor: 'text-emerald-500'
    },
    {
        icon: CheckCircle,
        title: 'Konfirmasi & Bayar',
        description: 'Periksa kembali pesanan Anda dan lakukan pembayaran sesuai instruksi.',
        color: 'from-purple-500 to-pink-500',
        iconColor: 'text-purple-500'
    },
    {
        icon: MessageCircle,
        title: 'Terima Kode',
        description: 'Kode redeem dikirim ke email/WhatsApp Anda setelah pembayaran berhasil.',
        color: 'from-pink-500 to-rose-500',
        iconColor: 'text-pink-500'
    }
];

const PAYMENT_METHODS = [
    { name: 'QRIS', Icon: QrCode, description: 'Semua E-Wallet & Banking' },
    { name: 'Virtual Account', Icon: Building2, description: 'Mandiri, BNI, BRI, ATM Bersama' },
    { name: 'E-Wallet', Icon: Wallet, description: 'OVO, DANA, ShopeePay, GoPay' },
    { name: 'Retail', Icon: Store, description: 'Indomaret & Alfamart' },
];

const TIPS = [
    'Pastikan User ID Redfinger Anda sudah benar sebelum checkout',
    'Simpan bukti pembayaran hingga kode redeem diterima',
    'Kode redeem akan dikirim dalam waktu 1-5 menit setelah pembayaran',
    'Hubungi support jika ada kendala dalam 24 jam',
    'Gunakan fitur keranjang untuk memesan multiple item sekaligus'
];

export default function CaraPemesanan() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="pt-28 pb-20 relative">
                <AnimatedBg variant="orbs" className="opacity-40" />

                <Section className="py-16">
                    <Container>
                        <div className="text-center max-w-3xl mx-auto">
                            <Badge variant="glass" className="mb-4">
                                <Sparkles className="w-3 h-3 text-brand-500" />
                                Panduan Lengkap
                            </Badge>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-black tracking-tight mb-4 text-balance">
                                Cara{' '}
                                <span className="gradient-text">Pemesanan</span>
                            </h1>
                            <p className="text-base md:text-lg text-muted-foreground text-balance">
                                Panduan lengkap cara memesan Cloud Phone di KingBlox.
                                Proses cepat, aman, dan otomatis dalam 6 langkah mudah.
                            </p>
                        </div>
                    </Container>
                </Section>

                <Section className="py-8">
                    <Container>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            {STEPS.map((step, index) => (
                                <Spotlight key={index} className="rounded-2xl">
                                    <Card
                                        variant="default"
                                        hover="lift"
                                        padding="lg"
                                        className="h-full relative overflow-hidden group"
                                    >
                                        <div className="absolute top-0 right-0 text-7xl font-display font-black text-brand-500/5 leading-none select-none">
                                            {String(index + 1).padStart(2, '0')}
                                        </div>
                                        <div className="relative">
                                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                                                <step.icon className="w-7 h-7 text-white" />
                                            </div>
                                            <h3 className="text-xl font-display font-bold mb-2">{step.title}</h3>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {step.description}
                                            </p>
                                        </div>
                                    </Card>
                                </Spotlight>
                            ))}
                        </div>
                    </Container>
                </Section>

                <Section className="py-12 border-y border-border">
                    <Container>
                        <SectionHeader
                            eyebrow="Pembayaran"
                            title="Metode Pembayaran"
                            description="Pilih metode pembayaran yang paling nyaman untuk Anda."
                        />
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {PAYMENT_METHODS.map((method, index) => (
                                <Card key={index} variant="glass" hover="lift" padding="lg" className="text-center">
                                    <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-3">
                                        <method.Icon className="w-7 h-7 text-brand-500" />
                                    </div>
                                    <h4 className="font-display font-bold mb-1">{method.name}</h4>
                                    <p className="text-xs text-muted-foreground">{method.description}</p>
                                </Card>
                            ))}
                        </div>
                    </Container>
                </Section>

                <Section className="py-12">
                    <Container size="sm">
                        <Card variant="gradient" padding="lg" className="border-brand-500/20">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center">
                                    <Package className="w-6 h-6 text-brand-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl md:text-2xl font-display font-bold">Tips Pemesanan</h2>
                                    <p className="text-xs text-muted-foreground">Untuk pengalaman terbaik</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {TIPS.map((tip, index) => (
                                    <div key={index} className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
                                        <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                                        </div>
                                        <p className="text-sm text-foreground leading-relaxed">{tip}</p>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </Container>
                </Section>

                <Section className="py-12">
                    <Container size="sm" className="text-center">
                        <Link href="/product/redfinger">
                            <Button variant="primary" size="xl" className="group">
                                <Smartphone className="w-5 h-5" />
                                Pesan Sekarang
                                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </Link>
                    </Container>
                </Section>
            </main>
            <Footer />
        </div>
    );
}
