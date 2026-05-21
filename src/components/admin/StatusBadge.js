'use client';

import { cn } from '@/lib/utils';

const STATUS_STYLES = {
    SUCCESS: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    PENDING: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    FAILED: 'bg-red-500/10 text-red-500 border-red-500/20',
    EXPIRED: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
    REFUNDED: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
};

const STATUS_LABELS = {
    SUCCESS: 'Lunas',
    PENDING: 'Menunggu',
    FAILED: 'Gagal',
    EXPIRED: 'Kadaluarsa',
    REFUNDED: 'Refund',
};

export function StatusBadge({ status, className }) {
    const normalized = (status || '').toUpperCase();
    const style = STATUS_STYLES[normalized] || STATUS_STYLES.PENDING;
    const label = STATUS_LABELS[normalized] || status || 'Unknown';

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold",
                style,
                className
            )}
        >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {label}
        </span>
    );
}
