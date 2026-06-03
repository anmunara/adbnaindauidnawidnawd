'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';
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
  ShoppingCart, Trash2, Plus, Minus, CreditCard, ArrowLeft, Package,
  Wallet, ChevronRight, ShoppingBag, QrCode, Building2, Store, Smartphone,
  User, Phone, Sparkles, Check, AlertCircle
} from 'lucide-react';

const PAYMENT_GROUPS = [
  {
    id: 'qris', name: 'QRIS', Icon: QrCode,
    methods: [{ code: 'SQ', name: 'QRIS (All E-Wallet)', fee: '+0.70%' }]
  },
  {
    id: 'va', name: 'Virtual Account', Icon: Building2,
    methods: [
      { code: 'M2', name: 'Mandiri VA', fee: '+Rp 4.000' },
      { code: 'I1', name: 'BNI VA', fee: '+Rp 4.000' },
      { code: 'BR', name: 'BRI VA', fee: '+Rp 4.000' },
      { code: 'A1', name: 'ATM Bersama', fee: '+Rp 4.000' },
    ]
  },
  {
    id: 'ewallet', name: 'E-Wallet', Icon: Wallet,
    methods: [
      { code: 'OV', name: 'OVO', fee: '+1.5%' },
      { code: 'DA', name: 'DANA', fee: '+1.5%' },
      { code: 'SA', name: 'ShopeePay', fee: '+1.5%' },
      { code: 'GJ', name: 'GoPay', fee: '+1.5%' },
    ]
  },
  {
    id: 'retail', name: 'Retail', Icon: Store,
    methods: [
      { code: 'IR', name: 'Indomaret', fee: '+Rp 2.500' },
      { code: 'FT', name: 'Alfamart', fee: '+Rp 2.500' },
    ]
  },
];

