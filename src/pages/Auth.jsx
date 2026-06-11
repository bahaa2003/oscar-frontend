import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Mail,
  User,
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import Button, { cn } from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import ThemeToggle from '../components/ui/ThemeToggle';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';
import OtpInput from '../components/account/OtpInput';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../components/ui/Toast';
import useSystemStore from '../store/useSystemStore';
import { useTranslation } from 'react-i18next';
import {
  validateEmail,
  validateFullName,
  validatePassword,
} from '../utils/validation';
import { COUNTRY_CATALOG, buildCurrencyCatalogFromCountries } from '../data/countryCatalog';
import { getDefaultRouteForRole } from '../utils/authRoles';
import { getAccountAccessRoute, normalizeAccountStatus } from '../utils/accountStatus';
import styles from './Auth.module.css';

const GoogleMark = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.9-4.1 2.9-7 0-.7-.1-1.4-.2-2H12z" />
    <path fill="#34A853" d="M12 22c2.7 0 5-0.9 6.7-2.6l-3.1-2.4c-.9.6-2 1-3.6 1-2.7 0-5-1.8-5.8-4.3l-3.2 2.5C4.7 19.6 8 22 12 22z" />
    <path fill="#4A90E2" d="M6.2 13.7c-.2-.6-.3-1.1-.3-1.7s.1-1.2.3-1.7L3 7.8C2.4 9 2 10.4 2 12s.4 3 1 4.2l3.2-2.5z" />
    <path fill="#FBBC05" d="M12 5c1.5 0 2.9.5 4 1.6l3-3C17 1.8 14.7 1 12 1 8 1 4.7 3.4 3 7.8l3.2 2.5C7 6.8 9.3 5 12 5z" />
  </svg>
);

const stepMotion = {
  initial: { opacity: 0, x: 18 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -18 },
  transition: { duration: 0.24, ease: 'easeOut' },
};

const StepOne = ({ children }) => (
  <motion.div key="register-step-1" {...stepMotion} className="space-y-4">
    {children}
  </motion.div>
);

const StepTwo = ({ children }) => (
  <motion.div key="register-step-2" {...stepMotion} className="space-y-4">
    {children}
  </motion.div>
);

const GOOGLE_PROFILE_SETUP_STORAGE_PREFIX = 'auth:google-profile-setup:v1:';
const DEFAULT_GOOGLE_SETUP_COUNTRY = 'EG';

const getCountryDisplayName = (country, isArabic) => (
  isArabic
    ? country?.nameAr || country?.translations?.ara?.common || country?.name?.common || country?.cca2
    : country?.name?.common || country?.cca2
);

const getCountryCurrencyCodes = (country) => (
  Object.keys(country?.currencies || {})
    .map((code) => String(code || '').trim().toUpperCase())
    .filter(Boolean)
);

const getGoogleSetupStorageKey = (userId) => (
  `${GOOGLE_PROFILE_SETUP_STORAGE_PREFIX}${String(userId || '').trim()}`
);

const hasCompletedGoogleProfileSetup = (user) => {
  if (!user?.id || typeof window === 'undefined') return false;

  try {
    return window.localStorage.getItem(getGoogleSetupStorageKey(user.id)) === '1';
  } catch {
    return false;
  }
};

const markGoogleProfileSetupComplete = (user) => {
  if (!user?.id || typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(getGoogleSetupStorageKey(user.id), '1');
  } catch {
    // Best-effort marker only.
  }
};

const isGoogleAccount = (user) => {
  const signupMethod = String(user?.signupMethod || '').trim().toLowerCase();
  const authProvider = String(user?.authProvider || '').trim().toLowerCase();
  return signupMethod === 'google' || authProvider === 'google';
};

