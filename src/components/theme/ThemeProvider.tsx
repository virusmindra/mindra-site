'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

type Theme = 'light' | 'dark';
type Ctx = { theme: Theme; setTheme: (t: Theme) => void };

const ThemeContext = createContext<Ctx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    const saved = (localStorage.getItem('mindra_theme') as Theme | null) ?? 'light';
    setThemeState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('mindra_theme', theme);
  }, [theme]);

  const value = useMemo(
    () => ({ theme, setTheme: (t: Theme) => setThemeState(t) }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
