'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    Sparkles, Zap, Shield, Clock, Star, ArrowRight, Cloud, Smartphone,
    CheckCircle, Cpu, Lock, Headphones, TrendingUp, Play, ChevronRight,
    Gamepad2, Users, Award, Rocket
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
import { cn } from '@/lib/utils';

const FEATURES = [
    {
        icon: Zap,
        title: 'Pengiriman Instan',
        desc: 'Kode dikirim otomatis kurang dari 1 menit setelah pembayaran berhasil.',
        gradient: 'from-amber-500/20 to-orange-500/20',
        iconColor: 'text-amber-500'
    },
    {
        icon: Shield,
        title: 'Transaksi Aman',
        desc: 'Pembayaran terenkripsi dengan garansi 100% atau uang kembali.',
        gradient: 'from-emerald-500/20 to-teal-500/20',
        iconColor: 'text-emerald-500'
    },
    {
        icon: Clock,
        title: 'Support 24/7',
        desc: 'Tim support profesional selalu siap membantu kapan pun.',
        gradient: 'from-blue-500/20 to-cyan-500/20',
        iconColor: 'text-blue-500'
    },
    {
        icon: Award,
        title: 'Harga Terbaik',
        desc: 'Garansi harga termurah dengan kualitas premium di kelasnya.',
        gradient: 'from-purple-500/20 to-pink-500/20',
        iconColor: 'text-purple-500'
    },
];

const STATS = [
    { value: '50K+', label: 'Pelanggan Aktif', icon: Users },
    { value: '99.9%', label: 'Uptime Server', icon: TrendingUp },
    { value: '<1m', label: 'Waktu Delivery', icon: Rocket },
    { value: '4.9/5', label: 'Rating Pengguna', icon: Star },
];

const TESTIMONIALS = [
    {
        name: 'Ahmad Rifqi',
        role: 'Pro Gamer',
        text: 'Cloud phone yang stabil banget, cocok buat farming game 24/7. Belum pernah ada masalah!',
        rating: 5,
        avatar: 'AR'
    },
    {
        name: 'Siti Maulida',
        role: 'Content Creator',
        text: 'Pelayanan super cepat, harga termurah se-Indonesia. Sudah langganan 6 bulan tanpa masalah.',
        rating: 5,
        avatar: 'SM'
    },
    {
        name: 'Budi Kurniawan',
        role: 'Mobile Developer',
        text: 'Support tim sangat responsif dan profesional. Cloud phonenya bekerja sempurna untuk testing.',
        rating: 5,
        avatar: 'BK'
    },
];

function ParallaxImage() {
    const ref = useRef(null);
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        const handle = () => {
            if (!ref.current) return;
            const rect = ref.current.getBoundingClientRect();
            const center = rect.top + rect.height / 2 - window.innerHeight / 2;
            setOffset(center * -0.08);
        };
        window.addEventListener('scroll', handle, { passive: true });
        handle();
        return () => window.removeEventListener('scroll', handle);
    }, []);

    return (
        <div ref={ref} className="relative w-full h-full flex items-center justify-center">
            <div
                style={{ transform: `translateY(${offset}px)` }}
                className="relative w-40 h-40 sm:w-52 sm:h-52 md:w-64 md:h-64 transition-transform duration-100"
            >
                <div className="absolute inset-0 bg-brand-500 blur-[80px] opacity-50 animate-pulse" />
                <div className="relative w-full h-full glass-strong rounded-3xl flex items-center justify-center shadow-glow-lg animate-float">
                    <Image src="/redfinger-icon.png" alt="Cloud Phone" width={140} height={140} className="relative z-10 w-[60%] h-auto" />
                </div>
                {/* Floating mini cards */}
                <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 glass-strong px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl shadow-lg flex items-center gap-2 animate-float" style={{ animationDelay: '0.5s' }}>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] sm:text-xs font-semibold">Online 24/7</span>
                </div>
                <div className="absolute -bottom-2 -left-4 sm:-left-6 glass-strong px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl shadow-lg flex items-center gap-2 animate-float" style={{ animationDelay: '1s' }}>
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span className="text-[10px] sm:text-xs font-semibold">Instant Setup</span>
                </div>
            </div>
        </div>
    );
}

