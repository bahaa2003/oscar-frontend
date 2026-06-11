import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { X, Check, AlertTriangle, Info } from 'lucide-react';
import { cn } from './Button';
import { useLanguage } from '../../context/LanguageContext';
import { getToastMessage } from '../../utils/errorMessages';

const ToastContext = createContext();
const APP_TOAST_EVENT = 'app:toast';
const PERMISSION_TOAST_DEBOUNCE_MS = 5000;
const DEFAULT_TOAST_DEBOUNCE_MS = 10000;
const ERROR_TOAST_DEBOUNCE_MS = 30000;
const MAX_VISIBLE_TOASTS = 3;

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const { dir, language } = useLanguage();
  const lastToastByKeyRef = useRef({});
  const toastTimeoutsRef = useRef({});

  const resolveToastMessage = useCallback((message) => {
    if (message && typeof message === 'object' && !React.isValidElement(message)) {
      return message[language] || message.en || message.ar || message.message || '';
    }

    return message;
  }, [language]);

  const getInferredDedupeKey = useCallback((message, type) => {
    const value = String(message || '').toLowerCase();
    const isPermissionMessage = (
      value.includes('permission')
      || value.includes('forbidden')
      || value.includes('access denied')
      || value.includes('insufficient permissions')
      || value.includes('صلاحية')
      || value.includes('مصرح')
    );

    return type === 'error' && isPermissionMessage ? 'permission-denied' : '';
  }, []);

  const removeToast = useCallback((id) => {
    const timeoutId = toastTimeoutsRef.current[id];
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      delete toastTimeoutsRef.current[id];
    }

    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', options = {}) => {
    const resolvedMessage = resolveToastMessage(message);
    const readableMessage = getToastMessage(resolvedMessage, type, { ...options, language });
    const dedupeKey = options.dedupeKey || getInferredDedupeKey(readableMessage, type) || `${type}:${String(readableMessage)}`;

    if (dedupeKey) {
      const now = Date.now();
      const defaultDebounceMs = type === 'error' ? ERROR_TOAST_DEBOUNCE_MS : DEFAULT_TOAST_DEBOUNCE_MS;
      const debounceMs = Number(options.debounceMs || defaultDebounceMs || PERMISSION_TOAST_DEBOUNCE_MS);
      const lastShownAt = Number(lastToastByKeyRef.current[dedupeKey] || 0);

      if (now - lastShownAt < debounceMs) {
        return;
      }

      lastToastByKeyRef.current[dedupeKey] = now;
    }

    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => {
      const next = [...prev, { id, message: readableMessage, type }];
      const visible = next.slice(-MAX_VISIBLE_TOASTS);
      const visibleIds = new Set(visible.map((toast) => toast.id));

      next.forEach((toast) => {
        if (visibleIds.has(toast.id)) return;
        const timeoutId = toastTimeoutsRef.current[toast.id];
        if (timeoutId) {
          window.clearTimeout(timeoutId);
          delete toastTimeoutsRef.current[toast.id];
        }
      });

      return visible;
    });
    toastTimeoutsRef.current[id] = window.setTimeout(() => removeToast(id), 3000);
  }, [getInferredDedupeKey, language, removeToast, resolveToastMessage]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleGlobalToast = (event) => {
      const detail = event?.detail || {};
      addToast(detail.message, detail.type || 'info', detail);
    };

    window.addEventListener(APP_TOAST_EVENT, handleGlobalToast);
    return () => window.removeEventListener(APP_TOAST_EVENT, handleGlobalToast);
  }, [addToast]);

  useEffect(() => () => {
    Object.values(toastTimeoutsRef.current).forEach((timeoutId) => window.clearTimeout(timeoutId));
    toastTimeoutsRef.current = {};
  }, []);

  const contextValue = useMemo(() => ({ addToast }), [addToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div 
        className={cn(
          "fixed bottom-4 z-[260] flex max-w-[calc(100vw-2rem)] flex-col gap-2.5 pointer-events-none",
          dir === 'rtl' ? "left-4 items-start" : "right-4 items-end"
        )}
      >
        {toasts.map((toast) => (
            <div
              key={toast.id}
              className={cn(
                'pointer-events-auto flex w-full min-w-0 max-w-md items-center gap-4 rounded-[1.35rem] border px-5 py-4 shadow-[var(--shadow-medium)] backdrop-blur-xl animate-[page-fade-in_0.2s_ease-out] sm:min-w-[320px]',
                toast.type === 'success' &&
                  'border-[color:rgb(var(--color-success-rgb)/0.2)] bg-[color:rgb(var(--color-success-rgb)/0.12)] text-[var(--color-success)]',
                toast.type === 'error' &&
                  'border-[color:rgb(var(--color-error-rgb)/0.2)] bg-[color:rgb(var(--color-error-rgb)/0.12)] text-[var(--color-error)]',
                toast.type === 'warning' &&
                  'border-[color:rgb(var(--color-warning-rgb)/0.2)] bg-[color:rgb(var(--color-warning-rgb)/0.12)] text-[var(--color-warning)]',
                toast.type === 'info' &&
                  'border-[color:rgb(var(--color-primary-rgb)/0.18)] bg-[linear-gradient(180deg,rgb(var(--color-primary-rgb)/0.12),rgb(var(--color-primary-rgb)/0.08))] text-[var(--color-primary)]'
              )}
            >
              {toast.type === 'success' && <Check className="h-6 w-6 shrink-0" />}
              {toast.type === 'error' && <X className="h-6 w-6 shrink-0" />}
              {toast.type === 'warning' && <AlertTriangle className="h-6 w-6 shrink-0" />}
              {toast.type === 'info' && <Info className="h-6 w-6 shrink-0" />}
              <span className="text-base font-medium leading-6">{toast.message}</span>
            </div>
          ))}
      </div>
    </ToastContext.Provider>
  );
};
