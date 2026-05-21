'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { HelpCircle, ChevronDown, MessageCircle } from 'lucide-react';

const FAQS = [
  {
    category: 'Umum',
    items: [
      {
        q: 'Apa itu KingBlox?',
        a: 'KingBlox adalah platform e-commerce yang menyediakan layanan Cloud Phone Redfinger. Kami menyediakan kode redeem untuk mengaktifkan layanan Cloud Phone Android 24/7.'
      },
      {
        q: 'Apa itu Cloud Phone?',
        a: 'Cloud Phone adalah layanan virtual Android yang berjalan di cloud server. Anda bisa mengaksesnya kapan saja untuk menjalankan aplikasi, game, atau bot tanpa menggunakan device fisik.'
      },
      {
        q: 'Apakah KingBlox resmi?',
        a: 'Ya, KingBlox adalah reseller resmi produk Redfinger Cloud Phone. Semua kode redeem yang kami jual adalah original dan legal.'
      }
    ]
  },
  {
    category: 'Pemesanan & Pembayaran',
    items: [
      {
        q: 'Bagaimana cara memesan?',
        a: 'Pilih produk di halaman Produk, masukkan User ID Redfinger Anda, pilih metode pembayaran, lalu lakukan pembayaran sesuai instruksi. Kode redeem akan dikirim otomatis setelah pembayaran berhasil.'
      },
      {
        q: 'Metode pembayaran apa saja yang tersedia?',
        a: 'Kami menerima QRIS (semua e-wallet), Virtual Account (Mandiri, BNI, BRI), E-Wallet (OVO, DANA, ShopeePay, GoPay), dan Retail (Indomaret, Alfamart).'
      },
      {
        q: 'Berapa lama kode redeem dikirim?',
        a: 'Kode redeem akan dikirim dalam waktu 1-5 menit setelah pembayaran berhasil dan terverifikasi.'
      },
      {
        q: 'Apakah bisa refund?',
        a: 'Semua penjualan bersifat final. Refund hanya dapat dilakukan jika terjadi kesalahan sistem dari pihak kami, bukan karena kesalahan input data.'
      }
    ]
  },
  {
    category: 'Produk & Layanan',
    items: [
      {
        q: 'Berapa lama masa aktif Cloud Phone?',
        a: 'Masa aktif tergantung paket yang Anda beli: 7 hari, 30 hari, 60 hari, atau 90 hari. Masa aktif dihitung sejak kode diredeem.'
      },
      {
        q: 'Bagaimana cara redeem kode?',
        a: 'Login ke aplikasi Redfinger, masuk ke menu "Redeem" atau "Top Up", masukkan kode yang Anda terima, lalu klik "Redeem".'
      },
      {
        q: 'Apakah kode bisa dipakai berkali-kali?',
        a: 'Tidak. Setiap kode hanya bisa digunakan satu kali untuk satu akun Redfinger.'
      },
      {
        q: 'Apakah stok selalu tersedia?',
        a: 'Stok kami terbatas dan dapat habis sewaktu-waktu. Kami sarankan untuk membeli saat stok masih tersedia.'
      }
    ]
  },
  {
    category: 'Teknis',
    items: [
      {
        q: 'Cloud Phone bisa untuk game apa saja?',
        a: 'Cloud Phone Redfinger bisa digunakan untuk berbagai game Android seperti Roblox, Mobile Legends, Free Fire, dan lainnya. Pastikan game kompatibel dengan Android 10/11.'
      },
      {
        q: 'Apakah bisa multi-instance?',
        a: 'Ya, Anda bisa menjalankan multiple Cloud Phone sekaligus tergantung spesifikasi paket yang Anda beli.'
      },
      {
        q: 'Apakah data saya aman?',
        a: 'Ya, setiap Cloud Phone memiliki environment yang terisolasi. Data Anda tidak akan tercampur dengan pengguna lain.'
      }
    ]
  },
  {
    category: 'Bantuan',
    items: [
      {
        q: 'Bagaimana jika kode tidak berfungsi?',
        a: 'Pastikan kode dimasukkan dengan benar (perhatikan huruf besar/kecil). Jika masih bermasalah, hubungi support kami dengan menyertakan bukti pembelian.'
      },
      {
        q: 'Bagaimana cara menghubungi support?',
        a: 'Anda bisa menghubungi kami melalui Discord server kami atau WhatsApp (jam kerja). Tim support kami siap membantu.'
      },
      {
        q: 'Jam berapa support online?',
        a: 'Support Discord tersedia 24/7. Support WhatsApp tersedia pada jam kerja (09:00 - 21:00 WIB).'
      }
    ]
  }
];

function FAQItem({ question, answer, isOpen, onClick }) {
  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
      >
        <span className="font-medium pr-4">{question}</span>
        <ChevronDown 
          className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      {isOpen && (
        <div className="px-4 pb-4 border-t border-white/10">
          <p className="text-gray-400 pt-4 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  const [openItems, setOpenItems] = useState({});

  const toggleItem = (categoryIndex, itemIndex) => {
    const key = `${categoryIndex}-${itemIndex}`;
    setOpenItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar />
      
      <main className="pt-24 pb-12">
        {/* Hero */}
        <section className="py-16 px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <HelpCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Frequently Asked <span className="text-red-500">Questions</span>
            </h1>
            <p className="text-gray-400 text-lg">
              Temukan jawaban untuk pertanyaan umum seputar layanan KingBlox.
            </p>
          </div>
        </section>

        {/* FAQ Content */}
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            {FAQS.map((category, catIndex) => (
              <div key={catIndex}>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-red-600/20 flex items-center justify-center text-sm">
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
        </section>

        {/* Contact CTA */}
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-red-600/10 to-amber-600/10 border border-red-500/20 rounded-2xl p-8 text-center">
              <MessageCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Masih Punya Pertanyaan?</h2>
              <p className="text-gray-400 mb-6">
                Tim support kami siap membantu Anda 24/7
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <a 
                  href="/cara-pemesanan"
                  className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-medium transition-all"
                >
                  Cara Pemesanan
                </a>
                <a 
                  href="https://discord.gg/kingblox"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-medium transition-all"
                >
                  Join Discord
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
