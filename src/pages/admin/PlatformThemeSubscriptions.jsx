import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Clock3, Copy, CreditCard, ExternalLink, LockKeyhole, RefreshCw, ShieldCheck, Sparkles, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '../../services/client';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../components/ui/Toast';

const card = 'rounded-3xl border border-[color:rgb(var(--color-border-rgb)/0.82)] bg-[color:rgb(var(--color-card-rgb)/0.94)] shadow-[var(--shadow-subtle)]';
const button = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-extrabold text-[var(--color-text)] transition hover:-translate-y-0.5 hover:bg-[var(--color-surface)] disabled:pointer-events-none disabled:opacity-55';
const input = 'min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)]';
const isLive = (import.meta.env.VITE_DATA_PROVIDER || 'mock').toLowerCase() === 'real';

const text = {
  ar: {
    studio: 'العودة إلى الاستوديو', title: 'مركز الخطط والاشتراكات', subtitle: 'اختر الخطة التي تناسب طريقة تطويرك للمنصة، وتابع الدفع والتفعيل من مكان واحد.', secure: 'دفع يدوي آمن · لا يوجد تجديد تلقائي', current: 'خطتك الحالية', free: 'مجانية', pro: 'Theme Customization PRO', ultra: 'Theme Customization ULTRA', active: 'نشطة', expires: 'تنتهي في', days: 'يوم متبقٍ', duration: '3 أشهر · دفعة واحدة', choose: 'اختيار الخطة', selected: 'الخطة المختارة', price: 'السعر', proPrice: '24.99', ultraPrice: '29.99', upgradePrice: '5.00', original: 'بدلًا من 70$', limited: 'عرض محدود', best: 'كل مميزات PRO وأكثر', freeTitle: 'المجانية', freeFeatures: ['تعديل الألوان الأساسية', '3 قوالب ألوان', 'نشر تغييرين، ثم انتظار 30 يومًا بين التغييرات'], proFeatures: ['13 قالب ألوان إضافيًا للوضعين الفاتح والغامق', 'اختيار خطوط عربية وإنجليزية وأحجامها', 'تخصيص الأزرار والبطاقات وتأثيرات النيون', 'تغيير الشعار وصور السلايدر وصورة بيع التارجت', 'تعديل النص العربي المتحرك', 'نشر غير محدود طوال مدة الاشتراك'], ultraFeatures: ['كل مميزات PRO', 'قوالب سايدبار ULTRA المختلفة', 'تخصيص قوالب الهيدر والنافبار السفلي وأبعادهما وألوانهما', 'تغيير أرقام التواصل ورقم استقبال إشعارات السيرفر'], upgrade: 'ترقية من PRO', upgradeDescription: 'ادفع فرق 5.00 USDT. تنتهي الترقية في تاريخ انتهاء اشتراك PRO الحالي.', selectPro: 'اشترك في PRO', selectUltra: 'ترقَّ إلى ULTRA', activePlan: 'خطتك مفعلة بالفعل', checkout: 'متابعة الدفع', paymentTitle: 'الدفع اليدوي عبر USDT', step1: 'اختر الشبكة ثم أنشئ طلب التحويل.', step2: 'حوّل صافي المبلغ إلى بيانات الاستلام المعروضة.', step3: 'أرسل صورة الإثبات إلى واتساب؛ بعد مراجعة الدفع يصلك كود التفعيل.', payee: 'اسم المستلم', network: 'شبكة التحويل', destination: 'وجهة التحويل', amount: 'صافي المبلغ المطلوب', copy: 'نسخ', copied: 'تم النسخ', create: 'إنشاء طلب التحويل', orderReady: 'تم إنشاء الطلب. افتح واتساب وأرفق صورة إثبات التحويل.', whatsapp: 'إرسال الإثبات عبر واتساب', methods: 'طرق الدفع المتاحة', noInstructions: 'تعذر تحميل تعليمات الدفع من الخادم.', retry: 'إعادة المحاولة', pending: 'بانتظار مراجعة التحويل', verified: 'تم التحقق؛ أدخل كود التفعيل', failed: 'تعذر تحميل بيانات الاشتراك. حاول مجددًا.', loading: 'جارٍ تحميل الخطط وحالة الاشتراك…', refresh: 'تحديث الحالة', activation: 'تفعيل الاشتراك بالكود المؤقت', activationHelp: 'يصل الكود بعد التحقق من التحويل. الكود مكوّن من 10 أرقام، صالح لمدة 48 ساعة، ويستخدم مرة واحدة.', refNeeded: 'يوجد تحويل تم التحقق منه وينتظر إدخال الكود.', code: 'كود التفعيل', redeem: 'تفعيل الاشتراك', redeemSuccess: 'تم تفعيل الاشتراك من الخادم بنجاح.', faq: 'معلومات الدفع والتفعيل', faq1: 'هل يتجدد الاشتراك تلقائيًا؟', faq1a: 'لا، الاشتراك دفعة واحدة لمدة 3 أشهر ولا يتجدد تلقائيًا.', faq2: 'متى تفتح المميزات؟', faq2a: 'بعد مراجعة التحويل، أدخل الكود الذي وصلك. لا تفتح المميزات قبل قبول الخادم للكود.', faq3: 'هل يمكن ترقية PRO؟', faq3a: 'نعم، تكلفة الترقية إلى ULTRA هي 5 USDT، وتحتفظ بتاريخ انتهاء PRO الحالي.', status: 'حالة الدفع', noPending: 'لا يوجد تحويل موثق ينتظر التفعيل.', validNetworks: 'Binance ID · TRC20 · BEP20', returning: 'العودة للمحرر', loadingAction: 'جارٍ التنفيذ…', upgradeBadge: 'فرق الترقية', verifiedAt: 'تم التحقق', months: 'أشهر',
  },
  en: {
    studio: 'Back to Platform Studio', title: 'Plans & Subscription Center', subtitle: 'Choose the plan that fits your platform and manage payment and activation in one place.', secure: 'Manual USDT payment · No auto-renewal', current: 'Current plan', free: 'Free', pro: 'Theme Customization PRO', ultra: 'Theme Customization ULTRA', active: 'Active', expires: 'Expires', days: 'days left', duration: '3 months · one-time payment', choose: 'Choose plan', selected: 'Selected plan', price: 'Price', proPrice: '24.99', ultraPrice: '29.99', upgradePrice: '5.00', original: 'instead of $70', limited: 'Limited offer', best: 'Everything in PRO, plus', freeTitle: 'Free', freeFeatures: ['Basic color editing', '3 color presets', 'Publish 2 changes, then wait 30 days between changes'], proFeatures: ['13 additional light and dark color presets', 'Arabic and English font and size controls', 'Button, card, and neon customization', 'Change logo, slider images, and target sales image', 'Edit the Arabic marquee text', 'Publish throughout the subscription term'], ultraFeatures: ['Everything in PRO', 'Distinct ULTRA sidebar templates', 'Customize header and bottom navigation templates, dimensions, and colors', 'Edit public WhatsApp contacts and server notification recipient'], upgrade: 'Upgrade from PRO', upgradeDescription: 'Pay the 5.00 USDT difference. Your upgrade keeps the current PRO expiration date.', selectPro: 'Subscribe to PRO', selectUltra: 'Upgrade to ULTRA', activePlan: 'This plan is already active', checkout: 'Continue to payment', paymentTitle: 'Manual USDT payment', step1: 'Choose a network and create a transfer order.', step2: 'Send the exact net amount to the recipient details below.', step3: 'Send a transfer screenshot via WhatsApp. Your activation code arrives after payment review.', payee: 'Recipient', network: 'Transfer network', destination: 'Transfer destination', amount: 'Net amount due', copy: 'Copy', copied: 'Copied', create: 'Create transfer order', orderReady: 'Your order is ready. Open WhatsApp and attach proof of transfer.', whatsapp: 'Send proof via WhatsApp', methods: 'Available payment methods', noInstructions: 'Payment instructions could not be loaded from the server.', retry: 'Try again', pending: 'Transfer pending review', verified: 'Verified; enter activation code', failed: 'Subscription data could not be loaded. Try again.', loading: 'Loading plans and subscription status…', refresh: 'Refresh status', activation: 'Activate with temporary code', activationHelp: 'The code arrives after payment verification. It has 10 digits, is valid for 48 hours, and can be used once.', refNeeded: 'A verified transfer is waiting for activation.', code: 'Activation code', redeem: 'Activate subscription', redeemSuccess: 'The server activated your subscription.', faq: 'Payment and activation', faq1: 'Does the subscription auto-renew?', faq1a: 'No. It is a one-time payment for 3 months with no automatic renewal.', faq2: 'When do features unlock?', faq2a: 'Enter the code sent after your transfer is reviewed. Features unlock only after the server accepts it.', faq3: 'Can I upgrade from PRO?', faq3a: 'Yes. The ULTRA upgrade costs 5 USDT and keeps your current PRO expiration date.', status: 'Payment status', noPending: 'No verified transfer is waiting for activation.', validNetworks: 'Binance ID · TRC20 · BEP20', returning: 'Return to editor', loadingAction: 'Working…', upgradeBadge: 'Upgrade difference', verifiedAt: 'Verified', months: 'months',
  },
};

