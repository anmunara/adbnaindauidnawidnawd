'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Dialog({ open, onClose, title, description, children, footer, size = 'md' }) {
    useEffect(() => {
        if (!open) return;
        const handleKey = (e) => {
            if (e.key === 'Escape') onClose?.();
        };
        document.addEventListener('keydown', handleKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKey);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    if (!open) return null;

    const sizes = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
            <div
                className="absolute inset-0 bg-background/80 backdrop-blur-md"
                onClick={onClose}
            />
            <div
                className={cn(
                    "relative w-full bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden animate-scale-in",
                    sizes[size] || sizes.md
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {(title || onClose) && (
                    <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-border">
                        <div className="min-w-0">
                            {title && (
                                <h2 className="text-lg font-display font-bold leading-tight">
                                    {title}
                                </h2>
                            )}
                            {description && (
                                <p className="text-sm text-muted-foreground mt-1">{description}</p>
                            )}
                        </div>
                        {onClose && (
                            <button
                                onClick={onClose}
                                aria-label="Close"
                                className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                )}

                <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">{children}</div>

                {footer && (
                    <div className="px-6 py-4 border-t border-border bg-surface-elevated/50 flex items-center justify-end gap-2">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}

export function ConfirmDialog({ open, onClose, title, description, onConfirm, confirmText = 'Hapus', cancelText = 'Batal', variant = 'danger', loading }) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={title}
            description={description}
            size="sm"
            footer={
                <>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 h-10 rounded-xl text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={cn(
                            "px-4 h-10 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50",
                            variant === 'danger'
                                ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30"
                                : "bg-brand-500 hover:bg-brand-600 shadow-lg shadow-brand-500/30"
                        )}
                    >
                        {loading ? 'Memproses...' : confirmText}
                    </button>
                </>
            }
        >
            <div className="text-sm text-muted-foreground">
                Tindakan ini tidak dapat dibatalkan.
            </div>
        </Dialog>
    );
}
