import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Copy, Landmark, Loader, ReceiptText, ShieldCheck, WalletCards } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import UploadReceiptBox from '../components/wallet/UploadReceiptBox';
import { useLanguage } from '../context/LanguageContext';
import useSystemStore from '../store/useSystemStore';
import useTopupStore from '../store/useTopupStore';
import useAuthStore from '../store/useAuthStore';
import { useToast } from '../components/ui/Toast';
import { inputBaseClassName, textareaClassName } from '../components/ui/Input';
import { findPaymentMethodById } from '../utils/paymentSettings';
import { devLogger } from '../utils/devLogger';
import { resolveImageUrl } from '../utils/imageUrl';

const normalizeMethodType = (type) => String(type || '').trim().toLowerCase();

const getSenderDetailRequirement = (method) => {
  const type = normalizeMethodType(method?.type);
  if (type === 'mobile_wallet' || type === 'e_wallet' || type === 'ewallet') {
    return {
      field: 'senderWalletNumber',
      label: 'رقم المحفظة المحول منها',
      placeholder: 'أدخل رقم المحفظة التي تم التحويل منها',
      validationMessage: 'يرجى إدخال رقم المحفظة المحول منها',
    };
  }

  if (type === 'usdt' || type === 'crypto') {
    return {
      field: 'senderWalletAddress',
      label: 'عنوان المحفظة المحول منها',
      placeholder: 'أدخل عنوان محفظة USDT التي تم التحويل منها',
      validationMessage: 'يرجى إدخال عنوان المحفظة المحول منها',
    };
  }

  return null;
};

const getMethodPresentation = (method) => {
  const token = `${method?.id || ''} ${method?.name || ''}`.toLowerCase();
  const type = normalizeMethodType(method?.type);

  if (token.includes('vodafone')) return { icon: 'VC', color: 'from-red-500 to-pink-500' };
  if (token.includes('etisalat')) return { icon: 'EC', color: 'from-green-500 to-teal-500' };
  if (token.includes('orange')) return { icon: 'OC', color: 'from-orange-500 to-red-500' };
  if (type === 'bank_transfer') return { icon: 'BT', color: 'from-blue-500 to-purple-500' };
  if (type === 'usdt' || type === 'crypto') return { icon: 'USDT', color: 'from-emerald-500 to-cyan-600' };
  if (type === 'credit_card') return { icon: 'CC', color: 'from-amber-500 to-orange-600' };

  return { icon: 'PM', color: 'from-emerald-500 to-teal-600' };
};

const getCurrencyRate = (currencies = [], currencyCode = 'USD') => {
  const normalizedCode = String(currencyCode || '').trim().toUpperCase();
  if (!normalizedCode) return null;

  const matchedCurrency = (Array.isArray(currencies) ? currencies : []).find(
    (currency) => (
      currency?.isActive !== false
      && String(currency?.code || '').trim().toUpperCase() === normalizedCode
    )
  );
  const matchedRate = Number(matchedCurrency?.rate);
  if (Number.isFinite(matchedRate) && matchedRate > 0) return matchedRate;

  if (normalizedCode === 'USD') return 1;
  return null;
};

const getAccountNumberLabel = (method, isRTL) => {
  const type = normalizeMethodType(method?.type);
  if (type === 'mobile_wallet' || type === 'e_wallet' || type === 'ewallet') {
    return isRTL ? 'رقم المحفظة' : 'Wallet number';
  }
  if (type === 'usdt' || type === 'crypto') {
    return isRTL ? 'عنوان المحفظة' : 'Wallet address';
  }
  if (type === 'bank_transfer') {
    return isRTL ? 'رقم الحساب / IBAN' : 'Account / IBAN';
  }
  return isRTL ? 'رقم الحساب' : 'Account number';
};

const DetailItem = ({ label, value, isRTL, children }) => (
  <div className={`rounded-[1rem] border border-[color:rgb(var(--color-border-rgb)/0.62)] bg-[color:rgb(var(--color-surface-rgb)/0.7)] px-3.5 py-3 ${isRTL ? 'text-right' : 'text-left'}`}>
    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">{label}</p>
    <div className="mt-1.5 min-w-0 text-sm font-black leading-6 text-[var(--color-text)]">
      {children || <span className="break-words">{value}</span>}
    </div>
  </div>
);

