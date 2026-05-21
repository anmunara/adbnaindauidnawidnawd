'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';

const SECTIONS = [
  {
    title: 'Ketentuan Umum',
    icon: Shield,
    items: [
      'Dengan menggunakan layanan KingBlox, Anda menyetujui semua syarat dan ketentuan yang berlaku.',
      'KingBlox berhak mengubah syarat dan ketentuan sewaktu-waktu tanpa pemberitahuan terlebih dahulu.',
      'Pengguna wajib berusia minimal 18 tahun atau memiliki izin dari orang tua/wali.',
      'Semua transaksi bersifat final dan tidak dapat dibatalkan setelah pembayaran berhasil.',
      'KingBlox hanya menyediakan layanan Cloud Phone, bukan akun game atau aplikasi pihak ketiga.'
    ]
  },
  {
    title: 'Ketentuan Produk',
    icon: CheckCircle,
    items: [
      'Produk yang dijual adalah kode redeem untuk layanan Cloud Phone Redfinger.',
      'Masa aktif produk sesuai dengan paket yang dipilih (7 hari, 30 hari, dll).',
      'Kode redeem harus digunakan sebelum masa berlaku habis.',
      'KingBlox tidak bertanggung jawab atas kerugian akibat kode yang tidak digunakan tepat waktu.',
      'Stok produk terbatas dan dapat habis sewaktu-waktu.'
    ]
  },
  {
    title: 'Ketentuan Pembayaran',
    icon: AlertTriangle,
    items: [
      'Pembayaran harus dilakukan sesuai dengan nominal yang tertera di invoice.',
      'Jika pembayaran kurang, pesanan tidak akan diproses dan dana tidak dapat dikembalikan.',
      'Jika pembayaran lebih, kelebihan dana tidak dapat dikembalikan.',
      'Waktu pembayaran maksimal 24 jam setelah pemesanan.',
      'Setelah pembayaran berhasil, kode redeem akan dikirim dalam waktu 1-5 menit.'
    ]
  },
  {
    title: 'Pengembalian & Refund',
    icon: AlertTriangle,
    items: [
      'Semua penjualan bersifat final. Tidak ada refund untuk produk digital yang sudah dikirim.',
      'Refund hanya dapat dilakukan jika terjadi kesalahan sistem dari pihak KingBlox.',
      'Refund tidak berlaku untuk kesalahan input data oleh pembeli.',
      'Proses refund membutuhkan waktu 7-14 hari kerja.',
      'Keputusan refund sepenuhnya berada di tangan KingBlox.'
    ]
  },
  {
    title: 'Batasan Tanggung Jawab',
    icon: Shield,
    items: [
      'KingBlox tidak bertanggung jawab atas penggunaan layanan Cloud Phone oleh pengguna.',
      'KingBlox tidak bertanggung jawab atas banned atau suspend akun game/aplikasi.',
      'KingBlox tidak bertanggung jawab atas kerugian akibat force majeure.',
      'KingBlox tidak menjamin ketersediaan layanan 100% tanpa gangguan.',
      'Pengguna bertanggung jawab penuh atas keamanan akun mereka.'
    ]
  }
];

export default function SyaratKetentuan() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar />
      
      <main className="pt-24 pb-12">
        {/* Hero */}
        <section className="py-16 px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <Shield className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Syarat & <span className="text-red-500">Ketentuan</span>
            </h1>
            <p className="text-gray-400 text-lg">
              Harap baca dengan seksama sebelum menggunakan layanan KingBlox.
              Dengan menggunakan layanan kami, Anda menyetujui semua ketentuan di bawah ini.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Terakhir diperbarui: 16 Maret 2026
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            {SECTIONS.map((section, index) => (
              <div 
                key={index}
                className="bg-[#141419] border border-white/10 rounded-2xl p-6 md:p-8"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-red-600/20 flex items-center justify-center">
                    <section.icon className="w-6 h-6 text-red-500" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold">{section.title}</h2>
                </div>
                
                <ul className="space-y-4">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-2" />
                      <p className="text-gray-300 leading-relaxed">{item}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section className="py-12 px-4 border-t border-white/10">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-gray-400">
              Jika Anda memiliki pertanyaan tentang syarat dan ketentuan ini, 
              silakan hubungi kami melalui Discord atau email support.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
