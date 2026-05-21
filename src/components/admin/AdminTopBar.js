'use client';

import { Menu, Bell, Search } from 'lucide-react';

export function AdminTopBar({ onMenuClick, title, subtitle, actions, search }) {
    return (
        <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border">
            <div className="flex items-center gap-4 px-4 sm:px-6 lg:px-8 h-16">
                <button
                    onClick={onMenuClick}
                    aria-label="Open menu"
                    className="lg:hidden w-9 h-9 rounded-lg glass-light flex items-center justify-center hover:border-brand-500/40 transition-colors"
                >
                    <Menu className="w-5 h-5" />
                </button>

                <div className="flex-1 min-w-0">
                    {title && (
                        <h1 className="text-base sm:text-lg font-display font-bold truncate leading-tight">
                            {title}
                        </h1>
                    )}
                    {subtitle && (
                        <p className="text-xs text-muted-foreground truncate hidden sm:block">
                            {subtitle}
                        </p>
                    )}
                </div>

                {search && (
                    <div className="hidden md:block w-72 max-w-full">{search}</div>
                )}

                {actions && (
                    <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
                )}
            </div>

            {search && (
                <div className="md:hidden px-4 pb-3">{search}</div>
            )}
        </header>
    );
}
