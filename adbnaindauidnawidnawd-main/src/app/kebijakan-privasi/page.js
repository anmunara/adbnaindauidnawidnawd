'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Lock, Eye, Database, Share2, Cookie, Mail } from 'lucide-react';

const SECTIONS = [
  {
    title: 'Informasi yang Kami Kumpulkan',
    icon: Database,
    content: [
      'Informasi akun: nama, email, nomor telepon saat registrasi.',
      'Informasi transaksi: riwayat pembelian, metode pembayaran, detail pesanan.',
      'Informasi teknis: IP address, browser, device yang digunakan.',
      'Informasi penggunaan: halaman yang dikunjungi, waktu akses, aktivitas di website.',
      'Cookies dan data tracking untuk meningkatkan pengalaman pengguna.'
    ]
  },
  {
    title: 'Penggunaan Informasi',
    icon: Eye,
    content: [
      'Memproses dan mengelola pesanan Anda.',
      'Mengirim kode redeem dan notifikasi transaksi.',
      'Memberikan dukungan pelanggan dan menanggapi pertanyaan.',
      'Meningkatkan kualitas layanan dan pengalaman pengguna.',
      'Mencegah penipuan dan aktivitas ilegal.',
      'Mengirim informasi promo dan update (dengan persetujuan pengguna).'
    ]
  },
  {
    title: 'Perlindungan Data',
    icon: Lock,
    content: [
      'Kami menggunakan enkripsi SSL untuk melindungi data transaksi.',
      'Data disimpan di server yang aman dengan firewall dan proteksi DDoS.',
      'Akses data terbatas hanya untuk staf yang berwenang.',
      'Kami tidak menyimpan informasi kartu kredit atau password pembayaran.',
      'Regular security audit untuk memastikan keamanan sistem.'
    ]
  },
  {
    title: 'Berbagi Informasi',
    icon: Share2,
    content: [
      'Kami TIDAK menjual atau menyewakan data pribadi pengguna.',
      'Data hanya dibagikan dengan penyedia layanan pembayaran terpercaya.',
      'Data dapat dibagikan jika diwajibkan oleh hukum atau perintah pengadilan.',
      'Data dapat dibagikan dengan pihak ketiga untuk analisis (tanpa identitas pribadi).',
      'Semua pihak ketiga wajib menjaga kerahasiaan data pengguna.'
    ]
  },
  {
    title: 'Cookies',
    icon: Cookie,
    content: [
      'Kami menggunakan cookies untuk menyimpan preferensi pengguna.',
      'Cookies digunakan untuk menjaga session login.',
      'Cookies tracking membantu kami memahami perilaku pengguna.',
      'Pengguna dapat menonaktifkan cookies melalui pengaturan browser.',
      'Menonaktifkan cookies dapat mempengaruhi fungsionalitas website.'
    ]
  }
];

const RIGHTS = [
  'Mengakses data pribadi yang kami miliki tentang Anda',
  'Meminta koreksi data yang tidak akurat',
  'Meminta penghapusan data (dengan batasan tertentu)',
  'Menolak penggunaan data untuk marketing',
  'Mengajukan komplain terkait privasi data'
];

export default function KebijakanPrivasi() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar />
      
      <main className="pt-24 pb-12">
        {/* Hero */}
        <section className="py-16 px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <Lock className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Kebijakan <span className="text-red-500">Privasi</span>
            </h1>
            <p className="text-gray-400 text-lg">
              Privasi Anda adalah prioritas kami. Pelajari bagaimana kami 
              mengumpulkan, menggunakan, dan melindungi data pribadi Anda.
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
                  {section.content.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-2" />
                      <p className="text-gray-300 leading-relaxed">{item}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Hak Pengguna */}
            <div className="bg-gradient-to-br from-red-600/10 to-amber-600/10 border border-red-500/20 rounded-2xl p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-bold mb-6">Hak Privasi Anda</h2>
              <p className="text-gray-300 mb-6">
                Sebagai pengguna, Anda memiliki hak untuk:
              </p>
              <ul className="space-y-4">
                {RIGHTS.map((right, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-300">{right}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Kontak */}
            <div className="bg-[#141419] border border-white/10 rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-red-600/20 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-red-500" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold">Hubungi Kami</h2>
              </div>
              
              <p className="text-gray-300 mb-4">
                Jika Anda memiliki pertanyaan atau kekhawatiran tentang kebijakan privasi ini, 
                silakan hubungi kami melalui:
              </p>
              
              <div className="space-y-2 text-gray-300">
                <p>• Discord: Support Server KingBlox</p>
                <p>• Email: support@kingblox.com</p>
                <p>• WhatsApp: (tersedia di jam kerja)</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
