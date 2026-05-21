'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
    ShoppingBag, Download, Search, Filter, Pencil, Trash2,
    Send, RefreshCw, Copy, Check, ExternalLink, MoreVertical,
    User, Calendar, CreditCard, Ticket
} from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SearchInput } from '@/components/admin/SearchInput';
import { EmptyState } from '@/components/admin/EmptyState';
import { BulkActionBar } from '@/components/admin/BulkActionBar';
import { Checkbox } from '@/components/admin/Checkbox';
import { Dialog, ConfirmDialog } from '@/components/admin/Dialog';
import { Select } from '@/components/admin/Select';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { cn } from '@/lib/utils';

const formatCurrency = (n) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

const formatDate = (iso) => {
    if (!iso) return '-';
    try {
        return new Date(iso).toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return iso;
    }
};

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterSource, setFilterSource] = useState('all');
    const [selected, setSelected] = useState(new Set());
    const [copiedId, setCopiedId] = useState(null);

    const [detailOpen, setDetailOpen] = useState(false);
    const [detailOrder, setDetailOrder] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [resendOpen, setResendOpen] = useState(false);
    const [bulkStatusOpen, setBulkStatusOpen] = useState(false);
    const [bulkStatusValue, setBulkStatusValue] = useState('SUCCESS');
    const [saving, setSaving] = useState(false);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/orders/list', { cache: 'no-store' });
            const json = await res.json();
            if (json.success) setOrders(json.data || []);
            else toast.error(json.message || 'Gagal memuat orders');
        } catch {
            toast.error('Gagal memuat orders');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return orders.filter((o) => {
            if (filterStatus !== 'all' && o.status !== filterStatus) return false;
            if (filterSource !== 'all' && o.source !== filterSource) return false;
            if (q) {
                const hay = `${o.orderId} ${o.userId || ''} ${o.userEmail || ''} ${o.itemName || ''} ${o.redeemCode || ''}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [orders, search, filterStatus, filterSource]);

    const allSelected = filtered.length > 0 && filtered.every((o) => selected.has(orderKey(o)));
    const someSelected = filtered.some((o) => selected.has(orderKey(o)));

    const toggleAll = (checked) => {
        if (checked) setSelected(new Set(filtered.map(orderKey)));
        else setSelected(new Set());
    };

    const toggleOne = (o, checked) => {
        const next = new Set(selected);
        const k = orderKey(o);
        if (checked) next.add(k);
        else next.delete(k);
        setSelected(next);
    };

    const openDetail = (order) => {
        setDetailOrder(order);
        setEditForm({
            status: order.status,
            redeemCode: order.redeemCode || '',
            userId: order.userId || '',
            itemName: order.itemName || '',
            price: order.price || 0,
        });
        setDetailOpen(true);
    };

    const handleSave = async () => {
        if (!detailOrder) return;
        setSaving(true);
        try {
            const res = await fetch('/api/admin/orders/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: detailOrder.orderId,
                    source: detailOrder.source,
                    status: editForm.status,
                    redeemCode: editForm.redeemCode,
                    userId: editForm.userId,
                    itemName: editForm.itemName,
                    price: Number(editForm.price) || 0,
                }),
            });
            const json = await res.json();
            if (json.success) {
                toast.success('Order berhasil diupdate');
                setDetailOpen(false);
                await loadOrders();
            } else {
                toast.error(json.message || 'Gagal update');
            }
        } catch {
            toast.error('Terjadi kesalahan');
        } finally {
            setSaving(false);
        }
    };

    const handleResend = async () => {
        if (!detailOrder) return;
        setSaving(true);
        try {
            const res = await fetch('/api/admin/orders/resend-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: detailOrder.orderId, source: detailOrder.source }),
            });
            const json = await res.json();
            if (json.success) {
                toast.success(`Kode baru diberikan: ${json.code}`);
                setResendOpen(false);
                setDetailOpen(false);
                await loadOrders();
            } else {
                toast.error(json.message || 'Gagal resend');
            }
        } catch {
            toast.error('Terjadi kesalahan');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!detailOrder) return;
        setSaving(true);
        try {
            const res = await fetch('/api/admin/orders/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderIds: [{ id: detailOrder.orderId, source: detailOrder.source }],
                }),
            });
            const json = await res.json();
            if (json.success) {
                toast.success('Order dihapus');
                setDeleteOpen(false);
                setDetailOpen(false);
                await loadOrders();
            } else {
                toast.error(json.message || 'Gagal menghapus');
            }
        } catch {
            toast.error('Terjadi kesalahan');
        } finally {
            setSaving(false);
        }
    };

    const handleBulkDelete = async () => {
        const items = filtered
            .filter((o) => selected.has(orderKey(o)))
            .map((o) => ({ id: o.orderId, source: o.source }));
        setSaving(true);
        try {
            const res = await fetch('/api/admin/orders/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderIds: items }),
            });
            const json = await res.json();
            if (json.success) {
                toast.success(`${json.deleted} order dihapus`);
                setSelected(new Set());
                setBulkDeleteOpen(false);
                await loadOrders();
            } else {
                toast.error(json.message || 'Gagal bulk delete');
            }
        } catch {
            toast.error('Terjadi kesalahan');
        } finally {
            setSaving(false);
        }
    };

    const handleBulkStatus = async () => {
        const items = filtered
            .filter((o) => selected.has(orderKey(o)))
            .map((o) => ({ id: o.orderId, source: o.source }));
        setSaving(true);
        try {
            const res = await fetch('/api/admin/orders/bulk-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderIds: items, status: bulkStatusValue }),
            });
            const json = await res.json();
            if (json.success) {
                toast.success(`${json.updated} order diupdate`);
                setSelected(new Set());
                setBulkStatusOpen(false);
                await loadOrders();
            } else {
                toast.error(json.message || 'Gagal bulk update');
            }
        } catch {
            toast.error('Terjadi kesalahan');
        } finally {
            setSaving(false);
        }
    };

    const exportCSV = () => {
        const items = selected.size > 0
            ? filtered.filter((o) => selected.has(orderKey(o)))
            : filtered;

        if (items.length === 0) {
            toast.error('Tidak ada data untuk diexport');
            return;
        }

        const headers = ['Order ID', 'Source', 'Status', 'User ID', 'Email', 'Item', 'Price', 'Payment', 'Redeem Code', 'Created At', 'Paid At'];
        const rows = items.map((o) => [
            o.orderId,
            o.source,
            o.status,
            o.userId || '',
            o.userEmail || '',
            o.itemName || '',
            o.price,
            o.paymentMethod || '',
            o.redeemCode || '',
            o.createdAt || '',
            o.paidAt || '',
        ]);

        const csv = [headers, ...rows]
            .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`${items.length} order diexport`);
    };

    const copy = (text, id) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedId(id);
            toast.success('Disalin');
            setTimeout(() => setCopiedId(null), 1500);
        });
    };

    const stats = useMemo(() => {
        const success = orders.filter((o) => o.status === 'SUCCESS');
        return {
            total: orders.length,
            revenue: success.reduce((acc, o) => acc + (o.price || 0), 0),
            success: success.length,
            pending: orders.filter((o) => o.status === 'PENDING').length,
        };
    }, [orders]);

    return (
        <>
            <PageHeader
                eyebrow="Transactions"
                title="Orders Management"
                subtitle={`${stats.total} total — ${formatCurrency(stats.revenue)} revenue`}
                actions={
                    <button
                        onClick={exportCSV}
                        className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-border hover:bg-muted text-sm font-medium transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                }
            />

            <div className="px-4 sm:px-6 lg:px-8 pb-12 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                    <SearchInput
                        value={search}
                        onChange={setSearch}
                        placeholder="Cari order ID, user, kode..."
                        className="flex-1 min-w-[200px] max-w-md"
                    />
                    <Select
                        value={filterStatus}
                        onChange={setFilterStatus}
                        options={[
                            { value: 'all', label: 'Semua Status' },
                            { value: 'SUCCESS', label: 'Lunas' },
                            { value: 'PENDING', label: 'Menunggu' },
                            { value: 'FAILED', label: 'Gagal' },
                            { value: 'EXPIRED', label: 'Kadaluarsa' },
                            { value: 'REFUNDED', label: 'Refund' },
                        ]}
                        className="w-40"
                    />
                    <Select
                        value={filterSource}
                        onChange={setFilterSource}
                        options={[
                            { value: 'all', label: 'Semua Source' },
                            { value: 'orders', label: 'Website' },
                            { value: 'transactions', label: 'Discord' },
                        ]}
                        className="w-36"
                    />
                </div>

                <BulkActionBar
                    count={selected.size}
                    onClear={() => setSelected(new Set())}
                    actions={
                        <>
                            <button
                                onClick={exportCSV}
                                className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 text-xs font-semibold"
                            >
                                <Download className="w-3.5 h-3.5" />
                                Export
                            </button>
                            <button
                                onClick={() => setBulkStatusOpen(true)}
                                className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-xs font-semibold"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Update Status
                            </button>
                            <button
                                onClick={() => setBulkDeleteOpen(true)}
                                className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-semibold"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Hapus
                            </button>
                        </>
                    }
                />

                {loading ? (
                    <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <EmptyState
                        icon={ShoppingBag}
                        title={search || filterStatus !== 'all' ? 'Tidak ada hasil' : 'Belum ada orders'}
                        description={search ? 'Coba ubah filter atau search.' : 'Order pelanggan akan muncul di sini.'}
                    />
                ) : (
                    <>
                        <div className="flex items-center gap-2 px-1">
                            <Checkbox
                                checked={allSelected}
                                indeterminate={!allSelected && someSelected}
                                onChange={toggleAll}
                            />
                            <span className="text-xs text-muted-foreground">
                                {filtered.length} order ditemukan
                            </span>
                        </div>

                        <div className="space-y-2">
                            {filtered.map((order) => {
                                const isSelected = selected.has(orderKey(order));
                                const isCopied = copiedId === order.orderId;

                                return (
                                    <div
                                        key={orderKey(order)}
                                        className={cn(
                                            "rounded-xl border bg-surface hover:border-brand-500/30 transition-all",
                                            isSelected ? "border-brand-500/50 bg-brand-500/5" : "border-border"
                                        )}
                                    >
                                        <div className="flex items-start gap-3 p-3 sm:p-4">
                                            <Checkbox
                                                checked={isSelected}
                                                onChange={(c) => toggleOne(order, c)}
                                                className="mt-1"
                                            />

                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <button
                                                        onClick={() => copy(order.orderId, order.orderId)}
                                                        className="inline-flex items-center gap-1.5 text-sm font-mono font-bold hover:text-brand-500 transition-colors min-w-0"
                                                    >
                                                        <span className="truncate max-w-[180px] sm:max-w-none">{order.orderId}</span>
                                                        {isCopied ? <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" /> : <Copy className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
                                                    </button>
                                                    <StatusBadge status={order.status} />
                                                    <span className={cn(
                                                        "text-[10px] font-semibold px-1.5 py-0.5 rounded-md",
                                                        order.source === 'orders' ? "bg-blue-500/10 text-blue-500" : "bg-purple-500/10 text-purple-500"
                                                    )}>
                                                        {order.source === 'orders' ? 'WEB' : 'DISCORD'}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mt-2 text-xs">
                                                    <InfoItem icon={User} label={order.userId || order.userEmail || '-'} />
                                                    <InfoItem icon={Ticket} label={order.itemName || '-'} />
                                                    <InfoItem icon={Calendar} label={formatDate(order.createdAt)} />
                                                </div>

                                                {order.redeemCode && (
                                                    <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                                                        <Ticket className="w-3 h-3 text-emerald-500" />
                                                        <code className="text-[11px] font-mono font-bold text-emerald-500">{order.redeemCode}</code>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                                <p className="text-sm sm:text-base font-display font-black gradient-text whitespace-nowrap">
                                                    {formatCurrency(order.price)}
                                                </p>
                                                <button
                                                    onClick={() => openDetail(order)}
                                                    className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-xs font-semibold text-muted-foreground hover:text-brand-500 hover:bg-brand-500/5 transition-colors"
                                                >
                                                    Detail
                                                    <ExternalLink className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Detail / Edit Dialog */}
            <Dialog
                open={detailOpen}
                onClose={() => setDetailOpen(false)}
                title="Detail Order"
                description={detailOrder?.orderId}
                size="lg"
                footer={
                    <>
                        <button
                            onClick={() => setDeleteOpen(true)}
                            disabled={saving}
                            className="h-10 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 text-sm font-semibold transition-colors disabled:opacity-50"
                        >
                            <Trash2 className="w-4 h-4 inline mr-1" />
                            Hapus
                        </button>
                        <div className="flex-1" />
                        <button
                            onClick={() => setResendOpen(true)}
                            disabled={saving}
                            className="h-10 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-sm font-semibold transition-colors disabled:opacity-50"
                        >
                            <Send className="w-4 h-4 inline mr-1.5" />
                            Resend Code
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="h-10 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold shadow-lg shadow-brand-500/30 disabled:opacity-50"
                        >
                            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </>
                }
            >
                {detailOrder && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Status">
                                <Select
                                    value={editForm.status}
                                    onChange={(v) => setEditForm({ ...editForm, status: v })}
                                    options={[
                                        { value: 'PENDING', label: 'Menunggu' },
                                        { value: 'SUCCESS', label: 'Lunas' },
                                        { value: 'FAILED', label: 'Gagal' },
                                        { value: 'EXPIRED', label: 'Kadaluarsa' },
                                        { value: 'REFUNDED', label: 'Refund' },
                                    ]}
                                />
                            </Field>
                            <Field label="Source">
                                <input
                                    disabled
                                    value={detailOrder.source === 'orders' ? 'Website' : 'Discord'}
                                    className="w-full h-10 px-3 rounded-xl bg-muted/30 border border-border text-sm text-muted-foreground"
                                />
                            </Field>
                        </div>

                        <Field label="User / Customer">
                            <input
                                type="text"
                                value={editForm.userId}
                                onChange={(e) => setEditForm({ ...editForm, userId: e.target.value })}
                                className="w-full h-10 px-3 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20"
                            />
                        </Field>

                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Product Name">
                                <input
                                    type="text"
                                    value={editForm.itemName}
                                    onChange={(e) => setEditForm({ ...editForm, itemName: e.target.value })}
                                    className="w-full h-10 px-3 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20"
                                />
                            </Field>
                            <Field label="Price (Rp)">
                                <input
                                    type="number"
                                    value={editForm.price}
                                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                                    className="w-full h-10 px-3 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20"
                                />
                            </Field>
                        </div>

                        <Field label="Redeem Code">
                            <input
                                type="text"
                                value={editForm.redeemCode}
                                onChange={(e) => setEditForm({ ...editForm, redeemCode: e.target.value })}
                                placeholder="Belum ada kode"
                                className="w-full h-10 px-3 rounded-xl bg-muted/50 border border-border text-sm font-mono focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20"
                            />
                        </Field>

                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                            <Info label="Email" value={detailOrder.userEmail} />
                            <Info label="Payment" value={detailOrder.paymentMethod} />
                            <Info label="Created" value={formatDate(detailOrder.createdAt)} />
                            <Info label="Paid At" value={formatDate(detailOrder.paidAt)} />
                            <Info label="Reference" value={detailOrder.reference} mono />
                            <Info label="Item ID" value={detailOrder.itemId} mono />
                        </div>
                    </div>
                )}
            </Dialog>

            <ConfirmDialog
                open={deleteOpen}
                onClose={() => setDeleteOpen(false)}
                onConfirm={handleDelete}
                loading={saving}
                title="Hapus order ini?"
                description="Order akan dihapus permanen."
            />

            <ConfirmDialog
                open={resendOpen}
                onClose={() => setResendOpen(false)}
                onConfirm={handleResend}
                loading={saving}
                title="Kirim kode baru?"
                description="Kode redeem baru akan diambil dari stok dan ditandai sebagai terjual."
                confirmText="Kirim Kode"
                variant="primary"
            />

            <ConfirmDialog
                open={bulkDeleteOpen}
                onClose={() => setBulkDeleteOpen(false)}
                onConfirm={handleBulkDelete}
                loading={saving}
                title={`Hapus ${selected.size} order?`}
            />

            <Dialog
                open={bulkStatusOpen}
                onClose={() => setBulkStatusOpen(false)}
                title={`Update status ${selected.size} order`}
                size="sm"
                footer={
                    <>
                        <button onClick={() => setBulkStatusOpen(false)} disabled={saving} className="h-10 px-4 rounded-xl text-sm hover:bg-muted">
                            Batal
                        </button>
                        <button
                            onClick={handleBulkStatus}
                            disabled={saving}
                            className="h-10 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold shadow-lg shadow-brand-500/30 disabled:opacity-50"
                        >
                            {saving ? 'Memproses...' : 'Update'}
                        </button>
                    </>
                }
            >
                <Field label="Status Baru">
                    <Select
                        value={bulkStatusValue}
                        onChange={setBulkStatusValue}
                        options={[
                            { value: 'PENDING', label: 'Menunggu' },
                            { value: 'SUCCESS', label: 'Lunas' },
                            { value: 'FAILED', label: 'Gagal' },
                            { value: 'EXPIRED', label: 'Kadaluarsa' },
                            { value: 'REFUNDED', label: 'Refund' },
                        ]}
                    />
                </Field>
            </Dialog>
        </>
    );
}

function orderKey(o) {
    return `${o.source}:${o.orderId}`;
}

function InfoItem({ icon: Icon, label }) {
    return (
        <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
            <Icon className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{label}</span>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{label}</label>
            {children}
        </div>
    );
}

function Info({ label, value, mono }) {
    return (
        <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
            <p className={cn("text-xs truncate", mono && "font-mono")}>{value || '-'}</p>
        </div>
    );
}
