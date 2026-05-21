'use client';

import { Lock, Eye, Database, Share2, Cookie } from 'lucide-react';
import { LegalPage } from '@/components/legal-page';
import { Card } from '@/components/ui/card';

const SECTIONS = [
    {
        title: 'Informasi yang Kami Kumpulkan',
        icon: Database,
        items: [
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
        items: [
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
        items: [
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
        items: [
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
        items: [
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

const RightsCard = (
    <Card key="rights" variant="gradient" padding="lg" className="border-brand-500/20">
        <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-2xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-brand-500" />
            </div>
            <h2 className="text-xl md:text-2xl font-display font-bold">Hak Privasi Anda</h2>
        </div>
        <p className="text-muted-foreground mb-5 text-sm md:text-base">
            Sebagai pengguna, Anda memiliki hak untuk:
        </p>
        <ul className="space-y-3">
            {RIGHTS.map((right, i) => (
                <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Lock className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <p className="text-foreground text-sm md:text-base">{right}</p>
                </li>
            ))}
        </ul>
    </Card>
);

export default function KebijakanPrivasi() {
    return (
        <LegalPage
            heroIcon={Lock}
            eyebrow="Privacy"
            title="Kebijakan"
            titleHighlight="Privasi"
            description="Privasi Anda adalah prioritas kami. Pelajari bagaimana kami mengumpulkan, menggunakan, dan melindungi data pribadi Anda."
            updatedDate="21 Mei 2026"
            sections={SECTIONS}
            extraSections={[RightsCard]}
        />
    );
}
