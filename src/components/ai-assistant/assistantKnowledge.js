import {
  createStorefrontCategories,
  createStorefrontProducts,
  sanitizeStorefrontQuery,
} from '../../utils/storefront';
import { formatRawPriceString } from '../../utils/money';

export const ASSISTANT_STORAGE_KEY = 'oscar-ai-assistant-history-v1';
export const ASSISTANT_MAX_MESSAGES = 60;

const ARABIC_TEXT_RE = /[\u0600-\u06ff]/;
const LATIN_TEXT_RE = /[a-z]/i;

const normalizeArabic = (value) => String(value || '')
  .replace(/[أإآ]/g, 'ا')
  .replace(/ى/g, 'ي')
  .replace(/ة/g, 'ه')
  .replace(/[ًٌٍَُِّْـ]/g, '');

export const normalizeAssistantText = (value) => normalizeArabic(value)
  .toLowerCase()
  .replace(/[\u0000-\u001f\u007f]/g, ' ')
  .replace(/[^\p{L}\p{N}#@._-]+/gu, ' ')
  .replace(/\s+/g, ' ')
  .trim();

export const isArabicLanguage = (language) => String(language || '').toLowerCase().startsWith('ar');

export const detectMessageLanguage = (message, fallbackLanguage = 'ar') => {
  if (ARABIC_TEXT_RE.test(String(message || ''))) return 'ar';
  if (LATIN_TEXT_RE.test(String(message || ''))) return 'en';
  return isArabicLanguage(fallbackLanguage) ? 'ar' : 'en';
};

export const createAssistantMessageId = (prefix = 'msg') =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const formatAssistantTime = (value, language = 'ar') => {
  const date = new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) return '';

  try {
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
};

export const assistantCopy = {
  ar: {
    title: 'مساعد أوسكار',
    subtitle: 'دعم ذكي للمنتجات والطلبات',
    launcher: 'مساعد أوسكار',
    placeholder: 'اكتب سؤالك هنا...',
    send: 'إرسال',
    close: 'إغلاق',
    clear: 'مسح المحادثة',
    clearConfirmTitle: 'حذف المحادثة؟',
    clearConfirmMessage:
      'هل أنت متأكد من حذف المحادثة؟ سيتم إيقاف أي رد جارٍ ومسح سجل المحادثة من هذا الجهاز.',
    clearConfirmAction: 'حذف المحادثة',
    clearCancel: 'إلغاء',
    typing: 'يكتب الآن',
    online: 'متاح الآن',
    welcome:
      'أهلًا بيك في مساعد أوسكار الذكي 👋\nأقدر أساعدك في البحث عن المنتجات، شرح طريقة الشحن، متابعة الطلبات، معرفة حالة العمليات، شرح المحفظة وطرق الدفع.',
    quickPrompts: [
      'ابحث عن منتج',
      'اشرح طريقة الشحن',
      'آخر عملية عندي',
      'كيف أتابع طلبي؟',
      'طرق الدفع',
    ],
    openProduct: 'فتح المنتج',
    viewProducts: 'تصفح المنتجات',
    addBalance: 'شحن الرصيد',
    viewOrders: 'طلباتي',
    browseOrders: 'تصفح الطلبات',
    wallet: 'المحفظة',
    login: 'تسجيل الدخول',
    contact: 'تواصل معنا',
    targetOrders: 'خدمات التارجت',
    noProducts:
      'بحثت في بيانات المتجر الحالية ولم أجد منتجًا مطابقًا بوضوح. جرّب اسمًا آخر أو افتح صفحة المنتجات لمراجعة الكتالوج.',
    productsIntro:
      'وجدت لك هذه الخيارات من منتجات OSCAR STORE الحالية:',
    productsHint:
      'يمكنك فتح المنتج المناسب ومراجعة تفاصيل الشراء والحقول المطلوبة قبل تأكيد الطلب.',
    needOrderNumber:
      'لمتابعة طلبك افتح السايد بار من القائمة الجانبية، ثم اضغط على الطلبات. ستجد هناك كل طلباتك مرتبة مع الحالة الحالية لكل طلب مثل قيد المراجعة، قيد التنفيذ، مكتمل، أو مرفوض. يمكنك فتح أي طلب لمراجعة تفاصيل المنتج، رقم الطلب، وقت الإنشاء، وأي ملاحظات من الإدارة. وإذا كان معك رقم الطلب الآن، أرسله لي وسأحاول فحص حالته مباشرة.',
    needTopupNumber:
      'أرسل رقم طلب الشحن أو الإيداع وسأحاول جلب حالته من نظام المدفوعات.',
    authRequired:
      'لحماية بياناتك، يلزم تسجيل الدخول أولًا حتى أستطيع عرض حالة الطلبات أو الشحنات الخاصة بك.',
    orderNotFound:
      'لم أتمكن من العثور على هذا الطلب. تأكد من الرقم أو افتح صفحة الطلبات للمراجعة.',
    topupNotFound:
      'لم أتمكن من العثور على طلب الشحن بهذا الرقم. تأكد من الرقم أو راجع سجل الشحن.',
    paymentEmpty:
      'لا توجد طرق دفع متاحة للعرض الآن. يمكنك المحاولة لاحقًا أو التواصل مع الإدارة.',
    fallback:
      'أستطيع مساعدتك في المنتجات، الشحن، الدفع، الطلبات، سياسة الاسترجاع، والتنقل داخل المتجر. اسألني عن أي خدمة تحتاجها.',
  },
  en: {
    title: 'Oscar Assistant',
    subtitle: 'Smart product and order support',
    launcher: 'Oscar Assistant',
    placeholder: 'Type your question...',
    send: 'Send',
    close: 'Close',
    clear: 'Clear chat',
    clearConfirmTitle: 'Delete conversation?',
    clearConfirmMessage:
      'Are you sure you want to delete this conversation? Any response in progress will stop and the local chat history will be cleared.',
    clearConfirmAction: 'Delete chat',
    clearCancel: 'Cancel',
    typing: 'Typing',
    online: 'Online now',
    welcome:
      'Welcome to OSCAR STORE. I can help you choose products, explain top-ups and payments, track orders, or guide you around the website.',
    quickPrompts: [
      'Search for a product',
      'Explain top-up steps',
      'My latest operation',
      'How do I track my order?',
      'Payment methods',
    ],
    openProduct: 'Open product',
    viewProducts: 'Browse products',
    addBalance: 'Add balance',
    viewOrders: 'My orders',
    browseOrders: 'Browse orders',
    wallet: 'Wallet',
    login: 'Login',
    contact: 'Contact us',
    targetOrders: 'Target services',
    noProducts:
      'I searched the current store data and could not find a clear product match. Try another name or open the products page to review the catalog.',
    productsIntro:
      'I found these options from the current OSCAR STORE catalog:',
    productsHint:
      'Open the best match to review purchase details and required fields before confirming.',
    needOrderNumber:
      'To track your order, open the sidebar and choose Orders. You will find all your orders there with their current status, such as under review, processing, completed, or rejected. Open any order to review the product details, order number, creation time, and admin notes. If you already have the order number, send it to me and I will try to check it directly.',
    needTopupNumber:
      'Send the top-up or deposit request number and I will try to fetch its status from the payment system.',
    authRequired:
      'For your privacy, please log in first so I can show order or top-up status for your account.',
    orderNotFound:
      'I could not find that order. Please check the number or open the orders page.',
    topupNotFound:
      'I could not find a top-up request with that number. Please check it or review your top-up history.',
    paymentEmpty:
      'No payment methods are available to display right now. Please try again later or contact the admin team.',
    fallback:
      'I can help with products, top-ups, payments, orders, refund policy, and website navigation. Ask me about the service you need.',
  },
};

const getCopy = (language) => assistantCopy[isArabicLanguage(language) ? 'ar' : 'en'];

const containsTerm = (text, term) => {
  const normalizedTerm = normalizeAssistantText(term);
  if (!normalizedTerm) return false;

  if (/^[a-z0-9]{1,2}$/i.test(normalizedTerm)) {
    return text.split(' ').includes(normalizedTerm);
  }

  return text.includes(normalizedTerm);
};

const hasAnyTerm = (text, terms) => terms.some((term) => containsTerm(text, term));

const NAVIGATION_VERBS = [
  'open', 'go', 'show', 'take me', 'navigate', 'where', 'page',
  'افتح', 'روح', 'اذهب', 'وديني', 'وريني', 'فين', 'اين', 'صفحه', 'صفحة',
];

export const navigationTargets = [
  {
    key: 'products',
    route: '/products',
    publicRoute: '/catalog',
    terms: ['products', 'catalog', 'store', 'buy', 'shop', 'منتجات', 'كتالوج', 'المتجر', 'شراء'],
    labelKey: 'viewProducts',
  },
  {
    key: 'orders',
    route: '/orders',
    authRequired: true,
    terms: ['orders', 'my orders', 'order history', 'طلباتي', 'الطلبات', 'سجل الطلبات'],
    labelKey: 'viewOrders',
  },
  {
    key: 'wallet',
    route: '/wallet',
    authRequired: true,
    terms: ['wallet', 'balance', 'transactions', 'محفظه', 'محفظة', 'رصيد', 'معاملات'],
    labelKey: 'wallet',
  },
  {
    key: 'addBalance',
    route: '/wallet/add-balance',
    authRequired: true,
    terms: ['add balance', 'top up', 'topup', 'deposit', 'charge balance', 'شحن رصيد', 'اضافة رصيد', 'إضافة رصيد', 'ايداع'],
    labelKey: 'addBalance',
  },
  {
    key: 'target',
    route: '/buy-target',
    authRequired: true,
    terms: ['target', 'social services', 'coins transfer', 'تارجت', 'سوشيال', 'خدمات اجتماعيه', 'خدمات اجتماعية'],
    labelKey: 'targetOrders',
  },
  {
    key: 'contact',
    route: '/contact-us',
    authRequired: true,
    terms: ['contact', 'support', 'help', 'complaint', 'تواصل', 'الدعم', 'مساعده', 'شكوى'],
    labelKey: 'contact',
  },
  {
    key: 'login',
    route: '/auth?mode=login',
    terms: ['login', 'sign in', 'account', 'تسجيل دخول', 'حسابي', 'الدخول'],
    labelKey: 'login',
  },
];

const ORDER_TRACKING_TERMS = [
  'track order', 'order status', 'where is my order', 'my order', 'status of order',
  'تتبع الطلب', 'حاله الطلب', 'حالة الطلب', 'طلبي فين', 'طلب رقم', 'رقم الطلب',
  'كيف اتابع طلبي', 'ازاي اتابع طلبي', 'اتابع طلبي', 'طلباتي', 'الطلبات بتاعتي',
];

const TOPUP_TRACKING_TERMS = [
  'topup status', 'deposit status', 'payment request', 'balance request',
  'حاله الشحن', 'حالة الشحن', 'طلب الشحن', 'رقم الشحن', 'حالة الايداع', 'حاله الايداع',
];

const GENERAL_SITE_TERMS = [
  'what is oscar store', 'what does the site do', 'about the site', 'about oscar',
  'الموقع بيعمل ايه', 'الموقع ده ايه', 'اوسكار ستور بيعمل ايه', 'عن الموقع', 'شرح الموقع',
];

const TRANSACTION_TRACKING_TERMS = [
  'latest operation', 'last operation', 'latest transaction', 'last transaction',
  'latest topup', 'last topup', 'payment history', 'wallet history',
  'اخر عمليه', 'اخر عملية', 'آخر عملية', 'عمليتي', 'عملياتي', 'سجل العمليات',
  'اخر شحن', 'آخر شحن', 'اخر دفع', 'عملية الدفع', 'عمليه الدفع',
];

const WALLET_TERMS = [
  'wallet', 'balance', 'wallet balance', 'credit',
  'المحفظه', 'المحفظة', 'رصيد', 'رصيدي', 'الرصيد ما ظهرش', 'الرصيد لم يظهر',
  'الرصيد موصلش', 'دفعت والرصيد', 'سجل العمليات',
];

const PAYMENT_TERMS = [
  'payment', 'pay', 'methods', 'vodafone', 'bank transfer', 'instapay', 'cash', 'usdt',
  'دفع', 'طرق الدفع', 'وسائل الدفع', 'فودافون', 'انستا', 'انستاباي', 'محفظه', 'محفظة', 'تحويل بنكي',
];

const CHARGING_TERMS = [
  'top up', 'topup', 'charge', 'add balance', 'deposit', 'wallet balance',
  'شحن', 'شحن رصيد', 'اضافة رصيد', 'إضافة رصيد', 'ايداع', 'رصيد المحفظه', 'رصيد المحفظة',
];

const REFUND_TERMS = [
  'refund', 'return', 'cancel', 'money back', 'استرجاع', 'استرداد', 'الغاء', 'إلغاء', 'مرتجع',
];

const ORDER_PROCESS_TERMS = [
  'how to order', 'order process', 'buy product', 'purchase', 'how can i buy',
  'ازاي اطلب', 'كيف اطلب', 'طريقة الطلب', 'شراء منتج', 'اعمل طلب', 'أعمل طلب',
  'ازاي اشتري', 'إزاي أشتري', 'ازاي اشتري منتج', 'إزاي أعمل طلب', 'ازاي اعمل طلب',
];

const ORDER_STATUS_EXPLAIN_TERMS = [
  'pending meaning', 'processing meaning', 'completed meaning', 'rejected meaning', 'canceled meaning',
  'معنى قيد المراجعه', 'معني قيد المراجعه', 'معنى قيد المراجعة', 'يعني ايه قيد المراجعه',
  'يعني ايه قيد التنفيذ', 'يعني ايه مكتمل', 'يعني ايه مرفوض', 'يعني ايه ملغي',
  'العملية اترفضت', 'العمليه اترفضت', 'اترفضت', 'فشلت', 'ملغي',
];

const SUPPORT_TERMS = [
  'support', 'contact support', 'customer service', 'help me',
  'الدعم', 'اتواصل مع الدعم', 'تواصل مع الدعم', 'اكلم الدعم', 'خدمة العملاء', 'مساعده', 'مساعدة',
];

const GREETING_TERMS = [
  'hi', 'hello', 'hey', 'مرحبا', 'اهلا', 'أهلا', 'السلام عليكم', 'ازيك',
];

const PRODUCT_TRIGGER_TERMS = [
  'product', 'products', 'game', 'games', 'gift card', 'card', 'subscription', 'voice chat',
  'chat app', 'ai', 'chatgpt', 'social', 'service', 'suggest', 'recommend', 'available', 'price',
  'منتج', 'منتجات', 'لعبه', 'لعبة', 'العاب', 'ألعاب', 'بطاقه', 'بطاقة', 'اشتراك', 'دردشه',
  'ذكاء', 'شات جي بي تي', 'سوشيال', 'خدمه', 'خدمة', 'اقترح', 'رشح', 'متوفر', 'سعر',
];

const PRODUCT_GROUPS = [
  {
    key: 'games',
    route: '/products',
    terms: ['games', 'game', 'pubg', 'free fire', 'diamonds', 'uc', 'topup', 'ألعاب', 'العاب', 'ببجي', 'فري فاير', 'شدات', 'جواهر'],
    categoryHints: ['games', 'game', 'لعب', 'العاب', 'ألعاب'],
  },
  {
    key: 'voice',
    route: '/products',
    terms: ['voice chat', 'chat app', 'soulchill', 'yalla', 'دردشه', 'دردشة', 'شات', 'صوت', 'فويس'],
    categoryHints: ['apps', 'chat', 'app', 'دردشه', 'دردشة', 'تطبيق'],
  },
  {
    key: 'ai',
    route: '/products',
    terms: ['ai', 'chatgpt', 'gpt', 'openai', 'midjourney', 'ذكاء', 'شات جي بي تي', 'جي بي تي'],
    categoryHints: ['apps', 'subscription', 'اشتراك', 'تطبيق'],
  },
  {
    key: 'cards',
    route: '/products',
    terms: ['gift card', 'gift cards', 'itunes', 'google play', 'steam', 'psn', 'xbox', 'card', 'cards', 'بطاقات', 'بطاقه', 'بطاقة', 'ايتونز', 'هدايا'],
    categoryHints: ['cards', 'card', 'gift', 'بطاق'],
  },
  {
    key: 'social',
    route: '/buy-target',
    terms: ['social', 'instagram', 'tiktok', 'facebook', 'youtube', 'followers', 'likes', 'views', 'سوشيال', 'انستجرام', 'تيك توك', 'فيسبوك', 'يوتيوب', 'متابعين', 'لايكات', 'مشاهدات'],
    categoryHints: ['social', 'target', 'service', 'سوشيال', 'خدمات'],
  },
];

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'for', 'to', 'do', 'you', 'have', 'show', 'me', 'please', 'want', 'need',
  'product', 'products', 'service', 'services', 'price', 'available', 'suggest', 'recommend',
  'هل', 'في', 'فى', 'عندكم', 'ممكن', 'عايز', 'عاوزه', 'اريد', 'ابغى', 'منتج', 'منتجات',
  'خدمه', 'خدمة', 'سعر', 'متوفر', 'اقترح', 'رشح', 'لي', 'من', 'عن',
]);

