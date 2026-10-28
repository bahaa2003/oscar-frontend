import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, ArrowUpRight, Check, CreditCard, History, ImagePlus, Layers3, LockKeyhole, MenuSquare, Palette, PanelsTopLeft, RotateCcw, Save, Sparkles, Type, MessageCircle, LayoutDashboard } from 'lucide-react';
import apiClient from '../../services/client';
import useMediaStore from '../../store/useMediaStore';
import CategoryCard from '../../components/home/CategoryCard';
import { createStorefrontCategories } from '../../utils/storefront';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../components/ui/Toast';
import { platformThemeStyles } from '../../theme/platformTheme';
import { resolveImageUrl } from '../../utils/imageUrl';
import useAuthStore from '../../store/useAuthStore';
import useSystemStore from '../../store/useSystemStore';
import PlatformStudioPreview from './PlatformStudioPreview';
import './PlatformThemeEditor.css';

const liveApi = (import.meta.env.VITE_DATA_PROVIDER || 'mock').toLowerCase() === 'real';
const card = 'rounded-2xl border border-[color:rgb(var(--color-border-rgb)/0.8)] bg-[color:rgb(var(--color-card-rgb)/0.94)] p-4 shadow-[var(--shadow-subtle)] sm:p-5';
const input = 'w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)]';
const button = 'inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-bold text-[var(--color-text)] transition hover:bg-[var(--color-surface)] disabled:cursor-not-allowed disabled:opacity-50';
const colorKeys = ['primary', 'secondary', 'accent', 'background', 'surface', 'text', 'mutedText', 'border'];
const neonSections = ['purchase', 'hero', 'categories', 'bestSellers'];
const sampleNeon = () => ({ purchase: { enabled: false, color: '#22D3EE', speed: 5 },
  hero: { enabled: false, color: '#A855F7', speed: 5 },
  categories: { enabled: false, color: '#34D399', speed: 5 },
  bestSellers: { enabled: false, color: '#F59E0B', speed: 5 }, categoryCards: {} });
const freeFonts = { arabic: ['Cairo', 'Tajawal'], english: ['Inter', 'Arial'] };
const fonts = { arabic: [...freeFonts.arabic, 'Noto Sans Arabic', 'Almarai', 'Changa', 'IBM Plex Sans Arabic', 'Rubik'],
  english: [...freeFonts.english, 'Roboto', 'Poppins', 'Montserrat', 'Outfit', 'Plus Jakarta Sans'] };
const sampleColors = {
  light: { primary: '#2563EB', secondary: '#475569', accent: '#F59E0B', background: '#FFFFFF', surface: '#F8FAFC', text: '#0F172A', mutedText: '#475569', border: '#CBD5E1' },
  dark: { primary: '#60A5FA', secondary: '#A78BFA', accent: '#FBBF24', background: '#0F172A', surface: '#1E293B', text: '#F8FAFC', mutedText: '#CBD5E1', border: '#475569' },
};
const samplePart = (mode) => ({ presetId: 'classic', colors: { ...sampleColors[mode] },
  typography: { arabicFont: 'Cairo', englishFont: 'Inter', baseSize: 16, headingWeight: 700 },
  buttons: { radius: 8, style: 'solid' }, cards: { radius: 12, shadow: 'subtle' }, navigation: { style: 'standard' }, neon: sampleNeon() });
const DEFAULT_MARQUEE_AR = 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ ﴿قُلْ إِنَّ رَبِّي يَبْسُطُ الرِّزْقَ لِمَنْ يَشَاءُ مِنْ عِبَادِهِ وَيَقْدِرُ لَهُ وَمَا أَنْفَقْتُمْ مِنْ شَيْءٍ فَهُوَ يُخْلِفُهُ وَهُوَ خَيْرُ الرَّازِقِينَ﴾ صَدَقَ اللَّهُ الْعَظِيمُ';
const sampleTheme = { schemaVersion: 2, modes: { light: samplePart('light'), dark: samplePart('dark') },
  brand: { logoPath: null, logoWidth: 144, slides: [null, null, null, null], marqueeTextArabic: DEFAULT_MARQUEE_AR, targetBannerPath: null, sidebarTemplate: 'default', sidebarMetrics: { width: 270, height: 100, radius: 28 } },
  chrome: { header: { template: 'bar', height: 64, width: 100, background: '#FFFFFF', foreground: '#0F172A', accent: '#2563EB', radius: 0 }, bottomNav: { template: 'bar', height: 64, width: 100, background: '#FFFFFF', foreground: '#0F172A', accent: '#2563EB', radius: 0 } } };