export default function CartPage() {
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [openPaymentGroup, setOpenPaymentGroup] = useState('qris');
  const [userId, setUserId] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  useEffect(() => {
    const savedCart = localStorage.getItem('kingblox_cart');
    if (savedCart) {
      try { setCart(JSON.parse(savedCart)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('kingblox_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products/get', { cache: 'no-store' });
        const data = await res.json();
        if (data.success) setProducts(data.data);
      } catch (error) {}
    };
    fetchProducts();
    const interval = setInterval(fetchProducts, 60000);
    return () => clearInterval(interval);
  }, []);

  const updateQuantity = (itemId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQty = Math.max(1, Math.min(item.quantity + delta, item.stock || 10));
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeItem = (itemId) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
    toast.success('Item dihapus dari keranjang');
  };

  const clearCart = () => {
    setCart([]);
    toast.success('Keranjang dikosongkan');
  };

  const getTotalPrice = () => cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  const getFee = () => {
    if (!selectedPayment) return 0;
    const fee = selectedPayment.fee;
    if (fee.includes('%')) {
      const percent = parseFloat(fee.replace(/[^0-9.]/g, ''));
      return Math.round(getTotalPrice() * (percent / 100));
    }
    return parseInt(fee.replace(/[^0-9]/g, '')) || 0;
  };

  const getGrandTotal = () => getTotalPrice() + getFee();

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error('Keranjang masih kosong!');
    if (!userId) return toast.error('Masukkan User ID kamu!');
    if (!selectedPayment) return toast.error('Pilih metode pembayaran!');

    if (userId.length < 3 || userId.length > 100) return toast.error('User ID harus 3-100 karakter!');
    if (!/^[a-zA-Z0-9._%+-@]+$/.test(userId)) return toast.error('User ID mengandung karakter tidak valid!');

    if (whatsapp) {
      const waClean = whatsapp.replace(/\D/g, '');
      if (waClean.length < 10 || waClean.length > 15) return toast.error('Nomor WhatsApp tidak valid!');
    }

    for (const item of cart) {
      const product = products.find(p => p.id === item.id);
      if (!product) return toast.error(`Produk ${item.name} tidak ditemukan!`);
      if (product.stock < item.quantity) return toast.error(`Stok ${item.name} tidak mencukupi! Tersedia: ${product.stock}`);
      if (product.price !== item.price) {
        toast.error(`Harga ${item.name} telah berubah. Mengupdate...`);
        setCart(prev => prev.map(ci => ci.id === item.id ? { ...ci, price: product.price } : ci));
        return;
      }
    }

    setLoading(true);
    try {
      const results = [];
      for (const item of cart) {
        const product = products.find(p => p.id === item.id);
        const res = await fetch('/api/transaction/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itemId: item.id,
            itemName: item.name,
            userId: userId.trim(),
            price: product.price,
            whatsapp: whatsapp ? whatsapp.replace(/\D/g, '') : undefined,
            paymentMethod: selectedPayment.code,
            quantity: item.quantity,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Gagal membuat transaksi');
        if (data.success) results.push(data);
      }
      if (results.length > 0) {
        toast.success('Pesanan berhasil dibuat!');
        setCart([]);
        window.location.href = `/order/${results[0].orderId}`;
      }
    } catch (error) {
      toast.error(error.message || 'Gagal membuat pesanan');
    } finally {
      setLoading(false);
    }
  };

  const totalItems = cart.reduce((a, b) => a + b.quantity, 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-28 pb-20 relative">
        <AnimatedBg variant="orbs" className="opacity-30" />
        <Container>
          <div className="flex items-center gap-4 mb-8">
            <Link href="/product/redfinger">
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-brand-500" />
                </span>
                Keranjang
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                {cart.length === 0 ? 'Keranjang kosong' : `${totalItems} item di keranjang`}
              </p>
            </div>
          </div>

          {cart.length === 0 ? (
            <Card variant="glass" padding="xl" className="text-center max-w-md mx-auto">
              <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-display font-bold mb-2">Keranjang Kosong</h2>
              <p className="text-muted-foreground mb-6">Mulai tambahkan item ke keranjang dan dapatkan penawaran terbaik!</p>
              <Link href="/product/redfinger">
                <Button variant="primary" size="lg">
                  <Package className="w-4 h-4" />
                  Lihat Produk
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-bold text-lg">Item ({totalItems})</h2>
                  <Button variant="ghost" size="sm" onClick={clearCart} className="text-red-500 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                    Kosongkan
                  </Button>
                </div>

                {cart.map((item) => {
                  const product = products.find(p => p.id === item.id);
                  const stock = product?.stock || 0;
                  return (
                    <Card key={item.id} variant="default" padding="md" className="overflow-hidden">
                      <div className="flex gap-4">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500/20 to-brand-700/20 flex items-center justify-center flex-shrink-0 p-2">
                          <Image src="/redfinger-icon.png" alt={item.name} width={60} height={60} className="object-contain" />
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col">
                          <div className="flex justify-between gap-3 mb-2">
                            <div className="min-w-0">
                              <h3 className="font-semibold truncate">{item.name}</h3>
                              <p className="text-xs text-muted-foreground">Redfinger Cloud Phone</p>
                            </div>
                            <button
                              onClick={() => removeItem(item.id)}
                              aria-label="Remove item"
                              className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-end justify-between gap-3 mt-auto">
                            <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
                              <button
                                onClick={() => updateQuantity(item.id, -1)}
                                disabled={item.quantity <= 1}
                                className="w-7 h-7 rounded-lg hover:bg-surface flex items-center justify-center disabled:opacity-30 transition-colors"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, 1)}
                                disabled={item.quantity >= stock}
                                className="w-7 h-7 rounded-lg hover:bg-surface flex items-center justify-center disabled:opacity-30 transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">{item.quantity} × Rp {item.price.toLocaleString()}</p>
                              <p className="text-lg font-display font-bold gradient-text">
                                Rp {(item.price * item.quantity).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          {stock < item.quantity && (
                            <Badge variant="danger" className="mt-2 w-fit">
                              <AlertCircle className="w-3 h-3" />
                              Stok hanya {stock}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              <div className="space-y-4">
                <Card variant="default" padding="md">
                  <h3 className="font-display font-bold mb-4 flex items-center gap-2">
                    <User className="w-4 h-4 text-brand-500" />
                    Detail Pengguna
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold mb-2 text-muted-foreground">
                        User ID <span className="text-red-500">*</span>
                      </label>
                      <Input
                        icon={User}
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        placeholder="Username/Email Redfinger"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-2 text-muted-foreground">
                        WhatsApp <span className="text-muted-foreground">(opsional)</span>
                      </label>
                      <Input
                        icon={Phone}
                        type="tel"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="08xxxxxxxxxx"
                      />
                    </div>
                  </div>
                </Card>

                <Card variant="default" padding="md">
                  <h3 className="font-display font-bold mb-4 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-brand-500" />
                    Pembayaran
                  </h3>
                  <div className="space-y-2">
                    {PAYMENT_GROUPS.map((group) => {
                      const isOpen = openPaymentGroup === group.id;
                      return (
                        <div key={group.id} className="border border-border rounded-xl overflow-hidden">
                          <button
                            onClick={() => setOpenPaymentGroup(isOpen ? null : group.id)}
                            className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-muted transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
                                <group.Icon className="w-3.5 h-3.5 text-brand-500" />
                              </div>
                              <span className="font-semibold text-sm">{group.name}</span>
                            </div>
                            <ChevronRight className={cn(
                              "w-4 h-4 text-muted-foreground transition-transform duration-300",
                              isOpen && "rotate-90"
                            )} />
                          </button>
                          {isOpen && (
                            <div className="p-2 space-y-1 animate-fade-in border-t border-border bg-muted/30">
                              {group.methods.map((method) => {
                                const isSelected = selectedPayment?.code === method.code;
                                return (
                                  <button
                                    key={method.code}
                                    onClick={() => setSelectedPayment(method)}
                                    className={cn(
                                      "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all text-sm",
                                      isSelected ? "bg-brand-500/10 border border-brand-500/30" : "hover:bg-surface"
                                    )}
                                  >
                                    <span className="font-medium">{method.name}</span>
                                    {isSelected && (
                                      <div className="w-4 h-4 rounded-full bg-brand-500 flex items-center justify-center">
                                        <Check className="w-2.5 h-2.5 text-white" />
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
                </Card>

                <Card variant="glass" padding="md">
                  <h3 className="font-display font-bold mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-500" />
                    Ringkasan
                  </h3>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal ({totalItems} item)</span>
                      <span>Rp {getTotalPrice().toLocaleString()}</span>
                    </div>
                    <div className="border-t border-border pt-3 mt-3">
                      <div className="flex items-end justify-between">
                        <span className="font-semibold">Total Bayar</span>
                        <span className="text-2xl font-display font-black gradient-text">
                          Rp {getGrandTotal().toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={handleCheckout}
                    loading={loading}
                    variant="primary"
                    size="lg"
                    className="w-full mt-5 group"
                  >
                    <CreditCard className="w-4 h-4" />
                    Bayar Sekarang
                  </Button>
                </Card>
              </div>
            </div>
          )}
        </Container>
      </main>
      <Footer />
    </div>
  );
}
