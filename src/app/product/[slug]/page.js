'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Container } from '@/components/ui/container';
import { AnimatedBg } from '@/components/ui/animated-bg';
import { cn } from '@/lib/utils';
import {
  ChevronRight, Shield, Clock, Zap, CreditCard, Smartphone, User,
  MessageCircle, Check, AlertCircle, Wallet, ShoppingCart, ArrowRight,
  QrCode, Building2, Landmark, Sparkles, CircleCheck, Star, Cpu, Cloud
} from 'lucide-react';

const PAYMENT_GROUPS = [
  {
    id: 'qris',
    name: 'QRIS',
    Icon: QrCode,
    methods: [{ code: 'SQ', name: 'QRIS (All E-Wallet)', fee: '+1%' }]
  },
  {
    id: 'va',
    name: 'Virtual Account',
    Icon: Building2,
    methods: [
      { code: 'M2', name: 'Mandiri VA', fee: '+Rp 4.000' },
      { code: 'I1', name: 'BNI VA', fee: '+Rp 4.000' },
      { code: 'BR', name: 'BRI VA', fee: '+Rp 4.000' },
      { code: 'A1', name: 'ATM Bersama', fee: '+Rp 4.000' },
    ]
  },
];

const STEPS = [
  { num: 1, title: 'Data Akun', desc: 'Email/Username Redfinger', icon: User },
  { num: 2, title: 'Pilih Paket', desc: 'Tentukan durasi & nominal', icon: Smartphone },
  { num: 3, title: 'Pembayaran', desc: 'Pilih metode bayar', icon: CreditCard },
  { num: 4, title: 'Kontak', desc: 'WhatsApp untuk delivery', icon: MessageCircle },
];

const TRUST_BADGES = [
  { icon: Shield, text: 'Jaminan Layanan', color: 'text-emerald-500' },
  { icon: Clock, text: '24/7 Support', color: 'text-blue-500' },
  { icon: CreditCard, text: 'Pembayaran Aman', color: 'text-purple-500' },
  { icon: Zap, text: 'Auto Process', color: 'text-amber-500' },
];

const PRODUCT_FEATURES = [
  { icon: Cpu, label: 'Android 10/11', desc: 'Versi terbaru' },
  { icon: Cloud, label: 'Cloud-based', desc: 'Akses dari mana saja' },
  { icon: Clock, label: '24/7 Online', desc: 'Selalu aktif' },
  { icon: Zap, label: 'Instant Setup', desc: 'Siap dalam menit' },
];

