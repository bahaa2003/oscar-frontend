import React, { useEffect, useRef, useState } from 'react';
import { Bell, CheckCircle2, Clock3, CreditCard, Menu, ShoppingBag, Trash2, UserCheck, Wallet, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/useAuthStore';
import useNotificationStore from '../../store/useNotificationStore';
import { useLanguage } from '../../context/LanguageContext';
import ThemeToggle from '../ui/ThemeToggle';
import HeaderBrand from './HeaderBrand';
import { formatWalletAmount, isNegativeWalletAmount, negativeWalletBalanceClassName } from '../../utils/storefront';
import { getDefaultRouteForRole, isAdminRole, isSupervisorRole } from '../../utils/authRoles';
import { cn } from '../ui/Button';

const parseHeaderWalletNumber = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;

  const normalized = value.replace(/,/g, '').trim();
  const numericMatch = normalized.match(/-?\d+(?:\.\d+)?/);
  if (!numericMatch) return null;

  const numericValue = Number(numericMatch[0]);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const getHeaderWalletCandidates = (user) => [
    user?.coins,
    user?.walletBalance,
    user?.balance,
    user?.currentBalance,
    user?.availableBalance,
    user?.wallet?.walletBalance,
    user?.wallet?.balance,
    user?.wallet?.coins,
    user?.wallet?.currentBalance,
    user?.wallet?.availableBalance,
    user?.wallet?.amount,
  ];

const resolveHeaderWalletValue = (user) => {
  const candidates = getHeaderWalletCandidates(user);
  const numbers = candidates
    .map(parseHeaderWalletNumber)
    .filter((value) => value !== null);

  return numbers.find((value) => value < 0) ?? numbers[0] ?? 0;
};

const hasNegativeHeaderWalletValue = (user, displayValue = '') => {
  const candidates = getHeaderWalletCandidates(user);

  return candidates.some((value) => {
    const numericValue = parseHeaderWalletNumber(value);
    return numericValue !== null && numericValue < 0;
  })
    || String(displayValue || '').trim().startsWith('-');
};

const Header = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { user } = useAuthStore();
  const { notifications, unreadCount, isLoading, loadNotifications, loadUnreadCount, markAllAsRead, clearNotifications } = useNotificationStore();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef(null);
  const { dir } = useLanguage();

  const language = String(i18n.resolvedLanguage || i18n.language || 'ar').toLowerCase().startsWith('ar') ? 'ar' : 'en';
  const isRTL = dir === 'rtl';
  const isCustomer = String(user?.role || '').toLowerCase() === 'customer';
  const isAdmin = isAdminRole(user?.role);
  const isBackoffice = isAdmin || isSupervisorRole(user?.role);
  const walletValue = resolveHeaderWalletValue(user);
  const walletDisplayValue = formatWalletAmount(walletValue, user?.currency || 'USD');
  const isNegativeBalance = isNegativeWalletAmount(walletValue) || hasNegativeHeaderWalletValue(user, walletDisplayValue);
  const negativeWalletDataAttribute = isNegativeBalance ? 'true' : undefined;
  const headerWalletBalanceToneClassName = isNegativeBalance
    ? `header-wallet-negative is-negative ${negativeWalletBalanceClassName}`
    : 'header-wallet-normal';
  const headerWalletBalanceStyle = isNegativeBalance
    ? {
      color: '#dc2626',
      WebkitTextFillColor: '#dc2626',
      textShadow: '0 0 12px rgb(220 38 38 / 0.18)',
    }
    : undefined;
  const walletTargetPath = isCustomer ? '/wallet' : '/admin/wallet';
  const shouldShowWallet = isCustomer || isBackoffice;
  const hasUnreadNotifications = unreadCount > 0 || notifications.some((notification) => !notification.read);
  useEffect(() => {
    if (!user?.id) return undefined;
    void loadUnreadCount().catch(() => {});
    const timer = setInterval(() => {
      void loadUnreadCount().catch(() => {});
    }, 30000);
    return () => clearInterval(timer);
  }, [loadUnreadCount, user?.id]);

  useEffect(() => {
    if (!isNotificationsOpen) return undefined;

    const handlePointerDown = (event) => {
      if (notificationsRef.current?.contains(event.target)) return;
      if (hasUnreadNotifications) {
        markAllAsRead();
      }
      setIsNotificationsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [hasUnreadNotifications, isNotificationsOpen, markAllAsRead]);

  const resolveNotificationTarget = (notification) => {
    if (notification?.targetUrl) return notification.targetUrl;

    const source = String(notification?.source || notification?.context || notification?.category || '').toLowerCase();
    const targetType = String(notification?.targetType || '').toLowerCase();
    const orderId = notification?.orderId || (targetType === 'order' ? notification?.targetId : '');
    const topupId = notification?.topupId || (targetType === 'topup' || targetType === 'wallet' ? notification?.targetId : '');
    const userId = notification?.userId || (targetType === 'user' ? notification?.targetId : '');
    const text = `${notification?.title || ''} ${notification?.message || ''} ${source} ${targetType}`;
    if (source.includes('target') || targetType.includes('target') || /target/i.test(text)) {
      return isBackoffice ? '/admin/target-requests' : '/buy-target';
    }

    if (
      source.includes('deposit')
      || source.includes('wallet')
      || targetType === 'deposit'
      || topupId
      || targetType === 'topup'
      || targetType === 'wallet'
      || /wallet|topup|payment|deposit/i.test(text)
    ) {
      return isBackoffice ? '/admin/payments' : '/wallet';
    }
    const inferredId = text.match(/(?:الطلب|طلب|order|#)\s*([A-Za-z0-9_-]{4,})/i)?.[1] || '';

    if (orderId || targetType === 'order' || /طلب(?! شحن)|order/i.test(text)) {
      const id = orderId || inferredId;
      const basePath = isBackoffice ? '/admin/orders' : '/orders';
      return id ? `${basePath}?orderId=${encodeURIComponent(id)}` : basePath;
    }

    if (topupId || targetType === 'topup' || targetType === 'wallet' || /شحن|رصيد|محفظة|wallet|topup|payment/i.test(text)) {
      return isBackoffice ? '/admin/payments' : '/wallet';
    }

    if (userId || targetType === 'user' || /حساب|account|user/i.test(text)) {
      return isBackoffice ? '/admin/users' : '/account';
    }

    return getDefaultRouteForRole(user?.role);
  };

  const getNotificationTone = (type) => {
    const normalizedType = String(type || 'info').toLowerCase();
    if (normalizedType === 'success') return 'border-emerald-400/30 bg-emerald-500/10';
    if (normalizedType === 'warning') return 'border-amber-400/30 bg-amber-500/10';
    if (normalizedType === 'error') return 'border-red-400/30 bg-red-500/10';
    return 'border-sky-400/30 bg-sky-500/10';
  };

  const getNotificationMeta = (notification) => {
    const text = `${notification?.title || ''} ${notification?.message || ''} ${notification?.targetType || ''}`.toLowerCase();
    const type = String(notification?.type || 'info').toLowerCase();

    if (type === 'success' || /قبول|نجاح|اكتمل|completed|approved/.test(text)) {
      return {
        icon: CheckCircle2,
        label: 'تم بنجاح',
        className: 'bg-emerald-500/12 text-emerald-500 ring-emerald-400/24',
      };
    }

    if (type === 'warning' || /رفض|rejected|denied/.test(text)) {
      return {
        icon: XCircle,
        label: 'يحتاج متابعة',
        className: 'bg-amber-500/12 text-amber-500 ring-amber-400/24',
      };
    }

    if (/شحن|رصيد|محفظة|wallet|topup|payment/.test(text)) {
      return {
        icon: CreditCard,
        label: 'عملية رصيد',
        className: 'bg-cyan-500/12 text-cyan-500 ring-cyan-400/24',
      };
    }

    if (/حساب|account|user/.test(text)) {
      return {
        icon: UserCheck,
        label: 'حساب',
        className: 'bg-violet-500/12 text-violet-500 ring-violet-400/24',
      };
    }

    if (/طلب|order|manual/.test(text)) {
      return {
        icon: ShoppingBag,
        label: 'طلب',
        className: 'bg-sky-500/12 text-sky-500 ring-sky-400/24',
      };
    }

    return {
      icon: Clock3,
      label: 'تحديث',
      className: 'bg-slate-500/12 text-slate-500 ring-slate-400/24',
    };
  };

  const handleNotificationsToggle = () => {
    if (isNotificationsOpen) {
      if (hasUnreadNotifications) {
        markAllAsRead();
      }
      setIsNotificationsOpen(false);
      return;
    }

    setIsNotificationsOpen(true);
    void loadNotifications().catch(() => {});
  };

  const handleNotificationClick = (notification) => {
    if (hasUnreadNotifications) {
      markAllAsRead();
    }
    navigate(resolveNotificationTarget(notification));
    setIsNotificationsOpen(false);
  };

  const handleClearNotifications = (event) => {
    event?.stopPropagation();
    clearNotifications();
  };

  return (
    <header dir={isRTL ? 'rtl' : 'ltr'} className="w-full max-w-full">
      <div className={cn(
        'app-shell-header-panel oscar-neon-panel w-full max-w-full overflow-visible rounded-[22px] border px-2.5 py-1.5 backdrop-blur-[22px] sm:rounded-[28px] sm:px-5 sm:py-1.5',
        isAdmin && 'border-[color:rgb(var(--color-primary-rgb)/0.26)]'
      )}>
        <div dir="ltr" className="grid min-h-[3.05rem] min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1.5 min-[380px]:gap-2 sm:min-h-[3.25rem] sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-5">
          <div className="col-start-2 row-start-1 min-w-0 justify-self-center">
            <button
              type="button"
              onClick={() => navigate(getDefaultRouteForRole(user?.role))}
              className="inline-flex items-center gap-2 rounded-[14px] px-0 py-0 transition-all hover:-translate-y-0.5 sm:gap-4"
            >
              <HeaderBrand className="justify-center" textClassName="min-[360px]:min-w-[4.1rem] sm:min-w-0" />
            </button>
          </div>

          <div className={cn(
            'header-mobile-actions col-start-1 row-start-1 flex min-w-0 shrink-0 items-center gap-1 justify-self-start px-0 sm:gap-2'
          )}>
            <ThemeToggle compact className="h-10 w-10 shrink-0 rounded-full border-[color:rgb(var(--color-border-rgb)/0.84)] bg-[radial-gradient(circle_at_35%_25%,rgb(255_255_255/0.16),transparent_34%),linear-gradient(180deg,rgb(10_17_42/0.88),rgb(2_6_19/0.78))] shadow-[inset_0_0_18px_rgb(34_211_238/0.08),0_0_28px_-18px_rgb(34_211_238/0.9)]" />

            <div ref={notificationsRef} className="relative">
              <button
                type="button"
                onClick={handleNotificationsToggle}
                className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[color:rgb(var(--color-border-rgb)/0.84)] bg-[radial-gradient(circle_at_35%_25%,rgb(255_255_255/0.14),transparent_34%),linear-gradient(180deg,rgb(10_17_42/0.88),rgb(2_6_19/0.78))] text-[var(--color-text)] shadow-[inset_0_0_18px_rgb(168_85_247/0.12),0_0_28px_-18px_rgb(168_85_247/0.95)] transition-all hover:-translate-y-0.5 hover:border-[color:rgb(var(--color-primary-rgb)/0.38)] hover:text-[var(--color-primary)]"
                aria-label="الإشعارات"
              >
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                {unreadCount > 0 ? (
                  <span className="absolute -end-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[linear-gradient(135deg,#a855f7,#f43fdd)] px-1 text-[10px] font-black text-white shadow-[0_0_18px_rgb(244_63_221/0.52)]">
                    {unreadCount > 9 ? '+9' : unreadCount}
                  </span>
                ) : null}
              </button>

              {isNotificationsOpen ? (
                <div className={cn(
                  'fixed left-2 right-2 top-[4.55rem] z-50 max-h-[calc(100vh-5.25rem)] overflow-hidden rounded-[1rem] border border-[color:rgb(var(--color-primary-rgb)/0.18)] bg-[color:rgb(var(--color-card-rgb)/0.97)] shadow-[0_30px_80px_-42px_rgb(0_0_0/0.94)] backdrop-blur-xl sm:absolute sm:left-auto sm:right-auto sm:top-12 sm:max-h-none sm:w-[min(29rem,calc(100vw-2rem))] sm:rounded-2xl',
                  isRTL ? 'sm:left-0' : 'sm:right-0'
                )}>
                  <div className="flex items-center justify-between gap-1.5 border-b border-[color:rgb(var(--color-border-rgb)/0.68)] px-2.5 py-2 sm:gap-2 sm:px-4 sm:py-3">
                    <p className="shrink-0 text-sm font-black text-[var(--color-text)] sm:text-base">الإشعارات</p>
                    <div className="flex min-w-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={handleClearNotifications}
                        disabled={isLoading || notifications.length === 0}
                        className="inline-flex h-7 items-center gap-1 rounded-full border border-red-400/24 bg-red-500/10 px-2 text-[10px] font-black text-red-400 transition hover:bg-red-500/16 disabled:cursor-not-allowed disabled:opacity-50 sm:h-8 sm:gap-1.5 sm:px-3 sm:text-[11px]"
                      >
                        <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        مسح الكل
                      </button>
                    </div>
                  </div>
                  <div className="max-h-[min(58vh,28rem)] overflow-y-auto p-1.5 sm:max-h-[min(66vh,34rem)] sm:p-2.5">
                    {notifications.length ? notifications.map((notification) => {
                      const meta = getNotificationMeta(notification);
                      const NotificationIcon = meta.icon;

                      return (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => handleNotificationClick(notification)}
                          className={cn(
                            'block w-full rounded-lg border px-2.5 py-2 text-start transition hover:-translate-y-0.5 hover:bg-[color:rgb(var(--color-primary-rgb)/0.08)] sm:rounded-xl sm:px-3.5 sm:py-3',
                            notification.read ? 'border-transparent opacity-75' : getNotificationTone(notification.type)
                          )}
                        >
                          <span className="flex items-start gap-2 sm:gap-3">
                            <span className={cn('mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1 sm:h-11 sm:w-11', meta.className)}>
                              <NotificationIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-2">
                                <span className="block truncate text-sm font-black text-[var(--color-text)] sm:text-base">{notification.title}</span>
                                {!notification.read ? (
                                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" />
                                ) : null}
                              </span>
                              {notification.message ? (
                                <span className="mt-0.5 line-clamp-4 whitespace-pre-line text-xs leading-5 text-[var(--color-text-secondary)] sm:mt-1 sm:line-clamp-5 sm:text-sm sm:leading-6">{notification.message}</span>
                              ) : null}
                              <span className="mt-1.5 inline-flex rounded-full bg-[color:rgb(var(--color-surface-rgb)/0.72)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-text-secondary)] sm:mt-2 sm:px-2.5 sm:py-1 sm:text-[11px]">
                                {meta.label}
                              </span>
                            </span>
                          </span>
                        </button>
                      );
                    }) : (
                      <p className="px-3 py-6 text-center text-sm text-[var(--color-text-secondary)]">
                        لا توجد إشعارات
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {shouldShowWallet && (
              <>
                <button
                  type="button"
                  onClick={() => navigate(walletTargetPath)}
                  className="header-wallet-button inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-[color:rgb(var(--color-border-rgb)/0.84)] bg-[linear-gradient(180deg,rgb(10_17_42/0.88),rgb(2_6_19/0.72))] px-2 text-start shadow-[inset_0_0_18px_rgb(34_211_238/0.08),0_0_28px_-18px_rgb(34_211_238/0.9)] transition-all hover:-translate-y-0.5 sm:hidden"
                  aria-label={language === 'ar' ? 'الرصيد' : 'Balance'}
                >
                  <span className={cn(
                    'header-wallet-balance max-w-[46px] truncate text-[0.66rem] font-black text-[#0b172a] dark:text-[var(--color-text)] min-[380px]:max-w-[68px] min-[380px]:text-[0.72rem]',
                    headerWalletBalanceToneClassName
                  )}
                    data-negative-wallet={negativeWalletDataAttribute}
                    style={headerWalletBalanceStyle}
                  >
                    {walletDisplayValue}
                  </span>
                  <span className="header-wallet-icon inline-flex h-6.5 w-6.5 items-center justify-center rounded-full bg-[color:rgb(var(--color-primary-rgb)/0.14)] text-[var(--color-primary)]">
                    <Wallet className="h-3.5 w-3.5" />
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate(walletTargetPath)}
                  className="header-wallet-button hidden h-11 items-center gap-2.5 rounded-full border border-[color:rgb(var(--color-border-rgb)/0.84)] bg-[linear-gradient(180deg,rgb(10_17_42/0.88),rgb(2_6_19/0.72))] px-3.5 text-start shadow-[inset_0_0_18px_rgb(34_211_238/0.08),0_0_28px_-18px_rgb(34_211_238/0.9)] transition-all hover:-translate-y-0.5 sm:inline-flex"
                  aria-label={language === 'ar' ? 'المحفظة' : 'Wallet'}
                >
                  <span className="min-w-0">
                    <span className={cn(
                      'header-wallet-balance block truncate text-base font-black text-[#0b172a] dark:text-[var(--color-text)]',
                      headerWalletBalanceToneClassName
                    )}
                      data-negative-wallet={negativeWalletDataAttribute}
                      style={headerWalletBalanceStyle}
                    >
                      {walletDisplayValue}
                    </span>
                  </span>
                  <span className="header-wallet-icon inline-flex h-7 w-7 items-center justify-center rounded-full bg-[color:rgb(var(--color-primary-rgb)/0.14)] text-[var(--color-primary)]">
                    <Wallet className="h-4 w-4" />
                  </span>
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={toggleSidebar}
            className="col-start-3 row-start-1 inline-flex h-10 w-10 shrink-0 items-center justify-center justify-self-end rounded-full border border-[color:rgb(var(--color-border-rgb)/0.84)] bg-[linear-gradient(180deg,rgb(3_8_22/0.9),rgb(2_6_19/0.78))] text-[var(--color-text)] shadow-[inset_0_0_18px_rgb(255_255_255/0.035),0_0_26px_-18px_rgb(34_211_238/0.9)] transition-all hover:-translate-y-0.5 hover:border-[color:rgb(var(--color-primary-rgb)/0.38)] hover:text-[var(--color-primary)]"
            aria-label={language === 'ar' ? 'فتح القائمة' : 'Open menu'}
          >
            <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
