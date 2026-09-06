'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const [isLight, setIsLight] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsLight(true);
      document.documentElement.classList.add('light');
    } else {
      setIsLight(false);
      document.documentElement.classList.remove('light');
    }
  }, []);

  const toggleTheme = () => {
    const nextIsLight = !isLight;
    setIsLight(nextIsLight);
    if (nextIsLight) {
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    }
  };

  if (!mounted) {
    return <div className="w-9 h-9" />;
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-bg-secondary hover:bg-bg-elevated transition-colors duration-150 text-content-secondary hover:text-content-primary text-xs font-medium"
      title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
    >
      {isLight ? (
        <>
          <Moon className="w-4 h-4 text-accent" />
          <span className="hidden sm:inline">Dark</span>
        </>
      ) : (
        <>
          <Sun className="w-4 h-4 text-accent" />
          <span className="hidden sm:inline">Light</span>
        </>
      )}
    </button>
  );
}
