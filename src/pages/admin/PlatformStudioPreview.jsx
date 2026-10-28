import React, { useMemo, useState } from 'react';
import { Activity, Bell, ChevronLeft, CircleUserRound, ClipboardList, CreditCard, Home, LayoutDashboard, Menu, PlusCircle, Search, ShoppingBag, Wallet } from 'lucide-react';
import { platformThemeStyles } from '../../theme/platformTheme';

const labels = {
  ar: { desktop: 'كمبيوتر', tablet: 'جهاز لوحي', mobile: 'هاتف', home: 'الرئيسية', orders: 'طلباتي', balance: 'إضافة رصيد', payments: 'دفعاتي', search: 'البحث', overview: 'نظرة عامة', dashboard: 'لوحة التحكم', activity: 'النشاط', products: 'المنتجات', wallet: 'رصيد المحفظة', current: 'الرصيد الحالي', month: 'هذا الشهر', recent: 'آخر التحديثات', draft: 'معاينة مسودة · لا تظهر للزوار حتى النشر', welcome: 'مرحبًا بعودتك', details: 'تابع أداء منصتك من مكان واحد', searchHint: 'ابحث في المنصة', available: 'متاح', preview: 'معاينة تفاعلية آمنة' },
  en: { desktop: 'Desktop', tablet: 'Tablet', mobile: 'Mobile', home: 'Home', orders: 'Orders', balance: 'Add balance', payments: 'Payments', search: 'Search', overview: 'Overview', dashboard: 'Dashboard', activity: 'Activity', products: 'Products', wallet: 'Wallet balance', current: 'Current balance', month: 'This month', recent: 'Recent updates', draft: 'Draft preview · Visitors will not see it until published', welcome: 'Welcome back', details: 'Your platform at a glance', searchHint: 'Search the platform', available: 'Available', preview: 'Safe interactive preview' },
};
const navIcons = [LayoutDashboard, ShoppingBag, Wallet, CreditCard, Search];

