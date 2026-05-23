import React, { createContext, useContext, useState } from 'react';
import { X, Check, AlertTriangle, Info } from 'lucide-react';
import { cn } from './Button';
import { useLanguage } from '../../context/LanguageContext';
import { getToastMessage } from '../../utils/errorMessages';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const { dir, language } = useLanguage();

  const addToast = (message, type = 'info', options = {}) => {
    const id = Date.now();
    const readableMessage = getToastMessage(message, type, { ...options, language });
    setToasts((prev) => [...prev, { id, message: readableMessage, type }]);
    setTimeout(() => removeToast(id), 3000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
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
                'pointer-events-auto flex w-full min-w-0 max-w-sm items-center gap-3 rounded-[1.35rem] border px-4 py-3.5 shadow-[var(--shadow-medium)] backdrop-blur-xl animate-[page-fade-in_0.2s_ease-out] sm:min-w-[300px]',
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
              {toast.type === 'success' && <Check className="w-5 h-5 shrink-0" />}
              {toast.type === 'error' && <X className="w-5 h-5 shrink-0" />}
              {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 shrink-0" />}
              {toast.type === 'info' && <Info className="w-5 h-5 shrink-0" />}
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
          ))}
      </div>
    </ToastContext.Provider>
  );
};
