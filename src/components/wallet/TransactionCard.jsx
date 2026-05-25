import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  RefreshCw,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../ui/Toast';
import { formatDateTime } from '../../utils/intl';
import { formatWalletAmount } from '../../utils/storefront';

const isCreditTransaction = (transaction = {}) => {
  const type = String(transaction.type || '').toLowerCase();
  const amount = Number(transaction.amount);

  if (['deposit', 'credit', 'refund', 'topup', 'top_up'].includes(type)) return true;
  if (['purchase', 'withdrawal', 'debit', 'deduction', 'order'].includes(type)) return false;
  return Number.isFinite(amount) ? amount >= 0 : true;
};

const getTransactionVisual = (transaction = {}) => {
  const type = String(transaction.type || '').toLowerCase();
  const isCredit = isCreditTransaction(transaction);

  if (type === 'transfer') {
    return {
      Icon: RefreshCw,
      iconClassName: 'bg-cyan-500/12 text-cyan-600 dark:text-cyan-300',
      amountClassName: isCredit ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300',
    };
  }

  return {
    Icon: isCredit ? ArrowDownLeft : ArrowUpRight,
    iconClassName: isCredit
      ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300'
      : 'bg-rose-500/12 text-rose-600 dark:text-rose-300',
    amountClassName: isCredit
      ? 'text-emerald-600 dark:text-emerald-300'
      : 'text-rose-600 dark:text-rose-300',
  };
};

const normalizeDescription = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    return String(value.label || value.title || value.name || value.text || '');
  }
  return String(value);
};

const resolveReferenceText = (reference) => {
  if (reference === null || reference === undefined) return '';
  if (typeof reference === 'string' || typeof reference === 'number') return String(reference).trim();
  if (typeof reference === 'object') {
    return String(
      reference.reference
      || reference.referenceId
      || reference.orderNumber
      || reference.siteOrderNumber
      || reference._id
      || reference.id
      || ''
    ).trim();
  }
  return String(reference).trim();
};

const TransactionCard = ({ transaction, index }) => {
  const { dir } = useLanguage();
  const { t, i18n } = useTranslation();
  const { addToast } = useToast();
  const isRTL = dir === 'rtl';
  const locale = String(i18n.resolvedLanguage || i18n.language || 'ar').toLowerCase().startsWith('en')
    ? 'en-US'
    : 'ar-EG';

  const rawDescription = transaction.descriptionKey
    ? t(transaction.descriptionKey)
    : (transaction.description ?? transaction.type);
  const transactionDescription = normalizeDescription(rawDescription)
    || t('wallet.transaction', { defaultValue: 'Transaction' });
  const referenceText = resolveReferenceText(transaction.reference);
  const hasBalanceSnapshot = transaction?.balanceBefore !== null
    && transaction?.balanceBefore !== undefined
    && transaction?.balanceAfter !== null
    && transaction?.balanceAfter !== undefined;
  const originalCurrency = String(transaction.originalCurrency || '').trim().toUpperCase();
  const currentCurrency = String(transaction.currentCurrency || transaction.currency || '').trim().toUpperCase();
  const showOriginalCurrency = Boolean(originalCurrency) && originalCurrency !== currentCurrency;
  const originalAmount = Number(transaction.originalAmount);
  const showOriginalAmount = showOriginalCurrency && Number.isFinite(originalAmount) && originalAmount > 0;
  const { Icon, iconClassName, amountClassName } = getTransactionVisual(transaction);

  const handleCopyReference = async (event) => {
    event.stopPropagation();
    if (!referenceText) return;

    try {
      await navigator.clipboard.writeText(referenceText);
      addToast(t('wallet.transactionNumberCopied', { defaultValue: 'Transaction number copied' }), 'success');
    } catch (_error) {
      addToast(t('wallet.copyTransactionNumberFailed', { defaultValue: 'Unable to copy transaction number' }), 'error');
    }
  };

  return (
    <motion.article
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.025, 0.18) }}
      dir={isRTL ? 'rtl' : 'ltr'}
      className="group flex w-full min-w-0 items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 p-2.5 text-start shadow-[0_12px_30px_-28px_rgba(15,23,42,0.9)] backdrop-blur-md transition-all hover:bg-white/10"
    >
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${iconClassName}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>

      <div className="min-w-0 flex-1 pe-2">
        <div className="flex min-w-0 items-center gap-2">
          <h4 className="min-w-0 truncate text-xs font-semibold text-[var(--color-text)] sm:text-sm">
            {transactionDescription}
          </h4>
          {referenceText ? (
            <button
              type="button"
              onClick={handleCopyReference}
              className="shrink-0 rounded-full p-1 text-[var(--color-muted)] transition hover:bg-white/10 hover:text-[var(--color-text)]"
              title={t('wallet.copyTransactionNumber', { defaultValue: 'Copy transaction number' })}
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-500 dark:text-gray-400">
          <span className="truncate">
            {formatDateTime(transaction.date, locale, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          {showOriginalCurrency ? (
            <span className="truncate text-[11px] text-cyan-700 dark:text-cyan-300">
              {showOriginalAmount
                ? `${isRTL ? 'المدفوع' : 'Paid'}: ${formatWalletAmount(originalAmount, originalCurrency)}`
                : `${t('wallet.executionCurrency', { defaultValue: 'Currency at execution' })}: ${originalCurrency}`}
            </span>
          ) : null}
        </div>
      </div>

      <div className="ms-auto flex shrink-0 flex-col items-end gap-1">
        <span className={`max-w-[8rem] truncate text-xs font-black [direction:ltr] sm:text-sm ${amountClassName}`}>
          {formatWalletAmount(transaction.amount, transaction.currency, { signed: true })}
        </span>
        {hasBalanceSnapshot ? (
          <span className="max-w-[9.5rem] truncate text-[10px] font-medium text-gray-500 dark:text-gray-400 [direction:ltr]">
            {formatWalletAmount(transaction.balanceBefore, transaction.currency)}
            {' '}
            &rarr;
            {' '}
            {formatWalletAmount(transaction.balanceAfter, transaction.currency)}
          </span>
        ) : null}
      </div>
    </motion.article>
  );
};

export default TransactionCard;
