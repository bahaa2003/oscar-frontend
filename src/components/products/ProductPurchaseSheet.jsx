import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  LoaderCircle,
  Package2,
  X,
  Zap,
} from 'lucide-react';
import { resolveImageUrl } from '../../utils/imageUrl';
import Button, { cn } from '../ui/Button';
import Badge from '../ui/Badge';
import Input from '../ui/Input';
import { useToast } from '../ui/Toast';
import useAuthStore from '../../store/useAuthStore';
import useGroupStore from '../../store/useGroupStore';
import useOrderStore from '../../store/useOrderStore';
import useSystemStore from '../../store/useSystemStore';
import useMediaStore from '../../store/useMediaStore';
import { useLanguage } from '../../context/LanguageContext';
import {
  calculateProductPrice,
  formatCurrencyAmount,
  getCurrencyMeta,
  resolveProductUnitPrice,
} from '../../utils/pricing';
import { normalizeMoneyAmount } from '../../utils/money';
import { getProductStatus } from '../../utils/productStatus';
import {
  clampProductQuantity,
  getProductQuantityMeta,
  resolveProductOrderFields,
  sanitizeOrderFieldValue,
} from '../../utils/productPurchase';
import { isApprovedAccountStatus } from '../../utils/accountStatus';
import { devLogger } from '../../utils/devLogger';

const getCopy = (language = 'ar') => {
  if (language === 'en') {
    return {
      closeLabel: 'Close',
      quickOrder: 'Quick Order',
      unitPrice: 'Unit Price',
      available: 'Available',
      unavailable: 'Unavailable',
      orderFields: 'Order Fields',
      orderFieldsHint: 'Fill in the required details before purchase.',
      quantityTitle: 'Quantity',
      countTitle: 'Count',
      min: 'Min',
      max: 'Max',
      step: 'Step',
      total: 'Total',
      totalHint: 'Updated automatically based on quantity.',
      auto24Hint: 'This product runs automatically 24/7.',
      userIdLabel: 'User ID',
      buy: 'Buy Now',
      cancel: 'Cancel',
      processing: 'Processing...',
      insufficientTitle: 'Insufficient balance',
      insufficientMessage: (amount) => `You need ${amount} more to complete this order.`,
      pendingTitle: 'Account unavailable',
      pendingMessage: 'Purchasing is not available for this account right now.',
      unavailableTitle: 'Product unavailable',
      unavailableMessage: 'This product is currently unavailable for purchase.',
      preparingTitle: 'Preparing sheet',
      preparingMessage: 'Loading pricing and currency details...',
      successTitle: 'Order placed',
      successMessage: 'Your order has been submitted successfully.',
      successDone: 'Completed successfully',
      successViewOrder: 'Order details',
      failedTitle: 'Unable to complete order',
      failedMessage: 'Something went wrong while placing this order.',
      invalidAmountMessage: 'Unable to place this order because the amount is invalid.',
      invalidQuantity: 'Selected quantity is not valid for this product.',
      fieldRequired: (label) => `${label} is required.`,
      placeholder: (label) => `Enter ${label}`,
    };
  }

  return {
    closeLabel: 'إغلاق',
    quickOrder: 'طلب سريع',
    unitPrice: 'سعر الوحدة',
    available: 'متوفر',
    unavailable: 'غير متوفر',
    orderFields: 'بيانات الطلب',
    orderFieldsHint: 'أدخل البيانات المطلوبة قبل تنفيذ عملية الشراء.',
    quantityTitle: 'الكمية',
    countTitle: 'العدد',
    min: 'الحد الأدنى',
    max: 'الحد الأقصى',
    step: 'الزيادة',
    total: 'الإجمالي',
    totalHint: 'يتحدث تلقائيًا حسب الكمية المختارة.',
    auto24Hint: 'هذا المنتج يعمل اوتوماتيكي 24ساعه',
    userIdLabel: 'ايدي مستخدم',
    buy: 'شراء الآن',
    cancel: 'إلغاء',
    processing: 'جارٍ تنفيذ الطلب...',
    insufficientTitle: 'الرصيد غير كافٍ',
    insufficientMessage: (amount) => `تحتاج إلى ${amount} إضافية لإتمام الطلب.`,
    pendingTitle: 'الحساب غير متاح حاليًا',
    pendingMessage: 'لا يمكنك تنفيذ الطلبات بهذا الحساب حاليًا.',
    unavailableTitle: 'المنتج غير متاح',
    unavailableMessage: 'هذا المنتج غير متاح للشراء حاليًا.',
    preparingTitle: 'جارٍ تجهيز النافذة',
    preparingMessage: 'يتم تحميل تفاصيل السعر والعملة الآن...',
    successTitle: 'تم إرسال الطلب',
    successMessage: 'تم تنفيذ طلبك بنجاح وسيظهر في طلباتك مباشرة.',
    successDone: 'تمت العملية بنجاح',
    successViewOrder: 'تفاصيل الطلب',
    failedTitle: 'تعذر تنفيذ الطلب',
    failedMessage: 'حدث خطأ أثناء تنفيذ الطلب. حاول مرة أخرى.',
    invalidAmountMessage: 'لا يمكن تنفيذ الطلب لأن قيمة الشراء غير صالحة.',
    invalidQuantity: 'الكمية الحالية غير صالحة لهذا المنتج.',
    fieldRequired: (label) => `يرجى إدخال ${label}`,
    placeholder: (label) => `أدخل ${label}`,
  };
};

const resolveFieldLabel = (field, language = 'ar') => {
  return field?.label || field?.key || '';
};

const resolveFieldType = (field) => {
  const type = String(field?.type || 'text').trim().toLowerCase();
  if (['text', 'number', 'email', 'select'].includes(type)) return type;
  return 'text';
};

