import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Building2,
  BadgeCheck,
  ChevronDown,
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
  Share2,
  ShieldCheck,
  ShoppingBag,
  Target,
  User,
  UserCog,
  UserRoundPlus,
  Users,
  Wallet,
  X
} from 'lucide-react';
import ConfirmDialog from '../account/ConfirmDialog';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/useAuthStore';
import useNotificationStore from '../../store/useNotificationStore';
import { cn } from '../ui/Button';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../ui/LanguageSwitcher';
import WalletSidebarCard from './WalletSidebarCard';
import HeaderBrand from './HeaderBrand';
import { SUPERVISOR_ROLES, getDefaultRouteForRole, hasRequiredRole } from '../../utils/authRoles';
import { PERMISSIONS, hasPermission } from '../../utils/permissions';
import { resolveUserAvatar } from '../../utils/avatar';
import { REFERRALS_ENABLED } from '../../config/featureFlags';

const ADMIN_NAV_ROLES = ['admin', 'super_admin', ...SUPERVISOR_ROLES];

const getSidebarSectionKey = (item = {}) => (
  String(item?.path || '').startsWith('/admin') ? 'management' : 'account'
);

const isRouteActive = (pathname = '', path = '') => (
  Boolean(path) && (pathname === path || pathname.startsWith(`${path}/`))
);

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
  const [openNavSections, setOpenNavSections] = useState({
    account: true,
    management: false,
  });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [copiedUserId, setCopiedUserId] = useState(false);
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { dir } = useLanguage();
  const { t } = useTranslation();

  const isPinnedExpanded = isOpen;
  const isPreviewMode = !isMobile && !isOpen && isPreviewExpanded;
  const isExpanded = isPinnedExpanded || isPreviewMode;
  const showExpandedContent = isPinnedExpanded;
  const userId = String(user?.id || user?._id || user?.userId || '').trim();
  const sidebarWidth = isMobile ? 'min(72vw, 270px)' : isExpanded ? '270px' : '74px';
  const sidebarTransform = isMobile && !isOpen
    ? `translate3d(${dir === 'rtl' ? 'calc(100% + 2rem)' : 'calc(-100% - 2rem)'}, 0, 0)`
    : 'translate3d(0, 0, 0)';

  useEffect(() => {
    if (isOpen || isMobile) {
      setIsPreviewExpanded(false);
    }
  }, [isMobile, isOpen]);

  useEffect(() => {
    if (!copiedUserId) return undefined;
    const timer = window.setTimeout(() => setCopiedUserId(false), 1400);
    return () => window.clearTimeout(timer);
  }, [copiedUserId]);

  const closeSidebarOnMobile = useCallback(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [isMobile, setIsOpen]);

  const handleLogout = useCallback(() => {
    closeSidebarOnMobile();
    logout();
    navigate('/auth');
  }, [closeSidebarOnMobile, logout, navigate]);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = useCallback(async () => {
    setShowLogoutConfirm(false);
    await handleLogout();
  }, [handleLogout]);

  const handleOpenMyAccount = useCallback(() => {
    closeSidebarOnMobile();
    navigate('/account');
  }, [closeSidebarOnMobile, navigate]);

  const handleCopyUserId = async () => {
    if (!userId) return;

    if (await copyToClipboard(userId)) {
      setCopiedUserId(true);
      return;
    }

    setCopiedUserId(false);
  };

  const handleContactClick = useCallback(() => {
    navigate('/contact-us');
    closeSidebarOnMobile();
  }, [closeSidebarOnMobile, navigate]);

  const handlePreviewEnter = useCallback(() => {
    if (!isMobile && !isOpen) {
      setIsPreviewExpanded(true);
    }
  }, [isMobile, isOpen]);

  const handlePreviewLeave = useCallback(() => {
    if (!isMobile) {
      setIsPreviewExpanded(false);
    }
  }, [isMobile]);

  const toggleNavSection = useCallback((sectionKey) => {
    if (sectionKey === 'account') return;

    setOpenNavSections((current) => ({
      ...current,
      [sectionKey]: !current[sectionKey],
    }));
  }, []);

  const navItems = useMemo(() => [
    {
      icon: Home,
      label: t('header.home', { defaultValue: dir === 'rtl' ? 'الرئيسية' : 'Home' }),
      path: '/dashboard',
      roles: ['customer', 'admin', ...SUPERVISOR_ROLES]
    },
    {
      icon: LayoutDashboard,
      label: t('sidebar.adminDashboard', { defaultValue: dir === 'rtl' ? 'لوحة تحكم الأدمن' : 'Admin Dashboard' }),
      path: '/admin/dashboard',
      roles: ['admin', 'super_admin'],
    },
    {
      icon: Wallet,
      label: t('sidebar.adminWallet', { defaultValue: dir === 'rtl' ? 'محفظة الأدمن' : 'Admin Wallet' }),
      path: '/admin/wallet',
      roles: ADMIN_NAV_ROLES,
      permission: PERMISSIONS.ADMIN_WALLET,
    },
    { icon: User, label: t('sidebar.myAccount', { defaultValue: dir === 'rtl' ? 'حسابي' : 'My Account' }), path: '/account', roles: ['admin', 'customer', ...SUPERVISOR_ROLES] },
    { icon: ShieldCheck, label: t('sidebar.accountProtection', { defaultValue: dir === 'rtl' ? 'حماية الحساب' : 'Account Security' }), path: '/account-security', roles: ['admin', 'customer', ...SUPERVISOR_ROLES] },
    { icon: UserRoundPlus, label: dir === 'rtl' ? 'الوكيل الفرعي والإحالة' : 'Sub-agent & Referral', path: '/referral', roles: ['customer'], enabled: REFERRALS_ENABLED },
    { icon: Wallet, label: t('sidebar.wallet'), path: '/wallet', roles: ['customer'] },
    {
      icon: ShoppingBag,
      label: t('sidebar.myOrders', { defaultValue: dir === 'rtl' ? 'طلباتي' : 'My Orders' }),
      path: '/orders',
      roles: ['customer', 'admin']
    },
    { icon: Target, label: 'بيع التارجت', path: '/buy-target', roles: ['customer'] },
    { icon: Users, label: t('sidebar.users'), path: '/admin/users', roles: ADMIN_NAV_ROLES, permission: PERMISSIONS.ADMIN_USERS },
    { icon: UserRoundPlus, label: dir === 'rtl' ? 'الوكلاء الفرعيون' : 'Sub-agents', path: '/admin/referrals', roles: ADMIN_NAV_ROLES, enabled: REFERRALS_ENABLED },
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
  ], [dir, handleContactClick, t]);

  const filteredNavItems = useMemo(() => navItems.filter((item) => (
    item.enabled !== false
    && hasRequiredRole(user?.role || 'customer', item.roles)
    && hasPermission(user, item.permission)
  )), [navItems, user]);
  const navSections = useMemo(() => {
    const sections = [
      {
        key: 'account',
        label: t('sidebar.accountSection', { defaultValue: dir === 'rtl' ? 'الحساب' : 'Account' }),
        icon: User,
        items: [],
      },
      {
        key: 'management',
        label: t('sidebar.managementSection', { defaultValue: dir === 'rtl' ? 'الإدارة' : 'Management' }),
        icon: MonitorCog,
        items: [],
      },
    ];
    const sectionMap = new Map(sections.map((section) => [section.key, section]));

    filteredNavItems.forEach((item) => {
      const sectionKey = getSidebarSectionKey(item);
      const targetSection = sectionMap.get(sectionKey) || sectionMap.get('account');
      targetSection.items.push(item);
    });

    return sections.filter((section) => section.items.length > 0);
  }, [dir, filteredNavItems, t]);
  const showWalletCard = String(user?.role || '').toLowerCase() === 'customer' && showExpandedContent;
  const isAdmin = String(user?.role || '').toLowerCase() === 'admin';
  const addNotification = useNotificationStore((state) => state.addNotification);
  const [isSubAgent, setIsSubAgent] = useState(false);
  useEffect(() => {
    const refreshSubAgentStatus = () => {
      try {
        const requests = JSON.parse(window.localStorage.getItem('oscar_sub_agent_requests')) || [];
        const approved = requests.some((request) => String(request.email || '').toLowerCase() === String(user?.email || '').toLowerCase() && request.status === 'approved');
        setIsSubAgent(approved);
        if (approved && String(user?.role || '').toLowerCase() === 'customer' && user?.email) {
          const notificationKey = `kanz_coins_sub_agent_congratulated_v2_${String(user.email).toLowerCase()}`;
          if (!window.localStorage.getItem(notificationKey)) {
            addNotification({
              title: dir === 'rtl' ? 'مبروك، أصبحت وكيلًا فرعيًا' : 'Congratulations, you are now a sub-agent',
              message: dir === 'rtl' ? 'تم قبول طلبك وتوثيق حسابك كوكيل فرعي في Kanz Coins.' : 'Your request was approved and your Kanz Coins sub-agent account is now verified.',
              type: 'success',
              targetUrl: '/referral',
              sectionName: dir === 'rtl' ? 'الوكيل الفرعي' : 'Sub-agent',
            });
            window.localStorage.setItem(notificationKey, '1');
          }
        }
      } catch { setIsSubAgent(false); }
    };
    refreshSubAgentStatus();
    window.addEventListener('storage', refreshSubAgentStatus);
    window.addEventListener('sub-agent-status-updated', refreshSubAgentStatus);
    return () => {
      window.removeEventListener('storage', refreshSubAgentStatus);
      window.removeEventListener('sub-agent-status-updated', refreshSubAgentStatus);
    };
  }, [addNotification, dir, user?.email, user?.role]);
  const userDisplayName = user?.name || user?.email || (dir === 'rtl' ? 'حسابي' : 'My Account');
  const userAvatar = resolveUserAvatar(user, userDisplayName);
  const userRoleLabel = isAdmin
    ? (dir === 'rtl' ? 'مدير المنصة' : 'Platform Admin')
    : isSubAgent
      ? (dir === 'rtl' ? 'وكيل فرعي' : 'Sub-agent')
      : (dir === 'rtl' ? 'عضو المتجر' : 'Store Member');

  const renderNavItem = (item) => (
    item.isExternal ? (
      <button
        key={item.path}
        type="button"
        onClick={item.onClick}
        className={cn(
          'oscar-sidebar-nav-item group relative flex w-full items-center gap-2.5 overflow-hidden px-2.5 py-2 text-[var(--color-text-secondary)] transition-all',
          !isExpanded && 'justify-center'
        )}
      >
        <span className="oscar-sidebar-icon-bubble">
          <item.icon className="h-4 w-4" />
        </span>
        {isExpanded && <span className="truncate text-sm font-black">{item.label}</span>}
      </button>
    ) : (
      <NavLink
        key={item.path}
        to={item.path}
        onClick={closeSidebarOnMobile}
        className={({ isActive }) =>
          cn(
            'oscar-sidebar-nav-item group relative flex items-center gap-2.5 overflow-hidden px-2.5 py-2 transition-all',
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
              <item.icon className="h-4 w-4" />
            </span>
            {isExpanded && <span className="truncate text-sm font-black">{item.label}</span>}
          </>
        )}
      </NavLink>
    )
  );

  return (
    <>
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-[80] bg-black/72 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        aria-hidden={isMobile && !isOpen ? 'true' : undefined}
        data-expanded={isExpanded ? 'true' : 'false'}
        data-preview={isPreviewMode ? 'true' : 'false'}
        style={{
          width: sidebarWidth,
          transform: sidebarTransform,
          contain: 'layout paint style',
        }}
        onMouseEnter={handlePreviewEnter}
        onMouseLeave={handlePreviewLeave}
        className={cn(
          'oscar-sidebar-shell fixed top-4 z-[90] h-[calc(100vh-4rem)] overflow-hidden transition-[transform,width] duration-300 ease-out',
          dir === 'rtl' ? 'right-4' : 'left-4',
          isMobile && !isOpen && 'pointer-events-none'
        )}
      >
        <div className={cn(
          'app-shell-sidebar-panel oscar-sidebar-panel relative flex h-full flex-col rounded-[32px] border',
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
                    'transition-transform sidebar-main-brand',
                    isExpanded
                      ? 'scale-[1.1]'
                      : 'max-w-10 scale-[0.7] justify-center overflow-hidden [&>span:first-child]:hidden'
                  )}
                  iconClassName={isExpanded ? 'scale-[1.12]' : 'scale-[0.86]'}
                  textClassName="shrink-0"
                />
              </button>

              {!isMobile && (
                <button
                  type="button"
                  onClick={() => setIsOpen((current) => !current)}
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

              {isMobile && (
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'oscar-sidebar-collapse absolute top-1 inline-flex h-9 w-9 items-center justify-center rounded-full transition-all',
                    dir === 'rtl' ? 'left-0' : 'right-0'
                  )}
                  aria-label={dir === 'rtl' ? 'إغلاق القائمة' : 'Close sidebar'}
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              )}
            </div>

            {showExpandedContent && (
              <>
                <div className="mt-4">
                  <LanguageSwitcher showIcon variant="sidebar" className="oscar-sidebar-language w-full justify-center" />
                </div>

                <div className="oscar-sidebar-user-card mt-3">
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

                  <div className="flex items-center gap-2.5">
                    <div className="oscar-sidebar-avatar-wrap flex shrink-0 flex-col items-center gap-1">
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
                      <span className="oscar-sidebar-online-dot" aria-hidden="true" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-black leading-tight text-[var(--color-text)]">{userDisplayName}</div>
                      <div className="mt-1 flex items-center gap-1 text-xs font-black text-[var(--color-primary-hover)]">
                        <span className="truncate">{userRoleLabel}</span>
                        {isSubAgent ? <BadgeCheck className="h-4 w-4 shrink-0 fill-emerald-500 text-white drop-shadow-[0_2px_5px_rgb(16_185_129/0.45)]" aria-label={dir === 'rtl' ? 'حساب وكيل فرعي موثق' : 'Verified sub-agent'} /> : null}
                      </div>
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

          <div className="relative z-10 flex-1 overflow-y-auto px-2.5 py-2.5 scrollbar-hide">
            {showWalletCard && (
              <WalletSidebarCard
                className="mb-4"
                isVisible={showWalletCard}
                onNavigate={closeSidebarOnMobile}
              />
            )}

            <div className="space-y-2">
              {isExpanded ? (
                navSections.map((section) => {
                  const SectionIcon = section.icon;
                  const isFixedOpen = section.key === 'account' || section.key === 'management';
                  const isSectionOpen = isFixedOpen || Boolean(openNavSections[section.key]);
                  const isSectionActive = section.items.some((item) => isRouteActive(location.pathname, item.path));

                  return (
                    <section key={section.key} className="space-y-1.5">
                      <button
                        type="button"
                        onClick={isFixedOpen ? undefined : () => toggleNavSection(section.key)}
                        aria-expanded={isSectionOpen}
                        className={cn(
                          'flex h-10 w-full items-center gap-2 rounded-xl border px-2.5 text-start text-[11px] font-black transition-all',
                          isFixedOpen && 'cursor-default',
                          isSectionActive
                            ? 'border-[color:rgb(var(--color-primary-rgb)/0.32)] bg-[color:rgb(var(--color-primary-rgb)/0.1)] text-[var(--color-primary)]'
                            : 'border-[color:rgb(var(--color-border-rgb)/0.5)] bg-[color:rgb(var(--color-surface-rgb)/0.34)] text-[var(--color-text-secondary)] hover:border-[color:rgb(var(--color-primary-rgb)/0.24)] hover:text-[var(--color-text)]'
                        )}
                      >
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-[color:rgb(var(--color-primary-rgb)/0.2)] bg-[color:rgb(var(--color-primary-rgb)/0.08)] text-[var(--color-primary)]">
                          <SectionIcon className="h-3.5 w-3.5" />
                        </span>
                        <span className="min-w-0 flex-1 truncate">{section.label}</span>
                        <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full border border-[color:rgb(var(--color-border-rgb)/0.48)] bg-[color:rgb(var(--color-card-rgb)/0.48)] px-1 text-[10px]">
                          {section.items.length}
                        </span>
                        {!isFixedOpen ? (
                          <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 transition-transform', isSectionOpen && 'rotate-180')} />
                        ) : null}
                      </button>

                      {isSectionOpen ? (
                        <div className="space-y-1.5 ps-2">
                          {section.items.map(renderNavItem)}
                        </div>
                      ) : null}
                    </section>
                  );
                })
              ) : (
                filteredNavItems.map(renderNavItem)
              )}
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
      </aside>
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

export default React.memo(Sidebar);
