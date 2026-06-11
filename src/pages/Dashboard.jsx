import React, { useCallback, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ShieldCheck, Sparkles, Target } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useMediaStore from '../store/useMediaStore';
import useGroupStore from '../store/useGroupStore';
import HeroSlider from '../components/home/HeroSlider';
import SoulChillBanner from '../components/home/SoulChillBanner';
import CategoryCard from '../components/home/CategoryCard';
import ProductSearchBar from '../components/products/ProductSearchBar';
import { homeHeroSlides } from '../data/homeHeroSlides';
import {
  createStorefrontCategories,
  createStorefrontProducts,
  getStorefrontLanguage,
} from '../utils/storefront';
import { isBackofficeRole } from '../utils/authRoles';

const Dashboard = () => {
  const { user, refreshProfile } = useAuthStore();
  const { categories, products, loadProducts } = useMediaStore();
  const groupsLastLoadedAt = useGroupStore((state) => state.groupsLastLoadedAt);
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const language = getStorefrontLanguage(i18n);
  const isTwoFactorEnabled = Boolean(user?.twoFactorEnabled ?? user?.isTwoFactorEnabled);
  const isCustomerUser = String(user?.role || '').trim().toLowerCase() === 'customer';
  const shouldUseLocalGroupPricing = isBackofficeRole(user?.role);

  useEffect(() => {
    if (refreshProfile) refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    loadProducts({ force: true });
  }, [loadProducts]);

  const storefrontProducts = useMemo(
    () => createStorefrontProducts(products, {
      language,
      userGroup: user?.groupId || user?.group || 'Normal',
      userGroupPercentage: user?.groupPercentage ?? null,
      preferLocalGroupPrice: shouldUseLocalGroupPricing,
    }),
    [groupsLastLoadedAt, language, products, shouldUseLocalGroupPricing, user?.group, user?.groupId, user?.groupPercentage]
  );

  const storefrontCategories = useMemo(
    () => createStorefrontCategories(categories, storefrontProducts, language),
    [categories, storefrontProducts, language]
  );

  const visibleHomepageCategories = useMemo(
    () => storefrontCategories.filter((category) => {
      if (category.id === 'all') return false;
      const p = category.parentCategory;
      if (!p) return true;
      if (typeof p === 'string' && !p.trim()) return true;
      return false;
    }),
    [storefrontCategories]
  );

  const appsCategoryId = useMemo(() => (
    visibleHomepageCategories.find((category) => category.tone === 'apps' || category.id === 'apps')?.id
    || storefrontCategories.find((category) => category.tone === 'apps' || category.id === 'apps')?.id
    || 'apps'
  ), [storefrontCategories, visibleHomepageCategories]);

  const handleCategorySelect = useCallback((categoryId) => {
    navigate(categoryId === 'all' ? '/products' : `/products?category=${encodeURIComponent(categoryId)}`);
  }, [navigate]);

  const handleProductSelect = useCallback((product) => {
    const next = new URLSearchParams();
    if (product?.category) next.set('category', product.category);
    next.set('request', product.id);
    navigate(`/products?${next.toString()}`);
  }, [navigate]);

  return (
    <div className="space-y-3 pb-5 sm:space-y-4">
      {!isTwoFactorEnabled ? (
        <section className="mx-auto w-full max-w-3xl overflow-hidden rounded-[0.95rem] border border-[color:rgb(var(--color-border-rgb)/0.56)] bg-[linear-gradient(180deg,rgb(var(--color-card-rgb)/0.68),rgb(var(--color-surface-rgb)/0.42))] px-2 py-1 text-[0.74rem] text-[var(--color-text)] shadow-[var(--shadow-subtle)] backdrop-blur-xl sm:rounded-[1.1rem] sm:px-2.5 sm:py-1.5">
          <div dir="ltr" className="grid min-h-7 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1.5 sm:gap-2.5">
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[0.65rem] bg-[linear-gradient(135deg,#5b21b6,#7c3aed_48%,#2f1fb4)] text-white shadow-[0_10px_22px_-16px_rgb(124_58_237/0.9)] sm:h-7 sm:w-7">
              <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>

            <p dir={language === 'ar' ? 'rtl' : 'ltr'} className="min-w-0 truncate text-center text-[0.64rem] font-semibold leading-4 text-[var(--color-text)] min-[380px]:text-[0.7rem] sm:text-[0.8rem]">
              {language === 'ar'
                ? 'حرصًا على أمان حسابك، فعّل المصادقة الثنائية الآن.'
                : 'For your account safety, enable two-factor authentication now.'}
            </p>

            <Link
              to="/account-security"
              className="inline-flex h-6 shrink-0 items-center justify-center gap-1 rounded-full bg-[linear-gradient(135deg,#f43fdd,#a855f7_48%,#6d28d9)] px-2 text-[0.62rem] font-black text-white shadow-[0_12px_24px_-18px_rgb(168_85_247/0.95)] transition-all hover:-translate-y-0.5 hover:brightness-105 sm:h-7 sm:px-3 sm:text-[0.7rem]"
            >
              <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              {language === 'ar' ? 'فعّل الآن' : 'Enable now'}
            </Link>
          </div>
        </section>
      ) : null}

      <HeroSlider slides={homeHeroSlides} />

      <section id="categories" className="scroll-mt-28 space-y-3 sm:space-y-3.5">
        <div className="relative z-10 mx-auto flex w-full max-w-5xl justify-center px-0.5 sm:px-2">
          <ProductSearchBar products={storefrontProducts} language={language} onSelectProduct={handleProductSelect} forceIconRight placeholder={language === 'ar' ? 'ابحث عن منتج...' : 'Search for a product...'} noResultsLabel={language === 'ar' ? 'لا يوجد منتج مطابق' : 'No matching product found'} className="mx-auto w-full" inputClassName="h-12 rounded-full" />
        </div>

        <div className="relative z-0 grid grid-cols-2 gap-2 sm:gap-2.5 md:grid-cols-3 xl:grid-cols-4">
          {visibleHomepageCategories.map((category, index) => (
            <CategoryCard key={category.id} category={category} active={false} index={index} onSelect={handleCategorySelect} />
          ))}
        </div>

      </section>

      {isCustomerUser ? (
        <div className="mx-auto w-full max-w-5xl px-0.5 sm:px-2">
          <Link
            to="/buy-target"
            className="group mx-auto flex w-full items-center gap-2.5 rounded-[1rem] border border-[color:rgb(var(--color-primary-rgb)/0.18)] bg-[color:rgb(var(--color-primary-rgb)/0.06)] px-3 py-2.5 text-start transition-all hover:border-[color:rgb(var(--color-primary-rgb)/0.3)] hover:bg-[color:rgb(var(--color-primary-rgb)/0.09)]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] bg-[color:rgb(var(--color-primary-rgb)/0.12)] text-[var(--color-primary)]">
              <Target className="h-5 w-5" />
            </span>

            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1 text-[0.65rem] font-black uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
                <Sparkles className="h-3.5 w-3.5" />
                OSCAR Target
              </span>
              <span className="mt-0.5 block text-sm font-semibold leading-5 text-[var(--color-text)]">
                {language === 'ar' ? 'بيع تارجت من حسابك' : 'Sell Target from your account'}
              </span>
            </span>

            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[color:rgb(var(--color-primary-rgb)/0.18)] px-2.5 py-1 text-[0.7rem] font-bold text-[var(--color-text-secondary)]">
              {language === 'ar' ? 'تفاصيل' : 'Details'}
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            </span>
          </Link>
        </div>
      ) : null}

      <SoulChillBanner to={`/products?category=${encodeURIComponent(appsCategoryId)}`} />

    </div>
  );
};

export default Dashboard;
