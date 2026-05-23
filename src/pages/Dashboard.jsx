import React, { useCallback, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Sparkles, Target } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useMediaStore from '../store/useMediaStore';
import useGroupStore from '../store/useGroupStore';
import HeroSlider from '../components/home/HeroSlider';
import CategoryCard from '../components/home/CategoryCard';
import ProductSearchBar from '../components/products/ProductSearchBar';
import slideOneHeroImage from '../assets/سلايد 1.jpg';
import slideTwoHeroImage from '../assets/سلايد 2.jpg';
import slideThreeHeroImage from '../assets/سلايد 3.jpg';
import {
  createStorefrontCategories,
  createStorefrontProducts,
  getStorefrontLanguage,
} from '../utils/storefront';

const Dashboard = () => {
  const { user, refreshProfile } = useAuthStore();
  const { categories, products, loadProducts } = useMediaStore();
  const groupsLastLoadedAt = useGroupStore((state) => state.groupsLastLoadedAt);
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const language = getStorefrontLanguage(i18n);
  const isTwoFactorEnabled = Boolean(user?.twoFactorEnabled ?? user?.isTwoFactorEnabled);
  const isCustomerUser = String(user?.role || '').trim().toLowerCase() === 'customer';

  useEffect(() => {
    if (refreshProfile) refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    loadProducts({ force: true });
  }, [loadProducts]);

  const heroSlides = useMemo(() => ([
    { id: 'landing-slide-1', image: slideOneHeroImage, title: '' },
    { id: 'landing-slide-2', image: slideTwoHeroImage, title: '' },
    { id: 'landing-slide-3', image: slideThreeHeroImage, title: '' },
  ]), []);

  const storefrontProducts = useMemo(
    () => createStorefrontProducts(products, {
      language,
      userGroup: user?.groupId || user?.group || 'Normal',
      userGroupPercentage: user?.groupPercentage ?? null,
    }),
    [groupsLastLoadedAt, language, products, user?.group, user?.groupId, user?.groupPercentage]
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
    <div className="space-y-5 pb-5 sm:space-y-6">
      {!isTwoFactorEnabled ? (
        <section className="mx-auto w-full max-w-xl rounded-xl border border-[color:rgb(var(--color-primary-rgb)/0.14)] bg-[color:rgb(var(--color-primary-rgb)/0.03)] px-3 py-2 text-[0.88rem] text-[var(--color-text)]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[1rem]">⚠️</span>
              <div className="text-[0.9rem] text-[var(--color-text-secondary)] min-w-0 whitespace-nowrap truncate">
                {language === 'ar' ? (
                  'حرصًا على أمان حسابك، فعّل المصادقة الثنائية.'
                ) : (
                  'For your account safety, enable two-factor authentication.'
                )}
              </div>
            </div>

            <div className="flex items-center flex-shrink-0">
              <Link to="/account-security" className="inline-flex items-center gap-1 rounded-md bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-soft)_48%,#f43fdd)] px-2 py-0.5 text-[0.78rem] font-semibold text-white shadow-sm">
                {language === 'ar' ? 'فعّل الآن' : 'Enable now'}
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <HeroSlider slides={heroSlides} />

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

    </div>
  );
};

export default Dashboard;
