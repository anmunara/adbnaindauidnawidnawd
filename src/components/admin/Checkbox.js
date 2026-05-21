'use client';

import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Checkbox({ checked, indeterminate, onChange, className, label }) {
    return (
        <label className={cn("inline-flex items-center gap-2 cursor-pointer select-none", className)}>
            <span
                onClick={(e) => {
                    e.preventDefault();
                    onChange?.(!checked);
                }}
                className={cn(
                    "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0",
                    checked || indeterminate
                        ? "bg-brand-500 border-brand-500 text-white"
                        : "bg-transparent border-border hover:border-brand-500/50"
                )}
            >
                {indeterminate ? (
                    <Minus className="w-3 h-3" strokeWidth={3} />
                ) : checked ? (
                    <Check className="w-3 h-3" strokeWidth={3} />
                ) : null}
            </span>
            {label && <span className="text-sm">{label}</span>}
        </label>
    );
}
