import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Box,
  Check,
  Copy,
  FileText,
  Hash,
  Home,
  LockKeyhole,
  LoaderCircle,
  Package,
  ShoppingBag,
  UserRound,
  WalletCards,
  X,
  Zap,
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useOrderStore from '../store/useOrderStore';
import useSystemStore from '../store/useSystemStore';
import useMediaStore from '../store/useMediaStore';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../components/ui/Toast';
import {
  calculateProductPrice,
  getCurrencyMeta,
  resolveProductUnitPrice,
} from '../utils/pricing';
import { getReadableErrorMessage } from '../utils/errorMessages';
import {
  clampProductQuantity,
  getProductQuantityMeta,
  resolveProductOrderFields,
  sanitizeOrderFieldValue,
} from '../utils/productPurchase';
import { formatRawPriceString, normalizeMoneyAmount, toRawPriceString } from '../utils/money';
import { devLogger } from '../utils/devLogger';
import { resolveImageUrl } from '../utils/imageUrl';
import { isBackofficeRole } from '../utils/authRoles';
import './ProductPurchasePage.css';

const getCopy = (language = 'ar') => {
  if (language === 'en') {
    return {
      total: 'Total Amount',
      quantity: 'Quantity',
      quantityPlaceholder: 'Enter quantity',
      minQuantity: 'Min',
      maxQuantity: 'Max',
      userId: 'User ID',
      userIdPlaceholder: 'Enter your user ID',
      buyNow: 'Buy Now',
      buying: 'Processing...',
      successTitle: 'Top-up Completed',
      successMessage: 'Your order has been shipped successfully. The details are shown below.',
      orderSummary: 'Order Summary',
      product: 'Product',
      price: 'Total Price',
      orderNumber: 'Order Number',
      orderDetails: 'View Order Details',
      backHome: 'Back to Home',
      close: 'Close',
      loading: 'Loading product...',
      balance: 'Balance',
    };
  }

  return {
    total: 'الإجمالي',
    quantity: 'الكمية',
    quantityPlaceholder: 'أدخل الكمية',
    minQuantity: 'الحد الأدنى',
    maxQuantity: 'الحد الأقصى',
    userId: 'ID المستخدم',
    userIdPlaceholder: 'أدخل ID المستخدم',
    buyNow: 'شراء الآن',
    buying: 'جاري تنفيذ الطلب...',
    successTitle: 'تم الشحن بنجاح',
    successMessage: 'تم تنفيذ طلبك بنجاح، وتفاصيل الشحن ظاهرة بالأسفل.',
    orderSummary: 'ملخص الطلب',
    product: 'المنتج',
    price: 'السعر الإجمالي',
    orderNumber: 'رقم الطلب',
    orderDetails: 'عرض تفاصيل الطلب',
    backHome: 'العودة للرئيسية',
    close: 'إغلاق',
    loading: 'جاري تحميل المنتج...',
    balance: 'الرصيد',
  };
};

const formatCount = (value) => Number(value || 0).toLocaleString('en-US');

const normalizeDisplayDecimal = (value) => {
  const raw = String(value ?? '0').trim();
  if (!/^-?\d+(\.\d+)?$/.test(raw)) return raw || '0';

  const fraction = raw.split('.')[1] || '';
  const looksLikeFloatArtifact = fraction.length > 10 && /(0{6,}\d+$|9{6,}\d*$)/.test(fraction);
  if (looksLikeFloatArtifact) {
    return toRawPriceString(normalizeMoneyAmount(Number(raw)));
  }

  return toRawPriceString(raw);
};

const multiplyRawDecimalByInteger = (value, multiplier = 1) => {
  const raw = String(value ?? '0').trim();
  const integerMultiplier = Math.max(0, Math.trunc(Number(multiplier) || 0));

  if (!raw || integerMultiplier === 0) return '0';
  if (!/^-?\d+(\.\d+)?$/.test(raw)) return normalizeDisplayDecimal(raw);

  const isNegative = raw.startsWith('-');
  const unsigned = isNegative ? raw.slice(1) : raw;
  const [integerPart, fractionPart = ''] = unsigned.split('.');
  const scale = fractionPart.length;
  const base = BigInt(`${integerPart || '0'}${fractionPart}` || '0');
  const multiplied = base * BigInt(integerMultiplier);
  const digits = multiplied.toString().padStart(scale + 1, '0');

  if (scale === 0) {
    return normalizeDisplayDecimal(`${isNegative ? '-' : ''}${digits}`);
  }

  const whole = digits.slice(0, -scale) || '0';
  const fraction = digits.slice(-scale);

  return normalizeDisplayDecimal(`${isNegative ? '-' : ''}${whole}.${fraction}`);
};