export default function PlatformStudioPreview({ theme, mode = 'light', language = 'ar', compact = false, locked = false, onUpgrade }) {
  const [viewport, setViewport] = useState('desktop');
  const [active, setActive] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = labels[language] || labels.ar;
  const header = theme?.chrome?.header || {};
  const bottomNav = theme?.chrome?.bottomNav || {};
  const sidebarTemplate = theme?.brand?.sidebarTemplate || 'default';
  const sidebarMetrics = theme?.brand?.sidebarMetrics || { width: 270, height: 100, radius: 28 };
  const paletteStyle = useMemo(() => platformThemeStyles(theme, mode), [theme, mode]);
  const sideItems = [t.dashboard, t.orders, t.products, t.wallet, t.activity];
  const bottomItems = [t.orders, t.balance, t.home, t.payments, t.search];
  const viewportWidth = viewport === 'mobile' ? '390px' : viewport === 'tablet' ? '768px' : '100%';
  const headerStyle = { boxSizing: 'border-box', height: `${header.height || 64}px`, width: `${header.width || 100}%`, marginInline: 'auto', borderRadius: `${header.radius ?? 0}px`, background: header.background, color: header.foreground };
  const bottomStyle = { height: `${bottomNav.height || 64}px`, width: `${bottomNav.width || 100}%`, maxWidth: 'calc(100% - 1rem)', background: bottomNav.background, color: bottomNav.foreground, borderRadius: `${bottomNav.radius ?? 0}px` };

  return <section className={`studio-preview ${compact ? 'studio-preview--compact' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
    <div className="studio-preview__toolbar">
      <span className="studio-preview__draft"><Activity className="h-3.5 w-3.5" />{t.draft}</span>
      {!compact && <div className="studio-preview__viewport-controls" aria-label={t.preview}>{[['desktop', '⌘'], ['tablet', '▣'], ['mobile', '▯']].map(([value, icon]) => <button key={value} type="button" aria-pressed={viewport === value} onClick={() => setViewport(value)}>{icon}<span>{t[value]}</span></button>)}</div>}
    </div>
    <div className="studio-preview__outer">
      <div className={`studio-preview__device studio-preview__device--${viewport} ${mode === 'dark' ? 'studio-preview__device--dark' : ''}`} style={{ ...paletteStyle, width: viewportWidth, fontFamily: `var(--platform-font-${language === 'ar' ? 'ar' : 'en'}, sans-serif)`, fontSize: 'var(--platform-base-font-size, 16px)' }}>
        <div className="studio-preview__site" style={{ minHeight: viewport === 'mobile' ? 720 : 610 }}>
          <header className={`studio-preview__header studio-preview__header--${header.template || 'bar'}`} style={headerStyle}>
            <button type="button" className="studio-preview__icon-button" onClick={() => setMobileMenuOpen((value) => !value)} aria-label="Toggle preview menu"><Menu /></button>
            <div className="studio-preview__brand"><span className="studio-preview__brand-mark">E</span><strong>EMBRATOR</strong></div>
            <div className="studio-preview__header-search"><Search /><span>{t.searchHint}</span></div>
            <span className="studio-preview__notification"><Bell /></span>
            <span className="studio-preview__avatar"><CircleUserRound /></span>
          </header>
          <div className="studio-preview__workspace" style={{ height: 530 }}>
            {(viewport !== 'mobile' || mobileMenuOpen) && <aside data-sidebar-template={sidebarTemplate} className={`studio-preview__sidebar ka-sidebar-panel ka-sidebar-template-${sidebarTemplate}`} style={{ width: `${sidebarMetrics.width}px`, height: `${sidebarMetrics.height}%`, borderRadius: `${sidebarMetrics.radius}px` }}>
              <div className="studio-preview__side-profile"><span className="studio-preview__avatar"><CircleUserRound /></span><span><strong>{language === 'ar' ? 'حساب المدير' : 'Admin account'}</strong><small>{language === 'ar' ? 'مسؤول المنصة' : 'Platform admin'}</small></span></div>
              <div className="studio-preview__side-label">{t.overview}</div>
              {sideItems.map((item, index) => <button type="button" key={item} onClick={() => setActive(index)} className={`studio-preview__side-item ka-sidebar-nav-item ${active === index ? 'is-active' : ''}`}><span className="studio-preview__side-item-icon ka-sidebar-icon-bubble">{React.createElement([LayoutDashboard, ClipboardList, ShoppingBag, Wallet, Activity][index])}</span><span>{item}</span>{index === 1 && <small>3</small>}</button>)}
              <div className="studio-preview__side-foot"><span className="studio-preview__status-dot" />{t.available}</div>
            </aside>}
            <main className="studio-preview__main">
              <div className="studio-preview__page-heading"><div><span className="studio-preview__eyebrow">{t.overview}</span><h2>{t.welcome}</h2><p>{t.details}</p></div><button type="button" className="studio-preview__primary" onClick={() => setActive(1)}><PlusCircle />{t.orders}</button></div>
              <div className="studio-preview__stats">
                <article><span className="studio-preview__stat-icon studio-preview__stat-icon--blue"><Wallet /></span><small>{t.current}</small><strong>24,580 <i>EGP</i></strong><em>↑ 12.8%</em></article>
                <article><span className="studio-preview__stat-icon studio-preview__stat-icon--violet"><ClipboardList /></span><small>{t.orders}</small><strong>128</strong><em>+18.2%</em></article>
                <article><span className="studio-preview__stat-icon studio-preview__stat-icon--amber"><Activity /></span><small>{t.month}</small><strong>8,420</strong><em>+9.4%</em></article>
              </div>
              <div className="studio-preview__content-grid">
                <section className="studio-preview__panel studio-preview__chart"><div><strong>{t.activity}</strong><span>{t.month}</span></div><div className="studio-preview__chart-bars">{[40, 58, 45, 72, 54, 83, 63, 92, 69, 78, 58, 98].map((height, index) => <i key={index} style={{ height: `${height}%`, opacity: index === 11 ? 1 : 0.45 + index * 0.035 }} />)}</div><footer><span>01 {language === 'ar' ? 'أكتوبر' : 'Oct'}</span><span>15 {language === 'ar' ? 'أكتوبر' : 'Oct'}</span><span>30 {language === 'ar' ? 'أكتوبر' : 'Oct'}</span></footer></section>
                <section className="studio-preview__panel studio-preview__updates"><div><strong>{t.recent}</strong><ChevronLeft /></div>{[['#4821', language === 'ar' ? 'طلب جديد' : 'New order', '1,250 EGP'], ['#4819', language === 'ar' ? 'تم شحن الطلب' : 'Order completed', '840 EGP'], ['#4815', language === 'ar' ? 'إضافة رصيد' : 'Wallet top-up', '2,000 EGP']].map(([id, title, amount], index) => <article key={id}><span className={`studio-preview__update-icon studio-preview__update-icon--${index}`}>{index === 2 ? <Wallet /> : <ShoppingBag />}</span><span><strong>{title}</strong><small>{id} · {index + 1} {language === 'ar' ? 'س' : 'h'}</small></span><b>{amount}</b></article>)}</section>
              </div>
              {!compact && <section className="studio-preview__panel studio-preview__products"><div><strong>{t.products}</strong><span>{language === 'ar' ? 'عرض الكل' : 'View all'} <ChevronLeft /></span></div><div className="studio-preview__product-row">{['#eef2ff', '#ecfdf5', '#fff7ed'].map((color, index) => <article key={color}><span style={{ background: color }}>{index === 0 ? <CreditCard /> : index === 1 ? <ShoppingBag /> : <Wallet />}</span><strong>{[language === 'ar' ? 'باقة مميزة' : 'Premium bundle', language === 'ar' ? 'رصيد إضافي' : 'Extra credit', language === 'ar' ? 'خدمات المنصة' : 'Platform services'][index]}</strong><small>{[1_250, 860, 2_100][index].toLocaleString()} EGP</small></article>)}</div></section>}
            </main>
          </div>
          {viewport === 'mobile' && <nav className={`studio-preview__bottom studio-preview__bottom--${bottomNav.template || 'bar'}`} style={bottomStyle}>{bottomItems.map((item, index) => <button key={item} type="button" onClick={() => setActive(index)} className={active === index ? 'is-active' : ''}>{React.createElement(navIcons[[1, 3, 0, 2, 4][index]])}<span>{item}</span></button>)}</nav>}
        </div>
      </div>
    </div>
    {locked && <div className="studio-preview__lock"><span><CreditCard /></span><strong>{language === 'ar' ? 'المعاينة الكاملة ميزة مدفوعة' : 'Full preview is a paid feature'}</strong><p>{language === 'ar' ? 'اشترك لفتح المعاينة الكاملة وتجربة كل أجزاء المنصة.' : 'Subscribe to explore the complete platform preview.'}</p><button type="button" onClick={onUpgrade}>{language === 'ar' ? 'استكشف الخطط' : 'Explore plans'}</button></div>}
  </section>;
}
