'use client';

import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva(
  "rounded-2xl transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-surface border border-border shadow-sm",
        glass: "glass shadow-glass",
        elevated: "bg-surface-elevated border border-border shadow-lg",
        gradient: "bg-gradient-to-br from-surface to-surface-elevated border border-border",
        outline: "border border-border bg-transparent",
        glow: "bg-surface border border-brand-500/30 shadow-glow-sm",
      },
      hover: {
        none: "",
        lift: "hover:-translate-y-1 hover:shadow-xl",
        glow: "hover:border-brand-500/50 hover:shadow-glow-md",
        scale: "hover:scale-[1.02]",
        tilt: "hover:rotate-1 hover:scale-[1.02]",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
        xl: "p-10",
      },
    },
    defaultVariants: {
      variant: "default",
      hover: "none",
      padding: "md",
    },
  }
);

const Card = forwardRef(({ className, variant, hover, padding, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(cardVariants({ variant, hover, padding, className }))}
    {...props}
  >
    {children}
  </div>
));
Card.displayName = 'Card';

const CardHeader = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1.5 mb-4", className)} {...props} />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn("text-xl font-bold tracking-tight", className)} {...props} />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center mt-4", className)} {...props} />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, cardVariants };
