'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Select({ value, onChange, options, placeholder = 'Pilih...', className }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handleClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const selected = options.find((o) => o.value === value);

    return (
        <div ref={ref} className={cn("relative", className)}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full h-10 px-3 pr-9 rounded-xl bg-surface border border-border text-sm text-left flex items-center justify-between hover:border-brand-500/40 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all"
            >
                <span className={cn("truncate", !selected && "text-muted-foreground")}>
                    {selected?.label || placeholder}
                </span>
                <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform absolute right-3", open && "rotate-180")} />
            </button>

            {open && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-xl bg-surface border border-border shadow-2xl overflow-hidden animate-scale-in origin-top">
                    <div className="max-h-60 overflow-y-auto p-1">
                        {options.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                    onChange(opt.value);
                                    setOpen(false);
                                }}
                                className={cn(
                                    "w-full px-3 py-2 rounded-lg text-sm text-left flex items-center justify-between hover:bg-muted transition-colors",
                                    opt.value === value && "bg-brand-500/10 text-brand-500"
                                )}
                            >
                                <span className="truncate">{opt.label}</span>
                                {opt.value === value && <Check className="w-4 h-4 flex-shrink-0" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
