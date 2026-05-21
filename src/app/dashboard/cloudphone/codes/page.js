'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
    Ticket, Plus, Pencil, Trash2, Copy, Check, Filter,
    CircleCheck, CircleDashed, Package, AlertCircle, Download
} from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SearchInput } from '@/components/admin/SearchInput';
import { EmptyState } from '@/components/admin/EmptyState';
import { BulkActionBar } from '@/components/admin/BulkActionBar';
import { Checkbox } from '@/components/admin/Checkbox';
import { Dialog, ConfirmDialog } from '@/components/admin/Dialog';
import { Select } from '@/components/admin/Select';
import { cn } from '@/lib/utils';

export default function CodesPage() {
    const [types, setTypes] = useState([]);
    const [codes, setCodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selected, setSelected] = useState(new Set());

    const [addOpen, setAddOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editingCode, setEditingCode] = useState(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

    const [addForm, setAddForm] = useState({ typeId: '', codes: '', note: '' });
    const [editForm, setEditForm] = useState({ code: '', note: '' });
    const [saving, setSaving] = useState(false);
    const [copiedId, setCopiedId] = useState(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [typesRes, codesRes] = await Promise.all([
                fetch('/api/products/get', { cache: 'no-store' }),
                fetch('/api/admin/codes/list', { cache: 'no-store' }),
            ]);
            const typesJson = await typesRes.json();
            const codesJson = await codesRes.json();
            if (typesJson.success) setTypes(typesJson.data || []);
            if (codesJson.success) setCodes(codesJson.data || []);
        } catch {
            toast.error('Gagal memuat data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const typeMap = useMemo(() => {
        const m = {};
        types.forEach((t) => (m[t.id] = t.name));
        return m;
    }, [types]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return codes.filter((c) => {
            if (filterType !== 'all' && c.typeId !== filterType) return false;
            if (filterStatus === 'available' && c.isUsed) return false;
            if (filterStatus === 'used' && !c.isUsed) return false;
            if (q) {
                if (!c.code?.toLowerCase().includes(q) && !c.note?.toLowerCase().includes(q)) return false;
            }
            return true;
        });
    }, [codes, search, filterType, filterStatus]);

    const allSelected = filtered.length > 0 && filtered.every((c) => selected.has(c.id));
    const someSelected = filtered.some((c) => selected.has(c.id));

    const toggleAll = (checked) => {
        if (checked) setSelected(new Set(filtered.map((c) => c.id)));
        else setSelected(new Set());
    };

    const toggleOne = (id, checked) => {
        const next = new Set(selected);
        if (checked) next.add(id);
        else next.delete(id);
        setSelected(next);
    };

    const handleAdd = async () => {
        if (!addForm.typeId) {
            toast.error('Pilih type dulu');
            return;
        }
        const codesList = addForm.codes
            .split('\n')
            .map((c) => c.trim())
            .filter(Boolean);
        if (codesList.length === 0) {
            toast.error('Masukkan minimal 1 kode');
            return;
        }
        setSaving(true);
        try {
            const res = await fetch('/api/admin/codes/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    typeId: addForm.typeId,
                    codes: codesList,
                    note: addForm.note,
                }),
            });
            const json = await res.json();
            if (json.success) {
                toast.success(`${json.addedCount} kode ditambahkan`);
                setAddOpen(false);
                setAddForm({ typeId: '', codes: '', note: '' });
                await loadData();
            } else {
                toast.error(json.message || 'Gagal menambah kode');
            }
        } catch {
            toast.error('Terjadi kesalahan');
        } finally {
            setSaving(false);
        }
    };

    const openEdit = (code) => {
        setEditingCode(code);
        setEditForm({ code: code.code, note: code.note || '' });
        setEditOpen(true);
    };

    const handleEdit = async () => {
        if (!editForm.code.trim()) {
            toast.error('Kode tidak boleh kosong');
            return;
        }
        setSaving(true);
        try {
            const res = await fetch('/api/admin/codes/edit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    codeId: editingCode.id,
                    code: editForm.code.trim(),
                    note: editForm.note,
                }),
            });
            const json = await res.json();
            if (json.success) {
                toast.success('Kode berhasil diupdate');
                setEditOpen(false);
                await loadData();
            } else {
                toast.error(json.message || 'Gagal update');
            }
        } catch {
            toast.error('Terjadi kesalahan');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setSaving(true);
        try {
            const res = await fetch('/api/admin/codes/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codeId: deleteTarget.id }),
            });
            const json = await res.json();
            if (json.success) {
                toast.success('Kode dihapus');
                setDeleteOpen(false);
                setDeleteTarget(null);
                await loadData();
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
        setSaving(true);
        try {
            const res = await fetch('/api/admin/codes/bulk-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codeIds: [...selected] }),
            });
            const json = await res.json();
            if (json.success) {
                toast.success(`${json.deleted} kode dihapus`);
                setSelected(new Set());
                setBulkDeleteOpen(false);
                await loadData();
            } else {
                toast.error(json.message || 'Gagal bulk delete');
            }
        } catch {
            toast.error('Terjadi kesalahan');
        } finally {
            setSaving(false);
        }
    };

    const copyCode = (code, id) => {
        navigator.clipboard.writeText(code).then(() => {
            setCopiedId(id);
            toast.success('Kode disalin');
            setTimeout(() => setCopiedId(null), 1500);
        });
    };

    const exportCsv = () => {
        const rows = selected.size > 0
            ? filtered.filter((c) => selected.has(c.id))
            : filtered;

        if (rows.length === 0) {
            toast.error('Tidak ada data untuk diekspor');
            return;
        }

        const headers = [
            'Code', 'Type', 'Status', 'Note', 'Sold To',
            'Transaction ID', 'Created At', 'Sold At', 'Updated At',
        ];

        const escape = (v) => {
            if (v === null || v === undefined) return '';
            const s = String(v);
            if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
            return s;
        };

        const fmtDate = (v) => {
            if (!v) return '';
            const d = new Date(v);
            return isNaN(d.getTime()) ? '' : d.toISOString();
        };

        const lines = [headers.join(',')];
        for (const c of rows) {
            lines.push([
                escape(c.code),
                escape(typeMap[c.typeId] || c.typeId || ''),
                escape(c.isUsed ? 'TERJUAL' : 'READY'),
                escape(c.note || ''),
                escape(c.soldTo || ''),
                escape(c.transactionId || ''),
                escape(fmtDate(c.createdAt)),
                escape(fmtDate(c.soldAt)),
                escape(fmtDate(c.updatedAt)),
            ].join(','));
        }

        const csv = '﻿' + lines.join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        a.href = url;
        a.download = `redeem-codes-${ts}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success(`${rows.length} kode diekspor ke CSV`);
    };

    const stats = useMemo(() => {
        const available = codes.filter((c) => !c.isUsed).length;
        const used = codes.length - available;
        return { available, used, total: codes.length };
    }, [codes]);

    return (
        <>
            <PageHeader
                eyebrow="Inventory"
                title="Redeem Codes"
                subtitle={`${stats.total} total — ${stats.available} ready, ${stats.used} terjual`}
                actions={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={exportCsv}
                            disabled={loading || codes.length === 0}
                            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-border bg-surface hover:bg-muted text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Export CSV</span>
                        </button>
                        <button
                            onClick={() => setAddOpen(true)}
                            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold shadow-lg shadow-brand-500/30"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">Tambah Kode</span>
                            <span className="sm:hidden">Tambah</span>
                        </button>
                    </div>
                }
            />

            <div className="px-4 sm:px-6 lg:px-8 pb-12 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                    <SearchInput
                        value={search}
                        onChange={setSearch}
                        placeholder="Cari kode atau note..."
                        className="flex-1 min-w-[200px] max-w-md"
                    />
                    <Select
                        value={filterType}
                        onChange={setFilterType}
                        options={[
                            { value: 'all', label: 'Semua Type' },
                            ...types.map((t) => ({ value: t.id, label: t.name })),
                        ]}
                        className="w-44"
                    />
                    <Select
                        value={filterStatus}
                        onChange={setFilterStatus}
                        options={[
                            { value: 'all', label: 'Semua Status' },
                            { value: 'available', label: 'Tersedia' },
                            { value: 'used', label: 'Terjual' },
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
                                onClick={exportCsv}
                                className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-500 text-xs font-semibold"
                            >
                                <Download className="w-3.5 h-3.5" />
                                Export
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
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <EmptyState
                        icon={Ticket}
                        title={search || filterType !== 'all' || filterStatus !== 'all' ? 'Tidak ada hasil' : 'Belum ada kode'}
                        description={search || filterType !== 'all' ? 'Coba ubah filter atau search.' : 'Tambahkan stok kode redeem pertama.'}
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
                                {filtered.length} kode ditemukan
                            </span>
                        </div>

                        <div className="space-y-2">
                            {filtered.map((code) => {
                                const isSelected = selected.has(code.id);
                                const isCopied = copiedId === code.id;
                                return (
                                    <div
                                        key={code.id}
                                        className={cn(
                                            "group flex items-center gap-3 p-3 sm:p-4 rounded-xl border bg-surface hover:border-brand-500/30 transition-all",
                                            isSelected ? "border-brand-500/50 bg-brand-500/5" : "border-border"
                                        )}
                                    >
                                        <Checkbox
                                            checked={isSelected}
                                            onChange={(c) => toggleOne(code.id, c)}
                                        />

                                        <div className={cn(
                                            "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                                            code.isUsed ? "bg-zinc-500/10 text-zinc-500" : "bg-emerald-500/10 text-emerald-500"
                                        )}>
                                            {code.isUsed ? <CircleCheck className="w-4 h-4" /> : <CircleDashed className="w-4 h-4" />}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <code className="text-sm font-mono font-bold truncate">{code.code}</code>
                                                <span className={cn(
                                                    "text-[10px] px-1.5 py-0.5 rounded-md font-semibold whitespace-nowrap",
                                                    code.isUsed
                                                        ? "bg-zinc-500/10 text-zinc-500"
                                                        : "bg-emerald-500/10 text-emerald-500"
                                                )}>
                                                    {code.isUsed ? 'TERJUAL' : 'READY'}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                                                {typeMap[code.typeId] || 'Unknown'}
                                                {code.note && ` • ${code.note}`}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <button
                                                onClick={() => copyCode(code.code, code.id)}
                                                aria-label="Copy"
                                                className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-brand-500 transition-colors"
                                            >
                                                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                            </button>
                                            <button
                                                onClick={() => openEdit(code)}
                                                aria-label="Edit"
                                                className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-brand-500 transition-colors"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setDeleteTarget(code);
                                                    setDeleteOpen(true);
                                                }}
                                                aria-label="Delete"
                                                className="w-8 h-8 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-muted-foreground hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Add Codes Dialog */}
            <Dialog
                open={addOpen}
                onClose={() => setAddOpen(false)}
                title="Tambah Kode Redeem"
                description="Tambahkan satu atau beberapa kode (satu kode per baris)"
                size="lg"
                footer={
                    <>
                        <button
                            onClick={() => setAddOpen(false)}
                            disabled={saving}
                            className="h-10 px-4 rounded-xl text-sm hover:bg-muted"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleAdd}
                            disabled={saving}
                            className="h-10 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold shadow-lg shadow-brand-500/30 disabled:opacity-50"
                        >
                            {saving ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                            Type Produk <span className="text-brand-500">*</span>
                        </label>
                        <Select
                            value={addForm.typeId}
                            onChange={(v) => setAddForm({ ...addForm, typeId: v })}
                            options={types.map((t) => ({ value: t.id, label: t.name }))}
                            placeholder="Pilih type..."
                        />
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                            Kode (satu per baris) <span className="text-brand-500">*</span>
                        </label>
                        <textarea
                            value={addForm.codes}
                            onChange={(e) => setAddForm({ ...addForm, codes: e.target.value })}
                            placeholder={'ABC-123-XYZ\nDEF-456-UVW\nGHI-789-RST'}
                            rows={8}
                            className="w-full px-3 py-2.5 rounded-xl bg-muted/50 border border-border text-sm font-mono focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 resize-none"
                        />
                        <p className="text-[11px] text-muted-foreground mt-1">
                            {addForm.codes.split('\n').filter((c) => c.trim()).length} kode siap ditambahkan
                        </p>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                            Note (opsional)
                        </label>
                        <input
                            type="text"
                            value={addForm.note}
                            onChange={(e) => setAddForm({ ...addForm, note: e.target.value })}
                            placeholder="Cth: Batch 1, Supplier A, dll"
                            className="w-full h-10 px-3 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20"
                        />
                    </div>
                </div>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog
                open={editOpen}
                onClose={() => setEditOpen(false)}
                title="Edit Kode"
                footer={
                    <>
                        <button onClick={() => setEditOpen(false)} disabled={saving} className="h-10 px-4 rounded-xl text-sm hover:bg-muted">
                            Batal
                        </button>
                        <button
                            onClick={handleEdit}
                            disabled={saving}
                            className="h-10 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold disabled:opacity-50"
                        >
                            {saving ? 'Menyimpan...' : 'Update'}
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Kode</label>
                        <input
                            type="text"
                            value={editForm.code}
                            onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                            className="w-full h-11 px-3 rounded-xl bg-muted/50 border border-border text-sm font-mono focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Note</label>
                        <input
                            type="text"
                            value={editForm.note}
                            onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                            className="w-full h-11 px-3 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20"
                        />
                    </div>
                </div>
            </Dialog>

            <ConfirmDialog
                open={deleteOpen}
                onClose={() => setDeleteOpen(false)}
                onConfirm={handleDelete}
                loading={saving}
                title="Hapus kode?"
                description={deleteTarget?.code}
            />

            <ConfirmDialog
                open={bulkDeleteOpen}
                onClose={() => setBulkDeleteOpen(false)}
                onConfirm={handleBulkDelete}
                loading={saving}
                title={`Hapus ${selected.size} kode?`}
            />
        </>
    );
}
