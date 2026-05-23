import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, CreditCard, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';
import { formatWalletAmount } from '../../utils/storefront';

const BalanceCard = ({ balance, currency, secondaryBalance, secondaryCurrency, onAddBalance }) => {
  const { dir } = useLanguage();
  const { t } = useTranslation();
  const isRTL = dir === 'rtl';
  const isNegativeBalance = Number(balance) < 0;
  const primaryBalance = formatWalletAmount(balance, currency || 'USD');
  const approxBalance = Number.isFinite(Number(secondaryBalance))
    ? formatWalletAmount(secondaryBalance, secondaryCurrency || 'USD')
    : null;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="sidebar-wallet-shimmer relative isolate overflow-hidden rounded-[28px] border-2 border-[#d8b66e]/70 bg-[linear-gradient(135deg,#56370d_0%,#8f621b_48%,#d8ab55_100%)] p-8 shadow-[0_22px_42px_-28px_rgba(86,55,13,0.82)] before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_right,rgba(255,247,220,0.34),transparent_46%)] before:opacity-90 dark:border-[#8f7236]/72 dark:bg-[linear-gradient(135deg,#17120a_0%,#3d2b13_48%,#9d762c_100%)] sm:p-10"
    >
      <div className="relative z-10 space-y-5">
        <div className={`flex items-center justify-between gap-5 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold tracking-[0.12em] text-[#ffe8a9] sm:text-sm">
              {t('wallet.currentBalance')}
            </p>
            <p className="mt-1.5 text-sm font-medium text-[#fff7df] sm:text-base">{t('wallet.balanceAvailable')}</p>
          </div>

          <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] border border-[#f7d997]/48 bg-[linear-gradient(180deg,rgba(255,246,219,0.28),rgba(255,218,135,0.18))] text-[#fff2c7] shadow-[inset_0_1px_0_rgba(255,255,255,0.24)]">
            <Wallet className="h-8 w-8" />
          </span>
        </div>

        <div className={`${isRTL ? 'text-right' : 'text-left'}`}>
          <div className={`wallet-page-balance-value truncate text-3xl font-black leading-none tracking-[-0.02em] sm:text-4xl md:text-5xl lg:text-6xl ${isNegativeBalance ? 'is-negative text-[#ffb4b4]' : 'text-[#fff8e8]'}`}>
            {primaryBalance}
          </div>
          {approxBalance && (
            <div className={`mt-3 inline-flex rounded-full px-4 py-1.5 text-sm font-semibold sm:text-base ${
              isNegativeBalance
                ? 'border border-[#f0aaaa]/42 bg-[linear-gradient(180deg,rgba(255,210,210,0.14),rgba(167,35,35,0.18))] text-[#ffd1d1]'
                : 'border border-[#f7d997]/42 bg-[linear-gradient(180deg,rgba(255,239,194,0.2),rgba(189,133,35,0.22))] text-[#fff0bd]'
            }`}>
              ~ {approxBalance}
            </div>
          )}
        </div>

        <div className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
          <div className={`flex flex-wrap items-center gap-2.5 ${isRTL ? 'justify-end' : 'justify-start'}`}>
            <span className={`inline-flex items-center gap-2 rounded-full border border-[#f0d395]/45 bg-[linear-gradient(180deg,rgba(255,245,213,0.24),rgba(172,121,35,0.2))] px-4 py-1.5 text-sm font-semibold text-[#fff2c8] sm:text-base ${isRTL ? 'flex-row-reverse' : ''}`}>
              <CreditCard className="h-5 w-5" />
              {isRTL ? 'محفظة نشطة' : 'Active wallet'}
            </span>
            <span className="inline-flex items-center rounded-full border border-[#f0d395]/38 bg-[linear-gradient(180deg,rgba(255,245,213,0.18),rgba(172,121,35,0.18))] px-4 py-1.5 text-sm font-semibold text-[#fff2c8] sm:text-base">
              {isRTL ? 'تحويل فوري' : 'Instant updates'}
            </span>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAddBalance}
            className="inline-flex h-13 shrink-0 items-center justify-center gap-2.5 rounded-[16px] border border-[color:rgb(var(--color-primary-rgb)/0.42)] bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-soft)_54%,var(--color-primary-hover))] px-5 text-base font-bold text-[var(--color-button-text)] shadow-[0_12px_22px_-16px_rgba(37,23,4,0.9)] transition-all hover:-translate-y-0.5 hover:brightness-[1.03] sm:min-w-[10.5rem]"
          >
            <ArrowUpRight className="h-5 w-5" />
            {t('wallet.addBalance')}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default BalanceCard;
