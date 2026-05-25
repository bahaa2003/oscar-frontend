import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Box,
  Check,
  ChevronLeft,
  Clock3,
  FileText,
  Gem,
  Hash,
  Home,
  LockKeyhole,
  Package,
  Plus,
  UserRound,
  WalletCards,
  Zap,
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useOrderStore from '../store/useOrderStore';
import useSystemStore from '../store/useSystemStore';
import useMediaStore from '../store/useMediaStore';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../components/ui/Toast';
import { resolveImageUrl } from '../utils/imageUrl';
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
import { normalizeMoneyAmount } from '../utils/money';
import { devLogger } from '../utils/devLogger';
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
      fastShipping: 'Fast Shipping',
      available24h: 'Available 24h',
      successTitle: 'Process Completed Successfully',
      successMessage: 'Thank you, your order has been shipped successfully.',
      orderSummary: 'Order Summary',
      product: 'Product',
      price: 'Total Price',
      orderNumber: 'Order Number',
      orderDetails: 'View Order Details',
      backHome: 'Back to Home',
      loading: 'Loading product...',
      balance: 'Balance',
    };
  }

  return {
    total: 'السعر الإجمالي',
    quantity: 'الكمية',
    quantityPlaceholder: 'أدخل الكمية',
    minQuantity: 'الحد الأدنى',
    maxQuantity: 'الحد الأقصى',
    userId: 'معرف المستخدم',
    userIdPlaceholder: 'أدخل معرف المستخدم',
    buyNow: 'شراء الآن',
    buying: 'جاري تنفيذ الطلب...',
    fastShipping: 'شحن فوري',
    available24h: 'متاح 24 ساعة',
    successTitle: 'تمت العملية بنجاح',
    successMessage: 'شكراً لك، تم شحن طلبك بنجاح.',
    orderSummary: 'ملخص الطلب',
    product: 'المنتج',
    price: 'السعر الإجمالي',
    orderNumber: 'رقم الطلب',
    orderDetails: 'عرض تفاصيل الطلب',
    backHome: 'العودة للرئيسية',
    loading: 'جاري تحميل المنتج...',
    balance: 'الرصيد',
  };
};

const formatCount = (value) => Number(value || 0).toLocaleString('en-US');

const multiplyRawDecimalByInteger = (value, multiplier = 1) => {
  const raw = String(value ?? '0').trim();
  const integerMultiplier = Math.max(0, Math.trunc(Number(multiplier) || 0));

  if (!raw || integerMultiplier === 0) return '0';
  if (!/^-?\d+(\.\d+)?$/.test(raw)) return raw;

  const isNegative = raw.startsWith('-');
  const unsigned = isNegative ? raw.slice(1) : raw;
  const [integerPart, fractionPart = ''] = unsigned.split('.');
  const scale = fractionPart.length;
  const base = BigInt(`${integerPart || '0'}${fractionPart}` || '0');
  const multiplied = base * BigInt(integerMultiplier);
  const digits = multiplied.toString().padStart(scale + 1, '0');

  if (scale === 0) {
    return `${isNegative ? '-' : ''}${digits}`;
  }

  const whole = digits.slice(0, -scale) || '0';
  const fraction = digits.slice(-scale);

  return `${isNegative ? '-' : ''}${whole}.${fraction}`;
};

const isQuantityOnlyUser = (user) => (
  String(user?.billingMode || user?.group?.billingMode || '').trim().toLowerCase() === 'quantity_only'
);

const ProductImage = ({ product, className = '' }) => {
  if (product?.image) {
    return (
      <img
        src={resolveImageUrl(product.image)}
        alt={product?.name || ''}
        className={className}
      />
    );
  }

  return (
    <span className={`purchase-product-fallback ${className}`} aria-hidden="true">
      <Package size={44} strokeWidth={1.7} />
    </span>
  );
};

