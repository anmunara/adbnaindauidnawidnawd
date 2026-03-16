'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { 
  ChevronRight, 
  Shield, 
  Clock, 
  Zap, 
  CreditCard,
  Smartphone,
  User,
  MessageCircle,
  Check,
  AlertCircle,
  Copy,
  Wallet,
  ShoppingCart,
  ArrowRight,
  QrCode,
  Building2,
  Landmark
} from 'lucide-react';

const PAYMENT_GROUPS = [
  {
    id: 'qris',
    name: 'QRIS',
    Icon: QrCode,
    color: 'from-blue-500 to-cyan-500',
    methods: [
      { code: 'SQ', name: 'QRIS (All E-Wallet)', fee: '+1%' },
    ]
  },
  {
    id: 'va',
    name: 'Virtual Account',
    Icon: Building2,
    color: 'from-purple-500 to-pink-500',
    methods: [
      { code: 'M2', name: 'Mandiri VA', fee: '+Rp 4.000' },
      { code: 'I1', name: 'BNI VA', fee: '+Rp 4.000' },
      { code: 'BR', name: 'BRI VA', fee: '+Rp 4.000' },
      { code: 'A1', name: 'ATM Bersama', fee: '+Rp 4.000' },
    ]
  },
];

const STEPS = [
  { num: 1, title: 'Lengkapi Data', icon: User },
  { num: 2, title: 'Pilih Nominal', icon: Smartphone },
  { num: 3, title: 'Pilih Pembayaran', icon: CreditCard },
  { num: 4, title: 'Detail Kontak', icon: MessageCircle },
];

