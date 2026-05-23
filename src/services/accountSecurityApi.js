const ACCOUNT_SECURITY_STORAGE_KEY = 'ibra-account-security-v1';
// In-memory store for account security (no localStorage)
const __accountSecurityStore = Object.create(null);

export const accountSecurityEndpoints = {
  sendCode: '/account/2fa/email/send-code',
  verifyCode: '/account/2fa/email/verify',
  disableTwoFactor: '/account/2fa/disable',
  securityStatus: '/account/security-status'
};

const wait = (ms = 700) => new Promise((resolve) => setTimeout(resolve, ms));

const createApiError = (code, message) => {
  const error = new Error(message);
  error.code = code;
  return error;
};

const readSecurityStore = () => {
  try {
    return __accountSecurityStore[ACCOUNT_SECURITY_STORAGE_KEY] || {};
  } catch {
    return {};
  }
};

const writeSecurityStore = (value) => {
  __accountSecurityStore[ACCOUNT_SECURITY_STORAGE_KEY] = value;
};

const getUserSecurityState = (store, userId) => ({
  twoFactorEnabled: false,
  emailVerified: true,
  pendingOtp: null,
  ...(store?.[userId] || {})
});

const maskEmail = (email) => {
  const value = String(email || '').trim();
  const [name, domain] = value.split('@');
  if (!name || !domain) return value;
  if (name.length <= 2) return `${name[0] || '*'}***@${domain}`;
  return `${name.slice(0, 2)}***@${domain}`;
};

const normalizeCode = (value) => String(value || '').replace(/\D/g, '').slice(0, 6);

const accountSecurityApi = {
  async getSecurityStatus(userId) {
    await wait(450);
    if (!userId) throw createApiError('INVALID_USER', 'Missing user identifier');

    const store = readSecurityStore();
    const state = getUserSecurityState(store, userId);
    return {
      twoFactorEnabled: Boolean(state.twoFactorEnabled),
      emailVerified: Boolean(state.emailVerified)
    };
  },

  async sendEmailCode({ userId, email }) {
    await wait(950);

    if (!userId) throw createApiError('INVALID_USER', 'Missing user identifier');
    if (!email || !String(email).includes('@')) {
      throw createApiError('INVALID_EMAIL', 'A valid email is required to send OTP');
    }

    const store = readSecurityStore();
    const state = getUserSecurityState(store, userId);
    const requestId = `otp-${Date.now()}`;
    const expiresIn = 120;

    state.pendingOtp = {
      requestId,
      email: String(email).trim().toLowerCase(),
      code: '123456',
      expiresAt: Date.now() + expiresIn * 1000
    };

    store[userId] = state;
    writeSecurityStore(store);

    return {
      requestId,
      expiresIn,
      maskedEmail: maskEmail(email),
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`otpauth://totp/OSCAR STORE:${email}?secret=MSSTORE${userId}&issuer=OSCAR STORE`)}`
    };
  },

  async verifyEmailCode({ userId, email, requestId, code }) {
    await wait(900);

    if (!userId) throw createApiError('INVALID_USER', 'Missing user identifier');

    const normalizedCode = normalizeCode(code);
    if (normalizedCode.length !== 6) {
      throw createApiError('OTP_INVALID', 'Verification code must be 6 digits');
    }

    const store = readSecurityStore();
    const state = getUserSecurityState(store, userId);
    const pending = state.pendingOtp;

    if (!pending || !requestId || pending.requestId !== requestId) {
      throw createApiError('OTP_REQUEST_NOT_FOUND', 'Verification session not found');
    }

    if (pending.email !== String(email || '').trim().toLowerCase()) {
      throw createApiError('OTP_EMAIL_MISMATCH', 'Email changed during verification');
    }

    if (Date.now() > pending.expiresAt || normalizedCode === '000000') {
      state.pendingOtp = null;
      store[userId] = state;
      writeSecurityStore(store);
      throw createApiError('OTP_EXPIRED', 'OTP has expired');
    }

    if (normalizedCode !== pending.code) {
      throw createApiError('OTP_INVALID', 'OTP is invalid');
    }

    state.twoFactorEnabled = true;
    state.emailVerified = true;
    state.pendingOtp = null;
    store[userId] = state;
    writeSecurityStore(store);

    return { twoFactorEnabled: true };
  },

  async disableTwoFactor({ userId, currentPassword }) {
    await wait(700);

    if (!userId) throw createApiError('INVALID_USER', 'Missing user identifier');
    if (!String(currentPassword || '').trim()) {
      throw createApiError('PASSWORD_REQUIRED', 'Current password is required');
    }

    const store = readSecurityStore();
    const state = getUserSecurityState(store, userId);
    state.twoFactorEnabled = false;
    state.pendingOtp = null;
    store[userId] = state;
    writeSecurityStore(store);

    return { twoFactorEnabled: false };
  }
};

export default accountSecurityApi;
