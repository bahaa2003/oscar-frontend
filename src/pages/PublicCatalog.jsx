import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  LogIn,
  ChevronRight,
  Layers3,
  Search,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/useAuthStore';
import useMediaStore from '../store/useMediaStore';
import apiClient from '../services/client';
import ThemeToggle from '../components/ui/ThemeToggle';
import HeaderBrand from '../components/layout/HeaderBrand';
import PublicSidebar from '../components/layout/PublicSidebar';
import HeroSlider from '../components/home/HeroSlider';
import SoulChillBanner from '../components/home/SoulChillBanner';
import CategoryCard from '../components/home/CategoryCard';
import ProductSearchBar from '../components/products/ProductSearchBar';
import ProductCardSimple from '../components/products/ProductCardSimple';
import LoadingSkeleton from '../components/products/LoadingSkeleton';
import EmptyState from '../components/products/EmptyState';
import { getDefaultRouteForRole } from '../utils/authRoles';
import {
  createStorefrontCategories,
  createStorefrontProducts,
  getStorefrontLanguage,
} from '../utils/storefront';
import { homeHeroSlides } from '../data/homeHeroSlides';

const dataProvider = (import.meta.env.VITE_DATA_PROVIDER || 'mock').toLowerCase();
const isRealProvider = dataProvider === 'real';
const SERVICE_NOTICE_SEEN_KEY = 'oscar-store-service-notice-seen-v1';

const hasSeenServiceNotice = () => {
  if (typeof window === 'undefined') return false;

  try {
    return window.localStorage.getItem(SERVICE_NOTICE_SEEN_KEY) === '1';
  } catch {
    return false;
  }
};

const markServiceNoticeAsSeen = () => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(SERVICE_NOTICE_SEEN_KEY, '1');
  } catch {
    // Keep the notice usable when browser storage is unavailable.
  }
};

const normalizeCategoryKey = (value) => String(value || '').trim().toLowerCase();

const addCategoryAlias = (set, value) => {
  const normalized = normalizeCategoryKey(value);
  if (normalized) {
    set.add(normalized);
  }
};

const getProductCategoryKeys = (product) => {
  const keys = new Set();
  const category = product?.category;

  if (category && typeof category === 'object' && !Array.isArray(category)) {
    addCategoryAlias(keys, category._id);
    addCategoryAlias(keys, category.id);
    addCategoryAlias(keys, category.name);
    addCategoryAlias(keys, category.nameAr);
    addCategoryAlias(keys, category.title);
    addCategoryAlias(keys, category.titleAr);
    addCategoryAlias(keys, category.slug);
  } else {
    addCategoryAlias(keys, category);
  }

  addCategoryAlias(keys, product?.categoryId);
  addCategoryAlias(keys, product?.categoryName);
  addCategoryAlias(keys, product?.categoryNameAr);
  addCategoryAlias(keys, product?.categoryTitle);
  addCategoryAlias(keys, product?.categoryTitleAr);
  addCategoryAlias(keys, product?.categoryLabel);
  addCategoryAlias(keys, product?.categoryLabelAr);

  return keys;
};

const NeonShineButton = ({ children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group relative inline-flex h-11 w-full items-center justify-center overflow-hidden rounded-full border border-[#22d3ee]/75 bg-[linear-gradient(180deg,#7df9ff_0%,#22d3ee_48%,#7c3aed_100%)] px-4 text-sm font-extrabold text-white shadow-[0_18px_34px_-20px_rgba(34,211,238,0.95)] transition-all hover:-translate-y-0.5"
  >
    <span className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.65),transparent_42%)] opacity-85" />
    <span className="absolute left-[-45%] top-[-18%] h-[140%] w-[30%] rotate-[16deg] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.22),rgba(255,255,255,0.95),rgba(255,255,255,0.22),transparent)] blur-[1px] mix-blend-screen animate-[neon-shine_2.8s_ease-in-out_infinite]" />
    <span className="relative z-10 flex items-center gap-2">
      <LogIn className="h-4 w-4" />
      {children}
    </span>
  </button>
);