export default function ProductPage() {
  const [products, setProducts] = useState([]);
  const [userId, setUserId] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [openPaymentGroup, setOpenPaymentGroup] = useState(null);

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
    setOpenPaymentGroup(null);
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

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar />

      {/* Hero Banner */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-red-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Product Image */}
            <div className="w-full lg:w-1/3">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-red-600/30 to-amber-600/30 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative aspect-square rounded-3xl overflow-hidden border border-white/10 bg-[#1a1a2e]">
                  <img
                    src="https://www.cloudemulator.net/app/2.56.6/assets/icon/256.png"
                    alt="Redfinger Cloud Phone"
                    className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f]/80 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 text-xs font-medium backdrop-blur-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      Tersedia
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-gray-400">
                  Cloud Phone
                </span>
                <span className="flex items-center gap-1 text-xs text-green-400">
                  <Shield className="w-3 h-3" /> Terverifikasi
                </span>
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                Redfinger Cloud Phone
              </h1>

              <p className="text-gray-400 text-lg mb-6 max-w-2xl">
                Cloud Phone Android 24 jam online. Solusi terbaik untuk bot, farming game, 
                dan multi-account dengan performa stabil.
              </p>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-4 mb-8">
                {[
                  { icon: Shield, text: 'Jaminan Layanan' },
                  { icon: Clock, text: 'Support 24 Jam' },
                  { icon: CreditCard, text: 'Pembayaran Aman' },
                  { icon: Zap, text: 'Proses Otomatis' },
                ].map((badge, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-400">
                    <badge.icon className="w-4 h-4 text-red-500" />
                    <span>{badge.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Order Form */}
      <section className="py-8 pb-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Side - Form Steps */}
            <div className="lg:col-span-2 space-y-6">
              {STEPS.map((step, index) => (
                <div 
                  key={step.num}
                  className="relative bg-gradient-to-br from-[#141419] to-[#0f0f13] border border-white/10 rounded-2xl overflow-hidden"
                >
                  {/* Step Header */}
                  <div className="flex items-center gap-4 p-6 border-b border-white/5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm
                      ${selectedItem || step.num === 1 
                        ? 'bg-gradient-to-br from-red-600 to-red-700 text-white' 
                        : 'bg-white/5 text-gray-500'}`}>
                      {step.num}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{step.title}</h3>
                    </div>
                    <step.icon className="w-5 h-5 text-gray-500" />
                  </div>

                  {/* Step Content */}
                  <div className="p-6">
                    {/* Step 1: User ID */}
                    {step.num === 1 && (
                      <div className="space-y-4">
                        <label className="block text-sm text-gray-400">
                          Email / Username Redfinger <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: user@email.com"
                          value={userId}
                          onChange={(e) => setUserId(e.target.value)}
                          className="w-full px-4 py-3 bg-[#0a0a0f] border border-white/10 rounded-xl text-white placeholder-gray-600 
                            focus:border-red-500/50 focus:outline-none transition-colors"
                        />
                        <p className="text-xs text-gray-500">
                          Masukkan email atau username akun Redfinger Anda
                        </p>
                      </div>
                    )}

                    {/* Step 2: Select Product */}
                    {step.num === 2 && (
                      <div>
                        {productsLoading ? (
                          <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          </div>
                        ) : products.length === 0 ? (
                          <div className="text-center py-12">
                            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                            <p className="text-gray-400">Tidak ada paket tersedia</p>
                          </div>
                        ) : (
                          <div className="grid sm:grid-cols-2 gap-4">
                            {products.map((item) => {
                              const isSelected = selectedItem?.id === item.id;
                              const outOfStock = item.stock <= 0;
                              return (
                                <button
                                  key={item.id}
                                  onClick={() => !outOfStock && handleSelectProduct(item)}
                                  disabled={outOfStock}
                                  className={`relative p-5 rounded-xl border text-left transition-all duration-300
                                    ${isSelected 
                                      ? 'border-red-500 bg-red-500/10' 
                                      : outOfStock 
                                        ? 'border-white/5 bg-white/5 opacity-50 cursor-not-allowed'
                                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'}`}
                                >
                                  {isSelected && (
                                    <div className="absolute top-3 right-3 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                                      <Check className="w-4 h-4" />
                                    </div>
                                  )}
                                  <h4 className="font-semibold mb-1 pr-8">{item.name}</h4>
                                  <p className="text-2xl font-bold text-amber-400 mb-2">
                                    Rp {item.price?.toLocaleString('id-ID')}
                                  </p>
                                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                                    ${outOfStock 
                                      ? 'bg-red-500/10 text-red-400' 
                                      : 'bg-green-500/10 text-green-400'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${outOfStock ? 'bg-red-500' : 'bg-green-500'}`} />
                                    {outOfStock ? 'Stok Habis' : `Stok: ${item.stock}`}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step 3: Payment Method */}
                    {step.num === 3 && (
                      <div className="space-y-4">
                        {PAYMENT_GROUPS.map((group) => (
                          <div key={group.id} className="border border-white/10 rounded-xl overflow-hidden">
                            <button
                              onClick={() => setOpenPaymentGroup(openPaymentGroup === group.id ? null : group.id)}
                              className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                  <group.Icon className="w-4 h-4 text-gray-400" />
                                </div>
                                <span className="font-medium">{group.name}</span>
                              </div>
                              <ChevronRight 
                                className={`w-5 h-5 text-gray-500 transition-transform ${
                                  openPaymentGroup === group.id ? 'rotate-90' : ''
                                }`} 
                              />
                            </button>
                            
                            {openPaymentGroup === group.id && (
                              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#0a0a0f]">
                                {group.methods.map((method) => {
                                  const isSelected = selectedPayment?.code === method.code;
                                  return (
                                    <button
                                      key={method.code}
                                      onClick={() => setSelectedPayment(method)}
                                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all
                                        ${isSelected 
                                          ? 'border-red-500 bg-red-500/10' 
                                          : 'border-white/10 bg-white/5 hover:border-white/20'}`}
                                    >
                                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                        <Landmark className="w-4 h-4 text-gray-400" />
                                      </div>
                                      <div className="flex-1 text-left">
                                        <p className="font-medium text-sm">{method.name}</p>
                                        <p className="text-xs text-gray-500">Fee {method.fee}</p>
                                      </div>
                                      {isSelected && (
                                        <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
                                          <Check className="w-3 h-3" />
                                        </div>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Step 4: Contact Details */}
                    {step.num === 4 && (
                      <div className="space-y-4">
                        <label className="block text-sm text-gray-400">
                          Nomor WhatsApp <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                            +62
                          </span>
                          <input
                            type="text"
                            placeholder="8123456789"
                            value={whatsapp}
                            onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                            className="w-full pl-14 pr-4 py-3 bg-[#0a0a0f] border border-white/10 rounded-xl text-white placeholder-gray-600 
                              focus:border-red-500/50 focus:outline-none transition-colors"
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          Kode redeem akan dikirim ke WhatsApp ini
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Right Side - Summary Card */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <div className="bg-gradient-to-br from-[#141419] to-[#0f0f13] border border-white/10 rounded-2xl p-6">
                  <h3 className="font-semibold text-lg mb-6">Ringkasan Pesanan</h3>
                  
                  {selectedItem ? (
                    <div className="space-y-4">
                      <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                        <img 
                          src="https://images.unsplash.com/photo-1551650975-87deedd944c3?w=100&q=80"
                          alt="Product"
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{selectedItem.name}</h4>
                          <p className="text-amber-400 font-bold mt-1">
                            Rp {selectedItem.price?.toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>

                      {selectedPayment && (
                        <div className="flex items-center justify-between py-3 border-t border-white/10">
                          <span className="text-sm text-gray-400">Metode</span>
                          <span className="text-sm font-medium">{selectedPayment.name}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between py-3 border-t border-white/10">
                        <span className="text-gray-400">Total</span>
                        <span className="text-2xl font-bold text-amber-400">
                          Rp {selectedItem.price?.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">Belum ada item dipilih</p>
                    </div>
                  )}
                </div>

                {/* Info Card */}
                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-200">
                      Pastikan User ID Redfinger Anda sudah benar. 
                      Kesalahan input bukan tanggung jawab kami.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#141419]/95 backdrop-blur-xl border-t border-white/10 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            {/* Order Info */}
            <div className="flex-1 min-w-0">
              {selectedItem ? (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#1a1a2e] flex items-center justify-center p-1 hidden sm:block">
                    <img 
                      src="https://www.cloudemulator.net/app/2.56.6/assets/icon/256.png"
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-400 truncate">{selectedItem.name}</p>
                    <p className="text-xl font-bold text-amber-400">
                      Rp {selectedItem.price?.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  </div>
                  <p className="text-sm text-yellow-500">Pilih produk terlebih dahulu</p>
                </div>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-3">
              <button
                onClick={addToCart}
                disabled={!selectedItem || selectedItem?.stock <= 0}
                className={`flex items-center gap-2 px-6 py-4 rounded-xl font-semibold transition-all border-2
                  ${!selectedItem || selectedItem?.stock <= 0
                    ? 'border-gray-700 text-gray-400 cursor-not-allowed'
                    : 'border-red-600 text-red-500 hover:bg-red-600 hover:text-white'}`}
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Keranjang</span>
              </button>
              
              <button
                onClick={handleBuy}
                disabled={loading || !selectedItem || !userId || !selectedPayment}
                className={`flex items-center gap-2 px-8 py-4 rounded-xl font-semibold transition-all
                  ${loading || !selectedItem || !userId || !selectedPayment
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-lg shadow-red-600/25'}`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <span>Beli Sekarang</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="pb-24">
        <Footer />
      </div>
    </div>
  );
}
