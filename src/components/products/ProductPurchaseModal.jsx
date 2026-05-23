import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Check, CheckCircle, X } from 'lucide-react';
import { resolveImageUrl } from '../../utils/imageUrl';
import coinsImage from '../../assets/عملات.webp';
import useAuthStore from '../../store/useAuthStore';
import useGroupStore from '../../store/useGroupStore';
import useOrderStore from '../../store/useOrderStore';
import useSystemStore from '../../store/useSystemStore';
import { useToast } from '../ui/Toast';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { calculateProductPrice, formatCurrencyAmount, getCurrencyMeta, resolveProductUnitPrice } from '../../utils/pricing';
import { normalizeMoneyAmount } from '../../utils/money';
import { getProductStatus } from '../../utils/productStatus';
import { getProductQuantityMeta, sanitizeOrderFieldValue } from '../../utils/productPurchase';
import { useTranslation } from 'react-i18next';

const ProductPurchaseModal = ({ isOpen, onClose, product }) => {
  const { user, updateUserSession } = useAuthStore();
  const groupsLastLoadedAt = useGroupStore((state) => state.groupsLastLoadedAt);
  const { addOrder } = useOrderStore();
  const { addToast } = useToast();
  const { t, i18n } = useTranslation();
  const language = String(i18n.resolvedLanguage || i18n.language || 'ar').toLowerCase().startsWith('en') ? 'en' : 'ar';

  const [fieldValues, setFieldValues] = useState({});
  const [error, setError] = useState(null);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderStatus, setOrderStatus] = useState('idle');
  const [quantity, setQuantity] = useState(1);
  const [currencies, setCurrencies] = useState([]);

  const loadCurrencies = useSystemStore((state) => state.loadCurrencies);
  const cachedCurrencies = useSystemStore((state) => state.currencies);

  const dynamicFields = useMemo(() => {
    if (!product) return [{ key: 'playerId', label: t('product.userId') }];

    if (Array.isArray(product.orderFields) && product.orderFields.length > 0) {
      return product.orderFields.map((field, index) => {
        const key = String(field?.name || field?.key || field?.id || `orderField_${index}`);
        return {
          key,
          label:
            (language === 'ar' ? field?.labelAr || field?.placeholderAr : field?.label || field?.placeholder) ||
            field?.label ||
            field?.placeholder ||
            key,
          placeholder: (language === 'ar' ? field?.placeholderAr : field?.placeholder) || field?.placeholder || ''
        };
      });
    }

    if (Array.isArray(product.supplierFieldMappings) && product.supplierFieldMappings.length > 0) {
      const allowedFields = product.supplierFieldMappings
        .map((mapping) => String(mapping?.internalField || '').trim())
        .filter((field) => field && field !== 'quantity' && field !== 'externalProductId');

      if (allowedFields.length > 0) {
        return allowedFields.map((field) => ({
          key: field,
          label: field === 'playerId' ? t('product.userId') : field === 'uid' ? 'UID' : field
        }));
      }
    }

    return [{ key: 'playerId', label: t('product.userId') }];
  }, [language, product, t]);

  const userIdentifier = useMemo(
    () => String(fieldValues.playerId || fieldValues.uid || '').trim(),
    [fieldValues]
  );

  useEffect(() => {
    if (!product) return;

    setQuantity(Number(product.minimumOrderQty || 1));

    const initialFields = {};
    dynamicFields.forEach((field) => {
      initialFields[field.key] = '';
    });

    setFieldValues(initialFields);
    setError(null);
    setOrderStatus('idle');
  }, [product?.id, dynamicFields]);

  useEffect(() => {
    if (isOpen) {
      setOrderStatus('idle');
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    let mounted = true;
    if (!isOpen) return undefined;

    const fetchCurrencies = async () => {
      try {
        const list = await Promise.resolve(loadCurrencies?.({ force: true }));
        if (mounted) {
          setCurrencies(Array.isArray(list) ? list : []);
        }
      } catch {
        if (mounted) {
          setCurrencies(Array.isArray(cachedCurrencies) ? cachedCurrencies : []);
        }
      }
    };

    // Seed from cache immediately for fast open; refresh in background.
    setCurrencies(Array.isArray(cachedCurrencies) ? cachedCurrencies : []);
    fetchCurrencies();
    return () => {
      mounted = false;
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

  if (!product) return null;

  const userCurrencyMeta = getCurrencyMeta(userCurrencyCode, currencies);
  const unitPriceBase = pricingSnapshot.unitPriceBase;
  const unitPrice = pricingSnapshot.unitPrice;
  const productState = getProductStatus(product, language);
  const isPurchasable = productState.isPurchasable;

  const quantityMeta = getProductQuantityMeta(product);
  const minQty = quantityMeta.minQty;
  const maxQty = quantityMeta.maxQty;
  const totalPrice = normalizeMoneyAmount(unitPrice * quantity);
  const hasValidAmount = Number.isFinite(totalPrice) && totalPrice > 0;
  const balance = normalizeMoneyAmount(user?.coins || 0);
  const creditLimit = normalizeMoneyAmount(Math.max(0, Number(user?.creditLimit || 0)));
  const spendableBalance = normalizeMoneyAmount(balance + creditLimit);
  const canAfford = spendableBalance >= totalPrice;
  const canOrder = isPurchasable && canAfford && hasValidAmount && !isOrdering;

  const quantityText = `${minQty} - ${maxQty}`;

  const locale = language === 'ar' ? 'ar-EG' : 'en-US';
  const formattedUnitPrice = formatCurrencyAmount(unitPrice, userCurrencyCode, currencies, locale);
  const formattedTotalPrice = formatCurrencyAmount(totalPrice, userCurrencyCode, currencies, locale);

  const handleQuantityChange = (value) => {
    const next = Number(value || minQty);
    setQuantity(Math.max(minQty, Math.min(maxQty, next)));
  };

  const handleOrder = async () => {
    const missingRequiredField = dynamicFields.find((field) => !String(fieldValues[field.key] || '').trim());

    if (missingRequiredField) {
      setError(t('product.fillField', { field: missingRequiredField.label }));
      return;
    }

    if (!isPurchasable) {
      addToast(productState.helperText || t('product.currentlyUnavailable'), 'warning');
      return;
    }

    if (!canAfford) {
      addToast(t('product.insufficientBalance'), 'error');
      return;
    }

    if (!hasValidAmount) {
      const message = language === 'en'
        ? 'Unable to place this order because the amount is invalid.'
        : 'لا يمكن تنفيذ الطلب لأن قيمة الشراء غير صالحة.';
      addToast(message, 'error');
      return;
    }

    setError(null);
    setIsOrdering(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 900));
      const normalizedFields = Object.fromEntries(
        dynamicFields.map((field) => [
          field.key,
          sanitizeOrderFieldValue(fieldValues[field.key]).trim(),
        ])
      );
      const fieldsSnapshot = Array.isArray(product?.orderFields) && product.orderFields.length > 0
        ? product.orderFields.map((field) => ({ ...field }))
        : dynamicFields.map((field) => ({
          key: field.key,
          label: field.label,
          placeholder: field.placeholder,
        }));

      const newOrder = {
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
        createdAt: new Date().toISOString()
      };

      const createResult = await addOrder({
        ...newOrder,
        idempotencyKey: `${user.id}-${product.id}-${userIdentifier}-${Date.now()}`
      });

      const nextBalance = Number(createResult?.updatedBalance);
      if (Number.isFinite(nextBalance)) {
        updateUserSession({ coins: normalizeMoneyAmount(nextBalance) });
      } else {
        updateUserSession({ coins: normalizeMoneyAmount(balance - totalPrice) });
      }

      addToast(t('product.orderReceived'), 'success');
      setOrderStatus('success');
    } catch (err) {
      if (err?.code === 'PROVIDER_PRICE_INCREASED') {
        const msg = language === 'en'
          ? 'The price for this service has been updated by the provider. Please refresh and review the new price.'
          : 'عفواً، تم تحديث سعر هذه الخدمة من المصدر. برجاء تحديث الصفحة لرؤية السعر الجديد.';
        addToast(msg, 'warning');
      } else {
        addToast(t('product.orderFailed'), 'error');
      }
    } finally {
      setIsOrdering(false);
    }
  };

  const productTitle = language === 'ar' ? product.nameAr || product.name : product.name;
  const productTitleEn = product.name;
  const autoNote = product.autoFulfillmentEnabled !== false
    ? t('product.productWorks24')
    : t('product.instantExecutionDesc');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70]">
          <motion.button
            type="button"
            className="absolute inset-0 w-full bg-black/80 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-label={t('common.close')}
          />

          <div className="absolute inset-0 flex items-end justify-center p-3 sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0, y: 48, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 32, scale: 0.98 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-red-500/35 bg-gradient-to-b from-[#0f0f12] to-[#040405] text-white shadow-[0_0_0_1px_rgba(255,87,34,0.2),0_25px_80px_rgba(255,68,0,0.24)]"
            >
              <div className="pointer-events-none absolute inset-x-10 -top-20 h-36 rounded-full bg-fuchsia-500/25 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-28 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-violet-600/25 blur-3xl" />

              <div className="relative max-h-[90vh] overflow-y-auto p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-full border border-fuchsia-400/40 bg-[#1a1b1f] px-3 py-1 text-xs text-fuchsia-100">
                    {t('product.productDetails')}
                  </span>
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-fuchsia-400/40 bg-[#17181c] text-gray-200 transition-colors hover:bg-[#23242a]"
                    aria-label={t('common.close')}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {orderStatus === 'success' ? (
                  <motion.div
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className="rounded-[1.6rem] border border-fuchsia-300/35 bg-[radial-gradient(circle_at_top,rgba(217,70,239,0.24),rgba(88,28,135,0.12)_48%,rgba(5,4,10,0.96)_100%)] p-5 text-center shadow-[0_0_34px_rgba(217,70,239,0.22),0_22px_70px_rgba(88,28,135,0.34)]"
                  >
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-fuchsia-300/45 bg-fuchsia-500/15 text-fuchsia-100 shadow-[0_0_26px_rgba(217,70,239,0.55)]">
                      <CheckCircle className="h-7 w-7" />
                    </div>
                    <h3 className="text-lg font-bold text-white">
                      {language === 'ar' ? 'تم إرسال الطلب' : t('product.orderReceived')}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-fuchsia-100/82">
                      {language === 'ar'
                        ? 'تم استلام طلب المنتج بنجاح، وسيتم تنفيذه خلال لحظات.'
                        : 'Your product order has been received and will be processed shortly.'}
                    </p>
                    <Button
                      onClick={onClose}
                      className="mt-5 h-11 w-full rounded-full bg-gradient-to-r from-violet-700 via-fuchsia-600 to-purple-500 text-white shadow-[0_0_28px_rgba(217,70,239,0.36)] hover:from-violet-600 hover:via-fuchsia-500 hover:to-purple-400"
                    >
                      {language === 'ar' ? 'موافق' : 'OK'}
                    </Button>
                  </motion.div>
                ) : (
                  <>
                    <div className="relative overflow-hidden rounded-2xl border border-fuchsia-400/35 bg-black p-1">
                      <img src={product.image ? resolveImageUrl(product.image) : coinsImage} alt={productTitle} className="h-44 w-full rounded-xl object-cover" />
                    </div>

                    <div className="mt-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold leading-tight text-white">{productTitle}</h3>
                    {productTitleEn && productTitleEn !== productTitle && (
                      <p className="mt-1 line-clamp-1 text-xs text-gray-400">{productTitleEn}</p>
                    )}
                  </div>
                  <span className="shrink-0 rounded-full bg-gradient-to-r from-violet-700 via-fuchsia-600 to-purple-500 px-4 py-1.5 text-sm font-bold text-white shadow-[0_0_24px_rgba(217,70,239,0.42)]">
                    {formattedUnitPrice}
                  </span>
                </div>

                {!isPurchasable && (
                  <div className="mt-3 rounded-2xl border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                    {productState.helperText || t('product.currentlyUnavailable')}
                  </div>
                )}

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-[#15161b] p-3">
                    <p className="text-xs text-gray-400">{t('common.quantity')}</p>
                    <Input
                      type="number"
                      min={minQty}
                      max={maxQty}
                      value={quantity}
                      onChange={(e) => handleQuantityChange(e.target.value)}
                      className="mt-2 h-11 rounded-2xl border-white/10 bg-[#0d0e12] text-center text-white focus:ring-fuchsia-500"
                    />
                    <p className="mt-1 text-[10px] text-gray-500">{quantityText}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-[#15161b] p-3">
                    <p className="text-xs text-gray-400">{t('common.total')}</p>
                    <p className="mt-3 text-center text-2xl font-bold text-white">{formattedTotalPrice}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {dynamicFields.map((field) => (
                    <Input
                      key={field.key}
                      label={field.label}
                      placeholder={field.placeholder || t('product.fillField', { field: field.label })}
                      value={fieldValues[field.key] || ''}
                      onChange={(e) => {
                        setFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }));
                        setError(null);
                      }}
                      error={error && !String(fieldValues[field.key] || '').trim() ? error : null}
                      className="h-11 rounded-2xl border-white/10 bg-[#121318] text-white focus:ring-fuchsia-500"
                      disabled={isOrdering}
                      required
                    />
                  ))}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Button
                    variant="ghost"
                    onClick={onClose}
                    disabled={isOrdering}
                    className="h-12 rounded-full border border-fuchsia-500/70 text-fuchsia-200 hover:bg-fuchsia-500/10"
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    onClick={handleOrder}
                    disabled={!canOrder}
                    className="h-12 rounded-full bg-gradient-to-r from-violet-700 via-fuchsia-600 to-purple-500 text-white shadow-[0_0_28px_rgba(217,70,239,0.34),0_16px_24px_-16px_rgba(168,85,247,0.75)] hover:from-violet-600 hover:via-fuchsia-500 hover:to-purple-400"
                  >
                    {isOrdering ? t('product.purchaseLoading') : t('common.buy')}
                  </Button>
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-[#101116] px-3 py-2 text-xs text-gray-300">
                  <Check className="h-4 w-4 text-fuchsia-300" />
                  <span>{autoNote}</span>
                </div>

                {!canAfford && (
                  <div className="mt-3 flex items-center gap-2 rounded-2xl border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-300">
                    <AlertCircle className="h-4 w-4" />
                    {t('product.insufficientBalance')}
                  </div>
                )}
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProductPurchaseModal;