const reviewText = {
  ar: {
    activationHelp: 'بعد اعتماد التحويل، يصلك كود التفعيل على رقم واتساب المسجل في حسابك. الكود من 10 أرقام، صالح لمدة 48 ساعة، ويستخدم مرة واحدة.',
    reviewTitle: 'مراجعة طلبات التحويل', reviewHelp: 'راجع التحويل في حساب الاستلام، ثم أدخل معرّف المعاملة واضغط تأكيد لإرسال الكود تلقائيًا لصاحب الطلب.',
    reviewEmpty: 'لا توجد طلبات تحويل تحتاج إلى مراجعة الآن.', reviewLoading: 'جارٍ تحميل طلبات المراجعة…',
    reviewMisconfigured: 'مراجعة التحويلات غير مفعلة. أضف معرّف حساب المراجع إلى THEME_PAYMENT_REVIEWER_IDS في ملف .env الخاص بالباك إند، ثم أعد تشغيل الخادم.',
    reviewLoadFailed: 'تعذر تحميل طلبات المراجعة. حاول تحديث الحالة.', reviewAction: 'تأكيد الدفع وإرسال كود التفعيل', reviewRetry: 'إعادة إصدار وإرسال كود جديد',
    reviewTx: 'معرّف المعاملة بعد التحقق', reviewTxHint: 'أدخل معرّف التحويل الظاهر في حساب الاستلام.', reviewMissingTx: 'أدخل معرّف المعاملة الصحيح قبل التأكيد.',
    reviewSent: 'تم تأكيد الدفع وإرسال كود التفعيل إلى واتساب المسجل لصاحب الطلب.', reviewDeliveryFailed: 'تم تأكيد الدفع، لكن تعذر إرسال الكود عبر واتساب. تحقق من اتصال واتساب ورقم الحساب ثم أعد الإرسال.',
    reviewSkipped: 'تم تأكيد الدفع، لكن إرسال واتساب متوقف في وضع التشغيل الحالي.', reviewRetrySent: 'تم إصدار كود جديد وإرساله إلى واتساب صاحب الطلب.',
    reviewRetryFailed: 'تعذر إرسال الكود الجديد. تحقق من واتساب ثم حاول مجددًا.', reviewConfirmFailed: 'تعذر تأكيد التحويل. تحقق من البيانات وحالة الطلب.',
    reviewDeliveryPending: 'فشل إرسال واتساب؛ يمكن إعادة إصدار كود جديد وإرساله.', payer: 'صاحب الطلب',
    invalidCode: 'كود التفعيل غير صحيح.', expiredCode: 'انتهت صلاحية كود التفعيل. تواصل مع الإدارة لإصدار كود جديد.',
    usedCode: 'هذا الكود غير متاح أو سبق استخدامه.', unrelatedCode: 'كود التفعيل أو الطلب لا يخص هذا الحساب.',
    upgradeUnavailable: 'اشتراك PRO المطلوب للترقية غير نشط الآن.', redeemFailed: 'تعذر تفعيل الاشتراك. راجع الكود وحالة الطلب وحاول مجددًا.',
  },
  en: {
    activationHelp: 'After payment is verified, the activation code is sent to the WhatsApp number registered on your account. It has 10 digits, is valid for 48 hours, and can be used once.',
    reviewTitle: 'Transfer review queue', reviewHelp: 'Verify the transfer in the receiving account, then enter its transaction ID and confirm to send the activation code to the payer.',
    reviewEmpty: 'There are no transfer orders awaiting review.', reviewLoading: 'Loading review requests…',
    reviewMisconfigured: 'Payment review is disabled. Add the reviewer account ID to THEME_PAYMENT_REVIEWER_IDS in the backend .env file, then restart the server.',
    reviewLoadFailed: 'Could not load review requests. Refresh and try again.', reviewAction: 'Confirm payment and send activation code', reviewRetry: 'Issue and send a new code',
    reviewTx: 'Verified transaction ID', reviewTxHint: 'Enter the transfer ID shown in the receiving account.', reviewMissingTx: 'Enter a valid transaction ID before confirming.',
    reviewSent: 'Payment confirmed. The activation code was sent to the payer’s registered WhatsApp.', reviewDeliveryFailed: 'Payment was confirmed, but WhatsApp delivery failed. Check the WhatsApp session and payer number, then retry delivery.',
    reviewSkipped: 'Payment was confirmed, but WhatsApp delivery is skipped in the current runtime mode.', reviewRetrySent: 'A new activation code was issued and sent to the payer.',
    reviewRetryFailed: 'Could not deliver the new code. Check WhatsApp and try again.', reviewConfirmFailed: 'Could not confirm the transfer. Check the details and order status.',
    reviewDeliveryPending: 'WhatsApp delivery failed. You can issue and send a new activation code.', payer: 'Payer',
    invalidCode: 'The activation code is incorrect.', expiredCode: 'The activation code expired. Ask the administrator to issue a new code.',
    usedCode: 'This code is unavailable or has already been used.', unrelatedCode: 'This activation code or order does not belong to this account.',
    upgradeUnavailable: 'The PRO subscription required for this upgrade is no longer active.', redeemFailed: 'Could not activate the subscription. Check the code and order status, then try again.',
  },
};

