import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ShieldCheck, Sparkles, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/useAuthStore';
import useGroupStore from '../../store/useGroupStore';
import useSystemStore from '../../store/useSystemStore';
import useOrderStore from '../../store/useOrderStore';
import { useToast } from '../ui/Toast';
import Button from '../ui/Button';
import Input from '../ui/Input';
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
import ProductInfoPanel from './ProductInfoPanel';
import QuantitySelector from './QuantitySelector';

const getSheetCopy = (language = 'ar') => (
  language === 'ar'
    ? {
        title: 'إتمام الشراء',
        closeLabel: 'إغلاق',
        priceLabel: 'السعر',
        quantityLabel: 'الكمية',
        minLabel: 'الحد الأدنى',
        maxLabel: 'الحد الأقصى',
        stepLabel: 'الزيادة',
        decreaseLabel: 'تقليل الكمية',
        increaseLabel: 'زيادة الكمية',
        orderFieldsTitle: 'بيانات الطلب',
        totalLabel: 'الإجمالي',
        balanceLabel: 'الرصيد الحالي',
        buyLabel: 'شراء الآن',
        cancelLabel: 'إلغاء',
        processingLabel: 'جارٍ تنفيذ الطلب...',
        pendingTitle: 'الحساب غير متاح حاليًا',
        pendingDescription: 'لا يمكن إتمام الشراء بهذا الحساب حاليًا.',
        unavailableTitle: 'المنتج غير متاح حاليًا',
        secureHint: 'لا يتم حفظ بيانات الطلب الحساسة في الواجهة بعد الإغلاق.',
        instantNote: 'تنفيذ سريع وآمن داخل نفس التجربة بدون مغادرة الصفحة.',
        insufficientBalance: 'الرصيد الحالي لا يكفي لإتمام الطلب.',
        successMessage: 'تم استلام طلبك بنجاح.',
        failureMessage: 'تعذر تنفيذ الطلب حاليًا. حاول مرة أخرى.',
        invalidAmountMessage: 'لا يمكن تنفيذ الطلب لأن قيمة الشراء غير صالحة.',
        fieldRequired: (label) => `يرجى إدخال ${label}`,
      }
    : {
        title: 'Checkout',
        closeLabel: 'Close',
        priceLabel: 'Price',
        quantityLabel: 'Quantity',
        minLabel: 'Min',
        maxLabel: 'Max',
        stepLabel: 'Step',
        decreaseLabel: 'Decrease quantity',
        increaseLabel: 'Increase quantity',
        orderFieldsTitle: 'Order details',
        totalLabel: 'Total',
        balanceLabel: 'Current balance',
        buyLabel: 'Buy now',
        cancelLabel: 'Cancel',
        processingLabel: 'Processing order...',
        pendingTitle: 'Account unavailable',
        pendingDescription: 'Purchasing is not available for this account right now.',
        unavailableTitle: 'This product is currently unavailable',
        secureHint: 'Sensitive order inputs are not stored in the UI after closing.',
        instantNote: 'Fast and secure purchase flow without leaving the current page.',
        insufficientBalance: 'Your current balance is not enough for this order.',
        successMessage: 'Your order has been received successfully.',
        failureMessage: 'The order could not be completed right now. Please try again.',
        invalidAmountMessage: 'Unable to place this order because the amount is invalid.',
        fieldRequired: (label) => `Please enter ${label}`,
      }
);

  const ProductDetailsSheet = ({ product, isOpen, onClose }) => {
  const user = useAuthStore((state) => state.user);
  const updateUserSession = useAuthStore((state) => state.updateUserSession);
  const groupsLastLoadedAt = useGroupStore((state) => state.groupsLastLoadedAt);
  const addOrder = useOrderStore((state) => state.addOrder);
  const { addToast } = useToast();
  const { i18n } = useTranslation();
  const language = String(i18n.resolvedLanguage || i18n.language || 'ar').toLowerCase().startsWith('en') ? 'en' : 'ar';
  const copy = useMemo(() => getSheetCopy(language), [language]);

  const [currencies, setCurrencies] = useState([]);

  const loadCurrencies = useSystemStore((state) => state.loadCurrencies);
  const cachedCurrencies = useSystemStore((state) => state.currencies);
  const [fieldValues, setFieldValues] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const productTitle = language === 'ar'
    ? product?.nameAr || product?.name
    : product?.name || product?.nameAr;

  const orderFields = useMemo(
    () => resolveProductOrderFields(product, language),
    [language, product]
  );

  const quantityMeta = useMemo(
    () => getProductQuantityMeta(product),
    [product]
  );

  useEffect(() => {
    if (!product) return;

    const nextFields = {};
    orderFields.forEach((field) => {
      nextFields[field.key] = '';
    });

    setFieldValues(nextFields);
    setFieldErrors({});
    setQuantity(quantityMeta.minQty);
    setIsSubmitting(false);
  }, [orderFields, product?.id, quantityMeta.minQty]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    let isMounted = true;

    if (!isOpen) return undefined;

    // Seed from cache immediately for a fast open, then refresh in background.
    setCurrencies(Array.isArray(cachedCurrencies) ? cachedCurrencies : []);

    Promise.resolve(loadCurrencies?.({ force: true }))
      .then((list) => {
        if (isMounted) {
          setCurrencies(Array.isArray(list) ? list : []);
        }
      })
      .catch(() => {
        if (isMounted) {
          setCurrencies(Array.isArray(cachedCurrencies) ? cachedCurrencies : []);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [cachedCurrencies, isOpen, loadCurrencies]);

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

  if (!isOpen || !product) {
    return null;
  }

  const locale = language === 'ar' ? 'ar-EG' : 'en-US';
  const userCurrencyMeta = getCurrencyMeta(userCurrencyCode, currencies);
  const unitPriceBase = pricingSnapshot.unitPriceBase;
  const unitPrice = pricingSnapshot.unitPrice;
  const totalPrice = normalizeMoneyAmount(unitPrice * quantity);
  const hasValidAmount = Number.isFinite(totalPrice) && totalPrice > 0;
  const balance = normalizeMoneyAmount(user?.coins || 0);
  const creditLimit = normalizeMoneyAmount(Math.max(0, Number(user?.creditLimit || 0)));
  const spendableBalance = normalizeMoneyAmount(balance + creditLimit);
  const canAfford = spendableBalance >= totalPrice;
  const isPending = String(user?.status || '').toLowerCase() === 'pending';
  const productState = getProductStatus(product, language);
  const formattedUnitPrice = formatCurrencyAmount(unitPrice, userCurrencyCode, currencies, locale);
  const formattedTotalPrice = formatCurrencyAmount(totalPrice, userCurrencyCode, currencies, locale);
  const formattedBalance = formatCurrencyAmount(balance, userCurrencyCode, currencies, locale);
  const canOrder = productState.isPurchasable && !isPending && canAfford && hasValidAmount && !isSubmitting;

  const userIdentifier = String(
    fieldValues.playerId ||
    fieldValues.uid ||
    ''
  ).trim();

  const handleFieldChange = (fieldKey, nextValue) => {
    setFieldValues((current) => ({
      ...current,
      [fieldKey]: sanitizeOrderFieldValue(nextValue),
    }));

    setFieldErrors((current) => {
      if (!current[fieldKey]) return current;
      const nextErrors = { ...current };
      delete nextErrors[fieldKey];
      return nextErrors;
    });
  };

  const handleSubmit = async () => {
    const nextErrors = {};

    orderFields.forEach((field) => {
      if (!String(fieldValues[field.key] || '').trim()) {
        nextErrors[field.key] = copy.fieldRequired(field.label);
      }
    });

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    if (!productState.isPurchasable) {
      addToast(productState.helperText || copy.unavailableTitle, 'warning');
      return;
    }

    if (!canAfford) {
      addToast(copy.insufficientBalance, 'error');
      return;
    }

    if (!hasValidAmount) {
      addToast(copy.invalidAmountMessage, 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const normalizedFields = Object.fromEntries(
        orderFields.map((field) => [
          field.key,
          sanitizeOrderFieldValue(fieldValues[field.key]).trim(),
        ])
      );
      const fieldsSnapshot = Array.isArray(product?.orderFields) && product.orderFields.length > 0
        ? product.orderFields.map((field) => ({ ...field }))
        : orderFields.map((field) => ({
          key: field.key,
          label: field.label,
          placeholder: field.placeholder,
        }));

      const createResult = await addOrder({
        id: `ord-${Date.now()}`,
        userId: user.id,
        productId: product.id,
        productName: product.name,
        productNameAr: product.nameAr,
        quantity,
        unitPrice,
        unitPriceBase,
        priceCoins: totalPrice,
        currencyCode: userCurrencyCode,
        exchangeRateAtExecution: userCurrencyMeta.rate,
        playerId: userIdentifier,
        orderFields: normalizedFields,
        orderFieldsValues: normalizedFields,
        customerInput: {
          values: normalizedFields,
          fieldsSnapshot,
          quantitySnapshot: quantityMeta,
        },
        quantitySnapshot: quantityMeta,
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

      addToast(copy.successMessage, 'success');
      onClose();
    } catch (error) {
      if (error?.code === 'PROVIDER_PRICE_INCREASED') {
        const priceMsg = language === 'en'
          ? 'The price for this service has been updated by the provider. Please refresh and review the new price.'
          : 'عفواً، تم تحديث سعر هذه الخدمة من المصدر. برجاء تحديث الصفحة لرؤية السعر الجديد.';
        addToast(priceMsg, 'warning');
      } else {
        addToast(error?.message || copy.failureMessage, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        className="absolute inset-0 bg-black/78 backdrop-blur-[1.5px] animate-[fade-in_180ms_ease-out]"
        onClick={onClose}
        aria-label={copy.closeLabel}
      />

      <div className="absolute inset-0 flex items-end justify-center p-2 sm:items-center sm:p-4">
        <section
          role="dialog"
          aria-modal="true"
          aria-label={productTitle || copy.title}
          className="relative max-h-[94vh] w-full max-w-5xl overflow-hidden rounded-t-[2rem] border border-white/10 bg-[linear-gradient(180deg,#101014_0%,#07070a_100%)] text-white shadow-[0_32px_90px_rgba(0,0,0,0.44)] animate-[sheet-up_240ms_ease-out] sm:rounded-[2rem]"
        >
          <div className="pointer-events-none absolute inset-x-12 top-0 h-40 rounded-full bg-red-500/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-48 w-48 rounded-full bg-orange-500/10 blur-3xl" />

          <div className="relative max-h-[94vh] overflow-y-auto p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-200/76">
                  {copy.title}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white/80 transition-colors hover:bg-white/12"
                aria-label={copy.closeLabel}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr),minmax(0,0.9fr)] lg:gap-6">
              <ProductInfoPanel
                product={product}
                title={productTitle}
                formattedPrice={formattedUnitPrice}
                priceLabel={copy.priceLabel}
                kicker={copy.title}
              />

              <div className="space-y-4">
                {!productState.isPurchasable && (
                  <div className="flex items-start gap-3 rounded-[1.5rem] border border-amber-400/24 bg-amber-500/10 p-4 text-sm text-amber-100">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                    <div className="space-y-1">
                      <p className="font-semibold">{copy.unavailableTitle}</p>
                      <p className="text-amber-100/80">{productState.helperText}</p>
                    </div>
                  </div>
                )}

                {isPending && (
                  <div className="flex items-start gap-3 rounded-[1.5rem] border border-yellow-400/24 bg-yellow-500/10 p-4 text-sm text-yellow-100">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                    <div className="space-y-1">
                      <p className="font-semibold">{copy.pendingTitle}</p>
                      <p className="text-yellow-100/82">{copy.pendingDescription}</p>
                    </div>
                  </div>
                )}

                <QuantitySelector
                  value={quantity}
                  minQty={quantityMeta.minQty}
                  maxQty={quantityMeta.maxQty}
                  stepQty={quantityMeta.stepQty}
                  onChange={(nextValue) => setQuantity(clampProductQuantity(nextValue, product))}
                  disabled={isSubmitting}
                  copy={copy}
                />

                <section className="space-y-3 rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
                  <div className="space-y-3">
                    {orderFields.map((field) => (
                      <Input
                        key={field.key}
                        label={field.label}
                        placeholder={field.placeholder || copy.fieldRequired(field.label)}
                        value={fieldValues[field.key] || ''}
                        onChange={(event) => handleFieldChange(field.key, event.target.value)}
                        error={fieldErrors[field.key]}
                        disabled={isSubmitting}
                        autoComplete="off"
                        spellCheck={false}
                        className="h-12 rounded-[1rem] border-white/10 bg-black/20 text-white placeholder:text-white/35 focus:border-red-400/50 focus:ring-red-400/10"
                      />
                    ))}
                  </div>
                </section>

                <section className="space-y-4 rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/48">{copy.totalLabel}</p>
                      <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-white">
                        {formattedTotalPrice}
                      </p>
                    </div>

                    <div className="text-end">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/48">{copy.balanceLabel}</p>
                      <p className="mt-2 text-sm font-semibold text-white/82">{formattedBalance}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 rounded-[1rem] border border-white/8 bg-black/20 px-3 py-2.5 text-xs text-white/68">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-red-200/72" />
                    <span>{copy.secureHint}</span>
                  </div>

                  <div className="flex items-start gap-2 rounded-[1rem] border border-red-400/10 bg-red-500/8 px-3 py-2.5 text-xs text-red-100/82">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-red-200/72" />
                    <span>{copy.instantNote}</span>
                  </div>

                  {!canAfford && (
                    <div className="flex items-start gap-2 rounded-[1rem] border border-yellow-400/20 bg-yellow-500/10 px-3 py-2.5 text-xs text-yellow-100">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{copy.insufficientBalance}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={onClose}
                      disabled={isSubmitting}
                      className="h-12 rounded-full border border-white/12 bg-white/5 text-white hover:bg-white/10"
                    >
                      {copy.cancelLabel}
                    </Button>

                    <Button
                      type="button"
                      onClick={handleSubmit}
                      disabled={!canOrder}
                      className="h-12 rounded-full bg-[linear-gradient(135deg,#991b1b,#dc2626_52%,#f97316)] text-white shadow-[0_18px_30px_-18px_rgba(249,115,22,0.8)] hover:brightness-[1.03]"
                    >
                      {isSubmitting ? copy.processingLabel : copy.buyLabel}
                    </Button>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProductDetailsSheet;
