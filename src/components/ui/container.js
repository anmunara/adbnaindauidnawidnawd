import { cn } from '@/lib/utils';

export function Container({ className, children, size = 'default', ...props }) {
  const sizes = {
    sm: 'max-w-3xl',
    default: 'max-w-7xl',
    lg: 'max-w-screen-2xl',
    full: 'max-w-full',
  };

  return (
    <div className={cn("mx-auto w-full px-6 md:px-8", sizes[size], className)} {...props}>
      {children}
    </div>
  );
}
