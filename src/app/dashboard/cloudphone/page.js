'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    DollarSign, ShoppingBag, Users, Package, TrendingUp, Ticket,
    Clock, CheckCircle, XCircle, Crown, ArrowRight, Sparkles, BarChart3
} from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { EmptyState } from '@/components/admin/EmptyState';
import { Select } from '@/components/admin/Select';
import { BarChart } from '@/components/admin/SparkChart';

const formatCurrency = (n) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

const formatNumber = (n) => new Intl.NumberFormat('id-ID').format(n || 0);

export default function AnalyticsDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(14);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/admin/analytics/get?days=${days}`, { cache: 'no-store' });
                const json = await res.json();
                if (json.success) setData(json.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [days]);

    const chartData = useMemo(() => {
        if (!data?.daily) return [];
        return data.daily.map((d) => {
            const date = new Date(d.date);
            return {
                label: `${date.getDate()}/${date.getMonth() + 1}`,
                value: d.revenue,
                count: d.count,
            };
        });
    }, [data]);

    return (
        <>
            <PageHeader
                eyebrow="Dashboard"
                title="Analytics Overview"
                subtitle="Performa toko & insights bisnis Anda"
                actions={
                    <Select
                        value={String(days)}
                        onChange={(v) => setDays(parseInt(v, 10))}
                        options={[
                            { value: '7', label: '7 hari terakhir' },
                            { value: '14', label: '14 hari terakhir' },
                            { value: '30', label: '30 hari terakhir' },
                            { value: '90', label: '90 hari terakhir' },
                        ]}
                        className="w-44"
                    />
                }
            />

            <div className="px-4 sm:px-6 lg:px-8 pb-12 space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        label="Total Revenue"
                        value={formatCurrency(data?.totalRevenue)}
                        icon={DollarSign}
                        accent="brand"
                        delta={data?.revenueDelta}
                        deltaLabel={`vs ${Math.floor(days / 2)} hari sebelumnya`}
                        loading={loading}
                    />
                    <StatCard
                        label="Transaksi Sukses"
                        value={formatNumber(data?.successCount)}
                        icon={CheckCircle}
                        accent="emerald"
                        loading={loading}
                    />
                    <StatCard
                        label="Avg Order Value"
                        value={formatCurrency(data?.avgOrder)}
                        icon={TrendingUp}
                        accent="blue"
                        loading={loading}
                    />
                    <StatCard
                        label="Total Customer"
                        value={formatNumber(data?.customersCount)}
                        icon={Users}
                        accent="purple"
                        loading={loading}
                    />
                </div>

                {/* Sales Chart */}
                <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-base font-display font-bold flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-brand-500" />
                                Tren Penjualan
                            </h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Revenue harian selama {days} hari terakhir
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="h-56 rounded-xl bg-muted animate-pulse" />
                    ) : chartData.length > 0 && chartData.some((d) => d.value > 0) ? (
                        <BarChart data={chartData} height={220} />
                    ) : (
                        <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
                            Belum ada penjualan di periode ini
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Products */}
                    <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
                        <h2 className="text-base font-display font-bold flex items-center gap-2 mb-4">
                            <Crown className="w-4 h-4 text-amber-500" />
                            Top Products
                        </h2>

                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
                                ))}
                            </div>
                        ) : data?.topProducts?.length > 0 ? (
                            <div className="space-y-2">
                                {data.topProducts.map((p, i) => (
                                    <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted transition-colors">
                                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                            {i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold truncate">{p.name}</p>
                                            <p className="text-xs text-muted-foreground">{p.count} terjual</p>
                                        </div>
                                        <p className="text-sm font-display font-black gradient-text whitespace-nowrap">
                                            {formatCurrency(p.revenue)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon={Package}
                                title="Belum ada penjualan"
                                description="Top products akan muncul di sini setelah ada transaksi sukses."
                            />
                        )}
                    </div>

                    {/* Inventory & Orders Status */}
                    <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
                        <h2 className="text-base font-display font-bold flex items-center gap-2 mb-4">
                            <Sparkles className="w-4 h-4 text-brand-500" />
                            Inventory & Status
                        </h2>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                                <div className="flex items-center gap-2 mb-1">
                                    <Ticket className="w-4 h-4 text-emerald-500" />
                                    <p className="text-xs text-muted-foreground">Kode Ready</p>
                                </div>
                                <p className="text-2xl font-display font-black text-emerald-500">
                                    {loading ? '...' : formatNumber(data?.codesAvailable)}
                                </p>
                            </div>
                            <div className="p-4 rounded-xl bg-zinc-500/5 border border-zinc-500/10">
                                <div className="flex items-center gap-2 mb-1">
                                    <Ticket className="w-4 h-4 text-zinc-500" />
                                    <p className="text-xs text-muted-foreground">Kode Terjual</p>
                                </div>
                                <p className="text-2xl font-display font-black">
                                    {loading ? '...' : formatNumber(data?.codesUsed)}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <StatusRow
                                icon={Clock}
                                label="Pending"
                                value={data?.pendingCount || 0}
                                color="text-amber-500"
                                bg="bg-amber-500/10"
                                loading={loading}
                            />
                            <StatusRow
                                icon={CheckCircle}
                                label="Success"
                                value={data?.successCount || 0}
                                color="text-emerald-500"
                                bg="bg-emerald-500/10"
                                loading={loading}
                            />
                            <StatusRow
                                icon={XCircle}
                                label="Failed / Expired"
                                value={data?.failedCount || 0}
                                color="text-red-500"
                                bg="bg-red-500/10"
                                loading={loading}
                            />
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="rounded-2xl border border-brand-500/20 bg-gradient-to-br from-brand-500/5 via-transparent to-brand-700/5 p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                            <h2 className="text-base font-display font-bold">Quick Actions</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">Akses cepat ke fungsi-fungsi utama</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <QuickAction href="/dashboard/cloudphone/types" icon={Package} label="Manage Types" desc="Atur produk & harga" />
                        <QuickAction href="/dashboard/cloudphone/codes" icon={Ticket} label="Tambah Kode" desc="Upload stok baru" />
                        <QuickAction href="/dashboard/cloudphone/orders" icon={ShoppingBag} label="Lihat Orders" desc="Cek transaksi terbaru" />
                    </div>
                </div>
            </div>
        </>
    );
}

function StatusRow({ icon: Icon, label, value, color, bg, loading }) {
    return (
        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
            <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <span className="text-sm font-medium">{label}</span>
            </div>
            <span className={`text-base font-display font-bold ${color}`}>
                {loading ? '...' : new Intl.NumberFormat('id-ID').format(value)}
            </span>
        </div>
    );
}

function QuickAction({ href, icon: Icon, label, desc }) {
    return (
        <Link
            href={href}
            className="group flex items-center gap-3 p-4 rounded-xl bg-surface border border-border hover:border-brand-500/40 hover:bg-brand-500/5 transition-all"
        >
            <div className="w-11 h-11 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500 flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{label}</p>
                <p className="text-xs text-muted-foreground truncate">{desc}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </Link>
    );
}
