'use client';

import { ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StatCard({ label, value, icon: Icon, delta, deltaLabel, accent = 'brand', loading }) {
    const accents = {
        brand: 'from-brand-500/20 to-brand-700/10 text-brand-500',
        emerald: 'from-emerald-500/20 to-teal-500/10 text-emerald-500',
        amber: 'from-amber-500/20 to-orange-500/10 text-amber-500',
        blue: 'from-blue-500/20 to-cyan-500/10 text-blue-500',
        purple: 'from-purple-500/20 to-pink-500/10 text-purple-500',
    };

    const accentClass = accents[accent] || accents.brand;
    const deltaPositive = typeof delta === 'number' && delta >= 0;

    return (
        <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-5 group hover:border-brand-500/30 transition-all duration-300">
            <div className={cn(
                "absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl bg-gradient-to-br opacity-40 group-hover:opacity-70 transition-opacity",
                accentClass
            )} />

            <div className="relative">
                <div className="flex items-start justify-between mb-4">
                    <div className={cn(
                        "w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center",
                        accentClass
                    )}>
                        {Icon && <Icon className="w-5 h-5" />}
                    </div>
                    {typeof delta === 'number' && (
                        <div className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold",
                            deltaPositive
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-red-500/10 text-red-500"
                        )}>
                            {deltaPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                            {Math.abs(delta).toFixed(1)}%
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                        {label}
                    </p>
                    {loading ? (
                        <div className="h-8 w-24 rounded-lg bg-muted animate-pulse" />
                    ) : (
                        <p className="text-2xl md:text-3xl font-display font-black tracking-tight">
                            {value}
                        </p>
                    )}
                    {deltaLabel && (
                        <p className="text-[11px] text-muted-foreground">{deltaLabel}</p>
                    )}
                </div>
            </div>
        </div>
    );
}