const SummaryValue = ({ value, dir = 'auto' }) => {
  if (value === null || value === undefined || value === '') {
    return <span className="purchase-skeleton purchase-skeleton--text" aria-hidden="true" />;
  }

  return <strong dir={dir}>{value}</strong>;
};

const ProductPurchasePage = () => {
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

  const [product, setProduct] = useState(null);
  const [quantityInput, setQuantityInput] = useState('');
  const [userId, setUserId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const productDescription = product
    ? (language === 'en' ? (product.description || product.descriptionAr) : (product.descriptionAr || product.description))
    : '';

  const quantityMeta = useMemo(() => {
    if (!product) return null;
    return getProductQuantityMeta(product);
  }, [product]);

  const orderFields = useMemo(() => {
    if (!product) return [];
    return resolveProductOrderFields(product, language);
  }, [language, product]);

  useEffect(() => {
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
  }, [productId, navigate, loadProducts]);

  useEffect(() => {
    if (product) {
      const { minQty } = getProductQuantityMeta(product);
      setQuantityInput(String(minQty));
    }
  }, [product?.id]);

  useEffect(() => {
    if (!currencies || currencies.length === 0) {
      loadCurrencies();
    }
  }, [currencies, loadCurrencies]);

  if (isLoading || !product || !quantityMeta) {
    return (
      <div className="product-purchase-page" dir={dir}>
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
  const pricingGroup = user?.groupId || user?.group || 'Normal';
  const pricingGroupPercentage = user?.groupPercentage ?? null;
  
  const unitPriceBase = calculateProductPrice(product, pricingGroup, pricingGroupPercentage);
  const unitPrice = resolveProductUnitPrice(product, userCurrencyCode, currencies, pricingGroup, pricingGroupPercentage);
  const totalPrice = isQuantityOnly ? 0 : normalizeMoneyAmount(Number(unitPrice) * quantity);
  const balance = normalizeMoneyAmount(user?.coins || 0);
  const userCurrencyMeta = getCurrencyMeta(userCurrencyCode, currencies);

  const exactDisplayTotalPrice = isQuantityOnly ? '0' : multiplyRawDecimalByInteger(unitPrice, quantity);
  const formattedTotalPrice = `${exactDisplayTotalPrice} ${userCurrencyMeta.symbol || userCurrencyCode}`;
  const primaryOrderField = orderFields.find((field) => String(field?.key || '').toLowerCase() === 'playerid')
    || orderFields[0]
    || { key: 'playerId', label: copy.userId, placeholder: copy.userIdPlaceholder };
  const primaryOrderFieldKey = String(primaryOrderField?.key || 'playerId').trim() || 'playerId';
  const primaryOrderFieldLabel = primaryOrderField?.label || copy.userId;
  const primaryOrderFieldPlaceholder = primaryOrderField?.placeholder || copy.userIdPlaceholder;

  const handleQuantityChange = (event) => {
    setQuantityInput(event.target.value);
  };

  const handleQuantityBlur = () => {
    setQuantityInput((value) => String(clampProductQuantity(value, product)));
  };

  const handlePurchase = async () => {
    const identifier = sanitizeOrderFieldValue(userId).trim();
    const submittedQuantity = clampProductQuantity(quantityInput, product);
    const submittedTotalPrice = isQuantityOnly
      ? 0
      : normalizeMoneyAmount(Number(unitPrice) * submittedQuantity);

    if (!quantityInput || !identifier) {
      return;
    }

    setQuantityInput(String(submittedQuantity));
    setIsSubmitting(true);
    try {
      const orderId = `#${product?.name?.replace(/\s+/g, '').toUpperCase() || 'ORD'}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;
      const normalizedFields = {
        [primaryOrderFieldKey]: identifier,
      };

      if (!normalizedFields.playerId) {
        normalizedFields.playerId = identifier;
      }
      if (!normalizedFields.userId) {
        normalizedFields.userId = identifier;
      }

      const fieldsSnapshot = Array.isArray(product?.orderFields) && product.orderFields.length > 0
        ? product.orderFields.map((field) => ({ ...field }))
        : orderFields.map((field) => ({
          key: field.key,
          label: field.label,
          placeholder: field.placeholder,
        }));

      const payload = {
        id: orderId,
        userId: user?.id,
        productId: product.id,
        productName: product.name,
        quantity: submittedQuantity,
        total: submittedTotalPrice,
        playerId: identifier,
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
        idempotencyKey: `${user?.id || 'user'}-${product.id}-${identifier}-${Date.now()}`,
        preferLegacyOrderEndpoint: true,
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

      setSuccessOrder({
        orderId: returnedId,
        orderNumber: returnedOrderNumber,
        quantity: submittedQuantity,
        total: submittedTotalPrice,
      });

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
        value: formattedTotalPrice,
        icon: <WalletCards size={20} />,
        dir: 'ltr',
      }] : []),
      {
        label: copy.orderNumber,
        value: successOrder.orderNumber || successOrder.orderId,
        icon: <Hash size={20} />,
        dir: 'ltr',
      },
    ];

    return (
      <motion.div
        initial={false}
        animate={{ opacity: 1 }}
        className="product-purchase-page"
        dir={dir}
      >
        <section className="purchase-phone purchase-phone--success" aria-label={copy.successTitle}>
          <div className="purchase-bg-lines" />
          <div className="purchase-confetti" aria-hidden="true">
            {Array.from({ length: 16 }).map((_, index) => (
              <span key={index} style={{ '--i': index }} />
            ))}
          </div>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="purchase-glass-button purchase-success-back"
            aria-label={dir === 'rtl' ? 'رجوع' : 'Back'}
          >
            <ChevronLeft size={25} strokeWidth={3} />
          </button>

          <motion.div
            initial={false}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.12 }}
            className="purchase-success-mark"
          >
            <span className="purchase-success-bloom" />
            <span className="purchase-check-ring">
              <Check size={82} strokeWidth={3.3} />
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
                    <SummaryValue value={row.value} dir={row.dir} />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <div className="purchase-actions">
            <button
              type="button"
              onClick={() => navigate(`/orders/${encodeURIComponent(successOrder.orderId)}`)}
              className="purchase-primary-button"
            >
              <span>{copy.orderDetails}</span>
              <FileText size={27} />
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="purchase-secondary-button"
            >
              <span>{copy.backHome}</span>
              <Home size={27} />
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
      className="product-purchase-page"
      dir={dir}
    >
      <section className="purchase-phone purchase-phone--buy !max-w-[26rem] !p-3 sm:!p-4" aria-label={product?.name || copy.buyNow}>
        <div className="purchase-bg-lines" />

        <header className="purchase-header !min-h-9 !gap-2" dir="ltr">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="purchase-glass-button !h-9 !w-9 !rounded-lg"
            aria-label={dir === 'rtl' ? 'رجوع' : 'Back'}
          >
            <ChevronLeft size={20} strokeWidth={2.7} />
          </button>

          <div className="purchase-balance !min-h-9 !gap-1.5 !rounded-lg !px-2" aria-label={copy.balance}>
            <span className="purchase-balance-icon !h-5 !w-5 !rounded-md">
              <Gem size={13} strokeWidth={2.6} />
            </span>
            <span 
              className="purchase-balance-desc !max-w-[9rem] !text-xs text-slate-800 dark:text-[rgb(236_244_255/0.95)]" 
              title={productDescription}
            >
              {productDescription}
            </span>
            <Plus size={17} strokeWidth={2.8} />
          </div>
        </header>

        <motion.div
          initial={false}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.1 }}
          className="purchase-product-hero !h-20 !mt-0"
        >
          <span className="purchase-orbit purchase-orbit--cyan !h-4 !w-24" />
          <span className="purchase-orbit purchase-orbit--pink !h-5 !w-28" />
          <div className="purchase-product-orb !h-16 !w-16">
            <ProductImage product={product} className="purchase-product-image !h-12 !w-12 !object-contain" />
          </div>
        </motion.div>

        {product?.name ? (
          <h1 className="purchase-product-title !mb-2 !text-base !leading-5">{product.name}</h1>
        ) : (
          <div className="purchase-skeleton purchase-skeleton--title" />
        )}

        <div className="purchase-badges !mb-2 !gap-1.5" aria-label={dir === 'rtl' ? 'حالة المنتج' : 'Product status'}>
          <span className="purchase-badge !min-h-0 !px-2 !py-0.5 !text-xs !shadow-none">
            <Zap size={12} fill="currentColor" />
            {copy.fastShipping}
          </span>
          <span className="purchase-badge !min-h-0 !border-cyan-400 !bg-cyan-100 !px-2 !py-0.5 !text-xs !text-cyan-950 !shadow-none dark:!border-cyan-400/20 dark:!bg-cyan-400/10 dark:!text-cyan-200">
            <Clock3 size={12} className="!text-cyan-700 dark:!text-cyan-300" />
            {copy.available24h}
          </span>
        </div>


        {!isQuantityOnly && (
          <article className="purchase-card purchase-price-card !mb-2 !min-h-14 !p-3 !pe-10">
            <span className="purchase-price-icon !right-2 !h-7 !w-7 !rounded-lg">
              <WalletCards size={17} className="!h-4 !w-4" />
            </span>
            <div>
              <p className="!text-xs">{copy.total}</p>
              <strong className="!whitespace-normal !break-all !text-sm !leading-5" dir="ltr">{formattedTotalPrice}</strong>
            </div>
          </article>
        )}
        <article className="purchase-card purchase-field-card !mb-2 !p-3">
          <h2 className="!text-xs">{copy.quantity}</h2>
          <label className="purchase-input-shell !mt-2 !min-h-9 !rounded-lg">
            <span className="purchase-sr-only">{copy.quantity}</span>
            <input
              type="number"
              inputMode="numeric"
              min={quantityMeta.minQty}
              max={quantityMeta.maxQty}
              step={quantityMeta.stepQty}
              value={quantityInput}
              onChange={handleQuantityChange}
              onBlur={handleQuantityBlur}
              placeholder={copy.quantityPlaceholder}
              className="!min-h-9 !px-2 !pr-8 !text-xs"
            />
            <FileText size={16} className="!h-4 !w-4" aria-hidden="true" />
          </label>

          <div className="purchase-limits !mt-2 !gap-2">
            <span>
              <small className="!text-[10px]">{copy.minQuantity}</small>
              <strong className="!text-xs" dir="ltr">{formatCount(quantityMeta.minQty)}</strong>
            </span>
            <span>
              <small className="!text-[10px]">{copy.maxQuantity}</small>
              <strong className="!text-xs" dir="ltr">{formatCount(quantityMeta.maxQty)}</strong>
            </span>
          </div>
        </article>

        <article className="purchase-card purchase-field-card !mb-2 !p-3">
          <h2 className="!text-xs">{primaryOrderFieldLabel}</h2>
          <label className="purchase-input-shell purchase-input-shell--user !mt-2 !min-h-9 !rounded-lg">
            <span className="purchase-sr-only">{primaryOrderFieldLabel}</span>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder={primaryOrderFieldPlaceholder}
              className="!min-h-9 !px-2 !pr-8 !text-xs"
            />
            <UserRound size={16} className="!h-4 !w-4" aria-hidden="true" />
          </label>
        </article>

        <button
          type="button"
          onClick={handlePurchase}
          disabled={isSubmitting || !quantityInput || !userId}
          className="purchase-primary-button purchase-buy-button !mt-3 !min-h-10 !gap-2 !rounded-xl !text-sm"
        >
          <span>{isSubmitting ? copy.buying : copy.buyNow}</span>
          <LockKeyhole size={19} strokeWidth={2.5} />
        </button>
      </section>
    </motion.div>
  );
};

export default ProductPurchasePage;
