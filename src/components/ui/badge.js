'use client';

import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-brand-500/15 text-brand-500 border border-brand-500/30",
        secondary: "bg-muted text-muted-foreground border border-border",
        success: "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30",
        warning: "bg-amber-500/15 text-amber-500 border border-amber-500/30",
        danger: "bg-red-500/15 text-red-500 border border-red-500/30",
        glass: "glass text-foreground",
        gradient: "bg-gradient-to-r from-brand-500 to-brand-600 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Badge = forwardRef(({ className, variant, children, ...props }, ref) => (
  <span ref={ref} className={cn(badgeVariants({ variant, className }))} {...props}>
    {children}
  </span>
));
Badge.displayName = 'Badge';

export { Badge, badgeVariants };
