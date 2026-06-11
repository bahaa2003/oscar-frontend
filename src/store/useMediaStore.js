import { create } from 'zustand';
import { mockProducts, mockCategories } from '../data/mockData';
import apiClient from '../services/client';

const dataProvider = (import.meta.env.VITE_DATA_PROVIDER || 'mock').toLowerCase();
const isRealProvider = dataProvider === 'real';

const MEDIA_CACHE_KEY = 'oscar:media-cache:v1';
const PRODUCTS_CACHE_TTL = 25 * 1000; // short TTL to avoid refetch storms; keeps UI snappy
let productsRequest = null;
let hasFetchedFromBackendThisSession = false;

const readSessionCache = () => {
  if (typeof window === 'undefined' || !window.sessionStorage) return null;
  try {
    const raw = window.sessionStorage.getItem(MEDIA_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const products = Array.isArray(parsed?.products) ? parsed.products : null;
    const categories = Array.isArray(parsed?.categories) ? parsed.categories : null;
    const lastLoadedAt = Number(parsed?.lastLoadedAt || 0);
    if (!products || !categories || !Number.isFinite(lastLoadedAt)) return null;
    return { products, categories, lastLoadedAt };
  } catch {
    return null;
  }
};

const writeSessionCache = ({ products, categories, lastLoadedAt }) => {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    window.sessionStorage.setItem(
      MEDIA_CACHE_KEY,
      JSON.stringify({ products, categories, lastLoadedAt })
    );
  } catch {
    // Best-effort cache only.
  }
};

const clearSessionCache = () => {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    window.sessionStorage.removeItem(MEDIA_CACHE_KEY);
  } catch {
    // Best effort.
  }
};

const asNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const resolveCategoryId = (value, categories) => {
  const raw = (() => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return String(value._id || value.id || value.name || value.nameAr || '').trim();
    }
    return String(value || '').trim();
  })();
  const matched = (categories || []).find(
    (c) => c.id === raw || c.name === raw || c.nameAr === raw
  );
  return matched?.id || raw || categories?.[0]?.id || '';
};

const looksLikeObjectId = (value) => /^[a-f\d]{24}$/i.test(String(value || '').trim());