const SummaryRow = ({ label, value, isRTL, strong = false }) => (
  <div className={`flex items-center justify-between gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
    <span className={`text-sm ${strong ? 'font-black text-[var(--color-text)]' : 'font-medium text-[var(--color-text-secondary)]'}`}>
      {label}
    </span>
    <span className={`shrink-0 font-black ${strong ? 'text-base text-[var(--color-primary)]' : 'text-sm text-[var(--color-text)]'}`}>
      {value}
    </span>
  </div>
);

const PaymentDetails = () => {
  const { methodId } = useParams();
  const { dir } = useLanguage();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { paymentSettings, currencies, loadPaymentSettings, loadCurrencies } = useSystemStore();
  const { addToast } = useToast();
  const isRTL = dir === 'rtl';

  const [formData, setFormData] = useState({
    amount: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    senderWalletNumber: '',
    senderWalletAddress: '',
    notes: '',
  });
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadPaymentSettings({ force: true });
    loadCurrencies();
  }, [loadPaymentSettings, loadCurrencies]);

  const selectedMethodEntry = useMemo(
    () => findPaymentMethodById(paymentSettings, methodId, { fallbackToDefault: false }),
    [paymentSettings, methodId]
  );

  const group = selectedMethodEntry?.group || null;
  const method = selectedMethodEntry?.method || null;

  const methodPresentation = useMemo(
    () => getMethodPresentation(method),
    [method]
  );

  const methodFields = method?.fields || ['amount'];
  const senderDetailRequirement = useMemo(
    () => getSenderDetailRequirement(method),
    [method]
  );
  const visibleMethodFields = useMemo(
    () => methodFields.filter((field) => !['senderNumber', 'senderWalletNumber', 'senderWalletAddress'].includes(field)),
    [methodFields]
  );
  const requiresReceipt = Boolean(method?.accountNumber);
  const feePercent = useMemo(() => {
    const value = Number(method?.feePercent);
    if (!Number.isFinite(value)) return 0;
    return Math.min(100, Math.max(0, value));
  }, [method?.feePercent]);
  const enteredAmount = Number(formData.amount || 0);
  const baseAmount = Number.isFinite(enteredAmount) && enteredAmount > 0 ? enteredAmount : 0;
  const feeAmount = Number(((baseAmount * feePercent) / 100).toFixed(2));
  const payableAmount = Number((baseAmount + feeAmount).toFixed(2));
  const paymentCurrencyCode = String(group?.currency || method?.currency || user?.currency || 'USD').toUpperCase();
  const paymentCurrencyRate = useMemo(
    () => getCurrencyRate(currencies, paymentCurrencyCode),
    [currencies, paymentCurrencyCode]
  );
  const usdCurrencyRate = useMemo(
    () => getCurrencyRate(currencies, 'USD') || 1,
    [currencies]
  );
  const usdPreviewAmount = useMemo(() => {
    const amountValue = Number(formData.amount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) return null;
    if (!Number.isFinite(paymentCurrencyRate) || paymentCurrencyRate <= 0) return null;

    const convertedAmount = (amountValue / paymentCurrencyRate) * usdCurrencyRate;
    if (!Number.isFinite(convertedAmount) || convertedAmount <= 0) return null;

    return convertedAmount;
  }, [formData.amount, paymentCurrencyRate, usdCurrencyRate]);
  const usdPreviewLabel = useMemo(() => {
    if (!Number.isFinite(usdPreviewAmount) || usdPreviewAmount <= 0) return '';

    const formattedAmount = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(usdPreviewAmount);

    return `≈ ${formattedAmount} USD`;
  }, [usdPreviewAmount]);

  const formatMoney = (value) => {
    const safeValue = Number(value || 0);

    try {
      return new Intl.NumberFormat(isRTL ? 'ar-EG' : 'en-US', {
        style: 'currency',
        currency: paymentCurrencyCode,
        maximumFractionDigits: 2,
      }).format(safeValue);
    } catch (_error) {
      return `${safeValue.toFixed(2)} ${paymentCurrencyCode}`;
    }
  };

  const handleInputChange = (field, value) => {
    setFormError('');
    setSubmitStatus(null);
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleReceiptUpload = (file) => {
    setFormError('');
    setSubmitStatus(null);
    setUploadedFile(file);
  };

  const handleCopyAccount = async () => {
    const value = String(method?.accountNumber || '').trim();
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      addToast(
        t('payments.copySuccess', { defaultValue: dir === 'rtl' ? 'تم نسخ الرقم' : 'Number copied' }),
        'success'
      );
    } catch (_error) {
      addToast(
        t('payments.copyFailed', { defaultValue: dir === 'rtl' ? 'تعذر نسخ الرقم' : 'Unable to copy number' }),
        'error'
      );
    }
  };

  const validate = () => {
    const amountValue = Number(formData.amount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) return t('payments.validationAmount');
    if (senderDetailRequirement && !String(formData[senderDetailRequirement.field] || '').trim()) {
      return senderDetailRequirement.validationMessage;
    }
    if (requiresReceipt && !uploadedFile) return t('payments.validationReceipt');
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationMessage = validate();
    if (validationMessage) {
      setFormError(validationMessage);
      setSubmitStatus(null);
      addToast(validationMessage, 'error');
      return;
    }

    setFormError('');
    setSubmitStatus(null);
    setIsSubmitting(true);
    try {
      const freshSettings = await loadPaymentSettings({ force: true });
      const freshEntry = findPaymentMethodById(freshSettings, methodId, { fallbackToDefault: false });
      const freshMethod = freshEntry?.method || null;
      const freshGroup = freshEntry?.group || null;

      if (!freshMethod) {
        addToast('طريقة الدفع لم تعد متاحة. تم تحديث البيانات من السيرفر.', 'error');
        navigate('/wallet/add-balance');
        return;
      }

      const freshFeePercentValue = Number(freshMethod?.feePercent);
      const freshFeePercent = Number.isFinite(freshFeePercentValue)
        ? Math.min(100, Math.max(0, freshFeePercentValue))
        : 0;
      const freshFeeAmount = Number(((baseAmount * freshFeePercent) / 100).toFixed(2));
      const freshPayableAmount = Number((baseAmount + freshFeeAmount).toFixed(2));
      const freshSenderRequirement = getSenderDetailRequirement(freshMethod);
      const senderValue = freshSenderRequirement
        ? String(formData[freshSenderRequirement.field] || '').trim()
        : '';

      if (freshSenderRequirement && !senderValue) {
        addToast(freshSenderRequirement.validationMessage, 'error');
        setFormError(freshSenderRequirement.validationMessage);
        return;
      }

      const senderDetails = freshSenderRequirement ? {
        methodType: normalizeMethodType(freshMethod?.type),
        field: freshSenderRequirement.field,
        label: freshSenderRequirement.label,
        value: senderValue,
      } : null;
      const { requestTopup } = useTopupStore.getState();

      await requestTopup({
        requestedAmount: baseAmount,
        amount: baseAmount,
        paymentMethodId: freshMethod?.id || '',
        paymentFeePercent: freshFeePercent,
        paymentFeeAmount: freshFeeAmount,
        amountWithFee: freshPayableAmount,
        senderDetails,
        senderWalletNumber: freshSenderRequirement?.field === 'senderWalletNumber' ? senderValue : '',
        senderWalletAddress: freshSenderRequirement?.field === 'senderWalletAddress' ? senderValue : '',
        transferredFromNumber: senderValue,
        proofImage: uploadedFile || null,
        paymentChannel: freshMethod?.name || methodId || '',
        paymentMethodType: normalizeMethodType(freshMethod?.type),
        currencyCode: freshGroup?.currency || freshMethod?.currency || user?.currency || 'USD',
        userId: user?.id || '',
        userName: user?.name || '',
        notes: formData.notes || '',
        type: 'regular',
      });

      setSubmitStatus('success');
    } catch (error) {
      devLogger.warnUnlessBenign('Topup submission failed:', error);
      setFormError(t('payments.submitErrorDesc'));
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessConfirm = () => {
    navigate('/wallet');
  };

  const fieldConfigs = {
    amount: {
      label: t('payments.fields.amount'),
      placeholder: t('payments.fields.amountPlaceholder'),
      type: 'number',
      min: '0.01',
      step: '0.01',
    },
    senderNumber: {
      label: t('payments.fields.senderNumber'),
      placeholder: t('payments.fields.senderNumberPlaceholder'),
      type: 'tel',
    },
    transactionId: {
      label: t('payments.fields.transactionId'),
      placeholder: t('payments.fields.transactionIdPlaceholder'),
      type: 'text',
    },
    cardNumber: {
      label: t('payments.fields.cardNumber'),
      placeholder: t('payments.fields.cardNumberPlaceholder'),
      type: 'text',
    },
    expiryDate: {
      label: t('payments.fields.expiryDate'),
      placeholder: t('payments.fields.expiryDatePlaceholder'),
      type: 'text',
    },
    cvv: {
      label: t('payments.fields.cvv'),
      placeholder: t('payments.fields.cvvPlaceholder'),
      type: 'text',
    },
  };

  if (!method) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="rounded-2xl border border-gray-200 bg-white/80 p-8 text-center dark:border-gray-800 dark:bg-gray-900/70">
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">{t('payments.invalidMethodTitle')}</h1>
          <button
            type="button"
            onClick={() => navigate('/wallet/add-balance')}
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-300 dark:hover:text-indigo-200"
          >
            {t('payments.invalidMethodAction')}
          </button>
        </div>
      </div>
    );
  }

  const pageTitle = group?.name || method.name || t('payments.paymentDetails');
  const methodLabel = method.name && method.name !== pageTitle ? method.name : '';
  const accountNumberLabel = getAccountNumberLabel(method, isRTL);
  const headerDescription = dir === 'rtl'
    ? 'حوّل المبلغ على بيانات الحساب، ثم ارفع إيصال واضح عشان تتم مراجعة الطلب بسرعة.'
    : 'Transfer the amount to the account details, then upload a clear receipt for review.';
  const formInputClassName = `${inputBaseClassName} !h-11 !rounded-xl !border-[color:rgb(var(--color-border-rgb)/0.7)] !bg-[color:rgb(var(--color-surface-rgb)/0.92)] !px-3.5 !text-sm ${isRTL ? 'text-right' : 'text-left'}`;
  const formTextareaClassName = `${textareaClassName} !rounded-xl !border-[color:rgb(var(--color-border-rgb)/0.7)] !bg-[color:rgb(var(--color-surface-rgb)/0.92)] !px-3.5 !text-sm ${isRTL ? 'text-right' : 'text-left'}`;

  return (
    <div className="space-y-5" dir={dir}>
      <div className="mx-auto w-full max-w-6xl space-y-5">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className={`relative overflow-hidden rounded-[1.4rem] border border-[color:rgb(var(--color-primary-rgb)/0.2)] bg-[radial-gradient(circle_at_top_right,rgb(var(--color-primary-rgb)/0.18),transparent_34%),linear-gradient(135deg,rgb(var(--color-card-rgb)/0.96),rgb(var(--color-surface-rgb)/0.88))] p-4 shadow-[0_18px_42px_-32px_rgb(var(--color-primary-rgb)/0.55)] backdrop-blur-xl sm:p-5 ${isRTL ? 'text-right' : 'text-left'}`}
        >
          <div className={`relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
            <div className={`flex min-w-0 items-center gap-3.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
              {method.image ? (
                <img
                  src={resolveImageUrl(method.image)}
                  alt={method.name}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="h-14 w-14 shrink-0 rounded-[1rem] border border-[color:rgb(var(--color-border-rgb)/0.72)] bg-[var(--color-card)] object-cover shadow-[0_14px_26px_-20px_rgba(15,23,42,0.5)] sm:h-16 sm:w-16"
                />
              ) : (
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[1rem] bg-gradient-to-br ${methodPresentation.color} shadow-[0_14px_26px_-20px_rgba(15,23,42,0.55)] sm:h-16 sm:w-16`}>
                  <span className="text-xs font-bold text-white">{methodPresentation.icon}</span>
                </div>
              )}

              <div className="min-w-0">
                <div className={`mb-2 flex flex-wrap items-center gap-2 ${isRTL ? 'justify-end' : 'justify-start'}`}>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-300/55 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {dir === 'rtl' ? 'دفع آمن' : 'Secure payment'}
                  </span>
                  <span className="rounded-full border border-[color:rgb(var(--color-primary-rgb)/0.24)] bg-[color:rgb(var(--color-primary-rgb)/0.1)] px-2.5 py-1 text-[11px] font-black text-[var(--color-primary)]">
                    {paymentCurrencyCode}
                  </span>
                </div>

                <h1 className="truncate text-2xl font-black tracking-tight text-[var(--color-text)] sm:text-3xl">
                  {pageTitle}
                </h1>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
                  {headerDescription}
                </p>
              </div>
            </div>

            <div className={`grid shrink-0 grid-cols-2 gap-2 sm:min-w-[16rem] ${isRTL ? 'text-right' : 'text-left'}`}>
              <div className="rounded-[1rem] border border-[color:rgb(var(--color-border-rgb)/0.6)] bg-[color:rgb(var(--color-surface-rgb)/0.72)] px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                  {dir === 'rtl' ? 'الطريقة' : 'Method'}
                </p>
                <p className="mt-1 truncate text-sm font-black text-[var(--color-text)]">
                  {methodLabel || method.name}
                </p>
              </div>
              <div className="rounded-[1rem] border border-[color:rgb(var(--color-border-rgb)/0.6)] bg-[color:rgb(var(--color-surface-rgb)/0.72)] px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                  {dir === 'rtl' ? 'العملة' : 'Currency'}
                </p>
                <p className="mt-1 truncate text-sm font-black text-[var(--color-text)]">
                  {paymentCurrencyCode}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className={`grid gap-4 lg:items-start ${method.accountNumber ? 'lg:grid-cols-[0.92fr_1.08fr]' : 'lg:grid-cols-1'}`}>
        {method.accountNumber && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.12, ease: 'easeOut' }}
            className="overflow-hidden rounded-[1.35rem] border border-[color:rgb(var(--color-border-rgb)/0.74)] bg-[color:rgb(var(--color-card-rgb)/0.94)] p-4 shadow-[0_18px_34px_-30px_rgba(15,23,42,0.32)] backdrop-blur-xl sm:p-5 lg:sticky lg:top-5"
          >
            <div className={`mb-4 flex items-center justify-between gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={isRTL ? 'text-right' : 'text-left'}>
                <h3 className="text-base font-black text-[var(--color-text)]">{t('payments.accountDetails')}</h3>
                <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">
                  {dir === 'rtl' ? 'استخدم البيانات دي للتحويل فقط.' : 'Use these details for the transfer only.'}
                </p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] border border-[color:rgb(var(--color-primary-rgb)/0.24)] bg-[color:rgb(var(--color-primary-rgb)/0.1)] text-[var(--color-primary)]">
                <Landmark className="h-5 w-5" />
              </span>
            </div>

            <div className="space-y-3 rounded-[1.15rem] border border-[color:rgb(var(--color-border-rgb)/0.68)] bg-[color:rgb(var(--color-surface-rgb)/0.54)] p-3 sm:p-4">
              <DetailItem label={accountNumberLabel} isRTL={isRTL}>
                <div className={`flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
                  <span className="min-w-0 break-all font-mono text-base font-black text-[var(--color-text)]">
                    {method.accountNumber}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyAccount}
                    className={`inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full border border-[color:rgb(var(--color-primary-rgb)/0.24)] bg-[color:rgb(var(--color-primary-rgb)/0.1)] px-3 text-xs font-black text-[var(--color-primary)] transition hover:bg-[color:rgb(var(--color-primary-rgb)/0.16)] ${isRTL ? 'flex-row-reverse self-end sm:self-auto' : 'self-start sm:self-auto'}`}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>{t('payments.copyAccount', { defaultValue: dir === 'rtl' ? 'نسخ الرقم' : 'Copy number' })}</span>
                  </button>
                </div>
              </DetailItem>

              {method.accountName && (
                <DetailItem
                  label={t('payments.accountHolder', { defaultValue: dir === 'rtl' ? 'اسم صاحب الحساب' : 'Account holder' })}
                  value={method.accountName}
                  isRTL={isRTL}
                />
              )}

              {method.bankName && (
                <DetailItem
                  label={dir === 'rtl' ? 'الجهة / البنك' : 'Bank / provider'}
                  value={method.bankName}
                  isRTL={isRTL}
                />
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <DetailItem label={dir === 'rtl' ? 'مجموعة الدفع' : 'Payment group'} value={pageTitle} isRTL={isRTL} />
                <DetailItem label={dir === 'rtl' ? 'العملة' : 'Currency'} value={paymentCurrencyCode} isRTL={isRTL} />
              </div>
            </div>

            <div className={`mt-4 rounded-[1rem] border border-amber-300/42 bg-amber-500/10 p-3 text-xs leading-6 text-amber-700 dark:text-amber-200 ${isRTL ? 'text-right' : 'text-left'}`}>
              {dir === 'rtl'
                ? 'بعد التحويل، ارفع الإيصال واضح ويكون ظاهر فيه المبلغ والتاريخ ورقم العملية.'
                : 'After transfer, upload a clear receipt showing the amount, date, and transaction number.'}
            </div>
          </motion.div>
        )}

        <motion.form
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.18, ease: 'easeOut' }}
          onSubmit={handleSubmit}
          className="mb-8 rounded-[1.35rem] border border-[color:rgb(var(--color-border-rgb)/0.74)] bg-[color:rgb(var(--color-card-rgb)/0.94)] p-4 shadow-[0_18px_34px_-30px_rgba(15,23,42,0.32)] backdrop-blur-xl sm:p-5"
        >
          <div className={`mb-5 flex items-center justify-between gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={isRTL ? 'text-right' : 'text-left'}>
              <h3 className="text-base font-black text-[var(--color-text)]">{t('payments.paymentDetails')}</h3>
              <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">
                {dir === 'rtl' ? 'املأ البيانات المطلوبة وارفق الإيصال في نفس الصفحة.' : 'Fill in the required details and attach the receipt on this page.'}
              </p>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] border border-emerald-300/55 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
              <ReceiptText className="h-5 w-5" />
            </span>
          </div>

          {visibleMethodFields.map((field) => {
            const config = fieldConfigs[field];
            if (!config) return null;

            return (
              <div key={field} className="mb-4">
                <label className={`mb-2 block text-sm font-bold text-[var(--color-text-secondary)] ${isRTL ? 'text-right' : 'text-left'}`}>
                  {config.label}
                </label>
                <input
                  type={config.type}
                  value={formData[field] || ''}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  placeholder={config.placeholder}
                  min={config.min}
                  step={config.step}
                  className={formInputClassName}
                  disabled={isSubmitting}
                />
                {field === 'amount' && usdPreviewLabel && (
                  <p className={`mt-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-300 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {usdPreviewLabel}
                  </p>
                )}
              </div>
            );
          })}

          {senderDetailRequirement && (
            <div className="mb-4">
              <label className={`mb-2 block text-sm font-bold text-[var(--color-text-secondary)] ${isRTL ? 'text-right' : 'text-left'}`}>
                {senderDetailRequirement.label}
                <span className="text-rose-500"> *</span>
              </label>
              <input
                type="text"
                value={formData[senderDetailRequirement.field] || ''}
                onChange={(e) => handleInputChange(senderDetailRequirement.field, e.target.value)}
                placeholder={senderDetailRequirement.placeholder}
                className={formInputClassName}
                disabled={isSubmitting}
                required
              />
            </div>
          )}

          <div className="mb-6">
            <label className={`mb-2 block text-sm font-bold text-[var(--color-text-secondary)] ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('payments.notesOptional')}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder={t('payments.notesPlaceholder')}
              rows={3}
              className={formTextareaClassName}
              disabled={isSubmitting}
            />
          </div>

          {requiresReceipt && (
            <div className="mb-6">
              <label className={`mb-2 block text-sm font-bold text-[var(--color-text-secondary)] ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('payments.uploadReceipt')}
              </label>
              <UploadReceiptBox onFileUpload={handleReceiptUpload} />
            </div>
          )}

          <div className="mb-6 overflow-hidden rounded-[1.15rem] border border-[color:rgb(var(--color-primary-rgb)/0.2)] bg-[linear-gradient(135deg,rgb(var(--color-primary-rgb)/0.08),rgb(var(--color-surface-rgb)/0.82))] p-4 shadow-[0_14px_30px_-28px_rgb(var(--color-primary-rgb)/0.55)]">
            <div className={`mb-3 flex items-center gap-2 ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.85rem] border border-[color:rgb(var(--color-primary-rgb)/0.22)] bg-[color:rgb(var(--color-primary-rgb)/0.12)] text-[var(--color-primary)]">
                <WalletCards className="h-4.5 w-4.5" />
              </span>
              <div className="min-w-0">
                <h4 className="text-sm font-black text-[var(--color-text)]">
                  {dir === 'rtl' ? 'ملخص التحويل' : 'Transfer summary'}
                </h4>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {dir === 'rtl' ? 'الإجمالي بيتحدث حسب المبلغ والرسوم.' : 'Total updates based on amount and fees.'}
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              <SummaryRow
                label={t('payments.subtotalLabel', {
                  defaultValue: dir === 'rtl' ? 'المبلغ الأساسي' : 'Base amount',
                })}
                value={formatMoney(baseAmount)}
                isRTL={isRTL}
              />

              {feePercent > 0 && (
                <SummaryRow
                  label={`${t('payments.feeAmountLabel', {
                    defaultValue: dir === 'rtl' ? 'رسوم التحويل' : 'Payment fee',
                  })} (${feePercent}%)`}
                  value={formatMoney(feeAmount)}
                  isRTL={isRTL}
                />
              )}

              <div className="border-t border-[color:rgb(var(--color-border-rgb)/0.68)] pt-3">
                <SummaryRow
                  label={t('payments.totalToTransferLabel', {
                    defaultValue: dir === 'rtl' ? 'الإجمالي المطلوب تحويله' : 'Total to transfer',
                  })}
                  value={formatMoney(payableAmount)}
                  isRTL={isRTL}
                  strong
                />
              </div>
            </div>
          </div>

          {formError && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className={`mb-4 rounded-[1rem] border border-rose-200 bg-rose-50/90 p-3.5 shadow-[0_14px_28px_-26px_rgba(225,29,72,0.55)] dark:border-rose-900/70 dark:bg-rose-950/25 ${isRTL ? 'text-right' : 'text-left'}`}
            >
              <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.75rem] border border-rose-200 bg-white text-rose-600 dark:border-rose-900/70 dark:bg-slate-950 dark:text-rose-300">
                  <AlertCircle className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-black text-rose-700 dark:text-rose-200">
                    {dir === 'rtl' ? 'راجع بيانات الدفع' : 'Check payment details'}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-rose-700/85 dark:text-rose-100/80">{formError}</p>
                </div>
              </div>
            </motion.div>
          )}

          <motion.button
            type="submit"
            aria-busy={isSubmitting}
            whileTap={{ scale: 0.985 }}
            whileHover={!isSubmitting ? { y: -1 } : undefined}
            className="group flex w-full items-center justify-center gap-2 rounded-[1rem] bg-gradient-to-r from-[var(--color-primary)] via-sky-500 to-emerald-500 px-6 py-4 font-black text-white shadow-[0_18px_34px_-24px_rgba(14,165,233,0.75)] transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_38px_-22px_rgba(16,185,129,0.78)] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader className="h-5 w-5 animate-spin" />
                <span>{t('common.processing')}</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                <span>{t('payments.confirmPayment')}</span>
              </>
            )}
          </motion.button>
        </motion.form>
        </div>

        {submitStatus === 'success' && (
          <div className="fixed inset-0 z-[240] flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="w-full max-w-sm rounded-2xl border border-emerald-400/25 bg-white p-5 text-center shadow-2xl shadow-emerald-950/20 dark:border-emerald-400/20 dark:bg-gray-950"
            >
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-600 dark:text-emerald-300">
                <CheckCircle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-950 dark:text-white">
                {dir === 'rtl' ? 'تم إرسال الطلب' : t('payments.submitSuccessTitle')}
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                {dir === 'rtl'
                  ? 'تم إرسال طلب إضافة أموال، في انتظار المراجعة. لحظات وسوف يتم التنفيذ خلال لحظات.'
                  : t('payments.submitSuccessDesc')}
              </p>
              <button
                type="button"
                onClick={handleSuccessConfirm}
                className="mt-5 h-10 w-full rounded-xl bg-emerald-500 px-4 text-sm font-bold text-white transition hover:bg-emerald-600"
              >
                {dir === 'rtl' ? 'موافق' : 'OK'}
              </button>
            </motion.div>
          </div>
        )}

        {submitStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className={`rounded-[1.2rem] border border-rose-200 bg-white/90 p-4 shadow-[0_18px_34px_-30px_rgba(225,29,72,0.45)] backdrop-blur-xl dark:border-rose-900/70 dark:bg-slate-950/78 ${isRTL ? 'text-right' : 'text-left'}`}
          >
            <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] border border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900/70 dark:bg-rose-950/35 dark:text-rose-300">
                <AlertCircle className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-black text-slate-950 dark:text-white">{t('payments.submitErrorTitle')}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{t('payments.submitErrorDesc')}</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PaymentDetails;

