'use client';

import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SearchInput({ value, onChange, placeholder = 'Cari...', className }) {
    return (
        <div className={cn("relative", className)}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full h-10 pl-10 pr-9 rounded-xl bg-surface border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all"
            />
            {value && (
                <button
                    onClick={() => onChange('')}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
}
