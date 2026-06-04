'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
    CheckCircle, Clock, XCircle, Copy, Home, QrCode, CreditCard,
    Smartphone, Sparkles, ArrowRight, AlertCircle, Package, ShoppingBag
} from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Container } from '@/components/ui/container';
import { AnimatedBg } from '@/components/ui/animated-bg';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
    SUCCESS: {
        title: 'Pembayaran Berhasil',
        subtitle: 'Pesanan kamu sudah diproses!',
        icon: CheckCircle,
        bg: 'from-emerald-500/20 to-green-500/10',
        iconBg: 'bg-emerald-500',
        textColor: 'text-emerald-500',
        badge: 'success',
    },
    FAILED: {
        title: 'Transaksi Gagal',
        subtitle: 'Maaf, transaksi tidak dapat diproses',
        icon: XCircle,
        bg: 'from-red-500/20 to-red-600/10',
        iconBg: 'bg-red-500',
        textColor: 'text-red-500',
        badge: 'danger',
    },
    PENDING: {
        title: 'Menunggu Pembayaran',
        subtitle: 'Silakan selesaikan pembayaran kamu',
        icon: Clock,
        bg: 'from-amber-500/20 to-orange-500/10',
        iconBg: 'bg-amber-500',
        textColor: 'text-amber-500',
        badge: 'warning',
    },
};

const TIMELINE_STEPS = [
    { key: 'created', label: 'Pesanan Dibuat', icon: ShoppingBag },
    { key: 'pending', label: 'Menunggu Bayar', icon: Clock },
    { key: 'paid', label: 'Pembayaran Diterima', icon: CreditCard },
    { key: 'delivered', label: 'Pesanan Selesai', icon: Package },
];