const formatTotalPriceString = (value, fractionDigits = 2) => {
  const raw = normalizeDisplayDecimal(value);
  const match = String(raw).trim().match(/^([+-]?)(\d+)(?:\.(\d+))?$/);

  if (!match) return formatRawPriceString(raw);

  const [, sign, integerPart, fractionPart = ''] = match;
  const safeFractionDigits = Math.max(0, Math.trunc(Number(fractionDigits) || 0));
  const paddedFraction = fractionPart.padEnd(safeFractionDigits + 1, '0');
  const keptFraction = paddedFraction.slice(0, safeFractionDigits);
  const shouldRoundUp = Number(paddedFraction[safeFractionDigits] || 0) >= 5;

  const scaledRaw = `${integerPart}${keptFraction}` || '0';
  const roundedScaled = shouldRoundUp ? (BigInt(scaledRaw) + 1n).toString() : scaledRaw;

  if (safeFractionDigits === 0) {
    return formatRawPriceString(`${sign}${roundedScaled}`);
  }

  const paddedRounded = roundedScaled.padStart(safeFractionDigits + 1, '0');
  const nextIntegerPart = paddedRounded.slice(0, -safeFractionDigits) || '0';
  const roundedFractionPart = paddedRounded.slice(-safeFractionDigits);
  const nextFractionPart = /^0+$/.test(roundedFractionPart) ? '' : roundedFractionPart;
  const displayValue = `${sign}${nextIntegerPart}${nextFractionPart ? `.${nextFractionPart}` : ''}`;

  return formatRawPriceString(displayValue);
};

const isQuantityOnlyUser = (user) => (
  String(user?.billingMode || user?.group?.billingMode || '').trim().toLowerCase() === 'quantity_only'
);

const SummaryValue = ({ value, dir = 'auto' }) => {
  if (value === null || value === undefined || value === '') {
    return <span className="purchase-skeleton purchase-skeleton--text" aria-hidden="true" />;
  }

  return <strong dir={dir}>{value}</strong>;
};

const sanitizeQuantityInput = (value) => String(value ?? '').replace(/,/g, '').replace(/[^\d]/g, '');

const formatQuantityInput = (value) => {
  const rawValue = sanitizeQuantityInput(value);
  if (!rawValue) return '';

  const numericValue = Number.parseInt(rawValue, 10);
  return Number.isFinite(numericValue) ? numericValue.toLocaleString('en-US') : '';
};

const normalizePurchaseFieldLabel = (label, language = 'ar') => {
  const text = String(label || '').trim();
  if (language !== 'ar') return text;

  const compact = text.replace(/\s+/g, '');
  if (compact === 'معرفالمستخدم') return 'ايدي المستخدم';

  return text;
};

const getPurchaseOrderFieldKey = (field, index = 0) => (
  String(field?.key || field?.name || field?.id || `orderField_${index}`).trim() || `orderField_${index}`
);

const normalizePurchaseFieldOptions = (field) => (
  Array.isArray(field?.options) ? field.options : []
).map((option, index) => {
  if (option && typeof option === 'object') {
    const value = String(option.value ?? option.id ?? option.key ?? option.label ?? index).trim();
    const label = String(option.label ?? option.name ?? option.title ?? value).trim();
    return { value, label: label || value };
  }

  const value = String(option ?? '').trim();
  return { value, label: value };
}).filter((option) => option.value);

const getPurchaseFieldPlaceholder = (field, label, language = 'ar') => {
  const placeholder = String(field?.placeholder || '').trim();
  if (placeholder) return placeholder;

  return language === 'ar' ? `أدخل ${label}` : `Enter ${label}`;
};

const isPrimaryPurchaseFieldKey = (key) => {
  const normalized = String(key || '').trim().toLowerCase().replace(/[\s_-]+/g, '');
  return ['playerid', 'userid', 'uid'].includes(normalized);
};

