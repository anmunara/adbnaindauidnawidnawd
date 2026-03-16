'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard,
  ArrowLeft,
  Package,
  Wallet,
  ChevronRight,
  ShoppingBag
} from 'lucide-react';

const PAYMENT_GROUPS = [
  {
    id: 'qris',
    name: 'QRIS',
    icon: '📱',
    color: 'from-blue-500 to-cyan-500',
    methods: [
      { code: 'SQ', name: 'QRIS (All E-Wallet)', fee: '+1%', icon: '💳' },
    ]
  },
  {
    id: 'va',
    name: 'Virtual Account',
    icon: '🏦',
    color: 'from-purple-500 to-pink-500',
    methods: [
      { code: 'M2', name: 'Mandiri VA', fee: '+Rp 4.000', icon: '🏛️' },
      { code: 'I1', name: 'BNI VA', fee: '+Rp 4.000', icon: '🏛️' },
      { code: 'BR', name: 'BRI VA', fee: '+Rp 4.000', icon: '🏛️' },
      { code: 'A1', name: 'ATM Bersama', fee: '+Rp 4.000', icon: '🏧' },
    ]
  },
  {
    id: 'ewallet',
    name: 'E-Wallet',
    icon: '💳',
    color: 'from-green-500 to-emerald-500',
    methods: [
      { code: 'OV', name: 'OVO', fee: '+1.5%', icon: '🔵' },
      { code: 'DA', name: 'DANA', fee: '+1.5%', icon: '🔷' },
      { code: 'SA', name: 'ShopeePay', fee: '+1.5%', icon: '🟠' },
      { code: 'GJ', name: 'GoPay', fee: '+1.5%', icon: '🔵' },
    ]
  },
  {
    id: 'retail',
    name: 'Retail',
    icon: '🏪',
    color: 'from-orange-500 to-red-500',
    methods: [
      { code: 'IR', name: 'Indomaret', fee: '+Rp 2.500', icon: '🟢' },
      { code: 'FT', name: 'Alfamart', fee: '+Rp 2.500', icon: '🔴' },
    ]
  },
];

