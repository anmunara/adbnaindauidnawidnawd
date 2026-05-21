'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

export function SparkChart({ data = [], height = 60, color = 'rgb(255,45,85)', className }) {
    const { path, areaPath, points } = useMemo(() => {
        if (!data.length) return { path: '', areaPath: '', points: [] };

        const values = data.map((d) => d.value ?? 0);
        const max = Math.max(...values, 1);
        const min = Math.min(...values, 0);
        const range = max - min || 1;
        const stepX = data.length > 1 ? 100 / (data.length - 1) : 100;

        const pts = values.map((v, i) => ({
            x: i * stepX,
            y: 100 - ((v - min) / range) * 100,
            value: v,
            label: data[i].label,
        }));

        const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        const areaPath = `${path} L 100 100 L 0 100 Z`;
        return { path, areaPath, points: pts };
    }, [data]);

    if (!data.length) {
        return (
            <div className={cn("flex items-center justify-center text-xs text-muted-foreground", className)} style={{ height }}>
                Belum ada data
            </div>
        );
    }

    const gradientId = `spark-grad-${color.replace(/[^a-z0-9]/gi, '')}`;

    return (
        <svg
            className={cn("w-full overflow-visible", className)}
            style={{ height }}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
        >
            <defs>
                <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={areaPath} fill={`url(#${gradientId})`} />
            <path d={path} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        </svg>
    );
}

export function BarChart({ data = [], height = 200, color = 'rgb(255,45,85)', className }) {
    const max = Math.max(...data.map((d) => d.value ?? 0), 1);

    if (!data.length) {
        return (
            <div className={cn("flex items-center justify-center text-xs text-muted-foreground", className)} style={{ height }}>
                Belum ada data
            </div>
        );
    }

    return (
        <div className={cn("flex items-end gap-1.5 sm:gap-2", className)} style={{ height }}>
            {data.map((d, i) => {
                const pct = ((d.value ?? 0) / max) * 100;
                return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end gap-2 min-w-0 group">
                        <div className="relative w-full flex flex-col items-center" style={{ height: '100%' }}>
                            <div
                                className="w-full rounded-t-md transition-all duration-500 ease-out hover:opacity-80 relative"
                                style={{
                                    height: `${pct}%`,
                                    minHeight: d.value > 0 ? 4 : 0,
                                    background: `linear-gradient(180deg, ${color}, ${color}55)`,
                                }}
                            >
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-foreground text-background text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                    {d.value}
                                </div>
                            </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium truncate w-full text-center">
                            {d.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
