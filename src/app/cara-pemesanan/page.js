'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  ShoppingCart, 
  User, 
  CreditCard, 
  CheckCircle, 
  Package,
  ArrowRight,
  MessageCircle,
  QrCode,
  Building2,
  Wallet,
  Store,
  Smartphone
} from 'lucide-react';

const STEPS = [
  {
    icon: User,
    title: 'Login / Register',
    description: 'Buat akun atau login ke akun KingBlox Anda untuk memulai pemesanan.',
    color: 'from-blue-500 to-blue-600'
  },
  {
    icon: ShoppingCart,
    title: 'Pilih Produk',
    description: 'Pilih paket Cloud Phone yang sesuai dengan kebutuhan Anda dari halaman produk.',
    color: 'from-red-500 to-red-600'
  },
  {
    icon: Package,
    title: 'Masukkan User ID',
    description: 'Masukkan User ID akun Redfinger Anda atau buat akun baru jika belum memiliki.',
    color: 'from-amber-500 to-amber-600'
  },
  {
    icon: CreditCard,
    title: 'Pilih Pembayaran',
    description: 'Pilih metode pembayaran yang tersedia (QRIS, Virtual Account, E-Wallet, atau Retail).',
    color: 'from-green-500 to-green-600'
  },
  {
    icon: CheckCircle,
    title: 'Konfirmasi & Bayar',
    description: 'Periksa kembali pesanan Anda dan lakukan pembayaran sesuai instruksi.',
    color: 'from-purple-500 to-purple-600'
  },
  {
    icon: MessageCircle,
    title: 'Terima Kode',
    description: 'Kode redeem akan dikirim ke email/WhatsApp Anda setelah pembayaran berhasil.',
    color: 'from-pink-500 to-pink-600'
  }
];

const PAYMENT_METHODS = [
  { name: 'QRIS', Icon: QrCode, description: 'Semua E-Wallet & Banking' },
  { name: 'Virtual Account', Icon: Building2, description: 'Mandiri, BNI, BRI, ATM Bersama' },
  { name: 'E-Wallet', Icon: Wallet, description: 'OVO, DANA, ShopeePay, GoPay' },
  { name: 'Retail', Icon: Store, description: 'Indomaret & Alfamart' },
];

export default function CaraPemesanan() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar />
      
      <main className="pt-24 pb-12">
        {/* Hero Section */}
        <section className="relative py-16 px-4">
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-red-600/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px]" />
          </div>
          
          <div className="relative max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Cara <span className="text-red-500">Pemesanan</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Panduan lengkap cara memesan Cloud Phone di KingBlox. 
              Proses cepat, aman, dan otomatis.
            </p>
          </div>
        </section>

        {/* Steps Section */}
        <section className="py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {STEPS.map((step, index) => (
                <div 
                  key={index}
                  className="group relative bg-[#141419] border border-white/10 rounded-2xl p-6 hover:border-red-500/50 transition-all"
                >
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <step.icon className="w-7 h-7 text-white" />
                  </div>
                  
                  <div className="absolute top-4 right-4 text-5xl font-bold text-white/5">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Payment Methods */}
        <section className="py-12 px-4 border-t border-white/10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">
              Metode <span className="text-red-500">Pembayaran</span>
            </h2>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {PAYMENT_METHODS.map((method, index) => (
                <div 
                  key={index}
                  className="bg-[#141419] border border-white/10 rounded-xl p-4 text-center hover:border-red-500/30 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-red-600/20 flex items-center justify-center mx-auto mb-3">
                    <method.Icon className="w-6 h-6 text-red-500" />
                  </div>
                  <h4 className="font-semibold mb-1">{method.name}</h4>
                  <p className="text-xs text-gray-400">{method.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tips Section */}
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-red-600/10 to-amber-600/10 border border-red-500/20 rounded-2xl p-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <Package className="w-6 h-6 text-red-500" />
                Tips Pemesanan
              </h2>
              
              <div className="space-y-4">
                {[
                  'Pastikan User ID Redfinger Anda sudah benar sebelum checkout',
                  'Simpan bukti pembayaran hingga kode redeem diterima',
                  'Kode redeem akan dikirim dalam waktu 1-5 menit setelah pembayaran',
                  'Hubungi support jika ada kendala dalam 24 jam',
                  'Gunakan fitur keranjang untuk memesan multiple item sekaligus'
                ].map((tip, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-300">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 px-4 text-center">
          <a 
            href="/product/redfinger"
            className="inline-flex items-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-500 rounded-xl font-semibold transition-all"
          >
            <Smartphone className="w-5 h-5" />
            Pesan Sekarang
            <ArrowRight className="w-5 h-5" />
          </a>
        </section>
      </main>

      <Footer />
    </div>
  );
}