const buildProductSearchIndex = (product = {}) => String([
  product?.name,
  product?.nameAr,
  product?.description,
  product?.descriptionAr,
  product?.externalProductName,
].join(' '))
  .replace(/[\u0000-\u001F\u007F]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase();

const pickDefinedProductValue = (incomingValue, fallbackValue) => {
  if (incomingValue === undefined || incomingValue === null) return fallbackValue;

  if (typeof incomingValue === 'string') {
    return incomingValue.trim() ? incomingValue : fallbackValue;
  }

  if (Array.isArray(incomingValue)) {
    return incomingValue.length ? incomingValue : fallbackValue;
  }

  return incomingValue;
};

const pickUsablePriceValue = (...values) => {
  const positiveValue = values.find((value) => {
    if (value === undefined || value === null || String(value).trim() === '') return false;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0;
  });

  if (positiveValue !== undefined) return positiveValue;

  return values.find((value) => (
    value !== undefined
    && value !== null
    && String(value).trim() !== ''
  )) ?? 0;
};

const mergeSavedProductSnapshot = (baseProduct = {}, apiProduct = {}) => ({
  ...baseProduct,
  ...apiProduct,
  providerId: pickDefinedProductValue(apiProduct.providerId ?? apiProduct.supplierId, baseProduct.providerId || baseProduct.supplierId || ''),
  supplierId: pickDefinedProductValue(apiProduct.supplierId ?? apiProduct.providerId, baseProduct.supplierId || baseProduct.providerId || ''),
  providerProductId: pickDefinedProductValue(apiProduct.providerProductId ?? apiProduct.externalProductId, baseProduct.providerProductId || baseProduct.externalProductId || ''),
  externalProductId: pickDefinedProductValue(apiProduct.externalProductId ?? apiProduct.providerProductId, baseProduct.externalProductId || baseProduct.providerProductId || ''),
  product_id: pickDefinedProductValue(apiProduct.product_id ?? apiProduct.productId, baseProduct.product_id || baseProduct.productId || ''),
  productId: pickDefinedProductValue(apiProduct.productId ?? apiProduct.product_id, baseProduct.productId || baseProduct.product_id || ''),
  externalProductName: pickDefinedProductValue(apiProduct.externalProductName, baseProduct.externalProductName || ''),
  externalPricingMode: pickDefinedProductValue(apiProduct.externalPricingMode, baseProduct.externalPricingMode || 'use_local_price'),
  supplierMarginType: pickDefinedProductValue(apiProduct.supplierMarginType, baseProduct.supplierMarginType || 'fixed'),
  supplierMarginValue: pickDefinedProductValue(apiProduct.supplierMarginValue, baseProduct.supplierMarginValue ?? 0),
  fallbackSupplierId: pickDefinedProductValue(apiProduct.fallbackSupplierId, baseProduct.fallbackSupplierId || ''),
  supplierNotes: pickDefinedProductValue(apiProduct.supplierNotes, baseProduct.supplierNotes || ''),
  supplierFieldMappings: pickDefinedProductValue(apiProduct.supplierFieldMappings, baseProduct.supplierFieldMappings || []),
  syncPriceWithProvider: apiProduct.syncPriceWithProvider !== undefined
    ? Boolean(apiProduct.syncPriceWithProvider)
    : Boolean(baseProduct.syncPriceWithProvider),
  enableManualPrice: apiProduct.enableManualPrice !== undefined
    ? Boolean(apiProduct.enableManualPrice)
    : Boolean(baseProduct.enableManualPrice),
  manualPriceAdjustment: pickDefinedProductValue(apiProduct.manualPriceAdjustment, baseProduct.manualPriceAdjustment ?? ''),
  syncedProviderBasePrice: apiProduct.syncedProviderBasePrice ?? baseProduct.syncedProviderBasePrice ?? null,
  originalPriceCoins: pickDefinedProductValue(
    apiProduct.originalPriceCoins ?? apiProduct.originalPrice ?? apiProduct.costPrice,
    baseProduct.originalPriceCoins ?? baseProduct.originalPrice ?? baseProduct.costPrice ?? ''
  ),
  dynamicFields: pickDefinedProductValue(apiProduct.dynamicFields, baseProduct.dynamicFields || []),
});

const splitProductStatusUpdate = (currentProduct = {}, updates = {}) => {
  const currentStatus = String(
    currentProduct.status
    || (currentProduct.isActive === false ? 'inactive' : 'active')
    || 'active'
  ).trim().toLowerCase();

  const nextStatusRaw = updates?.status !== undefined
    ? updates.status
    : updates?.isActive !== undefined
      ? (updates.isActive ? 'active' : 'inactive')
      : '';
  const nextStatus = String(nextStatusRaw || '').trim().toLowerCase();

  const nonStatusUpdates = { ...(updates || {}) };
  delete nonStatusUpdates.status;
  delete nonStatusUpdates.isActive;

  return {
    statusChanged: ['active', 'inactive'].includes(nextStatus) && nextStatus !== currentStatus,
    nonStatusUpdates,
  };
};

const hasOwnKeys = (value) => Object.keys(value || {}).length > 0;

const normalizeProductRecord = (product = {}, categories = mockCategories) => {
  const minimumOrderQty = asNumber(product.minimumOrderQty ?? product.minQty, 1);
  const maximumOrderQtyRaw = asNumber(product.maximumOrderQty ?? product.maxQty, 999);
  const maximumOrderQty = Math.max(maximumOrderQtyRaw, minimumOrderQty);
  const trackInventory = Boolean(product.trackInventory);
  const lowStockThreshold = asNumber(product.lowStockThreshold, 50);
  const providerId = String(product.providerId || product.supplierId || product.provider || '').trim();
  const providerProductId = String(
    product.providerProductId
    || product.providerProduct
    || product.externalProductId
    || ''
  ).trim();
  const providerCatalogProductId = String(
    product.product_id
    || product.productId
    || product.providerProduct?.product_id
    || product.providerProduct?.productId
    || product.providerProduct?.rawPayload?.product_id
    || ''
  ).trim();
  const externalProductId = String(
    product.externalProductId
    || product.providerProductId
    || product.providerProduct
    || providerCatalogProductId
    || ''
  ).trim();
  const manualPriceAdjustment = product.manualPriceAdjustment ?? '';
  const syncPriceWithProvider = product.syncPriceWithProvider !== undefined
    ? Boolean(product.syncPriceWithProvider)
    : Boolean(providerId && providerProductId && (
      product.externalPricingMode === 'use_supplier_price'
      || product.externalPricingMode === 'supplier_price_plus_margin'
      || product.pricingMode === 'sync'
    ));
  const externalPricingMode = product.externalPricingMode
    || (syncPriceWithProvider ? 'use_supplier_price' : 'use_local_price');
  const rawPayload = product.rawPayload && typeof product.rawPayload === 'object' ? product.rawPayload : {};
  const resolvedBasePrice = pickUsablePriceValue(
    product.basePriceCoins,
    product.basePrice,
    product.priceCoins,
    product.price,
    product.product_price,
    rawPayload.product_price,
    product.displayPrice,
    product.finalPrice,
    product.markedUpPriceUSD
  );
  const resolvedDisplayPrice = pickUsablePriceValue(
    product.displayPrice,
    product.finalPrice,
    product.markedUpPriceUSD,
    product.priceCoins,
    product.price,
    product.product_price,
    rawPayload.product_price,
    resolvedBasePrice
  );

  const normalized = {
    ...product,
    basePriceCoins: resolvedBasePrice,
    basePrice: pickUsablePriceValue(product.basePrice, resolvedBasePrice),
    displayPrice: resolvedDisplayPrice,
    category: resolveCategoryId(product.category, categories),
    status: product.status || 'active',
    productStatus: product.productStatus || 'available',
    isVisibleInStore: product.isVisibleInStore !== false,
    showWhenUnavailable: Boolean(product.showWhenUnavailable),
    enableSchedule: Boolean(product.enableSchedule),
    scheduledStartAt: product.scheduledStartAt || null,
    scheduledEndAt: product.scheduledEndAt || null,
    scheduleVisibilityMode: product.scheduleVisibilityMode || 'hide',
    pauseSales: Boolean(product.pauseSales),
    pauseReason: product.pauseReason || '',
    internalNotes: product.internalNotes || '',
    minimumOrderQty,
    maximumOrderQty,
    stepQty: Math.max(asNumber(product.stepQty, 1), 1),
    trackInventory,
    stockQuantity: asNumber(product.stockQuantity, 999),
    lowStockThreshold: Math.max(lowStockThreshold, 0),
    hideWhenOutOfStock: Boolean(product.hideWhenOutOfStock),
    showOutOfStockLabel: product.showOutOfStockLabel !== false,
    providerId,
    providerProductId,
    supplierId: providerId,
    externalProductId,
    product_id: providerCatalogProductId,
    productId: providerCatalogProductId,
    externalProductName: product.externalProductName || '',
    autoFulfillmentEnabled: product.autoFulfillmentEnabled !== false,
    fallbackSupplierId: product.fallbackSupplierId || '',
    supplierFieldMappings: Array.isArray(product.supplierFieldMappings) ? product.supplierFieldMappings : [],
    externalPricingMode,
    supplierMarginType: product.supplierMarginType || 'fixed',
    supplierMarginValue: asNumber(product.supplierMarginValue, 0),
    supplierNotes: product.supplierNotes || '',
    syncPriceWithProvider,
    enableManualPrice: product.enableManualPrice !== undefined
      ? Boolean(product.enableManualPrice)
      : Number(manualPriceAdjustment || 0) !== 0,
    manualPriceAdjustment,
    syncedProviderBasePrice: product.syncedProviderBasePrice ?? null,
    originalPriceCoins: product.originalPriceCoins ?? product.originalPrice ?? product.costPrice ?? '',
    dynamicFields: Array.isArray(product.dynamicFields) ? product.dynamicFields : [],
    searchIndex: product.searchIndex || buildProductSearchIndex(product),
  };

  normalized.minQty = normalized.minimumOrderQty;
  normalized.maxQty = normalized.maximumOrderQty;

  if (!normalized.trackInventory) {
    normalized.stockQuantity = 999;
    normalized.lowStockThreshold = 0;
    normalized.hideWhenOutOfStock = false;
    normalized.showOutOfStockLabel = true;
  }

  // Final availability guard: when a product is marked "available",
  // recover conflicting flags that can silently keep it hidden/unbuyable.
  if (normalized.productStatus === 'available') {
    normalized.status = 'active';
    normalized.isVisibleInStore = true;
    normalized.showWhenUnavailable = false;
    normalized.pauseSales = false;
    normalized.pauseReason = '';

    if (normalized.trackInventory && normalized.stockQuantity <= 0) {
      normalized.stockQuantity = Math.max(1, normalized.lowStockThreshold || 1);
    }
  }

  return normalized;
};

const normalizeProducts = (products, categories = mockCategories) => {
  if (!Array.isArray(products)) {
    return mockProducts.map((p) => normalizeProductRecord(p, categories));
  }
  return products.map((p) => normalizeProductRecord(p, categories));
};

const deriveCategoriesFromProducts = (products = []) => {
  const safeProducts = Array.isArray(products) ? products : [];
  const unique = new Map();

  safeProducts.forEach((product) => {
    const rawCategory = product?.category;
    const hasCategoryObject = rawCategory && typeof rawCategory === 'object' && !Array.isArray(rawCategory);

    const categoryId = String(
      (hasCategoryObject ? (rawCategory?._id || rawCategory?.id) : rawCategory) ||
      product?.categoryId ||
      ''
    ).trim();
    if (!categoryId) return;

    if (unique.has(categoryId)) return;

    const fallbackNameFromProduct = String(
      product?.categoryName
      || product?.categoryTitle
      || product?.categoryLabel
      || product?.categoryAr
      || ''
    ).trim();
    const fallbackNameArFromProduct = String(
      product?.categoryNameAr
      || product?.categoryTitleAr
      || product?.categoryLabelAr
      || product?.categoryAr
      || ''
    ).trim();

    const categoryName = String(
      (hasCategoryObject
        ? (rawCategory?.name || rawCategory?.title)
        : (looksLikeObjectId(categoryId) ? fallbackNameFromProduct : categoryId)
      ) ||
      categoryId
    ).trim() || categoryId;
    const categoryNameAr = String(
      (hasCategoryObject
        ? (rawCategory?.nameAr || rawCategory?.titleAr)
        : (looksLikeObjectId(categoryId) ? (fallbackNameArFromProduct || fallbackNameFromProduct || categoryName) : categoryName)
      ) ||
      categoryName
    ).trim() || categoryName;

    const categoryImage = String(
      (hasCategoryObject ? (rawCategory?.image || rawCategory?.icon) : '') ||
      product?.categoryImage ||
      product?.image ||
      ''
    ).trim() || null;

    unique.set(categoryId, {
      id: categoryId,
      name: categoryName,
      nameAr: categoryNameAr,
      ...(categoryImage ? { image: categoryImage } : {}),
    });
  });

  return Array.from(unique.values());
};

const initialCache = isRealProvider ? readSessionCache() : null;
const initialCategories = initialCache?.categories && initialCache.categories.length
  ? initialCache.categories
  : (isRealProvider ? [] : mockCategories);
const initialProducts = initialCache?.products && initialCache.products.length
  ? normalizeProducts(initialCache.products, initialCategories)
  : (isRealProvider ? [] : normalizeProducts(mockProducts, mockCategories));
const initialLastLoadedAt = initialCache?.lastLoadedAt && Number.isFinite(initialCache.lastLoadedAt)
  ? initialCache.lastLoadedAt
  : 0;

const useMediaStore = create((set, get) => ({
  products: initialProducts,
  categories: initialCategories,
  isLoading: false,
  error: null,
  lastLoadedAt: initialLastLoadedAt,

  resetProducts: () => {
    clearSessionCache();
    set({
      products: normalizeProducts(mockProducts, mockCategories),
      categories: mockCategories,
      lastLoadedAt: 0,
    });
  },

  loadProducts: ({ force = true, bypassCache = false } = {}) => {
    const state = get();
    const hasProducts = Array.isArray(state.products) && state.products.length > 0;
    const hasCategories = Array.isArray(state.categories) && state.categories.length > 0;
    const lastLoadedAt = Number(state.lastLoadedAt || 0);
    const cacheAge = lastLoadedAt ? (Date.now() - lastLoadedAt) : Number.POSITIVE_INFINITY;
    const cacheIsFresh = cacheAge >= 0 && cacheAge < PRODUCTS_CACHE_TTL;

    // Serve cached data immediately when available and still fresh.
    // This keeps pages responsive even if callers pass force=true frequently.
    if (!bypassCache && hasProducts && hasCategories && cacheIsFresh) {
      return Promise.resolve({
        products: state.products,
        categories: state.categories,
      });
    }

    if (!bypassCache && !force && hasProducts && hasCategories) {
      return Promise.resolve({
        products: state.products,
        categories: state.categories,
      });
    }

        if (productsRequest) {
          return productsRequest;
        }

        set({ isLoading: !(hasProducts && hasCategories), error: null });

        productsRequest = Promise.all([apiClient.products.list(), apiClient.categories.list()])
          .then(async ([products, categories]) => {
            const resolvedCategories = Array.isArray(categories) && categories.length ? categories : [];

            let safeCategories = isRealProvider
              ? (resolvedCategories.length ? resolvedCategories : deriveCategoriesFromProducts(products))
              : (() => {
                const persistedCategories = get().categories;
                if (resolvedCategories.length) return resolvedCategories;
                if (Array.isArray(persistedCategories) && persistedCategories.length) return persistedCategories;
                return mockCategories;
              })();

            if (isRealProvider && !resolvedCategories.length && typeof apiClient?.categories?.get === 'function') {
              const unresolved = (Array.isArray(safeCategories) ? safeCategories : []).filter((category) => {
                const id = String(category?.id || '').trim();
                if (!looksLikeObjectId(id)) return false;
                const name = String(category?.name || '').trim();
                const nameAr = String(category?.nameAr || '').trim();
                const missingName = !name || name === id || looksLikeObjectId(name);
                const missingNameAr = !nameAr || nameAr === id || looksLikeObjectId(nameAr);
                return missingName && missingNameAr;
              });

              if (unresolved.length) {
                const results = await Promise.allSettled(unresolved.map((category) => apiClient.categories.get(category.id)));
                const resolvedById = new Map();
                results.forEach((result, index) => {
                  if (result.status === 'fulfilled' && result.value) {
                    resolvedById.set(String(unresolved[index].id).trim(), result.value);
                  }
                });

                if (resolvedById.size) {
                  safeCategories = safeCategories.map((category) => {
                    const id = String(category?.id || '').trim();
                    if (!resolvedById.has(id)) return category;
                    const resolvedCategory = resolvedById.get(id);
                    return {
                      ...category,
                      ...resolvedCategory,
                      id,
                    };
                  });
                }
              }
            }

            const normalizedProducts = normalizeProducts(products, safeCategories);
            const loadedAt = Date.now();

            set({
              products: normalizedProducts,
              categories: safeCategories,
              isLoading: false,
              error: null,
              lastLoadedAt: loadedAt,
            });

            writeSessionCache({
              products: normalizedProducts,
              categories: safeCategories,
              lastLoadedAt: loadedAt,
            });

            if (isRealProvider) {
              hasFetchedFromBackendThisSession = true;
            }
          })
          .catch((error) => {
            const { products, categories } = get();
            if (!Array.isArray(products)) {
              set({ products: normalizeProducts(mockProducts, categories || mockCategories) });
            }
            if (!Array.isArray(categories) || categories.length === 0) {
              set({ categories: mockCategories });
            }

            set({
              isLoading: false,
              error: error?.message || null,
            });
          })
          .finally(() => {
            productsRequest = null;
          });

        return productsRequest;
      },

      addProduct: async (product) => {
        const categories = get().categories || [];
        const newProduct = normalizeProductRecord(
          { ...product, id: product.id || `p${Date.now()}` },
          categories
        );

        const created = await apiClient.products.create(newProduct);
        set((state) => ({
          products: [
            ...state.products,
            normalizeProductRecord(mergeSavedProductSnapshot(newProduct, created || {}), state.categories),
          ],
          lastLoadedAt: Date.now(),
        }));
        return created || newProduct;
      },

      updateProduct: async (id, updates) => {
        const categories = get().categories || [];
        const current = get().products.find((p) => p.id === id) || {};
        const { statusChanged, nonStatusUpdates } = splitProductStatusUpdate(current, updates);
        const hasNonStatusChanges = hasOwnKeys(nonStatusUpdates);

        if (!hasNonStatusChanges && !statusChanged) {
          return current;
        }

        let nextSnapshot = current;

        if (hasNonStatusChanges) {
          const safeUpdates = normalizeProductRecord(
            { ...current, ...nonStatusUpdates, id },
            categories
          );
          const updated = await apiClient.products.update(id, safeUpdates);
          nextSnapshot = mergeSavedProductSnapshot(safeUpdates, updated || {});
        }

        if (statusChanged) {
          const toggled = await apiClient.products.toggleStatus(id);
          nextSnapshot = mergeSavedProductSnapshot(nextSnapshot, toggled || {});
        }

        const normalizedProduct = normalizeProductRecord(
          { ...current, ...nextSnapshot, id },
          categories
        );

        set((state) => ({
          products: state.products.map((p) => (
            p.id === id ? normalizedProduct : p
          )),
          lastLoadedAt: Date.now(),
        }));

        return normalizedProduct;
      },

      toggleProductStatus: async (id) => {
        const categories = get().categories || [];
        const current = get().products.find((p) => p.id === id);

        if (!current) {
          throw new Error('Product not found');
        }

        const toggled = await apiClient.products.toggleStatus(id);
        const normalizedProduct = normalizeProductRecord(
          mergeSavedProductSnapshot(current, toggled || {}),
          categories
        );

        set((state) => ({
          products: state.products.map((p) => (
            p.id === id ? normalizedProduct : p
          )),
          lastLoadedAt: Date.now(),
        }));

        return normalizedProduct;
      },

      deleteProduct: (id) => {
        apiClient.products.delete(id).then(() => {
          set((state) => ({
            products: state.products.filter((p) => p.id !== id),
            lastLoadedAt: Date.now(),
          }));
        });
      },

      // Category Actions
      addCategory: async (category) => {
        const newCategory = {
          ...category,
          id: category?.id || `c${Date.now()}`,
        };

        const created = await apiClient.categories.create(newCategory);
        const nextCategory = created || newCategory;

        set((state) => ({
          categories: [...(Array.isArray(state.categories) ? state.categories : []), nextCategory],
          lastLoadedAt: Date.now(),
        }));

        return nextCategory;
      },

      updateCategory: async (id, updates) => {
        const normalizedId = String(id || '').trim();
        if (!normalizedId) throw new Error('Category id is required');

        const current = (get().categories || []).find((c) => String(c?.id || '').trim() === normalizedId) || null;
        if (!current) throw new Error('Category not found');

        const safeUpdates = { ...(updates || {}) };
        delete safeUpdates.id;

        const updated = await apiClient.categories.update(normalizedId, safeUpdates);
        const nextCategory = updated || { ...current, ...safeUpdates, id: current.id };

        const oldName = String(current?.name || '').trim();
        const oldNameAr = String(current?.nameAr || '').trim();
        const shouldMigrateCategoryField = (value) => {
          const raw = String(value || '').trim();
          if (!raw) return false;
          return raw === oldName || raw === oldNameAr;
        };

        set((state) => {
          const nextCategories = (Array.isArray(state.categories) ? state.categories : []).map((c) => (
            String(c?.id || '').trim() === normalizedId ? nextCategory : c
          ));

          const nextProducts = (Array.isArray(state.products) ? state.products : []).map((product) => {
            if (!shouldMigrateCategoryField(product?.category)) return product;
            return { ...product, category: normalizedId };
          });

          return {
            categories: nextCategories,
            products: normalizeProducts(nextProducts, nextCategories),
            lastLoadedAt: Date.now(),
          };
        });

        return nextCategory;
      },
      
      deleteCategory: async (id) => {
        await apiClient.categories.delete(id);

        set((state) => {
          const safeCategories = Array.isArray(state.categories) ? state.categories : [];
          const safeProducts = Array.isArray(state.products) ? state.products : [];
          const toDelete = safeCategories.find((c) => c.id === id);
          const shouldDeleteProduct = (p) => {
            const raw = String(p?.category || '').trim();
            if (!toDelete) return raw === id;
            return raw === id || raw === String(toDelete.name || '').trim() || raw === String(toDelete.nameAr || '').trim();
          };

          return {
            categories: safeCategories.filter((c) => c.id !== id),
            products: safeProducts.filter((p) => !shouldDeleteProduct(p)),
            lastLoadedAt: Date.now(),
          };
        });

        return { success: true };
      },

      fetchProducts: async () => get().loadProducts({ force: true })
}));

export default useMediaStore;
