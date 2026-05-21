'use client';

import { useEffect, useState } from 'react';
import { use } from 'react'; // React 19 / Next 15 hook
import Link from 'next/link';
import { CheckCircle, Clock, XCircle, Copy, Home } from 'lucide-react';
import { toast } from 'sonner';

export default function OrderPage({ params }) {
    // Unwrap params
    const { orderId } = use(params);

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // Poll for order status or just fetch once? For now, fetch once.
        // In a real app, you might use Firestore onSnapshot for real-time updates.
        const fetchOrder = async () => {
            try {
                const res = await fetch(`/api/transaction/check?orderId=${orderId}`);
                const data = await res.json();

                if (!res.ok) throw new Error(data.message || 'Order not found');
                setOrder(data.order);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();

        // Simple polling every 10 seconds to check for payment success
        const interval = setInterval(fetchOrder, 10000);
        return () => clearInterval(interval);
    }, [orderId]);

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Disalin ke clipboard!');
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--body-bg)] text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary-color)]"></div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--body-bg)] text-white gap-4">
            <XCircle className="w-16 h-16 text-red-500" />
            <h1 className="text-2xl font-bold">Terjadi Kesalahan</h1>
            <p className="text-gray-400">{error}</p>
            <Link href="/" className="px-4 py-2 bg-[var(--primary-color)] rounded hover:opacity-90">Kembali ke Beranda</Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-[var(--body-bg)] text-[var(--body-text)] py-10 px-4">
            <div className="max-w-md mx-auto bg-[var(--card-bg)] rounded-xl shadow-2xl overflow-hidden border border-gray-800">

                {/* Header Status */}
                <div className={`p-6 text-center ${order.status === 'SUCCESS' ? 'bg-green-600' :
                        order.status === 'FAILED' ? 'bg-red-600' :
                            'bg-yellow-600'
                    }`}>
                    {order.status === 'SUCCESS' && <CheckCircle className="w-16 h-16 mx-auto mb-2 text-white" />}
                    {order.status === 'FAILED' && <XCircle className="w-16 h-16 mx-auto mb-2 text-white" />}
                    {order.status === 'PENDING' && <Clock className="w-16 h-16 mx-auto mb-2 text-white animate-pulse" />}

                    <h1 className="text-2xl font-bold text-white">
                        {order.status === 'SUCCESS' ? 'Pembayaran Berhasil' :
                            order.status === 'FAILED' ? 'Transaksi Gagal' :
                                'Menunggu Pembayaran'}
                    </h1>
                    <p className="text-white/80 text-sm mt-1">Order ID: {order.orderId}</p>
                </div>

                {/* Order Details */}
                <div className="p-6 space-y-6">

                    {/* Item Info */}
                    <div className="flex justify-between items-center border-b border-gray-700 pb-4">
                        <div>
                            <p className="text-sm text-gray-400">Item</p>
                            <p className="font-bold">{order.itemName}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-400">Harga</p>
                            <p className="font-bold text-[var(--primary-color)]">Rp {order.price.toLocaleString('id-ID')}</p>
                        </div>
                    </div>

                    {/* Payment Instructions */}
                    {order.status === 'PENDING' && (
                        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                            <p className="text-sm text-gray-400 mb-3">Metode Pembayaran: <span className="font-bold text-white">{order.paymentMethod}</span></p>

                            {/* QRIS QR Code Display - SQ or QRIS */}
                            {(order.paymentMethod === 'QRIS' || order.paymentMethod === 'SQ') && order.qrString && (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="bg-white p-4 rounded-lg border-2 border-gray-300">
                                        <img 
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(order.qrString)}`} 
                                            alt="QR Code QRIS" 
                                            className="w-56 h-56"
                                        />
                                    </div>
                                    <div className="w-full">
                                        <h4 className="font-bold text-white mb-2 text-center">📱 Scan QRIS</h4>
                                        <p className="text-xs text-center text-gray-400">
                                            Scan kode QR di atas menggunakan e-wallet Anda (GoPay, OVO, Dana, ShopeePay) atau Mobile Banking untuk melakukan pembayaran.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Virtual Account for Non-QRIS Methods */}
                            {order.paymentMethod !== 'QRIS' && order.paymentMethod !== 'SQ' && (order.vaNumber || order.paymentCode) && (
                                <div className="mb-4">
                                    <p className="text-xs text-gray-500 mb-2">Nomor Virtual Account / Kode Bayar</p>
                                    <div className="flex items-center gap-2 bg-gray-900 p-3 rounded border border-gray-600">
                                        <span className="font-mono text-lg font-bold flex-1">{order.vaNumber || order.paymentCode}</span>
                                        <button onClick={() => copyToClipboard(order.vaNumber || order.paymentCode)} className="p-2 hover:bg-gray-700 rounded transition">
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Fallback Payment URL if available */}
                            {order.paymentUrl && !order.qrString && (
                                <div className="mt-4 text-center">
                                    <a 
                                        href={order.paymentUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="inline-block w-full py-3 bg-[var(--primary-color)] text-white font-bold rounded-lg hover:opacity-90 transition"
                                    >
                                        💳 Bayar Sekarang
                                    </a>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Redeem Code - Shown after payment success */}
                    {order.status === 'SUCCESS' && order.redeemCode && (
                        <div className="bg-green-900/30 p-4 rounded-lg border border-green-700">
                            <h3 className="text-green-400 font-bold text-sm mb-2">🎉 Kode Redeem Kamu</h3>
                            <div className="flex items-center gap-2 bg-gray-900 p-3 rounded border border-green-600">
                                <span className="font-mono text-lg font-bold flex-1 text-green-300 break-all">{order.redeemCode}</span>
                                <button 
                                    onClick={() => copyToClipboard(order.redeemCode)} 
                                    className="p-2 hover:bg-gray-700 rounded transition flex-shrink-0"
                                >
                                    <Copy className="w-4 h-4 text-green-400" />
                                </button>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">Simpan kode ini baik-baik. Kode hanya ditampilkan sekali.</p>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex flex-col gap-3 mt-8">
                        <Link href="/" className="flex items-center justify-center gap-2 w-full py-3 border border-gray-600 rounded-lg hover:bg-gray-800 transition">
                            <Home className="w-4 h-4" /> Kembali ke Beranda
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
}