const PublicCatalog = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userRole = useAuthStore((state) => state.user?.role);
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const { categories, products, isLoading, loadProducts } = useMediaStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showServiceNotice, setShowServiceNotice] = useState(() => !hasSeenServiceNotice());
  const [currentParentId, setCurrentParentId] = useState(null);
  const [publicCatalog, setPublicCatalog] = useState({ categories: null, products: null });
  const [isPublicCatalogLoading, setIsPublicCatalogLoading] = useState(isRealProvider);

  const language = getStorefrontLanguage(i18n);
  const isArabic = language === 'ar';
  const copy = useMemo(
    () => (
      isArabic
        ? {
            searchPlaceholder: 'ابحث عن منتج...',
            noResults: 'لا يوجد منتج مطابق',
            home: 'الرئيسية',
            emptyCatalogsTitle: 'لا توجد كاتلوجات جاهزة للعرض',
            emptyCatalogsDescription: 'عندما تتوفر أقسام مرتبطة بمنتجات ظاهرة في المتجر ستظهر هنا تلقائيًا.',
            emptyCategoryTitle: 'لا يوجد بها عناصر',
            emptyCategoryDescription: 'هذا القسم فارغ حاليًا، ويمكنك العودة لاختيار قسم آخر.',
            backToCatalogs: 'العودة إلى الأقسام',
            unavailable: 'غير متاح',
            loginToBuy: 'شراء الآن',
          }
        : {
            searchPlaceholder: 'Search for a product...',
            noResults: 'No matching product found',
            home: 'Home',
            emptyCatalogsTitle: 'No catalogs are ready to display',
            emptyCatalogsDescription: 'Collections linked to visible storefront products will appear here automatically.',
            emptyCategoryTitle: 'There are no items in this category',
            emptyCategoryDescription: 'This category is currently empty, and you can return to choose another one.',
            backToCatalogs: 'Back to categories',
            unavailable: 'Unavailable',
            loginToBuy: 'Buy now',
          }
    ),
    [isArabic]
  );

  useEffect(() => {
    if (isAuthenticated) {
      navigate(getDefaultRouteForRole(userRole), { replace: true });
    }
  }, [isAuthenticated, navigate, userRole]);

  useEffect(() => {
    if (isRealProvider) return;
    loadProducts({ force: false });
  }, [loadProducts]);

  useEffect(() => {
    if (!isRealProvider) {
      setIsPublicCatalogLoading(false);
      return undefined;
    }

    let isMounted = true;
    setIsPublicCatalogLoading(true);

    Promise.resolve(apiClient.publicCatalog.fetch())
      .then((catalog) => {
        if (!isMounted || !catalog) return;

        const nextCategories = Array.isArray(catalog.categories) ? catalog.categories : null;
        const nextProducts = Array.isArray(catalog.products) ? catalog.products : null;

        if (nextCategories || nextProducts) {
          setPublicCatalog({
            categories: nextCategories,
            products: nextProducts,
          });
        }
      })
      .catch(() => {
        if (isMounted) {
          setPublicCatalog({ categories: null, products: null });
        }
        return loadProducts({ force: true });
      })
      .finally(() => {
        if (isMounted) {
          setIsPublicCatalogLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [loadProducts]);

  const handleCloseServiceNotice = useCallback(() => {
    markServiceNoticeAsSeen();
    setShowServiceNotice(false);
  }, []);

  useEffect(() => {
    if (showServiceNotice) {
      markServiceNoticeAsSeen();
    }
  }, [showServiceNotice]);

  const catalogProducts = publicCatalog.products?.length ? publicCatalog.products : products;
  const catalogCategories = publicCatalog.categories?.length ? publicCatalog.categories : categories;

  const storefrontProducts = useMemo(
    () => createStorefrontProducts(catalogProducts, {
      language,
      userGroup: 'Normal',
      userGroupPercentage: null,
    }),
    [catalogProducts, language]
  );

  const storefrontCategories = useMemo(
    () => createStorefrontCategories(catalogCategories, storefrontProducts, language)
      .filter((category) => category.id !== 'all'),
    [catalogCategories, storefrontProducts, language]
  );

  const sourceCategoriesById = useMemo(() => {
    const map = new Map();

    (Array.isArray(catalogCategories) ? catalogCategories : []).forEach((category) => {
      const id = String(category?.id || category?._id || '').trim();
      if (id) {
        map.set(id, category);
      }
    });

    return map;
  }, [catalogCategories]);

  const categoryAliasesById = useMemo(() => {
    const map = new Map();

    storefrontCategories.forEach((category) => {
      const aliases = new Set();
      const sourceCategory = sourceCategoriesById.get(category.id) || {};

      addCategoryAlias(aliases, category.id);
      addCategoryAlias(aliases, category.title);
      addCategoryAlias(aliases, sourceCategory.id);
      addCategoryAlias(aliases, sourceCategory._id);
      addCategoryAlias(aliases, sourceCategory.name);
      addCategoryAlias(aliases, sourceCategory.nameAr);
      addCategoryAlias(aliases, sourceCategory.title);
      addCategoryAlias(aliases, sourceCategory.titleAr);
      addCategoryAlias(aliases, sourceCategory.slug);

      map.set(category.id, aliases);
    });

    return map;
  }, [sourceCategoriesById, storefrontCategories]);

  const getParentId = useCallback((category) => {
    if (!category || !category.parentCategory) return null;

    const parent = category.parentCategory;
    if (typeof parent === 'object') return parent._id || parent.id || String(parent) || null;
    if (typeof parent === 'string') {
      const trimmed = parent.trim();
      return trimmed || null;
    }

    return String(parent) || null;
  }, []);

  const childrenMap = useMemo(() => {
    const map = new Map();

    for (const category of storefrontCategories) {
      const parentId = getParentId(category);
      if (!map.has(parentId)) {
        map.set(parentId, []);
      }
      map.get(parentId).push(category);
    }

    return map;
  }, [getParentId, storefrontCategories]);

  const currentCategories = useMemo(
    () => storefrontCategories.filter((category) => {
      const parentId = getParentId(category);
      if (currentParentId === null) return parentId === null;
      return String(parentId || '').trim() === String(currentParentId || '').trim();
    }),
    [currentParentId, getParentId, storefrontCategories]
  );

  const breadcrumbTrail = useMemo(() => {
    if (!currentParentId) return [];

    const categoriesById = new Map(storefrontCategories.map((category) => [category.id, category]));
    const trail = [];
    let categoryId = currentParentId;

    while (categoryId) {
      const category = categoriesById.get(categoryId);
      if (!category) break;
      trail.unshift(category);
      categoryId = getParentId(category);
    }

    return trail;
  }, [currentParentId, getParentId, storefrontCategories]);

  const currentCategoryIds = useMemo(() => {
    if (!currentParentId) return [];

    const ids = [];
    const seen = new Set();
    const queue = [currentParentId];

    while (queue.length > 0) {
      const categoryId = queue.shift();
      if (!categoryId || seen.has(categoryId)) continue;

      seen.add(categoryId);
      ids.push(categoryId);

      (childrenMap.get(categoryId) || []).forEach((child) => {
        if (child?.id && !seen.has(child.id)) {
          queue.push(child.id);
        }
      });
    }

    return ids;
  }, [childrenMap, currentParentId]);

  const currentCategoryProductKeys = useMemo(() => {
    const keys = new Set();

    currentCategoryIds.forEach((categoryId) => {
      const aliases = categoryAliasesById.get(categoryId);
      if (aliases) {
        aliases.forEach((alias) => keys.add(alias));
      } else {
        addCategoryAlias(keys, categoryId);
      }
    });

    return keys;
  }, [categoryAliasesById, currentCategoryIds]);

  const currentProducts = useMemo(
    () => (
      currentParentId
        ? storefrontProducts.filter((product) => {
          const productCategoryKeys = getProductCategoryKeys(product);
          return Array.from(productCategoryKeys).some((key) => currentCategoryProductKeys.has(key));
        })
        : []
    ),
    [currentCategoryProductKeys, currentParentId, storefrontProducts]
  );

  const showInitialLoading = (isRealProvider ? isPublicCatalogLoading : isLoading)
    && storefrontProducts.length === 0
    && storefrontCategories.length === 0;
  const isInsideCategory = Boolean(currentParentId);
  const shouldMergeProductsWithSubcategories =
    isInsideCategory && currentCategories.length > 0;

  const selectedCategoryExists = useMemo(
    () => !currentParentId || storefrontCategories.some((category) => category.id === currentParentId),
    [currentParentId, storefrontCategories]
  );

  const appsCategoryId = useMemo(() => {
    const rootAppsCategory = storefrontCategories.find((category) => (
      (category.tone === 'apps' || category.id === 'apps')
      && getParentId(category) === null
    ));

    return rootAppsCategory?.id
      || storefrontCategories.find((category) => category.tone === 'apps' || category.id === 'apps')?.id
      || 'apps';
  }, [getParentId, storefrontCategories]);

  useEffect(() => {
    if (selectedCategoryExists) return;
    setCurrentParentId(null);
  }, [selectedCategoryExists]);

  const handleCategorySelect = useCallback((categoryId) => {
    setCurrentParentId(categoryId || null);
  }, []);

  const handleSoulChillClick = useCallback(() => {
    setCurrentParentId(appsCategoryId);
    window.requestAnimationFrame(() => {
      document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [appsCategoryId]);

  const handleProductSelect = useCallback(() => {
    navigate('/auth?mode=login');
  }, [navigate]);

  const resetToCatalogs = useCallback(() => {
    setCurrentParentId(null);
  }, []);

  const navigateBreadcrumb = useCallback((categoryId) => {
    setCurrentParentId(categoryId || null);
  }, []);

  const handleLogin = useCallback(() => {
    navigate('/auth?mode=login');
  }, [navigate]);

  const handleCreateAccount = useCallback(() => {
    navigate('/auth?mode=signup');
  }, [navigate]);

  const handleGoogleLogin = useCallback(() => {
    Promise.resolve(loginWithGoogle());
  }, [loginWithGoogle]);

  const handleAbout = useCallback(() => {
    navigate('/about-us');
  }, [navigate]);

  const handleHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen pb-5 pt-[4.75rem]">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[color:rgb(var(--color-border-rgb)/0.32)] bg-[color:rgb(var(--color-background-rgb)/0.88)] shadow-[0_18px_44px_-34px_rgb(var(--color-primary-rgb)/0.36)] backdrop-blur-xl">
        <div className="mx-auto max-w-[var(--shell-max-width)] px-3 py-2 sm:px-4 lg:px-6">
          <div dir="ltr" className="oscar-neon-panel grid min-h-[2.95rem] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-[20px] border px-2.5 py-1 sm:min-h-[3.25rem] sm:gap-5 sm:rounded-[28px] sm:px-5 sm:py-1.5">
            <div className="col-start-1 row-start-1 flex items-center gap-1 justify-self-start sm:gap-2">
              <ThemeToggle variant="glass" compact className="h-9 w-9 sm:h-10 sm:w-10" />
            </div>

            <div className="col-start-2 row-start-1 justify-self-center">
              <HeaderBrand />
            </div>

            <button
              type="button"
              onClick={() => setIsMenuOpen((previous) => !previous)}
              className="col-start-3 row-start-1 inline-flex h-9 w-9 shrink-0 items-center justify-center justify-self-end rounded-full border border-[color:rgb(var(--color-border-rgb)/0.84)] bg-[linear-gradient(180deg,rgb(3_8_22/0.9),rgb(2_6_19/0.78))] text-[var(--color-text)] shadow-[inset_0_0_18px_rgb(255_255_255/0.035),0_0_26px_-18px_rgb(34_211_238/0.9)] transition-all hover:-translate-y-0.5 hover:border-[color:rgb(var(--color-primary-rgb)/0.38)] hover:text-[var(--color-primary)] sm:h-10 sm:w-10"
              aria-label={isArabic ? 'القائمة' : 'Menu'}
            >
              <Menu className="h-4.5 w-4.5 sm:h-6 sm:w-6" />
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 pt-3 sm:px-6 lg:px-8 lg:hidden">
        <div className="mx-auto max-w-[var(--shell-max-width)]">
          <NeonShineButton onClick={handleLogin}>
            {isArabic ? 'تسجيل الدخول' : 'Login'}
          </NeonShineButton>
        </div>
      </div>

      <PublicSidebar
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onHome={handleHome}
        onAbout={handleAbout}
        onLogin={handleLogin}
        onCreateAccount={handleCreateAccount}
        onGoogleLogin={handleGoogleLogin}
        isBusy={false}
        isArabic={isArabic}
      />

      {showServiceNotice && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[radial-gradient(circle_at_top,rgb(34_211_238/0.16),rgb(15_23_42/0.78)_42%,rgb(0_0_0/0.88))] px-4 backdrop-blur-[4px]">
          <div
            dir="rtl"
            className="oscar-neon-panel relative w-full max-w-[18.75rem] overflow-hidden rounded-[1.35rem] border text-right shadow-[0_26px_78px_-44px_rgb(34_211_238/0.88)] backdrop-blur-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-notice-title"
            style={{ animation: 'page-fade-in 180ms ease-out both' }}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,#7df9ff,#a855f7,#f43fdd,transparent)]" />
            <div className="pointer-events-none absolute -top-16 left-1/2 h-24 w-44 -translate-x-1/2 rounded-full bg-[color:rgb(var(--color-primary-rgb)/0.18)] blur-3xl" />

            <button
              type="button"
              onClick={handleCloseServiceNotice}
              className="absolute left-2.5 top-2.5 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[color:rgb(var(--color-primary-rgb)/0.2)] bg-[color:rgb(var(--color-card-rgb)/0.78)] text-[var(--color-text-secondary)] transition-all hover:-translate-y-0.5 hover:text-[var(--color-primary)]"
              aria-label={isArabic ? 'إغلاق التنويه' : 'Close notice'}
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative px-4 pb-4 pt-4">
              <div dir="ltr" className="mb-3 flex justify-center pl-8">
                <HeaderBrand
                  className="scale-[0.74] justify-center"
                  iconClassName="scale-[0.82]"
                  textClassName="text-center"
                />
              </div>

              <div className="mb-3 flex items-center justify-center gap-2">
                <span className="h-px flex-1 bg-[linear-gradient(90deg,transparent,rgb(var(--color-primary-rgb)/0.45))]" />
                <h2 id="service-notice-title" className="shrink-0 bg-[linear-gradient(120deg,#7df9ff,#a855f7,#f43fdd)] bg-clip-text text-base font-black leading-6 text-transparent">
                  تنويه هام
                </h2>
                <span className="h-px flex-1 bg-[linear-gradient(90deg,rgb(244_63_221/0.45),transparent)]" />
              </div>

              <div className="space-y-2.5 rounded-[1rem] border border-[color:rgb(var(--color-primary-rgb)/0.18)] bg-[color:rgb(var(--color-surface-rgb)/0.38)] p-3">
                <div className="flex gap-2.5">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[color:rgb(244_63_221/0.13)] text-[0.62rem] font-black text-[#f43fdd]">
                    !
                  </span>
                  <p className="text-[0.78rem] font-extrabold leading-6 text-[var(--color-text)]">
                    لا يوجد استرداد أو استرجاع لأي منتج بعد إتمام عملية التحويل.
                  </p>
                </div>

                <div className="flex gap-2.5">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[color:rgb(var(--color-primary-rgb)/0.13)] text-[0.62rem] font-black text-[var(--color-primary)]">
                    i
                  </span>
                  <p className="text-[0.76rem] font-bold leading-6 text-[var(--color-text-secondary)]">
                    يرجى قراءة شروط الخدمة جيدًا قبل إجراء أي عملية تحويل.
                  </p>
                </div>
              </div>

              <p className="pt-3 text-center text-[0.78rem] font-extrabold text-[var(--color-text)]">
                شكراً لتفهمكم ❤️
              </p>

              <button
                type="button"
                onClick={handleCloseServiceNotice}
                className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-full border border-[color:rgb(var(--color-primary-rgb)/0.36)] bg-[linear-gradient(135deg,#22d3ee,#7c3aed_58%,#f43fdd)] px-4 text-sm font-black text-white shadow-[0_18px_38px_-24px_rgb(34_211_238/0.9)] transition-all hover:-translate-y-0.5 hover:brightness-105"
              >
                موافق
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-[var(--shell-max-width)] space-y-5 sm:space-y-6">
          <HeroSlider slides={homeHeroSlides} />

          <section id="categories" className="scroll-mt-28 space-y-3 sm:space-y-3.5">
            <div className="relative z-10 mx-auto flex w-full max-w-5xl justify-center px-0.5 sm:px-2">
              <ProductSearchBar
                products={storefrontProducts}
                language={language}
                onSelectProduct={handleProductSelect}
                forceIconRight
                placeholder={copy.searchPlaceholder}
                noResultsLabel={copy.noResults}
                className="mx-auto w-full"
                inputClassName="h-12 rounded-full"
              />
            </div>

            {showInitialLoading && (
              <LoadingSkeleton variant="catalogs" />
            )}

            {!showInitialLoading && isInsideCategory && (
              <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-1 px-1 text-sm">
                <button
                  type="button"
                  onClick={resetToCatalogs}
                  className="font-medium text-[var(--color-primary)] hover:underline"
                >
                  {copy.home}
                </button>
                {breadcrumbTrail.map((category) => (
                  <span key={category.id} className="flex items-center gap-1">
                    <ChevronRight className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
                    <button
                      type="button"
                      onClick={() => navigateBreadcrumb(category.id)}
                      className="text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)] hover:underline"
                    >
                      {category.title}
                    </button>
                  </span>
                ))}
              </nav>
            )}

            {!showInitialLoading && (
              <>
                {!isInsideCategory && currentCategories.length > 0 && (
                  <div className="relative z-0 grid grid-cols-2 gap-2 sm:gap-2.5 md:grid-cols-3 xl:grid-cols-4">
                    {currentCategories.map((category, index) => (
                      <CategoryCard
                        key={category.id}
                        category={category}
                        active={false}
                        index={index}
                        onSelect={handleCategorySelect}
                      />
                    ))}
                  </div>
                )}

                {shouldMergeProductsWithSubcategories && (
                  <div className="grid grid-cols-3 gap-3 p-1 sm:gap-4">
                    {currentCategories.map((category, index) => (
                      <CategoryCard
                        key={category.id}
                        category={category}
                        active={false}
                        index={index}
                        onSelect={handleCategorySelect}
                        variant="plain"
                      />
                    ))}
                    {currentProducts.map((product) => (
                      <ProductCardSimple
                        key={product.id}
                        product={product}
                        onOpen={handleProductSelect}
                        buyLabel={copy.loginToBuy}
                        unavailableLabel={copy.unavailable}
                      />
                    ))}
                  </div>
                )}

                {isInsideCategory && currentProducts.length > 0 && !shouldMergeProductsWithSubcategories && (
                  <div className="grid grid-cols-3 gap-3 p-1 sm:gap-4">
                    {currentProducts.map((product) => (
                      <ProductCardSimple
                        key={product.id}
                        product={product}
                        onOpen={handleProductSelect}
                        buyLabel={copy.loginToBuy}
                        unavailableLabel={copy.unavailable}
                      />
                    ))}
                  </div>
                )}

                {isInsideCategory && currentCategories.length === 0 && currentProducts.length === 0 && (
                  <EmptyState
                    icon={Layers3}
                    title={copy.emptyCategoryTitle}
                    description={copy.emptyCategoryDescription}
                    actionLabel={copy.backToCatalogs}
                    onAction={resetToCatalogs}
                  />
                )}

                {!isInsideCategory && currentCategories.length === 0 && (
                  <EmptyState
                    icon={Search}
                    title={copy.emptyCatalogsTitle}
                    description={copy.emptyCatalogsDescription}
                  />
                )}
              </>
            )}
          </section>

          <SoulChillBanner onClick={handleSoulChillClick} />
        </div>
      </main>
    </div>
  );
};

export default PublicCatalog;