export default function OrderPage({ params }) {
    const { orderId } = use(params);
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let interval = null;
        const fetchOrder = async () => {
            if (document.hidden) return; // Skip if tab not visible
            try {
                const res = await fetch(`/api/transaction/check?orderId=${orderId}`);
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Order not found');
                setOrder(data.order);
                // Once the order reaches a terminal state its data is immutable,
                // so stop polling to avoid endless reads on abandoned tabs.
                if (interval && (data.order?.status === 'SUCCESS' || data.order?.status === 'FAILED')) {
                    clearInterval(interval);
                    interval = null;
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
        interval = setInterval(() => {
            if (!document.hidden) fetchOrder();
        }, 30000);
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [orderId]);

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Disalin ke clipboard!');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <Navbar />
                <div className="min-h-screen flex items-center justify-center">
                    <div className="spinner text-brand-500 w-8 h-8" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <Navbar />
                <main className="pt-32 pb-20">
                    <Container size="sm">
                        <Card variant="glass" padding="xl" className="text-center">
                            <div className="w-20 h-20 mx-auto rounded-3xl bg-red-500/10 flex items-center justify-center mb-6">
                                <XCircle className="w-10 h-10 text-red-500" />
                            </div>
                            <h1 className="text-2xl font-display font-bold mb-2">Terjadi Kesalahan</h1>
                            <p className="text-muted-foreground mb-6">{error}</p>
                            <Link href="/">
                                <Button variant="primary" size="lg">
                                    <Home className="w-4 h-4" />
                                    Kembali ke Beranda
                                </Button>
                            </Link>
                        </Card>
                    </Container>
                </main>
                <Footer />
            </div>
        );
    }

    const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
    const StatusIcon = status.icon;
    const currentStep = order.status === 'SUCCESS' ? 3 : order.status === 'FAILED' ? -1 : 1;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="pt-28 pb-20 relative">
                <AnimatedBg variant="orbs" className="opacity-30" />
                <Container size="sm">
                    {/* Status Hero */}
                    <Card variant="glass" padding="none" className="mb-6 overflow-hidden">
                        <div className={cn("relative p-8 text-center bg-gradient-to-br", status.bg)}>
                            <div className="absolute inset-0 grid-bg opacity-30" />
                            <div className="relative">
                                <div className={cn(
                                    "w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-4 shadow-xl",
                                    status.iconBg,
                                    order.status === 'PENDING' && "animate-pulse"
                                )}>
                                    <StatusIcon className="w-10 h-10 text-white" />
                                </div>
                                <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight mb-1">
                                    {status.title}
                                </h1>
                                <p className="text-sm text-muted-foreground">{status.subtitle}</p>
                                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/50 backdrop-blur">
                                    <span className="text-xs text-muted-foreground">Order ID</span>
                                    <span className="font-mono text-xs font-bold">{order.orderId}</span>
                                    <button
                                        onClick={() => copyToClipboard(order.orderId)}
                                        className="hover:text-brand-500 transition-colors"
                                    >
                                        <Copy className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Timeline */}
                        {order.status !== 'FAILED' && (
                            <div className="p-6 border-t border-border">
                                <div className="flex items-center justify-between">
                                    {TIMELINE_STEPS.map((step, i) => {
                                        const isComplete = i <= currentStep;
                                        const isCurrent = i === currentStep;
                                        return (
                                            <div key={step.key} className="flex items-center flex-1">
                                                <div className="flex flex-col items-center text-center">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500",
                                                        isComplete
                                                            ? "bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow-sm"
                                                            : "bg-muted text-muted-foreground"
                                                    )}>
                                                        {isComplete ? <CheckCircle className="w-5 h-5" /> : <step.icon className="w-4 h-4" />}
                                                    </div>
                                                    <p className={cn(
                                                        "text-[10px] sm:text-xs font-semibold mt-2 max-w-[70px]",
                                                        isCurrent ? "text-brand-500" : "text-muted-foreground"
                                                    )}>
                                                        {step.label}
                                                    </p>
                                                </div>
                                                {i < TIMELINE_STEPS.length - 1 && (
                                                    <div className={cn(
                                                        "flex-1 h-0.5 mx-1 rounded-full -mt-6 transition-all duration-500",
                                                        isComplete && i < currentStep ? "bg-brand-500" : "bg-border"
                                                    )} />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Item Details */}
                    <Card variant="default" padding="lg" className="mb-6">
                        <h3 className="font-display font-bold mb-4 flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-brand-500" />
                            Detail Pesanan
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center pb-3 border-b border-border">
                                <span className="text-sm text-muted-foreground">Item</span>
                                <span className="font-semibold text-sm">{order.itemName}</span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-border">
                                <span className="text-sm text-muted-foreground">Metode Pembayaran</span>
                                <Badge variant="default">{order.paymentMethod}</Badge>
                            </div>
                            <div className="flex justify-between items-end pt-2">
                                <span className="text-sm text-muted-foreground">Total Bayar</span>
                                <span className="text-2xl font-display font-black gradient-text">
                                    Rp {order.price.toLocaleString('id-ID')}
                                </span>
                            </div>
                        </div>
                    </Card>

                    {/* Payment Instructions */}
                    {order.status === 'PENDING' && (
                        <Card variant="glow" padding="lg" className="mb-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
                                    <CreditCard className="w-5 h-5 text-brand-500" />
                                </div>
                                <div>
                                    <h3 className="font-display font-bold">Cara Pembayaran</h3>
                                    <p className="text-xs text-muted-foreground">Selesaikan pembayaran dalam 1 jam</p>
                                </div>
                            </div>

                            {(order.paymentMethod === 'QRIS' || order.paymentMethod === 'SQ') && order.qrString && (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="bg-white p-4 rounded-2xl border border-border shadow-lg">
                                        <img
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(order.qrString)}`}
                                            alt="QR Code"
                                            className="w-56 h-56"
                                        />
                                    </div>
                                    <div className="text-center max-w-sm">
                                        <h4 className="font-display font-bold mb-1 flex items-center justify-center gap-2">
                                            <QrCode className="w-4 h-4 text-brand-500" />
                                            Scan QRIS
                                        </h4>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Scan kode QR menggunakan e-wallet kamu (GoPay, OVO, Dana, ShopeePay) atau Mobile Banking.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {order.paymentMethod !== 'QRIS' && order.paymentMethod !== 'SQ' && (order.vaNumber || order.paymentCode) && (
                                <div>
                                    <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wider">
                                        Nomor Virtual Account
                                    </p>
                                    <div className="flex items-center gap-2 p-4 rounded-xl bg-muted">
                                        <span className="font-mono text-lg md:text-xl font-black flex-1 break-all">
                                            {order.vaNumber || order.paymentCode}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => copyToClipboard(order.vaNumber || order.paymentCode)}
                                        >
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {order.paymentUrl && !order.qrString && (
                                <a
                                    href={order.paymentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block mt-4"
                                >
                                    <Button variant="primary" size="lg" className="w-full group">
                                        <CreditCard className="w-4 h-4" />
                                        Bayar Sekarang
                                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                    </Button>
                                </a>
                            )}
                        </Card>
                    )}

                    {/* Redeem Code */}
                    {order.status === 'SUCCESS' && order.redeemCode && (
                        <Card variant="glow" padding="lg" className="mb-6 border-emerald-500/30">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-emerald-500" />
                                </div>
                                <div>
                                    <h3 className="font-display font-bold text-emerald-500">Kode Redeem Kamu</h3>
                                    <p className="text-xs text-muted-foreground">Simpan kode ini baik-baik</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-500/5 border-2 border-emerald-500/30 border-dashed">
                                <span className="font-mono text-base md:text-lg font-bold flex-1 break-all text-emerald-500">
                                    {order.redeemCode}
                                </span>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => copyToClipboard(order.redeemCode)}
                                    className="border-emerald-500/40 hover:bg-emerald-500/10"
                                >
                                    <Copy className="w-4 h-4 text-emerald-500" />
                                </Button>
                            </div>
                            <div className="flex items-start gap-2 mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-500">
                                    Kode ini hanya ditampilkan sekali. Pastikan kamu menyimpan dengan aman.
                                </p>
                            </div>
                        </Card>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Link href="/" className="flex-1">
                            <Button variant="outline" size="lg" className="w-full">
                                <Home className="w-4 h-4" />
                                Kembali ke Beranda
                            </Button>
                        </Link>
                        <Link href="/product/redfinger" className="flex-1">
                            <Button variant="primary" size="lg" className="w-full group">
                                <Package className="w-4 h-4" />
                                Beli Lagi
                                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </Link>
                    </div>
                </Container>
            </main>
            <Footer />
        </div>
    );
}