const ProductPurchasePage = ({ product: providedProduct = null, onClose, onSubmittingChange, embedded = false }) => {
  const navigate = useNavigate();
  const { productId } = useParams();
  const { language, dir } = useLanguage();
  const { addToast } = useToast();

  const user = useAuthStore((state) => state.user);
  const updateUserSession = useAuthStore((state) => state.updateUserSession);
  const addOrder = useOrderStore((state) => state.addOrder);
  const products = useMediaStore((state) => state.products);
  const loadProducts = useMediaStore((state) => state.loadProducts);
  const currencies = useSystemStore((state) => state.currencies);
  const loadCurrencies = useSystemStore((state) => state.loadCurrencies);

  const copy = useMemo(() => getCopy(language), [language]);

  const [product, setProduct] = useState(providedProduct || null);
  const [quantityInput, setQuantityInput] = useState('');
  const [orderFieldValues, setOrderFieldValues] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(!providedProduct);
  const activeProvidedProductIdRef = useRef('');
  const successCloseRequestedRef = useRef(false);

  const quantityMeta = useMemo(() => {
    if (!product) return null;
    return getProductQuantityMeta(product);
  }, [product]);

  const orderFields = useMemo(() => {
    if (!product) return [];
    return resolveProductOrderFields(product, language);
  }, [language, product]);

  const purchaseOrderFields = useMemo(() => {
    const sourceFields = orderFields.length > 0
      ? orderFields
      : [{
        key: 'playerId',
        label: copy.userId,
        placeholder: copy.userIdPlaceholder,
        type: 'text',
        required: true,
        options: [],
      }];
    const seenKeys = new Set();

    return sourceFields
      .map((field, index) => ({
        ...field,
        key: getPurchaseOrderFieldKey(field, index),
        type: String(field?.type || 'text').toLowerCase(),
        required: field?.required !== false,
      }))
      .filter((field) => {
        const normalizedKey = String(field.key || '').trim().toLowerCase();
        if (!normalizedKey || seenKeys.has(normalizedKey)) return false;
        seenKeys.add(normalizedKey);
        return true;
      });
  }, [copy.userId, copy.userIdPlaceholder, orderFields]);

  const stopCloseEvent = (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    event?.nativeEvent?.stopImmediatePropagation?.();
  };

  const handleClose = (event) => {
    stopCloseEvent(event);
    if (isSubmitting) return;

    if (typeof onClose === 'function') {
      onClose();
      return;
    }

    navigate(-1);
  };

  const handleSuccessClose = (event) => {
    stopCloseEvent(event);
    if (successCloseRequestedRef.current) return;

    successCloseRequestedRef.current = true;
    window.setTimeout(() => {
      successCloseRequestedRef.current = false;
    }, 500);
    setIsSubmitting(false);

    if (typeof onSubmittingChange === 'function') {
      onSubmittingChange(false);
    }

    if (typeof onClose === 'function') {
      onClose({ force: true });
      return;
    }

    navigate(-1);
  };

  const handleCopyText = async (value, label) => {
    const text = String(value || '').trim();
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      addToast(
        language === 'en' ? `${label || 'Value'} copied` : `تم نسخ ${label || 'القيمة'}`,
        'success'
      );
    } catch {
      addToast(
        language === 'en' ? 'Copy failed' : 'تعذر النسخ',
        'error'
      );
    }
  };

  useEffect(() => {
    if (!providedProduct) return;

    const nextProvidedProductId = String(providedProduct.id || providedProduct._id || '').trim();
    const isDifferentProduct = activeProvidedProductIdRef.current !== nextProvidedProductId;

    setProduct(providedProduct);
    setIsLoading(false);

    if (isDifferentProduct) {
      activeProvidedProductIdRef.current = nextProvidedProductId;
      setSuccessOrder(null);
      setQuantityInput('');
      setOrderFieldValues({});
    }
  }, [providedProduct]);

  useEffect(() => {
    if (providedProduct) return;

    if (!productId) {
      navigate('/products');
      return;
    }

    let isActive = true;

    const loadProduct = async () => {
      const cachedProducts = useMediaStore.getState().products || products || [];
      const cachedProduct = cachedProducts.find((p) => String(p.id) === String(productId));

      if (cachedProduct) {
        setProduct(cachedProduct);
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }

      try {
        await loadProducts({ force: true, bypassCache: true });
        if (!isActive) return;

        const updatedProducts = useMediaStore.getState().products || [];
        const freshProduct = updatedProducts.find((p) => String(p.id) === String(productId));

        if (freshProduct) {
          setProduct(freshProduct);
        } else if (!cachedProduct) {
          navigate('/products');
        }
      } catch (error) {
        devLogger.error('Failed to load product', error);
        if (!cachedProduct) {
          navigate('/products');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadProduct();

    return () => {
      isActive = false;
    };
  }, [providedProduct, productId, navigate, loadProducts]);

  useEffect(() => {
    if (product) {
      setQuantityInput('');
      setOrderFieldValues({});
    }
  }, [product?.id]);

  useEffect(() => {
    setOrderFieldValues((currentValues) => {
      const nextValues = {};
      purchaseOrderFields.forEach((field, index) => {
        const key = getPurchaseOrderFieldKey(field, index);
        nextValues[key] = currentValues[key] || '';
      });

      const currentKeys = Object.keys(currentValues);
      const nextKeys = Object.keys(nextValues);
      const isUnchanged = currentKeys.length === nextKeys.length
        && nextKeys.every((key) => currentValues[key] === nextValues[key]);

      return isUnchanged ? currentValues : nextValues;
    });
  }, [purchaseOrderFields]);

  useEffect(() => {
    if (!currencies || currencies.length === 0) {
      loadCurrencies();
    }
  }, [currencies, loadCurrencies]);

  useEffect(() => {
    if (!successOrder) {
      successCloseRequestedRef.current = false;
      delete document.body.dataset.purchaseSuccess;
      return undefined;
    }

    document.body.dataset.purchaseSuccess = 'true';
    return () => {
      delete document.body.dataset.purchaseSuccess;
    };
  }, [successOrder]);

  useEffect(() => {
    if (typeof onSubmittingChange !== 'function') return undefined;

    onSubmittingChange(isSubmitting);
    return () => {
      onSubmittingChange(false);
    };
  }, [isSubmitting, onSubmittingChange]);

  if (isLoading || !product || !quantityMeta) {
    return (
      <div className={`product-purchase-page ${embedded ? '!min-h-0 !p-0' : ''}`} dir={dir}>
        <section className="purchase-phone purchase-phone--loading" aria-busy="true" aria-label={copy.loading}>
          <div className="purchase-bg-lines" />
          <div className="purchase-loading-orb" />
          <div className="purchase-skeleton purchase-skeleton--title" />
          <div className="purchase-skeleton purchase-skeleton--card" />
          <div className="purchase-skeleton purchase-skeleton--card" />
          <p>{copy.loading}</p>
        </section>
      </div>
    );
  }

  const parsedQuantity = Number(quantityInput);
  const quantity = Number.isFinite(parsedQuantity) && parsedQuantity > 0
    ? parsedQuantity
    : quantityMeta.minQty;
  const isQuantityOnly = isQuantityOnlyUser(user);
  const userCurrencyCode = String(user?.currency || 'USD').toUpperCase();
  const buyerRole = String(user?.role || '').trim().toLowerCase();
  const shouldUseCustomerOrderFlow = isBackofficeRole(buyerRole);
  const pricingOptions = { preferLocalGroupPrice: shouldUseCustomerOrderFlow };
  const pricingGroup = user?.groupId || user?.group || 'Normal';
  const pricingGroupPercentage = user?.groupPercentage ?? null;
  
  const unitPriceBase = calculateProductPrice(product, pricingGroup, pricingGroupPercentage, pricingOptions);
  const unitPrice = resolveProductUnitPrice(product, userCurrencyCode, currencies, pricingGroup, pricingGroupPercentage, pricingOptions);
  const totalPrice = isQuantityOnly ? 0 : normalizeMoneyAmount(Number(unitPrice) * quantity);
  const balance = normalizeMoneyAmount(user?.coins || 0);
  const userCurrencyMeta = getCurrencyMeta(userCurrencyCode, currencies);

  const exactDisplayTotalPrice = isQuantityOnly ? '0' : multiplyRawDecimalByInteger(unitPrice, quantity);
  const formattedTotalPrice = `${formatTotalPriceString(exactDisplayTotalPrice, 2)} ${userCurrencyMeta.symbol || userCurrencyCode}`;
  const primaryOrderField = purchaseOrderFields.find((field) => isPrimaryPurchaseFieldKey(field?.key))
    || purchaseOrderFields[0]
    || { key: 'playerId', label: copy.userId, placeholder: copy.userIdPlaceholder };
  const primaryOrderFieldKey = getPurchaseOrderFieldKey(primaryOrderField, 0);
  const primaryOrderFieldLabel = normalizePurchaseFieldLabel(primaryOrderField?.label || copy.userId, language);
  const areOrderFieldsComplete = purchaseOrderFields.every((field, index) => {
    if (field?.required === false) return true;
    const key = getPurchaseOrderFieldKey(field, index);
    return Boolean(sanitizeOrderFieldValue(orderFieldValues[key]).trim());
  });
  const purchaseProductName = String(
    (language === 'ar'
      ? (product?.nameAr || product?.displayNameAr || product?.displayName || product?.name)
      : (product?.displayName || product?.name || product?.nameAr))
    || copy.product
  ).trim();
  const purchaseProductDescription = String(
    (language === 'ar'
      ? (
        product?.descriptionAr
        || product?.shortDescriptionAr
        || product?.displayDescriptionAr
        || product?.displayDescription
        || product?.description
        || product?.shortDescription
      )
      : (
        product?.displayDescription
        || product?.description
        || product?.shortDescription
        || product?.descriptionAr
        || product?.shortDescriptionAr
      ))
    || ''
  ).trim();
  const purchaseProductImage = resolveImageUrl(product?.image || product?.imageUrl || product?.thumbnail || product?.icon || '');

  const handleQuantityChange = (event) => {
    const rawValue = sanitizeQuantityInput(event.target.value);
    if (!rawValue) {
      setQuantityInput('');
      return;
    }

    const nextQuantity = Number.parseInt(rawValue, 10);
    setQuantityInput(Number.isFinite(nextQuantity) ? nextQuantity : '');
  };

  const handleQuantityBlur = () => {
    if (!String(quantityInput).trim()) {
      return;
    }

    setQuantityInput((value) => clampProductQuantity(value, product));
  };

  const handlePurchase = async () => {
    const normalizedFields = purchaseOrderFields.reduce((fields, field, index) => {
      const key = getPurchaseOrderFieldKey(field, index);
      const value = sanitizeOrderFieldValue(orderFieldValues[key]).trim();
      if (value) {
        fields[key] = value;
      }
      return fields;
    }, {});
    const identifier = normalizedFields[primaryOrderFieldKey]
      || Object.values(normalizedFields).find((value) => String(value || '').trim())
      || '';
    const submittedQuantity = clampProductQuantity(quantityInput, product);
    const submittedTotalPrice = isQuantityOnly
      ? 0
      : normalizeMoneyAmount(Number(unitPrice) * submittedQuantity);
    const submittedDisplayTotalPrice = isQuantityOnly
      ? '0'
      : `${formatTotalPriceString(multiplyRawDecimalByInteger(unitPrice, submittedQuantity), 2)} ${userCurrencyMeta.symbol || userCurrencyCode}`;

    if (!quantityInput || !areOrderFieldsComplete) {
      return;
    }

    setQuantityInput(submittedQuantity);
    setIsSubmitting(true);
    try {
      const orderId = `#${product?.name?.replace(/\s+/g, '').toUpperCase() || 'ORD'}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;
      const fieldsSnapshot = purchaseOrderFields.map((field, index) => {
        const key = getPurchaseOrderFieldKey(field, index);
        return {
          key,
          name: key,
          id: key,
          label: normalizePurchaseFieldLabel(field?.label || key, language),
          placeholder: field?.placeholder || '',
          type: field?.type || 'text',
          required: field?.required !== false,
        };
      });
      const fieldEntries = fieldsSnapshot
        .map((field) => ({
          key: field.key,
          label: field.label,
          value: normalizedFields[field.key] || '',
        }))
        .filter((field) => field.value);
      const hasPrimaryIdentifierAlias = Object.keys(normalizedFields).some(isPrimaryPurchaseFieldKey);
      const payloadPlayerId = hasPrimaryIdentifierAlias ? identifier : undefined;
      const fieldsSignature = Object.entries(normalizedFields)
        .map(([key, value]) => `${key}:${value}`)
        .join('|') || 'fields';

      const payload = {
        id: orderId,
        userId: user?.id,
        productId: product.id,
        productName: product.name,
        quantity: submittedQuantity,
        total: submittedTotalPrice,
        playerId: payloadPlayerId,
        customInputs: normalizedFields,
        orderFields: normalizedFields,
        orderFieldsValues: normalizedFields,
        customerInput: {
          values: normalizedFields,
          fieldsSnapshot,
          quantitySnapshot: quantityMeta,
        },
        quantitySnapshot: quantityMeta,
        timestamp: new Date().toISOString(),
        unitPriceBase: isQuantityOnly ? 0 : unitPriceBase,
        unitPrice: isQuantityOnly ? 0 : unitPrice,
        priceCoins: submittedTotalPrice,
        currencyCode: userCurrencyCode,
        exchangeRateAtExecution: userCurrencyMeta.rate,
        idempotencyKey: `${user?.id || 'user'}-${product.id}-${fieldsSignature}-${Date.now()}`,
        preferCustomerOrderEndpoint: shouldUseCustomerOrderFlow,
        preferLegacyOrderEndpoint: !shouldUseCustomerOrderFlow,
      };

      const result = await addOrder(payload);
      const returnedOrder = result?.order || result || null;
      const returnedId = returnedOrder?.id || returnedOrder?._id || returnedOrder?.orderId || orderId;
      const returnedOrderNumber = String(
        returnedOrder?.siteOrderNumber
        || returnedOrder?.orderNumber
        || returnedOrder?.internalOrderNumber
        || returnedOrder?.displayOrderId
        || returnedId
      ).trim();
      const nextBalance = Number(result?.updatedBalance);

      setSuccessOrder({
        orderId: returnedId,
        orderNumber: returnedOrderNumber,
        quantity: submittedQuantity,
        total: submittedTotalPrice,
        totalDisplay: submittedDisplayTotalPrice,
        identifier,
        identifierLabel: primaryOrderFieldLabel,
        fields: fieldEntries,
      });

      if (!isQuantityOnly && Number.isFinite(nextBalance)) {
        const normalizedBalance = normalizeMoneyAmount(nextBalance);
        updateUserSession({
          coins: normalizedBalance,
          walletBalance: normalizedBalance,
          balance: normalizedBalance,
        });
      } else if (!isQuantityOnly && submittedTotalPrice > 0) {
        const normalizedBalance = normalizeMoneyAmount(balance - submittedTotalPrice);
        updateUserSession({
          coins: normalizedBalance,
          walletBalance: normalizedBalance,
          balance: normalizedBalance,
        });
      }

      addToast(
        language === 'en' ? 'Order placed successfully!' : 'تم تنفيذ الطلب بنجاح!',
        'success'
      );
    } catch (error) {
      devLogger.error('Purchase failed', error);
      const errorMessage = getReadableErrorMessage(
        error,
        language === 'en' ? 'Purchase failed. Please try again.' : 'فشلت عملية الشراء. حاول مرة أخرى.',
        { language }
      );
      addToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successOrder) {
    const summaryRows = [
      {
        label: copy.product,
        value: product?.name,
        icon: <Package size={20} />,
      },
      {
        label: copy.quantity,
        value: formatCount(successOrder.quantity || quantity),
        icon: <Box size={20} />,
        dir: 'ltr',
      },
      ...(!isQuantityOnly ? [{
        label: copy.price,
        value: successOrder.totalDisplay || formattedTotalPrice,
        icon: <WalletCards size={20} />,
        dir: 'ltr',
      }] : []),
      ...((Array.isArray(successOrder.fields) && successOrder.fields.length > 0)
        ? successOrder.fields.map((field) => ({
          label: field.label || successOrder.identifierLabel || primaryOrderFieldLabel,
          value: field.value,
          icon: <UserRound size={20} />,
          dir: 'auto',
          copyable: true,
        }))
        : (successOrder.identifier ? [{
          label: successOrder.identifierLabel || primaryOrderFieldLabel,
          value: successOrder.identifier,
          icon: <UserRound size={20} />,
          dir: 'auto',
          copyable: true,
        }] : [])),
      {
        label: copy.orderNumber,
        value: successOrder.orderNumber || successOrder.orderId,
        icon: <Hash size={20} />,
        dir: 'ltr',
        copyable: true,
      },
    ];

    return (
      <motion.div
        initial={false}
        animate={{ opacity: 1 }}
        className={`product-purchase-page ${embedded ? '!min-h-0 !p-0' : 'fixed inset-0 z-50 !min-h-screen !items-center !justify-center !p-4'}`}
        dir={dir}
      >
        <section className="purchase-phone purchase-phone--success purchase-success-modal" aria-label={copy.successTitle}>
          <div className="purchase-bg-lines" />
          <div className="purchase-confetti" aria-hidden="true">
            {Array.from({ length: 16 }).map((_, index) => (
              <span key={index} style={{ '--i': index }} />
            ))}
          </div>

          <button
            type="button"
            onPointerDown={handleSuccessClose}
            onClick={handleSuccessClose}
            className="purchase-glass-button purchase-success-back"
            aria-label={copy.close}
            title={copy.close}
          >
            <X size={17} strokeWidth={3} />
          </button>

          <motion.div
            initial={false}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.12 }}
            className="purchase-success-mark"
          >
            <span className="purchase-success-bloom" />
            <span className="purchase-check-ring">
              <Check size={42} strokeWidth={3.3} />
            </span>
          </motion.div>

          <motion.h1
            initial={false}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.08 }}
            className="purchase-success-title"
          >
            {copy.successTitle}
          </motion.h1>
          <p className="purchase-success-message">{copy.successMessage}</p>

          <article className="purchase-card purchase-summary-card">
            <h2>{copy.orderSummary}</h2>
            <div className="purchase-summary-list">
              {summaryRows.map((row) => (
                <div className="purchase-summary-row" key={row.label}>
                  <span className="purchase-summary-icon">{row.icon}</span>
                  <div className="purchase-summary-text">
                    <span>{row.label}</span>
                    {row.copyable ? (
                      <button
                        type="button"
                        className="purchase-summary-copy"
                        onClick={() => handleCopyText(row.value, row.label)}
                        aria-label={language === 'en' ? `Copy ${row.label}` : `نسخ ${row.label}`}
                        title={language === 'en' ? `Copy ${row.label}` : `نسخ ${row.label}`}
                      >
                        <SummaryValue value={row.value} dir={row.dir} />
                        <Copy size={14} aria-hidden="true" />
                      </button>
                    ) : (
                      <SummaryValue value={row.value} dir={row.dir} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </article>

          <div className="purchase-actions purchase-success-actions">
            <button
              type="button"
              onClick={() => {
                if (typeof onSubmittingChange === 'function') onSubmittingChange(false);
                if (typeof onClose === 'function') onClose({ force: true });
                navigate(`/orders?orderId=${encodeURIComponent(successOrder.orderId)}`);
              }}
              className="purchase-primary-button purchase-success-primary"
            >
              <span>{copy.orderDetails}</span>
              <FileText size={17} />
            </button>
            <button
              type="button"
              onClick={handleSuccessClose}
              className="purchase-secondary-button purchase-success-secondary"
            >
              <span>{embedded ? copy.close : copy.backHome}</span>
              <Home size={17} />
            </button>
          </div>
        </section>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1 }}
      className={`product-purchase-page ${embedded ? '!min-h-0 !p-0' : ''}`}
      dir={dir}
    >
      <section className="purchase-phone purchase-phone--buy purchase-clean-card purchase-premium-modal" aria-label={purchaseProductName}>
        <div className="purchase-modal-ambient" aria-hidden="true" />

        <header className="purchase-modal-header">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="purchase-glass-button purchase-close-button purchase-modal-close"
            aria-label={copy.close}
            title={copy.close}
          >
            <X size={24} strokeWidth={3} />
          </button>

          <div className="purchase-header-icon purchase-bag-icon" aria-hidden="true">
            <ShoppingBag size={28} strokeWidth={2.4} />
          </div>

          <div className="purchase-title-block">
            <h1 className="purchase-modal-title">
              {purchaseProductName}
            </h1>
            <span className="purchase-title-ornament" aria-hidden="true" />
          </div>
        </header>

        {purchaseProductDescription ? (
          <p className="purchase-product-top-description">
            {purchaseProductDescription}
          </p>
        ) : null}

        <article className="purchase-card purchase-info-card">
          <div className="purchase-info-cell purchase-info-cell--total">
            <div className="purchase-field-heading">
              <span className="purchase-mini-icon purchase-mini-icon--blue">
                <Zap size={20} fill="currentColor" />
              </span>
              <h2>{copy.total}</h2>
            </div>
            <strong className="purchase-total-amount" dir="ltr">{formattedTotalPrice}</strong>
          </div>

          <div className="purchase-info-cell purchase-info-cell--quantity">
            <div className="purchase-field-heading">
              <span className="purchase-mini-icon purchase-mini-icon--purple">
                <Box size={21} strokeWidth={2.3} />
              </span>
              <h2>{copy.quantity}</h2>
            </div>
            <label className="purchase-input-shell">
              <span className="purchase-sr-only">{copy.quantity}</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9,]*"
                min={quantityMeta.minQty}
                max={quantityMeta.maxQty}
                step={quantityMeta.stepQty}
                value={formatQuantityInput(quantityInput)}
                onChange={handleQuantityChange}
                onBlur={handleQuantityBlur}
                placeholder={copy.quantityPlaceholder}
                className="purchase-order-input"
              />
            </label>
          </div>
        </article>

        {purchaseOrderFields.map((field, index) => {
          const fieldKey = getPurchaseOrderFieldKey(field, index);
          const fieldLabel = normalizePurchaseFieldLabel(field?.label || fieldKey, language);
          const fieldType = String(field?.type || 'text').toLowerCase();
          const fieldPlaceholder = getPurchaseFieldPlaceholder(field, fieldLabel, language);
          const fieldOptions = normalizePurchaseFieldOptions(field);
          const shouldRenderSelect = fieldType === 'select' && fieldOptions.length > 0;
          const inputType = fieldType === 'email' ? 'email' : 'text';
          const inputMode = fieldType === 'number' ? 'numeric' : undefined;

          return (
            <article
              key={fieldKey}
              className="purchase-card purchase-field-card purchase-user-card purchase-dynamic-field-card"
            >
              <div className="purchase-field-heading purchase-user-heading">
                <span className="purchase-mini-icon purchase-mini-icon--purple">
                  {fieldType === 'number' ? (
                    <Hash size={21} strokeWidth={2.3} />
                  ) : (
                    <UserRound size={21} strokeWidth={2.3} />
                  )}
                </span>
                <h2>{fieldLabel}</h2>
              </div>
              <label className={`purchase-input-shell purchase-input-shell--user${shouldRenderSelect ? ' purchase-input-shell--select' : ''}`}>
                <span className="purchase-sr-only">{fieldLabel}</span>
                {shouldRenderSelect ? (
                  <select
                    value={orderFieldValues[fieldKey] || ''}
                    onChange={(event) => setOrderFieldValues((currentValues) => ({
                      ...currentValues,
                      [fieldKey]: event.target.value,
                    }))}
                    required={field?.required !== false}
                    className="purchase-order-input purchase-order-select"
                  >
                    <option value="">{fieldPlaceholder}</option>
                    {fieldOptions.map((option) => (
                      <option key={`${fieldKey}-${option.value}`} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={inputType}
                    inputMode={inputMode}
                    value={orderFieldValues[fieldKey] || ''}
                    onChange={(event) => setOrderFieldValues((currentValues) => ({
                      ...currentValues,
                      [fieldKey]: event.target.value,
                    }))}
                    required={field?.required !== false}
                    placeholder={fieldPlaceholder}
                    autoComplete="off"
                    className="purchase-order-input"
                  />
                )}
              </label>
            </article>
          );
        })}

        <div className="purchase-actions purchase-modal-actions">
          <button
            type="button"
            onClick={handlePurchase}
            disabled={isSubmitting || !quantityInput || !areOrderFieldsComplete}
            className="purchase-primary-button purchase-buy-button purchase-action-buy"
          >
            {isSubmitting ? (
              <LoaderCircle size={20} strokeWidth={2.5} className="animate-spin" />
            ) : (
              <LockKeyhole size={20} strokeWidth={2.5} />
            )}
            <span>{isSubmitting ? copy.buying : copy.buyNow}</span>
          </button>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="purchase-secondary-button purchase-cancel-button purchase-action-cancel"
          >
            <span>{language === 'ar' ? 'إلغاء' : 'Cancel'}</span>
          </button>
        </div>

        <figure className="purchase-showcase purchase-product-showcase">
          <div className="purchase-product-display">
            <div className="purchase-product-image-stage">
              <div className="purchase-product-orbit-scene" aria-hidden="true">
                <span className="purchase-product-ring-glow" />
                <span className="purchase-product-energy-ring" />
                <span className="purchase-product-ring-core" />
                <span className="purchase-product-display-base" />
                <span className="purchase-product-spark purchase-product-spark--one" />
                <span className="purchase-product-spark purchase-product-spark--two" />
                <span className="purchase-product-spark purchase-product-spark--three" />
              </div>
              {purchaseProductImage ? (
                <img
                  src={purchaseProductImage}
                  alt={purchaseProductName}
                  className="purchase-showcase-product-image"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="purchase-showcase-product-fallback" aria-hidden="true">
                  <Package size={48} strokeWidth={1.8} />
                </span>
              )}
            </div>
          </div>
        </figure>

        {isSubmitting ? (
          <div className="purchase-submit-shield" role="status" aria-live="polite">
            <div className="purchase-submit-box">
              <LoaderCircle size={24} className="animate-spin" />
              <span>{copy.buying}</span>
            </div>
          </div>
        ) : null}
      </section>
    </motion.div>
  );
};

export default ProductPurchasePage;