const formatDate = (value, language) => value ? new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value)) : '—';
const paymentLabel = (value, language) => {
  const labels = language === 'ar'
    ? { PENDING: 'بانتظار مراجعة التحويل', VERIFIED: 'تم التحقق · ينتظر التفعيل', FAILED: 'فشل التحويل', CANCELLED: 'ملغي', REFUNDED: 'مسترد', CHARGEBACK: 'مسترجع' }
    : { PENDING: 'Transfer under review', VERIFIED: 'Verified · awaiting activation', FAILED: 'Transfer failed', CANCELLED: 'Cancelled', REFUNDED: 'Refunded', CHARGEBACK: 'Charged back' };
  return labels[value] || value;
};

export default function PlatformThemeSubscriptions() {
  const { language } = useLanguage();
  const { addToast } = useToast();
  const t = { ...(text[language] || text.ar), ...(reviewText[language] || reviewText.ar) };
  const [status, setStatus] = useState(null);
  const [manual, setManual] = useState(null);
  const [payments, setPayments] = useState([]);
  const [planId, setPlanId] = useState('THEME_PRO');
  const [network, setNetwork] = useState('BINANCE_ID');
  const [order, setOrder] = useState(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reviewItems, setReviewItems] = useState([]);
  const [reviewAccess, setReviewAccess] = useState('loading');
  const [reviewBusyId, setReviewBusyId] = useState('');
  const [transactionIds, setTransactionIds] = useState({});
  const reviewInFlight = useRef(false);
  const redeemInFlight = useRef(false);

  const refresh = useCallback(async ({ quiet = false } = {}) => {
    if (!isLive) { setLoading(false); setError('mock'); return; }
    if (!quiet) setLoading(true);
    const [subscriptionResult, paymentsResult] = await Promise.allSettled([
      apiClient.platformTheme.getSubscription(), apiClient.platformTheme.getPayments(),
    ]);
    if (subscriptionResult.status === 'fulfilled') {
      setStatus(subscriptionResult.value?.eligibility || null);
      setManual(subscriptionResult.value?.manualPayment || null);
      setError(paymentsResult.status === 'rejected'
        ? paymentsResult.reason?.response?.data?.message || t.failed : '');
    } else setError(subscriptionResult.reason?.response?.data?.message || t.failed);
    if (paymentsResult.status === 'fulfilled') setPayments(paymentsResult.value?.items || []);
    if (!quiet) setLoading(false);
  }, [t.failed]);

  useEffect(() => { void refresh(); }, [refresh]);
  const refreshReviewQueue = useCallback(async () => {
    if (!isLive) { setReviewAccess('hidden'); return; }
    try {
      const result = await apiClient.platformTheme.getReviewQueue();
      setReviewItems(result?.items || []);
      setReviewAccess('reviewer');
    } catch (cause) {
      const statusCode = cause?.response?.status;
      const codeValue = cause?.response?.data?.code;
      if (statusCode === 403) { setReviewItems([]); setReviewAccess('forbidden'); }
      else if (statusCode === 503 || codeValue === 'THEME_PAYMENT_REVIEWER_MISSING') {
        setReviewItems([]); setReviewAccess('misconfigured');
      } else { setReviewItems([]); setReviewAccess('error'); }
    }
  }, []);
  useEffect(() => { void refreshReviewQueue(); }, [refreshReviewQueue]);
  const currentPlan = status?.plan || 'FREE';
  const paid = ['THEME_PRO', 'THEME_ULTRA'].includes(currentPlan);
  const ultra = currentPlan === 'THEME_ULTRA';
  const upgrading = currentPlan === 'THEME_PRO' && planId === 'THEME_ULTRA';
  const verifiedPayment = useMemo(() => payments.find((item) => item.status === 'VERIFIED' && !item.redeemed), [payments]);
  const amount = upgrading ? t.upgradePrice : (manual?.offers?.find((offer) => offer.id === planId)?.amount || (planId === 'THEME_ULTRA' ? t.ultraPrice : t.proPrice));
  const canPurchase = !paid || upgrading;

  useEffect(() => {
    if (!manual?.destinations || Object.hasOwn(manual.destinations, network)) return;
    setNetwork(Object.keys(manual.destinations)[0] || 'BINANCE_ID');
  }, [manual, network]);

  useEffect(() => {
    if (!payments.some((item) => item.status === 'PENDING')) return undefined;
    const timer = window.setInterval(() => { void refresh({ quiet: true }); }, 30000);
    return () => window.clearInterval(timer);
  }, [payments, refresh]);

  const selectPlan = (next) => {
    setPlanId(next);
    setOrder(null);
  };
  const copyValue = async (value) => {
    try { await navigator.clipboard.writeText(String(value || '')); addToast(t.copied, 'success'); }
    catch { addToast(language === 'ar' ? 'تعذر النسخ من المتصفح' : 'Clipboard access was denied', 'error'); }
  };
  const createOrder = async () => {
    if (!canPurchase || !manual || manual.durationCalendarMonths !== 3) return;
    setBusy(true);
    try {
      const result = await apiClient.platformTheme.createManualOrder(network, planId);
      setOrder(result);
      await refresh({ quiet: true });
    } catch (cause) {
      addToast(cause?.response?.data?.message || t.failed, 'error');
      await refresh({ quiet: true });
    } finally { setBusy(false); }
  };
  const redeem = async () => {
    if (!verifiedPayment || !/^\d{10}$/.test(code) || redeemInFlight.current) return;
    redeemInFlight.current = true;
    setBusy(true);
    try {
      await apiClient.platformTheme.redeemCode(verifiedPayment.providerReference, code);
      setCode('');
      setOrder(null);
      window.dispatchEvent(new Event('platform-theme-subscription-updated'));
      await refresh();
      addToast(t.redeemSuccess, 'success');
    } catch (cause) {
      const codeValue = cause?.response?.data?.code || cause?.code;
      const messages = {
        CODE_INVALID: t.invalidCode, CODE_EXPIRED: t.expiredCode, CODE_UNAVAILABLE: t.usedCode,
        CODE_ALREADY_USED: t.usedCode, PAYMENT_NOT_VERIFIED: t.unrelatedCode,
        THEME_UPGRADE_UNAVAILABLE: t.upgradeUnavailable,
      };
      addToast(messages[codeValue] || t.redeemFailed, 'error');
      await refresh({ quiet: true });
    } finally { redeemInFlight.current = false; setBusy(false); }
  };

  const confirmReviewedPayment = async (payment) => {
    const transactionId = String(transactionIds[payment.providerReference] || '').trim();
    if (!/^[A-Za-z0-9:_-]{8,128}$/.test(transactionId)) {
      addToast(t.reviewMissingTx, 'error');
      return;
    }
    if (reviewInFlight.current) return;
    reviewInFlight.current = true;
    setReviewBusyId(payment.providerReference);
    try {
      const result = await apiClient.platformTheme.confirmManualOrder(payment.providerReference, transactionId);
      const message = result?.deliveryStatus === 'SENT' ? t.reviewSent
        : result?.deliveryStatus === 'FAILED' ? t.reviewDeliveryFailed : t.reviewSkipped;
      addToast(message, result?.deliveryStatus === 'SENT' ? 'success' : 'error');
      setTransactionIds((current) => ({ ...current, [payment.providerReference]: '' }));
      await Promise.all([refreshReviewQueue(), refresh({ quiet: true })]);
    } catch {
      addToast(t.reviewConfirmFailed, 'error');
      await refreshReviewQueue();
    } finally { reviewInFlight.current = false; setReviewBusyId(''); }
  };

  const retryCodeDelivery = async (payment) => {
    if (reviewInFlight.current) return;
    reviewInFlight.current = true;
    setReviewBusyId(payment.providerReference);
    try {
      const result = await apiClient.platformTheme.reissueManualCode(payment.providerReference);
      const message = result?.deliveryStatus === 'SENT' ? t.reviewRetrySent
        : result?.deliveryStatus === 'FAILED' ? t.reviewRetryFailed : t.reviewSkipped;
      addToast(message, result?.deliveryStatus === 'SENT' ? 'success' : 'error');
      await Promise.all([refreshReviewQueue(), refresh({ quiet: true })]);
    } catch {
      addToast(t.reviewRetryFailed, 'error');
      await refreshReviewQueue();
    } finally { reviewInFlight.current = false; setReviewBusyId(''); }
  };

  const plans = [
    { id: 'THEME_PRO', title: t.pro, price: t.proPrice, features: t.proFeatures },
    { id: 'THEME_ULTRA', title: t.ultra, price: t.ultraPrice, features: t.ultraFeatures, premium: true },
  ];

  if (loading && !status) return <main className="mx-auto max-w-7xl px-4 py-10"><div className={`${card} animate-pulse p-8 text-center text-[var(--color-text-secondary)]`}>{t.loading}</div></main>;

  return <main className="mx-auto max-w-7xl space-y-6 px-3 py-5 sm:px-6 sm:py-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Link to="/admin/themes" className={button}>{language === 'ar' ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}{t.studio}</Link>
      <button type="button" className={button} onClick={() => void refresh()} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />{t.refresh}</button>
    </div>

    <header className={`${card} relative isolate overflow-hidden p-6 sm:p-9`}>
      <div className="pointer-events-none absolute -end-12 -top-28 -z-10 h-72 w-72 rounded-full bg-amber-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 start-1/3 -z-10 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl"><span className="inline-flex items-center gap-2 rounded-full border border-amber-400/35 bg-amber-400/10 px-3 py-1 text-xs font-black text-amber-700 dark:text-amber-300"><Sparkles className="h-4 w-4" />{t.secure}</span>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-[var(--color-text)] sm:text-4xl">{t.title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)] sm:text-base">{t.subtitle}</p>
        </div>
        <div className="min-w-52 rounded-2xl border border-[color:rgb(var(--color-border-rgb)/0.8)] bg-[var(--color-surface)]/80 p-4 backdrop-blur">
          <p className="text-xs font-bold text-[var(--color-text-secondary)]">{t.current}</p>
          <strong className="mt-1 block text-lg text-[var(--color-text)]">{ultra ? t.ultra : paid ? t.pro : t.free}</strong>
          {paid && <p className="mt-2 text-xs text-[var(--color-text-secondary)]">{t.expires}: {formatDate(status?.subscription?.expiresAt, language)}</p>}
        </div>
      </div>
    </header>

    {error && <div className={`${card} border-rose-500/30 p-4 text-sm text-rose-600`} role="alert">{error === 'mock' ? t.noInstructions : error}<button type="button" className="ms-3 underline" onClick={() => void refresh()}>{t.retry}</button></div>}

    {(reviewAccess === 'reviewer' || reviewAccess === 'misconfigured' || reviewAccess === 'error') && <section className={`${card} p-5 sm:p-7`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-xl font-black text-[var(--color-text)]">{t.reviewTitle}</h2><p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)]">{t.reviewHelp}</p></div>
        <button type="button" className={button} onClick={() => void refreshReviewQueue()} disabled={reviewBusyId !== ''}><RefreshCw className="h-4 w-4" />{t.refresh}</button>
      </div>
      {reviewAccess === 'misconfigured' && <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200" role="status">{t.reviewMisconfigured}</p>}
      {reviewAccess === 'error' && <p className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-200" role="alert">{t.reviewLoadFailed}</p>}
      {reviewAccess === 'reviewer' && !reviewItems.length && <p className="mt-4 rounded-xl bg-[var(--color-surface)] p-3 text-sm text-[var(--color-text-secondary)]">{t.reviewEmpty}</p>}
      {reviewAccess === 'reviewer' && reviewItems.length > 0 && <div className="mt-5 space-y-3">
        {reviewItems.map((payment) => {
          const isDeliveryRetry = payment.status === 'VERIFIED' && payment.activationDeliveryStatus === 'FAILED';
          const isBusy = reviewBusyId === payment.providerReference;
          const expectedAmount = payment.settlementAmount || (Number(payment.amountMinor) / 100).toFixed(2);
          return <article key={payment.providerReference} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h3 className="font-black text-[var(--color-text)]">{payment.payer?.name || payment.payer?.email || t.payer}</h3><p className="mt-1 text-xs text-[var(--color-text-secondary)]">{payment.payer?.email || ''}</p><code className="mt-2 block break-all text-xs text-[var(--color-text-secondary)]" dir="ltr">{payment.providerReference}</code></div>
              <div className="text-start text-sm"><p className="font-bold text-[var(--color-text)]">{payment.isUpgrade ? t.upgradeBadge : payment.planId === 'THEME_ULTRA' ? t.ultra : t.pro}</p><p className="mt-1 text-[var(--color-text-secondary)]" dir="ltr">{expectedAmount} USDT · {payment.network || ''}</p><p className="mt-1 text-xs text-[var(--color-text-secondary)]">{payment.status === 'PENDING' ? t.pending : paymentLabel(payment.status, language)}</p></div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3 text-xs"><span className="font-bold text-[var(--color-text-secondary)]">{t.destination}:</span><code className="break-all text-[var(--color-text)]" dir="ltr">{payment.destination}</code></div>
            {isDeliveryRetry
              ? <div className="mt-3 space-y-3"><p className="rounded-xl border border-rose-500/25 bg-rose-500/5 p-3 text-sm text-rose-700 dark:text-rose-200" role="status">{t.reviewDeliveryPending}</p><button type="button" className={`${button} border-amber-500/40 bg-amber-500/10`} disabled={reviewBusyId !== ''} onClick={() => void retryCodeDelivery(payment)}>{isBusy ? t.loadingAction : t.reviewRetry}</button></div>
              : <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"><label className="text-sm font-bold text-[var(--color-text)]">{t.reviewTx}<input className={`${input} mt-1`} dir="ltr" autoComplete="off" maxLength={128} value={transactionIds[payment.providerReference] || ''} placeholder={t.reviewTxHint} disabled={reviewBusyId !== ''} onChange={(event) => setTransactionIds((current) => ({ ...current, [payment.providerReference]: event.target.value.replace(/[^A-Za-z0-9:_-]/g, '').slice(0, 128) }))} /></label><button type="button" className={`${button} border-transparent bg-emerald-600 text-white hover:bg-emerald-700`} disabled={reviewBusyId !== '' || !/^[A-Za-z0-9:_-]{8,128}$/.test(transactionIds[payment.providerReference] || '')} onClick={() => void confirmReviewedPayment(payment)}>{isBusy ? t.loadingAction : t.reviewAction}</button></div>}
          </article>;
        })}
      </div>}
    </section>}

    <section className={`${card} flex flex-wrap items-center justify-between gap-4 p-5`}><div><span className="text-xs font-black uppercase tracking-wider text-[var(--color-text-secondary)]">{t.freeTitle}</span><h2 className="mt-1 text-lg font-black text-[var(--color-text)]">{language === 'ar' ? 'متاحة دائمًا دون اشتراك' : 'Available without a subscription'}</h2></div><ul className="grid gap-2 text-xs text-[var(--color-text-secondary)] sm:grid-cols-3">{t.freeFeatures.map((feature) => <li key={feature} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" />{feature}</li>)}</ul></section>

    <section aria-label={t.title} className="grid items-stretch gap-4 lg:grid-cols-2">
      {plans.map((plan) => {
        const isCurrent = currentPlan === plan.id;
        const isSelected = planId === plan.id;
          const unavailable = isCurrent || (paid && !(currentPlan === 'THEME_PRO' && plan.id === 'THEME_ULTRA'));
        return <article key={plan.id} className={`${card} relative flex flex-col p-5 sm:p-7 ${plan.premium ? 'border-amber-400/50 shadow-[0_18px_60px_-38px_rgba(245,158,11,.65)]' : ''} ${isSelected ? 'ring-2 ring-[var(--color-primary)]/70' : ''}`}>
          {plan.premium && <span className="absolute -top-3 end-5 rounded-full bg-gradient-to-r from-amber-300 to-yellow-500 px-3 py-1 text-[0.68rem] font-black text-amber-950 shadow-lg">{t.limited}</span>}
          <div className="flex items-start justify-between gap-3"><div><h2 className="flex items-center gap-2 text-xl font-black text-[var(--color-text)]">{plan.title}{plan.id === 'THEME_ULTRA' && !ultra && <LockKeyhole className="h-4 w-4 text-amber-500" aria-label="ULTRA locked" title={language === 'ar' ? 'تُفتح المميزات بعد تفعيل ULTRA' : 'ULTRA features unlock after activation'} />}</h2><p className="mt-1 text-sm text-[var(--color-text-secondary)]">{t.duration}</p></div>{isCurrent && <span className="rounded-full bg-emerald-500/12 px-3 py-1 text-xs font-black text-emerald-600">{t.active}</span>}</div>
          <p className="mt-6 flex flex-wrap items-baseline gap-2"><strong className="text-4xl font-black tracking-tight text-[var(--color-text)]">{(plan.id === 'THEME_ULTRA' && upgrading) ? t.upgradePrice : plan.price}</strong><span className="font-bold text-[var(--color-text-secondary)]">USDT</span>{plan.premium && !upgrading && <del className="ms-auto text-sm text-[var(--color-text-secondary)]">{t.original}</del>}</p>
          {plan.id === 'THEME_ULTRA' && upgrading && <p className="mt-2 flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-300"><Sparkles className="h-4 w-4" />{t.upgradeDescription}</p>}
          <ul className="mt-6 flex-1 space-y-3">{plan.features.map((feature) => <li key={feature} className="flex items-start gap-2 text-sm leading-6 text-[var(--color-text)]"><Check className="mt-1 h-4 w-4 shrink-0 text-emerald-500" />{feature}</li>)}</ul>
          <button type="button" className={`${button} mt-7 w-full ${plan.premium ? 'border-transparent bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-950 hover:brightness-105' : 'bg-[var(--color-surface)]'}`} disabled={busy || unavailable} onClick={() => selectPlan(plan.id)}>{isCurrent ? t.activePlan : plan.premium && currentPlan === 'THEME_PRO' ? t.selectUltra : plan.id === 'THEME_PRO' ? t.selectPro : t.choose}<ArrowRight className="h-4 w-4" /></button>
        </article>;
      })}
    </section>

    {canPurchase && <section id="checkout" className={`${card} scroll-mt-24 overflow-hidden`}>
      <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)]/70 p-5 sm:p-7"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500/12 text-emerald-600"><Wallet className="h-5 w-5" /></span><div><h2 className="text-xl font-black text-[var(--color-text)]">{t.paymentTitle}</h2><p className="text-sm text-[var(--color-text-secondary)]">{t.selected}: {planId === 'THEME_ULTRA' ? t.ultra : t.pro}</p></div></div></div>
      <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_0.9fr]">
        <div><h3 className="font-black text-[var(--color-text)]">{t.methods}</h3><p className="mt-1 text-sm text-[var(--color-text-secondary)]">{t.validNetworks}</p>
          {manual && <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-sm font-bold text-[var(--color-text)]">{t.network}<select className={`${input} mt-1`} value={network} disabled={busy} onChange={(event) => { setNetwork(event.target.value); setOrder(null); }}>{Object.keys(manual.destinations || {}).map((kind) => <option key={kind} value={kind}>{kind === 'BINANCE_ID' ? 'Binance ID' : kind}</option>)}</select></label><div className="text-sm font-bold text-[var(--color-text)]">{t.payee}<div className={`${input} mt-1 flex items-center`}>{manual.payeeName || '—'}</div></div></div>}
          {manual?.destinations?.[network] && <div className="mt-3"><span className="text-xs font-bold text-[var(--color-text-secondary)]">{t.destination}</span><div className="mt-1 flex min-h-12 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2"><code dir="ltr" className="min-w-0 flex-1 break-all text-sm text-[var(--color-text)]">{manual.destinations[network]}</code><button type="button" className={button} onClick={() => void copyValue(manual.destinations[network])}><Copy className="h-4 w-4" />{t.copy}</button></div></div>}
          <div className="mt-5 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4"><p className="text-sm font-bold text-[var(--color-text-secondary)]">{t.amount}</p><p className="mt-1 text-2xl font-black text-[var(--color-text)]" dir="ltr">{amount} USDT</p>{upgrading && <p className="mt-2 text-xs text-[var(--color-text-secondary)]">{t.upgradeDescription}</p>}</div>
          <ol className="mt-5 space-y-3 text-sm leading-6 text-[var(--color-text-secondary)]"><li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--color-primary)] text-xs font-black text-white">1</span>{t.step1}</li><li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--color-primary)] text-xs font-black text-white">2</span>{t.step2}</li><li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--color-primary)] text-xs font-black text-white">3</span>{t.step3}</li></ol>
        </div>
        <div className="flex flex-col justify-center rounded-2xl border border-[var(--color-border)] p-4 sm:p-5"><p className="text-sm text-[var(--color-text-secondary)]">{t.selected}</p><strong className="mt-1 text-lg text-[var(--color-text)]">{planId === 'THEME_ULTRA' ? t.ultra : t.pro}</strong>
          {order ? <div role="status" className="mt-5 rounded-2xl border border-emerald-500/35 bg-emerald-500/5 p-4"><div className="flex items-start gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-300"><ShieldCheck className="h-5 w-5 shrink-0" />{t.orderReady}</div><a href={order.whatsappUrl} target="_blank" rel="noopener noreferrer" className={`${button} mt-4 w-full border-emerald-500/40 bg-emerald-500/10`}><ExternalLink className="h-4 w-4" />{t.whatsapp}</a></div>
            : <button type="button" onClick={() => void createOrder()} disabled={busy || !manual || manual.durationCalendarMonths !== 3 || !manual.destinations?.[network]} className={`${button} mt-5 w-full border-transparent bg-[var(--color-primary)] text-white hover:opacity-90`}>{busy ? t.loadingAction : t.create}<CreditCard className="h-4 w-4" /></button>}
          {!manual && <div role="alert" className="mt-4 text-sm text-rose-600">{paymentErrorMessage(error, t)}</div>}
          {manual?.durationCalendarMonths !== 3 && manual && <p role="alert" className="mt-3 text-xs text-amber-700 dark:text-amber-300">{language === 'ar' ? 'تعذر تأكيد مدة العرض من الخادم. لم يتم إنشاء طلب.' : 'The server offer duration does not match. No order was created.'}</p>}
          <p className="mt-4 flex items-center gap-2 text-xs text-[var(--color-text-secondary)]"><LockKeyhole className="h-4 w-4 shrink-0" />{language === 'ar' ? 'يظل الدفع قيد المراجعة حتى يتحقق الخادم من التحويل.' : 'Payment stays pending until the transfer is verified by the server.'}</p>
        </div>
      </div>
    </section>}

    {verifiedPayment && <section className={`${card} border-amber-400/35 bg-gradient-to-br from-amber-400/10 via-[var(--color-card)] to-transparent p-5 sm:p-7`}>
      <div className="mb-4 flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-400/15 text-amber-600"><LockKeyhole className="h-5 w-5" /></span><div><h2 className="text-lg font-black text-[var(--color-text)]">{t.activation}</h2><p className="mt-1 text-sm text-[var(--color-text-secondary)]">{t.refNeeded}</p></div></div>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]"><label className="text-sm font-bold text-[var(--color-text)]">{t.code}<input className={`${input} mt-1 text-center text-lg tracking-[0.4em]`} dir="ltr" inputMode="numeric" autoComplete="one-time-code" maxLength={10} placeholder="0000000000" value={code} disabled={busy} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 10))} /></label><button type="button" className={`${button} self-end border-transparent bg-amber-400 text-amber-950`} disabled={busy || !/^\d{10}$/.test(code)} onClick={() => void redeem()}>{busy ? t.loadingAction : t.redeem}</button><p className="text-xs text-[var(--color-text-secondary)] sm:col-span-2">{t.activationHelp}</p></div>
    </section>}

    {paid && <section className={`${card} p-5 sm:p-7`}><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-black text-[var(--color-text)]">{t.current}: {ultra ? t.ultra : t.pro}</h2><p className="mt-1 text-sm text-[var(--color-text-secondary)]">{t.expires}: {formatDate(status?.subscription?.expiresAt, language)} · {status?.subscription?.daysRemaining ?? 0} {t.days}</p></div><span className="rounded-full bg-emerald-500/12 px-3 py-1 text-xs font-black text-emerald-600">{t.active}</span></div></section>}

    <section className={`${card} p-5 sm:p-7`}>
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 text-xl font-black text-[var(--color-text)]"><Clock3 className="h-5 w-5 text-[var(--color-primary)]" />{t.status}</h2><p className="mt-1 text-sm text-[var(--color-text-secondary)]">{t.activationHelp}</p></div><button type="button" className={button} onClick={() => void refresh()} disabled={loading || busy}><RefreshCw className="h-4 w-4" />{t.refresh}</button></div>
      <div className="mt-4 space-y-2">{payments.slice(0, 5).map((payment) => <div key={payment._id || payment.providerReference} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm"><span className="font-bold text-[var(--color-text)]">{paymentLabel(payment.status, language)}</span><span className="text-xs text-[var(--color-text-secondary)]">{payment.planId === 'THEME_ULTRA' ? t.ultra : t.pro} · {payment.settlementAmount || (Number(payment.amountMinor) / 100).toFixed(2)} USDT · {payment.network || ''}</span></div>)}</div>
      {!verifiedPayment && <p className="mt-4 rounded-xl bg-[var(--color-surface)] p-3 text-sm text-[var(--color-text-secondary)]">{payments.some((item) => item.status === 'PENDING') ? t.pending : t.noPending}</p>}
    </section>

    <section className={`${card} p-5 sm:p-7`}><h2 className="text-xl font-black text-[var(--color-text)]">{t.faq}</h2><div className="mt-4 grid gap-3 md:grid-cols-3">{[[t.faq1, t.faq1a], [t.faq2, t.faq2a], [t.faq3, t.faq3a]].map(([q, a]) => <article key={q} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"><h3 className="font-bold text-[var(--color-text)]">{q}</h3><p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{a}</p></article>)}</div></section>
    <footer className="flex justify-center"><Link to="/admin/themes" className={`${button} min-w-56`}>{t.returning}</Link></footer>
  </main>;
}

function paymentErrorMessage(error, t) {
  return error || t.noInstructions;
}
