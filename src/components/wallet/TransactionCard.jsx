import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle,
  Clock,
  Copy,
  RefreshCw,
  ShoppingCart,
  XCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../ui/Toast';
import { formatDateTime } from '../../utils/intl';
import { formatWalletAmount } from '../../utils/storefront';

const getTransactionIcon = (type) => {
  switch (type) {
    case 'deposit':
      return ArrowDownLeft;
    case 'withdrawal':
      return ArrowUpRight;
    case 'transfer':
      return RefreshCw;
    case 'purchase':
      return ShoppingCart;
    default:
      return ArrowDownLeft;
  }
};

const getTransactionTone = (type) => {
  switch (type) {
    case 'deposit':
      return {
        cardClass: 'border-green-200/50 bg-gradient-to-br from-green-50/80 via-white/90 to-emerald-50/60 shadow-[0_8px_16px_-6px_rgba(34,197,94,0.12)] dark:border-green-900/40 dark:from-green-950/30 dark:via-gray-900/80 dark:to-green-950/20 dark:shadow-[0_8px_16px_-6px_rgba(34,197,94,0.08)]',
        iconBgClass: 'bg-gradient-to-br from-green-500 to-emerald-500 text-white',
        badgeClass: 'border-green-300/60 bg-gradient-to-r from-green-100/70 to-emerald-100/50 text-green-700 dark:border-green-900/50 dark:from-green-950/40 dark:to-emerald-950/30 dark:text-green-300',
        amountClass: 'text-green-700 dark:text-green-300',
        statusClass: 'text-green-700 dark:text-green-300',
      };
    case 'withdrawal':
      return {
        cardClass: 'border-red-200/50 bg-gradient-to-br from-red-50/80 via-white/90 to-rose-50/60 shadow-[0_8px_16px_-6px_rgba(239,68,68,0.12)] dark:border-red-900/40 dark:from-red-950/30 dark:via-gray-900/80 dark:to-red-950/20 dark:shadow-[0_8px_16px_-6px_rgba(239,68,68,0.08)]',
        iconBgClass: 'bg-gradient-to-br from-red-500 to-rose-500 text-white',
        badgeClass: 'border-red-300/60 bg-gradient-to-r from-red-100/70 to-rose-100/50 text-red-700 dark:border-red-900/50 dark:from-red-950/40 dark:to-rose-950/30 dark:text-red-300',
        amountClass: 'text-red-700 dark:text-red-300',
        statusClass: 'text-red-700 dark:text-red-300',
      };
    case 'transfer':
      return {
        cardClass: 'border-blue-200/50 bg-gradient-to-br from-blue-50/80 via-white/90 to-cyan-50/60 shadow-[0_8px_16px_-6px_rgba(59,130,246,0.12)] dark:border-blue-900/40 dark:from-blue-950/30 dark:via-gray-900/80 dark:to-blue-950/20 dark:shadow-[0_8px_16px_-6px_rgba(59,130,246,0.08)]',
        iconBgClass: 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white',
        badgeClass: 'border-blue-300/60 bg-gradient-to-r from-blue-100/70 to-cyan-100/50 text-blue-700 dark:border-blue-900/50 dark:from-blue-950/40 dark:to-cyan-950/30 dark:text-blue-300',
        amountClass: 'text-blue-700 dark:text-blue-300',
        statusClass: 'text-blue-700 dark:text-blue-300',
      };
    case 'purchase':
      return {
        cardClass: 'border-purple-200/50 bg-gradient-to-br from-purple-50/80 via-white/90 to-pink-50/60 shadow-[0_8px_16px_-6px_rgba(168,85,247,0.12)] dark:border-purple-900/40 dark:from-purple-950/30 dark:via-gray-900/80 dark:to-purple-950/20 dark:shadow-[0_8px_16px_-6px_rgba(168,85,247,0.08)]',
        iconBgClass: 'bg-gradient-to-br from-purple-500 to-pink-500 text-white',
        badgeClass: 'border-purple-300/60 bg-gradient-to-r from-purple-100/70 to-pink-100/50 text-purple-700 dark:border-purple-900/50 dark:from-purple-950/40 dark:to-pink-950/30 dark:text-purple-300',
        amountClass: 'text-purple-700 dark:text-purple-300',
        statusClass: 'text-purple-700 dark:text-purple-300',
      };
    default:
      return {
        cardClass: 'border-gray-200/50 bg-gradient-to-br from-gray-50/80 via-white/90 to-gray-50/60 shadow-[0_8px_16px_-6px_rgba(107,114,128,0.12)] dark:border-gray-800/40 dark:from-gray-950/30 dark:via-gray-900/80 dark:to-gray-950/20 dark:shadow-[0_8px_16px_-6px_rgba(107,114,128,0.08)]',
        iconBgClass: 'bg-gradient-to-br from-gray-500 to-slate-500 text-white',
        badgeClass: 'border-gray-300/60 bg-gradient-to-r from-gray-100/70 to-gray-100/50 text-gray-700 dark:border-gray-800/50 dark:from-gray-950/40 dark:to-gray-900/30 dark:text-gray-300',
        amountClass: 'text-gray-700 dark:text-gray-300',
        statusClass: 'text-gray-700 dark:text-gray-300',
      };
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'completed':
      return CheckCircle;
    case 'failed':
      return XCircle;
    case 'pending':
    default:
      return Clock;
  }
};

