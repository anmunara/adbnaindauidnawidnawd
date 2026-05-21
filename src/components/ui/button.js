'use client';

import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary: "bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/30 hover:shadow-glow-md hover:from-brand-400 hover:to-brand-500",
        secondary: "bg-surface-elevated text-foreground border border-border hover:bg-muted hover:border-brand-500/50",
        ghost: "text-foreground hover:bg-muted",
        outline: "border border-border bg-transparent text-foreground hover:bg-muted hover:border-brand-500/50",
        glass: "glass text-foreground hover:bg-white/10 dark:hover:bg-white/10",
        danger: "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30",
        link: "text-brand-500 underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-9 px-4 text-xs",
        md: "h-11 px-6 text-sm",
        lg: "h-13 px-8 text-base",
        xl: "h-14 px-10 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

const Button = forwardRef(({ className, variant, size, loading, children, ...props }, ref) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <>
          <span className="spinner" />
          <span>Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
});

Button.displayName = 'Button';

export { Button, buttonVariants };