export default function ProductPage() {
  const [products, setProducts] = useState([]);
  const [userId, setUserId] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [openPaymentGroup, setOpenPaymentGroup] = useState('qris');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products/get', { cache: 'no-store' });
        const data = await res.json();
        if (data.success) {
          setProducts(data.data);
          if (selectedItem) {
            const updated = data.data.find(p => p.id === selectedItem.id);
            if (updated) setSelectedItem(updated);
          }
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setProductsLoading(false);
      }
    };
    fetchProducts();
    const interval = setInterval(fetchProducts, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleBuy = async () => {
    if (!userId) return toast.error('Masukkan User ID kamu!');
    if (!selectedItem) return toast.error('Pilih paket dulu!');
    if (selectedItem.stock <= 0) return toast.error('Paket sedang habis stok!');
    if (!selectedPayment) return toast.error('Pilih metode pembayaran!');

    setLoading(true);
    try {
      const res = await fetch('/api/transaction/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: selectedItem.id,
          userId: userId,
          itemName: selectedItem.name,
          price: selectedItem.price,
          paymentMethod: selectedPayment.code
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Transaksi gagal');
      toast.success('Order dibuat!');
      window.location.href = `/order/${data.orderId}`;
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduct = (product) => {
    setSelectedItem(product);
    setSelectedPayment(null);
  };

  const addToCart = () => {
    if (!selectedItem) return toast.error('Pilih paket dulu!');
    if (selectedItem.stock <= 0) return toast.error('Paket sedang habis stok!');
    const cartItem = {
      id: selectedItem.id,
      name: selectedItem.name,
      price: selectedItem.price,
      duration: selectedItem.name,
      stock: selectedItem.stock,
      quantity: 1,
    };
    const existingCart = JSON.parse(localStorage.getItem('kingblox_cart') || '[]');
    const existingItem = existingCart.find(item => item.id === cartItem.id);
    if (existingItem) {
      toast.info('Item sudah ada di keranjang');
    } else {
      existingCart.push(cartItem);
      localStorage.setItem('kingblox_cart', JSON.stringify(existingCart));
      toast.success('Ditambahkan ke keranjang!');
    }
  };

  const stepIsComplete = (num) => {
    if (num === 1) return userId.length > 0;
    if (num === 2) return selectedItem !== null;
    if (num === 3) return selectedPayment !== null;
    if (num === 4) return whatsapp.length > 0;
    return false;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-12 overflow-hidden">
        <AnimatedBg variant="orbs" />
        <Container>
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            {/* Product Visual */}
            <div className="w-full lg:w-2/5">
              <div className="relative group">
                <div className="absolute -inset-8 bg-gradient-to-br from-brand-500/30 to-brand-700/30 rounded-[3rem] blur-3xl opacity-60 group-hover:opacity-80 transition-opacity" />
                <Card variant="glass" padding="lg" className="relative aspect-square flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 grid-bg opacity-30" />
                  <Image
                    src="/redfinger-icon.png"
                    alt="Redfinger Cloud Phone"
                    width={280}
                    height={280}
                    className="relative animate-float drop-shadow-2xl"
                  />
                  <Badge variant="success" className="absolute top-4 left-4 backdrop-blur-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Tersedia
                  </Badge>
                  <Badge variant="gradient" className="absolute top-4 right-4 shadow-glow-sm">
                    <Star className="w-3 h-3 fill-white" />
                    Best Seller
                  </Badge>
                </Card>
              </div>
            </div>

            {/* Product Info */}
            <div className="flex-1 space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="glass">
                  <Cloud className="w-3 h-3" />
                  Cloud Phone
                </Badge>
                <Badge variant="success">
                  <CircleCheck className="w-3 h-3" />
                  Terverifikasi
                </Badge>
                <div className="flex items-center gap-1 ml-2">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  ))}
                  <span className="text-xs text-muted-foreground ml-1">(4.9)</span>
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-black tracking-tight text-balance">
                Redfinger <span className="gradient-text">Cloud Phone</span>
              </h1>

              <p className="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
                Cloud Phone Android 24/7 dengan performa stabil. Cocok untuk gaming, bot,
                farming, dan multi-account dengan setup instant tanpa ribet.
              </p>

              {/* Features grid */}
              <div className="grid grid-cols-2 gap-3">
                {PRODUCT_FEATURES.map((feat, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl glass-light">
                    <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                      <feat.icon className="w-4 h-4 text-brand-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{feat.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{feat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-4 pt-2">
                {TRUST_BADGES.map((badge, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <badge.icon className={cn("w-4 h-4", badge.color)} />
                    <span>{badge.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Order Form */}
      <section className="py-8 pb-32">
        <Container>
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Steps */}
            <div className="lg:col-span-2 space-y-4">
              {/* Progress bar */}
              <Card variant="glass" padding="md" className="mb-6">
                <div className="flex items-center justify-between">
                  {STEPS.map((step, i) => {
                    const completed = stepIsComplete(step.num);
                    return (
                      <div key={step.num} className="flex items-center flex-1">
                        <div className="flex flex-col items-center text-center">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-300",
                            completed
                              ? "bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow-sm"
                              : "bg-muted text-muted-foreground"
                          )}>
                            {completed ? <Check className="w-5 h-5" /> : step.num}
                          </div>
                          <p className="hidden sm:block text-xs font-semibold mt-2">{step.title}</p>
                        </div>
                        {i < STEPS.length - 1 && (
                          <div className={cn(
                            "flex-1 h-0.5 mx-2 rounded-full transition-all duration-500",
                            completed ? "bg-brand-500" : "bg-border"
                          )} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>

              {STEPS.map((step) => {
                const completed = stepIsComplete(step.num);
                return (
                  <Card key={step.num} variant="default" padding="none" className="overflow-hidden">
                    <div className="flex items-center gap-4 p-5 border-b border-border">
                      <div className={cn(
                        "w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0",
                        completed
                          ? "bg-gradient-to-br from-brand-500 to-brand-700 text-white"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {completed ? <Check className="w-5 h-5" /> : step.num}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-bold text-base">{step.title}</h3>
                        <p className="text-xs text-muted-foreground">{step.desc}</p>
                      </div>
                      <step.icon className="w-5 h-5 text-muted-foreground shrink-0" />
                    </div>

                    <div className="p-5">
                      {step.num === 1 && (
                        <div className="space-y-3">
                          <Input
                            icon={User}
                            type="text"
                            placeholder="email@example.com atau username"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <AlertCircle className="w-3 h-3" />
                            Masukkan email/username Redfinger Anda dengan benar
                          </p>
                        </div>
                      )}

                      {step.num === 2 && (
                        <>
                          {productsLoading ? (
                            <div className="flex items-center justify-center py-12">
                              <div className="spinner text-brand-500" />
                            </div>
                          ) : products.length === 0 ? (
                            <div className="text-center py-12">
                              <AlertCircle className="w-12 h-12 text-brand-500 mx-auto mb-3 opacity-50" />
                              <p className="text-muted-foreground">Tidak ada paket tersedia</p>
                            </div>
                          ) : (
                            <div className="grid sm:grid-cols-2 gap-3">
                              {products.map((item) => {
                                const isSelected = selectedItem?.id === item.id;
                                const outOfStock = item.stock <= 0;
                                return (
                                  <button
                                    key={item.id}
                                    onClick={() => !outOfStock && handleSelectProduct(item)}
                                    disabled={outOfStock}
                                    className={cn(
                                      "relative p-4 rounded-2xl border-2 text-left transition-all duration-300 group",
                                      isSelected
                                        ? "border-brand-500 bg-brand-500/5 shadow-glow-sm"
                                        : outOfStock
                                          ? "border-border bg-muted/50 opacity-50 cursor-not-allowed"
                                          : "border-border bg-surface hover:border-brand-500/40 hover:-translate-y-0.5"
                                    )}
                                  >
                                    {isSelected && (
                                      <div className="absolute -top-2 -right-2 w-7 h-7 bg-brand-500 rounded-full flex items-center justify-center shadow-glow-sm animate-scale-in">
                                        <Check className="w-4 h-4 text-white" />
                                      </div>
                                    )}
                                    <h4 className="font-semibold mb-2 pr-6">{item.name}</h4>
                                    <p className="text-2xl font-display font-black gradient-text mb-3">
                                      Rp {item.price?.toLocaleString('id-ID')}
                                    </p>
                                    <Badge variant={outOfStock ? "danger" : "success"} className="text-[10px]">
                                      <span className={cn(
                                        "w-1.5 h-1.5 rounded-full",
                                        outOfStock ? "bg-red-500" : "bg-emerald-500 animate-pulse"
                                      )} />
                                      {outOfStock ? 'Stok Habis' : `Stok: ${item.stock}`}
                                    </Badge>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </>
                      )}

                      {step.num === 3 && (
                        <div className="space-y-3">
                          {PAYMENT_GROUPS.map((group) => {
                            const isOpen = openPaymentGroup === group.id;
                            return (
                              <div key={group.id} className="border border-border rounded-2xl overflow-hidden">
                                <button
                                  onClick={() => setOpenPaymentGroup(isOpen ? null : group.id)}
                                  className="w-full flex items-center justify-between p-4 hover:bg-muted transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
                                      <group.Icon className="w-4 h-4 text-brand-500" />
                                    </div>
                                    <span className="font-semibold">{group.name}</span>
                                  </div>
                                  <ChevronRight className={cn(
                                    "w-5 h-5 text-muted-foreground transition-transform duration-300",
                                    isOpen && "rotate-90"
                                  )} />
                                </button>

                                {isOpen && (
                                  <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-muted/30 animate-fade-in">
                                    {group.methods.map((method) => {
                                      const isSelected = selectedPayment?.code === method.code;
                                      return (
                                        <button
                                          key={method.code}
                                          onClick={() => setSelectedPayment(method)}
                                          className={cn(
                                            "flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200",
                                            isSelected
                                              ? "border-brand-500 bg-brand-500/5"
                                              : "border-border bg-surface hover:border-brand-500/40"
                                          )}
                                        >
                                          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                                            <Landmark className="w-4 h-4 text-muted-foreground" />
                                          </div>
                                          <div className="flex-1 text-left min-w-0">
                                            <p className="font-semibold text-sm truncate">{method.name}</p>
                                            <p className="text-xs text-muted-foreground">Fee {method.fee}</p>
                                          </div>
                                          {isSelected && (
                                            <div className="w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center shrink-0">
                                              <Check className="w-3 h-3 text-white" />
                                            </div>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {step.num === 4 && (
                        <div className="space-y-3">
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold z-10">
                              +62
                            </span>
                            <Input
                              type="tel"
                              placeholder="8123456789"
                              value={whatsapp}
                              onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                              className="pl-14"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <MessageCircle className="w-3 h-3" />
                            Kode redeem akan dikirim ke WhatsApp ini
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                <Card variant="glass" padding="lg">
                  <div className="flex items-center gap-2 mb-5">
                    <Sparkles className="w-4 h-4 text-brand-500" />
                    <h3 className="font-display font-bold text-lg">Ringkasan Pesanan</h3>
                  </div>

                  {selectedItem ? (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                        <div className="w-14 h-14 rounded-xl bg-surface flex items-center justify-center p-2 shrink-0">
                          <Image
                            src="/redfinger-icon.png"
                            alt=""
                            width={40}
                            height={40}
                            className="object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground mb-1">Redfinger Cloud</p>
                          <h4 className="font-semibold text-sm mb-1.5 truncate">{selectedItem.name}</h4>
                          <p className="font-display font-bold text-base gradient-text">
                            Rp {selectedItem.price?.toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2.5 py-3 border-t border-border">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span className="font-semibold">Rp {selectedItem.price?.toLocaleString('id-ID')}</span>
                        </div>
                        {selectedPayment && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Metode</span>
                            <span className="font-semibold">{selectedPayment.name}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-end justify-between pt-3 border-t border-border">
                        <span className="text-sm text-muted-foreground">Total</span>
                        <span className="text-2xl font-display font-black gradient-text">
                          Rp {selectedItem.price?.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 rounded-2xl bg-muted mx-auto mb-3 flex items-center justify-center">
                        <Wallet className="w-7 h-7 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">Belum ada item dipilih</p>
                    </div>
                  )}
                </Card>

                <Card variant="default" padding="md" className="border-blue-500/30 bg-blue-500/5">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-500/90 leading-relaxed">
                      Pastikan User ID Redfinger benar. Kesalahan input bukan tanggung jawab kami.
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-2xl bg-background/90 border-t border-border">
        <Container>
          <div className="flex items-center gap-2 sm:gap-4 py-3 sm:py-4">
            <div className="flex-1 min-w-0">
              {selectedItem ? (
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-11 h-11 rounded-xl bg-surface-elevated items-center justify-center p-1 hidden sm:flex shrink-0">
                    <Image src="/redfinger-icon.png" alt="" width={32} height={32} className="object-contain" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] sm:text-xs text-muted-foreground truncate">{selectedItem.name}</p>
                    <p className="text-base sm:text-xl font-display font-black gradient-text whitespace-nowrap">
                      Rp {selectedItem.price?.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                  </div>
                  <p className="text-xs sm:text-sm text-amber-500 font-medium leading-tight">Pilih produk dahulu</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="lg"
                onClick={addToCart}
                disabled={!selectedItem || selectedItem?.stock <= 0}
                className="hidden sm:inline-flex"
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden md:inline">Keranjang</span>
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handleBuy}
                loading={loading}
                disabled={!selectedItem || !userId || !selectedPayment}
                className="sm:min-w-[160px] group whitespace-nowrap"
              >
                <span className="hidden xs:inline">Beli Sekarang</span>
                <span className="xs:hidden">Beli</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </Container>
      </div>

      <div className="pb-24">
        <Footer />
      </div>
    </div>
  );
}
