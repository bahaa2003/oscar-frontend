import { create } from 'zustand';
import apiClient from '../services/client';

const dataProvider = (import.meta.env.VITE_DATA_PROVIDER || 'mock').toLowerCase();
const isRealProvider = dataProvider === 'real';
const AUTH_STORAGE_KEY = 'auth-storage';
const BACKOFFICE_ROLES = ['admin', 'supervisor', 'manager', 'moderator', 'super_admin', 'superuser'];

const hasArabicText = (value) => /[\u0600-\u06FF]/.test(String(value || ''));
const compactSpaces = (value) => String(value || '').replace(/\s+/g, ' ').trim();
const hasLatinText = (value) => /[a-z]/i.test(String(value || ''));

const readStoredRole = () => {
  if (typeof window === 'undefined' || !window.localStorage) return '';
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return String(parsed?.state?.user?.role || '').trim().toLowerCase();
  } catch {
    return '';
  }
};

const shouldForceArabicForBackoffice = () => {
  const role = readStoredRole();
  return BACKOFFICE_ROLES.includes(role);
};

const firstText = (...values) => {
  for (const value of values) {
    const text = compactSpaces(value);
    if (text) return text;
  }
  return '';
};

const formatAmount = (amount, currency = '') => {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) return '';
  const formatted = numericAmount.toLocaleString('ar-EG', {
    maximumFractionDigits: Number.isInteger(numericAmount) ? 0 : 2,
  });
  const currencyCode = compactSpaces(currency).toUpperCase();
  return currencyCode ? `${formatted} ${currencyCode}` : formatted;
};

const extractFirstMatch = (text, patterns = []) => {
  for (const pattern of patterns) {
    const match = String(text || '').match(pattern);
    if (match?.[1]) return compactSpaces(match[1].replace(/[.,،]$/, ''));
  }
  return '';
};

const getStatusArabic = (status, text = '') => {
  const token = compactSpaces(status || text).toLowerCase();
  if (/(approved|accepted|complete|completed|success|paid|تمت الموافقة|مقبول|اكتمل|نجاح)/i.test(token)) return 'مقبول';
  if (/(reject|rejected|denied|failed|cancel|canceled|cancelled|مرفوض|فشل|ملغي)/i.test(token)) return 'مرفوض';
  if (/(pending|review|waiting|قيد|مراجعة|انتظار)/i.test(token)) return 'قيد المراجعة';
  if (/(update|updated|changed|تحديث|تعديل)/i.test(token)) return 'تم التحديث';
  if (/(new|created|submitted|placed|جديد|إنشاء|ارسال|إرسال)/i.test(token)) return 'جديد';
  if (/(delete|deleted|removed|حذف)/i.test(token)) return 'محذوف';
  if (/(restore|restored|استرجاع)/i.test(token)) return 'مسترجع';
  return '';
};

const getNotificationDomain = (item = {}, text = '') => {
  const token = compactSpaces([
    item.targetType,
    item.entityType,
    item.resourceType,
    item.source,
    item.context,
    item.category,
    text,
  ].join(' ')).toLowerCase();

  if (/(target|تارجت)/i.test(token)) return 'target';
  if (/(topup|top-up|deposit|payment|wallet|balance|شحن|رصيد|محفظة|دفع)/i.test(token)) return 'topup';
  if (/(order|manual|طلب يدوي|طلب)/i.test(token)) return 'order';
  if (/(account|user|customer|supervisor|permission|quantity|credit|حساب|مستخدم|عميل|مشرف|صلاحية|كوتا|كمية|ائتمان)/i.test(token)) return 'user';
  if (/(product|supplier|currency|group|منتج|مورد|عملة|مجموعة)/i.test(token)) return 'admin';
  return 'admin';
};