export const detectNavigationTarget = (message) => {
  const text = normalizeAssistantText(message);
  if (!text || !hasAnyTerm(text, NAVIGATION_VERBS)) return null;
  return navigationTargets.find((target) => hasAnyTerm(text, target.terms)) || null;
};

export const detectAssistantIntent = (message, pendingIntent = null) => {
  const text = normalizeAssistantText(message);
  const looksLikeReferenceReply = Boolean(
    text
    && !text.includes(' ')
    && (/[\p{N}]/u.test(text) || /^[a-z]{1,8}[-_]/i.test(text))
  );

  if (pendingIntent?.type === 'orderTracking' && looksLikeReferenceReply) return 'orderTracking';
  if (pendingIntent?.type === 'topupTracking' && looksLikeReferenceReply) return 'topupTracking';
  if (hasAnyTerm(text, GENERAL_SITE_TERMS)) return 'general_site_info';
  if (hasAnyTerm(text, TRANSACTION_TRACKING_TERMS)) return 'transaction_tracking';
  if (hasAnyTerm(text, TOPUP_TRACKING_TERMS)) return 'topupTracking';
  if (hasAnyTerm(text, ORDER_TRACKING_TERMS)) return 'orderTracking';
  if (hasAnyTerm(text, ORDER_STATUS_EXPLAIN_TERMS)) return 'order_status_explain';
  if (hasAnyTerm(text, SUPPORT_TERMS)) return 'support_help';
  if (hasAnyTerm(text, REFUND_TERMS)) return 'refund';
  if (hasAnyTerm(text, ORDER_PROCESS_TERMS)) return 'orderProcess';
  if (getProductIntentGroup(message)) return 'productSearch';
  if (hasAnyTerm(text, WALLET_TERMS)) return 'wallet_help';
  if (hasAnyTerm(text, PAYMENT_TERMS)) return 'payment';
  if (hasAnyTerm(text, CHARGING_TERMS)) return 'charging';
  if (detectNavigationTarget(message)) return 'navigation';
  if (hasAnyTerm(text, PRODUCT_TRIGGER_TERMS)) return 'productSearch';
  if (hasAnyTerm(text, GREETING_TERMS)) return 'greeting';

  return 'fallback';
};

