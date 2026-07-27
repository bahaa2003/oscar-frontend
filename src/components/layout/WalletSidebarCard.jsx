import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, ArrowUpLeft, LoaderCircle, ReceiptText, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import { useLanguage } from '../../context/LanguageContext';
import { formatWalletAmount, isNegativeWalletAmount, negativeWalletBalanceClassName } from '../../utils/storefront';
import { cn } from '../ui/Button';

const WalletSidebarCard = ({ className, isVisible = true, onNavigate }) => {
  const navigate = useNavigate();
  const { dir } = useLanguage();
  const { user, refreshProfile } = useAuthStore();
  const primedUserIdRef = useRef(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasRefreshError, setHasRefreshError] = useState(false);

  useEffect(() => {
    if (!user?.id || primedUserIdRef.current === user.id) return;
    primedUserIdRef.current = null;
    setHasRefreshError(false);
  }, [user?.id]);

  useEffect(() => {
    let isActive = true;

    const normalizedRole = String(user?.role || '').toLowerCase();
    const canUseWalletCard = normalizedRole === 'customer';

    if (!isVisible || !canUseWalletCard || !user?.id || typeof refreshProfile !== 'function') {
      return undefined;
    }

    if (primedUserIdRef.current === user.id) {
      return undefined;
    }

    primedUserIdRef.current = user.id;
    setIsRefreshing(true);
    setHasRefreshError(false);

    Promise.resolve(refreshProfile({ force: true }))
      .catch(() => {
        if (!isActive) return;
        setHasRefreshError(true);
      })
      .finally(() => {
        if (!isActive) return;
        setIsRefreshing(false);
      });

    return () => {
      isActive = false;
    };
  }, [isVisible, refreshProfile, user?.id, user?.role]);

  const walletValue = Number(user?.coins || 0);
  const walletCurrency = String(user?.currency || 'USD').toUpperCase();
  const walletDisplayValue = useMemo(
    () => formatWalletAmount(walletValue, walletCurrency, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    [walletCurrency, walletValue]
  );
  const isNegativeBalance = isNegativeWalletAmount(walletValue);

  const handleNavigate = (path) => {
    navigate(path);
    if (typeof onNavigate === 'function') {
      onNavigate();
    }
  };

  return (
    <section
      dir={dir === 'rtl' ? 'rtl' : 'ltr'}
      className={cn(
        'relative isolate overflow-hidden rounded-[17px] border border-[color:rgb(var(--color-primary-rgb)/0.38)] bg-[linear-gradient(145deg,rgb(var(--color-primary-rgb)/0.14),rgba(124,58,237,0.12)_40%,rgb(var(--color-card-rgb)/0.92)_100%)] p-2.5 shadow-[0_12px_28px_-22px_rgb(var(--color-primary-rgb)/0.36)]',
        'before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_right,rgba(244,63,221,0.24),transparent_45%)] before:opacity-80',
        className
      )}
    >
      <div className="relative z-10 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold tracking-[0.1em] text-[var(--color-primary-soft)]">
              رصيد المحفظة
            </p>
            <div className="mt-1 min-h-[1.65rem]">
              {(!user && isRefreshing) ? (
                <div className="space-y-1">
                  <div className="h-2.5 w-18 animate-pulse rounded-full bg-[color:rgb(var(--color-primary-rgb)/0.22)]" />
                  <div className="h-4 w-24 animate-pulse rounded-full bg-[color:rgba(244,63,221,0.18)]" />
                </div>
              ) : (
                <p className={cn(
                  'sidebar-wallet-balance-value truncate text-[0.98rem] font-black tracking-[-0.01em] sm:text-[1.08rem]',
                  isNegativeBalance ? `is-negative ${negativeWalletBalanceClassName}` : 'text-[var(--color-text)]'
                )}>
                  {walletDisplayValue}
                </p>
              )}
            </div>
          </div>

          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[color:rgb(var(--color-primary-rgb)/0.38)] bg-[linear-gradient(145deg,rgba(14,86,151,0.86),rgba(51,25,126,0.88))] text-[#7df9ff] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_0_24px_-10px_rgba(34,211,238,0.84),0_0_28px_-14px_rgba(244,63,221,0.84)]">
            <Wallet className="h-4 w-4" />
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => handleNavigate('/wallet')}
            className="inline-flex h-8 items-center justify-center gap-1 rounded-[12px] border border-[color:rgb(var(--color-primary-rgb)/0.38)] bg-[color:rgb(var(--color-card-rgb)/0.66)] px-2 text-[10px] font-semibold text-[var(--color-primary)] transition-colors hover:border-[color:rgb(var(--color-primary-rgb)/0.58)] hover:bg-[color:rgb(var(--color-card-rgb)/0.82)]"
          >
            <ReceiptText className="h-3 w-3" />
            <span>تفاصيل</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavigate('/wallet/add-balance')}
            className="inline-flex h-8 items-center justify-center gap-1 rounded-[12px] border border-[color:rgb(var(--color-primary-rgb)/0.38)] bg-[linear-gradient(135deg,#0284c7_0%,#5b21b6_52%,#d946ef_100%)] px-2 text-[10px] font-bold text-white shadow-[0_0_26px_-16px_rgba(34,211,238,0.8),0_0_28px_-18px_rgba(244,63,221,0.82)] transition-colors hover:brightness-[1.05]"
          >
            <ArrowUpLeft className="h-3 w-3" />
            <span> اضافة رصيد</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default WalletSidebarCard;