const Auth = () => {
  const fallbackCountries = useMemo(() => COUNTRY_CATALOG, []);
  const navigate = useNavigate();
  const location = useLocation();
  const oauthHandledRef = useRef(false);
  const reduceMotion = useReducedMotion();
  const { dir } = useLanguage();
  const { t } = useTranslation();
  const { addToast } = useToast();
  const {
    login,
    verifyTwoFactor,
    loginWithGoogle,
    signup,
    completeGoogleProfileSetup,
    isLoading,
    error: storeError,
    isAuthenticated,
    user,
    blockedStatus,
  } = useAuthStore();
  const { currencies: systemCurrencies, loadCurrencies } = useSystemStore();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState('');
  const [country, setCountry] = useState(DEFAULT_GOOGLE_SETUP_COUNTRY);
  const [currency, setCurrency] = useState('EGP');
  const [countries] = useState(COUNTRY_CATALOG);
  const [errors, setErrors] = useState({});
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [registerStep, setRegisterStep] = useState(1);
  const [twoFactorChallenge, setTwoFactorChallenge] = useState(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [googleSetupResult, setGoogleSetupResult] = useState(null);
  const [isSavingGoogleSetup, setIsSavingGoogleSetup] = useState(false);
  const googleSetupBlockingRef = useRef(false);
  const isGoogleSetupMode = Boolean(googleSetupResult?.user);
  const isArabic = dir === 'rtl';

const countryOptions = useMemo(() => {
    const source = countries.length ? countries : fallbackCountries;
    return [...source];
  }, [countries, fallbackCountries]);

  const selectedCountry = useMemo(
    () => countryOptions.find((item) => item.cca2 === country) || countryOptions[0],
    [countryOptions, country]
  );

  const catalogCurrencyOptions = useMemo(
    () => buildCurrencyCatalogFromCountries().map((item) => ({
      code: item.code,
      label: `${item.code}${item.symbol ? ` (${item.symbol})` : ''}`,
      name: item.name,
      symbol: item.symbol,
    })),
    []
  );

  const availableCurrencyOptions = useMemo(() => {
    const byCode = new Map();

    catalogCurrencyOptions.forEach((item) => {
      if (!item.code) return;
      byCode.set(item.code, item);
    });

    const list = Array.isArray(systemCurrencies) ? systemCurrencies : [];
    list.forEach((item) => {
      const code = String(item?.code || '').trim().toUpperCase();
      if (!code) return;
      byCode.set(code, {
        code,
        label: `${code}${item.symbol ? ` (${item.symbol})` : ''}`,
        name: item.name || code,
        symbol: item.symbol || code,
      });
    });

    return Array.from(byCode.values());
  }, [catalogCurrencyOptions, systemCurrencies]);

  const selectedCountryCurrencyCodes = useMemo(
    () => getCountryCurrencyCodes(selectedCountry),
    [selectedCountry]
  );

  const preferredCurrencyOptions = useMemo(() => {
    if (!selectedCountryCurrencyCodes.length) return availableCurrencyOptions;

    const countryCurrencySet = new Set(selectedCountryCurrencyCodes);
    return [
      ...selectedCountryCurrencyCodes
        .map((code) => availableCurrencyOptions.find((item) => item.code === code))
        .filter(Boolean),
      ...availableCurrencyOptions.filter((item) => !countryCurrencySet.has(item.code)),
    ];
  }, [availableCurrencyOptions, selectedCountryCurrencyCodes]);

  useEffect(() => {
    loadCurrencies();
  }, [loadCurrencies]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = String(params.get('mode') || '').toLowerCase();

    if (mode === 'signup') {
      setIsLogin(false);
      setRegisterStep(1);
      return;
    }

    if (mode === 'login') {
      setIsLogin(true);
      setRegisterStep(1);
    }
  }, [location.search]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reason = localStorage.getItem('auth:logout-reason');
    if (!reason) return;

    localStorage.removeItem('auth:logout-reason');
    if (reason === 'expired') {
      addToast(
        dir === 'rtl'
          ? 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى'
          : 'Session expired, please sign in again',
        'warning'
      );
    }
  }, [addToast, dir]);

  useEffect(() => {
    setCurrency((previous) => {
      const countryDefaultCurrency = selectedCountryCurrencyCodes[0];
      if (
        previous
        && availableCurrencyOptions.some((item) => item.code === previous)
        && (!countryDefaultCurrency || selectedCountryCurrencyCodes.includes(previous))
      ) {
        return previous;
      }

      return countryDefaultCurrency || availableCurrencyOptions[0]?.code || '';
    });
  }, [availableCurrencyOptions, selectedCountryCurrencyCodes]);

  useEffect(() => {
    if (location.search.includes('token=')) return;
    if (location.search.includes('status=')) return;
    if (isGoogleSetupMode || googleSetupBlockingRef.current) return;

    const normalizedStatus = normalizeAccountStatus(user?.status || blockedStatus);
    const blockedRoute = getAccountAccessRoute(normalizedStatus);

    if (blockedRoute && (isAuthenticated || blockedStatus)) {
      navigate(blockedRoute, { replace: true });
      return;
    }

    if (isAuthenticated && user) {
      navigate(getDefaultRouteForRole(user?.role), { replace: true });
    }
  }, [blockedStatus, isAuthenticated, isGoogleSetupMode, location.search, navigate, user]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const callbackStatus = normalizeAccountStatus(params.get('status'));
    if ((!token && !callbackStatus) || oauthHandledRef.current) return;

    oauthHandledRef.current = true;

    const handleGoogleCallback = async () => {
      googleSetupBlockingRef.current = true;
      const result = await loginWithGoogle();

      if (result?.user && (result?.canAccessApp || result?.status === 'pending') && shouldPromptGoogleProfileSetup(result.user)) {
        startGoogleProfileSetup(result);
        return;
      }

      googleSetupBlockingRef.current = false;

      if (result?.redirectTo) {
        if (result?.status === 'legacy_pending') {
          addToast('تم إنشاء حساب Google بنجاح وهو الآن قيد مراجعة الإدارة.', 'success');
        } else if (result?.status === 'verification_required') {
          addToast('البريد غير مؤكد: افتح رابط التفعيل المرسل إلى بريدك ثم سجّل الدخول.', 'warning');
        } else if (result?.status === 'rejected') {
          addToast('لا يمكن الدخول بهذا الحساب: الحساب غير مفعّل أو مرفوض. تواصل مع الدعم.', 'error');
        } else {
          addToast(
            t('auth.googleSuccess', {
              defaultValue: dir === 'rtl' ? 'تم تسجيل الدخول عبر Google' : 'Signed in with Google',
            }),
            'success'
          );
        }

        navigate(
          result?.status === 'pending'
            ? getDefaultRouteForRole(result?.user?.role)
            : result.redirectTo,
          { replace: true }
        );
        return;
      }

      oauthHandledRef.current = false;
    };

    handleGoogleCallback();
  }, [addToast, dir, location.search, loginWithGoogle, navigate, t]);

  const validateForm = () => {
    const nextErrors = {};
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError) nextErrors.email = emailError;
    if (passwordError) nextErrors.password = passwordError;

    if (!isLogin) {
      const nameError = validateFullName(name);

      if (nameError) nextErrors.name = nameError;

      if (!confirmPassword) {
        nextErrors.confirmPassword = t('auth.passwordConfirmRequired');
      } else if (password !== confirmPassword) {
        nextErrors.confirmPassword = t('auth.passwordsDoNotMatch');
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const setScopedErrors = (fieldErrors) => {
    setErrors((previous) => {
      const next = { ...previous };
      Object.keys(fieldErrors).forEach((key) => {
        if (fieldErrors[key]) {
          next[key] = fieldErrors[key];
        } else {
          delete next[key];
        }
      });
      return next;
    });
  };

  const validateRegisterStepOne = () => {
    const nextErrors = {};
    const nameError = validateFullName(name);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    nextErrors.name = nameError || null;
    nextErrors.email = emailError || null;
    nextErrors.password = passwordError || null;

    if (!confirmPassword) {
      nextErrors.confirmPassword = t('auth.passwordConfirmRequired');
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = t('auth.passwordsDoNotMatch');
    } else {
      nextErrors.confirmPassword = null;
    }

    setScopedErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  const validateRegisterStepTwo = () => {
    const nextErrors = {
      country: country ? null : t('auth.country'),
      currency: currency ? null : t('auth.noCurrenciesConfigured'),
    };

    setScopedErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  const isStepOneReady =
    Boolean(name.trim())
    && Boolean(email.trim())
    && Boolean(password)
    && Boolean(confirmPassword);
  const isStepTwoReady = Boolean(country) && Boolean(currency);

  const resolveDefaultCurrencyForCountry = (countryCode, preferredCurrency = '') => {
    const normalizedCountryCode = String(countryCode || '').trim().toUpperCase();
    const normalizedPreferredCurrency = String(preferredCurrency || '').trim().toUpperCase();
    const countryItem = countryOptions.find((item) => item.cca2 === normalizedCountryCode);
    const countryCurrencyCodes = getCountryCurrencyCodes(countryItem);

    if (normalizedPreferredCurrency && countryCurrencyCodes.includes(normalizedPreferredCurrency)) {
      return normalizedPreferredCurrency;
    }

    return countryCurrencyCodes[0] || normalizedPreferredCurrency || availableCurrencyOptions[0]?.code || '';
  };

  const handleCountryChange = (nextCountryCode) => {
    const normalizedCountryCode = String(nextCountryCode || '').trim().toUpperCase();
    setCountry(normalizedCountryCode);
    setCurrency(resolveDefaultCurrencyForCountry(normalizedCountryCode));
  };

  const getAuthTargetRoute = (result) => (
    result?.status === 'pending'
      ? getDefaultRouteForRole(result?.user?.role)
      : result?.redirectTo || getDefaultRouteForRole(result?.user?.role || useAuthStore.getState().user?.role)
  );

  const shouldPromptGoogleProfileSetup = (googleUser) => {
    if (!isGoogleAccount(googleUser) || !googleUser?.id) return false;
    if (hasCompletedGoogleProfileSetup(googleUser)) return false;

    const userCountryCode = String(googleUser.country || '').trim().toUpperCase();
    const userCurrencyCode = String(googleUser.currency || '').trim().toUpperCase();
    const countryItem = countryOptions.find((item) => item.cca2 === userCountryCode);
    const countryCurrencyCodes = getCountryCurrencyCodes(countryItem);

    return !countryItem || !userCurrencyCode || !countryCurrencyCodes.includes(userCurrencyCode);
  };

  const startGoogleProfileSetup = (result) => {
    const googleUser = result?.user || useAuthStore.getState().user;
    const userCountryCode = String(googleUser?.country || '').trim().toUpperCase();
    const countryItem = countryOptions.find((item) => item.cca2 === userCountryCode);
    const setupCountryCode = countryItem?.cca2 || DEFAULT_GOOGLE_SETUP_COUNTRY;
    const setupCurrencyCode = resolveDefaultCurrencyForCountry(setupCountryCode, googleUser?.currency);

    googleSetupBlockingRef.current = true;
    setCountry(setupCountryCode);
    setCurrency(setupCurrencyCode);
    setGoogleSetupResult({
      ...result,
      user: googleUser,
      targetRoute: getAuthTargetRoute(result),
    });
  };

  const goToRegisterStepTwo = () => {
    if (!validateRegisterStepOne()) return;
    setRegisterStep(2);
  };

  const consumeAuthResult = (result, { source = 'email', mode = 'login' } = {}) => {
    if (!result) return;

    if (source === 'google' && result?.user && (result?.canAccessApp || result?.status === 'pending') && shouldPromptGoogleProfileSetup(result.user)) {
      startGoogleProfileSetup(result);
      return;
    }

    if (source === 'google') {
      googleSetupBlockingRef.current = false;
    }

    if (result.redirectTo) {
      if (result.status === 'verification_required') {
        addToast(
          mode === 'signup'
            ? 'أرسلنا رابط تأكيد إلى بريدك الإلكتروني. افتح الرسالة واضغط رابط التفعيل أولاً.'
            : 'البريد غير مؤكد: افتح رابط التفعيل المرسل إلى بريدك ثم سجّل الدخول.',
          'warning'
        );
      } else if (result.status === 'legacy_pending') {
        addToast(
          source === 'google'
            ? 'تم إنشاء حساب Google بنجاح وهو الآن قيد مراجعة الإدارة.'
            : mode === 'signup'
              ? 'تم إنشاء الحساب بنجاح وهو الآن قيد مراجعة الإدارة.'
              : 'حسابك قيد المراجعة: انتظر موافقة الإدارة قبل الدخول.',
          'success'
        );
      } else if (result.status === 'rejected') {
        addToast('لا يمكن الدخول بهذا الحساب: الحساب غير مفعّل أو مرفوض. تواصل مع الدعم.', 'error');
      } else if (result.canAccessApp && source === 'google') {
        addToast(
          t('auth.googleSuccess', {
            defaultValue: dir === 'rtl' ? 'تم تسجيل الدخول عبر Google' : 'Signed in with Google',
          }),
          'success'
        );
      }

      navigate(
        result.status === 'pending'
          ? getDefaultRouteForRole(result?.user?.role)
          : result.redirectTo,
        { replace: true }
      );
      return;
    }

    if (result.ok && result.canAccessApp) {
      if (source === 'google') {
        addToast(
          t('auth.googleSuccess', {
            defaultValue: dir === 'rtl' ? 'تم تسجيل الدخول عبر Google' : 'Signed in with Google',
          }),
          'success'
        );
      }

      navigate(result.redirectTo || getDefaultRouteForRole(useAuthStore.getState().user?.role), { replace: true });
    }
  };

  const handleGoogleProfileSetupSubmit = async (event) => {
    event.preventDefault();

    const selectedSetupCountry = countryOptions.find((item) => item.cca2 === country);
    const nextErrors = {
      country: selectedSetupCountry ? null : 'اختر الدولة أولًا',
      currency: currency ? null : 'اختر العملة أولًا',
    };

    setScopedErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setIsSavingGoogleSetup(true);
    try {
      const countryName = getCountryDisplayName(selectedSetupCountry, isArabic);
      const updatedUser = await completeGoogleProfileSetup({
        country,
        countryName,
        currency,
      });
      const setupUser = updatedUser || googleSetupResult?.user;
      markGoogleProfileSetupComplete(setupUser);
      setGoogleSetupResult(null);
      googleSetupBlockingRef.current = false;
      oauthHandledRef.current = false;
      addToast(isArabic ? 'تم حفظ الدولة والعملة بنجاح.' : 'Country and currency saved successfully.', 'success');
      navigate(googleSetupResult?.targetRoute || getDefaultRouteForRole(setupUser?.role), { replace: true });
    } catch (setupError) {
      addToast(
        setupError?.message || (isArabic ? 'تعذر حفظ الدولة والعملة.' : 'Could not save country and currency.'),
        'error'
      );
    } finally {
      setIsSavingGoogleSetup(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isGoogleSetupMode) {
      await handleGoogleProfileSetupSubmit(event);
      return;
    }

    if (isLogin && twoFactorChallenge) {
      await handleTwoFactorSubmit();
      return;
    }

    if (!isLogin) {
      if (registerStep === 1) {
        goToRegisterStepTwo();
        return;
      }

      if (registerStep !== 2) return;
      if (!validateRegisterStepOne() || !validateRegisterStepTwo()) return;
    } else if (!validateForm()) {
      return;
    }

    if (!isLogin && !currency) {
      addToast(t('auth.noCurrenciesConfigured'), 'error');
      return;
    }

    const result = isLogin
      ? await login(email, password)
      : await signup({
          name,
          email,
          password,
          country,
          currency,
          signupMethod: 'email',
        });

    if (isLogin && result?.requires2FA) {
      setTwoFactorChallenge(result);
      setTwoFactorCode('');
      addToast('أدخل كود التحقق المرسل إلى بريدك الإلكتروني لإكمال تسجيل الدخول.', 'warning');
      return;
    }

    if (!isLogin) {
      consumeAuthResult(result, { source: 'email', mode: 'signup' });
      return;
    }

    consumeAuthResult(result, { source: 'email', mode: 'login' });
  };

  const handleTwoFactorSubmit = async () => {
    const tempToken = twoFactorChallenge?.tempToken || twoFactorChallenge?.twoFactorToken;
    if (!tempToken || twoFactorCode.length !== 6) {
      addToast('كود التحقق غير مكتمل: أدخل الكود المرسل إلى بريدك الإلكتروني.', 'error');
      return;
    }

    const result = await verifyTwoFactor({
      tempToken,
      code: twoFactorCode,
    });

    if (result?.canAccessApp) {
      setTwoFactorChallenge(null);
      setTwoFactorCode('');
      addToast('تم تأكيد كود البريد الإلكتروني وتسجيل الدخول بنجاح.', 'success');
    }

    consumeAuthResult(result, { source: 'email', mode: 'login' });
  };

  const handleGoogleAuth = async () => {
    googleSetupBlockingRef.current = true;
    const result = await loginWithGoogle();
    if (!result) {
      googleSetupBlockingRef.current = false;
      return;
    }
    consumeAuthResult(result, { source: 'google', mode: isLogin ? 'login' : 'signup' });
  };

  const handleForgotSubmit = (event) => {
    event.preventDefault();

    if (!forgotEmail) {
      addToast(t('auth.emailRequired'), 'error');
      return;
    }

    addToast(t('auth.resetLinkSent'), 'success');
    setForgotModalOpen(false);
    setForgotEmail('');
  };

  const toggleMode = () => {
    setIsLogin((previous) => !previous);
    setRegisterStep(1);
    setTwoFactorChallenge(null);
    setTwoFactorCode('');
    setConfirmPassword('');
    setErrors({});
    useAuthStore.setState({ error: null, blockedStatus: null, blockedUser: null });
  };

  const authSelectClassName =
    'h-11 w-full rounded-[var(--radius-md)] px-4 text-sm outline-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-55';
  const authLinkClassName = 'font-semibold text-[var(--color-primary)] transition hover:text-[var(--color-primary-hover)]';
  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className={styles.authPage}>
      <button
        type="button"
        onClick={handleBack}
        className={styles.backButton}
        data-auth-no-sparkle
        aria-label={dir === 'rtl' ? 'رجوع' : 'Back'}
      >
        <ArrowRight className="h-4 w-4" />
        <span>{dir === 'rtl' ? 'رجوع' : 'Back'}</span>
      </button>

      <div className={styles.topControls} data-auth-no-sparkle>
        <div className={styles.topControlsInner}>
          <LanguageSwitcher
            variant="glass"
            showIcon
            className="h-8 min-w-[4.6rem] gap-1.5 rounded-full px-2.5 py-1 text-[0.58rem] tracking-[0.12em] sm:h-9 sm:min-w-[5rem] sm:px-3 sm:text-[0.62rem]"
          />
          <ThemeToggle
            variant="glass"
            compact
            className="h-8 w-8 sm:h-9 sm:w-9"
          />
        </div>
      </div>

      <main className={styles.authShell}>
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className={styles.formPane}
        >
          <section className={styles.formCard} data-auth-no-sparkle>
            <header className="mb-6 text-center">
              <h1 className={styles.formTitle}>
                {isGoogleSetupMode
                  ? (isArabic ? 'اختيار الدولة والعملة' : 'Choose country and currency')
                  : isLogin ? t('auth.login') : t('auth.register')}
              </h1>
              {isGoogleSetupMode ? (
                <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-[var(--color-text-secondary)]">
                  {isArabic
                    ? 'قبل ما تدخل لحسابك، اختار بلدك وعملة المحفظة المناسبة لك.'
                    : 'Before entering your account, choose your country and wallet currency.'}
                </p>
              ) : null}
            </header>

            <form onSubmit={handleSubmit} className={styles.formStack}>
              <AnimatePresence mode="wait" initial={false}>
                {isGoogleSetupMode ? (
                  <motion.div key="google-profile-setup" {...stepMotion} className="space-y-4">
                    <div className="rounded-2xl border border-[color:rgb(var(--color-primary-rgb)/0.24)] bg-[color:rgb(var(--color-primary-rgb)/0.08)] p-3 text-center">
                      <span className="text-3xl" aria-hidden="true">
                        {selectedCountry?.flag || '🌍'}
                      </span>
                      <p className="mt-1 text-xs font-semibold text-[var(--color-text-secondary)]">
                        {getCountryDisplayName(selectedCountry, isArabic)}
                      </p>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">
                        {isArabic ? 'الدولة' : 'Country'}
                      </label>
                      <div className="relative">
                        <select
                          value={country}
                          onChange={(event) => handleCountryChange(event.target.value)}
                          className={cn(authSelectClassName, styles.authSelect, dir === 'rtl' ? 'pr-10' : 'pl-10')}
                        >
                          {countryOptions.map((item) => (
                            <option key={item.cca2} value={item.cca2}>
                              {`${item.flag || ''} ${getCountryDisplayName(item, isArabic)}`}
                            </option>
                          ))}
                        </select>
                        <Globe className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)] ${dir === 'rtl' ? 'right-3' : 'left-3'}`} />
                      </div>
                      {errors.country && <p className="mt-1.5 text-xs text-[var(--color-error)]">{errors.country}</p>}
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">
                        {isArabic ? 'عملة المحفظة' : 'Wallet currency'}
                      </label>
                      <div className="relative">
                        <select
                          value={currency}
                          onChange={(event) => setCurrency(event.target.value)}
                          disabled={!preferredCurrencyOptions.length}
                          className={cn(authSelectClassName, styles.authSelect, dir === 'rtl' ? 'pr-10' : 'pl-10')}
                        >
                          {!preferredCurrencyOptions.length && (
                            <option value="">{t('auth.noCurrenciesConfigured')}</option>
                          )}
                          {preferredCurrencyOptions.map((item) => (
                            <option key={item.code} value={item.code}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                        <CreditCard className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)] ${dir === 'rtl' ? 'right-3' : 'left-3'}`} />
                      </div>
                      {errors.currency && <p className="mt-1.5 text-xs text-[var(--color-error)]">{errors.currency}</p>}
                    </div>
                  </motion.div>
                ) : isLogin && twoFactorChallenge ? (
                  <motion.div key="login-2fa" {...stepMotion} className={styles.verificationStep}>
                    <div className={styles.successBadge}>
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <h2>المصادقة الثنائية</h2>
                      <p>أدخل كود التحقق المرسل إلى بريدك الإلكتروني لإكمال تسجيل الدخول.</p>
                    </div>
                    <OtpInput value={twoFactorCode} onChange={setTwoFactorCode} disabled={isLoading} />
                  </motion.div>
                ) : isLogin ? (
                  <motion.div key="login" {...stepMotion} className="space-y-4">
                    <Input
                      label={t('auth.email')}
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      icon={<Mail className="h-4 w-4" />}
                      error={errors.email}
                      className={styles.authInput}
                    />

                    <Input
                      label={t('auth.password')}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="********"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      icon={<Lock className="h-4 w-4" />}
                      error={errors.password}
                      className={styles.authInput}
                      suffix={(
                        <button
                          type="button"
                          onClick={() => setShowPassword((previous) => !previous)}
                          className="flex items-center justify-center p-1 text-[var(--color-muted)] transition hover:text-[var(--color-text)]"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      )}
                    />
                  </motion.div>
                ) : registerStep === 1 ? (
                  <StepOne>
                    <Input
                      label={t('auth.fullName')}
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      icon={<User className="h-4 w-4" />}
                      error={errors.name}
                      className={styles.authInput}
                    />

                    <Input
                      label={t('auth.email')}
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      icon={<Mail className="h-4 w-4" />}
                      error={errors.email}
                      className={styles.authInput}
                    />

                    <Input
                      label={t('auth.password')}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="********"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      icon={<Lock className="h-4 w-4" />}
                      error={errors.password}
                      className={styles.authInput}
                      suffix={(
                        <button
                          type="button"
                          onClick={() => setShowPassword((previous) => !previous)}
                          className="flex items-center justify-center p-1 text-[var(--color-muted)] transition hover:text-[var(--color-text)]"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      )}
                    />

                    <Input
                      label={t('auth.confirmPassword')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="********"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      icon={<Lock className="h-4 w-4" />}
                      error={errors.confirmPassword}
                      className={styles.authInput}
                      suffix={(
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((previous) => !previous)}
                          className="flex items-center justify-center p-1 text-[var(--color-muted)] transition hover:text-[var(--color-text)]"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      )}
                    />
                  </StepOne>
                ) : registerStep === 2 ? (
                  <StepTwo>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">
                        {t('auth.country')}
                      </label>
                      <div className="relative">
                        <select
                          value={country}
                          onChange={(event) => handleCountryChange(event.target.value)}
                          className={cn(authSelectClassName, styles.authSelect, dir === 'rtl' ? 'pr-10' : 'pl-10')}
                        >
                          {countryOptions.map((item) => (
                            <option key={item.cca2} value={item.cca2}>
                              {`${item.flag || ''} ${getCountryDisplayName(item, isArabic)}`}
                            </option>
                          ))}
                        </select>
                        <Globe className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)] ${dir === 'rtl' ? 'right-3' : 'left-3'}`} />
                      </div>
                      {errors.country && <p className="mt-1.5 text-xs text-[var(--color-error)]">{errors.country}</p>}
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">
                        {t('auth.currency')}
                      </label>
                      <select
                        value={currency}
                        onChange={(event) => setCurrency(event.target.value)}
                        disabled={!availableCurrencyOptions.length}
                        className={cn(authSelectClassName, styles.authSelect)}
                      >
                        {!preferredCurrencyOptions.length && (
                          <option value="">{t('auth.noCurrenciesConfigured')}</option>
                        )}
                        {preferredCurrencyOptions.map((item) => (
                          <option key={item.code} value={item.code}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                      {errors.currency && <p className="mt-1.5 text-xs text-[var(--color-error)]">{errors.currency}</p>}
                    </div>
                  </StepTwo>
                ) : null}
              </AnimatePresence>

              <AnimatePresence initial={false}>
                {storeError && (
                  <motion.div
                    key={storeError}
                    initial={{ opacity: 0, y: -8, scale: 0.985 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.99 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className={styles.errorBox}
                  >
                    <div className="relative flex items-start gap-3">
                      <span className={styles.errorIcon}>
                        <AlertCircle className="h-4.5 w-4.5" />
                      </span>

                      <div className="min-w-0">
                        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-rose-700/80 dark:text-rose-200/72">
                          {t('auth.errorNotice', {
                            defaultValue: dir === 'rtl' ? 'تنبيه تسجيل' : 'Sign-in notice',
                          })}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-rose-700 dark:text-rose-100/92">
                          {storeError}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {isGoogleSetupMode ? (
                <Button
                  type="submit"
                  className={styles.primaryButton}
                  disabled={isSavingGoogleSetup || !country || !currency}
                >
                  {isSavingGoogleSetup
                    ? (isArabic ? 'جاري الحفظ...' : 'Saving...')
                    : (isArabic ? 'إكمال الدخول' : 'Continue')}
                  {!isSavingGoogleSetup && <ArrowRight className={`h-4 w-4 ${dir === 'rtl' ? 'mr-1 rotate-180' : 'ml-1'}`} />}
                </Button>
              ) : isLogin && twoFactorChallenge ? (
                <div className={styles.stepActions}>
                  <Button
                    type="button"
                    variant="secondary"
                    className={styles.secondaryStepButton}
                    onClick={() => {
                      setTwoFactorChallenge(null);
                      setTwoFactorCode('');
                    }}
                    disabled={isLoading}
                  >
                    رجوع
                  </Button>
                  <Button
                    type="button"
                    className={styles.primaryButton}
                    onClick={handleTwoFactorSubmit}
                    disabled={isLoading || twoFactorCode.length !== 6}
                  >
                    {isLoading ? t('common.loading') : 'تأكيد الدخول'}
                  </Button>
                </div>
              ) : isLogin ? (
                <Button type="submit" className={styles.primaryButton} disabled={isLoading}>
                  {isLoading ? t('common.loading') : t('auth.signIn')}
                  {!isLoading && <ArrowRight className={`h-4 w-4 ${dir === 'rtl' ? 'mr-1 rotate-180' : 'ml-1'}`} />}
                </Button>
              ) : registerStep === 1 ? (
                <Button
                  type="button"
                  className={styles.primaryButton}
                  disabled={!isStepOneReady}
                  onClick={goToRegisterStepTwo}
                >
                  التالي
                  <ArrowRight className={`h-4 w-4 ${dir === 'rtl' ? 'mr-1 rotate-180' : 'ml-1'}`} />
                </Button>
              ) : (
                <div className={styles.stepActions}>
                  <Button
                    type="button"
                    variant="secondary"
                    className={styles.secondaryStepButton}
                    onClick={() => setRegisterStep(1)}
                    disabled={isLoading}
                  >
                    السابق
                  </Button>
                  <Button
                    type="submit"
                    className={styles.primaryButton}
                    disabled={isLoading || !isStepTwoReady}
                  >
                    {isLoading ? t('common.processing') : 'إكمال'}
                    {!isLoading && <ArrowRight className={`h-4 w-4 ${dir === 'rtl' ? 'mr-1 rotate-180' : 'ml-1'}`} />}
                  </Button>
                </div>
              )}

              {!twoFactorChallenge && !isGoogleSetupMode && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                    {t('auth.orContinueWith', {
                      defaultValue: dir === 'rtl' ? 'أو تابع باستخدام' : 'Or continue with',
                    })}
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent via-white/10 to-transparent" />
                </div>

                <motion.button
                  type="button"
                  whileHover={reduceMotion ? undefined : { y: -2, scale: 1.01 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.99 }}
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                  className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-[var(--color-text)] shadow-none backdrop-blur-md transition-all hover:border-purple-500/35 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white shadow-sm">
                    <GoogleMark />
                  </span>
                  <span className="relative">
                    {t('auth.continueWithGoogle', {
                      defaultValue: dir === 'rtl' ? 'المتابعة عبر Google' : 'Continue with Google',
                    })}
                  </span>
                </motion.button>
              </div>
              )}

              {!isGoogleSetupMode && (
              <div className="mt-6 space-y-2 text-center">
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(true)}
                    className="w-full rounded-lg px-4 py-2 text-sm font-medium text-[var(--color-primary)] transition hover:bg-[color:rgb(var(--color-primary-rgb)/0.08)] hover:text-[var(--color-primary-hover)]"
                  >
                    {t('auth.forgotPassword')}
                  </button>
                )}

                <span className="block text-sm text-[var(--color-text-secondary)]">
                  {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}{' '}
                  <button
                    type="button"
                    onClick={toggleMode}
                    className={authLinkClassName}
                  >
                    {isLogin ? t('auth.signUp') : t('auth.signIn')}
                  </button>
                </span>
              </div>
              )}
            </form>
          </section>
        </motion.div>
      </main>

      <Modal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        title={t('auth.forgotPassword')}
        footer={(
          <div className="flex justify-end gap-2">
            <Button onClick={() => setForgotModalOpen(false)} variant="ghost">
              {t('common.cancel')}
            </Button>
            <Button onClick={handleForgotSubmit}>
              {t('common.confirm')}
            </Button>
          </div>
        )}
      >
        <form onSubmit={handleForgotSubmit} className="space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            {t('auth.forgotPasswordDesc')}
          </p>
          <Input
            label={t('auth.email')}
            type="email"
            placeholder="name@example.com"
            value={forgotEmail}
            onChange={(event) => setForgotEmail(event.target.value)}
            icon={<Mail className="h-4 w-4" />}
            autoFocus
          />
        </form>
      </Modal>
    </div>
  );
};

export default Auth;