const headerLooks = [
  { name: 'Midnight edge', ar: 'مستطيل منتصف الليل', config: { template: 'bar', height: 64, width: 100, background: '#111827', foreground: '#F8FAFC', accent: '#38BDF8', radius: 0 } },
  { name: 'Violet float', ar: 'عائم بنفسجي', config: { template: 'floating', height: 72, width: 90, background: '#312E81', foreground: '#F5F3FF', accent: '#C4B5FD', radius: 24 } },
  { name: 'Emerald float', ar: 'عائم زمردي', config: { template: 'floating', height: 68, width: 94, background: '#064E3B', foreground: '#ECFDF5', accent: '#6EE7B7', radius: 16 } },
];
const bottomNavLooks = [
  { name: 'Full-width', ar: 'مستطيل كامل', config: { template: 'bar', height: 64, width: 100, background: '#111827', foreground: '#F8FAFC', accent: '#38BDF8', radius: 0 } },
  { name: 'Slate float', ar: 'عائم رمادي', config: { template: 'floating', height: 68, width: 92, background: '#1E293B', foreground: '#F8FAFC', accent: '#67E8F9', radius: 20 } },
  { name: 'Rounded pill', ar: 'كبسولة دائرية', config: { template: 'pill', height: 72, width: 90, background: '#312E81', foreground: '#F5F3FF', accent: '#C4B5FD', radius: 24 } },
  { name: 'Emerald', ar: 'زمردي', config: { template: 'floating', height: 64, width: 88, background: '#064E3B', foreground: '#ECFDF5', accent: '#6EE7B7', radius: 16 } },
  { name: 'Warm accent', ar: 'ذهبي دافئ', config: { template: 'pill', height: 70, width: 94, background: '#422006', foreground: '#FFFBEB', accent: '#FBBF24', radius: 24 } },
];
const previewPresetPalettes = {
  "classic": {
    "light": [
      "#2563EB",
      "#475569",
      "#F59E0B",
      "#FFFFFF",
      "#F8FAFC",
      "#0F172A",
      "#475569",
      "#CBD5E1"
    ],
    "dark": [
      "#60A5FA",
      "#A78BFA",
      "#FBBF24",
      "#0F172A",
      "#1E293B",
      "#F8FAFC",
      "#CBD5E1",
      "#475569"
    ]
  },
  "midnight": {
    "light": [
      "#1D4ED8",
      "#334155",
      "#D97706",
      "#EFF6FF",
      "#FFFFFF",
      "#0F172A",
      "#475569",
      "#CBD5E1"
    ],
    "dark": [
      "#60A5FA",
      "#A78BFA",
      "#FBBF24",
      "#0B1023",
      "#17213A",
      "#F8FAFC",
      "#CBD5E1",
      "#475569"
    ]
  },
  "warm": {
    "light": [
      "#B45309",
      "#92400E",
      "#047857",
      "#FFFBEB",
      "#FFFFFF",
      "#292524",
      "#57534E",
      "#D6D3D1"
    ],
    "dark": [
      "#FBBF24",
      "#FDBA74",
      "#6EE7B7",
      "#292014",
      "#3C2D1D",
      "#FFF7ED",
      "#D6D3D1",
      "#786550"
    ]
  },
  "ocean": {
    "light": [
      "#0369A1",
      "#0E7490",
      "#0F766E",
      "#F0F9FF",
      "#FFFFFF",
      "#082F49",
      "#475569",
      "#BAE6FD"
    ],
    "dark": [
      "#38BDF8",
      "#67E8F9",
      "#5EEAD4",
      "#082F49",
      "#164E63",
      "#F0F9FF",
      "#BAE6FD",
      "#0E7490"
    ]
  },
  "forest": {
    "light": [
      "#15803D",
      "#166534",
      "#B45309",
      "#F0FDF4",
      "#FFFFFF",
      "#14532D",
      "#3F6212",
      "#BBF7D0"
    ],
    "dark": [
      "#4ADE80",
      "#86EFAC",
      "#FACC15",
      "#0F2418",
      "#193D27",
      "#F0FDF4",
      "#BBF7D0",
      "#3F6212"
    ]
  },
  "royal": {
    "light": [
      "#6D28D9",
      "#7C3AED",
      "#C026D3",
      "#FAF5FF",
      "#FFFFFF",
      "#2E1065",
      "#6B21A8",
      "#DDD6FE"
    ],
    "dark": [
      "#C4B5FD",
      "#A78BFA",
      "#F0ABFC",
      "#1E1239",
      "#322258",
      "#FAF5FF",
      "#DDD6FE",
      "#6D28D9"
    ]
  },
  "sunset": {
    "light": [
      "#C2410C",
      "#BE123C",
      "#B45309",
      "#FFF7ED",
      "#FFFFFF",
      "#431407",
      "#7C2D12",
      "#FED7AA"
    ],
    "dark": [
      "#FB923C",
      "#FDA4AF",
      "#FCD34D",
      "#2A1411",
      "#43201A",
      "#FFF7ED",
      "#FED7AA",
      "#9A3412"
    ]
  },
  "graphite": {
    "light": [
      "#334155",
      "#475569",
      "#0E7490",
      "#F8FAFC",
      "#FFFFFF",
      "#0F172A",
      "#475569",
      "#CBD5E1"
    ],
    "dark": [
      "#E2E8F0",
      "#94A3B8",
      "#67E8F9",
      "#0F172A",
      "#1E293B",
      "#F8FAFC",
      "#CBD5E1",
      "#475569"
    ]
  },
  "gold": {
    "light": [
      "#9A6700",
      "#6B4E16",
      "#B45309",
      "#FFFCF2",
      "#FFF4D6",
      "#2C210C",
      "#594B32",
      "#D9C28E"
    ],
    "dark": [
      "#FACC15",
      "#EAB308",
      "#FDE68A",
      "#1C170B",
      "#302711",
      "#FFF9E6",
      "#CFC29B",
      "#796333"
    ]
  },
  "silver": {
    "light": [
      "#475569",
      "#64748B",
      "#0E7490",
      "#F8FAFC",
      "#E9EEF3",
      "#111827",
      "#475569",
      "#B9C3CF"
    ],
    "dark": [
      "#E2E8F0",
      "#94A3B8",
      "#67E8F9",
      "#111827",
      "#1F2937",
      "#F8FAFC",
      "#CBD5E1",
      "#475569"
    ]
  },
  "copper": {
    "light": [
      "#9A3412",
      "#7C2D12",
      "#B45309",
      "#FFFAF5",
      "#FFF1E6",
      "#31170E",
      "#654838",
      "#D8B6A1"
    ],
    "dark": [
      "#FDBA74",
      "#FB923C",
      "#FDE68A",
      "#21130F",
      "#38211A",
      "#FFF7ED",
      "#D6B8A7",
      "#895841"
    ]
  },
  "ruby": {
    "light": [
      "#BE123C",
      "#9F1239",
      "#7C3AED",
      "#FFF7F9",
      "#FFEAF0",
      "#3B0A1B",
      "#6D3349",
      "#F5B8CB"
    ],
    "dark": [
      "#FDA4AF",
      "#FB7185",
      "#F0ABFC",
      "#210B16",
      "#391322",
      "#FFF1F2",
      "#D8A7B8",
      "#89344C"
    ]
  },
  "orchid": {
    "light": [
      "#9333EA",
      "#7E22CE",
      "#DB2777",
      "#FDF8FF",
      "#F3E8FF",
      "#2E1065",
      "#6B3A80",
      "#D8B4FE"
    ],
    "dark": [
      "#E9D5FF",
      "#C084FC",
      "#F9A8D4",
      "#1B1026",
      "#301B43",
      "#FAF5FF",
      "#D8B4E8",
      "#6B3A80"
    ]
  },
  "aurora": {
    "light": [
      "#0F766E",
      "#0369A1",
      "#7C3AED",
      "#F0FDFA",
      "#FFFFFF",
      "#102A2B",
      "#48615F",
      "#99F6E4"
    ],
    "dark": [
      "#5EEAD4",
      "#7DD3FC",
      "#C4B5FD",
      "#071F24",
      "#11313A",
      "#F0FDFA",
      "#B7D9D8",
      "#2C6B72"
    ]
  },
  "desert": {
    "light": [
      "#A16207",
      "#9A3412",
      "#0F766E",
      "#FFFBF3",
      "#FFF4DF",
      "#33220F",
      "#6B5037",
      "#E7CFA7"
    ],
    "dark": [
      "#FCD34D",
      "#FDBA74",
      "#5EEAD4",
      "#231B12",
      "#392A1B",
      "#FFF7E6",
      "#D7C0A0",
      "#826443"
    ]
  },
  "frost": {
    "light": [
      "#0E7490",
      "#2563EB",
      "#0891B2",
      "#F3FAFC",
      "#E7F5F9",
      "#102A38",
      "#426171",
      "#B6DCE7"
    ],
    "dark": [
      "#67E8F9",
      "#93C5FD",
      "#C4B5FD",
      "#0B1825",
      "#152B3B",
      "#F0F9FF",
      "#BDD4E2",
      "#3A6478"
    ]
  }
};
const presetNames = {
  "ar": {
    "classic": "كلاسيكي",
    "midnight": "ليلي",
    "warm": "دافئ",
    "ocean": "محيط",
    "forest": "غابة",
    "royal": "ملكي",
    "sunset": "غروب",
    "graphite": "جرافيت",
    "gold": "ذهبي",
    "silver": "فضي",
    "copper": "نحاسي",
    "ruby": "ياقوتي",
    "orchid": "أوركيد",
    "aurora": "شفق",
    "desert": "صحراوي",
    "frost": "جليدي"
  },
  "en": {
    "classic": "Classic",
    "midnight": "Midnight",
    "warm": "Warm",
    "ocean": "Ocean",
    "forest": "Forest",
    "royal": "Royal",
    "sunset": "Sunset",
    "graphite": "Graphite",
    "gold": "Gold",
    "silver": "Silver",
    "copper": "Copper",
    "ruby": "Ruby",
    "orchid": "Orchid",
    "aurora": "Aurora",
    "desert": "Desert",
    "frost": "Frost"
  }
};
const presetCategory = (id, language) => {
  const categories = {
    luxury: ['royal', 'gold', 'silver', 'copper'], glass: ['aurora', 'orchid', 'frost'], neon: ['ruby', 'sunset'],
    minimal: ['classic', 'midnight', 'graphite'], modern: ['ocean', 'forest', 'desert', 'warm'],
  };
  const category = Object.keys(categories).find((key) => categories[key].includes(id)) || 'modern';
  const labels = language === 'ar'
    ? { luxury: 'فاخر', glass: 'شفق', neon: 'جريء', minimal: 'بسيط', modern: 'حديث' }
    : { luxury: 'Luxury', glass: 'Atmospheric', neon: 'Bold', minimal: 'Minimal', modern: 'Modern' };
  return labels[category];
};
const samplePresets = Object.entries(previewPresetPalettes).map(([id, modes]) => ({
  id, tier: ['classic', 'midnight', 'warm'].includes(id) ? 'FREE' : 'THEME_PRO',
  configuration: { ...sampleTheme, modes: {
    light: { ...samplePart('light'), presetId: id, colors: Object.fromEntries(colorKeys.map((key, index) => [key, modes.light[index]])) },
    dark: { ...samplePart('dark'), presetId: id, colors: Object.fromEntries(colorKeys.map((key, index) => [key, modes.dark[index]])) },
  } },
}));
const copy = {
  ar: {
    title: 'مظهر المنصة', subtitle: 'صمّم مظهرًا مستقلًا للوضع الفاتح والغامق، ثم عاين النتيجة قبل النشر.',
    sectionNavigation: 'أقسام مظهر المنصة', appearancePage: 'تخصيص المظهر', subscriptionPage: 'الدفع والاشتراكات', contactsPage: 'أرقام واتساب', historyPage: 'السجل',
    appearanceColors: 'الألوان والثيمات', appearanceInterface: 'الخطوط والواجهة', appearanceBrand: 'الهوية والصور',
    ownerWhatsApp: 'واتساب صاحب الموقع', serverWhatsApp: 'واتساب إشعارات السيرفر · ULTRA', supportWhatsApp: 'واتساب خدمة العملاء',
    contactsHint: 'تظهر أرقام التواصل العامة في نافذة تواصل معنا وصفحة من نحن وقسم مشاكل الحساب. رقم إشعارات السيرفر مخصص للإدارة فقط ولا يظهر للعملاء. تغيير أرقام واتساب متاح لمشتركي ULTRA فقط.', serverWhatsAppHint: 'أدخل الأرقام بصيغة دولية مع رمز + ومفتاح الدولة، مثال: +201012345678.',
    phoneFormatHint: 'اكتب الرقم مع + ومفتاح الدولة، مثال: +201012345678.', phoneValidation: 'أدخل رقمًا دوليًا صحيحًا يبدأ بـ + ومفتاح الدولة.', contactsLockedTitle: 'إدارة أرقام واتساب ميزة حصرية لخطة ULTRA.', contactsSubscriptionCta: 'شاهد الخطط والمميزات وطرق الدفع والتفعيل',
    ultraContactsOnly: 'تغيير أرقام واتساب متاح في ULTRA فقط.', subscriptionLink: 'شاهد الخطط والمميزات وطرق الدفع والتفعيل', saveContacts: 'حفظ أرقام التواصل', saving: 'جارٍ الحفظ...', contactsSaved: 'تم حفظ أرقام واتساب التواصل.', contactsSaveFailed: 'تعذر حفظ أرقام واتساب.',
    previewNotice: 'هذه معاينة للتصميم فقط. لإنشاء طلب تحويل حقيقي، افتح صفحة الأدمن بعد تشغيل الباك إند.',
    previewOrderHint: 'لا يمكن إنشاء رقم طلب أو إرسال تحويل من المعاينة. افتح صفحة الأدمن لإنشاء طلب مسجل أولًا.',
    offerEyebrow: 'عرض خاص للثيمات', offerHeadline: 'استمتع بمميزات الثيمات لمدة 3 أشهر فقط',
    freeWarning: 'الخطة المجانية تمنحك تغييرين فقط، مع الانتظار 30 يومًا بينهما. للمزيد اشترك في PRO أو ULTRA.',
    ultraBenefits: ['كل مميزات PRO', 'تغيير أرقام واتساب التواصل ورقم استقبال إشعارات السيرفر', 'قوالب سايدبار متنوعة: ملكي ذهبي، زجاجي، شفق بنفسجي، مستطيل فحمي، ودائري زمردي'],
    upgrade: 'الترقية إلى ULTRA بدفع الفرق: 5 USDT فقط', upgradeTerm: 'تستمر الترقية حتى تاريخ انتهاء اشتراك PRO الحالي؛ لا تبدأ مدة جديدة.',
    amountDue: 'صافي المبلغ المطلوب', changesLeft: 'التغييرات المجانية المتبقية', ultraActive: 'اشتراك ULTRA نشط', contactsSettings: 'إعدادات أرقام واتساب',
    offerOld: 'بدلًا من 50$ لنفس المدة', offerNew: '24.99$ فقط',
    offerPayment: 'التحويل: 24.99 USDT صافي · دفعة واحدة', offerAction: 'شاهد المميزات والاشتراك', offerClose: 'إغلاق العرض', offerOpen: 'عرض اشتراك الثيمات',
    offerBackendOutdated: 'يجب تحديث خدمة الاشتراك إلى عرض 3 أشهر قبل إنشاء طلب تحويل.',
    openAdminOrder: 'افتح صفحة الأدمن لإنشاء طلب التحويل',
    light: 'الوضع الفاتح', dark: 'الوضع الغامق', presets: 'الثيمات الجاهزة', colors: 'الألوان', typography: 'الخطوط',
    components: 'تفاصيل الواجهة', branding: 'صور المنصة', livePreview: 'معاينة مباشرة',
    neonTitle: 'حدود النيون المتحركة', neonHint: 'اختر لونًا وسرعة مختلفين لكل قسم في الوضع الفاتح والغامق.',
    neonPurchase: 'نافذة الشراء', neonHero: 'السلايدر الرئيسي', neonCategories: 'الأقسام الرئيسية', neonBestSellers: 'الأكثر مبيعًا',
    categoryDefault: 'الإعداد الافتراضي لكل الأقسام', categoryNeonHint: 'عاين أقسام الصفحة الرئيسية الفعلية، واختر لكل قسم لونًا وسرعة مختلفين في الوضع الحالي.', noHomepageCategories: 'لا توجد أقسام رئيسية متاحة الآن. ستظهر هنا بعد تحميل أقسام المتجر.',
    neonEnabled: 'تفعيل', neonSpeed: 'سرعة الدوران', neonDemo: 'معاينة تأثير النيون',
    primary: 'الأساسي', secondary: 'الثانوي', accent: 'التمييز', background: 'الخلفية', surface: 'البطاقات', text: 'النص', mutedText: 'النص الثانوي', border: 'الحدود',
    arabicFont: 'الخط العربي', englishFont: 'الخط الإنجليزي', baseSize: 'حجم النص', headingWeight: 'وزن العناوين',
    buttonRadius: 'استدارة الأزرار', buttonStyle: 'شكل الأزرار', cardRadius: 'استدارة البطاقات', cardShadow: 'ظل البطاقات', navigation: 'القائمة',
    solid: 'ممتلئ', outline: 'محدد', none: 'بدون', subtle: 'خفيف', medium: 'متوسط', standard: 'عادي', compact: 'مدمج',
    save: 'حفظ المسودة', reset: 'إعادة المسودة', publish: 'نشر الثيمين', restore: 'استعادة ونشر',
    free: 'مجاني', paid: 'اشتراك Pro نشط', pro: 'Pro', lock: 'للمشتركين',
    freeLocked: 'هذه الإعدادات تحتاج اشتراك Pro موثقًا. يمكنك تعديل الألوان والثيمات المجانية للوضعين.',
    currentPlan: 'حالة النشر', lastPublish: 'آخر نشر', nextEdit: 'النشر المجاني التالي', expires: 'ينتهي الاشتراك',
    history: 'سجل النشر', payments: 'طلبات التحويل', empty: 'لا توجد سجلات بعد.',
    paymentStates: { PENDING: 'بانتظار مراجعة التحويل', VERIFIED: 'تم التحقق؛ أدخل كود التفعيل', FAILED: 'فشل', CANCELLED: 'ملغي', REFUNDED: 'مسترد', CHARGEBACK: 'مسترجع' },
    plan: 'خطط Theme Customization', planPrice: 'PRO · 24.99 USDT', duration: '3 أشهر تقويمية · دفعة واحدة · بدون تجديد تلقائي', ultra: 'ULTRA · 29.99 USDT بدلًا من 70$ لفترة محدودة',
    benefitsTitle: 'اشترك وسيفتح لك', benefits: ['نشر الثيمات بلا انتظار 30 يومًا', '13 ثيمًا إضافيًا للفاتح والغامق',
      'خطوط عربية وإنجليزية إضافية', 'حجم النص والأزرار والبطاقات والقائمة', 'تغيير صور السلايدر الأربع واللوجو وحجمه', 'تعديل النص العربي المتحرك أسفل السلايدر',
      'حدود نيون متحركة حول الشراء والسلايدر والأقسام والأكثر مبيعًا بألوان وسرعات مستقلة'],
    transferTitle: 'تحويل USDT يدوي', network: 'طريقة التحويل', destination: 'جهة التحويل', payee: 'اسم المستلم',
    copy: 'نسخ', copied: 'تم النسخ', request: 'إنشاء طلب التحويل', whatsapp: 'إرسال إثبات التحويل عبر واتساب',
    proof: 'بعد التحويل، أرسل لقطة شاشة الإثبات عبر واتساب. بعد التحقق من وصول المبلغ ستتلقى كود التفعيل، ولا تتفعّل الخطة حتى تدخله.',
    activationTitle: 'تفعيل الاشتراك بالكود المؤقت', activationHint: 'بعد مراجعة وصول مبلغ خطتك أو الترقية، سيصلك كود من 10 أرقام. صلاحيته 48 ساعة ويُستخدم مرة واحدة.',
    activationCode: 'كود التفعيل', activate: 'تفعيل الاشتراك أو الترقية', activated: 'تم تفعيل الاشتراك بنجاح.',
    activationOrderNeeded: 'أنشئ طلب التحويل أولًا، ثم أدخل كود التفعيل بعد تأكيد الدفع.',
    noPaymentReady: 'تعليمات التحويل غير متاحة حتى يتصل التطبيق بالباك إند.',
    animatedArabic: 'النص العربي المتحرك', animatedArabicHint: 'تعديل النص الظاهر أسفل السلايدر متاح للمشتركين في Pro فقط (حتى 240 حرفًا).',
    sidebarTemplate: 'قالب السايدبار', sidebarTemplateHint: 'اختر شكل القائمة الجانبية وعاين شكلها قبل حفظ المسودة ونشرها. القوالب المميزة متاحة مع ULTRA.', sidebarDefault: 'الافتراضي', sidebarRoyal: 'ملكي ذهبي', sidebarGlass: 'زجاجي', sidebarAurora: 'شفق بنفسجي', sidebarSquare: 'مستطيل فحمي', sidebarRounded: 'دائري زمردي', sidebarPreviewBrand: 'EMBRATOR', sidebarPreviewAccount: 'حساب المدير', sidebarPreviewItem: 'لوحة التحكم', ultraLocked: 'هذه الميزة تحتاج اشتراك ULTRA.',
    logo: 'شعار المنصة', logoWidth: 'عرض الشعار', slides: 'صور السلايدر الرئيسية', targetBanner: 'صورة بانر بيع التارجت', imageHint: 'JPG أو PNG أو WebP، بحد أقصى 5MB',
    upload: 'رفع صورة', remove: 'إزالة', sample: 'زر تجريبي', sampleText: 'هذه معاينة للألوان والخطوط والبطاقات في الوضع المحدد.',
    retry: 'إعادة المحاولة', partial: 'تعذر تحميل بعض بيانات الاشتراك أو السجل، ويمكنك تعديل الثيم.', loading: 'جارٍ التحميل...',
    unavailable: 'يتطلب المحرر الاتصال بالباك إند الحقيقي.', networkError: 'تعذر الاتصال بالخادم. تحقق من الاتصال وحاول مرة أخرى.',
    missingApi: 'محرر مظهر المنصة غير متاح على الخادم الحالي. يلزم تحديث الخدمة.', unauthorized: 'انتهت صلاحية الجلسة.',
    forbidden: 'لا تملك صلاحية تعديل مظهر المنصة.', failed: 'تعذرت العملية.', saved: 'تم حفظ المسودة.', published: 'تم النشر.', resetDone: 'تمت إعادة المسودة.',
  },
  en: {
    title: 'Platform Appearance', subtitle: 'Design separate light and dark appearances and preview before publishing.',
    sectionNavigation: 'Platform appearance sections', appearancePage: 'Customize appearance', subscriptionPage: 'Payments and plans', contactsPage: 'WhatsApp numbers', historyPage: 'History',
    appearanceColors: 'Colors and presets', appearanceInterface: 'Fonts and layout', appearanceBrand: 'Brand and images',
    ownerWhatsApp: 'Site owner WhatsApp', serverWhatsApp: 'Server notification WhatsApp · ULTRA', supportWhatsApp: 'Customer support WhatsApp',
    contactsHint: 'Public contact numbers appear in Contact Us, About Us, and Account Problems. The server notification number is private to administration and never shown to customers. WhatsApp number editing requires ULTRA.', serverWhatsAppHint: 'Enter an international number with + and country code, for example +201012345678.',
    phoneFormatHint: 'Use + and a country code, for example +201012345678.', phoneValidation: 'Enter a valid international number starting with + and the country code.', contactsLockedTitle: 'WhatsApp contact management is exclusive to the ULTRA plan.', contactsSubscriptionCta: 'View plans, features, payment and activation',
    ultraContactsOnly: 'Editing WhatsApp numbers requires ULTRA.', subscriptionLink: 'View plans, features, payment and activation', saveContacts: 'Save contact numbers', saving: 'Saving...', contactsSaved: 'WhatsApp contact numbers saved.', contactsSaveFailed: 'Could not save WhatsApp numbers.',
    previewNotice: 'This is a design preview. Open the admin page with a running backend to create a real transfer order.',
    previewOrderHint: 'The preview cannot issue an order reference or record a transfer. Open the admin page to create a recorded order first.',
    offerEyebrow: 'Special theme offer', offerHeadline: 'Enjoy theme features for 3 months',
    freeWarning: 'The free plan includes two changes, with 30 days between them. Subscribe to PRO or ULTRA for more.',
    ultraBenefits: ['All PRO features', 'Edit public WhatsApp contacts and the server notification recipient', 'Distinct sidebar templates: Royal gold, Glass, Violet aurora, Charcoal square, and Emerald rounded'],
    upgrade: 'Upgrade to ULTRA for the difference: only 5 USDT', upgradeTerm: 'The upgrade keeps your current PRO expiry date; it does not start a new term.',
    amountDue: 'Net amount due', changesLeft: 'Free changes remaining', ultraActive: 'ULTRA active', contactsSettings: 'WhatsApp number settings',
    offerOld: 'Instead of $50 for the same term', offerNew: 'Only $24.99',
    offerPayment: 'Transfer 24.99 USDT net · one payment', offerAction: 'See features and subscribe', offerClose: 'Close offer', offerOpen: 'View theme subscription',
    offerBackendOutdated: 'The subscription service must be updated to the 3-month offer before creating a transfer order.',
    openAdminOrder: 'Open admin page to create a transfer order',
    light: 'Light mode', dark: 'Dark mode', presets: 'Theme presets', colors: 'Colors', typography: 'Fonts',
    components: 'Interface details', branding: 'Platform images', livePreview: 'Live preview',
    neonTitle: 'Animated neon borders', neonHint: 'Set a different color and speed for each section in light and dark modes.',
    neonPurchase: 'Purchase window', neonHero: 'Homepage slider', neonCategories: 'Main categories', neonBestSellers: 'Best sellers',
    categoryDefault: 'Default for all categories', categoryNeonHint: 'Preview real homepage categories and give each one its own color and speed in this mode.', noHomepageCategories: 'No homepage categories are available yet. They will appear after the catalog loads.',
    neonEnabled: 'Enable', neonSpeed: 'Orbit speed', neonDemo: 'Neon preview',
    primary: 'Primary', secondary: 'Secondary', accent: 'Accent', background: 'Background', surface: 'Cards', text: 'Text', mutedText: 'Muted text', border: 'Border',
    arabicFont: 'Arabic font', englishFont: 'English font', baseSize: 'Base size', headingWeight: 'Heading weight',
    buttonRadius: 'Button radius', buttonStyle: 'Button style', cardRadius: 'Card radius', cardShadow: 'Card shadow', navigation: 'Navigation',
    solid: 'Solid', outline: 'Outline', none: 'None', subtle: 'Subtle', medium: 'Medium', standard: 'Standard', compact: 'Compact',
    save: 'Save draft', reset: 'Reset draft', publish: 'Publish both modes', restore: 'Restore and publish',
    free: 'Free', paid: 'Pro active', pro: 'Pro', lock: 'Subscriber feature',
    freeLocked: 'These settings require verified Pro access. Both modes still support free colors and presets.',
    currentPlan: 'Publishing status', lastPublish: 'Last published', nextEdit: 'Next free publish', expires: 'Subscription expires',
    history: 'Publish history', payments: 'Transfer requests', empty: 'No records yet.',
    paymentStates: { PENDING: 'Awaiting transfer review', VERIFIED: 'Verified; enter activation code', FAILED: 'Failed', CANCELLED: 'Cancelled', REFUNDED: 'Refunded', CHARGEBACK: 'Charged back' },
    plan: 'Theme Customization plans', planPrice: 'PRO · 24.99 USDT', duration: '3 calendar months · one payment · no automatic renewal', ultra: 'ULTRA · 29.99 USDT instead of $70 for a limited time',
    benefitsTitle: 'Subscription unlocks', benefits: ['Unlimited publishing during the term', '13 extra light and dark presets',
      'More Arabic and English fonts', 'Font sizing, buttons, cards, and navigation', 'Four homepage slides, logo, and logo size', 'Edit the animated Arabic text below the slider',
      'Animated neon borders for checkout, slider, categories, and best sellers with separate colors and speeds'],
    transferTitle: 'Manual USDT transfer', network: 'Transfer method', destination: 'Destination', payee: 'Recipient',
    copy: 'Copy', copied: 'Copied', request: 'Create transfer order', whatsapp: 'Send proof on WhatsApp',
    proof: 'After transfer, send the screenshot on WhatsApp. A code is sent after receipt is verified; enter it to activate your plan.',
    activationTitle: 'Activate with a temporary code', activationHint: 'After your plan or upgrade payment is verified, you receive a 10-digit code. It lasts 48 hours and works once.',
    activationCode: 'Activation code', activate: 'Activate subscription or upgrade', activated: 'Subscription activated.',
    activationOrderNeeded: 'Create a transfer order first, then enter the activation code after payment verification.',
    noPaymentReady: 'Transfer instructions require a backend connection.',
    animatedArabic: 'Animated Arabic text', animatedArabicHint: 'Pro subscribers can edit the text below the slider (up to 240 characters).',
    sidebarTemplate: 'Sidebar template', sidebarTemplateHint: 'Choose a sidebar look and preview it before saving and publishing. Premium templates require ULTRA.', sidebarDefault: 'Default', sidebarRoyal: 'Royal gold', sidebarGlass: 'Glass', sidebarAurora: 'Violet aurora', sidebarSquare: 'Charcoal square', sidebarRounded: 'Emerald rounded', sidebarPreviewBrand: 'EMBRATOR', sidebarPreviewAccount: 'Admin account', sidebarPreviewItem: 'Dashboard', ultraLocked: 'This feature requires ULTRA.',
    logo: 'Platform logo', logoWidth: 'Logo width', slides: 'Homepage slider images', targetBanner: 'Sell Target banner image', imageHint: 'JPG, PNG, or WebP up to 5MB',
    upload: 'Upload image', remove: 'Remove', sample: 'Sample button', sampleText: 'Preview colors, fonts, and cards in the selected mode.',
    retry: 'Retry', partial: 'Some subscription or history details could not be loaded; you can still edit.', loading: 'Loading...',
    unavailable: 'Connect the real backend to use this editor.', networkError: 'Cannot reach the server. Check your connection and retry.',
    missingApi: 'Platform appearance is unavailable on the current server. The service needs an update.', unauthorized: 'Your session expired.',
    forbidden: 'This account cannot edit platform appearance.', failed: 'The action failed.', saved: 'Draft saved.', published: 'Published.', resetDone: 'Draft reset.',
  },
};
const dateText = (date, language) => date ? new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-US',
  { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Cairo' }).format(new Date(date)) : '—';
const errorText = (error, t) => {
  const status = error?.response?.status;
  if (!status) return t.networkError;
  if (status === 401) return t.unauthorized;
  if (status === 403 && error?.response?.data?.code === 'THEME_PRO_REQUIRED') return t.freeLocked;
  if (status === 403 && error?.response?.data?.code === 'THEME_FREE_LIMIT') return t.freeWarning;
  if (status === 403 && error?.response?.data?.code === 'THEME_ULTRA_REQUIRED') return t.ultraLocked;
  if (status === 403) return t.forbidden;
  if (status === 404 && error?.response?.data?.code === 'PAYMENT_NOT_VERIFIED') return t.paymentStates.PENDING;
  if (status === 404) return t.missingApi;
  return error?.response?.data?.message || t.failed;
};
const Section = ({ title, icon: Icon, locked = false, children }) => <section className={card}>
  <h2 className="mb-4 flex items-center gap-2 text-base font-black text-[var(--color-text)]"><Icon className="h-5 w-5 text-[var(--color-primary)]" />{title}{locked && <LockKeyhole className="ms-auto h-4 w-4 text-amber-500" />}</h2>{children}
</section>;
const Select = ({ label, value, values, onChange, disabled = false, labels = {}, suffix = '' }) => <label className="block text-sm text-[var(--color-text)]">{label}
  <select className={`${input} mt-1`} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}>{values.map((item) => <option key={item} value={item}>{labels[item] || `${item}${suffix}`}</option>)}</select>
