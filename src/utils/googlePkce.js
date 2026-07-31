export const GOOGLE_PKCE_SESSION_KEY = 'auth:google-pkce:v1';
export const GOOGLE_PKCE_MAX_AGE_MS = 10 * 60 * 1000;

const base64UrlEncode = (bytes) => {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const getCrypto = () => {
  const cryptoApi = globalThis.crypto;

  if (!cryptoApi?.getRandomValues || !cryptoApi?.subtle?.digest) {
    throw new Error('Secure browser crypto is required for Google sign-in.');
  }

  return cryptoApi;
};

export const createGooglePkcePair = async () => {
  const cryptoApi = getCrypto();
  const randomBytes = new Uint8Array(32);
  cryptoApi.getRandomValues(randomBytes);

  const verifier = base64UrlEncode(randomBytes);
  const digest = await cryptoApi.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  const challenge = base64UrlEncode(new Uint8Array(digest));

  return { verifier, challenge, method: 'S256', createdAt: Date.now() };
};

export const clearGooglePkceAttempt = () => {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  window.sessionStorage.removeItem(GOOGLE_PKCE_SESSION_KEY);
};

export const storeGooglePkceAttempt = ({ verifier, createdAt = Date.now() }) => {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    throw new Error('Session storage is required for Google sign-in.');
  }

  clearGooglePkceAttempt();
  window.sessionStorage.setItem(
    GOOGLE_PKCE_SESSION_KEY,
    JSON.stringify({ verifier, createdAt })
  );
};

export const consumeGooglePkceVerifier = (now = Date.now()) => {
  if (typeof window === 'undefined' || !window.sessionStorage) return '';

  const raw = window.sessionStorage.getItem(GOOGLE_PKCE_SESSION_KEY);
  clearGooglePkceAttempt();
  if (!raw) return '';

  try {
    const parsed = JSON.parse(raw);
    const verifier = String(parsed?.verifier || '').trim();
    const createdAt = Number(parsed?.createdAt || 0);

    if (!verifier || !Number.isFinite(createdAt)) return '';
    if (now - createdAt > GOOGLE_PKCE_MAX_AGE_MS) return '';

    return verifier;
  } catch {
    return '';
  }
};
