'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Input = forwardRef(({ className, type = 'text', icon: Icon, error, ...props }, ref) => {
  return (
    <div className="relative w-full">
      {Icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          <Icon className="w-4 h-4" />
        </div>
      )}
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-12 w-full rounded-xl border bg-surface px-4 py-2 text-sm text-foreground transition-all duration-200",
          "placeholder:text-muted-foreground/60",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background focus-visible:border-brand-500",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "hover:border-brand-500/40",
          Icon && "pl-11",
          error ? "border-red-500 focus-visible:ring-red-500" : "border-border",
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export { Input };
