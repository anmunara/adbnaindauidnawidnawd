'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BulkActionBar({ count, onClear, actions, className }) {
    if (!count) return null;

    return (
        <div className={cn(
            "sticky top-16 z-20 mb-4 rounded-2xl border border-brand-500/30 bg-brand-500/5 backdrop-blur-xl shadow-lg shadow-brand-500/10",
            className
        )}>
            <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={onClear}
                        aria-label="Clear selection"
                        className="w-8 h-8 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 flex items-center justify-center text-brand-500 transition-colors flex-shrink-0"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <p className="text-sm font-semibold truncate">
                        <span className="text-brand-500">{count}</span> dipilih
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
            </div>
        </div>
    );
}
