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
  const [previewPlatformTheme, setPreviewPlatformTheme] = useState(null);
  const isPreviewFrame = typeof window !== 'undefined' && window.parent !== window;
  const activePlatformTheme = previewPlatformTheme || publishedPlatformTheme;
  const isDark = theme === 'dark';

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.dataset.theme = theme;
    if (!isPreviewFrame) window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    applyPublishedPlatformTheme(activePlatformTheme, theme);
  }, [activePlatformTheme, isDark, isPreviewFrame, theme]);

  useEffect(() => {
    if (!isPreviewFrame) return undefined;
    const receivePreview = (event) => {
      if (event.source !== window.parent || event.origin !== window.location.origin
        || event.data?.type !== 'oscar:theme-preview') return;
      if (!['light', 'dark'].includes(event.data.mode)) return;
      setTheme(event.data.mode);
      setPreviewPlatformTheme(event.data.configuration?.schemaVersion === 2 ? event.data.configuration : null);
    };
    window.addEventListener('message', receivePreview);
    return () => window.removeEventListener('message', receivePreview);
  }, [isPreviewFrame]);

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
  const value = useMemo(() => ({ theme, isDark, toggleTheme, setTheme,
    publishedPlatformTheme: activePlatformTheme }),
    [theme, isDark, activePlatformTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};