import React, { useMemo } from 'react';
import { Shield, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
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
            whyMatters: 'Why Account Security Matters',
            protection: 'Account Protection',
            protectionDesc: 'Your account contains sensitive information and financial data. Enabling security features helps prevent unauthorized access.',
            dataPrivacy: 'Data Privacy',
            dataPrivacyDesc: 'Control how your personal information is used and protect it from third-party access.',
            monitoring: 'Activity Monitoring',
            monitoringDesc: 'Monitor your account activity and get alerts about unusual login attempts.',
          }
        : {
            title: 'حماية الحساب',
            subtitle: 'إدارة إعدادات الأمان المتقدمة الخاصة بحسابك.',
            securityOverview: 'ملخص الأمان',
            securityHint: 'الحفاظ على تفعيل المصادقة الثنائية يساعد في حماية حسابك من الوصول غير المصرح به.',
            whyMatters: 'لماذا يهم أمان الحساب',
            protection: 'حماية الحساب',
            protectionDesc: 'يحتوي حسابك على معلومات حساسة وبيانات مالية. تفعيل ميزات الأمان يساعد في منع الوصول غير المصرح به.',
            dataPrivacy: 'خصوصية البيانات',
            dataPrivacyDesc: 'تحكم في كيفية استخدام معلوماتك الشخصية وحمايتها من الوصول من طرف ثالث.',
            monitoring: 'مراقبة النشاط',
            monitoringDesc: 'راقب نشاط حسابك واحصل على تنبيهات حول محاولات تسجيل دخول غير عادية.',
          },
    [isEnglish]
  );

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 pb-12 sm:pb-16 ${isRTL ? 'rtl' : 'ltr'}`} dir={dir}>
      <div
        className="mx-auto w-full max-w-5xl space-y-6 px-3 sm:px-4 sm:space-y-8"
      >
        {/* Hero Header */}
        <header
          className="relative overflow-hidden rounded-[32px] border border-gray-200/60 bg-gradient-to-br from-white via-white/95 to-gray-50/80 p-8 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.08)] backdrop-blur-sm sm:p-10 dark:border-gray-800/60 dark:from-gray-900 dark:via-gray-900/95 dark:to-gray-800/80"
        >
          <div className="absolute inset-0 -z-10">
            <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-br from-blue-200/30 to-transparent blur-3xl dark:from-blue-900/20" />
            <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-gradient-to-br from-purple-200/20 to-transparent blur-3xl dark:from-purple-900/10" />
          </div>

          <div className="relative z-10">
            <div
              className="inline-flex items-center gap-3 rounded-full border border-blue-200/50 bg-gradient-to-r from-blue-50 to-blue-50/50 px-4 py-2 text-xs font-bold text-blue-700 shadow-sm dark:border-blue-900/40 dark:from-blue-950/50 dark:to-blue-900/30 dark:text-blue-300"
            >
              <Shield className="h-4 w-4" />
              {text.securityOverview}
            </div>

            <h1
              className="mt-4 text-4xl font-black tracking-tight text-gray-950 sm:text-5xl dark:text-white"
            >
              {text.title}
            </h1>

            <p
              className="mt-3 max-w-2xl text-lg font-medium text-gray-600 dark:text-gray-300"
            >
              {text.subtitle}
            </p>
          </div>
        </header>

        {/* Security Alert Card */}
        <div
          className="relative overflow-hidden rounded-[28px] border border-amber-200/50 bg-gradient-to-br from-amber-50/80 to-orange-50/50 p-6 shadow-[0_12px_24px_-8px_rgba(217,119,6,0.1)] sm:p-8 dark:border-amber-900/40 dark:from-amber-950/30 dark:to-orange-950/20 dark:shadow-[0_12px_24px_-8px_rgba(217,119,6,0.05)]"
        >
          <div className="absolute inset-0 -z-10 opacity-30 dark:opacity-20">
            <div className="absolute -top-16 -right-16 h-32 w-32 rounded-full bg-gradient-to-br from-amber-400/40 to-transparent blur-2xl" />
          </div>

          <div className="relative z-10 flex items-start gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-amber-300/60 bg-gradient-to-br from-amber-400/40 to-orange-400/30 text-amber-700 dark:border-amber-700/60 dark:from-amber-900/50 dark:to-orange-900/40 dark:text-amber-300"
            >
              <AlertCircle className="h-6 w-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-amber-950 dark:text-amber-200">
                {text.securityHint}
              </h3>
              <p className="mt-2 text-sm font-medium text-amber-900/70 dark:text-amber-300/70">
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

        {/* Security Features Grid */}
        <section>
          <h2 className={`mb-6 text-2xl font-bold text-gray-950 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
            {text.whyMatters}
          </h2>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: Lock,
                title: text.protection,
                desc: text.protectionDesc,
                color: 'from-blue-500 to-cyan-500',
              },
              {
                icon: Shield,
                title: text.dataPrivacy,
                desc: text.dataPrivacyDesc,
                color: 'from-purple-500 to-pink-500',
              },
              {
                icon: CheckCircle2,
                title: text.monitoring,
                desc: text.monitoringDesc,
                color: 'from-green-500 to-emerald-500',
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="relative overflow-hidden rounded-[24px] border border-gray-200/50 bg-gradient-to-br from-white/80 to-gray-50/60 p-6 shadow-[0_8px_16px_-6px_rgba(0,0,0,0.06)] dark:border-gray-800/50 dark:from-gray-900/60 dark:to-gray-800/60"
              >
                <div className="absolute inset-0 -z-10 opacity-5">
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color}`} />
                </div>

                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${feature.color} text-white shadow-lg`}
                >
                  <feature.icon className="h-6 w-6" />
                </div>

                <h3 className="mt-4 text-lg font-bold text-gray-950 dark:text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AccountSecurity;
