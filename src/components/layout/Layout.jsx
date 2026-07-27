import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, ClipboardList } from 'lucide-react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import AmbientBackground from './AmbientBackground';
import { useLanguage } from '../../context/LanguageContext';
import BackToTopButton from '../ui/BackToTopButton';
import { registerVisitedPath } from '../../utils/navigation';
import oscarLogo from '../../assets/ms-removebg-preview.webp';

const SiteCopyrightFooter = ({ isArabic }) => (
  <footer className="site-copyright-footer mx-auto mt-auto w-full max-w-[var(--shell-max-width)] px-3 pb-4 sm:px-4 md:px-6 lg:px-8">
    <div className="relative overflow-hidden rounded-2xl border border-[color:rgb(var(--color-border-rgb)/0.72)] bg-[linear-gradient(135deg,rgb(var(--color-card-rgb)/0.9),rgb(var(--color-elevated-rgb)/0.64))] px-3 py-3 text-center shadow-[0_12px_34px_-28px_rgba(79,70,229,0.5)] backdrop-blur-xl dark:border-[#8b5cf6]/24 dark:bg-[linear-gradient(135deg,rgba(11,18,42,0.78),rgba(82,39,180,0.16),rgba(6,182,212,0.1))]">
      <div className="pointer-events-none absolute -left-8 -top-16 h-24 w-24 rounded-full bg-cyan-400/12 blur-2xl" />
      <div className="pointer-events-none absolute -right-8 bottom-0 h-20 w-20 rounded-full bg-fuchsia-500/10 blur-2xl" />
      <div className="relative flex flex-col items-center justify-center gap-2 sm:flex-row sm:text-start">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-400/22 bg-white/62 shadow-[0_8px_24px_-18px_rgba(34,211,238,0.72)] dark:bg-black/20">
          <img src={oscarLogo} alt="OSCAR STORE" loading="lazy" decoding="async" className="h-7 w-7 object-contain" />
        </span>

        <div className="min-w-0 space-y-0.5">
          <p className="text-xs font-black tracking-[0.14em] text-[var(--color-text)] dark:text-white">
            OSCAR <span className="bg-[linear-gradient(90deg,#22d3ee,#a855f7,#f43fdd)] bg-clip-text text-transparent">STORE</span>
          </p>
          <p className="text-[11px] font-semibold leading-4 text-[var(--color-text-secondary)] sm:text-xs dark:text-cyan-50/78">
            {isArabic
              ? 'منصتك الآمنة لشحن الألعاب والتطبيقات والخدمات الرقمية.'
              : 'Your secure platform for games, apps, and digital services.'}
          </p>
          <p className="text-[10px] font-medium text-[var(--color-muted)]">
            © 2026 Oscar Store
          </p>
        </div>
      </div>
    </div>
  </footer>
);

const Layout = ({ children = null }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const { dir, language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1023px)');
    const handleViewportChange = (event = mediaQuery) => {
      const mobile = event.matches;
      setIsMobile((current) => (current === mobile ? current : mobile));
      setIsSidebarOpen((current) => (current === !mobile ? current : !mobile));
    };

    handleViewportChange(mediaQuery);
    mediaQuery.addEventListener('change', handleViewportChange);
    return () => mediaQuery.removeEventListener('change', handleViewportChange);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  useEffect(() => {
    registerVisitedPath(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    document.body.dataset.sidebarOpen = String(isSidebarOpen);
    return () => {
      delete document.body.dataset.sidebarOpen;
    };
  }, [isSidebarOpen]);

  const isHomePage = [
    '/dashboard',
    '/admin/dashboard',
  ].includes(location.pathname);
  const isAdminPage = location.pathname.startsWith('/admin');
  const isCustomerDashboard = location.pathname === '/dashboard';
  const isBuyTargetPage = location.pathname === '/buy-target';
  const isWalletTopupPage = (
    location.pathname === '/wallet/add-balance'
    || location.pathname.startsWith('/wallet/payment-details/')
  );
  const shellOffset = !isMobile ? (isSidebarOpen ? '302px' : '100px') : '0';

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className={`relative min-h-screen overflow-x-clip bg-transparent text-[var(--color-text)] ${isAdminPage ? 'layout-admin-light' : ''}`}>
      <AmbientBackground />
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        isMobile={isMobile}
      />

      <div
        className="flex min-h-screen min-w-0 max-w-full flex-col transition-all duration-300"
        style={{ [dir === 'rtl' ? 'marginRight' : 'marginLeft']: shellOffset }}
      >
        <div
          className="fixed z-40 max-w-full transition-all duration-300"
          style={{
            top: isMobile ? 'max(0.75rem, env(safe-area-inset-top))' : '1rem',
            [dir === 'rtl' ? 'right' : 'left']: isMobile ? '12px' : shellOffset,
            [dir === 'rtl' ? 'left' : 'right']: isMobile ? '12px' : '16px',
          }}
        >
          <Header toggleSidebar={() => setIsSidebarOpen((current) => !current)} />
        </div>
        <div className="h-[4.9rem] sm:h-[6.5rem]" aria-hidden="true" />

        {!isHomePage && (
          <div className="mt-4 w-full px-4 md:px-6 lg:px-8">
            <div className="relative flex min-h-11 items-center">
              <button
                type="button"
                onClick={handleGoBack}
                className="layout-back-icon-button absolute right-0 top-0"
                aria-label={dir === 'rtl' ? 'رجوع' : 'Back'}
                title={dir === 'rtl' ? 'رجوع' : 'Back'}
              >
                {dir === 'rtl' ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
              </button>

              {isBuyTargetPage || isWalletTopupPage ? (
                <button
                  type="button"
                  onClick={() => navigate(isBuyTargetPage ? '/target-orders' : '/wallet/topup-history')}
                  className="absolute left-0 top-0 inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[color:rgb(var(--color-primary-rgb)/0.26)] bg-[color:rgb(var(--color-primary-rgb)/0.1)] px-3 text-sm font-semibold text-[var(--color-primary)] shadow-[var(--shadow-subtle)] backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-[color:rgb(var(--color-primary-rgb)/0.42)] hover:bg-[color:rgb(var(--color-primary-rgb)/0.14)]"
                  aria-label={dir === 'rtl' ? 'سجل الطلبات' : 'Order history'}
                  title={dir === 'rtl' ? 'سجل الطلبات' : 'Order history'}
                >
                  <ClipboardList className="h-4 w-4" />
                  <span className="hidden sm:inline">{dir === 'rtl' ? 'سجل الطلبات' : 'Order history'}</span>
                </button>
              ) : null}
            </div>
          </div>
        )}

        <main className={`min-w-0 flex-1 overflow-x-hidden px-3 py-5 sm:px-4 md:px-6 md:py-6 lg:px-8 lg:py-8 ${isHomePage ? 'scrollbar-hide' : ''} ${isCustomerDashboard ? '!pt-0 sm:!pt-0 md:!pt-0 lg:!pt-0' : ''}`}>
          <div className="mx-auto w-full min-w-0 max-w-[var(--shell-max-width)] animate-[page-fade-in_0.35s_ease-out]">
            {children || <Outlet />}
          </div>
        </main>
        <SiteCopyrightFooter isArabic={language === 'ar' || dir === 'rtl'} />
      </div>
      <BackToTopButton />
    </div>
  );
};

export default Layout;