const isFieldRequired = (field) => field?.required !== false;

const resolveSelectOptions = (field) => {
  const source = Array.isArray(field?.options) ? field.options : [];
  return source
    .map((option) => {
      if (typeof option === 'string' || typeof option === 'number') {
        return { value: String(option), label: String(option) };
      }
      if (option && typeof option === 'object') {
        const rawValue = option.value ?? option.id ?? option.key ?? option.label;
        if (rawValue === undefined || rawValue === null) return null;
        return {
          value: String(rawValue),
          label: String(option.label ?? option.name ?? rawValue),
        };
      }
      return null;
    })
    .filter((option) => option?.value);
};

const resolveProductId = (item) => String(item?.id || item?._id || '').trim();

const isManualPurchaseProduct = (item) => {
  const executionType = String(item?.executionType || '').trim().toLowerCase();
  const hasProviderLink = Boolean(String(item?.supplierId || item?.providerId || '').trim());

  if (executionType === 'manual') return true;
  if (executionType === 'automatic') return false;
  if (item?.autoFulfillmentEnabled === false) return true;
  if (item?.autoFulfillmentEnabled === true) return false;

  return !hasProviderLink;
};

const isProductExplicitlyInactive = (item) => {
  if (!item || typeof item !== 'object') return false;
  if (item?.isActive === false) return true;

  const status = String(item?.status || '').trim().toLowerCase();
  return Boolean(status) && status !== 'active';
};

const resolvePurchaseState = (item, language, copy) => {
  if (isProductExplicitlyInactive(item)) {
    return {
      isVisible: true,
      isPurchasable: false,
      isDisabled: true,
      badge: 'unavailable',
      badgeLabel: copy.unavailable,
      badgeColor: 'danger',
      helperText: copy.unavailableMessage,
      reason: copy.unavailableTitle,
      scheduleStatus: null,
      isOutOfStock: false,
      isLowStock: false,
      inSchedule: true,
      isSalesEnabled: false,
    };
  }

  const status = getProductStatus(item, language);

  if (!isManualPurchaseProduct(item)) {
    return status;
  }

  if (status.isPurchasable) {
    return {
      ...status,
      isPurchasable: true,
      isDisabled: false,
      badgeLabel: copy.available,
      badgeColor: 'success',
      helperText: '',
      reason: '',
    };
  }

  return {
    ...status,
    isPurchasable: false,
    isDisabled: true,
    badgeLabel: copy.unavailable,
    badgeColor: status.badgeColor || 'danger',
    helperText: status.helperText || copy.unavailableMessage,
    reason: status.reason || copy.unavailableMessage,
  };
};

const statusToneStyles = {
  info: 'border-[color:rgb(var(--color-primary-rgb)/0.34)] bg-[color:rgb(var(--color-primary-rgb)/0.12)] text-[var(--color-text)] dark:text-white',
  warning: 'border-[color:rgb(var(--color-warning-rgb)/0.4)] bg-[color:rgb(var(--color-warning-rgb)/0.16)] text-[var(--color-text)] dark:text-white',
  danger: 'border-[color:rgb(var(--color-error-rgb)/0.4)] bg-[color:rgb(var(--color-error-rgb)/0.14)] text-[var(--color-text)] dark:text-white',
  success: 'border-[color:rgb(var(--color-success-rgb)/0.38)] bg-[color:rgb(var(--color-success-rgb)/0.15)] text-[var(--color-text)] dark:text-white',
};

const purchaseFieldClass = 'h-9 rounded-md border-[color:rgb(var(--color-border-rgb)/0.62)] bg-[color:rgb(var(--color-card-rgb)/0.86)] text-xs text-[var(--color-text)] placeholder:text-[color:rgb(var(--color-text-rgb)/0.48)] focus:border-[color:rgb(var(--color-primary-rgb)/0.55)] focus:bg-[color:rgb(var(--color-card-rgb)/0.96)] disabled:cursor-not-allowed disabled:opacity-70 dark:border-white/15 dark:bg-white/8 dark:text-white dark:placeholder:text-white/45 dark:focus:border-[#22d3ee]/45 dark:focus:bg-white/12 sm:h-10 sm:rounded-lg sm:text-[13px]';
const purchaseLabelClass = 'mb-1.5 block text-xs font-medium text-[color:rgb(var(--color-text-rgb)/0.72)] dark:text-white/80 sm:text-sm';
const purchaseOptionClass = 'bg-[rgb(var(--color-card-rgb))] text-[var(--color-text)] dark:text-white';
const purchaseNoticeTitleClass = 'text-[11px] font-semibold text-[var(--color-text)] dark:text-white sm:text-xs';
const purchaseNoticeTextClass = 'mt-0.5 text-[11px] text-[color:rgb(var(--color-text-rgb)/0.74)] dark:text-white/80 sm:text-xs';

const statusToneIcon = {
  info: LoaderCircle,
  warning: AlertCircle,
  danger: AlertCircle,
  success: CheckCircle2,
};

