'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Zap, Shield, Clock, Headphones, ChevronRight, Star, Package, Truck, CheckCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const PRODUCTS = [
  {
    slug: 'redfinger',
    name: 'Redfinger Cloud Phone',
    category: 'Cloud Phone',
    image: '/redfinger-icon.png',
    description: 'Cloud Phone Android 24/7 online. Solusi terbaik untuk bot, farming game, & multi-account.',
    badge: 'Best Seller',
    price: 'Rp 19.000',
    features: ['Android 10/11', 'RAM 2-8GB', '24/7 Online', 'Instant Setup']
  },
];

const FEATURES = [
  { icon: Shield, title: 'Jaminan Aman', desc: 'Transaksi terenkripsi & bergaransi 100%' },
  { icon: Zap, title: 'Proses Otomatis', desc: 'Pengiriman instan kurang dari 1 menit' },
  { icon: Clock, title: 'Support 24/7', desc: 'Tim support siap membantu kapan saja' },
  { icon: Truck, title: 'Delivery Cepat', desc: 'Kode langsung dikirim ke email/WhatsApp' },
];

const TESTIMONIALS = [
  { name: 'Ahmad R.', text: 'Pelayanan cepat dan aman. Langsung terima kode setelah bayar!', rating: 5 },
  { name: 'Siti M.', text: 'Harga paling murah se-Indonesia. Sudah langganan 3 bulan.', rating: 5 },
  { name: 'Budi K.', text: 'Supportnya responsif banget. Cloud phonenya juga stabil.', rating: 5 },
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-20">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-red-600/20 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[150px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0f]/50 to-[#0a0a0f]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-6">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-gray-300">Server Operational</span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-bold leading-tight mb-6">
                <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                  Cloud Phone
                </span>
                <br />
                <span className="bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent">
                  Termurah
                </span>
              </h1>

              <p className="text-lg text-gray-400 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Layanan cloud phone & game top-up terpercaya dengan harga terbaik. 
                Proses otomatis 24/7, garansi uang kembali.
              </p>

              {/* Search Box */}
              <div className="relative max-w-md mx-auto lg:mx-0 mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-amber-600 rounded-2xl blur opacity-20" />
                <div className="relative flex items-center bg-[#141419] border border-white/10 rounded-2xl p-2">
                  <Search className="w-5 h-5 text-gray-500 ml-4" />
                  <input
                    type="text"
                    placeholder="Cari produk..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-white placeholder-gray-500"
                  />
                  <button className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-xl font-semibold transition-all duration-300">
                    Cari
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-8">
                {[
                  { value: '10K+', label: 'Customers' },
                  { value: '99%', label: 'Uptime' },
                  { value: '4.9', label: 'Rating' },
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Content - Product Card */}
            <div className="hidden lg:block relative">
              <div className="absolute inset-0 bg-gradient-to-r from-red-600/30 to-amber-600/30 rounded-3xl blur-3xl" />
              <div className="relative bg-gradient-to-br from-[#1a1a24] to-[#12121a] border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                <div className="relative h-64 rounded-2xl overflow-hidden mb-6 bg-[#1a1a2e]">
                  <img
                    src="/redfinger-icon.png"
                    alt="Cloud Phone"
                    className="w-full h-full object-contain p-4"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#12121a] via-transparent to-transparent" />
                  <div className="absolute top-4 left-4 px-3 py-1 bg-red-600 rounded-full text-xs font-bold">
                    POPULAR
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2">Redfinger Cloud Phone</h3>
                <p className="text-gray-400 mb-4">Android 24/7 Online • Instant Setup</p>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-amber-400">Rp 19.000</span>
                  <Link
                    href="/product/redfinger"
                    className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-semibold hover:bg-gray-200 transition-all"
                  >
                    Beli <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {FEATURES.map((feature, i) => (
              <div key={i} className="flex items-start gap-4 group">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:border-red-500/50 transition-all">
                  <feature.icon className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">{feature.title}</h4>
                  <p className="text-sm text-gray-500">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 rounded-full bg-red-600/10 border border-red-600/20 text-red-400 text-sm font-medium mb-4">
              Produk Unggulan
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              Pilihan <span className="text-red-500">Terbaik</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Solusi cloud phone berkualitas tinggi dengan harga termurah di Indonesia
            </p>
          </div>

          {/* Product Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {PRODUCTS.map((product) => (
              <Link
                key={product.slug}
                href={`/product/${product.slug}`}
                className="group relative bg-gradient-to-br from-[#141419] to-[#0f0f13] border border-white/10 rounded-3xl overflow-hidden hover:border-red-500/30 transition-all duration-500"
              >
                {/* Image */}
                <div className="relative h-56 overflow-hidden bg-[#1a1a2e]">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-contain p-6 group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f13] via-transparent to-transparent" />
                  {product.badge && (
                    <div className="absolute top-4 left-4 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full text-xs font-bold text-white">
                      ⭐ {product.badge}
                    </div>
                  )}
                  <div className="absolute top-4 right-4 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-medium border border-white/10">
                    {product.category}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 group-hover:text-red-400 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {product.description}
                  </p>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {product.features.map((feat, i) => (
                      <span key={i} className="px-2 py-1 bg-white/5 rounded text-xs text-gray-400 border border-white/5">
                        {feat}
                      </span>
                    ))}
                  </div>

                  {/* Price & CTA */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div>
                      <span className="text-xs text-gray-500">Mulai dari</span>
                      <div className="text-2xl font-bold text-amber-400">{product.price}</div>
                    </div>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl font-medium transition-all group-hover:gap-3">
                      Pesan <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Link>
            ))}

            {/* Coming Soon Card */}
            <div className="relative bg-gradient-to-br from-[#141419] to-[#0f0f13] border border-dashed border-white/20 rounded-3xl p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-400 mb-2">Coming Soon</h3>
              <p className="text-sm text-gray-600">Produk baru akan segera hadir</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-[#08080c]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Cara <span className="text-red-500">Pemesanan</span>
            </h2>
            <p className="text-gray-400">Proses mudah dalam 3 langkah</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Pilih Produk', desc: 'Pilih paket cloud phone yang sesuai kebutuhan Anda' },
              { step: '02', title: 'Lakukan Pembayaran', desc: 'Bayar dengan metode pembayaran favorit Anda' },
              { step: '03', title: 'Terima Kode', desc: 'Kode redeem akan dikirim otomatis ke email/WhatsApp' },
            ].map((item, i) => (
              <div key={i} className="relative text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-red-600/20 to-amber-600/20 border border-red-500/20 flex items-center justify-center">
                  <span className="text-2xl font-bold bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-gray-400">{item.desc}</p>
                {i < 2 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-full h-px bg-gradient-to-r from-red-500/50 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Testimoni <span className="text-red-500">Pelanggan</span>
            </h2>
            <p className="text-gray-400">Apa kata mereka tentang kami</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((testi, i) => (
              <div key={i} className="bg-[#141419] border border-white/10 rounded-2xl p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(testi.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-4">&ldquo;{testi.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center font-bold text-sm">
                    {testi.name[0]}
                  </div>
                  <span className="font-medium">{testi.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-600 to-red-800 p-12 lg:p-16 text-center">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />
            <div className="relative z-10">
              <h2 className="text-3xl lg:text-5xl font-bold mb-4">
                Siap Mulai?
              </h2>
              <p className="text-red-100 text-lg mb-8 max-w-2xl mx-auto">
                Bergabung dengan 10,000+ pengguna yang sudah menggunakan layanan kami
              </p>
              <Link
                href="/product/redfinger"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-red-600 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all"
              >
                Pesan Sekarang <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
