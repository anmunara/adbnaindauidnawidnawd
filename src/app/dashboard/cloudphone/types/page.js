'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
    Package, Plus, Pencil, Trash2, DollarSign, TrendingUp,
    Ticket, ShoppingBag, Download, AlertCircle, Smartphone, Gift
} from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SearchInput } from '@/components/admin/SearchInput';
import { EmptyState } from '@/components/admin/EmptyState';
import { BulkActionBar } from '@/components/admin/BulkActionBar';
import { Checkbox } from '@/components/admin/Checkbox';
import { Dialog, ConfirmDialog } from '@/components/admin/Dialog';
import { cn } from '@/lib/utils';

const formatCurrency = (n) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

const CATEGORIES = [
    { value: 'all', label: 'Semua', icon: Package },
    { value: 'redfinger', label: 'RedFinger', icon: Smartphone },
    { value: 'roblox', label: 'Roblox Gift', icon: Gift },
];

const CATEGORY_META = {
    redfinger: { label: 'RedFinger', icon: Smartphone, color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
    roblox: { label: 'Roblox', icon: Gift, color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
};

export default function TypesPage() {
    const [types, setTypes] = useState([]);
    const [codes, setCodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [selected, setSelected] = useState(new Set());

    const [addOpen, setAddOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

    const [form, setForm] = useState({ name: '', sellingPrice: '', capitalPrice: '', category: 'redfinger' });
    const [saving, setSaving] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/products/get', { cache: 'no-store' });
            const json = await res.json();
            if (json.success) {
                setTypes(json.data || []);
            }
        } catch (err) {
            toast.error('Gagal memuat data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return types.filter((t) => {
            const cat = t.category || 'redfinger';
            if (categoryFilter !== 'all' && cat !== categoryFilter) return false;
            if (q && !t.name?.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [types, search, categoryFilter]);

    const categoryCounts = useMemo(() => {
        const counts = { all: types.length, redfinger: 0, roblox: 0 };
        types.forEach((t) => {
            const cat = t.category || 'redfinger';
            if (counts[cat] !== undefined) counts[cat]++;
        });
        return counts;
    }, [types]);

    const allSelected = filtered.length > 0 && filtered.every((t) => selected.has(t.id));
    const someSelected = filtered.some((t) => selected.has(t.id));

    const toggleAll = (checked) => {
        if (checked) {
            setSelected(new Set(filtered.map((t) => t.id)));
        } else {
            setSelected(new Set());
        }
    };

    const toggleOne = (id, checked) => {
        const next = new Set(selected);
        if (checked) next.add(id);
        else next.delete(id);
        setSelected(next);
    };

    const openAdd = () => {
        const defaultCat = categoryFilter === 'all' ? 'redfinger' : categoryFilter;
        setForm({ name: '', sellingPrice: '', capitalPrice: '', category: defaultCat });
        setAddOpen(true);
    };

    const openEdit = (type) => {
        setEditingType(type);
        setForm({
            name: type.name || '',
            sellingPrice: String(type.sellingPrice || type.price || ''),
            capitalPrice: String(type.capitalPrice || ''),
            category: type.category || 'redfinger',
        });
        setEditOpen(true);
    };

    const handleAdd = async () => {
        if (!form.name.trim()) {
            toast.error('Nama produk harus diisi');
            return;
        }
        setSaving(true);
        try {
            const res = await fetch('/api/admin/types/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name.trim(),
                    sellingPrice: parseFloat(form.sellingPrice) || 0,
                    capitalPrice: parseFloat(form.capitalPrice) || 0,
                    category: form.category || 'redfinger',
                }),
            });
            const json = await res.json();
            if (json.success) {
                toast.success('Type berhasil ditambahkan');
                setAddOpen(false);
                await loadData();
            } else {
                toast.error(json.message || 'Gagal menambahkan');
            }
        } catch {
            toast.error('Terjadi kesalahan');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = async () => {
        if (!form.name.trim()) {
            toast.error('Nama produk harus diisi');
            return;
        }
        setSaving(true);
        try {
            const res = await fetch('/api/admin/types/edit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    typeId: editingType.id,
                    name: form.name.trim(),
                    sellingPrice: parseFloat(form.sellingPrice) || 0,
                    capitalPrice: parseFloat(form.capitalPrice) || 0,
                    category: form.category || 'redfinger',
                }),
            });
            const json = await res.json();
            if (json.success) {
                toast.success('Type berhasil diupdate');
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
            const res = await fetch('/api/admin/types/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ typeId: deleteTarget.id }),
            });
            const json = await res.json();
            if (json.success) {
                toast.success('Type berhasil dihapus');
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
            const res = await fetch('/api/admin/types/bulk-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ typeIds: [...selected] }),
            });
            const json = await res.json();
            if (json.success) {
                toast.success(`${json.deleted} type dihapus${json.skippedWithCodes ? `, ${json.skippedWithCodes} dilewati karena ada stok kode` : ''}`);
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

    return (
        <>
            <PageHeader
                eyebrow="Inventory"
                title="Manage Types"
                subtitle="Atur jenis produk Cloud Phone & harga jual/modal"
                actions={
                    <button
                        onClick={openAdd}
                        className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold shadow-lg shadow-brand-500/30 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Tambah Type
                    </button>
                }
            />

            <div className="px-4 sm:px-6 lg:px-8 pb-12 space-y-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        const isActive = categoryFilter === cat.value;
                        const count = categoryCounts[cat.value] ?? 0;
                        return (
                            <button
                                key={cat.value}
                                onClick={() => setCategoryFilter(cat.value)}
                                className={cn(
                                    "inline-flex items-center gap-2 h-9 px-3.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border",
                                    isActive
                                        ? "bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/30"
                                        : "bg-surface border-border hover:border-brand-500/40 text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {cat.label}
                                <span className={cn(
                                    "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-md text-[10px] font-bold",
                                    isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                                )}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center gap-3">
                    <SearchInput
                        value={search}
                        onChange={setSearch}
                        placeholder="Cari nama produk..."
                        className="flex-1 max-w-md"
                    />
                </div>

                <BulkActionBar
                    count={selected.size}
                    onClear={() => setSelected(new Set())}
                    actions={
                        <button
                            onClick={() => setBulkDeleteOpen(true)}
                            className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-semibold transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Hapus
                        </button>
                    }
                />

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <EmptyState
                        icon={Package}
                        title={search ? 'Tidak ada hasil' : 'Belum ada types'}
                        description={search ? `Tidak ada produk yang cocok dengan "${search}"` : 'Mulai dengan menambahkan jenis produk Cloud Phone pertama.'}
                        action={!search && (
                            <button
                                onClick={openAdd}
                                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold"
                            >
                                <Plus className="w-4 h-4" />
                                Tambah Type
                            </button>
                        )}
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
                                {filtered.length} type ditemukan
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filtered.map((type) => {
                                const stock = type.stock ?? 0;
                                const margin = (type.sellingPrice || type.price || 0) - (type.capitalPrice || 0);
                                const isSelected = selected.has(type.id);
                                const catKey = type.category || 'redfinger';
                                const catMeta = CATEGORY_META[catKey] || CATEGORY_META.redfinger;
                                const CatIcon = catMeta.icon;

                                return (
                                    <div
                                        key={type.id}
                                        className={cn(
                                            "group relative rounded-2xl border bg-surface p-5 transition-all hover:border-brand-500/30 hover:shadow-lg",
                                            isSelected ? "border-brand-500/50 bg-brand-500/5" : "border-border"
                                        )}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <Checkbox
                                                checked={isSelected}
                                                onChange={(c) => toggleOne(type.id, c)}
                                            />
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => openEdit(type)}
                                                    aria-label="Edit"
                                                    className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-brand-500 transition-colors"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setDeleteTarget(type);
                                                        setDeleteOpen(true);
                                                    }}
                                                    aria-label="Delete"
                                                    className="w-8 h-8 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-muted-foreground hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500/20 to-brand-700/10 flex items-center justify-center">
                                                <CatIcon className="w-5 h-5 text-brand-500" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-display font-bold truncate">{type.name}</h3>
                                                <p className="text-[11px] text-muted-foreground">ID: {type.id.slice(0, 8)}...</p>
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <span className={cn(
                                                "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold border",
                                                catMeta.color
                                            )}>
                                                <CatIcon className="w-3 h-3" />
                                                {catMeta.label}
                                            </span>
                                        </div>

                                        <div className="space-y-2 pt-4 border-t border-border">
                                            <Row
                                                label="Harga Jual"
                                                value={formatCurrency(type.sellingPrice || type.price)}
                                                accent="text-brand-500 font-bold"
                                            />
                                            <Row label="Harga Modal" value={formatCurrency(type.capitalPrice)} />
                                            <Row
                                                label="Margin"
                                                value={formatCurrency(margin)}
                                                accent={margin > 0 ? 'text-emerald-500 font-semibold' : 'text-red-500'}
                                            />
                                            <Row
                                                label="Stok"
                                                value={
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-md text-xs font-bold",
                                                        stock > 5 ? "bg-emerald-500/10 text-emerald-500"
                                                            : stock > 0 ? "bg-amber-500/10 text-amber-500"
                                                                : "bg-red-500/10 text-red-500"
                                                    )}>
                                                        {stock} kode
                                                    </span>
                                                }
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Add Dialog */}
            <Dialog
                open={addOpen}
                onClose={() => setAddOpen(false)}
                title="Tambah Type Baru"
                description="Buat jenis produk Cloud Phone baru"
                footer={
                    <>
                        <button
                            onClick={() => setAddOpen(false)}
                            disabled={saving}
                            className="h-10 px-4 rounded-xl text-sm hover:bg-muted transition-colors"
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
                <TypeForm form={form} setForm={setForm} />
            </Dialog>

            {/* Edit Dialog */}
            <Dialog
                open={editOpen}
                onClose={() => setEditOpen(false)}
                title="Edit Type"
                description={editingType?.name}
                footer={
                    <>
                        <button
                            onClick={() => setEditOpen(false)}
                            disabled={saving}
                            className="h-10 px-4 rounded-xl text-sm hover:bg-muted transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleEdit}
                            disabled={saving}
                            className="h-10 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold shadow-lg shadow-brand-500/30 disabled:opacity-50"
                        >
                            {saving ? 'Menyimpan...' : 'Update'}
                        </button>
                    </>
                }
            >
                <TypeForm form={form} setForm={setForm} />
            </Dialog>

            <ConfirmDialog
                open={deleteOpen}
                onClose={() => setDeleteOpen(false)}
                onConfirm={handleDelete}
                loading={saving}
                title={`Hapus "${deleteTarget?.name}"?`}
                description="Type hanya dapat dihapus jika tidak punya kode tersisa."
            />

            <ConfirmDialog
                open={bulkDeleteOpen}
                onClose={() => setBulkDeleteOpen(false)}
                onConfirm={handleBulkDelete}
                loading={saving}
                title={`Hapus ${selected.size} type?`}
                description="Type dengan stok kode akan otomatis dilewati."
            />
        </>
    );
}

function Row({ label, value, accent }) {
    return (
        <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground text-xs">{label}</span>
            <span className={cn("text-sm", accent)}>{value}</span>
        </div>
    );
}

function TypeForm({ form, setForm }) {
    const categoryOptions = [
        { value: 'redfinger', label: 'RedFinger', icon: Smartphone, desc: 'Cloudphone subscription' },
        { value: 'roblox', label: 'Roblox Gift', icon: Gift, desc: 'Roblox gift card' },
    ];
    return (
        <div className="space-y-4">
            <Field label="Kategori" required>
                <div className="grid grid-cols-2 gap-2">
                    {categoryOptions.map((opt) => {
                        const Icon = opt.icon;
                        const isActive = form.category === opt.value;
                        return (
                            <button
                                type="button"
                                key={opt.value}
                                onClick={() => setForm({ ...form, category: opt.value })}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                                    isActive
                                        ? "bg-brand-500/10 border-brand-500/50 ring-2 ring-brand-500/20"
                                        : "bg-muted/30 border-border hover:border-brand-500/30"
                                )}
                            >
                                <div className={cn(
                                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                                    isActive ? "bg-brand-500 text-white" : "bg-muted text-muted-foreground"
                                )}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-xs font-bold">{opt.label}</div>
                                    <div className="text-[10px] text-muted-foreground truncate">{opt.desc}</div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </Field>
            <Field label="Nama Produk" required>
                <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder={form.category === 'roblox' ? 'Cth: Roblox 100 Robux' : 'Cth: RF SVIP 30 Hari'}
                    className="w-full h-11 px-3 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20"
                />
            </Field>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Harga Jual (Rp)">
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="number"
                            value={form.sellingPrice}
                            onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                            placeholder="120000"
                            className="w-full h-11 pl-9 pr-3 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20"
                        />
                    </div>
                </Field>
                <Field label="Harga Modal (Rp)">
                    <div className="relative">
                        <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="number"
                            value={form.capitalPrice}
                            onChange={(e) => setForm({ ...form, capitalPrice: e.target.value })}
                            placeholder="80000"
                            className="w-full h-11 pl-9 pr-3 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20"
                        />
                    </div>
                </Field>
            </div>
        </div>
    );
}

function Field({ label, required, children }) {
    return (
        <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                {label} {required && <span className="text-brand-500">*</span>}
            </label>
            {children}
        </div>
    );
}
