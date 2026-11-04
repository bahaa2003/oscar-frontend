import React, { useMemo, useState } from 'react';
import {
  ArrowLeft, Bell, ChevronDown, CreditCard, Gamepad2, Home, Menu, Search,
  ShoppingBag, ShoppingCart, Smartphone, Sparkles, UserRound, Wallet, X,
} from 'lucide-react';
import { getThemeChrome, platformThemeStyles } from '../../theme/platformTheme';
import { resolveImageUrl } from '../../utils/imageUrl';

const previewCopy = {
  ar: {
    desktop: 'كمبيوتر', tablet: 'تابلت', mobile: 'موبايل', draft: 'معاينة حية للمسودة',
    home: 'الرئيسية', categories: 'الأقسام الرئيسية', games: 'الألعاب', apps: 'التطبيقات', cards: 'بطاقات رقمية',
    products: 'الأكثر طلبًا', all: 'عرض الكل', buy: 'اشتر الآن', search: 'ابحث عن منتج أو خدمة',
    account: 'حسابي', balance: 'رصيدي', orders: 'طلباتي', support: 'الدعم', heroTitle: 'كل خدماتك الرقمية في مكان واحد',
    heroText: 'اختر خدمتك المفضلة واستمتع بتجربة شراء سريعة وآمنة.', explore: 'اكتشف المنتجات', featured: 'عروض مميزة',
  },
  en: {
    desktop: 'Desktop', tablet: 'Tablet', mobile: 'Mobile', draft: 'Live draft preview',
    home: 'Home', categories: 'Main categories', games: 'Games', apps: 'Apps', cards: 'Digital cards',
    products: 'Popular products', all: 'View all', buy: 'Buy now', search: 'Search products and services',
    account: 'Account', balance: 'Wallet', orders: 'My orders', support: 'Support', heroTitle: 'Your digital services in one place',
    heroText: 'Choose a service and enjoy a fast, simple checkout.', explore: 'Explore products', featured: 'Featured offers',
  },
};

const categories = [
  { name: { ar: 'شحن الألعاب', en: 'Game top-ups' }, icon: Gamepad2 },
  { name: { ar: 'التطبيقات', en: 'Applications' }, icon: Smartphone },
  { name: { ar: 'البطاقات الرقمية', en: 'Digital cards' }, icon: CreditCard },
  { name: { ar: 'خدمات مميزة', en: 'Premium services' }, icon: Sparkles },
];

const sampleProducts = [
  { name: { ar: 'شدات ببجي موبايل', en: 'PUBG Mobile UC' }, detail: { ar: 'شحن فوري وآمن', en: 'Fast and secure top-up' }, price: '١٢٥ ج.م', icon: Gamepad2, color: '#8B5CF6' },
  { name: { ar: 'بطاقة Google Play', en: 'Google Play card' }, detail: { ar: 'تسليم خلال دقائق', en: 'Delivered in minutes' }, price: '٢٥٠ ج.م', icon: Smartphone, color: '#10B981' },
  { name: { ar: 'بطاقة Apple', en: 'Apple gift card' }, detail: { ar: 'متاحة لعدة دول', en: 'Available in many regions' }, price: '٣٢٠ ج.م', icon: CreditCard, color: '#F59E0B' },
  { name: { ar: 'اشتراك ترفيهي', en: 'Entertainment plan' }, detail: { ar: 'اشتراك لمدة شهر', en: 'One month subscription' }, price: '١٨٠ ج.م', icon: ShoppingBag, color: '#EC4899' },
  { name: { ar: 'كوينز التطبيقات', en: 'App coins' }, detail: { ar: 'اختر الكمية المناسبة', en: 'Choose your preferred amount' }, price: '٩٥ ج.م', icon: Sparkles, color: '#06B6D4' },
  { name: { ar: 'بطاقة ألعاب رقمية', en: 'Digital game card' }, detail: { ar: 'كود رقمي مضمون', en: 'Guaranteed digital code' }, price: '٤٠٠ ج.م', icon: Gamepad2, color: '#F97316' },
];

