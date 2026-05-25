import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Building2,
  ChevronLeft,
  Check,
  Coins,
  Copy,
  CreditCard,
  Home,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  MonitorCog,
  Package,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Target,
  User,
  UserCog,
  Users,
  Wallet
} from 'lucide-react';
import ConfirmDialog from '../account/ConfirmDialog';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/useAuthStore';
import { cn } from '../ui/Button';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../ui/LanguageSwitcher';
import WalletSidebarCard from './WalletSidebarCard';
import HeaderBrand from './HeaderBrand';
import { SUPERVISOR_ROLES, getDefaultRouteForRole, hasRequiredRole } from '../../utils/authRoles';
import { PERMISSIONS, hasPermission } from '../../utils/permissions';
import { resolveUserAvatar } from '../../utils/avatar';

const ADMIN_NAV_ROLES = ['admin', 'super_admin', ...SUPERVISOR_ROLES];

const copyToClipboard = async (value) => {
  const text = String(value || '').trim();
  if (!text) return false;

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall back to the hidden textarea copy path below.
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'fixed';
    textArea.style.top = '-9999px';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(textArea);
    return copied;
  } catch {
    return false;
  }
};

const Sidebar = ({ isOpen, setIsOpen, isMobile }) => {
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [copiedUserId, setCopiedUserId] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { dir } = useLanguage();
  const { t } = useTranslation();

  const isExpanded = isOpen || isMobile || isPreviewExpanded;
  const userId = String(user?.id || user?._id || user?.userId || '').trim();

  useEffect(() => {
    if (!copiedUserId) return undefined;
    const timer = window.setTimeout(() => setCopiedUserId(false), 1400);
    return () => window.clearTimeout(timer);
  }, [copiedUserId]);

  const closeSidebarOnMobile = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const handleLogout = () => {
    closeSidebarOnMobile();
    logout();
    navigate('/auth');
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    await handleLogout();
  };

  const handleOpenMyAccount = () => {
    closeSidebarOnMobile();
    navigate('/account');
  };

  const handleCopyUserId = async () => {
    if (!userId) return;

    if (await copyToClipboard(userId)) {
      setCopiedUserId(true);
      return;
    }

    setCopiedUserId(false);
  };

  const handleContactClick = () => {
    navigate('/contact-us');
    closeSidebarOnMobile();
  };

  const navItems = [
    {
      icon: Home,
      label: t('header.home', { defaultValue: dir === 'rtl' ? 'الرئيسية' : 'Home' }),
      path: '/dashboard',
      roles: ['customer', 'admin', ...SUPERVISOR_ROLES]
    },
    {
      icon: Wallet,
      label: t('sidebar.adminWallet', { defaultValue: dir === 'rtl' ? 'محفظة الأدمن' : 'Admin Wallet' }),
      path: '/admin/wallet',
      roles: ADMIN_NAV_ROLES,
      permission: PERMISSIONS.ADMIN_WALLET,
    },
    {
      icon: LayoutDashboard,
      label: t('sidebar.adminDashboard', { defaultValue: dir === 'rtl' ? 'لوحة تحكم الأدمن' : 'Admin Dashboard' }),
      path: '/admin/dashboard',
      roles: ['admin', 'super_admin'],
    },
    { icon: User, label: t('sidebar.myAccount', { defaultValue: dir === 'rtl' ? 'حسابي' : 'My Account' }), path: '/account', roles: ['admin', 'customer', ...SUPERVISOR_ROLES] },
    { icon: ShieldCheck, label: t('sidebar.accountProtection', { defaultValue: dir === 'rtl' ? 'حماية الحساب' : 'Account Security' }), path: '/account-security', roles: ['admin', 'customer', ...SUPERVISOR_ROLES] },
    { icon: Wallet, label: t('sidebar.wallet'), path: '/wallet', roles: ['customer'] },
    {
      icon: ShoppingBag,
      label: t('header.orders', { defaultValue: dir === 'rtl' ? 'طلباتي' : 'My Orders' }),
      path: '/orders',
      roles: ['customer']
    },
    { icon: Target, label: 'بيع التارجت', path: '/buy-target', roles: ['customer'] },
    { icon: Users, label: t('sidebar.users'), path: '/admin/users', roles: ADMIN_NAV_ROLES, permission: PERMISSIONS.ADMIN_USERS },
    { icon: UserCog, label: t('sidebar.supervisors'), path: '/admin/supervisors', roles: ['admin'] },
    { icon: MonitorCog, label: 'مراقبة المشرفين', path: '/admin/supervisor-monitoring', roles: ['admin'] },
    { icon: Users, label: t('sidebar.groupsManager'), path: '/admin/groups', roles: ADMIN_NAV_ROLES, permission: PERMISSIONS.ADMIN_GROUPS },
    { icon: Package, label: t('sidebar.productsManager'), path: '/admin/products', roles: ADMIN_NAV_ROLES, permission: PERMISSIONS.ADMIN_PRODUCTS },
    {
      icon: ShoppingBag,
      label: t('sidebar.ordersManager', { defaultValue: dir === 'rtl' ? 'إدارة الطلبات' : 'Orders Manager' }),
      path: '/admin/orders',
      roles: ADMIN_NAV_ROLES,
      permission: PERMISSIONS.ADMIN_ORDERS,
    },
    { icon: Target, label: 'طلبات التارجت', path: '/admin/target-requests', roles: ADMIN_NAV_ROLES, permission: PERMISSIONS.ADMIN_TARGET_REQUESTS },
    { icon: Building2, label: t('sidebar.suppliersManager'), path: '/admin/suppliers', roles: ADMIN_NAV_ROLES, permission: PERMISSIONS.ADMIN_SUPPLIERS },
    { icon: ShieldCheck, label: t('sidebar.paymentsManager'), path: '/admin/payments', roles: ADMIN_NAV_ROLES, permission: PERMISSIONS.ADMIN_PAYMENTS },
    { icon: CreditCard, label: t('sidebar.paymentMethods'), path: '/admin/payment-methods', roles: ADMIN_NAV_ROLES, permission: PERMISSIONS.ADMIN_PAYMENT_METHODS },
    { icon: Coins, label: t('sidebar.currencies'), path: '/admin/currencies', roles: ADMIN_NAV_ROLES, permission: PERMISSIONS.ADMIN_CURRENCIES },
    { icon: MessageCircle, label: 'تكامل الواتساب', path: '/admin/whatsapp', roles: ADMIN_NAV_ROLES, permission: PERMISSIONS.MANAGE_SETTINGS },
    {
      icon: MessageCircle,
      label: t('sidebar.contactUs', { defaultValue: 'اتصل بنا' }),
      path: '/contact-us',
      roles: ['customer', ...SUPERVISOR_ROLES],
      onClick: handleContactClick,
    },
    { icon: Settings, label: t('sidebar.settings'), path: '/settings', roles: ['admin', 'customer', ...SUPERVISOR_ROLES] }
  ];

  const filteredNavItems = navItems.filter((item) => (
    hasRequiredRole(user?.role || 'customer', item.roles) && hasPermission(user, item.permission)
  ));
  const showWalletCard = String(user?.role || '').toLowerCase() === 'customer' && isExpanded;
  const isAdmin = String(user?.role || '').toLowerCase() === 'admin';
  const userDisplayName = user?.name || user?.email || (dir === 'rtl' ? 'حسابي' : 'My Account');
  const userAvatar = resolveUserAvatar(user, userDisplayName);
  const userRoleLabel = isAdmin
    ? (dir === 'rtl' ? 'مدير المنصة' : 'Platform Admin')
    : (dir === 'rtl' ? 'عضو المتجر' : 'Store Member');

  return (
    <>
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-[80] bg-black/72 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      <motion.aside
        initial={false}
        animate={{
          width: isMobile ? 292 : isExpanded ? 282 : 84,
          x: isMobile && !isOpen ? (dir === 'rtl' ? 320 : -320) : 0
        }}
        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        onMouseEnter={() => {
          if (!isMobile && !isOpen) {
            setIsPreviewExpanded(true);
          }
        }}
        onMouseLeave={() => {
          if (!isMobile) {
            setIsPreviewExpanded(false);
          }
        }}
        className={cn(
          'fixed top-4 z-[90] h-[calc(100vh-4rem)] overflow-hidden',
          dir === 'rtl' ? 'right-4' : 'left-4',
          isMobile && !isOpen && 'hidden'
        )}
      >
        <div className={cn(
          'app-shell-sidebar-panel oscar-sidebar-panel relative flex h-full flex-col rounded-[32px] border backdrop-blur-[24px]',
          isAdmin && 'border-[color:rgb(var(--color-primary-rgb)/0.26)]'
        )}>
          <div className="relative z-10 px-4 pb-4 pt-5">
            <div className={cn('relative flex items-center', isExpanded ? 'justify-center' : 'justify-center')}>
              <button
                type="button"
                onClick={() => navigate(getDefaultRouteForRole(user?.role))}
                className={cn(
                  'flex items-center rounded-[24px] transition-all hover:-translate-y-0.5',
                  isExpanded ? 'bg-transparent' : 'mx-auto'
                )}
              >
                <HeaderBrand
                  className={cn(
                    'transition-transform',
                    isExpanded
                      ? 'scale-[1.18]'
                      : 'max-w-11 scale-[0.82] justify-center overflow-hidden [&>span:first-child]:hidden'
                  )}
                  iconClassName={isExpanded ? 'scale-[1.14]' : 'scale-[1.04]'}
                  textClassName="shrink-0"
                />
              </button>

              {!isMobile && (
                <button
                  type="button"
                  onClick={() => setIsOpen(!isOpen)}
                  className={cn(
                    'oscar-sidebar-collapse absolute top-1 inline-flex h-9 w-9 items-center justify-center rounded-full transition-all',
                    dir === 'rtl' ? 'left-0' : 'right-0',
                    !isExpanded && 'mx-auto'
                  )}
                  aria-label={dir === 'rtl' ? 'تصغير الشريط الجانبي' : 'Collapse sidebar'}
                >
                  <ChevronLeft className={cn('h-4.5 w-4.5 transition-transform', (dir === 'rtl' ? isExpanded : !isExpanded) && 'rotate-180')} />
                </button>
              )}
            </div>

            {isExpanded && (
              <>
                <div className="mt-4">
                  <LanguageSwitcher showIcon variant="sidebar" className="oscar-sidebar-language w-full justify-center" />
                </div>

                <div className="oscar-sidebar-user-card mt-4">
                  {userId ? (
                    <button
                      type="button"
                      onClick={handleCopyUserId}
                      className={cn(
                        'oscar-sidebar-id-chip',
                        dir === 'rtl' ? 'right-4' : 'left-4'
                      )}
                      title={copiedUserId ? 'تم نسخ ID المستخدم' : 'اضغط لنسخ ID المستخدم'}
                      aria-label={copiedUserId ? 'تم نسخ ID المستخدم' : 'نسخ ID المستخدم'}
                    >
                      {copiedUserId ? <Check className="h-3 w-3 shrink-0" /> : <Copy className="h-3 w-3 shrink-0" />}
                      <span className="truncate">{copiedUserId ? 'تم النسخ' : `...${userId.slice(-8)}`}</span>
                    </button>
                  ) : null}

                  <div className="flex items-center gap-3">
                    <div className="flex shrink-0 flex-col items-center gap-1">
                      <button
                        type="button"
                        onClick={handleOpenMyAccount}
                        className="oscar-sidebar-avatar"
                        aria-label={dir === 'rtl' ? 'فتح الحساب' : 'Open account'}
                      >
                        <img
                          src={userAvatar}
                          alt={userDisplayName}
                        />
                      </button>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold leading-tight text-[var(--color-text)]">{userDisplayName}</div>
                      <div className="mt-1 truncate text-[0.7rem] font-bold text-[var(--color-primary-hover)]">{userRoleLabel}</div>
                    </div>

                    <button
                      type="button"
                      onClick={handleLogoutClick}
                      className="oscar-sidebar-user-action"
                      aria-label={dir === 'rtl' ? 'تسجيل الخروج' : 'Logout'}
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="relative z-10 flex-1 overflow-y-auto px-3 py-3 scrollbar-hide">
            {showWalletCard && (
              <WalletSidebarCard
                className="mb-4"
                isVisible={showWalletCard}
                onNavigate={closeSidebarOnMobile}
              />
            )}

            <div className="space-y-2">
              {filteredNavItems.map((item) => (
                item.isExternal ? (
                  <button
                    key={item.path}
                    type="button"
                    onClick={item.onClick}
                    className={cn(
                      'oscar-sidebar-nav-item group relative flex w-full items-center gap-2.5 overflow-hidden px-3 py-2.5 text-[var(--color-text-secondary)] transition-all',
                      !isExpanded && 'justify-center'
                    )}
                  >
                    <span className="oscar-sidebar-icon-bubble">
                      <item.icon className="h-4.5 w-4.5" />
                    </span>
                    {isExpanded && <span className="truncate text-sm font-semibold">{item.label}</span>}
                  </button>
                ) : (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={closeSidebarOnMobile}
                    className={({ isActive }) =>
                      cn(
                        'oscar-sidebar-nav-item group relative flex items-center gap-2.5 overflow-hidden px-3 py-2.5 transition-all',
                        !isExpanded && 'justify-center',
                        isActive
                          ? 'is-active text-[var(--color-text)]'
                          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className={cn('oscar-sidebar-icon-bubble', isActive && 'is-active')}>
                          <item.icon className="h-4.5 w-4.5" />
                        </span>
                        {isExpanded && <span className="truncate text-sm font-semibold">{item.label}</span>}
                      </>
                    )}
                  </NavLink>
                )
              ))}
            </div>
          </div>

          <div className={cn('relative z-10 px-4 pb-5 pt-1', !isExpanded && 'px-3')}>
            <button
              type="button"
              onClick={handleLogoutClick}
              className={cn('oscar-sidebar-logout-pill w-full', !isExpanded && 'is-icon-only')}
              aria-label={dir === 'rtl' ? 'تسجيل الخروج' : 'Logout'}
            >
              <LogOut className="h-5 w-5" />
              {isExpanded && <span>{dir === 'rtl' ? 'تسجيل الخروج' : 'Logout'}</span>}
            </button>
          </div>
        </div>
      </motion.aside>
      <ConfirmDialog
        open={showLogoutConfirm}
        title={dir === 'rtl' ? 'تسجيل الخروج' : 'Logout'}
        description={dir === 'rtl' ? 'هل متأكد من تسجيل الخروج؟' : 'Are you sure you want to logout?'}
        confirmLabel={dir === 'rtl' ? 'نعم، تسجيل الخروج' : 'Yes, logout'}
        cancelLabel={dir === 'rtl' ? 'إلغاء' : 'Cancel'}
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  );
};

export default Sidebar;
