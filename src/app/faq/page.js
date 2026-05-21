'use client';

import { useState } from 'react';
import Link from 'next/link';
import { HelpCircle, ChevronDown, MessageCircle, Sparkles, ArrowRight, Send } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Container } from '@/components/ui/container';
import { Section, SectionHeader } from '@/components/ui/section';
import { AnimatedBg } from '@/components/ui/animated-bg';
import { cn } from '@/lib/utils';

const FAQS = [
    {
        category: 'Umum',
        items: [
            { q: 'Apa itu KingBlox?', a: 'KingBlox adalah platform e-commerce yang menyediakan layanan Cloud Phone Redfinger. Kami menyediakan kode redeem untuk mengaktifkan layanan Cloud Phone Android 24/7.' },
            { q: 'Apa itu Cloud Phone?', a: 'Cloud Phone adalah layanan virtual Android yang berjalan di cloud server. Anda bisa mengaksesnya kapan saja untuk menjalankan aplikasi, game, atau bot tanpa menggunakan device fisik.' },
            { q: 'Apakah KingBlox resmi?', a: 'Ya, KingBlox adalah reseller resmi produk Redfinger Cloud Phone. Semua kode redeem yang kami jual adalah original dan legal.' }
        ]
    },
    {
        category: 'Pemesanan & Pembayaran',
        items: [
            { q: 'Bagaimana cara memesan?', a: 'Pilih produk di halaman Produk, masukkan User ID Redfinger Anda, pilih metode pembayaran, lalu lakukan pembayaran sesuai instruksi. Kode redeem akan dikirim otomatis setelah pembayaran berhasil.' },
            { q: 'Metode pembayaran apa saja yang tersedia?', a: 'Kami menerima QRIS (semua e-wallet), Virtual Account (Mandiri, BNI, BRI), E-Wallet (OVO, DANA, ShopeePay, GoPay), dan Retail (Indomaret, Alfamart).' },
            { q: 'Berapa lama kode redeem dikirim?', a: 'Kode redeem akan dikirim dalam waktu 1-5 menit setelah pembayaran berhasil dan terverifikasi.' },
            { q: 'Apakah bisa refund?', a: 'Semua penjualan bersifat final. Refund hanya dapat dilakukan jika terjadi kesalahan sistem dari pihak kami, bukan karena kesalahan input data.' }
        ]
    },
    {
        category: 'Produk & Layanan',
        items: [
            { q: 'Berapa lama masa aktif Cloud Phone?', a: 'Masa aktif tergantung paket yang Anda beli: 7 hari, 30 hari, 60 hari, atau 90 hari. Masa aktif dihitung sejak kode diredeem.' },
            { q: 'Bagaimana cara redeem kode?', a: 'Login ke aplikasi Redfinger, masuk ke menu "Redeem" atau "Top Up", masukkan kode yang Anda terima, lalu klik "Redeem".' },
            { q: 'Apakah kode bisa dipakai berkali-kali?', a: 'Tidak. Setiap kode hanya bisa digunakan satu kali untuk satu akun Redfinger.' },
            { q: 'Apakah stok selalu tersedia?', a: 'Stok kami terbatas dan dapat habis sewaktu-waktu. Kami sarankan untuk membeli saat stok masih tersedia.' }
        ]
    },
    {
        category: 'Teknis',
        items: [
            { q: 'Cloud Phone bisa untuk game apa saja?', a: 'Cloud Phone Redfinger bisa digunakan untuk berbagai game Android seperti Roblox, Mobile Legends, Free Fire, dan lainnya. Pastikan game kompatibel dengan Android 10/11.' },
            { q: 'Apakah bisa multi-instance?', a: 'Ya, Anda bisa menjalankan multiple Cloud Phone sekaligus tergantung spesifikasi paket yang Anda beli.' },
            { q: 'Apakah data saya aman?', a: 'Ya, setiap Cloud Phone memiliki environment yang terisolasi. Data Anda tidak akan tercampur dengan pengguna lain.' }
        ]
    },
    {
        category: 'Bantuan',
        items: [
            { q: 'Bagaimana jika kode tidak berfungsi?', a: 'Pastikan kode dimasukkan dengan benar (perhatikan huruf besar/kecil). Jika masih bermasalah, hubungi support kami dengan menyertakan bukti pembelian.' },
            { q: 'Bagaimana cara menghubungi support?', a: 'Anda bisa menghubungi kami melalui Discord server kami atau WhatsApp (jam kerja). Tim support kami siap membantu.' },
            { q: 'Jam berapa support online?', a: 'Support Discord tersedia 24/7. Support WhatsApp tersedia pada jam kerja (09:00 - 21:00 WIB).' }
        ]
    }
];

