import React, { useMemo } from 'react';
import { Shield, AlertCircle } from 'lucide-react';
import TwoFactorCard from '../components/account/TwoFactorCard';
import useAuthStore from '../store/useAuthStore';
import { useLanguage } from '../context/LanguageContext';

const AccountSecurity = () => {
  const { user } = useAuthStore();
  const { language, dir } = useLanguage();
  const isEnglish = language === 'en';
  const isRTL = dir === 'rtl';

  const text = useMemo(
    () =>
      isEnglish
        ? {
            title: 'Account Protection',
            subtitle: 'Manage advanced security settings for your account.',
            securityOverview: 'Security Overview',
            securityHint: 'Keep two-factor authentication enabled to protect your account from unauthorized access.',
          }
        : {
            title: 'حماية الحساب',
            subtitle: 'إدارة إعدادات الأمان المتقدمة الخاصة بحسابك.',
            securityOverview: 'ملخص الأمان',
            securityHint: 'الحفاظ على تفعيل المصادقة الثنائية يساعد في حماية حسابك من الوصول غير المصرح به.',
          },
    [isEnglish]
  );

  return (
    <div className={`compact-ui min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 pb-8 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 sm:pb-10 ${isRTL ? 'rtl' : 'ltr'}`} dir={dir}>
      <div
        className="mx-auto w-full max-w-5xl space-y-3 px-3 sm:px-4 sm:space-y-4"
      >
        {/* Hero Header */}
        <header
          className="relative overflow-hidden rounded-2xl border border-gray-200/50 bg-gradient-to-br from-white via-white/95 to-gray-50/80 p-4 shadow-[0_10px_24px_-18px_rgba(0,0,0,0.16)] backdrop-blur-sm sm:p-5 dark:border-gray-800/50 dark:from-gray-900 dark:via-gray-900/95 dark:to-gray-800/80"
        >
          <div className="absolute inset-0 -z-10">
            <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-br from-blue-200/30 to-transparent blur-3xl dark:from-blue-900/20" />
            <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-gradient-to-br from-purple-200/20 to-transparent blur-3xl dark:from-purple-900/10" />
          </div>

          <div className="relative z-10">
            <div
              className="inline-flex items-center gap-2 rounded-full border border-blue-200/40 bg-gradient-to-r from-blue-50 to-blue-50/50 px-3 py-1.5 text-[11px] font-bold text-blue-700 shadow-sm dark:border-blue-900/40 dark:from-blue-950/50 dark:to-blue-900/30 dark:text-blue-300"
            >
              <Shield className="h-4 w-4" />
              {text.securityOverview}
            </div>

            <h1
              className="mt-3 text-xl font-medium tracking-tight text-gray-950 dark:text-white"
            >
              {text.title}
            </h1>

            <p
              className="mt-2 max-w-2xl text-sm text-gray-400"
            >
              {text.subtitle}
            </p>
          </div>
        </header>

        {/* Security Alert Card */}
        <div
          className="relative overflow-hidden rounded-2xl border border-amber-200/40 bg-gradient-to-br from-amber-50/80 to-orange-50/50 p-3.5 shadow-[0_10px_20px_-16px_rgba(217,119,6,0.22)] sm:p-4 dark:border-amber-900/40 dark:from-amber-950/30 dark:to-orange-950/20 dark:shadow-[0_10px_20px_-16px_rgba(217,119,6,0.12)]"
        >
          <div className="absolute inset-0 -z-10 opacity-30 dark:opacity-20">
            <div className="absolute -top-16 -right-16 h-32 w-32 rounded-full bg-gradient-to-br from-amber-400/40 to-transparent blur-2xl" />
          </div>

          <div className="relative z-10 flex items-start gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-300/50 bg-gradient-to-br from-amber-400/35 to-orange-400/25 text-amber-700 dark:border-amber-700/60 dark:from-amber-900/50 dark:to-orange-900/40 dark:text-amber-300"
            >
              <AlertCircle className="h-4.5 w-4.5" />
            </div>

            <div>
              <h3 className="text-sm font-medium text-amber-950 dark:text-amber-200">
                {text.securityHint}
              </h3>
              <p className="mt-1.5 text-xs text-amber-900/70 dark:text-amber-300/70">
                {isEnglish 
                  ? 'Enable two-factor authentication to add an extra layer of security to your account.'
                  : 'فعّل المصادقة الثنائية لإضافة طبقة أمان إضافية لحسابك.'}
              </p>
            </div>
          </div>
        </div>

        {/* Two-Factor Authentication Card */}
        <div>
          <TwoFactorCard
            userId={user?.id}
            email={String(user?.email || '')}
            twoFactorEnabled={Boolean(user?.twoFactorEnabled ?? user?.isTwoFactorEnabled)}
            emailChangedPending={false}
          />
        </div>
      </div>
    </div>
  );
};

export default AccountSecurity;
