import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';

const EmptyTransactions = ({ onAddBalance }) => {
  const { t } = useTranslation();
  const { dir } = useLanguage();
  const isRTL = dir === 'rtl';

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.8 }}
      className="rounded-xl border border-[#e1cfaa]/60 bg-[linear-gradient(170deg,rgba(255,255,255,0.86),rgba(255,249,236,0.72)_56%,rgba(236,245,245,0.58)_100%)] px-3 py-5 text-center shadow-[0_14px_24px_-22px_rgba(98,71,22,0.38)] dark:border-[#5f4f2f]/60 dark:bg-[linear-gradient(170deg,rgba(39,34,25,0.94),rgba(29,25,20,0.9)_56%,rgba(24,35,35,0.82)_100%)] sm:px-4 sm:py-6"
    >
      <div className="relative mb-3">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[linear-gradient(180deg,rgba(255,241,205,0.84),rgba(231,244,242,0.66))] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
          <FileText className="h-5 w-5 text-[var(--color-primary)]" />
        </div>
      </div>

      <h3 className="mb-1 text-sm font-bold text-[#3f2d11] dark:text-[#fff5dd] sm:text-base">{t('wallet.noTransactionsYet')}</h3>
      <p className="mx-auto mb-3 max-w-sm text-xs leading-5 text-[var(--color-text-secondary)]">{t('wallet.noTransactionsDescription')}</p>

      <div className={`mb-3 flex flex-wrap items-center gap-1.5 ${isRTL ? 'justify-center flex-row-reverse' : 'justify-center'}`}>
        <span className="rounded-full border border-[color:rgb(var(--color-primary-rgb)/0.32)] bg-[color:rgb(var(--color-card-rgb)/0.75)] px-2.5 py-0.5 text-[10px] font-semibold text-[var(--color-primary)]">
          {isRTL ? 'ابدأ بأول عملية شحن' : 'Start with your first top-up'}
        </span>
        <span className="rounded-full border border-[#d2dfdc]/85 bg-white/75 px-2.5 py-0.5 text-[10px] font-semibold text-[#4d786e] dark:border-[#4c6864]/70 dark:bg-[#263938]/75 dark:text-[#b3ded7]">
          {isRTL ? 'تتبع كل الحركات هنا' : 'Track all transactions here'}
        </span>
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onAddBalance}
        className={`mx-auto flex h-9 items-center gap-1.5 rounded-[11px] border border-[#bc8f39]/80 bg-[linear-gradient(180deg,#e2be79,#c29037)] px-4 text-xs font-semibold text-white shadow-[0_10px_20px_-16px_rgba(111,78,20,0.78)] transition-all hover:-translate-y-0.5 hover:brightness-[1.03] ${isRTL ? 'flex-row-reverse' : ''}`}
      >
        <Plus className="h-4 w-4" />
        {t('wallet.addBalanceNow')}
      </motion.button>
    </motion.div>
  );
};

export default EmptyTransactions;
