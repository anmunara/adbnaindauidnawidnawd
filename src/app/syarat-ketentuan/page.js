'use client';

import { Shield, AlertTriangle, CheckCircle, Scroll } from 'lucide-react';
import { LegalPage } from '@/components/legal-page';

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
        <LegalPage
            heroIcon={Scroll}
            eyebrow="Legal"
            title="Syarat &"
            titleHighlight="Ketentuan"
            description="Harap baca dengan seksama sebelum menggunakan layanan KingBlox. Dengan menggunakan layanan kami, Anda menyetujui semua ketentuan di bawah ini."
            updatedDate="21 Mei 2026"
            sections={SECTIONS}
        />
    );
}