function HeroSection() {
    return (
        <Section className="pt-24 sm:pt-28 md:pt-40 pb-12 md:pb-20 lg:min-h-screen flex items-center">
            <AnimatedBg variant="orbs" />

            <Container>
                <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                    {/* Left Content */}
                    <div className="lg:col-span-7 space-y-6 md:space-y-8 animate-fade-in-up">
                        <Badge variant="glass" className="px-3 py-1.5 sm:px-4">
                            <Sparkles className="w-3 h-3 text-brand-500" />
                            <span className="font-semibold tracking-wide text-[11px] sm:text-xs">#1 Cloud Phone Marketplace</span>
                        </Badge>

                        <div className="space-y-3 md:space-y-4">
                            <h1 className="text-[1.875rem] xs:text-[2.25rem] sm:text-5xl md:text-6xl lg:text-7xl font-display font-black tracking-tight leading-[1.05] text-balance">
                                Premium{' '}
                                <span className="gradient-text">Cloud Phone</span>{' '}
                                Untuk Para{' '}
                                <span className="relative inline-block">
                                    <span className="relative z-10">Pro</span>
                                    <span className="absolute bottom-1 sm:bottom-2 left-0 right-0 h-2 sm:h-3 bg-brand-500/30 -z-0 -skew-x-12" />
                                </span>
                            </h1>
                            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl text-balance">
                                Solusi cloud phone Android 24/7 untuk gaming, automation, dan multi-account.
                                Setup instan, harga termurah, garansi 100%.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
                            <Link href="/product/redfinger" className="w-full sm:w-auto">
                                <Button variant="primary" size="xl" className="group w-full sm:w-auto">
                                    <Rocket className="w-5 h-5" />
                                    Mulai Sekarang
                                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </Button>
                            </Link>
                            <Link href="/cara-pemesanan" className="w-full sm:w-auto">
                                <Button variant="glass" size="xl" className="w-full sm:w-auto">
                                    <Play className="w-4 h-4" />
                                    Cara Kerjanya
                                </Button>
                            </Link>
                        </div>

                        {/* Trust indicators */}
                        <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2 sm:pt-4">
                            <div className="flex items-center gap-3">
                                <div className="flex -space-x-2">
                                    {['A', 'B', 'C', 'D'].map((letter, i) => (
                                        <div
                                            key={i}
                                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 border-2 border-background flex items-center justify-center text-[10px] sm:text-xs font-bold text-white"
                                        >
                                            {letter}
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <div className="flex items-center gap-1">
                                        {[1,2,3,4,5].map(i => (
                                            <Star key={i} className="w-3 h-3 fill-amber-500 text-amber-500" />
                                        ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground">50,000+ Pengguna Aktif</p>
                                </div>
                            </div>
                            <div className="hidden sm:block h-10 w-px bg-border" />
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                <span className="text-sm text-muted-foreground">Garansi 100%</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Visual */}
                    <div className="lg:col-span-5 h-[280px] sm:h-[360px] md:h-[420px] lg:h-[500px] relative animate-fade-in" style={{ animationDelay: '0.3s' }}>
                        <ParallaxImage />
                    </div>
                </div>
            </Container>
        </Section>
    );
}

function StatsSection() {
    return (
        <Section className="py-16 border-y border-border bg-surface/30">
            <Container>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {STATS.map((stat, i) => (
                        <div
                            key={i}
                            className="text-center group"
                            style={{ animationDelay: `${i * 100}ms` }}
                        >
                            <div className="inline-flex w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 items-center justify-center mb-3 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                                <stat.icon className="w-5 h-5 text-brand-500" />
                            </div>
                            <div className="text-3xl md:text-4xl font-display font-black gradient-text mb-1">
                                {stat.value}
                            </div>
                            <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </Container>
        </Section>
    );
}

function FeaturesBentoSection() {
    return (
        <Section>
            <AnimatedBg variant="grid" />
            <Container>
                <SectionHeader
                    eyebrow="Keunggulan Kami"
                    title="Kenapa Pilih KingBlox?"
                    description="Platform digital paling tepercaya dengan teknologi terdepan dan layanan premium."
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {FEATURES.map((feature, i) => (
                        <Spotlight key={i} className="rounded-2xl">
                            <Card
                                variant="default"
                                hover="lift"
                                padding="lg"
                                className="h-full relative overflow-hidden"
                                style={{ animationDelay: `${i * 100}ms` }}
                            >
                                <div className={cn(
                                    "absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-50",
                                    `bg-gradient-to-br ${feature.gradient}`
                                )} />
                                <div className="relative">
                                    <div className={cn(
                                        "w-14 h-14 rounded-2xl glass-strong flex items-center justify-center mb-5",
                                        feature.iconColor
                                    )}>
                                        <feature.icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-display font-bold mb-2">
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {feature.desc}
                                    </p>
                                </div>
                            </Card>
                        </Spotlight>
                    ))}
                </div>
            </Container>
        </Section>
    );
}

function ProductShowcaseSection() {
    return (
        <Section className="bg-surface/30">
            <Container>
                <SectionHeader
                    eyebrow="Produk Unggulan"
                    title="Cloud Phone Premium"
                    description="Pengalaman Android di cloud dengan performa maksimal & uptime 99.9%."
                />

                <Card variant="glass" padding="none" className="overflow-hidden">
                    <div className="grid lg:grid-cols-2 gap-0">
                        {/* Visual */}
                        <div className="relative bg-gradient-to-br from-brand-500/10 via-brand-600/5 to-transparent p-12 lg:p-16 flex items-center justify-center min-h-[400px]">
                            <div className="absolute inset-0 grid-bg opacity-50" />
                            <div className="relative">
                                <div className="absolute inset-0 bg-brand-500 blur-[100px] opacity-40" />
                                <Image
                                    src="/redfinger-icon.png"
                                    alt="Redfinger"
                                    width={240}
                                    height={240}
                                    className="relative animate-float drop-shadow-2xl"
                                />
                            </div>
                            <Badge variant="gradient" className="absolute top-6 left-6 shadow-glow-sm">
                                <Sparkles className="w-3 h-3" />
                                Best Seller
                            </Badge>
                        </div>

                        {/* Content */}
                        <div className="p-8 lg:p-12 flex flex-col justify-center space-y-6">
                            <div className="space-y-3">
                                <div className="inline-flex items-center gap-2 text-xs font-semibold text-brand-500 uppercase tracking-wider">
                                    <Cloud className="w-4 h-4" />
                                    Cloud Phone Service
                                </div>
                                <h3 className="text-3xl md:text-4xl font-display font-bold">
                                    Redfinger Cloud Phone
                                </h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Android virtual di cloud yang dapat diakses 24/7 dari perangkat apapun.
                                    Sempurna untuk gaming, automation, multi-account, dan farming.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { icon: Cpu, label: 'Android 10/11' },
                                    { icon: Smartphone, label: 'RAM 2-8GB' },
                                    { icon: Clock, label: '24/7 Online' },
                                    { icon: Zap, label: 'Instant Setup' },
                                ].map((feat, i) => (
                                    <div key={i} className="flex items-center gap-2 p-3 rounded-xl glass-light">
                                        <feat.icon className="w-4 h-4 text-brand-500" />
                                        <span className="text-sm font-medium">{feat.label}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-end justify-between pt-4 border-t border-border">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Mulai dari</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-display font-black gradient-text">Rp 19.000</span>
                                        <span className="text-sm text-muted-foreground">/bulan</span>
                                    </div>
                                </div>
                                <Link href="/product/redfinger">
                                    <Button variant="primary" size="lg" className="group">
                                        Beli Sekarang
                                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </Card>
            </Container>
        </Section>
    );
}

function TestimonialsSection() {
    return (
        <Section>
            <Container>
                <SectionHeader
                    eyebrow="Testimoni"
                    title="Apa Kata Mereka?"
                    description="Ribuan pelanggan puas dengan layanan KingBlox setiap harinya."
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {TESTIMONIALS.map((t, i) => (
                        <Card
                            key={i}
                            variant="default"
                            hover="lift"
                            padding="lg"
                            className="relative group"
                        >
                            <div className="absolute top-6 right-6 text-6xl font-display font-black text-brand-500/10 leading-none select-none">"</div>
                            <div className="flex items-center gap-1 mb-4">
                                {Array.from({ length: t.rating }).map((_, j) => (
                                    <Star key={j} className="w-4 h-4 fill-amber-500 text-amber-500" />
                                ))}
                            </div>
                            <p className="text-foreground leading-relaxed mb-6 relative">
                                "{t.text}"
                            </p>
                            <div className="flex items-center gap-3 pt-4 border-t border-border">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-sm">
                                    {t.avatar}
                                </div>
                                <div>
                                    <p className="font-semibold text-foreground text-sm">{t.name}</p>
                                    <p className="text-xs text-muted-foreground">{t.role}</p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </Container>
        </Section>
    );
}

function CTASection() {
    return (
        <Section className="pb-32">
            <Container>
                <Card variant="gradient" padding="none" className="relative overflow-hidden border-brand-500/20">
                    <div className="absolute inset-0">
                        <div className="absolute -top-20 -left-20 w-96 h-96 bg-brand-500 rounded-full blur-[120px] opacity-20" />
                        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-brand-600 rounded-full blur-[120px] opacity-20" />
                        <div className="absolute inset-0 grid-bg opacity-30" />
                    </div>
                    <div className="relative p-12 md:p-16 lg:p-20 text-center">
                        <Badge variant="glass" className="mb-6">
                            <Gamepad2 className="w-3 h-3 text-brand-500" />
                            <span>Untuk Gamers & Pro</span>
                        </Badge>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-black tracking-tight mb-6 text-balance">
                            Siap Naik Level?
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 text-balance">
                            Bergabung bersama ribuan gamers & profesional yang sudah merasakan
                            kemudahan KingBlox untuk kebutuhan digital mereka.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-4">
                            <Link href="/product/redfinger">
                                <Button variant="primary" size="xl" className="group">
                                    <Sparkles className="w-5 h-5" />
                                    Coba Sekarang
                                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </Button>
                            </Link>
                            <Link href="/cara-pemesanan">
                                <Button variant="glass" size="xl">
                                    Pelajari Lebih Lanjut
                                </Button>
                            </Link>
                        </div>
                    </div>
                </Card>
            </Container>
        </Section>
    );
}

export default function Home() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main>
                <HeroSection />
                <StatsSection />
                <FeaturesBentoSection />
                <ProductShowcaseSection />
                <TestimonialsSection />
                <CTASection />
            </main>
            <Footer />
        </div>
    );
}