export const extractReferenceNumber = (message) => {
  const raw = String(message || '').trim();
  if (!raw) return '';
  const normalizeReferenceDigits = (value) => String(value || '')
    .replace(/[\u0660-\u0669]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[\u06f0-\u06f9]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0));

  const phraseMatches = [
    ...raw.matchAll(/(?:order\s*(?:number|#)?|طلب\s*رقم|رقم\s*الطلب|رقم|#)\s*[:#-]?\s*([a-z0-9\u0660-\u0669\u06f0-\u06f9][a-z0-9\u0660-\u0669\u06f0-\u06f9_-]{1,})/gi),
    ...raw.matchAll(/(?:order|طلب|رقم|number|#)\s*[:#-]?\s*([a-z0-9][a-z0-9_-]{1,})/gi),
    ...raw.matchAll(/\b([a-z]{1,5}-\d[a-z0-9_-]*)\b/gi),
  ];
  const candidates = phraseMatches.map((match) => match?.[1]).filter(Boolean);

  if (!candidates.length && /^[a-z0-9][a-z0-9_-]{1,}$/i.test(raw)) {
    candidates.push(raw);
  }

  const ignored = new Set([
    'order', 'orders', 'status', 'track', 'topup', 'deposit', 'payment',
    'طلب', 'طلبات', 'رقم', 'حاله', 'حالة', 'تتبع', 'شحن', 'دفع',
  ].map(normalizeAssistantText));

  return candidates
    .map((candidate) => normalizeReferenceDigits(candidate).replace(/^#/, '').trim())
    .find((candidate) => {
      const normalized = normalizeAssistantText(candidate);
      return normalized && !ignored.has(normalized) && (/\d/.test(normalized) || normalized.length >= 5);
    }) || '';
};

export const getProductIntentGroup = (message) => {
  const text = normalizeAssistantText(message);
  return PRODUCT_GROUPS.find((group) => hasAnyTerm(text, group.terms)) || null;
};

const tokenizeSearch = (message) => {
  const normalized = normalizeAssistantText(sanitizeStorefrontQuery(message));
  if (!normalized) return [];
  return normalized
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
};

const categoryTextForProduct = (product, categories) => {
  const categoryId = String(product?.category || product?.categoryId || '').trim();
  const category = (categories || []).find((item) => String(item?.id || '').trim() === categoryId) || {};
  return [
    categoryId,
    product?.categoryName,
    product?.categoryNameAr,
    category?.title,
    category?.name,
    category?.nameAr,
    category?.tone,
  ].join(' ');
};

export const buildAssistantCatalog = (products, categories, { language = 'ar', user = null } = {}) => {
  const storefrontProducts = createStorefrontProducts(products, {
    language,
    userGroup: user?.groupId || user?.group || 'Normal',
    userGroupPercentage: user?.groupPercentage ?? null,
  });
  const storefrontCategories = createStorefrontCategories(categories, storefrontProducts, language);
  const categoryById = new Map(storefrontCategories.map((category) => [String(category?.id || '').trim(), category]));
  const enrichedProducts = storefrontProducts.map((product) => {
    const category = categoryById.get(String(product?.category || product?.categoryId || '').trim());
    return {
      ...product,
      assistantCategory: category?.title || product?.categoryNameAr || product?.categoryName || product?.category || '',
    };
  });

  return {
    products: enrichedProducts,
    categories: storefrontCategories,
  };
};

const resolveProductPriceLabel = (product, language = 'ar') => {
  const rawPrice = product?.storefrontPrice
    ?? product?.finalPrice
    ?? product?.priceCoins
    ?? product?.price
    ?? product?.basePriceCoins
    ?? product?.basePrice;
  const normalized = String(rawPrice ?? '').trim();
  const numericPrice = Number(normalized);
  if (!normalized || normalized === '0' || numericPrice === 0) return '';

  const currency = String(product?.currencyCode || product?.currency || 'USD').toUpperCase();
  const label = formatRawPriceString(normalized);
  return language === 'ar' ? `${label} ${currency}` : `${currency} ${label}`;
};

export const searchAssistantProducts = (message, catalog) => {
  const products = Array.isArray(catalog?.products) ? catalog.products : [];
  const categories = Array.isArray(catalog?.categories) ? catalog.categories : [];
  const query = normalizeAssistantText(message);
  const tokens = tokenizeSearch(message);
  const group = getProductIntentGroup(message);

  const scored = products.map((product) => {
    const categoryText = categoryTextForProduct(product, categories);
    const haystack = normalizeAssistantText([
      product?.displayName,
      product?.name,
      product?.nameAr,
      product?.displayDescription,
      product?.description,
      product?.descriptionAr,
      product?.externalProductName,
      categoryText,
    ].join(' '));

    let score = 0;
    if (query && haystack.includes(query)) score += 16;

    tokens.forEach((token) => {
      if (!haystack.includes(token)) return;
      score += token.length > 3 ? 5 : 2;
      if (normalizeAssistantText(product?.displayName || '').includes(token)) score += 3;
    });

    if (group) {
      const categoryMatch = group.categoryHints.some((hint) => haystack.includes(normalizeAssistantText(hint)));
      const termMatch = group.terms.some((term) => haystack.includes(normalizeAssistantText(term)));
      if (categoryMatch) score += 8;
      if (termMatch) score += 5;
    }

    if (product?.storefrontStatus?.isPurchasable === false) score -= 2;

    return { product, score };
  });

  return scored
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 5)
    .map((entry) => entry.product);
};

export const createProductMessage = (products, language = 'ar') => {
  const copy = getCopy(language);
  const isAr = isArabicLanguage(language);
  if (!products.length) {
    return {
      text: isAr
        ? 'مش لاقي المنتج ده حاليًا، جرّب تكتب الاسم بطريقة مختلفة أو افتح قسم المنتجات.'
        : copy.noProducts,
      actions: [{ label: copy.viewProducts, to: '/products', publicTo: '/catalog' }],
    };
  }

  return {
    text: `${copy.productsIntro}\n${copy.productsHint}`,
    products: products.map((product) => ({
      id: product.id,
      name: product.displayName || product.name || product.nameAr || 'Product',
      description: [
        product.assistantCategory ? `${isAr ? 'القسم' : 'Category'}: ${product.assistantCategory}` : '',
        resolveProductPriceLabel(product, language) ? `${isAr ? 'السعر' : 'Price'}: ${resolveProductPriceLabel(product, language)}` : '',
        product.displayDescription || product.description || product.descriptionAr || '',
      ].filter(Boolean).join(isAr ? '\n' : '\n'),
      image: product.image || '',
      available: product?.storefrontStatus?.isPurchasable !== false,
      actionLabel: copy.openProduct,
    })),
    actions: [{ label: copy.viewProducts, to: '/products', publicTo: '/catalog' }],
  };
};

export const createChargingMessage = (language = 'ar') => {
  const isAr = isArabicLanguage(language);
  const copy = getCopy(language);
  return {
    text: isAr
      ? 'طريقة الشحن في OSCAR STORE بسيطة: افتح المحفظة، اختر شحن الرصيد، حدد طريقة الدفع المناسبة، حوّل المبلغ، ارفع صورة الإيصال، ثم انتظر مراجعة الإدارة. بعد اعتماد الشحن سيظهر الرصيد في محفظتك ويمكنك شراء المنتجات.'
      : 'Top-up at OSCAR STORE works like this: open Wallet, choose Add balance, select a payment method, transfer the amount, upload the receipt, then wait for admin review. Once approved, the balance appears in your wallet and you can buy products.',
    actions: [
      { label: copy.addBalance, to: '/wallet/add-balance', authRequired: true },
      { label: copy.wallet, to: '/wallet', authRequired: true },
    ],
  };
};

export const createOrderProcessMessage = (language = 'ar') => {
  const isAr = isArabicLanguage(language);
  const copy = getCopy(language);
  return {
    text: isAr
      ? 'لإنشاء طلب: افتح صفحة المنتجات، اختر المنتج، املأ البيانات المطلوبة مثل ID اللاعب أو البريد حسب نوع المنتج، راجع السعر والكمية، ثم أكد الطلب. يمكنك متابعة الحالة من صفحة طلباتي.'
      : 'To place an order: open Products, choose a product, fill in the required fields such as player ID or email depending on the product, review price and quantity, then confirm. You can track the status from My orders.',
    actions: [
      { label: copy.viewProducts, to: '/products', publicTo: '/catalog' },
      { label: copy.viewOrders, to: '/orders', authRequired: true },
    ],
  };
};

export const createRefundMessage = (language = 'ar') => {
  const isAr = isArabicLanguage(language);
  const copy = getCopy(language);
  return {
    text: isAr
      ? 'سياسة OSCAR STORE: لا يوجد استرداد أو استرجاع لأي منتج بعد إتمام التحويل أو تنفيذ الطلب. إذا فشل تنفيذ الطلب أو تم رفضه من الإدارة/المزوّد، قد يتم إرجاع الرصيد للمحفظة حسب حالة الطلب. راجع تفاصيل الطلب أو تواصل مع الدعم عند وجود مشكلة.'
      : 'OSCAR STORE policy: products are not refundable or returnable after transfer or successful fulfillment. If an order fails or is rejected by the admin/provider, wallet credit may be returned according to the order status. Check order details or contact support if there is an issue.',
    actions: [
      { label: copy.viewOrders, to: '/orders', authRequired: true },
      { label: copy.contact, to: '/contact-us', authRequired: true },
    ],
  };
};

export const createGreetingMessage = (language = 'ar') => ({
  text: getCopy(language).welcome,
});

export const createFallbackMessage = (language = 'ar') => ({
  text: getCopy(language).fallback,
  actions: [
    { label: getCopy(language).viewProducts, to: '/products', publicTo: '/catalog' },
    { label: getCopy(language).addBalance, to: '/wallet/add-balance', authRequired: true },
  ],
});

export const createNavigationMessage = (target, language = 'ar', isAuthenticated = false) => {
  const copy = getCopy(language);
  const isAr = isArabicLanguage(language);
  const route = target.authRequired && !isAuthenticated ? '/auth?mode=login' : (target.route || '/');
  const label = copy[target.labelKey] || (isAr ? 'فتح الصفحة' : 'Open page');

  return {
    text: isAr
      ? `يمكنك فتح صفحة ${label} من الزر التالي.`
      : `You can open the ${label} page from the button below.`,
    actions: [{
      label,
      to: route,
      publicTo: target.publicRoute,
      authRequired: Boolean(target.authRequired),
    }],
  };
};

export const createPaymentMessage = (settings, language = 'ar') => {
  const copy = getCopy(language);
  const isAr = isArabicLanguage(language);
  const groups = (Array.isArray(settings?.paymentGroups) ? settings.paymentGroups : [])
    .filter((group) => group?.isActive !== false)
    .map((group) => ({
      ...group,
      methods: (Array.isArray(group.methods) ? group.methods : []).filter((method) => method?.isActive !== false),
    }))
    .filter((group) => group.methods.length > 0);

  if (!groups.length) {
    return {
      text: copy.paymentEmpty,
      actions: [{ label: copy.addBalance, to: '/wallet/add-balance', authRequired: true }],
    };
  }

  const groupLines = groups.slice(0, 4).map((group) => {
    const methods = group.methods.slice(0, 4).map((method) => method.name).join(isAr ? '، ' : ', ');
    const currency = group.currency ? ` (${group.currency})` : '';
    return `${group.name}${currency}: ${methods}`;
  });

  return {
    text: isAr
      ? `طرق الدفع المتاحة حاليًا:\n${groupLines.join('\n')}\nبعد اختيار الطريقة، حوّل المبلغ وارفع الإيصال ليتم مراجعة الشحن.`
      : `Current payment methods:\n${groupLines.join('\n')}\nAfter choosing a method, transfer the amount and upload the receipt for review.`,
    actions: [{ label: copy.addBalance, to: '/wallet/add-balance', authRequired: true }],
  };
};
