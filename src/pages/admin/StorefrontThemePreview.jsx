import React, { useCallback, useEffect, useRef, useState } from 'react';

const viewports = {
  desktop: { width: '100%', label: { ar: '\u062d\u0627\u0633\u0648\u0628', en: 'Desktop' } },
  tablet: { width: '768px', label: { ar: '\u062a\u0627\u0628\u0644\u062a', en: 'Tablet' } },
  mobile: { width: '390px', label: { ar: '\u0645\u0648\u0628\u0627\u064a\u0644', en: 'Mobile' } },
};

export default function StorefrontThemePreview({ configuration, mode, language }) {
  const frame = useRef(null);
  const [viewport, setViewport] = useState('desktop');
  const isArabic = language === 'ar';
  const syncPreview = useCallback(() => {
    const target = frame.current?.contentWindow;
    if (!target) return;
    target.postMessage({ type: 'oscar:theme-preview', configuration, mode }, window.location.origin);
  }, [configuration, mode]);

  useEffect(() => {
    const current = frame.current;
    if (!current) return undefined;
    current.addEventListener('load', syncPreview);
    syncPreview();
    return () => current.removeEventListener('load', syncPreview);
  }, [syncPreview]);

  return <section className="space-y-3" aria-label={isArabic ? '\u0645\u0639\u0627\u064a\u0646\u0629 \u0627\u0644\u0645\u062a\u062c\u0631 \u0627\u0644\u062d\u0642\u064a\u0642\u064a' : 'Live storefront preview'}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-[var(--color-text-secondary)]">{isArabic ? '\u062a\u0635\u0641\u062d \u0646\u0641\u0633 \u0648\u0627\u062c\u0647\u0629 \u0627\u0644\u0645\u062a\u062c\u0631 \u0645\u0639 \u0627\u0644\u0645\u0639\u0627\u064a\u0646\u0629 \u0627\u0644\u0622\u0646\u064a\u0629 \u0644\u0644\u062a\u0639\u062f\u064a\u0644\u0627\u062a.' : 'Browse the actual storefront with your draft theme applied live.'}</p>
      <div className="flex rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1" role="group" aria-label={isArabic ? '\u062d\u062c\u0645 \u0627\u0644\u0645\u0639\u0627\u064a\u0646\u0629' : 'Preview size'}>
        {Object.entries(viewports).map(([key, value]) => <button key={key} type="button" aria-pressed={viewport === key} onClick={() => setViewport(key)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${viewport === key ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)]'}`}>{value.label[isArabic ? 'ar' : 'en']}</button>)}
      </div>
    </div>
    <div className="overflow-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 sm:p-4">
      <iframe ref={frame} src="/?themePreview=1" title={isArabic ? 'OSCAR \u0645\u0639\u0627\u064a\u0646\u0629 \u0627\u0644\u0645\u062a\u062c\u0631' : 'OSCAR storefront preview'} onLoad={syncPreview} className="mx-auto block rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-xl" style={{ width: viewports[viewport].width, maxWidth: '100%', height: viewport === 'mobile' ? 760 : 820 }} />
    </div>
  </section>;
}