function FAQItem({ question, answer, isOpen, onClick }) {
    return (
        <Card
            variant="default"
            padding="none"
            className={cn(
                "overflow-hidden transition-all duration-300",
                isOpen && "border-brand-500/40"
            )}
        >
            <button
                onClick={onClick}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/50 transition-colors"
            >
                <span className="font-semibold pr-4">{question}</span>
                <div className={cn(
                    "w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 transition-all duration-300",
                    isOpen && "bg-brand-500 text-white rotate-180"
                )}>
                    <ChevronDown className="w-4 h-4" />
                </div>
            </button>
            <div className={cn(
                "grid transition-all duration-300",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            )}>
                <div className="overflow-hidden">
                    <div className="px-5 pb-5 pt-1 border-t border-border">
                        <p className="text-muted-foreground leading-relaxed">{answer}</p>
                    </div>
                </div>
            </div>
        </Card>
    );
}

export default function FAQ() {
    const [openItems, setOpenItems] = useState({});

    const toggleItem = (categoryIndex, itemIndex) => {
        const key = `${categoryIndex}-${itemIndex}`;
        setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="pt-28 pb-20 relative">
                <AnimatedBg variant="orbs" className="opacity-40" />

                <Section className="py-16">
                    <Container size="sm">
                        <div className="text-center">
                            <div className="inline-flex w-16 h-16 rounded-3xl bg-brand-500/10 items-center justify-center mb-6">
                                <HelpCircle className="w-8 h-8 text-brand-500" />
                            </div>
                            <Badge variant="glass" className="mb-4">
                                <Sparkles className="w-3 h-3 text-brand-500" />
                                Bantuan & Dukungan
                            </Badge>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-black tracking-tight mb-4 text-balance">
                                Pertanyaan{' '}
                                <span className="gradient-text">Umum</span>
                            </h1>
                            <p className="text-base md:text-lg text-muted-foreground text-balance">
                                Temukan jawaban untuk pertanyaan seputar layanan KingBlox.
                            </p>
                        </div>
                    </Container>
                </Section>

                <Section className="py-8">
                    <Container size="sm">
                        <div className="space-y-10">
                            {FAQS.map((category, catIndex) => (
                                <div key={catIndex}>
                                    <h2 className="text-xl md:text-2xl font-display font-bold mb-4 flex items-center gap-3">
                                        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center text-sm shadow-glow-sm">
                                            {catIndex + 1}
                                        </span>
                                        {category.category}
                                    </h2>
                                    <div className="space-y-3">
                                        {category.items.map((item, itemIndex) => (
                                            <FAQItem
                                                key={itemIndex}
                                                question={item.q}
                                                answer={item.a}
                                                isOpen={openItems[`${catIndex}-${itemIndex}`]}
                                                onClick={() => toggleItem(catIndex, itemIndex)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Container>
                </Section>

                <Section className="py-12">
                    <Container size="sm">
                        <Card variant="gradient" padding="none" className="relative overflow-hidden border-brand-500/20">
                            <div className="absolute inset-0">
                                <div className="absolute -top-20 -right-20 w-72 h-72 bg-brand-500 rounded-full blur-[100px] opacity-20" />
                                <div className="absolute inset-0 grid-bg opacity-30" />
                            </div>
                            <div className="relative p-8 md:p-12 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center mx-auto mb-4">
                                    <MessageCircle className="w-8 h-8 text-brand-500" />
                                </div>
                                <h2 className="text-2xl md:text-3xl font-display font-black mb-2 text-balance">
                                    Masih Punya Pertanyaan?
                                </h2>
                                <p className="text-muted-foreground mb-6">
                                    Tim support kami siap membantu kapan saja.
                                </p>
                                <div className="flex flex-wrap justify-center gap-3">
                                    <Link href="/cara-pemesanan">
                                        <Button variant="primary" size="lg" className="group">
                                            Cara Pemesanan
                                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                        </Button>
                                    </Link>
                                    <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer">
                                        <Button variant="outline" size="lg">
                                            <Send className="w-4 h-4" />
                                            Hubungi Support
                                        </Button>
                                    </a>
                                </div>
                            </div>
                        </Card>
                    </Container>
                </Section>
            </main>
            <Footer />
        </div>
    );
}