export default function CartPage() {
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [openPaymentGroup, setOpenPaymentGroup] = useState(null);
  const [userId, setUserId] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('kingblox_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Error parsing cart:', e);
      }
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('kingblox_cart', JSON.stringify(cart));
  }, [cart]);

  // Fetch products for stock info
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products/get', { cache: 'no-store' });
        const data = await res.json();
        if (data.success) {
          setProducts(data.data);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchProducts();
    const interval = setInterval(fetchProducts, 15000);
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

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getFee = () => {
    if (!selectedPayment) return 0;
    const fee = selectedPayment.fee;
    if (fee.includes('%')) {
      const percent = parseFloat(fee.replace(/[^0-9.]/g, ''));
      return Math.round(getTotalPrice() * (percent / 100));
    } else {
      return parseInt(fee.replace(/[^0-9]/g, '')) || 0;
    }
  };

  const getGrandTotal = () => {
    return getTotalPrice() + getFee();
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error('Keranjang masih kosong!');
    if (!userId) return toast.error('Masukkan User ID kamu!');
    if (!selectedPayment) return toast.error('Pilih metode pembayaran!');

    // Check stock
    for (const item of cart) {
      const product = products.find(p => p.id === item.id);
      if (!product || product.stock < item.quantity) {
        return toast.error(`Stok ${item.name} tidak mencukupi!`);
      }
    }

    setLoading(true);
    try {
      // Create transaction for each item
      const results = [];
      for (const item of cart) {
        const res = await fetch('/api/transaction/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itemId: item.id,
            userId: userId,
            whatsapp: whatsapp || undefined,
            paymentMethod: selectedPayment.code,
            quantity: item.quantity,
          }),
        });
        const data = await res.json();
        if (data.success) {
          results.push(data.data);
        }
      }

      if (results.length > 0) {
        toast.success('Pesanan berhasil dibuat!');
        setCart([]); // Clear cart
        // Redirect to first order
        window.location.href = `/order/${results[0].orderId}`;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Gagal membuat pesanan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar />
      
      <main className="pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link 
              href="/product/redfinger"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <ShoppingCart className="w-6 h-6 text-red-500" />
                Keranjang Belanja
              </h1>
              <p className="text-gray-400 text-sm">
                {cart.length} item di keranjang
              </p>
            </div>
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag className="w-20 h-20 text-gray-600 mx-auto mb-6" />
              <h2 className="text-xl font-semibold mb-2">Keranjang Kosong</h2>
              <p className="text-gray-400 mb-6">Yuk tambah item ke keranjang!</p>
              <Link 
                href="/product/redfinger"
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-medium transition-all"
              >
                <Package className="w-5 h-5" />
                Lihat Produk
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Item</h2>
                  <button 
                    onClick={clearCart}
                    className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Kosongkan
                  </button>
                </div>

                {cart.map((item) => {
                  const product = products.find(p => p.id === item.id);
                  const stock = product?.stock || 0;
                  
                  return (
                    <div 
                      key={item.id}
                      className="bg-[#141419] border border-white/10 rounded-2xl p-4 flex gap-4"
                    >
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-2xl flex-shrink-0">
                        📱
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{item.name}</h3>
                        <p className="text-sm text-gray-400">{item.duration}</p>
                        <p className="text-red-400 font-medium">
                          Rp {item.price.toLocaleString()}
                        </p>
                        {stock < item.quantity && (
                          <p className="text-xs text-red-500 mt-1">
                            Stok tersisa: {stock}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        
                        <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
                          <button 
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button 
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                            disabled={item.quantity >= stock}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <p className="text-sm font-medium">
                          Rp {(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Checkout Section */}
              <div className="space-y-4">
                {/* User Info */}
                <div className="bg-[#141419] border border-white/10 rounded-2xl p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-red-500" />
                    Detail Pengguna
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        User ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        placeholder="Masukkan User ID"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-red-500 focus:outline-none transition-colors"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        WhatsApp (Opsional)
                      </label>
                      <input
                        type="text"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="08xxxxxxxxxx"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-red-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="bg-[#141419] border border-white/10 rounded-2xl p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-red-500" />
                    Metode Pembayaran
                  </h3>
                  
                  <div className="space-y-2">
                    {PAYMENT_GROUPS.map((group) => (
                      <div key={group.id} className="border border-white/10 rounded-xl overflow-hidden">
                        <button
                          onClick={() => setOpenPaymentGroup(openPaymentGroup === group.id ? null : group.id)}
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{group.icon}</span>
                            <span className="font-medium">{group.name}</span>
                          </div>
                          <ChevronRight className={`w-5 h-5 transition-transform ${openPaymentGroup === group.id ? 'rotate-90' : ''}`} />
                        </button>
                        
                        {openPaymentGroup === group.id && (
                          <div className="border-t border-white/10">
                            {group.methods.map((method) => (
                              <button
                                key={method.code}
                                onClick={() => setSelectedPayment(method)}
                                className={`w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors ${
                                  selectedPayment?.code === method.code ? 'bg-red-500/10 border-l-2 border-red-500' : ''
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <span>{method.icon}</span>
                                  <span className="text-sm">{method.name}</span>
                                </div>
                                <span className="text-xs text-gray-400">{method.fee}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-[#141419] border border-white/10 rounded-2xl p-4">
                  <h3 className="font-semibold mb-4">Ringkasan</h3>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-400">
                      <span>Subtotal ({cart.reduce((a, b) => a + b.quantity, 0)} item)</span>
                      <span>Rp {getTotalPrice().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Biaya Admin</span>
                      <span>Rp {getFee().toLocaleString()}</span>
                    </div>
                    <div className="border-t border-white/10 pt-2 mt-2">
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span className="text-red-400">Rp {getGrandTotal().toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={loading || cart.length === 0}
                    className="w-full mt-4 py-3 bg-red-600 hover:bg-red-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl font-medium flex items-center justify-center gap-2 transition-all"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        Bayar Sekarang
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
