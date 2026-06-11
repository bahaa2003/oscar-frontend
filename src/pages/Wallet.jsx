import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, ShieldCheck, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/useAuthStore';
import useSystemStore from '../store/useSystemStore';
import apiClient from '../services/client';
import FilterBar from '../components/wallet/FilterBar';
import EmptyTransactions from '../components/wallet/EmptyTransactions';
import TransactionCard from '../components/wallet/TransactionCard';
import Loader from '../components/ui/Loader';
import { useLanguage } from '../context/LanguageContext';
import { formatWalletNumber, isNegativeWalletAmount, negativeWalletBalanceClassName } from '../utils/storefront';
import { normalizeMoneyAmount } from '../utils/money';
import { getCurrencyMeta } from '../utils/pricing';
import {
  resolveOrderExecutionCurrency,
  resolveTopupExecutionCurrency,
  resolveWalletTransactionExecutionCurrency,
  resolveWalletTransactionOriginalCurrency,
} from '../utils/transactionCurrency';

const normalizeLookupKey = (value) => String(value || '').trim().toLowerCase();
const normalizeMatchText = (value) => String(value || '')
  .toLowerCase()
  .replace(/[_-]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const toFiniteNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toTimestamp = (value) => {
  const timestamp = new Date(value || 0).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const sortTransactionsByNewest = (left, right) => toTimestamp(right?.date) - toTimestamp(left?.date);
const TRANSACTIONS_PAGE_SIZE = 15;

const getStartOfLocalDay = (date = new Date()) => (
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
);

const isQuantityOnlyUser = (user) => (
  String(user?.billingMode || user?.group?.billingMode || '').trim().toLowerCase() === 'quantity_only'
);

const buildLookupKeys = (...values) => Array.from(new Set(
  values
    .map((value) => normalizeLookupKey(value))
    .filter(Boolean)
));

const getShortLookupKeys = (value) => {
  const normalized = normalizeLookupKey(value);
  if (!normalized || normalized.length < 6) return [];

  return Array.from(new Set([
    normalized.slice(-6),
    normalized.length >= 8 ? normalized.slice(-8) : '',
  ].filter(Boolean)));
};

const extractDepositLookupKeys = (value) => {
  const text = String(value || '').trim();
  if (!text) return [];

  const matches = Array.from(text.matchAll(/#([a-z0-9]{6,})/gi))
    .map((match) => match?.[1])
    .filter(Boolean);

  return buildLookupKeys(...matches, ...matches.flatMap(getShortLookupKeys));
};

const findLinkedRecord = (tx, lookupMap) => {
  if (!(lookupMap instanceof Map) || lookupMap.size === 0) return null;

  const keys = buildLookupKeys(
    tx?.sourceId,
    tx?.reference,
    tx?.referenceId,
    tx?.orderId,
    tx?.depositId,
    tx?.topupId,
    tx?.id,
    tx?._id,
    ...extractDepositLookupKeys(tx?.description)
  );

  for (const key of keys) {
    const match = lookupMap.get(key);
    if (match) return match;
  }

  return null;
};

const buildOrderLookupMap = (items = []) => {
  const map = new Map();

  (Array.isArray(items) ? items : []).forEach((order) => {
    buildLookupKeys(
      order?.id,
      order?.orderNumber,
      order?.internalOrderNumber,
      order?.siteOrderNumber,
      order?.externalOrderId,
      order?.supplierOrderNumber
    ).forEach((key) => {
      if (!map.has(key)) map.set(key, order);
    });
  });

  return map;
};

const buildTopupLookupMap = (items = []) => {
  const map = new Map();

  (Array.isArray(items) ? items : []).forEach((topup) => {
    buildLookupKeys(
      topup?.id,
      topup?._id,
      topup?.reference,
      topup?.referenceId,
      ...getShortLookupKeys(topup?.id || topup?._id),
      ...getShortLookupKeys(topup?.reference || topup?.referenceId)
    ).forEach((key) => {
      if (!map.has(key)) map.set(key, topup);
    });
  });

  return map;
};

const hasTextOverlap = (left, right) => Boolean(left && right && (
  left === right
  || left.includes(right)
  || right.includes(left)
));

const findBestRecordByAmountAndDate = (tx, records = [], {
  getAmount,
  getDate,
  getText,
}) => {
  const txAmount = Math.abs(toFiniteNumber(tx?.amount ?? tx?.value ?? tx?.signedAmount));
  if (txAmount <= 0) return null;

  const txDate = toTimestamp(tx?.createdAt || tx?.date);
  const txText = normalizeMatchText(tx?.description || tx?.note || tx?.reference || '');
  let bestRecord = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  (Array.isArray(records) ? records : []).forEach((record) => {
    const recordAmount = Math.abs(toFiniteNumber(getAmount(record)));
    const amountDiff = Math.abs(recordAmount - txAmount);
    if (amountDiff > 0.01) return;

    const recordDate = toTimestamp(getDate(record));
    const timeDiff = txDate && recordDate ? Math.abs(recordDate - txDate) : Number.MAX_SAFE_INTEGER;
    const recordText = normalizeMatchText(getText(record));
    const textMatched = hasTextOverlap(txText, recordText);

    if (!textMatched && timeDiff > 24 * 60 * 60 * 1000) {
      return;
    }

    const score = (textMatched ? 1_000_000_000 : 0) - timeDiff - (amountDiff * 1000);
    if (score > bestScore) {
      bestScore = score;
      bestRecord = record;
    }
  });

  return bestRecord;
};

const normalizeWalletTransactionType = (value) => {
  const token = String(value || '').trim().toLowerCase();

  if (['credit', 'deposit', 'topup', 'top_up'].includes(token)) {
    return 'deposit';
  }

  if (['debit', 'purchase', 'charge', 'deduct', 'deduction'].includes(token)) {
    return 'purchase';
  }

  if (['refund', 'reversal'].includes(token)) {
    return 'transfer';
  }

  if (['withdrawal', 'withdraw'].includes(token)) {
    return 'withdrawal';
  }

  return 'deposit';
};

const normalizeWalletStatus = (value) => {
  const token = String(value || '').trim().toLowerCase();

  if (['completed', 'approved', 'success'].includes(token)) {
    return 'completed';
  }

  if (['pending', 'processing', 'requested', 'under_review', 'queued'].includes(token)) {
    return 'pending';
  }

  if (['failed', 'rejected', 'denied', 'cancelled', 'canceled', 'refunded'].includes(token)) {
    return 'failed';
  }

  return 'completed';
};

const buildTransactionDedupKey = (transaction = {}) => {
  const amount = Math.abs(toFiniteNumber(transaction?.amount));
  const normalizedDate = String(transaction?.date || '').trim();
  const normalizedSourceType = String(transaction?.sourceType || '').trim().toLowerCase();
  const normalizedSourceId = String(transaction?.sourceId || '').trim().toLowerCase();
  const normalizedReference = String(
    transaction?.reference
    || transaction?.referenceId
    || transaction?.sourceId
    || transaction?.id
    || ''
  ).trim().toLowerCase();

  if (normalizedSourceType && normalizedSourceId) {
    return `${normalizedSourceType}:${normalizedSourceId}:${amount}`;
  }

  if (normalizedReference) {
    return `${transaction?.type || 'tx'}:${normalizedReference}:${amount}`;
  }

  return `${transaction?.type || 'tx'}:${amount}:${normalizedDate}:${normalizeLookupKey(transaction?.description)}`;
};

const mergeTransactions = (...groups) => {
  const seen = new Set();
  const merged = [];

  groups.flat().forEach((transaction) => {
    if (!transaction) return;
    const key = buildTransactionDedupKey(transaction);
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(transaction);
  });

  return merged.sort(sortTransactionsByNewest);
};

const convertAmountBetweenCurrencies = (amount, fromCurrencyCode, toCurrencyCode, currencies) => {
  const numericAmount = Number(amount || 0);
  if (!Number.isFinite(numericAmount)) return 0;

  const fromCurrency = getCurrencyMeta(String(fromCurrencyCode || 'USD').toUpperCase(), currencies);
  const toCurrency = getCurrencyMeta(String(toCurrencyCode || 'USD').toUpperCase(), currencies);
  if (!fromCurrency.rate || !toCurrency.rate) return numericAmount;

  return normalizeMoneyAmount((numericAmount / fromCurrency.rate) * toCurrency.rate);
};

const Wallet = () => {
  const { dir } = useLanguage();
  const { t } = useTranslation();
  const isRTL = dir === 'rtl';
  const navigate = useNavigate();
  const { user, refreshProfile, isAuthenticated } = useAuthStore();
  const { currencies, loadCurrencies } = useSystemStore();
  const userId = user?.id;
  const userCurrency = String(user?.currency || 'USD').toUpperCase();

  // Fetch fresh profile on mount to bust Zustand persist cache (stale balance)
  useEffect(() => {
    if (refreshProfile) refreshProfile();
    if (loadCurrencies) loadCurrencies();
  }, [refreshProfile, loadCurrencies]);

  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(true);
  const [clockTick, setClockTick] = useState(Date.now());

  // Fetch real transactions from BE
  useEffect(() => {
    if (!isAuthenticated || !userId) {
      setTransactions([]);
      setTxLoading(false);
      return undefined;
    }

    let isActive = true;

    const fetchTransactions = async () => {
      setTxLoading(true);
      try {
        const [transactionsResult, ordersResult, topupsResult] = await Promise.allSettled([
          apiClient.wallet?.getTransactions?.(),
          apiClient.orders?.list?.(userId),
          apiClient.topups?.list?.(),
        ]);
        const res = transactionsResult.status === 'fulfilled' ? transactionsResult.value : [];
        const items = Array.isArray(res) ? res : (res?.transactions || res?.data || []);
        const relatedOrders = ordersResult.status === 'fulfilled'
          ? (Array.isArray(ordersResult.value) ? ordersResult.value : [])
          : [];
        const topupItems = topupsResult.status === 'fulfilled'
          ? (Array.isArray(topupsResult.value)
            ? topupsResult.value
            : (topupsResult.value?.items || topupsResult.value?.data || topupsResult.value?.deposits || []))
          : [];
        const relatedTopups = topupItems.filter(
              (entry) => String(entry?.userId || '') === String(userId || '')
            )
        const orderLookup = buildOrderLookupMap(relatedOrders);
        const topupLookup = buildTopupLookupMap(relatedTopups);
        const mapped = items.map((tx) => {
          const feType = normalizeWalletTransactionType(tx.type || tx.kind || tx.transactionType);
          const rawAmount = Number(tx.amount ?? tx.value ?? 0);
          const signedAmount = tx.signedAmount !== undefined && tx.signedAmount !== null
            ? Number(tx.signedAmount)
            : (feType === 'purchase' || feType === 'withdrawal'
              ? -Math.abs(rawAmount)
              : Math.abs(rawAmount));
          const linkedOrder = tx.order
            || findLinkedRecord(tx, orderLookup)
            || findBestRecordByAmountAndDate(tx, relatedOrders, {
              getAmount: (record) => (
                record?.financialSnapshot?.finalAmountAtExecution
                ?? record?.priceCoins
                ?? record?.totalAmount
                ?? 0
              ),
              getDate: (record) => record?.createdAt || record?.date,
              getText: (record) => record?.productNameAr || record?.productName || record?.notes || '',
            });
          const linkedTopup = tx.topup
            || findLinkedRecord(tx, topupLookup)
            || findBestRecordByAmountAndDate(tx, relatedTopups, {
              getAmount: (record) => (
                record?.actualPaidAmount
                ?? record?.requestedAmount
                ?? record?.amount
                ?? 0
              ),
              getDate: (record) => record?.createdAt || record?.date,
              getText: (record) => record?.paymentChannel || record?.method || '',
            });
          const enrichedTx = {
            ...tx,
            ...(linkedOrder ? { order: linkedOrder } : {}),
            ...(linkedTopup ? { topup: linkedTopup } : {}),
          };
          const executionCurrency = resolveWalletTransactionExecutionCurrency(enrichedTx, userCurrency);
          const amountSourceCurrency = executionCurrency || tx?.currency || tx?.currencyCode || tx?.originalCurrency || userCurrency;

          // ── CRITICAL: Wallet transactions are ALWAYS stored in the user's
          // local currency (walletBalance is in local currency). The backend's
          // creditWalletDirect / debitWalletAtomic directly modify walletBalance,
          // so the transaction amount IS already in the user's currency.
          // Do NOT convert it — that would double-multiply (e.g. 2000 SAR → ×15 → 30,000).
          const convertedSignedAmount = signedAmount;
          const rawBalanceAfter = tx.balanceAfter ?? null;
          const convertedBalanceAfter = rawBalanceAfter !== null && rawBalanceAfter !== undefined
            ? Number(rawBalanceAfter)
            : null;
          const resolvedStatus = linkedOrder
            ? normalizeWalletStatus(linkedOrder?.status || tx.status || 'completed')
            : linkedTopup
              ? normalizeWalletStatus(linkedTopup?.status || tx.status || 'completed')
              : normalizeWalletStatus(tx.status || 'completed');

          // CRITICAL: Enforce Number() on both operands to prevent string concatenation.
          // balanceBefore = balanceAfter - signedAmount (reverse the transaction)
          const safeBalanceAfter = convertedBalanceAfter !== null ? Number(convertedBalanceAfter) : null;
          const safeSignedAmount = Number(convertedSignedAmount) || 0;

          return {
            id: tx._id || tx.id,
            type: feType,
            description: linkedTopup
              ? t('wallet.addBalance', { defaultValue: 'Add Balance' })
              : (tx.description || feType),
            amount: convertedSignedAmount,
            currency: userCurrency,
            originalCurrency: resolveWalletTransactionOriginalCurrency(enrichedTx) || null,
            originalAmount: linkedTopup
              ? toFiniteNumber(
                linkedTopup?.actualPaidAmount
                ?? linkedTopup?.requestedAmount
                ?? linkedTopup?.amount
                ?? 0
              )
              : null,
            currentCurrency: userCurrency,
            status: resolvedStatus,
            date: tx.createdAt || tx.date,
            balanceAfter: safeBalanceAfter,
            balanceBefore: safeBalanceAfter !== null
              ? normalizeMoneyAmount(safeBalanceAfter - safeSignedAmount)
              : null,
            sourceType: tx.sourceType || (linkedOrder ? 'order' : linkedTopup ? 'topup' : null),
            sourceId: tx.sourceId || tx.orderId || tx.depositId || tx.topupId || linkedOrder?.id || linkedTopup?.id || null,
            reference: (() => {
              const raw = tx.reference || tx.referenceId || tx.orderId || tx.depositId || tx.topupId || null;
              if (raw === null || raw === undefined) return null;
              if (typeof raw === 'string' || typeof raw === 'number') return String(raw);
              if (typeof raw === 'object') {
                const picked = raw?.reference || raw?.referenceId || raw?.orderNumber || raw?.siteOrderNumber || raw?._id || raw?.id || '';
                return picked ? String(picked) : null;
              }
              return String(raw);
            })(),
          };
        });
        const linkedTopupIds = new Set(
          mapped
            .map((transaction) => String(transaction?.sourceType || '').toLowerCase() === 'topup' ? transaction?.sourceId : null)
            .filter(Boolean)
            .map((value) => String(value))
        );

        const fallbackTransactions = mergeTransactions(
          relatedTopups
            .filter((topup) => {
              const s = String(topup?.status || '').toLowerCase();
              const topupId = String(topup?.id || topup?._id || '');
              if (linkedTopupIds.has(topupId)) return false;
              return ['approved', 'completed', 'pending', 'processing', 'requested', 'under_review', 'queued', 'rejected', 'denied'].includes(s);
            })
            .map((topup) => ({
            id: `topup-${topup?.id || topup?._id || Math.random()}`,
            type: 'deposit',
            description: t('wallet.addBalance', { defaultValue: 'Add Balance' }),
            // requestedAmount is already in the user's local currency — no conversion needed
            amount: Math.abs(toFiniteNumber(
              topup?.requestedAmount
              ?? topup?.amount
              ?? 0
            )),
            currency: userCurrency,
            originalCurrency: resolveTopupExecutionCurrency(topup, userCurrency),
            originalAmount: toFiniteNumber(
              topup?.actualPaidAmount
              ?? topup?.requestedAmount
              ?? topup?.amount
              ?? 0
            ),
            currentCurrency: userCurrency,
            status: normalizeWalletStatus(topup?.status || 'completed'),
            date: topup?.createdAt || topup?.date,
            balanceBefore: null,
            balanceAfter: null,
            sourceType: 'topup',
            sourceId: topup?.id || topup?._id || null,
            reference: topup?.id || topup?._id || null,
          })),
          relatedOrders.map((order) => ({
            id: `order-${order?.id || order?._id || Math.random()}`,
            type: 'purchase',
            description: order?.productNameAr || order?.productName || order?.productId || t('wallet.typePurchase', { defaultValue: 'Purchase' }),
            amount: -convertAmountBetweenCurrencies(
              Math.abs(toFiniteNumber(
                order?.financialSnapshot?.finalAmountAtExecution
                ?? order?.priceCoins
                ?? order?.totalAmount
                ?? 0
              )),
              resolveOrderExecutionCurrency(order, userCurrency),
              userCurrency,
              currencies
            ),
            currency: userCurrency,
            originalCurrency: resolveOrderExecutionCurrency(order, userCurrency),
            currentCurrency: userCurrency,
            status: normalizeWalletStatus(order?.status || 'completed'),
            date: order?.createdAt || order?.date,
            balanceBefore: null,
            balanceAfter: null,
            sourceType: 'order',
            sourceId: order?.id || order?._id || null,
            reference: order?.siteOrderNumber || order?.orderNumber || order?.id || null,
          }))
        );

        if (isActive) {
          setTransactions(mergeTransactions(mapped, fallbackTransactions));
        }
      } catch {
        if (isActive) setTransactions([]);
      } finally {
        if (isActive) setTxLoading(false);
      }
    };
    fetchTransactions();

    return () => {
      isActive = false;
    };
  }, [currencies, isAuthenticated, t, userCurrency, userId]);

  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasAppliedFilters, setHasAppliedFilters] = useState(false);

  useEffect(() => {
    const scheduleMidnightRefresh = () => {
      const now = new Date();
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      return window.setTimeout(() => {
        setClockTick(Date.now());
      }, Math.max(1000, nextMidnight.getTime() - now.getTime() + 1000));
    };

    const timeoutId = scheduleMidnightRefresh();
    return () => window.clearTimeout(timeoutId);
  }, [clockTick]);

  // Sync filtered list when transactions change
  useEffect(() => {
    setFilteredTransactions(transactions);
    setCurrentPage(1);
  }, [transactions]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / TRANSACTIONS_PAGE_SIZE));
  const visibleTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * TRANSACTIONS_PAGE_SIZE;
    return filteredTransactions.slice(startIndex, startIndex + TRANSACTIONS_PAGE_SIZE);
  }, [currentPage, filteredTransactions]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(Math.max(page, 1), totalPages));
  }, [totalPages]);

  const handleFilterChange = (filters) => {
    setHasAppliedFilters(true);
    let filtered = [...transactions];

    if (filters.startDate || filters.endDate) {
      const startTime = filters.startDate ? new Date(`${filters.startDate}T00:00:00`).getTime() : null;
      const endTime = filters.endDate ? new Date(`${filters.endDate}T23:59:59.999`).getTime() : null;
      filtered = filtered.filter((tx) => {
        const txTime = new Date(tx.date).getTime();
        if (!Number.isFinite(txTime)) return false;
        if (startTime !== null && txTime < startTime) return false;
        if (endTime !== null && txTime > endTime) return false;
        return true;
      });
    } else if (filters.period && filters.period !== 'all') {
      const now = new Date();
      const periodMap = { today: 1, week: 7, month: 30, year: 365 };
      const days = periodMap[filters.period];
      const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((tx) => new Date(tx.date) >= cutoffDate);
    }

    if (filters.type !== 'all') {
      filtered = filtered.filter((tx) => tx.type === filters.type);
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter((tx) => tx.status === filters.status);
    }

    setFilteredTransactions(filtered);
    setCurrentPage(1);
  };

  const handleAddBalance = () => navigate('/wallet/add-balance');

  const walletCoinsValue = Number(user?.coins || 0);
  const isQuantityOnly = isQuantityOnlyUser(user);
  const isNegativeBalance = !isQuantityOnly && isNegativeWalletAmount(walletCoinsValue);
  const quantityLimit = Math.max(0, toFiniteNumber(user?.quantityLimit));
  const quantityUsed = Math.max(0, toFiniteNumber(user?.quantityUsed));
  const remainingQuota = Math.max(0, quantityLimit - quantityUsed);
  const walletCoinsLabel = isQuantityOnly
    ? (isRTL ? 'الكوتا المتبقية' : 'Remaining quota')
    : (isRTL ? 'رصيدي الحالي' : 'My current balance');
  const walletCoinsDisplay = useMemo(
    () => (
      isQuantityOnly
        ? `${formatWalletNumber(remainingQuota)} / ${formatWalletNumber(quantityLimit)}`
        : `${formatWalletNumber(walletCoinsValue, false, { maximumFractionDigits: 3 })} ${userCurrency}`
    ),
    [isQuantityOnly, quantityLimit, remainingQuota, userCurrency, walletCoinsValue]
  );
  const todayStartTime = useMemo(() => getStartOfLocalDay(new Date(clockTick)), [clockTick]);
  const spentSourceTransactions = useMemo(() => {
    if (hasAppliedFilters) return filteredTransactions;

    return transactions.filter((transaction) => {
      const txTime = toTimestamp(transaction?.date);
      return txTime >= todayStartTime;
    });
  }, [filteredTransactions, hasAppliedFilters, todayStartTime, transactions]);
  const totalSpentInScope = useMemo(() => spentSourceTransactions.reduce((sum, transaction) => {
    const amount = toFiniteNumber(transaction?.amount);
    const type = String(transaction?.type || '').toLowerCase();
    const status = String(transaction?.status || '').toLowerCase();
    const isDebit = amount < 0 || ['purchase', 'withdrawal', 'debit', 'deduct', 'deduction'].includes(type);

    if (!isDebit || ['failed', 'rejected', 'denied', 'cancelled', 'canceled', 'refunded'].includes(status)) {
      return sum;
    }

    return normalizeMoneyAmount(sum + Math.abs(amount));
  }, 0), [spentSourceTransactions]);
  const totalSpentLabel = hasAppliedFilters
    ? (isRTL ? 'إجمالي المصروف في الفلتر' : 'Filtered spending')
    : (isRTL ? 'إجمالي مصروف اليوم' : 'Today spending');
  const totalSpentHint = hasAppliedFilters
    ? (isRTL ? 'يتغير تلقائيًا حسب الفلاتر الحالية' : 'Updates with the current filters')
    : (isRTL ? 'يتصفر يوميًا بعد 12 بالليل' : 'Resets daily after midnight');
  const totalSpentDisplay = `${formatWalletNumber(totalSpentInScope, false, { maximumFractionDigits: 3 })} ${userCurrency}`;
  const creditLimitValue = Math.max(0, toFiniteNumber(user?.creditLimit));
  const usedCreditValue = Math.max(0, -walletCoinsValue);
  const remainingCreditValue = Math.max(0, creditLimitValue - usedCreditValue);
  const creditLimitDisplay = `${formatWalletNumber(creditLimitValue, false, { maximumFractionDigits: 3 })} ${userCurrency}`;
  const remainingCreditDisplay = `${formatWalletNumber(remainingCreditValue, false, { maximumFractionDigits: 3 })} ${userCurrency}`;

  return (
    <div
      className="compact-ui min-h-screen bg-transparent"
      dir={dir}
    >
      <div className="mx-auto max-w-7xl px-3 pb-16 pt-3 sm:px-4 sm:pb-18 sm:pt-4">
        <section
          dir={isRTL ? 'rtl' : 'ltr'}
          className="sidebar-wallet-shimmer relative isolate mb-3 min-h-[180px] overflow-hidden rounded-[28px] border border-[color:rgb(var(--color-primary-rgb)/0.28)] bg-[linear-gradient(145deg,rgb(var(--color-primary-rgb)/0.14),rgba(124,58,237,0.12)_40%,rgb(var(--color-card-rgb)/0.92)_100%)] p-5 shadow-[0_10px_24px_-20px_rgb(var(--color-primary-rgb)/0.36)] before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_right,rgba(244,63,221,0.24),transparent_45%)] before:opacity-80 sm:min-h-[210px] sm:p-6"
        >
          <div className="relative z-10">
            <p className="text-center text-sm font-black tracking-[0.1em] text-[var(--color-primary-soft)] sm:text-base">
              {walletCoinsLabel}
            </p>
            <div className="mt-4 flex flex-col items-center gap-4 sm:mt-5 sm:gap-5">
              <p className={`w-full min-w-0 truncate text-center text-3xl font-black leading-none sm:text-4xl ${isNegativeBalance ? negativeWalletBalanceClassName : 'text-[var(--color-text)]'}`} dir="ltr">
                {walletCoinsDisplay}
              </p>
              {!isQuantityOnly && (
                <div className="flex justify-center pt-1">
                  <button
                    type="button"
                    onClick={handleAddBalance}
                    className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl border border-[color:rgb(var(--color-primary-rgb)/0.38)] bg-[linear-gradient(135deg,#0284c7_0%,#5b21b6_52%,#d946ef_100%)] px-10 text-base font-black text-white shadow-[0_0_26px_-14px_rgba(34,211,238,0.86),0_0_28px_-16px_rgba(244,63,221,0.88)] transition-all hover:-translate-y-0.5 hover:brightness-[1.05]"
                  >
                    <Plus className="h-6 w-6" />
                    <span>{isRTL ? 'أضف رصيد' : t('wallet.addBalance', { defaultValue: 'Add Balance' })}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {!isQuantityOnly && (
          <section
            dir={isRTL ? 'rtl' : 'ltr'}
            className="mb-3 grid gap-2.5 sm:grid-cols-2"
          >
            <article className="relative isolate overflow-hidden rounded-2xl border border-[color:rgb(var(--color-primary-rgb)/0.24)] bg-[linear-gradient(135deg,rgb(var(--color-card-rgb)/0.78),rgba(124,58,237,0.16)_48%,rgba(244,63,221,0.12)_100%)] p-2.5 shadow-[0_12px_28px_-24px_rgb(var(--color-primary-rgb)/0.45)] before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_42%)] sm:p-3">
              <div className="relative z-10 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-black tracking-[0.08em] text-[var(--color-primary-soft)]">
                    {totalSpentLabel}
                  </p>
                  <p className="mt-1 truncate text-base font-black text-[var(--color-text)] sm:text-lg" dir="ltr">
                    {totalSpentDisplay}
                  </p>
                  <p className="mt-0.5 text-[10px] font-semibold text-[var(--color-text-secondary)] sm:text-[11px]">
                    {totalSpentHint}
                  </p>
                </div>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[color:rgb(var(--color-primary-rgb)/0.26)] bg-[linear-gradient(135deg,rgba(34,211,238,0.16),rgba(124,58,237,0.22),rgba(244,63,221,0.18))] text-[var(--color-primary)] shadow-[0_0_22px_-14px_rgba(34,211,238,0.9)]">
                  <TrendingDown className="h-5 w-5" />
                </span>
              </div>
            </article>

            <article className="relative isolate overflow-hidden rounded-2xl border border-[color:rgb(var(--color-primary-rgb)/0.24)] bg-[linear-gradient(135deg,rgb(var(--color-card-rgb)/0.82),rgba(34,211,238,0.13)_42%,rgba(217,70,239,0.12)_100%)] p-2.5 shadow-[0_12px_28px_-24px_rgb(var(--color-primary-rgb)/0.45)] before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.18),transparent_44%)] sm:p-3">
              <div className="relative z-10 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black tracking-[0.08em] text-[var(--color-primary-soft)]">
                  {isRTL ? 'حد الدين المسموح به' : 'Allowed credit limit'}
                </p>
                <p className="mt-1 truncate text-base font-black text-[var(--color-text)] sm:text-lg" dir="ltr">
                  {creditLimitDisplay}
                </p>
                <p className="mt-0.5 text-[10px] font-semibold text-[var(--color-text-secondary)] sm:text-[11px]">
                  {isRTL ? `المتبقي من الحد ${remainingCreditDisplay}` : `Remaining limit ${remainingCreditDisplay}`}
                </p>
              </div>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[color:rgb(var(--color-primary-rgb)/0.26)] bg-[linear-gradient(135deg,rgba(34,211,238,0.16),rgba(124,58,237,0.22),rgba(244,63,221,0.18))] text-[var(--color-primary)] shadow-[0_0_22px_-14px_rgba(34,211,238,0.9)]">
                <ShieldCheck className="h-5 w-5" />
              </span>
              </div>
            </article>
          </section>
        )}

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mb-2"
        >
          <div className={`flex flex-wrap items-end justify-between gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white sm:text-base">
              {t('wallet.recentTransactions')}
            </h2>
            <p className="text-[11px] text-[var(--color-text-secondary)] sm:text-xs">
              {isRTL
                ? `${formatWalletNumber(filteredTransactions.length)} من ${formatWalletNumber(transactions.length)} عملية`
                : `${formatWalletNumber(filteredTransactions.length)} of ${formatWalletNumber(transactions.length)} transactions`}
            </p>
          </div>
        </motion.div>

        <FilterBar onFilterChange={handleFilterChange} total={filteredTransactions.length} />

        {txLoading ? (
          <div className="rounded-[1rem] border border-[color:rgb(var(--color-border-rgb)/0.82)] bg-[color:rgb(var(--color-card-rgb)/0.76)]">
            <Loader />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <EmptyTransactions onAddBalance={handleAddBalance} />
        ) : (
          <div className="space-y-2.5">
            {visibleTransactions.map((transaction, index) => (
              <TransactionCard key={transaction.id} transaction={transaction} index={index} />
            ))}

            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="h-9 rounded-full border border-[color:rgb(var(--color-border-rgb)/0.78)] bg-[color:rgb(var(--color-card-rgb)/0.82)] px-4 text-xs font-black text-[var(--color-text)] transition hover:border-[color:rgb(var(--color-primary-rgb)/0.38)] hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  السابق
                </button>

                {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setCurrentPage(pageNumber)}
                    aria-current={currentPage === pageNumber ? 'page' : undefined}
                    className={`h-9 min-w-9 rounded-full border px-3 text-xs font-black transition ${
                      currentPage === pageNumber
                        ? 'border-[color:rgb(var(--color-primary-rgb)/0.54)] bg-[color:rgb(var(--color-primary-rgb)/0.16)] text-[var(--color-primary)]'
                        : 'border-[color:rgb(var(--color-border-rgb)/0.78)] bg-[color:rgb(var(--color-card-rgb)/0.82)] text-[var(--color-text)] hover:border-[color:rgb(var(--color-primary-rgb)/0.38)] hover:text-[var(--color-primary)]'
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                  className="h-9 rounded-full border border-[color:rgb(var(--color-border-rgb)/0.78)] bg-[color:rgb(var(--color-card-rgb)/0.82)] px-4 text-xs font-black text-[var(--color-text)] transition hover:border-[color:rgb(var(--color-primary-rgb)/0.38)] hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  التالي
                </button>
              </div>
            )}
          </div>
        )}

        {!isQuantityOnly && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleAddBalance}
          className="sidebar-wallet-shimmer fixed bottom-5 left-5 z-50 flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-[color:rgb(var(--color-primary-rgb)/0.5)] bg-[linear-gradient(145deg,rgba(0,200,255,0.2),rgba(124,58,237,0.76)_42%,rgba(244,63,221,0.9)_100%)] text-[var(--color-primary)] shadow-[0_18px_28px_-18px_rgba(0,200,255,0.42)] transition-all before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_right,rgba(255,243,200,0.58),transparent_48%)] before:opacity-85 hover:-translate-y-0.5 hover:brightness-[1.03] dark:border-[#9f834f]/70 dark:bg-[linear-gradient(145deg,rgba(14,21,51,0.9),rgba(34,211,238,0.24)_48%,rgba(244,63,221,0.34)_100%)] dark:text-[var(--color-primary-hover)] sm:h-14 sm:w-14"
          aria-label={t('wallet.addBalance')}
        >
          <Plus className="relative z-10 h-5 w-5 drop-shadow-[0_1px_0_rgba(255,255,255,0.35)] sm:h-6 sm:w-6" />
        </motion.button>
        )}
      </div>
    </div>
  );
};

export default Wallet;
