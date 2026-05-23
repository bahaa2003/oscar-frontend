import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';

const StatsCard = ({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  delay = 0,
  iconClass = 'text-orange-500 dark:text-orange-400',
  iconWrapClass = 'bg-gradient-to-br from-orange-400/20 to-pink-500/20',
  changeIconClass = '',
}) => {
  const { dir } = useLanguage();
  const isRTL = dir === 'rtl';
  const changeToneClass = changeType === 'positive'
    ? 'text-[#5f7f2a] dark:text-[#c9dd8c]'
    : 'text-[#a24a4a] dark:text-[#f0b6a8]';

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay }}
      className="group relative overflow-hidden rounded-[0.9rem] border border-[#d8c29a]/78 bg-[linear-gradient(170deg,rgba(255,252,244,0.96),rgba(255,247,229,0.9)_58%,rgba(241,221,181,0.78)_100%)] p-1.75 shadow-[0_14px_26px_-24px_rgba(97,72,22,0.58)] backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-[#cda45b]/80 hover:shadow-[0_20px_32px_-26px_rgba(97,72,22,0.68)] dark:border-[#5f4f2f]/68 dark:bg-[linear-gradient(170deg,rgba(42,34,20,0.96),rgba(28,23,16,0.92)_56%,rgba(52,39,17,0.86)_100%)] dark:hover:bg-[linear-gradient(170deg,rgba(49,40,24,0.98),rgba(32,26,18,0.94)_56%,rgba(62,47,20,0.9)_100%)] sm:p-2"
    >
      <div className="pointer-events-none absolute right-0 top-0 h-12 w-12 rounded-bl-[1.5rem] bg-[radial-gradient(circle_at_top_right,rgba(255,226,154,0.48),transparent_68%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(214,166,76,0.22),transparent_68%)]" />
      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div>
          <p className="mb-0.5 text-[8px] font-semibold text-[#74511c] dark:text-[#dfc993] sm:text-[9px]">{title}</p>
          <p className="text-[12px] font-black tracking-[-0.02em] text-[#261705] dark:text-[#fff4d7] sm:text-[0.9rem]">{value}</p>
          {change && (
            <div className={`wallet-accent-chip mt-1 px-1.5 py-0.5 text-[7px] font-semibold sm:px-2 sm:text-[8px] ${isRTL ? 'flex-row-reverse' : ''}`}>
              {changeType === 'positive' ? (
                <TrendingUp className={`h-3 w-3 ${changeIconClass || changeToneClass}`} />
              ) : (
                <TrendingDown className={`h-3 w-3 ${changeIconClass || changeToneClass}`} />
              )}
              <span className={changeToneClass}>{change}</span>
            </div>
          )}
        </div>
        <div className={`flex h-6.5 w-6.5 items-center justify-center rounded-[0.75rem] sm:h-7 sm:w-7 ${iconWrapClass}`}>
          <Icon className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${iconClass}`} />
        </div>
      </div>
    </motion.div>
  );
};

const StatsCards = ({ stats }) => {
  const { t } = useTranslation();

  return (
    <div className="mb-6 grid grid-cols-2 gap-2 sm:gap-2.5 lg:grid-cols-4">
      <StatsCard
        title={t('wallet.totalDeposits')}
        value={stats.totalDeposits}
        change="+12%"
        changeType="positive"
        icon={TrendingUp}
        iconClass="text-[#7a5418] dark:text-[#ffdc8c]"
        iconWrapClass="border border-[#d2ad67]/68 bg-[linear-gradient(180deg,rgba(255,245,214,0.98),rgba(233,197,124,0.72))] dark:border-[#8f7236]/70 dark:bg-[linear-gradient(180deg,rgba(112,82,28,0.62),rgba(68,48,18,0.7))]"
        changeIconClass="text-[#7a5418] dark:text-[#ffdc8c]"
        delay={0.3}
      />
      <StatsCard
        title={t('wallet.totalSpent')}
        value={stats.totalSpent}
        change="-8%"
        changeType="negative"
        icon={TrendingDown}
        iconClass="text-[#7a5418] dark:text-[#ffdc8c]"
        iconWrapClass="border border-[#d2ad67]/68 bg-[linear-gradient(180deg,rgba(255,245,214,0.98),rgba(233,197,124,0.72))] dark:border-[#8f7236]/70 dark:bg-[linear-gradient(180deg,rgba(112,82,28,0.62),rgba(68,48,18,0.7))]"
        changeIconClass="text-[#7a5418] dark:text-[#ffdc8c]"
        delay={0.4}
      />
      <StatsCard
        title={t('wallet.netBalance')}
        value={stats.netBalance}
        change="+4%"
        changeType="positive"
        icon={DollarSign}
        iconClass="text-[#7a5418] dark:text-[#ffdc8c]"
        iconWrapClass="border border-[#d2ad67]/68 bg-[linear-gradient(180deg,rgba(255,245,214,0.98),rgba(233,197,124,0.72))] dark:border-[#8f7236]/70 dark:bg-[linear-gradient(180deg,rgba(112,82,28,0.62),rgba(68,48,18,0.7))]"
        changeIconClass="text-[#7a5418] dark:text-[#ffdc8c]"
        delay={0.5}
      />
      <StatsCard
        title={t('wallet.totalTransactions')}
        value={stats.totalTransactions}
        icon={Activity}
        iconClass="text-[#7a5418] dark:text-[#ffdc8c]"
        iconWrapClass="border border-[#d2ad67]/68 bg-[linear-gradient(180deg,rgba(255,245,214,0.98),rgba(233,197,124,0.72))] dark:border-[#8f7236]/70 dark:bg-[linear-gradient(180deg,rgba(112,82,28,0.62),rgba(68,48,18,0.7))]"
        delay={0.6}
      />
    </div>
  );
};

export default StatsCards;