</label>;

export default function PlatformThemeEditor({ previewOnly = false }) {
  const { language } = useLanguage();
  const { categories, loadProducts } = useMediaStore();
  const [catalogCategories, setCatalogCategories] = useState(null);
  const { addToast } = useToast();
  const { user } = useAuthStore();
  const { paymentSettings, loadPaymentSettings, savePaymentSettings } = useSystemStore();
  const t = copy[language] || copy.ar;
  const languageRef = useRef(language);
  languageRef.current = language;
  const [mode, setMode] = useState('light');
  const [activePage, setActivePage] = useState('overview');
  const navigate = useNavigate();
  const [supportContacts, setSupportContacts] = useState({ owner: '', support: '' });
  const [adminNotificationWhatsApp, setAdminNotificationWhatsApp] = useState('');
  const [savingContacts, setSavingContacts] = useState(false);
  const [contactsErrors, setContactsErrors] = useState({});
  const contactsSaveInFlight = useRef(false);
  const contactsDirty = useRef(false);
  const [draft, setDraft] = useState(previewOnly ? sampleTheme : null);
  const [settings, setSettings] = useState(null);
  const [presets, setPresets] = useState(previewOnly ? samplePresets : []);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(!previewOnly);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [partial, setPartial] = useState(false);
  useEffect(() => {
    if (previewOnly) return;
    const section = window.location.hash.replace('#studio-', '').replace('#theme-', '');
    if (section === 'subscription') { navigate('/admin/theme/subscriptions', { replace: true }); return; }
    if (['overview', 'colors', 'templates', 'typography', 'header', 'sidebar', 'navigation', 'branding', 'contacts', 'history', 'preview'].includes(section)) setActivePage(section);
  }, [navigate, previewOnly]);
  const paid = ['THEME_PRO', 'THEME_ULTRA'].includes(settings?.eligibility?.plan);
  const ultra = settings?.eligibility?.plan === 'THEME_ULTRA';
  const canPreviewUltra = ultra || previewOnly;
  const canPreviewPaid = paid || previewOnly;
  useEffect(() => {
    if (!previewOnly && liveApi) void loadPaymentSettings({ force: true });
  }, [previewOnly, loadPaymentSettings]);
  useEffect(() => {
    if (contactsDirty.current) return;
    setSupportContacts({ owner: String(paymentSettings?.supportContacts?.owner || '').trim(), support: String(paymentSettings?.supportContacts?.support || '').trim() });
    setAdminNotificationWhatsApp(String(paymentSettings?.adminNotificationWhatsApp || '').trim());
    setContactsErrors({});
  }, [paymentSettings]);
  const part = draft?.modes?.[mode];
  const previewStyle = useMemo(() => platformThemeStyles(draft, mode), [draft, mode]);
  useEffect(() => {
    let active = true;
    if (!liveApi) { void loadProducts({ force: false }); return undefined; }
    void apiClient.publicCatalog.fetch()
      .then((catalog) => { if (active && Array.isArray(catalog?.categories)) setCatalogCategories(catalog.categories); })
      .catch(() => { if (active) void loadProducts({ force: false }); });
    return () => { active = false; };
  }, [loadProducts]);
  const homepageCategories = useMemo(() => createStorefrontCategories(
    Array.isArray(catalogCategories) ? catalogCategories : categories, [], language
  ).filter((category) => category.id !== 'all' && !category.parentCategory && /^[a-zA-Z0-9_-]{1,80}$/.test(category.id) && !['__proto__', 'constructor', 'prototype'].includes(category.id)),
  [catalogCategories, categories, language]);

  const refresh = useCallback(async (keepDraft = false) => {
    if (previewOnly || !liveApi) return;
    setLoading(true);
    try {
      const [settingsResult, presetsResult, historyResult] = await Promise.allSettled([
        apiClient.platformTheme.getSettings(), apiClient.platformTheme.getPresets(), apiClient.platformTheme.getHistory(),
      ]);
      if (settingsResult.status === 'rejected') throw settingsResult.reason;
      if (presetsResult.status === 'rejected') throw presetsResult.reason;
      const current = settingsResult.value;
      const options = presetsResult.value?.presets || [];
      setSettings(current);
      setPresets(options);
      setHistory(historyResult.status === 'fulfilled' ? historyResult.value?.items || [] : []);
      setPartial(historyResult.status === 'rejected');
      if (!keepDraft) setDraft(current?.draft || current?.published || options[0]?.configuration || null);
      setError('');
    } catch (cause) { setError(errorText(cause, copy[languageRef.current] || copy.ar)); }
    finally { setLoading(false); }
  }, [previewOnly]);
  useEffect(() => { refresh(); }, [refresh]);

  const updatePart = (section, key, value) => setDraft((current) => ({ ...current,
    modes: { ...current.modes, [mode]: { ...current.modes[mode], [section]: { ...current.modes[mode][section], [key]: value } } } }));
  const updateBrand = (change) => setDraft((current) => ({ ...current, brand: { ...current.brand, ...change } }));
  const updateSidebarMetrics = (change) => setDraft((current) => ({ ...current, brand: { ...current.brand,
    sidebarMetrics: { ...sampleTheme.brand.sidebarMetrics, ...current.brand.sidebarMetrics, ...change } } }));
  const updateChrome = (section, change) => setDraft((current) => ({ ...current, chrome: { ...current.chrome, [section]: { ...current.chrome[section], ...change } } }));
  const updateNeon = (section, change) => setDraft((current) => ({ ...current,
    modes: { ...current.modes, [mode]: { ...current.modes[mode], neon: { ...current.modes[mode].neon,
      [section]: { ...current.modes[mode].neon[section], ...change } } } } }));
  const updateCategoryNeon = (categoryId, change) => setDraft((current) => {
    const appearance = current.modes[mode];
    const neon = appearance.neon || sampleNeon();
    const categoryCards = neon.categoryCards || {};
    const effect = categoryCards[categoryId] || neon.categories || sampleNeon().categories;
    return { ...current, modes: { ...current.modes, [mode]: { ...appearance,
      neon: { ...neon, categoryCards: { ...categoryCards, [categoryId]: { ...effect, ...change } } } } } };
  });
  const choosePreset = (entry) => setDraft((current) => ({ ...current,
    modes: { ...current.modes, [mode]: structuredClone(entry.configuration.modes[mode]) } }));
  const needsPro = draft && (Object.values(draft.modes).some((appearance) =>
    presets.find((item) => item.id === appearance.presetId)?.tier === 'THEME_PRO'
    || !freeFonts.arabic.includes(appearance.typography.arabicFont)
    || !freeFonts.english.includes(appearance.typography.englishFont)
    || appearance.typography.baseSize !== 16 || appearance.typography.headingWeight !== 700
    || appearance.buttons.radius !== 8 || appearance.buttons.style !== 'solid'
    || appearance.cards.radius !== 12 || appearance.cards.shadow !== 'subtle'
    || appearance.navigation.style !== 'standard'
    || neonSections.some((section) => JSON.stringify(appearance.neon?.[section]) !== JSON.stringify(sampleNeon()[section]))
    || Object.keys(appearance.neon?.categoryCards || {}).length > 0)
    || draft.brand.logoPath || draft.brand.logoWidth !== 144 || draft.brand.slides.some(Boolean)
    || (draft.brand.marqueeTextArabic ?? DEFAULT_MARQUEE_AR) !== DEFAULT_MARQUEE_AR);
  const run = async (action, success, keepDraft = false) => {
    if (previewOnly || !draft) return;
    setBusy(true);
    try {
      const result = await action();
      if (result?.published) window.dispatchEvent(new CustomEvent('platform-theme-published', { detail: result.published }));
      await refresh(keepDraft);
      addToast(success, 'success');
    } catch (cause) {
      const next = cause?.response?.data?.errors?.find?.((item) => item.field === 'nextFreeEditAt')?.value;
      addToast(next ? `${t.nextEdit}: ${dateText(next, language)}` : errorText(cause, t), 'error');
      if (cause?.response?.status === 429) await refresh(true);
    } finally { setBusy(false); }
  };
  const upload = async (file, slot = null) => {
    if (!paid || previewOnly || !file) return;
    if (file.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      addToast(t.imageHint, 'error'); return;
    }
    setBusy(true);
    try {
      const result = await apiClient.platformTheme.uploadMedia(file);
      if (slot === null) updateBrand({ logoPath: result.path });
      else if (slot === 'targetBanner') updateBrand({ targetBannerPath: result.path });
      else setDraft((current) => ({ ...current, brand: { ...current.brand,
        slides: current.brand.slides.map((path, index) => index === slot ? result.path : path) } }));
    } catch (cause) { addToast(errorText(cause, t), 'error'); }
    finally { setBusy(false); }
  };
  const saveContacts = async () => {
    if (!ultra || previewOnly || contactsSaveInFlight.current) return;
    const validPhone = (value) => /^\+[1-9]\d{7,14}$/.test(String(value || '').trim().replace(/[٠-٩۰-۹]/g, (digit) => String(digit.charCodeAt(0) & 15)).replace(/[\s()-]/g, ''));
    const nextErrors = {
      owner: validPhone(supportContacts.owner) ? '' : t.phoneValidation,
      support: validPhone(supportContacts.support) ? '' : t.phoneValidation,
      notification: !String(adminNotificationWhatsApp || '').trim() || validPhone(adminNotificationWhatsApp) ? '' : t.phoneValidation,
    };
    contactsDirty.current = true;
    setContactsErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;
    contactsSaveInFlight.current = true;
    setSavingContacts(true);
    try {
      const saved = await savePaymentSettings({ supportContacts, adminNotificationWhatsApp }, user);
      setSupportContacts({ owner: String(saved?.supportContacts?.owner || supportContacts.owner).trim(), support: String(saved?.supportContacts?.support || supportContacts.support).trim() });
      setAdminNotificationWhatsApp(String(saved?.adminNotificationWhatsApp ?? adminNotificationWhatsApp).trim());
      contactsDirty.current = false;
      setContactsErrors({});
      addToast(t.contactsSaved, 'success');
    } catch (cause) {
      const status = Number(cause?.response?.status || cause?.status || 0);
      addToast(status === 403 ? t.ultraContactsOnly : status === 400 ? t.phoneValidation : t.contactsSaveFailed, 'error');
    }
    finally { contactsSaveInFlight.current = false; setSavingContacts(false); }
  };

  if (!previewOnly && !liveApi) return <div className={card}>{t.unavailable}</div>;
  if (loading && !draft) return <div className={card}>{t.loading}</div>;
  if (!draft || !part) return <div className={card}><p>{error || t.failed}</p><button type="button" className={`${button} mt-3`} onClick={() => refresh()}>{t.retry}</button></div>;

  const studioNav = [
    ['overview', LayoutDashboard, language === 'ar' ? 'نظرة عامة' : 'Overview'],
    ['header', PanelsTopLeft, language === 'ar' ? 'تصميم الهيدر' : 'Header studio'],
    ['sidebar', MenuSquare, language === 'ar' ? 'تصميم السايدبار' : 'Sidebar studio'],
    ['navigation', Activity, language === 'ar' ? 'النافبار السفلي' : 'Bottom navigation'],
    ['colors', Palette, language === 'ar' ? 'الألوان' : 'Colors'],
    ['typography', Type, language === 'ar' ? 'الخطوط والتفاصيل' : 'Typography'],
    ['templates', Layers3, language === 'ar' ? 'مكتبة القوالب' : 'Template library'],
    ['branding', ImagePlus, language === 'ar' ? 'الهوية والصور' : 'Branding & images'],
    ['preview', Sparkles, language === 'ar' ? 'معاينة الموقع بالكامل' : 'Full website preview'],
    ['contacts', MessageCircle, language === 'ar' ? 'أرقام واتساب' : 'WhatsApp contacts'],
    ['history', History, language === 'ar' ? 'سجل النشر' : 'Publish history'],
  ];
  const editingPage = ['colors', 'templates', 'typography', 'header', 'sidebar', 'navigation', 'branding'].includes(activePage);
  const setStudioSection = (id) => { setActivePage(id); window.history.replaceState(null, '', `#studio-${id}`); };
  const openSubscriptions = () => navigate('/admin/theme/subscriptions');
  return <main className="platform-studio mx-auto max-w-[90rem] space-y-5 px-3 py-5 sm:px-6 sm:py-7">
    <header className="platform-studio__hero"><div><span className="platform-studio__eyebrow"><Sparkles className="h-4 w-4" />PLATFORM STUDIO</span><h1>{language === 'ar' ? 'حوّل منصتك إلى تجربة فريدة تحمل هويتك.' : 'Make your platform a distinctive experience.'}</h1><p>{language === 'ar' ? 'استكشف الهوية البصرية وعدّل مظهر منصتك من مساحة واحدة.' : 'Explore your visual identity and shape the platform from one workspace.'}</p></div><div className="platform-studio__hero-actions"><span className={`platform-studio__plan-badge ${paid ? 'is-paid' : ''}`}>{ultra ? 'ULTRA' : paid ? 'PRO' : language === 'ar' ? 'الخطة المجانية' : 'Free plan'}</span><Link to="/admin/theme/subscriptions" className="platform-studio__upgrade-link"><CreditCard className="h-4 w-4" />{language === 'ar' ? 'الخطط والاشتراكات' : 'Plans & subscriptions'}<ArrowUpRight className="h-4 w-4" /></Link></div></header>
    {(previewOnly || error || partial) && <div role="status" className={`${card} border-sky-500/40 text-sm text-[var(--color-text)]`}>{previewOnly ? t.previewNotice : error || t.partial}{!previewOnly && <button type="button" className={`${button} ms-3`} onClick={() => refresh(true)}>{t.retry}</button>}</div>}
    {!previewOnly && <nav className="platform-studio__nav" aria-label={language === 'ar' ? 'أقسام الاستوديو' : 'Studio sections'}>{studioNav.map(([id, Icon, label]) => { const locked = ['header', 'sidebar', 'navigation'].includes(id) && !canPreviewUltra; return <button key={id} type="button" aria-current={activePage === id ? 'page' : undefined} className={activePage === id ? 'is-active' : ''} onClick={() => setStudioSection(id)}><Icon className="h-4 w-4" /><span>{label}</span>{locked && <LockKeyhole className="ms-auto h-3.5 w-3.5 text-amber-500" aria-label="ULTRA" title="ULTRA" />}</button>; })}</nav>}
    {(previewOnly || editingPage || activePage === 'preview') && <div className="platform-studio__modebar"><span>{language === 'ar' ? 'وضع المعاينة' : 'Preview mode'}</span>{['light', 'dark'].map((value) => <button key={value} type="button" aria-pressed={mode === value} className={mode === value ? 'is-active' : ''} onClick={() => setMode(value)}>{t[value]}</button>)}</div>}
    {!previewOnly && activePage === 'overview' && <section className="space-y-5">
      <div className="platform-studio__overview-grid"><article className={`${card} platform-studio__welcome-card`}><span className="platform-studio__eyebrow"><Sparkles className="h-4 w-4" />{language === 'ar' ? 'مساحة تخصيصك' : 'Your customization workspace'}</span><h2>{language === 'ar' ? 'كل تفاصيل الهوية البصرية في مكان واحد' : 'Your visual identity, all in one place'}</h2><p>{language === 'ar' ? 'خصص عناصر المنصة، استكشف القوالب، وشاهد أثر تعديلاتك قبل النشر.' : 'Customize the platform, explore templates, and preview changes before publishing.'}</p><div className="platform-studio__overview-actions"><button type="button" onClick={() => setStudioSection('preview')}>{language === 'ar' ? 'ابدأ بالمعاينة' : 'Open full preview'}<ArrowUpRight className="h-4 w-4" /></button><Link to="/admin/theme/subscriptions">{language === 'ar' ? 'استكشف الخطط والاشتراكات' : 'Explore plans & subscriptions'}<ArrowUpRight className="h-4 w-4" /></Link></div></article><div className={`${card} platform-studio__status-card`}><span className="platform-studio__status-icon"><Activity /></span><small>{language === 'ar' ? 'حالة الثيم الحالي' : 'Current theme status'}</small><strong>{settings?.version ? `v${settings.version}` : language === 'ar' ? 'مسودة جاهزة' : 'Draft ready'}</strong><p>{language === 'ar' ? `${settings?.eligibility?.freeChangesRemaining ?? 0} تغييرات مجانية متبقية` : `${settings?.eligibility?.freeChangesRemaining ?? 0} free publishes remaining`}</p><span className="platform-studio__feature-count">{language === 'ar' ? 'أكثر من 20 خيار تخصيص' : '20+ customization controls'}</span></div></div>
      <div className={`${card} p-3 sm:p-5`}><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-black">{language === 'ar' ? 'معاينة المنصة المباشرة' : 'Live platform preview'}</h2><p className="text-sm text-[var(--color-text-secondary)]">{language === 'ar' ? 'بيانات توضيحية آمنة · التغييرات مسودة حتى النشر' : 'Safe sample data · edits stay as drafts until published'}</p></div><button type="button" className={button} onClick={() => setStudioSection('preview')}>{language === 'ar' ? 'فتح المعاينة الكاملة' : 'Open full preview'}<ArrowUpRight className="h-4 w-4" /></button></div><PlatformStudioPreview theme={draft} mode={mode} language={language} compact locked={!canPreviewPaid} onUpgrade={openSubscriptions} /></div>
      <div className="platform-studio__quick-grid">{studioNav.filter(([id]) => !['overview', 'preview', 'contacts', 'history'].includes(id)).map(([id, Icon, label]) => <button key={id} type="button" onClick={() => setStudioSection(id)}><span><Icon className="h-5 w-5" /></span><strong>{label}</strong><small>{language === 'ar' ? 'افتح مساحة التخصيص' : 'Open customization workspace'}</small><ArrowUpRight className="platform-studio__quick-arrow h-4 w-4" /></button>)}</div>
      <section className={`${card} p-4 sm:p-5`}><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><h2 className="font-black text-[var(--color-text)]">{language === 'ar' ? 'قوالب مقترحة لك' : 'Recommended templates'}</h2><p className="mt-1 text-xs text-[var(--color-text-secondary)]">{language === 'ar' ? 'عاين القالب وطبقه على المسودة مباشرة.' : 'Preview a template and apply it to your draft.'}</p></div><button type="button" onClick={() => setStudioSection('templates')} className="inline-flex items-center gap-1 text-xs font-black text-[var(--color-primary)]">{language === 'ar' ? 'المكتبة كاملة' : 'Full library'}<ArrowUpRight className="h-4 w-4" /></button></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{presets.slice(0, 4).map((entry) => { const locked = entry.tier === 'THEME_PRO' && !paid; const colors = entry.configuration.modes[mode].colors; return <button key={entry.id} type="button" onClick={() => locked ? openSubscriptions() : choosePreset(entry)} className={`theme-preset-card ${locked ? 'theme-preset-card--locked' : ''}`}><span className="theme-preset-card__scene" style={{ backgroundColor: colors.background, borderColor: colors.border }}><span className="theme-preset-card__panel" style={{ backgroundColor: colors.surface, borderColor: colors.border }}><span className="theme-preset-card__title" style={{ color: colors.text }}>Aa</span><span className="theme-preset-card__accent" style={{ backgroundColor: colors.primary }} /><span className="theme-preset-card__line" style={{ backgroundColor: colors.secondary }} /></span></span><span className="theme-preset-card__label"><span>{presetNames[language]?.[entry.id] || entry.id}</span>{locked ? <LockKeyhole className="h-4 w-4 text-amber-500" /> : null}</span><small className="studio-template-meta">{presetCategory(entry.id, language)} · {locked ? 'PRO' : language === 'ar' ? 'تطبيق فوري' : 'Apply instantly'}</small></button>; })}</div></section>
      {!paid && <div className="platform-studio__upgrade-banner"><span className="platform-studio__upgrade-orb"><Sparkles /></span><div><strong>{language === 'ar' ? 'أطلق الهوية الكاملة لمنصتك' : 'Unlock your platform’s full identity'}</strong><p>{language === 'ar' ? 'قوالب أكثر، تخصيص أعمق، ومعاينة متكاملة قبل النشر.' : 'More templates, richer controls, and a complete preview before publishing.'}</p></div><Link to="/admin/theme/subscriptions">{language === 'ar' ? 'استكشف الخطط' : 'Explore plans'}<ArrowUpRight className="h-4 w-4" /></Link></div>}
    </section>}
    {!previewOnly && activePage === 'preview' && <Section icon={Sparkles} title={language === 'ar' ? 'معاينة الموقع بالكامل' : 'Full website preview'}><p className="mb-4 text-sm text-[var(--color-text-secondary)]">{language === 'ar' ? 'واجهة تفاعلية ببيانات توضيحية، مستقلة عن حسابات وطلبات العملاء.' : 'Interactive sample interface isolated from customer accounts and live orders.'}</p><PlatformStudioPreview theme={draft} mode={mode} language={language} locked={!canPreviewPaid} onUpgrade={openSubscriptions} /></Section>}
    <div className="grid grid-cols-1 gap-5">
      <div id="theme-appearance" className={`space-y-5 scroll-mt-20 ${!previewOnly && !editingPage ? 'hidden' : ''}`}>
        {(previewOnly || activePage === 'colors' || activePage === 'templates') && <>
        <Section icon={Sparkles} title={`${t.presets} · ${t[mode]}`}><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{presets.map((entry) => {
          const locked = entry.tier === 'THEME_PRO' && !paid;
          const palette = entry.configuration.modes[mode].colors;
          const active = part.presetId === entry.id;
          return <button key={entry.id} type="button" aria-pressed={active} aria-disabled={locked}
            onClick={() => locked ? openSubscriptions() : choosePreset(entry)} className={`theme-preset-card ${active ? 'theme-preset-card--active' : ''} ${locked ? 'theme-preset-card--locked' : ''}`}>
            <span className="theme-preset-card__scene" style={{ backgroundColor: palette.background, borderColor: palette.border }}>
              <span className="theme-preset-card__panel" style={{ backgroundColor: palette.surface, borderColor: palette.border }}>
                <span className="theme-preset-card__title" style={{ color: palette.text }}>Aa</span>
                <span className="theme-preset-card__accent" style={{ backgroundColor: palette.primary }} />
                <span className="theme-preset-card__line" style={{ backgroundColor: palette.secondary }} />
              </span>
            </span>
            <span className="theme-preset-card__label"><span>{presetNames[language]?.[entry.id] || entry.id}</span>
              {locked ? <LockKeyhole className="h-4 w-4 text-amber-500" /> : entry.tier === 'THEME_PRO' ? <span className="theme-preset-card__pro">PRO</span> : null}
            </span>
            <small className="studio-template-meta">{presetCategory(entry.id, language)} · {locked ? (language === 'ar' ? 'مقفول · اعرض الخطط' : 'Locked · View plans') : (language === 'ar' ? 'معاينة وتطبيق فوري' : 'Preview and apply instantly')}</small>
          </button>;
        })}</div></Section>
        {(previewOnly || activePage === 'colors') && <Section icon={Palette} title={t.colors}><div className="grid gap-3 sm:grid-cols-2">{colorKeys.map((key) => <label key={key} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)]"><span>{t[key]}</span><span className="flex items-center gap-2"><small dir="ltr">{part.colors[key]}</small><input type="color" aria-label={t[key]} value={part.colors[key]} onChange={(event) => updatePart('colors', key, event.target.value)} /></span></label>)}</div></Section>}
        </>}
        {(previewOnly || ['typography', 'header', 'navigation'].includes(activePage)) && <>
        {(previewOnly || activePage === 'typography') && <Section icon={Palette} title={t.typography}><div className="grid gap-3 sm:grid-cols-2">{[['arabicFont', 'arabic'], ['englishFont', 'english']].map(([key, kind]) => <label key={key} className="text-sm text-[var(--color-text)]">{t[key]}<select className={`${input} mt-1`} value={part.typography[key]} onChange={(event) => updatePart('typography', key, event.target.value)}>{fonts[kind].map((font) => <option key={font} value={font} disabled={!paid && !freeFonts[kind].includes(font)}>{font}{!freeFonts[kind].includes(font) ? ' 🔒 Pro' : ''}</option>)}</select></label>)}</div><div className="mt-3 grid gap-3 sm:grid-cols-2"><Select label={t.baseSize} value={part.typography.baseSize} values={[14,16,18,20]} disabled={!paid} onChange={(value) => updatePart('typography','baseSize',Number(value))} suffix="px" /><Select label={t.headingWeight} value={part.typography.headingWeight} values={[600,700,800]} disabled={!paid} onChange={(value) => updatePart('typography','headingWeight',Number(value))} /></div></Section>}
        {(previewOnly || activePage === 'typography') && <Section icon={Palette} title={t.components} locked={!paid}><fieldset disabled={!paid} className="grid gap-3 sm:grid-cols-2 disabled:opacity-60"><Select label={t.buttonRadius} value={part.buttons.radius} values={[0,4,8,12,24]} suffix="px" onChange={(value) => updatePart('buttons','radius',Number(value))} /><Select label={t.buttonStyle} value={part.buttons.style} values={['solid','outline']} labels={t} onChange={(value) => updatePart('buttons','style',value)} /><Select label={t.cardRadius} value={part.cards.radius} values={[0,4,8,12,16,24]} suffix="px" onChange={(value) => updatePart('cards','radius',Number(value))} /><Select label={t.cardShadow} value={part.cards.shadow} values={['none','subtle','medium']} labels={t} onChange={(value) => updatePart('cards','shadow',value)} /><Select label={t.navigation} value={part.navigation.style} values={['standard','compact']} labels={t} onChange={(value) => updatePart('navigation','style',value)} /></fieldset></Section>}
        {(previewOnly || activePage === 'typography') && <Section icon={Sparkles} title={t.neonTitle} locked={!paid}>
          <p className="mb-4 text-xs text-[var(--color-text-secondary)]">{t.neonHint}</p>
          <div className="grid gap-3 sm:grid-cols-2">{neonSections.map((section) => {
            const effect = part.neon?.[section] || sampleNeon()[section];
            const label = section === 'categories' ? t.categoryDefault : t[`neon${section[0].toUpperCase()}${section.slice(1)}`];
            return <div key={section} className="rounded-xl border border-[var(--color-border)] p-3">
              <div className="mb-3 platform-neon-border px-3 py-2 text-center text-sm font-bold" style={{ '--platform-neon-color': effect.color, '--platform-neon-speed': `${effect.speed}s` }}>{label}</div>
              <label className="flex items-center justify-between gap-2 text-sm"><span>{t.neonEnabled}</span><input type="checkbox" checked={effect.enabled} disabled={!paid} onChange={(event) => updateNeon(section, { enabled: event.target.checked })} /></label>
              <label className="mt-3 flex items-center justify-between gap-2 text-sm"><span>{t.colors}</span><input type="color" value={effect.color} disabled={!paid} onChange={(event) => updateNeon(section, { color: event.target.value })} /></label>
              <div className="mt-3"><Select label={t.neonSpeed} value={effect.speed} values={[3, 5, 8, 12]} suffix="s" disabled={!paid} onChange={(value) => updateNeon(section, { speed: Number(value) })} /></div>
            </div>;
          })}</div>
          <div className="mt-5 border-t border-[var(--color-border)] pt-4">
            <h3 className="text-sm font-black">{t.neonCategories}</h3>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{t.categoryNeonHint}</p>
            {homepageCategories.length === 0 ? <p className="mt-3 text-sm text-[var(--color-text-secondary)]">{t.noHomepageCategories}</p> :
              <div className="mt-4 grid gap-4 sm:grid-cols-2">{homepageCategories.map((category) => {
                const effect = part.neon?.categoryCards?.[category.id] || part.neon?.categories || sampleNeon().categories;
                return <div key={category.id} className="rounded-xl border border-[var(--color-border)] p-3">
                  <div className={`mx-auto mb-3 max-w-44 ${effect.enabled ? 'platform-neon-border' : ''}`} style={effect.enabled ? { '--platform-neon-color': effect.color, '--platform-neon-speed': `${effect.speed}s` } : undefined}>
                    <CategoryCard category={category} index={0} active={false} onSelect={() => {}} />
                  </div>
                  <p className="mb-3 text-center text-sm font-bold">{category.title}</p>
                  <label className="flex items-center justify-between gap-2 text-sm"><span>{t.neonEnabled}</span><input type="checkbox" checked={effect.enabled} disabled={!paid} onChange={(event) => updateCategoryNeon(category.id, { enabled: event.target.checked })} /></label>
                  <label className="mt-3 flex items-center justify-between gap-2 text-sm"><span>{t.colors}</span><input type="color" value={effect.color} disabled={!paid} onChange={(event) => updateCategoryNeon(category.id, { color: event.target.value })} /></label>
                  <div className="mt-3"><Select label={t.neonSpeed} value={effect.speed} values={[3, 5, 8, 12]} suffix="s" disabled={!paid} onChange={(value) => updateCategoryNeon(category.id, { speed: Number(value) })} /></div>
                </div>;
              })}</div>}
          </div>
        </Section>}
        {(previewOnly || ['header', 'navigation'].includes(activePage)) && <Section icon={Palette} title={activePage === 'header' ? (language === 'ar' ? 'تصميم الهيدر · ULTRA' : 'Header studio · ULTRA') : (language === 'ar' ? 'تصميم النافبار السفلي · ULTRA' : 'Bottom navigation studio · ULTRA')} locked={!canPreviewUltra}>
          <p className="mb-4 text-sm text-[var(--color-text-secondary)]">{language === 'ar' ? 'اختر قالبًا، ثم اضبط أبعاده وألوانه. التغييرات تظهر مباشرة في المعاينة الآمنة.' : 'Choose a layout and adjust its dimensions and colors. Changes appear immediately in the safe preview.'}</p>
          {['header', 'bottomNav'].filter((section) => previewOnly || (activePage === 'header' ? section === 'header' : section === 'bottomNav')).map((section) => {
            const value = draft.chrome?.[section] || sampleTheme.chrome[section];
            const headerPart = section === 'header';
            return <fieldset key={section} disabled={!canPreviewUltra} className="mb-4 grid gap-3 rounded-xl border border-[var(--color-border)] p-3 disabled:opacity-55">
              <strong>{headerPart ? (language === 'ar' ? 'الهيدر العلوي' : 'Top header') : (language === 'ar' ? 'النافبار السفلي' : 'Bottom navigation')}</strong>
              <div className="grid gap-2 sm:grid-cols-3">{(headerPart ? headerLooks : bottomNavLooks).map((look) => <button key={look.name} type="button" onClick={() => updateChrome(section, look.config)} className={`studio-look-card ${value.template === look.config.template && value.background === look.config.background ? 'is-selected' : ''}`}><span style={{ background: look.config.background, color: look.config.accent, borderRadius: look.config.template === 'pill' ? 999 : look.config.radius }}>{look.config.template === 'bar' ? '━━━━' : '◜━━◝'}</span><strong>{language === 'ar' ? look.ar : look.name}</strong><small>{look.config.template === 'bar' ? (language === 'ar' ? 'حافة كاملة' : 'Full width') : look.config.template === 'pill' ? (language === 'ar' ? 'كبسولة عائمة' : 'Floating pill') : (language === 'ar' ? 'عائم منحني' : 'Curved floating')}</small></button>)}</div>
              <label className="text-sm">{language === 'ar' ? 'القالب' : 'Template'}
                <select className={`${input} mt-1`} value={value.template} onChange={(event) => updateChrome(section, { template: event.target.value })}>
                  {(headerPart ? [['bar', language === 'ar' ? 'مستطيل ملاصق للأعلى' : 'Rectangular, flush to top'], ['floating', language === 'ar' ? 'منحني عائم' : 'Curved floating']] : [['bar', language === 'ar' ? 'مستطيل' : 'Bar'], ['floating', language === 'ar' ? 'عائم' : 'Floating'], ['pill', language === 'ar' ? 'كبسولة' : 'Pill']]).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                </select>
              </label>
              <label className="text-sm">{language === 'ar' ? 'الارتفاع' : 'Height'}: {value.height}px<input type="range" className="mt-1 w-full" min={headerPart ? 48 : 48} max={headerPart ? 120 : 100} value={value.height} onChange={(event) => updateChrome(section, { height: Number(event.target.value) })} /></label>
              <label className="text-sm">{language === 'ar' ? 'العرض' : 'Width'}: {value.width}%<input type="range" className="mt-1 w-full" min="60" max="100" value={value.width} onChange={(event) => updateChrome(section, { width: Number(event.target.value) })} /></label>
              <label className="text-sm">{language === 'ar' ? 'استدارة الحواف' : 'Corner radius'}: {value.radius}px<input type="range" className="mt-1 w-full" min="0" max="32" step="4" value={value.radius} onChange={(event) => updateChrome(section, { radius: Number(event.target.value) })} /></label>
              <div className="grid grid-cols-3 gap-2">{[['background', language === 'ar' ? 'الخلفية' : 'Background'], ['foreground', language === 'ar' ? 'النص' : 'Text'], ['accent', language === 'ar' ? 'التمييز' : 'Accent']].map(([key, label]) => <label key={key} className="text-xs">{label}<input type="color" className="mt-1 h-10 w-full" value={value[key]} onChange={(event) => updateChrome(section, { [key]: event.target.value.toUpperCase() })} /></label>)}</div>
            </fieldset>;
          })}
          {!ultra && <Link to="/admin/theme/subscriptions" className="mt-3 inline-flex items-center gap-2 font-bold text-amber-600">{language === 'ar' ? '🔒 استكشف ULTRA لفتح التعديل' : '🔒 Explore ULTRA to unlock editing'}<ArrowUpRight className="h-4 w-4" /></Link>}
        </Section>}
        </>}
        {(previewOnly || ['branding', 'sidebar'].includes(activePage)) && <>
        {['branding', 'preview'].includes(activePage) || previewOnly ? <Section icon={ImagePlus} title={t.branding} locked={!paid}><p className="mb-3 text-xs text-[var(--color-text-secondary)]">{t.imageHint}</p><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-xl border border-[var(--color-border)] p-3"><p className="mb-2 text-sm font-bold">{t.logo}</p>{draft.brand.logoPath && <div className="mb-2 flex h-28 items-center overflow-auto rounded-lg bg-[var(--color-surface)] p-2"><img src={resolveImageUrl(draft.brand.logoPath)} alt="" className="max-h-full shrink-0 object-contain" style={{ width: draft.brand.logoWidth }} /></div>}<label className={button}>{t.upload}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={!paid || busy} onChange={(event) => { upload(event.target.files?.[0]); event.target.value = ''; }} /></label>{draft.brand.logoPath && <button type="button" className={`${button} ms-2`} disabled={!paid} onClick={() => updateBrand({ logoPath: null })}>{t.remove}</button>}<label className="mt-3 block text-xs">{t.logoWidth}: {draft.brand.logoWidth}px<input type="range" min="80" max="300" step="4" className="mt-2 w-full" disabled={!paid} value={draft.brand.logoWidth} onChange={(event) => updateBrand({ logoWidth: Number(event.target.value) })} /></label></div><div className="rounded-xl border border-[var(--color-border)] p-3"><p className="mb-2 text-sm font-bold">{t.slides}</p><div className="grid grid-cols-2 gap-2">{draft.brand.slides.map((path, index) => <div key={index} className="rounded-lg border border-[var(--color-border)] p-2 text-center text-xs"><div className="mb-2 flex aspect-video items-center justify-center overflow-hidden bg-[var(--color-surface)]">{path ? <img src={resolveImageUrl(path)} alt="" className="h-full w-full object-cover" /> : `${index + 1}`}</div><label className={button}>{t.upload}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={!paid || busy} onChange={(event) => { upload(event.target.files?.[0], index); event.target.value = ''; }} /></label>{path && <button type="button" className="mt-1 block w-full text-rose-500" disabled={!paid} onClick={() => updateBrand({ slides: draft.brand.slides.map((old, slot) => slot === index ? null : old) })}>{t.remove}</button>}</div>)}</div></div></div></Section> : null}
        {['branding', 'preview'].includes(activePage) || previewOnly ? <Section icon={ImagePlus} title={t.targetBanner} locked={!paid}>
          <p className="mb-3 text-xs text-[var(--color-text-secondary)]">{t.imageHint}</p>
          <div className="rounded-xl border border-[var(--color-border)] p-3">
            <div className="mb-3 flex aspect-[5/1] items-center justify-center overflow-hidden rounded-lg bg-[var(--color-surface)]">
              {draft.brand.targetBannerPath ? <img src={resolveImageUrl(draft.brand.targetBannerPath)} alt="" className="h-full w-full object-cover" /> : <span className="text-xs text-[var(--color-text-secondary)]">{t.targetBanner}</span>}
            </div>
            <label className={button}>{t.upload}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={!paid || busy} onChange={(event) => { upload(event.target.files?.[0], 'targetBanner'); event.target.value = ''; }} /></label>
            {draft.brand.targetBannerPath && <button type="button" className={`${button} ms-2`} disabled={!paid} onClick={() => updateBrand({ targetBannerPath: null })}>{t.remove}</button>}
          </div>
        </Section> : null}
        {['branding', 'preview'].includes(activePage) || previewOnly ? <Section icon={Sparkles} title={t.animatedArabic} locked={!paid}>
          <p className="mb-3 text-xs text-[var(--color-text-secondary)]">{t.animatedArabicHint}</p>
          <textarea className={`${input} min-h-24 resize-y`} dir="rtl" lang="ar" maxLength={240}
            value={draft.brand.marqueeTextArabic ?? DEFAULT_MARQUEE_AR}
            disabled={!paid || busy}
            onChange={(event) => updateBrand({ marqueeTextArabic: event.target.value })} />
        </Section> : null}
        {['sidebar', 'preview'].includes(activePage) || previewOnly ? <Section icon={Palette} title={t.sidebarTemplate} locked={!canPreviewUltra}>
          <p className="mb-4 text-sm text-[var(--color-text-secondary)]">{t.sidebarTemplateHint}</p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">{[['default', t.sidebarDefault], ['royal', t.sidebarRoyal], ['glass', t.sidebarGlass], ['aurora', t.sidebarAurora], ['square', t.sidebarSquare], ['rounded', t.sidebarRounded]].map(([value, label]) => {
            const locked = !canPreviewUltra && value !== 'default';
            return <button key={value} type="button" aria-pressed={draft.brand.sidebarTemplate === value} disabled={locked} onClick={() => updateBrand({ sidebarTemplate: value })} className={`theme-sidebar-template-card ${draft.brand.sidebarTemplate === value ? 'theme-sidebar-template-card--active' : ''} ${locked ? 'theme-sidebar-template-card--locked' : ''}`}>
              <span style={previewStyle} className={`ka-sidebar-panel ka-sidebar-template-${value} theme-sidebar-template-preview border`} aria-hidden="true">
                <span className="theme-sidebar-template-preview__brand">{t.sidebarPreviewBrand}</span>
                <span className="theme-sidebar-template-preview__account"><i />{t.sidebarPreviewAccount}</span>
                <span className="theme-sidebar-template-preview__nav"><i />{t.sidebarPreviewItem}</span>
                <span className="theme-sidebar-template-preview__nav theme-sidebar-template-preview__nav--muted"><i />{t.history}</span>
              </span>
              <span className="theme-sidebar-template-label"><span>{label}</span>{locked ? <LockKeyhole className="h-4 w-4 text-amber-500" /> : value !== 'default' ? <span className="theme-preset-card__pro">ULTRA</span> : null}</span>
            </button>;
          })}</div>
          <fieldset disabled={!canPreviewUltra} className="mt-4 grid gap-3 rounded-xl border border-[var(--color-border)] p-3 disabled:opacity-55">
            <strong>{language === 'ar' ? 'أبعاد السايدبار' : 'Sidebar dimensions'}</strong>
            <label className="text-sm">{language === 'ar' ? 'العرض' : 'Width'}: {(draft.brand.sidebarMetrics || sampleTheme.brand.sidebarMetrics).width}px<input type="range" className="mt-1 w-full" min="220" max="360" step="10" value={(draft.brand.sidebarMetrics || sampleTheme.brand.sidebarMetrics).width} onChange={(event) => updateSidebarMetrics({ width: Number(event.target.value) })} /></label>
            <label className="text-sm">{language === 'ar' ? 'الارتفاع' : 'Height'}: {(draft.brand.sidebarMetrics || sampleTheme.brand.sidebarMetrics).height}%<input type="range" className="mt-1 w-full" min="70" max="100" step="5" value={(draft.brand.sidebarMetrics || sampleTheme.brand.sidebarMetrics).height} onChange={(event) => updateSidebarMetrics({ height: Number(event.target.value) })} /></label>
            <label className="text-sm">{language === 'ar' ? 'استدارة الحواف' : 'Corner radius'}: {(draft.brand.sidebarMetrics || sampleTheme.brand.sidebarMetrics).radius}px<input type="range" className="mt-1 w-full" min="0" max="48" step="4" value={(draft.brand.sidebarMetrics || sampleTheme.brand.sidebarMetrics).radius} onChange={(event) => updateSidebarMetrics({ radius: Number(event.target.value) })} /></label>
          </fieldset>
          {!canPreviewUltra && <p className="mt-3 text-xs text-amber-600">{t.ultraLocked}</p>}
          {!canPreviewUltra && <Link to="/admin/theme/subscriptions" className="mt-4 inline-flex items-center gap-2 font-bold text-amber-600">{language === 'ar' ? 'استكشف خطة ULTRA' : 'Explore the ULTRA plan'}<ArrowUpRight className="h-4 w-4" /></Link>}
        </Section> : null}
        </>}
      </div>
      {!previewOnly && editingPage && <div className="platform-studio__savebar">{!paid && needsPro && <div className="platform-studio__locked-note"><LockKeyhole className="h-4 w-4" />{t.freeLocked}<Link to="/admin/theme/subscriptions">{language === 'ar' ? 'عرض الخطط' : 'View plans'}<ArrowUpRight className="h-3.5 w-3.5" /></Link></div>}<div className="flex flex-col gap-2 sm:flex-row"><button type="button" className={`${button} w-full sm:w-auto`} disabled={busy || !settings} onClick={() => run(() => apiClient.platformTheme.saveDraft(draft), t.saved, true)}><Save className="h-4 w-4" />{t.save}</button><button type="button" className={`${button} w-full sm:w-auto`} disabled={busy || !settings} onClick={() => run(() => apiClient.platformTheme.resetDraft(), t.resetDone)}><RotateCcw className="h-4 w-4" />{t.reset}</button><button type="button" className={`${button} w-full border-[var(--color-primary)] bg-[var(--color-primary)] text-white sm:w-auto`} disabled={busy || !settings?.eligibility?.canPublish || (!paid && needsPro)} onClick={() => run(() => apiClient.platformTheme.publish(draft), t.published)}><Check className="h-4 w-4" />{t.publish}</button></div></div>}
      <div className="space-y-5">
        {!previewOnly && activePage === 'history' && <div id="theme-history" className="scroll-mt-20"><Section icon={History} title={t.history}><div className="space-y-2">{history.length ? history.map((item) => <div key={item._id} className="flex items-center justify-between gap-2 rounded-xl bg-[var(--color-surface)] p-3 text-sm"><span>#{item.version} · {dateText(item.publishedAt, language)}</span><button type="button" className={button} disabled={busy || !settings?.eligibility?.canPublish} onClick={() => run(() => apiClient.platformTheme.restore(item.version), t.published)}>{t.restore}</button></div>) : t.empty}</div></Section></div>}
        {!previewOnly && activePage === 'contacts' && <div id="theme-contacts" className="scroll-mt-20"><Section icon={MessageCircle} title={t.contactsPage}>
          {!ultra ? <div className="rounded-2xl border border-amber-400/40 bg-gradient-to-br from-amber-500/10 via-transparent to-orange-500/10 p-5 sm:p-6">
            <div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-400/15 text-amber-500"><LockKeyhole className="h-5 w-5" /></span><div><span className="inline-flex items-center rounded-full bg-amber-400/15 px-2.5 py-1 text-[0.68rem] font-black tracking-wide text-amber-600">ULTRA</span><h3 className="mt-2 font-black text-[var(--color-text)]">{t.contactsLockedTitle}</h3><p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{t.contactsHint}</p></div></div>
            <Link to="/admin/themes#theme-subscription" className={`${button} mt-5 w-full justify-center border-amber-400/50 bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-950 sm:w-auto`}><Sparkles className="h-4 w-4" />{t.contactsSubscriptionCta}<ArrowUpRight className="h-4 w-4" /></Link>
          </div> : <>
            <div className="mb-4 flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600"><MessageCircle className="h-4 w-4" /></span><div><h3 className="font-black text-[var(--color-text)]">{language === 'ar' ? 'أرقام التواصل العامة' : 'Public contact numbers'}</h3><p className="text-xs text-[var(--color-text-secondary)]">{language === 'ar' ? 'تظهر هذه الأرقام للعملاء في صفحات التواصل والدعم.' : 'Customers see these numbers on contact and support pages.'}</p></div><span className="ms-auto rounded-full bg-amber-400/15 px-2.5 py-1 text-[0.68rem] font-black text-amber-600">ULTRA</span></div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm font-bold">{t.ownerWhatsApp}<input className={`${input} mt-1`} dir="ltr" inputMode="tel" autoComplete="tel" placeholder="+201012345678" aria-invalid={Boolean(contactsErrors.owner)} aria-describedby={contactsErrors.owner ? 'theme-owner-phone-error' : 'theme-phone-format'} value={supportContacts.owner} disabled={savingContacts} onChange={(event) => { contactsDirty.current = true; setSupportContacts((current) => ({ ...current, owner: event.target.value })); setContactsErrors((current) => ({ ...current, owner: '' })); }} />{contactsErrors.owner && <span id="theme-owner-phone-error" className="mt-1 block text-xs font-semibold text-rose-600" role="alert">{contactsErrors.owner}</span>}</label>
              <label className="text-sm font-bold">{t.supportWhatsApp}<input className={`${input} mt-1`} dir="ltr" inputMode="tel" autoComplete="tel" placeholder="+201556537530" aria-invalid={Boolean(contactsErrors.support)} aria-describedby={contactsErrors.support ? 'theme-support-phone-error' : 'theme-phone-format'} value={supportContacts.support} disabled={savingContacts} onChange={(event) => { contactsDirty.current = true; setSupportContacts((current) => ({ ...current, support: event.target.value })); setContactsErrors((current) => ({ ...current, support: '' })); }} />{contactsErrors.support && <span id="theme-support-phone-error" className="mt-1 block text-xs font-semibold text-rose-600" role="alert">{contactsErrors.support}</span>}</label>
            </div>
            <p id="theme-phone-format" className="mt-2 text-xs text-[var(--color-text-secondary)]">{t.phoneFormatHint}</p>
            <div className="my-5 border-t border-[var(--color-border)]" />
            <div className="mb-3 flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-sky-500/10 text-sky-600"><LockKeyhole className="h-4 w-4" /></span><div><h3 className="font-black text-[var(--color-text)]">{t.serverWhatsApp}</h3><p className="text-xs text-[var(--color-text-secondary)]">{t.serverWhatsAppHint}</p></div><span className="ms-auto rounded-full border border-sky-500/25 px-2.5 py-1 text-[0.68rem] font-bold text-sky-600">{language === 'ar' ? 'خاص بالإدارة' : 'Private'}</span></div>
            <label className="block text-sm font-bold">{t.serverWhatsApp}<input className={`${input} mt-1`} dir="ltr" inputMode="tel" autoComplete="tel" placeholder="+201012345678" aria-invalid={Boolean(contactsErrors.notification)} aria-describedby={contactsErrors.notification ? 'theme-notification-phone-error' : 'theme-phone-format'} value={adminNotificationWhatsApp} disabled={savingContacts} onChange={(event) => { contactsDirty.current = true; setAdminNotificationWhatsApp(event.target.value); setContactsErrors((current) => ({ ...current, notification: '' })); }} />{contactsErrors.notification && <span id="theme-notification-phone-error" className="mt-1 block text-xs font-semibold text-rose-600" role="alert">{contactsErrors.notification}</span>}</label>
            <p className="mt-4 text-xs leading-5 text-[var(--color-text-secondary)]">{t.contactsHint}</p>
            <button type="button" className={`${button} mt-4 w-full border-[var(--color-primary)] bg-[var(--color-primary)] text-white sm:w-auto`} disabled={savingContacts} onClick={saveContacts}>{savingContacts ? t.saving : t.saveContacts}</button>
          </>}
        </Section></div>}
      </div>
    </div>
  </main>;
}
