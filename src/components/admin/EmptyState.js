'use client';

import { cn } from '@/lib/utils';

export function EmptyState({ icon: Icon, title, description, action, className }) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl border border-dashed border-border bg-surface/30",
            className
        )}>
            {Icon && (
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                    <Icon className="w-7 h-7 text-muted-foreground" />
                </div>
            )}
            <h3 className="text-base font-display font-bold mb-1">{title}</h3>
            {description && (
                <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
            )}
            {action}
        </div>
    );
}
