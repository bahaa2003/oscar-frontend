const APP_CACHE_VERSION_KEY = 'oscar:app-cache-version';
const APP_CACHE_RELOAD_KEY = 'oscar:app-cache-reload-version';

const SESSION_CACHE_KEYS = [
  'oscar:media-cache:v1',
  'oscar:currencies-cache:v1',
  'oscar:groups-cache:v1',
];

const getBuildId = () => String(
  import.meta.env.VITE_OSCAR_BUILD_ID
  || import.meta.env.VITE_APP_VERSION
  || 'dev'
);

const clearSessionDataCaches = () => {
  if (typeof window === 'undefined' || !window.sessionStorage) return;

  SESSION_CACHE_KEYS.forEach((key) => {
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      // Best-effort cache cleanup only.
    }
  });
};

const clearBrowserCacheStorage = async () => {
  if (typeof window === 'undefined' || !('caches' in window)) return;

  try {
    const cacheNames = await window.caches.keys();
    await Promise.all(cacheNames.map((cacheName) => window.caches.delete(cacheName)));
  } catch (error) {
    console.warn('[OscarCache] Cache Storage cleanup failed', error);
  }
};

const unregisterServiceWorkers = async () => {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return false;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
    return registrations.length > 0;
  } catch (error) {
    console.warn('[OscarCache] Service worker cleanup failed', error);
    return false;
  }
};

export const refreshAppCachesOnVersionChange = () => {
  if (typeof window === 'undefined' || !window.localStorage) return;

  const currentBuildId = getBuildId();
  let previousBuildId = '';

  try {
    previousBuildId = window.localStorage.getItem(APP_CACHE_VERSION_KEY) || '';
  } catch {
    previousBuildId = '';
  }

  if (!previousBuildId) {
    clearSessionDataCaches();

    try {
      window.localStorage.setItem(APP_CACHE_VERSION_KEY, currentBuildId);
    } catch {
      // Version tracking is best-effort only.
    }

    void Promise.all([
      clearBrowserCacheStorage(),
      unregisterServiceWorkers(),
    ]);

    return;
  }

  if (previousBuildId === currentBuildId) {
    try {
      window.sessionStorage.removeItem(APP_CACHE_RELOAD_KEY);
    } catch {
      // Best effort.
    }
    return;
  }

  clearSessionDataCaches();

  void (async () => {
    console.info('[OscarCache] New frontend version detected. Refreshing app caches.', {
      previousBuildId,
      currentBuildId,
    });

    await Promise.all([
      clearBrowserCacheStorage(),
      unregisterServiceWorkers(),
    ]);

    try {
      window.localStorage.setItem(APP_CACHE_VERSION_KEY, currentBuildId);
    } catch {
      // Version tracking is best-effort only.
    }

    let alreadyReloaded = false;
    try {
      alreadyReloaded = window.sessionStorage.getItem(APP_CACHE_RELOAD_KEY) === currentBuildId;
      window.sessionStorage.setItem(APP_CACHE_RELOAD_KEY, currentBuildId);
    } catch {
      alreadyReloaded = false;
    }

    if (!alreadyReloaded) {
      window.location.reload();
    }
  })();
};