const ProductPurchaseSheet = ({ product, isOpen, onClose, onOrderSuccess }) => {
  const navigate = useNavigate();
  const { language, dir } = useLanguage();
  const { addToast } = useToast();
  const user = useAuthStore((state) => state.user);
  const updateUserSession = useAuthStore((state) => state.updateUserSession);
  const groupsLastLoadedAt = useGroupStore((state) => state.groupsLastLoadedAt);
  const addOrder = useOrderStore((state) => state.addOrder);
  const loadProducts = useMediaStore((state) => state.loadProducts);
  const currencies = useSystemStore((state) => state.currencies);
  const loadCurrencies = useSystemStore((state) => state.loadCurrencies);

  const locale = language === 'en' ? 'en-US' : 'ar-EG';
  const isRTL = dir === 'rtl';
  const copy = useMemo(() => getCopy(language), [language]);

  const [isPreparing, setIsPreparing] = useState(false);
  const [fieldValues, setFieldValues] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [quantityInput, setQuantityInput] = useState('1');
  const [quantityError, setQuantityError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusCard, setStatusCard] = useState({ tone: 'info', title: '', message: '' });
  const [successfulOrderId, setSuccessfulOrderId] = useState(null);
  const [successMeta, setSuccessMeta] = useState({ amount: '', identifier: '', orderNumber: '' });

  const orderFields = useMemo(
    () => resolveProductOrderFields(product, language),
    [language, product]
  );

  const quantityMeta = useMemo(
    () => getProductQuantityMeta(product),
    [product]
  );

  const productTitle = useMemo(() => {
    if (language === 'en') return product?.name || product?.nameAr || '';
    return product?.nameAr || product?.name || '';
  }, [language, product]);

  const productSubtitle = useMemo(() => {
    if (language === 'en' && product?.nameAr && product?.nameAr !== productTitle) return product.nameAr;
    if (language !== 'en' && product?.name && product?.name !== productTitle) return product.name;
    if (product?.externalProductId) return product.externalProductId;
    if (product?.sku) return product.sku;
    return '';
  }, [language, product, productTitle]);

  const productDescription = useMemo(() => {
    if (language === 'en') return String(product?.description || product?.descriptionAr || '').trim();
    return String(product?.descriptionAr || product?.description || '').trim();
  }, [language, product?.description, product?.descriptionAr]);

  const isAutoSupplierProduct = useMemo(() => {
    const supplierId = String(product?.supplierId || product?.providerId || '').trim();
    const supplierProductId = String(product?.providerProductId || product?.externalProductId || '').trim();
    const isLinked = Boolean(supplierId && supplierProductId);
    const isAuto = product?.autoFulfillmentEnabled !== false;
    return isLinked && isAuto;
  }, [product?.autoFulfillmentEnabled, product?.externalProductId, product?.providerId, product?.providerProductId, product?.supplierId]);

  useEffect(() => {
    if (!product) return;

    const nextFields = {};
    orderFields.forEach((field) => {
      nextFields[field.key] = '';
    });

    setFieldValues(nextFields);
    setFieldErrors({});
    setQuantity(quantityMeta.minQty);
    setQuantityInput(String(quantityMeta.minQty));
    setQuantityError('');
    setIsSubmitting(false);
    setStatusCard({ tone: 'info', title: '', message: '' });
    setSuccessfulOrderId(null);
    setSuccessMeta({ amount: '', identifier: '', orderNumber: '' });
  }, [orderFields, product?.id, quantityMeta.minQty]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (successfulOrderId) return;
      if (event.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isSubmitting, onClose, successfulOrderId]);

  useEffect(() => {
    let active = true;
    if (!isOpen) return undefined;

    if (Array.isArray(currencies) && currencies.length > 0) {
      setIsPreparing(false);
      return () => {
        active = false;
      };
    }

    setIsPreparing(true);
    Promise.resolve(loadCurrencies())
      .finally(() => {
        if (active) setIsPreparing(false);
      });

    return () => {
      active = false;
    };
  }, [currencies, isOpen, loadCurrencies]);

  const userCurrencyCode = String(user?.currency || 'USD').toUpperCase();
  const pricingGroup = user?.groupId || user?.group || 'Normal';
  const pricingGroupPercentage = user?.groupPercentage ?? null;
  const pricingSnapshot = useMemo(() => {
    if (!product) {
      return { unitPriceBase: 0, unitPrice: 0 };
    }

    return {
      unitPriceBase: calculateProductPrice(product, pricingGroup, pricingGroupPercentage),
      unitPrice: resolveProductUnitPrice(product, userCurrencyCode, currencies, pricingGroup, pricingGroupPercentage),
    };
  }, [currencies, groupsLastLoadedAt, pricingGroup, pricingGroupPercentage, product, userCurrencyCode]);

  if (!isOpen || !product) return null;

  const productState = resolvePurchaseState(product, language, copy);
  const isApproved = isApprovedAccountStatus(user?.status);
  const userCurrency = getCurrencyMeta(userCurrencyCode, currencies);
  const unitPriceBase = pricingSnapshot.unitPriceBase;
  const unitPrice = pricingSnapshot.unitPrice;
  const totalPrice = normalizeMoneyAmount(unitPrice * quantity);
  const hasValidAmount = Number.isFinite(totalPrice) && totalPrice > 0;
  const balance = normalizeMoneyAmount(user?.coins || 0);
  const creditLimit = normalizeMoneyAmount(Math.max(0, Number(user?.creditLimit || 0)));
  const spendableBalance = normalizeMoneyAmount(balance + creditLimit);
  const canAfford = spendableBalance >= totalPrice;

  const unitPriceNumber = Number(unitPrice);
  const formattedUnitPrice = Number.isFinite(unitPriceNumber)
    ? formatCurrencyAmount(unitPriceNumber, userCurrencyCode, currencies, locale, {
      maximumFractionDigits: 5,
      minimumFractionDigits: 0,
    })
    : formatCurrencyAmount(unitPrice, userCurrencyCode, currencies, locale);
  const formattedTotalPrice = formatCurrencyAmount(totalPrice, userCurrencyCode, currencies, locale, {
    maximumFractionDigits: 4,
    minimumFractionDigits: 0,
  });
  const missingAmount = formatCurrencyAmount(Math.max(0, totalPrice - spendableBalance), userCurrencyCode, currencies, locale);

  const hasQuantityInput = String(quantityInput ?? '').trim().length > 0;
  const selectedQuantityIsValid = (
    hasQuantityInput
    && !quantityError
    && quantity === clampProductQuantity(quantity, product)
  );
  const canSubmit = (
    productState.isPurchasable
    && isApproved
    && canAfford
    && hasValidAmount
    && selectedQuantityIsValid
    && !isPreparing
    && !isSubmitting
    && statusCard.tone !== 'success'
  );

  const availabilityLabel = productState.isPurchasable
    ? (productState.badgeLabel || copy.available)
    : (productState.badgeLabel || copy.unavailable);

  const availabilityVariant = productState.isPurchasable ? 'success' : (productState.badgeColor || 'warning');
  const StatusIcon = statusToneIcon[statusCard.tone] || AlertCircle;

  const handleClose = () => {
    if (isSubmitting) return;
    setSuccessfulOrderId(null);
    setSuccessMeta({ amount: '', identifier: '', orderNumber: '' });
    onClose();
  };

  const handleSuccessDismiss = () => {
    setSuccessfulOrderId(null);
    setSuccessMeta({ amount: '', identifier: '', orderNumber: '' });
    onClose();
  };

  const handleOpenOrderDetails = () => {
    const orderId = String(successfulOrderId || '').trim();
    if (!orderId) {
      handleSuccessDismiss();
      return;
    }

    setSuccessfulOrderId(null);
    setSuccessMeta({ amount: '', identifier: '', orderNumber: '' });
    onClose();
    navigate(`/orders?orderId=${encodeURIComponent(orderId)}`);
  };

  const handleCopyOrderNumber = async () => {
    const orderNumber = String(successMeta.orderNumber || successfulOrderId || '').trim();
    if (!orderNumber) return;

    try {
      await navigator.clipboard.writeText(orderNumber);
      addToast(language === 'en' ? 'Order number copied' : 'تم نسخ رقم الطلب', 'success');
    } catch (_error) {
      addToast(language === 'en' ? 'Unable to copy order number' : 'تعذر نسخ رقم الطلب', 'error');
    }
  };

  const handleFieldChange = (fieldKey, value) => {
    setFieldValues((prev) => ({
      ...prev,
      [fieldKey]: sanitizeOrderFieldValue(value),
    }));

    setFieldErrors((prev) => {
      if (!prev[fieldKey]) return prev;
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
  };

  const applyQuantity = (rawValue) => {
    const raw = String(rawValue ?? '');
    setQuantityInput(raw);

    const trimmed = raw.trim();
    if (!trimmed) {
      setQuantityError('');
      return;
    }

    const numeric = Number(trimmed);
    if (!Number.isFinite(numeric)) {
      setQuantityError(copy.invalidQuantity);
      return;
    }

    const normalized = clampProductQuantity(numeric, product);
    if (normalized !== numeric) {
      setQuantityError(copy.invalidQuantity);
      return;
    }

    setQuantity(numeric);
    setQuantityError('');
  };

  const handleQuantityBlur = () => {
    const trimmed = String(quantityInput ?? '').trim();
    if (!trimmed) {
      setQuantityInput(String(quantity));
      setQuantityError('');
      return;
    }

    const numeric = Number(trimmed);
    if (!Number.isFinite(numeric)) {
      setQuantityInput(String(quantity));
      setQuantityError('');
      return;
    }

    const normalized = clampProductQuantity(numeric, product);
    setQuantity(normalized);
    setQuantityInput(String(normalized));
    setQuantityError(normalized !== numeric ? copy.invalidQuantity : '');
  };

  const handleSubmit = async () => {
    const nextErrors = {};
    orderFields.forEach((field) => {
      const label = resolveFieldLabel(field, language);
      if (isFieldRequired(field) && !String(fieldValues[field.key] || '').trim()) {
        nextErrors[field.key] = copy.fieldRequired(label);
      }
    });

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    if (!selectedQuantityIsValid) {
      setQuantityError(copy.invalidQuantity);
      return;
    }

    if (!productState.isPurchasable) {
      const message = productState.helperText || copy.unavailableMessage;
      setStatusCard({ tone: 'warning', title: copy.unavailableTitle, message });
      addToast(message, 'warning');
      return;
    }

    if (!isApproved) {
      setStatusCard({ tone: 'warning', title: copy.pendingTitle, message: copy.pendingMessage });
      addToast(copy.pendingMessage, 'warning');
      return;
    }

    if (!canAfford) {
      const message = copy.insufficientMessage(missingAmount);
      setStatusCard({ tone: 'danger', title: copy.insufficientTitle, message });
      addToast(copy.insufficientTitle, 'error');
      return;
    }

    if (!hasValidAmount) {
      addToast(copy.invalidAmountMessage, 'error');
      return;
    }

    setIsSubmitting(true);
    setStatusCard({ tone: 'info', title: copy.preparingTitle, message: copy.preparingMessage });

    try {
      // Refresh the catalog — loadProducts updates the Zustand store in place,
      // its promise does NOT resolve to the products array.
      await loadProducts({ force: true }).catch(() => null);
      const freshCatalog = useMediaStore.getState().products;
      const catalogArray = Array.isArray(freshCatalog) ? freshCatalog : [];
      const selectedProductId = resolveProductId(product);
      const freshProduct = catalogArray.find((p) => String(p._id || p.id).trim() === selectedProductId) || null;

      if (!freshProduct) {
        const message = language === 'en'
          ? 'This product is no longer available. The catalog has been refreshed.'
          : 'هذا المنتج لم يعد متاحًا. تم تحديث المنتجات من السيرفر.';
        setStatusCard({ tone: 'warning', title: copy.unavailableTitle, message });
        addToast(message, 'warning');
        return;
      }

      const freshProductState = resolvePurchaseState(freshProduct, language, copy);
      if (!freshProductState.isPurchasable) {
        const message = freshProductState.helperText || copy.unavailableMessage;
        setStatusCard({ tone: 'warning', title: copy.unavailableTitle, message });
        addToast(message, 'warning');
        return;
      }

      const freshUnitPriceBase = calculateProductPrice(freshProduct, pricingGroup, pricingGroupPercentage);
      const freshUnitPrice = resolveProductUnitPrice(freshProduct, userCurrencyCode, currencies, pricingGroup, pricingGroupPercentage);
      const freshTotalPrice = normalizeMoneyAmount(freshUnitPrice * quantity);

      if (freshTotalPrice !== totalPrice) {
        const message = language === 'en'
          ? 'The product price has changed. Review the updated price before buying.'
          : 'سعر المنتج اتغير. راجع السعر الجديد قبل تنفيذ الطلب.';
        setStatusCard({ tone: 'warning', title: language === 'en' ? 'Price updated' : 'تم تحديث السعر', message });
        addToast(message, 'warning');
        return;
      }

      const normalizedFields = Object.fromEntries(
        orderFields.map((field) => [
          field.key,
          sanitizeOrderFieldValue(fieldValues[field.key]).trim(),
        ])
      );

      const firstCustomInputValue = Object.values(normalizedFields)
        .map((value) => String(value || '').trim())
        .find(Boolean) || '';
      const userIdentifier = String(
        normalizedFields.playerId
        || normalizedFields.uid
        || normalizedFields.email
        || normalizedFields.phone
        || normalizedFields.username
        || firstCustomInputValue
        || ''
      ).trim();
      const dynamicFieldSnapshot = Array.isArray(freshProduct?.dynamicFields) && freshProduct.dynamicFields.length > 0
        ? freshProduct.dynamicFields.map((field) => ({ ...field }))
        : null;
      const fieldsSnapshot = Array.isArray(freshProduct?.orderFields) && freshProduct.orderFields.length > 0
        ? freshProduct.orderFields.map((field) => ({ ...field }))
        : (dynamicFieldSnapshot || orderFields.map((field) => ({
          key: field.key,
          label: field.label,
          placeholder: field.placeholder,
        })));
      const freshQuantityMeta = getProductQuantityMeta(freshProduct);

      const createResult = await addOrder({
        id: `ord-${Date.now()}`,
        userId: user.id,
        productId: freshProduct.id,
        productName: freshProduct.name,
        productNameAr: freshProduct.nameAr,
        quantity,
        unitPrice: freshUnitPrice,
        unitPriceBase: freshUnitPriceBase,
        priceCoins: freshTotalPrice,
        currencyCode: userCurrencyCode,
        exchangeRateAtExecution: userCurrency.rate,
        playerId: userIdentifier,
        customInputs: normalizedFields,
        orderFields: normalizedFields,
        orderFieldsValues: normalizedFields,
        customerInput: {
          values: normalizedFields,
          fieldsSnapshot,
          quantitySnapshot: freshQuantityMeta,
        },
        quantitySnapshot: freshQuantityMeta,
        status: 'pending',
        createdAt: new Date().toISOString(),
        idempotencyKey: `${user.id}-${product.id}-${userIdentifier}-${Date.now()}`,
      });

      const nextBalance = Number(createResult?.updatedBalance);
      if (Number.isFinite(nextBalance)) {
        updateUserSession({ coins: normalizeMoneyAmount(nextBalance) });
      } else {
        updateUserSession({ coins: normalizeMoneyAmount(balance - totalPrice) });
      }

      const createdOrder = createResult?.order || createResult || {};
      const createdOrderId = String(createdOrder?.id || createdOrder?.orderId || '').trim();
      const createdOrderNumber = String(
        createdOrder?.siteOrderNumber
        || createdOrder?.orderNumber
        || createdOrder?.id
        || createdOrderId
      ).trim();
      const storedOrderId = createdOrderId || `ord-${Date.now()}`;
      const nextSuccessMeta = {
        amount: formattedTotalPrice,
        identifier: userIdentifier,
        orderNumber: createdOrderNumber,
      };
      if (typeof onOrderSuccess === 'function') {
        onOrderSuccess({
          orderId: storedOrderId,
          ...nextSuccessMeta,
        });
        onClose();
        return;
      }

      setSuccessfulOrderId(storedOrderId);
      setSuccessMeta(nextSuccessMeta);
      setStatusCard({ tone: 'success', title: copy.successTitle, message: copy.successMessage });
      addToast(
        language === 'en' ? 'Order placed successfully!' : 'تم إرسال الطلب بنجاح!',
        'success'
      );
    } catch (error) {
      console.error('Order submission false-negative details:', error, error?.response?.data);

      if (String(error?.code || '').toUpperCase() === 'PROVIDER_PRICE_INCREASED') {
        const priceMsg = language === 'en'
          ? 'The price for this service has been updated by the provider. Please refresh and review the new price.'
          : 'عفواً، تم تحديث سعر هذه الخدمة من المصدر. برجاء تحديث الصفحة لرؤية السعر الجديد.';
        setStatusCard({ tone: 'warning', title: language === 'en' ? 'Price Updated' : 'تم تحديث السعر', message: priceMsg });
        addToast(priceMsg, 'warning');
      } else {
        const backendMessage = error?.response?.data?.message || error?.message || '';
        const message = backendMessage || (language === 'en' ? 'Unable to complete order. Please contact support.' : 'تعذر تنفيذ الطلب اتصل بالمسؤول');
        if (String(error?.code || '').toUpperCase() !== 'INVALID_ORDER_AMOUNT') {
          devLogger.warnUnlessBenign('Order submit error:', error);
        }
        setStatusCard({ tone: 'danger', title: copy.failedTitle, message });
        addToast(message, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="fixed inset-0 z-[80]">
          <motion.button
            type="button"
            className="absolute inset-0 w-full bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            aria-label={copy.closeLabel}
          />

          <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-5">
            {!successfulOrderId ? (
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-label={productTitle}
              initial={{ opacity: 0, y: 40, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 22, scale: 0.99 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative flex max-h-[min(94vh,56rem)] w-full max-w-[26rem] flex-col overflow-hidden rounded-[2rem] border border-cyan-400/24 bg-[linear-gradient(135deg,rgba(34,211,238,0.04),rgba(168,85,247,0.02))] text-[var(--color-text)] shadow-[0_0_0_1px_rgba(34,211,238,0.16),0_0_64px_rgba(34,211,238,0.18),0_32px_72px_-32px_rgba(168,85,247,0.28)] ring-1 ring-cyan-400/20 sm:rounded-[2.5rem]"
            >
              <header className="border-b border-cyan-400/12 px-3 py-3 sm:px-4 sm:py-3.5">
                <div className="mb-4 flex items-start justify-between gap-2 sm:mb-6">
                  <div className="flex-1">
                    <h2 className="text-lg font-bold tracking-tight text-[var(--color-text)] sm:text-2xl">
                      {productTitle}
                    </h2>
                    {productSubtitle ? (
                      <p className="mt-0.5 text-[10px] text-cyan-300/88 sm:text-xs font-semibold">
                        {productSubtitle}
                      </p>
                    ) : null}
                  </div>
                  {product?.image ? (
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-cyan-400/16 bg-cyan-400/3 sm:h-12 sm:w-12">
                      <img
                        src={resolveImageUrl(product.image)}
                        alt={productTitle}
                        loading="eager"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center shrink-0 rounded-lg border border-cyan-400/16 bg-cyan-400/3 sm:h-12 sm:w-12">
                      <Package2 className="h-5 w-5 text-cyan-400/48 sm:h-6 sm:w-6" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/8 text-cyan-400 transition-all hover:bg-cyan-400/16 hover:border-cyan-400/32 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:w-10"
                    aria-label={copy.closeLabel}
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>

                {/* Total - Fixed at top */}
                <div className="mb-3 rounded-lg border border-cyan-400/20 bg-cyan-400/6 p-2 text-center sm:mb-3 sm:rounded-lg sm:p-2">
                  <p className="text-[10px] text-cyan-400/72 font-medium">{copy.total}</p>
                  <p className="mt-1 text-sm font-bold text-cyan-300 sm:text-base">{formattedTotalPrice}</p>
                </div>

                {productDescription ? (
                  <p className="mt-2 text-[10px] leading-4 text-[color:rgb(var(--color-text-rgb)/0.7)] sm:mt-2 sm:text-xs sm:leading-4">
                    {productDescription}
                  </p>
                ) : null}
              </header>

              <div className="flex-1 space-y-2.5 overflow-y-auto px-3 py-3 sm:px-4 sm:py-3.5">
                {/* Quantity */}
                <div className="rounded-lg border border-cyan-400/16 bg-cyan-400/4 p-2.5 sm:rounded-lg sm:p-3">
                  <label className="mb-2 block text-xs font-bold text-[var(--color-text)]">{copy.countTitle}</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={quantityInput}
                    onChange={(event) => applyQuantity(event.target.value)}
                    onBlur={handleQuantityBlur}
                    disabled={isSubmitting}
                    placeholder={language === 'en' ? 'Enter quantity' : 'اكتب الكمية'}
                    className="h-9 rounded-lg border border-cyan-400/24 bg-cyan-400/8 text-sm text-[var(--color-text)] placeholder:text-cyan-400/48 focus:border-cyan-400/48 focus:bg-cyan-400/12 disabled:cursor-not-allowed disabled:opacity-60 sm:h-9 sm:text-sm"
                  />
                  <p className="mt-1 text-[9px] text-cyan-400/72 font-medium">
                    {copy.min} {quantityMeta.minQty} • {copy.max} {quantityMeta.maxQty}
                  </p>
                  {quantityError ? (
                    <p className="mt-1 text-[9px] font-semibold text-red-400">{quantityError}</p>
                  ) : null}
                </div>

                {orderFields.length > 0 ? (
                  <section className="rounded-lg border border-cyan-400/16 bg-cyan-400/4 p-3 sm:rounded-lg sm:p-3.5">
                    <h3 className="mb-2 text-xs font-bold text-[var(--color-text)]">{copy.orderFields}</h3>
                    <div className="space-y-2">
                        {orderFields.map((field) => {
                          const label = resolveFieldLabel(field, language);
                          const fieldType = resolveFieldType(field);
                          const options = resolveSelectOptions(field);
                          const fallbackAsInput = fieldType === 'select' && options.length === 0;

                          if (fieldType === 'select' && !fallbackAsInput) {
                            return (
                              <div key={field.key}>
                                <label className={purchaseLabelClass}>
                                  {label}
                                  {isFieldRequired(field) ? ' *' : ''}
                                </label>
                                <select
                                  value={fieldValues[field.key] || ''}
                                  onChange={(event) => handleFieldChange(field.key, event.target.value)}
                                  disabled={isSubmitting || statusCard.tone === 'success'}
                                  className="h-9 w-full rounded-md border border-[color:rgb(var(--color-border-rgb)/0.62)] bg-[color:rgb(var(--color-card-rgb)/0.86)] px-3 text-xs text-[var(--color-text)] outline-none transition-colors focus:border-[color:rgb(var(--color-primary-rgb)/0.55)] focus:bg-[color:rgb(var(--color-card-rgb)/0.96)] disabled:opacity-70 dark:border-white/15 dark:bg-white/8 dark:text-white dark:focus:border-[#22d3ee]/45 dark:focus:bg-white/12 sm:h-10 sm:rounded-lg sm:text-[13px]"
                                >
                                  <option value="" className={purchaseOptionClass}>
                                    {field.placeholder || copy.placeholder(label)}
                                  </option>
                                  {options.map((option) => (
                                    <option key={option.value} value={option.value} className={purchaseOptionClass}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                                {fieldErrors[field.key] ? (
                                  <p className="mt-1 text-xs text-[#ffb4b4]">{fieldErrors[field.key]}</p>
                                ) : null}
                              </div>
                            );
                          }

                          return (
                            <Input
                              key={field.key}
                              label={`${label}${isFieldRequired(field) ? ' *' : ''}`}
                              type={fieldType === 'number' ? 'number' : fieldType === 'email' ? 'email' : 'text'}
                              inputMode={fieldType === 'number' ? 'decimal' : undefined}
                              value={fieldValues[field.key] || ''}
                              onChange={(event) => handleFieldChange(field.key, event.target.value)}
                              error={fieldErrors[field.key]}
                              placeholder={field.placeholder || copy.placeholder(label)}
                              autoComplete="off"
                              spellCheck={false}
                              disabled={isSubmitting || statusCard.tone === 'success'}
                              className={purchaseFieldClass}
                            />
                          );
                        })}
                      </div>
                    </section>
                  ) : null}

                {!canAfford && isApproved && productState.isPurchasable ? (
                  <div className="rounded-xl border border-red-500/32 bg-red-500/8 p-4 sm:rounded-2xl sm:p-5">
                    <p className="text-sm font-bold text-red-400 sm:text-base">{copy.insufficientTitle}</p>
                    <p className="mt-2 text-xs text-red-400/88 sm:text-sm">{copy.insufficientMessage(missingAmount)}</p>
                  </div>
                ) : null}

                {!isApproved ? (
                  <div className="rounded-xl border border-amber-500/32 bg-amber-500/8 p-4 sm:rounded-2xl sm:p-5">
                    <p className="text-sm font-bold text-amber-400 sm:text-base">{copy.pendingTitle}</p>
                    <p className="mt-2 text-xs text-amber-400/88 sm:text-sm">{copy.pendingMessage}</p>
                  </div>
                ) : null}

                {!productState.isPurchasable ? (
                  <div className="rounded-xl border border-[color:rgb(var(--color-warning-rgb)/0.36)] bg-[color:rgb(var(--color-warning-rgb)/0.14)] p-2.5 sm:rounded-2xl sm:p-3">
                    <p className={purchaseNoticeTitleClass}>{copy.unavailableTitle}</p>
                    <p className={purchaseNoticeTextClass}>{productState.helperText || copy.unavailableMessage}</p>
                  </div>
                ) : null}

              </div>

              <footer className="border-t border-cyan-400/12 bg-gradient-to-t from-cyan-400/3 to-transparent px-3 py-3 sm:px-4 sm:py-3.5">
                {statusCard.message && !successfulOrderId ? (
                  <div className={`mb-4 flex items-start gap-3 rounded-lg border px-3.5 py-3 text-xs sm:mb-5 sm:rounded-xl ${statusToneStyles[statusCard.tone] || statusToneStyles.info}`}>
                    <StatusIcon className={cn('mt-0.5 h-5 w-5 shrink-0', statusCard.tone === 'info' && isSubmitting && 'animate-spin')} />
                    <div>
                      {statusCard.title ? <p className="font-semibold leading-5">{statusCard.title}</p> : null}
                      <p className={cn('text-xs leading-5', statusCard.title && 'mt-1.5')}>{statusCard.message}</p>
                    </div>
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="h-9 rounded-lg border-cyan-400/28 bg-gradient-to-r from-cyan-500/88 via-fuchsia-500/84 to-cyan-500/80 text-white shadow-[0_0_36px_rgba(34,211,238,0.32),0_24px_52px_-30px_rgba(34,211,238,0.64)] hover:brightness-110 disabled:opacity-60 sm:h-9 sm:rounded-lg sm:text-sm font-semibold"
                  >
                    {isSubmitting ? copy.processing : copy.buy}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="h-9 rounded-lg border-cyan-400/24 bg-cyan-400/6 text-cyan-200 hover:border-cyan-400/40 hover:bg-cyan-400/12 disabled:opacity-60 sm:h-9 sm:rounded-lg sm:text-sm"
                  >
                    {copy.cancel}
                  </Button>
                </div>

                {isAutoSupplierProduct ? (
                  <p className="mt-2 text-center text-[9px] text-cyan-400/72 font-medium sm:mt-2">
                    ⚡ {copy.auto24Hint}
                  </p>
                ) : null}

                <div className="mt-2 flex justify-center sm:mt-2">
                  <Badge variant="premium" className="gap-1.5 px-2.5 py-1 text-[9px] sm:text-[10px] font-semibold">
                    <Zap className="h-3 w-3" />
                    {copy.quickOrder}
                  </Badge>
                </div>
              </footer>
            </motion.section>
            ) : null}
          </div>

          <AnimatePresence>
            {successfulOrderId ? (
              <div className="absolute inset-0 z-[90] flex items-center justify-center p-4">
                <motion.div
                  role="button"
                  tabIndex={0}
                  aria-label={copy.closeLabel}
                  onClick={handleSuccessDismiss}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleSuccessDismiss();
                    }
                  }}
                  className="absolute inset-0 bg-[rgba(7,3,16,0.86)] backdrop-blur-md"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />

                <motion.section
                  role="dialog"
                  aria-modal="true"
                  initial={{ opacity: 0, scale: 0.96, y: 22 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: 14 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="relative z-10 w-full max-w-sm overflow-hidden rounded-[1.75rem] border border-fuchsia-300/35 bg-[radial-gradient(circle_at_top,rgba(217,70,239,0.24),rgba(88,28,135,0.13)_48%,rgba(5,4,10,0.98)_100%)] p-5 text-white shadow-[0_0_42px_rgba(217,70,239,0.28),0_28px_90px_-44px_rgba(88,28,135,0.72)] ring-1 ring-fuchsia-300/20"
                >
                  <div className="pointer-events-none absolute inset-x-8 -top-24 h-40 rounded-full bg-fuchsia-500/28 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-28 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-violet-600/28 blur-3xl" />

                  <div className="relative flex flex-col items-center text-center">
                    <div className="relative h-24 w-24">
                      <motion.span
                        className="absolute inset-2 rounded-full border border-fuchsia-300/35"
                        initial={{ scale: 0.72, opacity: 0 }}
                        animate={{ scale: 1.32, opacity: 0 }}
                        transition={{ duration: 0.9, ease: 'easeOut' }}
                      />
                      <motion.span
                        className="absolute inset-0 rounded-full bg-fuchsia-500/12"
                        initial={{ scale: 0.82, opacity: 0 }}
                        animate={{ scale: [0.82, 1.05, 1], opacity: [0, 1, 0.72] }}
                        transition={{ duration: 0.52, ease: 'easeOut' }}
                      />
                      <motion.span
                        className="absolute inset-3 inline-flex items-center justify-center rounded-full border border-fuchsia-300/42 bg-[linear-gradient(135deg,rgba(217,70,239,0.24),rgba(109,40,217,0.18))] text-fuchsia-100 shadow-[0_0_30px_rgba(217,70,239,0.55),0_18px_42px_-26px_rgba(168,85,247,0.82)]"
                        initial={{ scale: 0.5, rotate: -8, opacity: 0 }}
                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                        transition={{ duration: 0.34, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <motion.span
                          initial={{ scale: 0.4, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.22, delay: 0.22, ease: 'easeOut' }}
                        >
                          <CheckCircle2 className="h-11 w-11" strokeWidth={2.2} />
                        </motion.span>
                      </motion.span>
                    </div>

                    <motion.h3
                      className="mt-2 text-xl font-bold text-white"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.24, delay: 0.18, ease: 'easeOut' }}
                    >
                      {copy.successDone}
                    </motion.h3>
                    <motion.p
                      className="mt-2 text-sm leading-6 text-fuchsia-100/78"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.24, delay: 0.24, ease: 'easeOut' }}
                    >
                      {copy.successMessage}
                    </motion.p>
                  </div>

                  <motion.div
                    className="relative mt-5 space-y-2"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.28, ease: 'easeOut' }}
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-[1rem] border border-fuchsia-300/20 bg-white/[0.06] px-3 py-2 text-start shadow-[0_12px_30px_-26px_rgba(217,70,239,0.5)]">
                        <p className="text-[10px] font-semibold text-fuchsia-100/55">
                          {language === 'en' ? 'Amount' : 'المبلغ'}
                        </p>
                        <p className="mt-0.5 text-[13px] font-bold text-fuchsia-200">
                          {successMeta.amount || formattedTotalPrice}
                        </p>
                      </div>

                      <div className="rounded-[1rem] border border-fuchsia-300/20 bg-white/[0.06] px-3 py-2 text-start shadow-[0_12px_30px_-26px_rgba(217,70,239,0.5)]">
                        <p className="text-[10px] font-semibold text-fuchsia-100/55">
                          {language === 'en' ? 'User ID' : 'معرف المستخدم'}
                        </p>
                        <p className="mt-0.5 truncate text-[12px] font-semibold text-white/85" dir="ltr">
                          {successMeta.identifier || '-'}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-[1rem] border border-fuchsia-300/20 bg-white/[0.06] px-3 py-2 text-start shadow-[0_12px_30px_-26px_rgba(217,70,239,0.5)]">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold text-fuchsia-100/55">
                            {language === 'en' ? 'Order No.' : 'رقم الطلب'}
                          </p>
                          <p className="mt-0.5 truncate text-[12px] font-semibold text-white/85" dir="ltr">
                            {successMeta.orderNumber || successfulOrderId || '-'}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleCopyOrderNumber}
                          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-fuchsia-300/28 bg-white/[0.08] text-fuchsia-100/75 transition hover:bg-fuchsia-500/18 hover:text-white"
                          aria-label={language === 'en' ? 'Copy order number' : 'نسخ رقم الطلب'}
                          title={language === 'en' ? 'Copy order number' : 'نسخ رقم الطلب'}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    className="relative mt-5 grid grid-cols-2 gap-2.5"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.26, delay: 0.34, ease: 'easeOut' }}
                  >
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSuccessDismiss}
                      className="h-11 rounded-[0.95rem] border-fuchsia-300/28 bg-white/[0.06] text-white hover:bg-fuchsia-500/12"
                    >
                      {copy.cancel}
                    </Button>
                    <Button
                      type="button"
                      onClick={handleOpenOrderDetails}
                      className="h-11 rounded-[0.95rem] bg-[linear-gradient(135deg,rgba(109,40,217,0.96),rgba(217,70,239,0.9),rgba(168,85,247,0.88))] text-white shadow-[0_0_28px_rgba(217,70,239,0.34),0_20px_36px_-24px_rgba(168,85,247,0.86)] hover:brightness-[1.06]"
                    >
                      {copy.successViewOrder}
                    </Button>
                  </motion.div>
                </motion.section>
              </div>
            ) : null}
          </AnimatePresence>
        </div>
      ) : null}
    </AnimatePresence>
  );
};

export default ProductPurchaseSheet;
