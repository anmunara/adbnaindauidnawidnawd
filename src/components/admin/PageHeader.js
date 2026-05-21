'use client';

import { Menu } from 'lucide-react';
import { useAdminLayout } from '@/app/dashboard/cloudphone/layout';

export function PageHeader({ title, subtitle, eyebrow, actions, breadcrumb }) {
    const { openSidebar } = useAdminLayout();

    return (
        <div className="px-4 sm:px-6 lg:px-8 pt-4 lg:pt-8 pb-4 lg:pb-6">
            <div className="flex items-start gap-4 mb-4 lg:hidden">
                <button
                    onClick={openSidebar}
                    aria-label="Open menu"
                    className="w-9 h-9 rounded-lg glass-light flex items-center justify-center hover:border-brand-500/40 transition-colors"
                >
                    <Menu className="w-5 h-5" />
                </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div className="min-w-0">
                    {eyebrow && (
                        <p className="text-xs font-semibold text-brand-500 uppercase tracking-widest mb-1">
                            {eyebrow}
                        </p>
                    )}
                    <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
                    )}
                </div>

                {actions && (
                    <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
}
