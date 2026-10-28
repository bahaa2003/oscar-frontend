import React from 'react';
import { NavLink } from 'react-router-dom';
import { CreditCard, Home, Search, ShoppingBag, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';

const items = [
  { key: 'orders', path: '/orders', icon: ShoppingBag, ar: 'طلباتي', en: 'Orders' },
  { key: 'balance', path: '/wallet/add-balance', icon: Wallet, ar: 'إضافة رصيد', en: 'Add balance' },
  { key: 'home', path: '/dashboard', icon: Home, ar: 'الرئيسية', en: 'Home' },
  { key: 'payments', path: '/wallet/topups', icon: CreditCard, ar: 'دفعاتي', en: 'Payments' },
  { key: 'search', path: '/products', icon: Search, ar: 'البحث', en: 'Search' },
];

export default function PlatformBottomNav() {
  const { i18n } = useTranslation();
  const { publishedPlatformTheme } = useTheme();
  const layout = publishedPlatformTheme?.chrome?.bottomNav;
  if (!layout) return null;
  const isArabic = String(i18n.resolvedLanguage || i18n.language || 'ar').toLowerCase().startsWith('ar');
  const style = {
    height: `${layout.height || 64}px`,
    width: `${layout.width || 94}vw`,
    maxWidth: 'calc(100vw - 1rem)',
    background: layout.background,
    color: layout.foreground,
    borderColor: layout.accent,
    borderRadius: `${layout.radius ?? 0}px`,
  };
  return <nav className="platform-bottom-nav grid grid-cols-5 items-center px-2" style={style} data-template={layout.template || 'bar'} aria-label={isArabic ? 'التنقل الرئيسي' : 'Main navigation'}>
    {items.map(({ key, path, icon: Icon, ar, en }) => <NavLink key={key} to={path} className={({ isActive }) => `flex min-w-0 flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors ${isActive ? 'text-[var(--color-primary)]' : 'opacity-75'}`} style={({ isActive }) => isActive ? { color: layout.accent } : undefined}>
      <Icon className="h-4 w-4" aria-hidden="true" /><span className="max-w-full truncate">{isArabic ? ar : en}</span>
    </NavLink>)}
  </nav>;
}
