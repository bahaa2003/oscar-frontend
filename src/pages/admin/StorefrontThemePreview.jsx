import React, { useCallback, useEffect, useRef, useState } from 'react';

const sizes = { desktop: 1280, tablet: 800, mobile: 390 };

// Only this real storefront frame receives the draft; the parent keeps the published theme.
export default function StorefrontThemePreview({ configuration, mode = 'light', language = 'ar' }) {
  const frame = useRef(null);
  const [viewport, setViewport] = useState('desktop');
  const [reload, setReload] = useState(0);
  const [ready, setReady] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const ar = language === 'ar';
  const sync = useCallback(() => frame.current?.contentWindow?.postMessage({
    type: 'oscar:theme-preview', configuration, mode,
  }, window.location.origin), [configuration, mode]);
  useEffect(() => {
    const receive = (event) => {
      if (event.source !== frame.current?.contentWindow || event.origin !== window.location.origin
        || event.data?.type !== 'oscar:theme-preview-ready') return;
      setReady(true); setTimedOut(false); sync();
    };
    window.addEventListener('message', receive);
    sync();
    return () => window.removeEventListener('message', receive);
  }, [sync]);
  useEffect(() => {
    setReady(false); setTimedOut(false);
    const timer = window.setTimeout(() => setTimedOut(true), 15000);
    return () => window.clearTimeout(timer);
  }, [reload]);
  return <section className="storefront-theme-preview" aria-label={ar ? 'معاينة المتجر الحقيقي' : 'Real storefront preview'}>
    <div className="storefront-theme-preview__toolbar">
      <span className="storefront-theme-preview__draft">{ar ? 'المتجر الفعلي ببياناته · معاينة المسودة فقط' : 'Real catalog · draft preview only'}</span>
      <div className="storefront-theme-preview__devices" role="group" aria-label={ar ? 'حجم المعاينة' : 'Preview viewport'}>
        {Object.keys(sizes).map((size) => <button type="button" key={size} aria-pressed={viewport === size} onClick={() => setViewport(size)}>{({ desktop: ar ? 'كمبيوتر' : 'Desktop', tablet: ar ? 'تابلت' : 'Tablet', mobile: ar ? 'موبايل' : 'Mobile' })[size]}</button>)}
      </div>
    </div>
    {!ready && <p role="status" className="p-3 text-sm">{timedOut ? (ar ? 'تعذر تحميل المعاينة. تحقق من الاتصال وأعد المحاولة.' : 'Preview could not load. Check the connection and retry.') : (ar ? 'جارٍ تحميل المتجر الفعلي…' : 'Loading storefront…')}{timedOut && <button type="button" className="ms-3 underline" onClick={() => setReload((value) => value + 1)}>{ar ? 'إعادة المحاولة' : 'Retry'}</button>}</p>}
    <div className="storefront-theme-preview__canvas"><iframe key={reload} ref={frame} title={ar ? 'معاينة المتجر' : 'Storefront preview'} src="/?themePreview=1" onLoad={sync} className="storefront-theme-preview__frame" style={{ width: sizes[viewport], minWidth: sizes[viewport] }} /></div>
  </section>;
}
