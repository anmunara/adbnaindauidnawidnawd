import { cn } from '@/lib/utils';

export function Section({ className, children, id, ...props }) {
  return (
    <section
      id={id}
      className={cn("relative py-20 md:py-28 overflow-hidden", className)}
      {...props}
    >
      {children}
    </section>
  );
}

export function SectionHeader({ eyebrow, title, description, align = 'center', className }) {
  return (
    <div className={cn(
      "max-w-3xl mb-12 md:mb-16",
      align === 'center' && "mx-auto text-center",
      className
    )}>
      {eyebrow && (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-500 text-xs font-semibold mb-4 uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
          {eyebrow}
        </div>
      )}
      <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight text-balance mb-4">
        {title}
      </h2>
      {description && (
        <p className="text-base md:text-lg text-muted-foreground text-balance">
          {description}
        </p>
      )}
    </div>
  );
}