export default function StorefrontThemePreview({ configuration, mode = 'light', language = 'ar' }) {
  const [viewport, setViewport] = useState('desktop');
  const [category, setCategory] = useState(0);
  const [activeNav, setActiveNav] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isArabic = language === 'ar';
  const t = previewCopy[isArabic ? 'ar' : 'en'];
  const appearance = configuration?.modes?.[mode] || {};
  const colors = appearance.colors || {};
  const header = getThemeChrome(configuration, 'header', mode) || {};
  const bottomNav = getThemeChrome(configuration, 'bottomNav', mode) || {};
  const sidebar = configuration?.brand?.sidebarTemplate || 'default';
  const sidebarMetrics = configuration?.brand?.sidebarMetrics || { width: 260, height: 100, radius: 24 };
  const layout = configuration?.layout || {};
  const slides = Array.isArray(configuration?.brand?.slides) ? configuration.brand.slides.filter(Boolean) : [];
  const banner = configuration?.brand?.targetBannerPath || slides[0] || null;
  const logo = configuration?.brand?.logoPath || null;
  const font = isArabic ? appearance.typography?.arabicFont : appearance.typography?.englishFont;
  const themeStyle = useMemo(() => platformThemeStyles(configuration, mode), [configuration, mode]);
  const productColumns = [2, 3, 4].includes(layout.productsPerRow) ? layout.productsPerRow : 4;
  const neon = appearance.neon || {};
  const productItems = category ? sampleProducts.filter((_, index) => index % categories.length === (category - 1) % categories.length) : sampleProducts;
  const mobileTabs = [t.orders, isArabic ? 'إضافة رصيد' : 'Add funds', t.home, t.account, isArabic ? 'بحث' : 'Search'];
  const tabIcons = [ShoppingBag, Wallet, Home, UserRound, Search];
  const headerStyle = {
    height: `${header.height || 66}px`, width: `${header.width || 100}%`, marginInline: 'auto',
    background: header.background || colors.surface || '#fff', color: header.foreground || colors.text || '#111827',
    borderRadius: header.template === 'bar' ? 0 : `${header.radius ?? 22}px`,
  };
  const bottomStyle = {
    height: `${bottomNav.height || 66}px`, width: `${bottomNav.width || 100}%`,
    background: bottomNav.background || colors.surface || '#fff', color: bottomNav.foreground || colors.text || '#111827',
    borderRadius: bottomNav.template === 'bar' ? 0 : `${bottomNav.radius ?? 24}px`,
  };
  const previewWidth = viewport === 'mobile' ? '390px' : viewport === 'tablet' ? '768px' : '100%';
  const neonStyle = (name) => neon[name]?.enabled
    ? { '--storefront-neon-color': neon[name].color, '--storefront-neon-speed': `${neon[name].speed || 5}s` }
    : undefined;

  return <section className="storefront-theme-preview" dir={isArabic ? 'rtl' : 'ltr'}>
    <div className="storefront-theme-preview__toolbar">
      <span className="storefront-theme-preview__draft"><i />{t.draft} · {mode === 'dark' ? (isArabic ? 'الوضع الغامق' : 'Dark mode') : (isArabic ? 'الوضع الفاتح' : 'Light mode')}</span>
      <div className="storefront-theme-preview__devices" role="group" aria-label={isArabic ? 'حجم المعاينة' : 'Preview size'}>
        {['desktop', 'tablet', 'mobile'].map((size) => <button key={size} type="button" aria-pressed={viewport === size} onClick={() => setViewport(size)}>{t[size]}</button>)}
      </div>
    </div>
    <div className="storefront-theme-preview__canvas">
      <div className={`storefront-theme-preview__site storefront-theme-preview__site--${viewport} ${mode === 'dark' ? 'is-dark' : ''}`} style={{ ...themeStyle, width: previewWidth, fontFamily: font ? `"${font}", sans-serif` : undefined }}>
        <header className={`storefront-theme-preview__header storefront-theme-preview__header--${header.template || 'bar'}`} style={headerStyle}>
          <button type="button" className="storefront-theme-preview__round-icon" onClick={() => setMobileMenuOpen((open) => !open)} aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}>{mobileMenuOpen ? <X /> : <Menu />}</button>
          <div className="storefront-theme-preview__brand">
            {logo ? <img src={resolveImageUrl(logo)} alt="" style={{ width: `${configuration?.brand?.logoWidth || 144}px` }} /> : <><span className="storefront-theme-preview__brand-mark">O</span><span><b>OSCAR</b><small>STORE</small></span></>}
          </div>
          <div className="storefront-theme-preview__search"><Search /><span>{t.search}</span><kbd>⌘ K</kbd></div>
          <button type="button" className="storefront-theme-preview__round-icon" aria-label={t.support}><Bell /></button>
          <button type="button" className="storefront-theme-preview__account"><UserRound /><span>{t.account}</span><ChevronDown /></button>
        </header>

        {banner ? <div className={`storefront-theme-preview__hero-image ${neon.hero?.enabled ? 'has-neon' : ''}`} style={neonStyle('hero')}>
          <img src={resolveImageUrl(banner)} alt="" />
          <div className="storefront-theme-preview__hero-overlay"><span>{isArabic ? 'اكتشف الجديد' : 'Discover what’s new'}</span><h1>{t.heroTitle}</h1><p>{t.heroText}</p><button type="button">{t.explore}<ArrowLeft /></button></div>
        </div> : <section className={`storefront-theme-preview__hero ${neon.hero?.enabled ? 'has-neon' : ''}`} style={{ ...neonStyle('hero'), background: `radial-gradient(circle at 10% 10%, ${colors.accent || '#F59E0B'}44, transparent 36%), linear-gradient(125deg, ${colors.primary || '#2563EB'}, ${colors.secondary || '#7C3AED'})` }}>
          <div className="storefront-theme-preview__hero-copy"><span>{isArabic ? 'متجرك الرقمي المفضل' : 'Your favorite digital store'}</span><h1>{t.heroTitle}</h1><p>{t.heroText}</p><button type="button">{t.explore}<ArrowLeft /></button></div>
          <div className="storefront-theme-preview__hero-art"><div className="storefront-theme-preview__hero-orb"><ShoppingBag /></div><span className="storefront-theme-preview__hero-float storefront-theme-preview__hero-float--one"><Gamepad2 /></span><span className="storefront-theme-preview__hero-float storefront-theme-preview__hero-float--two"><CreditCard /></span><b>OSCAR <small>STORE</small></b></div>
        </section>}

        <div className="storefront-theme-preview__body">
          {viewport !== 'mobile' && <aside className={`storefront-theme-preview__sidebar ka-sidebar-panel ka-sidebar-template-${sidebar}`} style={{ width: `${Math.min(sidebarMetrics.width || 260, viewport === 'tablet' ? 220 : 310)}px`, height: `${sidebarMetrics.height || 100}%`, borderRadius: `${sidebarMetrics.radius ?? 24}px` }}>
            <div className="storefront-theme-preview__sidebar-title"><span className="storefront-theme-preview__avatar"><UserRound /></span><span><b>{t.account}</b><small>{isArabic ? 'مرحبًا بك في أوسكار' : 'Welcome to OSCAR'}</small></span></div>
            {[t.home, t.products, t.balance, t.orders, t.support].map((item, index) => {
              const Icon = [Home, ShoppingBag, Wallet, CreditCard, Bell][index];
              return <button type="button" key={item} className={`storefront-theme-preview__sidebar-link ${activeNav === index ? 'is-active' : ''}`} onClick={() => setActiveNav(index)}><Icon /><span>{item}</span>{index === 2 && <small>EGP</small>}</button>;
            })}
            <div className="storefront-theme-preview__sidebar-foot"><i />{isArabic ? 'متاح الآن' : 'Online now'}</div>
          </aside>}

          <main className="storefront-theme-preview__main">
            <div className="storefront-theme-preview__welcome"><div><span>{isArabic ? 'أهلاً بك في أوسكار' : 'Welcome to OSCAR'}</span><h2>{t.categories}</h2></div><button type="button" className="storefront-theme-preview__wallet"><Wallet />{isArabic ? 'رصيدك' : 'Wallet'} <b>١٬٢٥٠ ج.م</b></button></div>
            <div className="storefront-theme-preview__categories" style={{ gridTemplateColumns: `repeat(${Math.max(2, Math.min(layout.categoriesPerRow || 4, viewport === 'mobile' ? 2 : 4))}, minmax(0,1fr))` }}>
              {categories.map(({ name, icon: Icon }, index) => <button type="button" key={name.en} onClick={() => setCategory(category === index + 1 ? 0 : index + 1)} className={`storefront-theme-preview__category ${category === index + 1 ? 'is-active' : ''} ${neon.categories?.enabled ? 'has-neon' : ''}`} style={neonStyle('categories')}><span><Icon /></span><b>{name[isArabic ? 'ar' : 'en']}</b><small>{isArabic ? 'اكتشف المزيد' : 'Explore'}</small></button>)}
            </div>
            <div className="storefront-theme-preview__section-heading"><div><span>{t.featured}</span><h2>{category ? categories[category - 1].name[isArabic ? 'ar' : 'en'] : t.products}</h2></div><button type="button" onClick={() => setCategory(0)}>{t.all}<ArrowLeft /></button></div>
            <div className={`storefront-theme-preview__products storefront-theme-preview__products--${viewport}`} style={{ '--preview-product-columns': productColumns }}>
              {productItems.map((product, index) => {
                const Icon = product.icon;
                const neonEnabled = neon.bestSellers?.enabled || neon.purchase?.enabled;
                const effect = neon.purchase?.enabled ? neon.purchase : neon.bestSellers;
                return <article key={product.name.en} className={`storefront-theme-preview__product ${neonEnabled ? 'has-neon' : ''}`} style={{ '--product-accent': product.color, '--storefront-neon-color': effect?.color || colors.primary, '--storefront-neon-speed': `${effect?.speed || 5}s`, borderRadius: `${appearance.cards?.radius ?? 18}px` }}>
                  <div className="storefront-theme-preview__product-art" style={{ background: `linear-gradient(140deg, ${product.color}2c, ${colors.surface || '#fff'})` }}><span><Icon /></span><small>{index === 0 ? (isArabic ? 'الأكثر مبيعًا' : 'Best seller') : (isArabic ? 'متوفر' : 'Available')}</small></div>
                  <div className="storefront-theme-preview__product-info"><h3>{product.name[isArabic ? 'ar' : 'en']}</h3><p>{product.detail[isArabic ? 'ar' : 'en']}</p><div><b>{product.price}</b><button type="button" className={`storefront-theme-preview__buy ${neon.purchase?.enabled ? 'has-neon' : ''}`} style={{ borderRadius: `${appearance.buttons?.radius ?? 10}px`, '--storefront-neon-color': neon.purchase?.color || colors.primary, '--storefront-neon-speed': `${neon.purchase?.speed || 5}s` }}><ShoppingCart />{t.buy}</button></div></div>
                </article>;
              })}
            </div>
            <div className="storefront-theme-preview__marquee"><Sparkles /><span>{configuration?.brand?.marqueeTextArabic || (isArabic ? 'تسوق بسهولة وأمان مع أوسكار ستور' : 'Shop easily and safely with OSCAR STORE')}</span><Sparkles /></div>
          </main>
        </div>
        {viewport === 'mobile' && <nav className={`storefront-theme-preview__bottom-nav storefront-theme-preview__bottom-nav--${bottomNav.template || 'bar'}`} style={bottomStyle}>{mobileTabs.map((item, index) => { const Icon = tabIcons[index]; return <button type="button" key={item} className={activeNav === index ? 'is-active' : ''} onClick={() => setActiveNav(index)}><Icon /><span>{item}</span></button>; })}</nav>}
        {viewport === 'mobile' && mobileMenuOpen && <div className="storefront-theme-preview__mobile-drawer"><button type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Close"><X /></button>{[t.home, t.categories, t.products, t.balance].map((item) => <span key={item}>{item}</span>)}</div>}
      </div>
    </div>
  </section>;
}
