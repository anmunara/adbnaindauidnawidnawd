import { cn } from '@/lib/utils';

export function AnimatedBg({ className, variant = 'default' }) {
  if (variant === 'grid') {
    return (
      <div className={cn("absolute inset-0 -z-10 overflow-hidden pointer-events-none", className)}>
        <div className="absolute inset-0 grid-bg [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-500/10 rounded-full blur-[120px] animate-pulse" />
      </div>
    );
  }

  if (variant === 'orbs') {
    return (
      <div className={cn("absolute inset-0 -z-10 overflow-hidden pointer-events-none", className)}>
        <div className="absolute top-0 -left-40 w-[500px] h-[500px] bg-brand-500/20 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-0 -right-40 w-[500px] h-[500px] bg-brand-600/20 rounded-full blur-[120px] animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-brand-400/10 rounded-full blur-[80px] animate-float" style={{ animationDelay: '0.8s' }} />
      </div>
    );
  }

  return (
    <div className={cn("absolute inset-0 -z-10 overflow-hidden pointer-events-none", className)}>
      <div className="absolute inset-0 grid-bg opacity-30 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-500/15 rounded-full blur-[120px] animate-float" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-brand-600/10 rounded-full blur-[100px] animate-float" style={{ animationDelay: '1.5s' }} />
    </div>
  );
}
