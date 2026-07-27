import React, { Suspense, lazy, useEffect, useState } from 'react';

const OscarAIAssistant = lazy(() => import('./OscarAIAssistant'));

const LazyOscarAIAssistant = ({ showLauncher = true }) => {
  const [shouldMount, setShouldMount] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    let timeoutId = 0;
    let idleId = 0;
    const mount = () => setShouldMount(true);

    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(mount, { timeout: 1800 });
      return () => {
        window.cancelIdleCallback?.(idleId);
      };
    }

    timeoutId = window.setTimeout(mount, 900);
    return () => window.clearTimeout(timeoutId);
  }, []);

  if (!shouldMount) return null;

  return (
    <Suspense fallback={null}>
      <OscarAIAssistant showLauncher={showLauncher} />
    </Suspense>
  );
};

export default LazyOscarAIAssistant;
