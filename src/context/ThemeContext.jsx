import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import apiClient from '../services/client';
import { applyPublishedPlatformTheme } from '../theme/platformTheme';

const ThemeContext = createContext();
const THEME_STORAGE_KEY = 'oscar-theme';

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'light';
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
  return 'light';
};

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme);
  const [publishedPlatformTheme, setPublishedPlatformTheme] = useState(null);
  const isDark = theme === 'dark';

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    applyPublishedPlatformTheme(publishedPlatformTheme, theme);
  }, [isDark, publishedPlatformTheme, theme]);

  useEffect(() => {
    if ((import.meta.env.VITE_DATA_PROVIDER || 'mock').toLowerCase() !== 'real') return undefined;
    let active = true;
    const refresh = () => apiClient.platformTheme.getPublished()
      .then((result) => { if (active) setPublishedPlatformTheme(result?.published || result?.configuration || null); })
      .catch(() => { if (active) setPublishedPlatformTheme(null); });
    void refresh();
    window.addEventListener('platform-theme-published', refresh);
    window.addEventListener('platform-theme-subscription-updated', refresh);
    return () => {
      active = false;
      window.removeEventListener('platform-theme-published', refresh);
      window.removeEventListener('platform-theme-subscription-updated', refresh);
    };
  }, []);

  const toggleTheme = () => setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  const value = useMemo(() => ({ theme, isDark, toggleTheme, setTheme, publishedPlatformTheme }),
    [theme, isDark, publishedPlatformTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};