const buildBackofficeArabicNotification = (item = {}, fallbackTitle = 'إشعار إداري', fallbackMessage = '') => {
  const rawText = compactSpaces(`${item.title || ''} ${item.message || ''} ${item.description || ''}`);
  const lowerText = rawText.toLowerCase();
  const domain = getNotificationDomain(item, rawText);
  const status = getStatusArabic(item.status || item.action || item.type, rawText);
  const targetId = firstText(item.targetId, item.entityId, item.resourceId, item.orderId, item.topupId, item.depositId, item.userId);
  const orderNumber = firstText(
    item.orderNumber,
    item.displayOrderId,
    item.orderId,
    extractFirstMatch(rawText, [
      /order\s*#?\s*([a-z0-9_-]{3,})/i,
      /طلب\s*#?\s*([a-z0-9_-]{3,})/i,
      /#\s*([a-z0-9_-]{3,})/i,
    ]),
    domain === 'order' ? targetId : ''
  );
  const topupNumber = firstText(
    item.topupId,
    item.depositId,
    extractFirstMatch(rawText, [
      /(?:top[-\s]?up|deposit|payment)\s*#?\s*([a-z0-9_-]{3,})/i,
      /(?:شحن|إيداع|دفع)\s*#?\s*([a-z0-9_-]{3,})/i,
    ]),
    domain === 'topup' ? targetId : ''
  );
  const customerName = firstText(
    item.customerName,
    item.userName,
    item.name,
    item.customer?.name,
    item.user?.name,
    extractFirstMatch(rawText, [
      /(?:from|by)\s+([^#.،]+?)(?:\s+(?:for|on|طلب|للمنتج)|[.,،]|$)/i,
      /(?:من|بواسطة)\s+([^#.،]+?)(?:\s+(?:للمنتج|على)|[.,،]|$)/i,
    ])
  );
  const productName = firstText(
    item.productNameAr,
    item.productName,
    item.productTitle,
    item.product?.nameAr,
    item.product?.name,
    extractFirstMatch(rawText, [
      /for\s+(.+?)(?:[.,،]|$)/i,
      /للمنتج[:\s]+(.+?)(?:[.,،]|$)/i,
    ])
  );
  const sectionName = firstText(item.sectionName, item.categoryName, item.categoryTitle, item.section, item.category);
  const amount = formatAmount(
    item.amount
      ?? item.requestedAmount
      ?? item.actualPaidAmount
      ?? item.creditedCoins
      ?? item.totalAmount
      ?? item.priceCoins
      ?? item.financialSnapshot?.finalAmountAtExecution
      ?? item.financialSnapshot?.originalAmount,
    item.currency
      || item.currencyCode
      || item.financialSnapshot?.originalCurrency
      || item.financialSnapshot?.currency
  );
  const actorName = firstText(item.actorName, item.adminName, item.reviewerName, item.actor?.name);
  const reason = firstText(item.reason, item.rejectionReason, item.adminNotes, item.adminNote);

  if (domain === 'order') {
    const isManual = /manual|يدوي/i.test(rawText) || item.manual || item.isManual;
    const title = isManual
      ? `طلب يدوي ${status === 'جديد' || !status ? 'جديد' : status}`
      : `طلب ${status || 'جديد'}`;
    const parts = [
      orderNumber ? `رقم الطلب: ${orderNumber}` : 'يوجد طلب يحتاج المتابعة',
      customerName ? `العميل: ${customerName}` : '',
      productName ? `المنتج: ${productName}` : '',
      amount ? `القيمة: ${amount}` : '',
      sectionName ? `القسم: ${sectionName}` : '',
      actorName ? `تمت العملية بواسطة: ${actorName}` : '',
      reason ? `ملاحظة: ${reason}` : '',
    ].filter(Boolean);
    return { title, message: `${parts.join(' - ')}. راجع الطلب من لوحة الطلبات.` };
  }

  if (domain === 'topup') {
    const title = status === 'مقبول'
      ? 'تم اعتماد طلب شحن'
      : status === 'مرفوض'
        ? 'تم رفض طلب شحن'
        : status === 'تم التحديث'
          ? 'تم تعديل طلب شحن'
          : 'طلب شحن جديد';
    const parts = [
      topupNumber ? `رقم الطلب: ${topupNumber}` : 'يوجد طلب شحن يحتاج المراجعة',
      customerName ? `العميل: ${customerName}` : '',
      amount ? `المبلغ: ${amount}` : '',
      item.paymentMethodName || item.paymentMethod ? `طريقة الدفع: ${item.paymentMethodName || item.paymentMethod}` : '',
      actorName ? `المراجع: ${actorName}` : '',
      reason ? `ملاحظة: ${reason}` : '',
    ].filter(Boolean);
    return { title, message: `${parts.join(' - ')}. افتح صفحة المدفوعات لمراجعة التفاصيل.` };
  }

  if (domain === 'target') {
    const title = status === 'مقبول'
      ? 'تم اعتماد طلب تارجت'
      : status === 'مرفوض'
        ? 'تم رفض طلب تارجت'
        : 'طلب تارجت جديد';
    const parts = [
      targetId ? `رقم الطلب: ${targetId}` : 'يوجد طلب تارجت يحتاج المتابعة',
      customerName ? `العميل: ${customerName}` : '',
      productName || item.appName ? `التطبيق: ${productName || item.appName}` : '',
      amount ? `القيمة: ${amount}` : '',
      reason ? `ملاحظة: ${reason}` : '',
    ].filter(Boolean);
    return { title, message: `${parts.join(' - ')}. راجعه من صفحة طلبات التارجت.` };
  }

  if (domain === 'user') {
    let title = fallbackTitle;
    if (/quantity/i.test(lowerText) || /كمية|كوتا/.test(rawText)) {
      title = /reset/i.test(lowerText) ? 'تم تصفير استخدام الكوتا' : 'تم تعديل حد الكوتا';
    } else if (/permission|صلاح/.test(lowerText)) {
      title = 'تم تحديث صلاحيات مستخدم';
    } else if (status === 'مقبول') {
      title = 'تمت الموافقة على الحساب';
    } else if (status === 'مرفوض') {
      title = 'تم رفض الحساب';
    } else if (status === 'محذوف') {
      title = 'تم حذف مستخدم';
    } else if (status === 'مسترجع') {
      title = 'تم استرجاع مستخدم';
    } else {
      title = hasLatinText(title) ? 'تحديث بيانات مستخدم' : title;
    }

    const limitValue = firstText(item.quantityLimit, item.creditLimit, extractFirstMatch(rawText, [/to\s+([0-9,.]+)/i, /إلى\s+([0-9,.]+)/i]));
    const parts = [
      customerName || targetId ? `المستخدم: ${customerName || targetId}` : 'يوجد تحديث على حساب مستخدم',
      limitValue ? `القيمة الجديدة: ${limitValue}` : '',
      actorName ? `بواسطة: ${actorName}` : '',
      reason ? `ملاحظة: ${reason}` : '',
    ].filter(Boolean);
    return { title, message: `${parts.join(' - ')}. راجع بيانات المستخدم من لوحة المستخدمين.` };
  }

  const cleanFallbackTitle = hasLatinText(fallbackTitle) ? 'إشعار إداري' : fallbackTitle;
  const cleanFallbackMessage = hasLatinText(fallbackMessage)
    ? 'يوجد تحديث إداري جديد يحتاج المتابعة. افتح الإشعار لمعرفة التفاصيل.'
    : fallbackMessage;
  return {
    title: cleanFallbackTitle || 'إشعار إداري',
    message: cleanFallbackMessage || 'يوجد إشعار إداري جديد يحتاج المتابعة.',
  };
};

const normalizeEnglishNotificationText = (value, options = {}) => {
  const { isTitle = false, forceArabic = false } = options;
  const text = String(value || '').trim();
  if (!text || hasArabicText(text)) return text;

  const manualOrderPlacedMatch = text.match(/^a\s+customer\s+placed\s+manual\s+order\s*#?([a-z0-9_-]+)\s+for\s+(.+)\.?$/i);
  if (manualOrderPlacedMatch) {
    const orderNumber = String(manualOrderPlacedMatch[1] || '').trim();
    const productName = String(manualOrderPlacedMatch[2] || '').replace(/\.$/, '').trim();
    return isTitle
      ? 'طلب يدوي جديد'
      : `تم إنشاء طلب يدوي رقم ${orderNumber}${productName ? ` للمنتج: ${productName}` : ''}. راجعه من صفحة الطلبات.`;
  }

  const customerOrderPlacedMatch = text.match(/^a\s+customer\s+placed\s+(?:an?\s+)?order\s*#?([a-z0-9_-]+)?(?:\s+for\s+(.+))?\.?$/i);
  if (customerOrderPlacedMatch) {
    const orderNumber = String(customerOrderPlacedMatch[1] || '').trim();
    const productName = String(customerOrderPlacedMatch[2] || '').replace(/\.$/, '').trim();
    return isTitle
      ? 'طلب جديد'
      : `تم إنشاء طلب${orderNumber ? ` رقم ${orderNumber}` : ''}${productName ? ` للمنتج: ${productName}` : ''}.`;
  }

  const orderApprovedMatch = text.match(/order\s*#?\s*([a-z0-9_-]{3,})?.*\b(approved|accepted|completed)\b/i);
  if (orderApprovedMatch) {
    const orderId = String(orderApprovedMatch?.[1] || '').trim();
    return orderId ? `تم قبول الطلب ${orderId}` : 'تم قبول الطلب';
  }

  const orderRejectedMatch = text.match(/order\s*#?\s*([a-z0-9_-]{3,})?.*\b(rejected|denied|failed)\b/i);
  if (orderRejectedMatch) {
    const orderId = String(orderRejectedMatch?.[1] || '').trim();
    return orderId ? `تم رفض الطلب ${orderId}` : 'تم رفض الطلب';
  }

  const newOrderMatch = text.match(/^new\s+order(?:\s+request)?(?:\s+(?:from|by))?\s*(.*)$/i);
  if (newOrderMatch) {
    const actor = String(newOrderMatch?.[1] || '').trim();
    return actor ? `طلب جديد من ${actor}` : 'طلب جديد';
  }

  const topupRequestMatch = text.match(/^new\s+top[-\s]?up\s+request(?:\s+(?:from|by))?\s*(.*)$/i);
  if (topupRequestMatch) {
    const actor = String(topupRequestMatch?.[1] || '').trim();
    return actor ? `طلب شحن جديد من ${actor}` : 'طلب شحن جديد';
  }

  const exactTranslations = {
    notification: 'إشعار',
    'admin notification': 'إشعار إداري',
    'supervisor notification': 'إشعار المشرف',
    notifications: 'الإشعارات',
    'new order': 'طلب جديد',
    'order accepted': 'تم قبول الطلب',
    'order rejected': 'تم رفض الطلب',
    'order status updated': 'تم تحديث حالة الطلب',
    'order completed': 'تم تنفيذ الطلب',
    'your order was completed successfully': 'تم تنفيذ طلبك بنجاح',
    'your order was rejected': 'تم رفض طلبك',
    'your order is under review': 'طلبك قيد المراجعة',
    'new topup request': 'طلب شحن جديد',
    'new top-up request': 'طلب شحن جديد',
    'manual topup waiting for review': 'طلب شحن يدوي بانتظار المراجعة',
    'balance topup': 'شحن رصيد',
    'wallet topup': 'شحن المحفظة',
    'payment approved': 'تم قبول الدفع',
    'payment rejected': 'تم رفض الدفع',
    'account approved': 'تمت الموافقة على الحساب',
    'account rejected': 'تم رفض الحساب',
    'account pending': 'الحساب قيد المراجعة',
    'price updated': 'تم تحديث السعر',
    'insufficient balance': 'الرصيد غير كاف',
    'target request': 'طلب تارجت',
    'new target request': 'طلب تارجت جديد',
  };

  const exact = exactTranslations[text.toLowerCase()];
  if (exact) return exact;

  const normalized = text
    .replace(/\bNew order\b/gi, 'طلب جديد')
    .replace(/\bRequest\b/gi, 'طلب')
    .replace(/\bhas been\b/gi, '')
    .replace(/\bis now\b/gi, 'أصبح')
    .replace(/\bunder review\b/gi, 'قيد المراجعة')
    .replace(/\bsuccessfully\b/gi, 'بنجاح')
    .replace(/\bOrder\b/gi, 'طلب')
    .replace(/\border\b/gi, 'طلب')
    .replace(/\bTop[-\s]?up\b/gi, 'شحن')
    .replace(/\bManual topup\b/gi, 'شحن يدوي')
    .replace(/\bWallet\b/gi, 'المحفظة')
    .replace(/\bBalance\b/gi, 'الرصيد')
    .replace(/\bPayment\b/gi, 'الدفع')
    .replace(/\bAccepted\b/gi, 'تم القبول')
    .replace(/\bRejected\b/gi, 'تم الرفض')
    .replace(/\bCompleted\b/gi, 'تم التنفيذ')
    .replace(/\bPending\b/gi, 'قيد المراجعة')
    .replace(/\bApproved\b/gi, 'تمت الموافقة')
    .replace(/\bFailed\b/gi, 'فشل')
    .replace(/\bUpdated\b/gi, 'تم التحديث')
    .replace(/\bcreated\b/gi, 'تم الإنشاء')
    .replace(/\bby\b/gi, 'بواسطة')
    .replace(/\bfrom\b/gi, 'من')
    .replace(/\buser\b/gi, 'مستخدم')
    .replace(/\bcustomer\b/gi, 'عميل')
    .replace(/\badmin\b/gi, 'الأدمن')
    .replace(/\bsupervisor\b/gi, 'المشرف')
    .replace(/\bmanager\b/gi, 'المدير')
    .replace(/\bmoderator\b/gi, 'المشرف')
    .replace(/\baccount\b/gi, 'الحساب')
    .replace(/\btarget\b/gi, 'تارجت');

  const stillEnglish = /[a-z]/i.test(normalized);
  if (forceArabic && stillEnglish) {
    const lowered = text.toLowerCase();
    if (lowered.includes('order')) {
      if (/(approved|accepted|completed)/.test(lowered)) return 'تم قبول الطلب';
      if (/(rejected|denied|failed)/.test(lowered)) return 'تم رفض الطلب';
      if (/(pending|review)/.test(lowered)) return 'الطلب قيد المراجعة';
      return isTitle ? 'تحديث طلب' : 'يوجد تحديث جديد على أحد الطلبات. افتح الإشعار لمعرفة التفاصيل.';
    }

    if (/(topup|top-up|wallet|payment|deposit|balance)/.test(lowered)) {
      if (/(approved|accepted|completed)/.test(lowered)) return 'تم قبول طلب الشحن';
      if (/(rejected|denied|failed)/.test(lowered)) return 'تم رفض طلب الشحن';
      if (/(pending|review)/.test(lowered)) return 'طلب الشحن قيد المراجعة';
      return isTitle ? 'تحديث شحن الرصيد' : 'يوجد تحديث جديد على طلب شحن الرصيد. افتح الإشعار لمعرفة التفاصيل.';
    }

    if (/(account|user)/.test(lowered)) {
      if (/(approved|accepted|verified)/.test(lowered)) return 'تمت الموافقة على الحساب';
      if (/(rejected|denied|blocked)/.test(lowered)) return 'تم رفض الحساب';
      if (/(pending|review)/.test(lowered)) return 'الحساب قيد المراجعة';
      return isTitle ? 'تحديث حساب' : 'يوجد تحديث جديد متعلق بالحساب.';
    }

    if (/target/.test(lowered)) {
      if (/(new|created)/.test(lowered)) return 'طلب تارجت جديد';
      return isTitle ? 'تحديث طلب تارجت' : 'يوجد تحديث جديد على طلب تارجت.';
    }

    return isTitle ? 'إشعار إداري' : 'يوجد إشعار إداري جديد يحتاج المتابعة.';
  }

  return normalized;
};

const normalizeNotification = (item = {}) => {
  const sectionName = String(item.sectionName || item.categoryName || item.categoryTitle || item.section || '').trim();
  const rawMessage = String(item.message || item.description || '').trim();
  const normalizedMessage = normalizeEnglishNotificationText(rawMessage, {
    isTitle: false,
    forceArabic: shouldForceArabicForBackoffice(),
  });
  let normalizedTitle = normalizeEnglishNotificationText(item.title || 'إشعار', {
    isTitle: true,
    forceArabic: shouldForceArabicForBackoffice(),
  }) || 'إشعار';

  const isManualOrderNotification = /manual\s+order/i.test(rawMessage)
    || /طلب\s+يدوي|طلب\s+#?\w+.*للمنتج|تابع\s+لقسم/.test(`${normalizedTitle} ${normalizedMessage}`);

  if (isManualOrderNotification) {
    normalizedTitle = sectionName
      ? `طلب يدوي جديد - قسم ${sectionName}`
      : 'طلب يدوي جديد';
  }

  const forceArabic = shouldForceArabicForBackoffice();
  if (forceArabic) {
    const detailed = buildBackofficeArabicNotification(item, normalizedTitle, normalizedMessage);
    normalizedTitle = detailed.title || normalizedTitle;
    return {
      id: item.id || item._id || `notif-${Date.now()}`,
      title: normalizedTitle,
      message: detailed.message || normalizedMessage,
      type: String(item.type || 'info').toLowerCase(),
      createdAt: item.createdAt || new Date().toISOString(),
      read: Boolean(item.read ?? item.isRead),
      targetUrl: item.targetUrl || item.url || item.link || '',
      targetType: item.targetType || item.entityType || item.resourceType || '',
      targetId: item.targetId || item.entityId || item.resourceId || item.orderId || item.topupId || item.userId || '',
      orderId: item.orderId || '',
      topupId: item.topupId || item.depositId || '',
      userId: item.userId || '',
      source: item.source || '',
      sectionName,
      categoryName: String(item.categoryName || sectionName || '').trim(),
    };
  }

  return {
    id: item.id || item._id || `notif-${Date.now()}`,
    title: normalizedTitle,
    message: sectionName && isManualOrderNotification && !/تابع\s+لقسم/.test(normalizedMessage)
      ? `${normalizedMessage} تابع لقسم ${sectionName}.`
      : normalizedMessage,
    type: String(item.type || 'info').toLowerCase(),
    createdAt: item.createdAt || new Date().toISOString(),
    read: Boolean(item.read ?? item.isRead),
    targetUrl: item.targetUrl || item.url || item.link || '',
    targetType: item.targetType || item.entityType || item.resourceType || '',
    targetId: item.targetId || item.entityId || item.resourceId || item.orderId || item.topupId || item.userId || '',
    orderId: item.orderId || '',
    topupId: item.topupId || '',
    userId: item.userId || '',
    source: item.source || '',
    sectionName,
    categoryName: String(item.categoryName || sectionName || '').trim(),
  };
};

const useNotificationStore = create((set, get) => ({
  notifications: [],
  isLoading: false,
  unreadCount: 0,

  addNotification: (payload) => {
    const next = normalizeNotification({
      ...(payload || {}),
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: payload?.title || 'إشعار',
      message: payload?.message || '',
      type: payload?.type || 'info',
      createdAt: new Date().toISOString(),
      read: false,
      targetUrl: payload?.targetUrl || payload?.url || payload?.link || '',
      targetType: payload?.targetType || payload?.entityType || '',
      targetId: payload?.targetId || payload?.entityId || payload?.orderId || payload?.topupId || payload?.userId || '',
      orderId: payload?.orderId || '',
      topupId: payload?.topupId || '',
      userId: payload?.userId || '',
      source: payload?.source || '',
      sectionName: payload?.sectionName || payload?.categoryName || payload?.section || '',
      categoryName: payload?.categoryName || payload?.sectionName || '',
    });

    set((state) => ({
      notifications: [next, ...state.notifications].slice(0, 30),
      unreadCount: Number(state.unreadCount || 0) + 1,
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((item) => ({ ...item, read: true })),
      unreadCount: 0,
    }));
    void apiClient.notifications?.markAllAsRead?.().catch(() => {});
  },

  loadUnreadCount: async () => {
    try {
      const count = await apiClient.notifications?.unreadCount?.();
      const unreadCount = Number(count || 0);
      set({ unreadCount: Number.isFinite(unreadCount) ? unreadCount : 0 });
      return get().unreadCount;
    } catch {
      const fallbackCount = get().notifications.filter((item) => !item.read).length;
      set({ unreadCount: fallbackCount });
      return fallbackCount;
    }
  },

  loadNotifications: async () => {
    set({ isLoading: true });
    try {
      const items = await apiClient.notifications?.list?.();
      if (Array.isArray(items)) {
        const nextNotifications = items.map(normalizeNotification).slice(0, 30);
        set({
          notifications: nextNotifications,
          unreadCount: nextNotifications.filter((item) => !item.read).length,
        });
      }
    } catch {
      return get().notifications;
    } finally {
      set({ isLoading: false });
    }
    return get().notifications;
  },

  markAsRead: async (id) => {
    set((state) => ({
      notifications: state.notifications.map((item) => (
        String(item.id) === String(id) ? { ...item, read: true } : item
      )),
      unreadCount: Math.max(0, Number(state.unreadCount || 0) - (
        state.notifications.some((item) => String(item.id) === String(id) && !item.read) ? 1 : 0
      )),
    }));
    try {
      await apiClient.notifications?.markAsRead?.(id);
    } catch {
      // Keep optimistic local state.
    }
  },

  clearNotifications: () => {
    set({ notifications: [], unreadCount: 0 });
    void apiClient.notifications?.clearAll?.().catch(() => {});
  },
}));

export default useNotificationStore;
