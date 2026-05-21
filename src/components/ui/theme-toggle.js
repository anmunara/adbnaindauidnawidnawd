'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className={cn("w-10 h-10", className)} />;
  }

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label="Toggle theme"
      className={cn(
        "relative w-10 h-10 rounded-xl glass-light overflow-hidden group transition-all duration-300 hover:scale-105 hover:border-brand-500/40",
        className
      )}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <Sun className={cn(
          "absolute w-4 h-4 text-amber-400 transition-all duration-500",
          isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
        )} />
        <Moon className={cn(
          "absolute w-4 h-4 text-brand-400 transition-all duration-500",
          isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
        )} />
      </div>
    </button>
  );
}