const getStatusTone = (status) => {
  switch (status) {
    case 'completed':
      return 'border-green-300/60 bg-gradient-to-r from-green-100/70 to-emerald-100/50 text-green-700 dark:border-green-900/50 dark:from-green-950/40 dark:to-emerald-950/30 dark:text-green-300';
    case 'failed':
      return 'border-red-300/60 bg-gradient-to-r from-red-100/70 to-rose-100/50 text-red-700 dark:border-red-900/50 dark:from-red-950/40 dark:to-rose-950/30 dark:text-red-300';
    case 'pending':
    default:
      return 'border-amber-300/60 bg-gradient-to-r from-amber-100/70 to-yellow-100/50 text-amber-700 dark:border-amber-900/50 dark:from-amber-950/40 dark:to-yellow-950/30 dark:text-amber-300';
  }
};

const TransactionCard = ({ transaction, index }) => {
  const { dir } = useLanguage();
  const { t, i18n } = useTranslation();
  const { addToast } = useToast();
  const isRTL = dir === 'rtl';
  const locale = String(i18n.resolvedLanguage || i18n.language || 'ar').toLowerCase().startsWith('en')
    ? 'en-US'
    : 'ar-EG';

  const statusLabelKey = `wallet.status${transaction.status?.charAt(0)?.toUpperCase() || ''}${transaction.status?.slice(1) || ''}`;
  const typeLabelKey = `wallet.type${transaction.type?.charAt(0)?.toUpperCase() || ''}${transaction.type?.slice(1) || ''}`;
  const rawDescription = transaction.descriptionKey
    ? t(transaction.descriptionKey)
    : (transaction.description ?? transaction.type);
  const transactionDescription = (() => {
    if (rawDescription === null || rawDescription === undefined) return '';
    if (typeof rawDescription === 'string' || typeof rawDescription === 'number') return String(rawDescription);
    if (typeof rawDescription === 'object') {
      const picked = rawDescription?.label || rawDescription?.title || rawDescription?.name || rawDescription?.text || '';
      return String(picked || '');
    }
    return String(rawDescription);
  })();
  const originalCurrency = String(transaction.originalCurrency || '').trim().toUpperCase();
  const currentCurrency = String(transaction.currentCurrency || '').trim().toUpperCase();
  const showOriginalCurrency = Boolean(originalCurrency) && originalCurrency !== currentCurrency;
  const originalAmount = Number(transaction.originalAmount);
  const showOriginalAmount = showOriginalCurrency && Number.isFinite(originalAmount) && originalAmount > 0;
  const hasBalanceSnapshot = transaction?.balanceBefore !== null
    && transaction?.balanceBefore !== undefined
    && transaction?.balanceAfter !== null
    && transaction?.balanceAfter !== undefined;

  const Icon = getTransactionIcon(transaction.type);
  const StatusIcon = getStatusIcon(transaction.status);
  const tone = getTransactionTone(transaction.type);

  const referenceText = (() => {
    const value = transaction?.reference;
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number') return String(value).trim();

    if (typeof value === 'object') {
      const candidate =
        value?.reference
        || value?.referenceId
        || value?.orderNumber
        || value?.siteOrderNumber
        || value?._id
        || value?.id
        || '';
      return String(candidate || '').trim();
    }

    return String(value).trim();
  })();

  const handleCopyReference = async () => {
    const value = referenceText;
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      addToast(t('wallet.transactionNumberCopied', { defaultValue: 'Transaction number copied' }), 'success');
    } catch (_error) {
      addToast(t('wallet.copyTransactionNumberFailed', { defaultValue: 'Unable to copy transaction number' }), 'error');
    }
  };

  return (
    <motion.div
      initial={{ x: isRTL ? 50 : -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      whileHover={{ y: -2, scale: 1.005 }}
      className={`group relative overflow-hidden rounded-[18px] border transition-all sm:rounded-[20px] ${tone.cardClass}`}
    >
      {/* Background decorations */}
      <div className="absolute inset-0 -z-10">
        <div className={`absolute -top-20 -right-20 h-40 w-40 rounded-full opacity-30 blur-2xl ${
          transaction.type === 'deposit' ? 'bg-gradient-to-br from-green-200 to-transparent' :
          transaction.type === 'withdrawal' ? 'bg-gradient-to-br from-red-200 to-transparent' :
          transaction.type === 'transfer' ? 'bg-gradient-to-br from-blue-200 to-transparent' :
          'bg-gradient-to-br from-purple-200 to-transparent'
        }`} />
      </div>

      <div className={`relative z-10 flex items-center gap-2.5 p-2.5 sm:p-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
        {/* Icon */}
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border border-white/20 shadow-lg sm:h-8 sm:w-8 sm:rounded-[8px] ${tone.iconBgClass}`}>
          <Icon className="h-4 w-4 sm:h-4 sm:w-4" />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Header Row */}
          <div className={`flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between ${isRTL ? 'text-right' : 'text-left'}`}>
            <div className="min-w-0 flex-1">
              <h4 className="line-clamp-1 text-xs font-bold text-gray-900 dark:text-white sm:text-sm">
                {transactionDescription}
              </h4>
              <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400 sm:text-xs">
                {formatDateTime(transaction.date, locale, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            {/* Type & Status Badges */}
            <div className={`flex flex-wrap items-center gap-2 ${isRTL ? 'justify-end' : 'justify-start'} sm:justify-end`}>
              <motion.span
                whileHover={{ scale: 1.05 }}
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold transition-all sm:text-xs ${tone.badgeClass}`}
              >
                {t(typeLabelKey, { defaultValue: transaction.type })}
              </motion.span>
              <motion.span
                whileHover={{ scale: 1.05 }}
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold transition-all sm:text-xs ${getStatusTone(transaction.status)}`}
              >
                <StatusIcon className="h-2.5 w-2.5 sm:h-2.5 sm:w-2.5" />
                {t(statusLabelKey, { defaultValue: transaction.status })}
              </motion.span>
            </div>
          </div>

          {/* Amount & Details Row */}
          <div className={`mt-1.5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between`}>
            <div className="text-xs text-gray-600 dark:text-gray-400 sm:text-xs">
              {hasBalanceSnapshot ? (
                <div className={`inline-flex items-center gap-1 rounded-lg border border-gray-200/60 bg-white/50 px-2 py-0.5 text-xs font-semibold backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-900/50 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-red-600 line-through dark:text-red-400">
                    {formatWalletAmount(transaction.balanceBefore, transaction.currency)}
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className="text-green-600 dark:text-green-400">
                    {formatWalletAmount(transaction.balanceAfter, transaction.currency)}
                  </span>
                </div>
              ) : null}
            </div>

            <div className={`text-sm font-black [direction:ltr] sm:text-base ${tone.amountClass}`}>
              {formatWalletAmount(transaction.amount, transaction.currency, { signed: true })}
            </div>
          </div>

          {/* Additional Info */}
          {(referenceText || showOriginalCurrency) && (
            <div className={`mt-1.5 flex flex-wrap items-center gap-1 ${isRTL ? 'justify-end' : 'justify-start'}`}>
              {referenceText && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleCopyReference}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200/60 bg-white/50 px-2 py-0.5 text-xs font-semibold text-gray-700 transition-all hover:border-gray-300/80 hover:bg-white/70 dark:border-gray-700/60 dark:bg-gray-900/50 dark:text-gray-300 dark:hover:border-gray-600/80 dark:hover:bg-gray-900/70"
                  title={t('wallet.copyTransactionNumber', { defaultValue: 'Copy transaction number' })}
                >
                  <span>{t('wallet.reference')}: {referenceText}</span>
                  <Copy className="h-2.5 w-2.5 sm:h-2.5 sm:w-2.5" />
                </motion.button>
              )}

              {showOriginalCurrency && (
                <div className="inline-flex items-center gap-1 rounded-lg border border-cyan-200/60 bg-gradient-to-r from-cyan-100/40 to-blue-100/30 px-2 py-1 text-xs font-semibold text-cyan-700 dark:border-cyan-900/50 dark:from-cyan-950/40 dark:to-blue-950/30 dark:text-cyan-300">
                  {showOriginalAmount
                    ? `${isRTL ? 'المبلغ المدفوع' : 'Paid'}: ${formatWalletAmount(originalAmount, originalCurrency)}`
                    : `${t('wallet.executionCurrency', { defaultValue: 'Currency at execution' })}: ${originalCurrency}`}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default TransactionCard;
