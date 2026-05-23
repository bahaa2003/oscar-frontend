import React from 'react';
import { motion } from 'framer-motion';
import { Radio, ShieldCheck, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';
import { cn } from '../ui/Button';
import BrandMark from '../layout/BrandMark';
import AuthSocialTubesScene from './AuthSocialTubesScene';

const AuthHeroVisual = ({ mode = 'login' }) => {
  const { dir } = useLanguage();
  const { t } = useTranslation();
  const isLogin = mode === 'login';

  const featureItems = isLogin
    ? [
        {
          icon: Radio,
          label: t('auth.hero.featureLive', {
            defaultValue: dir === 'rtl' ? 'سوشيال ولايف' : 'Social and live',
          }),
        },
        {
          icon: ShieldCheck,
          label: t('auth.hero.featureSecure', {
            defaultValue: dir === 'rtl' ? 'وصول موثوق' : 'Trusted access',
          }),
        },
        {
          icon: Sparkles,
          label: t('auth.hero.featureGold', {
            defaultValue: dir === 'rtl' ? 'دخول فاخر' : 'Premium entry',
          }),
        },
      ]
    : [
        {
          icon: Radio,
          label: t('auth.hero.featureLive', {
            defaultValue: dir === 'rtl' ? 'انطلاقة حديثة' : 'Modern onboarding',
          }),
        },
        {
          icon: ShieldCheck,
          label: t('auth.hero.featureSecure', {
            defaultValue: dir === 'rtl' ? 'اعتماد وإتاحة' : 'Approval and access',
          }),
        },
        {
          icon: Sparkles,
          label: t('auth.hero.featureGold', {
            defaultValue: dir === 'rtl' ? 'هوية OSCAR STORE' : 'OSCAR STORE identity',
          }),
        },
      ];

  return (
    <motion.section
      initial={{ opacity: 0, x: dir === 'rtl' ? 22 : -22 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={cn(
        'relative w-full overflow-hidden rounded-[1.1rem] border shadow-[0_24px_58px_-36px_rgba(139,112,45,0.22),0_18px_42px_-30px_rgba(23,23,23,0.1)] sm:rounded-[1.55rem] dark:shadow-[0_28px_72px_-42px_rgba(0,0,0,0.9),0_20px_56px_-36px_rgba(34,211,238,0.14)] lg:rounded-[2rem] lg:dark:shadow-[0_36px_100px_-42px_rgba(0,0,0,0.92),0_24px_72px_-36px_rgba(34,211,238,0.16)]',
        'border-[color:rgb(var(--color-primary-rgb)/0.2)] bg-[radial-gradient(circle_at_top_right,rgba(125,249,255,0.24),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.18),transparent_36%),linear-gradient(180deg,rgba(255,250,241,0.98),rgba(241,231,211,0.97))] dark:border-[color:rgb(var(--color-primary-rgb)/0.16)] dark:bg-[radial-gradient(circle_at_top_right,rgba(125,249,255,0.15),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.12),transparent_34%),linear-gradient(180deg,#11131a_0%,#0a0b0d_100%)]'
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.34)_0%,transparent_34%,rgba(125,249,255,0.08)_100%)] dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.03)_0%,transparent_34%,rgba(125,249,255,0.04)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(125,249,255,0.38),transparent)]" />

      <div className="relative z-10 flex h-full flex-col gap-3 p-2.5 sm:gap-4 sm:p-4 lg:min-h-[33rem] lg:justify-between lg:gap-6 lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:rgb(var(--color-primary-rgb)/0.2)] bg-[rgba(255,250,241,0.84)] px-2.5 py-1.5 text-[var(--color-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.36)] backdrop-blur-xl dark:border-[color:rgb(var(--color-primary-rgb)/0.16)] dark:bg-[rgba(15,17,22,0.72)] dark:text-[#f8f1da] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:gap-2.5 sm:px-3 sm:py-1.5">
            <BrandMark size="sm" showCaption={false} />
            <span className="rounded-full border border-[color:rgb(var(--color-primary-rgb)/0.2)] bg-[color:rgb(var(--color-primary-rgb)/0.12)] px-1.5 py-0.5 text-[0.5rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)] dark:border-[color:rgb(var(--color-primary-rgb)/0.18)] dark:bg-[color:rgb(var(--color-primary-rgb)/0.08)] dark:text-[#7df9ff] sm:px-2 sm:text-[0.55rem] lg:px-2.5 lg:py-1 lg:text-[0.62rem]">
              Store
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-[color:rgb(var(--color-primary-rgb)/0.18)] bg-[rgba(255,248,236,0.8)] px-2 py-1.5 text-[0.62rem] font-medium text-[var(--color-text-secondary)] backdrop-blur-lg dark:border-[color:rgb(var(--color-primary-rgb)/0.14)] dark:bg-[rgba(8,10,14,0.62)] dark:text-[#f8f1da]/75 sm:gap-2 sm:px-2.5 sm:text-[0.68rem] lg:px-3.5 lg:py-2 lg:text-xs">
            <ShieldCheck className="h-3 w-3 text-[var(--color-primary)] dark:text-[#7df9ff] sm:h-3.5 sm:w-3.5" />
            {t('auth.hero.premiumNote', {
              defaultValue: dir === 'rtl' ? 'تصميم هادئ وسريع' : 'Calm and fast by design',
            })}
          </div>
        </div>

        <div className="grid gap-3 sm:gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(18rem,1fr)] lg:items-end lg:gap-7">
          <div className="max-w-xl">
            <div className="mt-0 flex flex-wrap gap-1.5 sm:gap-2 lg:gap-3">
              {featureItems.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[color:rgb(var(--color-primary-rgb)/0.16)] bg-[rgba(255,248,236,0.82)] px-2 py-1.5 text-[0.62rem] font-medium text-[var(--color-text-secondary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] dark:border-[color:rgb(var(--color-primary-rgb)/0.12)] dark:bg-[rgba(15,17,22,0.68)] dark:text-[#f8f1da]/78 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] sm:gap-2 sm:px-2.5 sm:py-1.5 sm:text-[0.68rem] lg:px-3.5 lg:py-2 lg:text-xs"
                >
                  <Icon className="h-3 w-3 text-[var(--color-primary)] dark:text-[#7df9ff] sm:h-3.5 sm:w-3.5" />
                  {label}
                </div>
              ))}
            </div>
          </div>

          <AuthSocialTubesScene mode={mode} className="w-full" />
        </div>
      </div>
    </motion.section>
  );
};

export default AuthHeroVisual;
