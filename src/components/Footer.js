import Link from 'next/link';
import { Crown, Mail, Phone, MapPin } from 'lucide-react';

const PAYMENT_METHODS = [
    { name: 'QRIS', image: 'https://is3.cloudhost.id/carenindonesia/bisacash/qr.png' },
    { name: 'Dana', image: 'https://is3.cloudhost.id/carenindonesia/bisacash/dana.jpg' },
    { name: 'OVO', image: 'https://is3.cloudhost.id/carenindonesia/bisacash/ovo.png' },
    { name: 'ShopeePay', image: 'https://is3.cloudhost.id/carenindonesia/bisacash/shp.jpg' },
];

const FOOTER_LINKS = {
    produk: [
        { label: 'Cloud Phone', href: '/product/redfinger' },
        { label: 'Game Top Up', href: '#' },
        { label: 'Voucher', href: '#' },
    ],
    bantuan: [
        { label: 'Cara Pemesanan', href: '#' },
        { label: 'Syarat & Ketentuan', href: '/terms' },
        { label: 'Kebijakan Privasi', href: '/privacy' },
        { label: 'FAQ', href: '#' },
    ],
    kontak: [
        { icon: Mail, label: 'support@kingblox.id', href: 'mailto:support@kingblox.id' },
        { icon: Phone, label: '+62 812-3456-7890', href: 'https://wa.me/6281234567890' },
    ],
};

export default function Footer() {
    return (
        <footer className="bg-[#08080c] border-t border-white/10">
            {/* Payment Methods */}
            <div className="border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex flex-wrap items-center justify-center gap-6">
                        <span className="text-sm text-gray-500">Metode Pembayaran:</span>
                        {PAYMENT_METHODS.map((method) => (
                            <div
                                key={method.name}
                                className="h-10 px-4 bg-white rounded-lg flex items-center justify-center"
                            >
                                <img
                                    src={method.image}
                                    alt={method.name}
                                    className="h-6 object-contain"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Footer */}
            <div className="max-w-7xl mx-auto px-6 py-16">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
                    {/* Brand */}
                    <div className="lg:col-span-1">
                        <Link href="/" className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
                                <Crown className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                                KingBlox
                            </span>
                        </Link>
                        <p className="text-gray-400 text-sm leading-relaxed mb-6">
                            Platform cloud phone & game top-up terpercaya di Indonesia dengan harga termurah dan proses otomatis 24/7.
                        </p>
                        <div className="flex gap-4">
                            {FOOTER_LINKS.kontak.map((item, i) => (
                                <a
                                    key={i}
                                    href={item.href}
                                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all"
                                    title={item.label}
                                >
                                    <item.icon className="w-4 h-4 text-gray-400" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="font-semibold text-white mb-6">Produk</h4>
                        <ul className="space-y-4">
                            {FOOTER_LINKS.produk.map((link, i) => (
                                <li key={i}>
                                    <Link
                                        href={link.href}
                                        className="text-gray-400 hover:text-white transition-colors text-sm"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-white mb-6">Bantuan</h4>
                        <ul className="space-y-4">
                            {FOOTER_LINKS.bantuan.map((link, i) => (
                                <li key={i}>
                                    <Link
                                        href={link.href}
                                        className="text-gray-400 hover:text-white transition-colors text-sm"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h4 className="font-semibold text-white mb-6">Ikuti Update</h4>
                        <p className="text-gray-400 text-sm mb-4">
                            Dapatkan info promo dan update terbaru dari kami.
                        </p>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                placeholder="Email kamu"
                                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:border-red-500/50 transition-colors"
                            />
                            <button className="px-4 py-3 bg-red-600 hover:bg-red-500 rounded-xl transition-colors">
                                <Mail className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Copyright */}
            <div className="border-t border-white/10">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-gray-500 text-sm">
                            © 2026 KingBlox. All rights reserved.
                        </p>
                        <div className="flex items-center gap-6">
                            <Link href="/terms" className="text-gray-500 hover:text-gray-400 text-sm transition-colors">
                                Terms
                            </Link>
                            <Link href="/privacy" className="text-gray-500 hover:text-gray-400 text-sm transition-colors">
                                Privacy
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
