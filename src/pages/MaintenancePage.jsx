import React from 'react';
import { Cog, Wrench, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import HeaderBrand from '../components/layout/HeaderBrand';

const MaintenancePage = () => {
  const { i18n } = useTranslation();
  const isArabic = String(i18n.resolvedLanguage || i18n.language || 'ar').toLowerCase().startsWith('ar');

  return (
    <main
      dir={isArabic ? 'rtl' : 'ltr'}
      lang={isArabic ? 'ar' : 'en'}
      className="oscar-maintenance-page fixed inset-0 z-[1000] grid min-h-[100dvh] place-items-center overflow-hidden px-5 py-10 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="oscar-maintenance-orb oscar-maintenance-orb-one" aria-hidden="true" />
      <div className="oscar-maintenance-orb oscar-maintenance-orb-two" aria-hidden="true" />
      <section className="oscar-maintenance-card relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center rounded-[2rem] border px-6 py-10 shadow-2xl backdrop-blur-xl sm:px-12 sm:py-14">
        <HeaderBrand className="mb-10 scale-125" />
        <div className="oscar-maintenance-icon mb-8 flex h-28 w-28 items-center justify-center rounded-[2rem] border sm:h-32 sm:w-32" aria-hidden="true">
          <Cog className="oscar-maintenance-gear h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]" strokeWidth={1.35} />
          <Wrench className="oscar-maintenance-wrench absolute h-9 w-9" strokeWidth={1.7} />
          <Sparkles className="oscar-maintenance-spark absolute -right-2 -top-2 h-7 w-7" />
        </div>
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.26em] text-[var(--color-primary)]">
          {isArabic ? 'نعود إليك قريبًا' : 'We will be back soon'}
        </p>
        <h1 className="text-3xl font-black leading-tight text-[var(--color-text)] sm:text-5xl">
          {isArabic ? 'الموقع تحت الصيانة حاليًا' : 'We are performing maintenance'}
        </h1>
        <p className="mt-5 max-w-xl text-base leading-8 text-[var(--color-text-secondary)] sm:text-lg">
          {isArabic
            ? 'نعمل حاليًا على تطوير وتحسين تجربتك. سنعود إليك قريبًا بتجربة أفضل.'
            : 'We are improving your experience and will be back shortly with a better store.'}
        </p>
        <div className="mt-9 flex items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)]">
          <span className="oscar-maintenance-pulse h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]" />
          {isArabic ? 'شكرًا لصبرك وتفهمك' : 'Thank you for your patience'}
        </div>
      </section>
    </main>
  );
};

export default MaintenancePage;
