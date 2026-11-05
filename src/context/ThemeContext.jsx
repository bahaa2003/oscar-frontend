import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import apiClient from '../services/client';
import { applyPublishedPlatformTheme } from '../theme/platformTheme';

const ThemeContext = createContext();
const THEME_STORAGE_KEY = 'oscar-theme';

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'dark';
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
  return 'dark';
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
    window.parent.postMessage({ type: 'oscar:theme-preview-ready' }, window.location.origin);
    return () => window.removeEventListener('message', receivePreview);
  }, [isPreviewFrame]);

  useEffect(() => {
    if ((import.meta.env.VITE_DATA_PROVIDER || 'mock').toLowerCase() !== 'real') return undefined;
    let active = true;
    let generation = 0;
    let inFlight = null;
    let refreshPending = false;
    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('oscar-published-theme') : null;
    const refresh = (event) => {
      const eventConfiguration = event?.detail?.schemaVersion === 2 ? event.detail : null;
      if (eventConfiguration) {
        generation += 1; // Ignore any older GET that finishes after this successful publish.
        setPublishedPlatformTheme(eventConfiguration);
        channel?.postMessage({ type: 'published' });
        return;
      }
      if (inFlight) return inFlight;
      const requestGeneration = generation;
      inFlight = apiClient.platformTheme.getPublished()
        .then((result) => { if (active && generation === requestGeneration) setPublishedPlatformTheme(result.published); })
        // A temporary connection failure must not erase the last confirmed theme.
        .catch(() => {})
        .finally(() => {
          inFlight = null;
          if (active && refreshPending) { refreshPending = false; void refresh(); }
        });
      return inFlight;
    };
    const invalidate = () => {
      generation += 1;
      if (inFlight) { refreshPending = true; return; }
      void refresh();
    };
    const refreshVisible = () => { if (document.visibilityState === 'visible') void refresh(); };
    if (channel) channel.onmessage = invalidate;
    const timer = window.setInterval(refreshVisible, 30000);
    void refresh();
    window.addEventListener('platform-theme-published', refresh);
    window.addEventListener('platform-theme-subscription-updated', invalidate);
    window.addEventListener('focus', refreshVisible);
    document.addEventListener('visibilitychange', refreshVisible);
    return () => {
      active = false;
      window.clearInterval(timer);
      channel?.close();
      window.removeEventListener('platform-theme-published', refresh);
      window.removeEventListener('platform-theme-subscription-updated', invalidate);
      window.removeEventListener('focus', refreshVisible);
      document.removeEventListener('visibilitychange', refreshVisible);
    };
  }, []);

  const toggleTheme = () => setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  const value = useMemo(() => ({ theme, isDark, toggleTheme, setTheme,
    publishedPlatformTheme: activePlatformTheme }),
    [theme, isDark, activePlatformTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
