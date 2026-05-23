import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Eye,
  PlusCircle,
  ReceiptText,
  ShoppingCart,
  Wallet,
} from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAdminStore from '../../store/useAdminStore';
import useOrderStore from '../../store/useOrderStore';
import useTopupStore from '../../store/useTopupStore';
import useAuthStore from '../../store/useAuthStore';
import useSystemStore from '../../store/useSystemStore';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { useToast } from '../../components/ui/Toast';
import { formatDateTime, formatNumber, getNumericLocale } from '../../utils/intl';
import { formatCurrencyAmount } from '../../utils/pricing';
import { getOrderStatusMeta } from '../../utils/orders';
import { getDashboardPathForRole, getPreviousVisitedPath } from '../../utils/navigation';
import {
  resolveOrderExecutionCurrency,
  resolveTopupExecutionCurrency,
  resolveWalletTransactionExecutionCurrency,
  resolveWalletTransactionOriginalCurrency,
} from '../../utils/transactionCurrency';

const asNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getCurrencyRate = (currencies, currencyCode) => {
  const normalizedCode = String(currencyCode || 'USD').toUpperCase();
  const matchedCurrency = (currencies || []).find(
    (entry) => String(entry?.code || '').toUpperCase() === normalizedCode
  );

  return asNumber(matchedCurrency?.rate) || 1;
};

const convertAmountBetweenCurrencies = (amount, fromCurrencyCode, toCurrencyCode, currencies) => {
  const numericAmount = asNumber(amount);
  const sourceCurrency = String(fromCurrencyCode || 'USD').toUpperCase();
  const targetCurrency = String(toCurrencyCode || 'USD').toUpperCase();

  if (sourceCurrency === targetCurrency) return numericAmount;

  const fromRate = getCurrencyRate(currencies, sourceCurrency);
  const toRate = getCurrencyRate(currencies, targetCurrency);
  if (!fromRate || !toRate) return numericAmount;

  return asNumber((numericAmount / fromRate) * toRate);
};

const topupStatusMeta = (status, isArabic) => {
  const token = String(status || '').trim().toLowerCase();
  if (['approved', 'completed', 'success'].includes(token)) {
    return { variant: 'success', label: isArabic ? 'مكتملة' : 'Completed' };
  }
  if (['pending', 'requested', 'processing', 'under_review'].includes(token)) {
    return { variant: 'warning', label: isArabic ? 'قيد التنفيذ' : 'In progress' };
  }
  return { variant: 'danger', label: isArabic ? 'غير مكتملة' : 'Incomplete' };
};

const walletStatusMeta = (status, isArabic) => {
  const token = String(status || '').trim().toLowerCase();
  if (['completed', 'success', 'approved'].includes(token)) {
    return { variant: 'success', label: isArabic ? 'مكتملة' : 'Completed' };
  }
  if (['pending', 'processing', 'under_review'].includes(token)) {
    return { variant: 'warning', label: isArabic ? 'معلقة' : 'Pending' };
  }
  if (['failed', 'rejected', 'denied'].includes(token)) {
    return { variant: 'danger', label: isArabic ? 'فشلت' : 'Failed' };
  }
  return { variant: 'info', label: isArabic ? 'مسجلة' : 'Logged' };
};

const walletTypeMeta = (type, isArabic) => {
  const token = String(type || '').trim().toLowerCase();
  if (token === 'debit') {
    return {
      label: isArabic ? 'خصم من المحفظة' : 'Wallet debit',
      shortLabel: isArabic ? 'خصم' : 'Debit',
    };
  }
  if (token === 'refund') {
    return {
      label: isArabic ? 'استرجاع للمحفظة' : 'Wallet refund',
      shortLabel: isArabic ? 'استرجاع' : 'Refund',
    };
  }
  return {
    label: isArabic ? 'إضافة للمحفظة' : 'Wallet credit',
    shortLabel: isArabic ? 'إضافة' : 'Credit',
  };
};

// ─── Helper: extract order number + player ID from a populated reference ─────
// The backend now populates reference with { orderNumber, customerInput, status, totalPrice }.
// customerInput.values is a free-form map — player ID may live under several key names.
const resolveOrderMeta = (raw, orders = []) => {
  // For 'wallet' source transactions the populated order lives on raw.reference
  // For 'order' source entries it lives directly on raw itself
  let orderDoc = raw?.reference && typeof raw.reference === 'object'
    ? raw.reference
    : (raw?.orderNumber != null ? raw : null);

  if (!orderDoc) {
    const refId = raw?.referenceId || (typeof raw?.reference === 'string' ? raw.reference : null);
    if (refId && Array.isArray(orders)) {
      orderDoc = orders.find((o) => String(o?.id || o?._id) === String(refId));
    }
  }

  if (!orderDoc) return null;

  const orderNumber = orderDoc.orderNumber ?? null;
  const values = orderDoc.customerInput?.values || {};
  const playerId =
    values.playerId ??
    values.player_id ??
    values.uid ??
    values.game_id ??
    values.userId ??
    null;

  if (!orderNumber && !playerId) return null;
  return { orderNumber, playerId };
};


const buildWalletOperation = (transaction, fallbackCurrency, isArabic) => {
  const type = String(transaction?.type || transaction?.kind || transaction?.transactionType || '').trim().toLowerCase();
  const amount = asNumber(transaction?.amount);
  const signedAmount = transaction?.signedAmount !== undefined && transaction?.signedAmount !== null
    ? asNumber(transaction.signedAmount)
    : (type === 'debit' ? -Math.abs(amount) : Math.abs(amount));
  const typeMeta = walletTypeMeta(type, isArabic);
  const snapshotOriginalAmount = asNumber(transaction?.financialSnapshot?.originalAmount);
  const hasSnapshotOriginalAmount = Number.isFinite(Number(transaction?.financialSnapshot?.originalAmount));

  // CRITICAL FIX: Admin wallet adjustments are ALWAYS in the user's local
  // currency. The normaliser may inject currency='USD' because the backend
  // WalletTransaction model has no currency field, causing the fallback chain
  // in normaliseWalletTransaction to default to 'USD'. We override with the
  // known user currency (fallbackCurrency) to prevent double-multiplication
  // (e.g., 500 EGP × 50 rate = 25,000 displayed).
  const resolvedOriginalCurrency = resolveWalletTransactionOriginalCurrency(transaction);
  const resolvedExecutionCurrency = resolveWalletTransactionExecutionCurrency(transaction, fallbackCurrency);

  // Trust fallbackCurrency (user's actual currency) if no snapshot proves otherwise
  const hasFinancialSnapshot = Boolean(transaction?.financialSnapshot?.originalCurrency);
  const originalCurrencyCode = hasFinancialSnapshot
    ? (resolvedOriginalCurrency || resolvedExecutionCurrency)
    : fallbackCurrency;

  const sourceAmount = hasSnapshotOriginalAmount
    ? (signedAmount < 0 ? -Math.abs(snapshotOriginalAmount) : Math.abs(snapshotOriginalAmount))
    : signedAmount;

  return {
    id: `wallet-${transaction?.id || transaction?._id || Date.now()}`,
    source: 'wallet',
    sourceId: transaction?.id || transaction?._id || transaction?.reference || '-',
    status: String(transaction?.status || 'completed').toLowerCase(),
    date: transaction?.createdAt || transaction?.date || null,
    amount: signedAmount,
    sourceAmount,
    originalCurrencyCode,
    currencyCode: fallbackCurrency,
    title: typeMeta.label,
    subtitle: transaction?.description || transaction?.reference || '-',
    raw: transaction,
  };
};

const SummaryCard = ({ icon: Icon, label, value, note, tone = 'default' }) => (
  <Card className={`admin-premium-stat p-2 sm:p-3 ${tone === 'danger' ? 'border-[rgba(220,38,38,0.18)] bg-[linear-gradient(135deg,rgba(254,242,242,0.92),rgba(255,255,255,0.82))]' : ''}`.trim()}>
    <div className="flex items-start gap-1.5 sm:gap-2">
      <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[0.65rem] border sm:h-9 sm:w-9 ${
        tone === 'danger'
          ? 'border-[rgba(220,38,38,0.2)] bg-[rgba(220,38,38,0.08)] text-[#dc2626]'
          : 'border-[color:rgb(var(--color-primary-rgb)/0.2)] bg-[color:rgb(var(--color-primary-rgb)/0.09)] text-[var(--color-primary)]'
      }`}>
        <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] leading-tight text-[var(--color-text-secondary)] sm:text-xs">{label}</p>
        <p className={`mt-0.5 text-sm font-semibold leading-tight sm:text-xl ${tone === 'danger' ? 'text-[#b91c1c]' : 'text-[var(--color-text)]'}`}>{value}</p>
        {note ? <p className="mt-0.5 text-[10px] text-[var(--color-muted)] sm:text-xs">{note}</p> : null}
      </div>
    </div>
  </Card>
);

const AdminUserTransactions = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n } = useTranslation();
  const { addToast } = useToast();
  const actor = useAuthStore((state) => state.user);
  const {
    users,
    wallets,
    userWalletTransactions,
    loadUsers,
    getUserById,
    getUserWallet,
    getUserWalletTransactions,
    updateUserCoins,
    setUserBalance,
  } = useAdminStore();
  const { orders, loadOrders } = useOrderStore();
  const { topups, loadTopups } = useTopupStore();
  const { currencies, loadCurrencies } = useSystemStore();

  const [isLoading, setIsLoading] = useState(true);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [targetBalance, setTargetBalance] = useState('');
  const [isBalanceUpdating, setIsBalanceUpdating] = useState(false);
  const [detailsItem, setDetailsItem] = useState(null);

  const isArabic = String(i18n.resolvedLanguage || i18n.language || 'ar').toLowerCase().startsWith('ar');
  const locale = getNumericLocale(isArabic ? 'ar-EG' : 'en-US');

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    Promise.allSettled([
      Promise.resolve(loadUsers({ force: true })),
      Promise.resolve(getUserById(userId, { force: true })),
      Promise.resolve(getUserWallet(userId, { force: true })),
      Promise.resolve(getUserWalletTransactions(userId, { force: true })),
      Promise.resolve(loadOrders(userId, { force: true })),
      Promise.resolve(loadTopups({ force: true })),
      Promise.resolve(loadCurrencies()),
    ]).finally(() => {
      if (active) setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [getUserById, getUserWallet, getUserWalletTransactions, loadCurrencies, loadOrders, loadTopups, loadUsers, userId]);

  const selectedUser = useMemo(
    () => (users || []).find((entry) => String(entry?.id) === String(userId)),
    [userId, users]
  );

  const selectedWallet = useMemo(
    () => (wallets || []).find((entry) => String(entry?.userId || entry?.id || '').trim() === String(userId)),
    [userId, wallets]
  );

  const displayCurrencyCode = String(selectedUser?.currency || selectedWallet?.currency || 'USD').toUpperCase();

  const walletTransactions = useMemo(
    () => (Array.isArray(userWalletTransactions?.[userId]) ? userWalletTransactions[userId] : []),
    [userId, userWalletTransactions]
  );

  const userCurrencyCode = String(selectedUser?.currency || 'USD').toUpperCase();
  const currentBalance = asNumber(selectedWallet?.walletBalance ?? selectedWallet?.balance ?? selectedUser?.coins);

  const formatMoney = (amount, currencyCode = displayCurrencyCode) => {
    const safeAmount = asNumber(amount);
    return formatCurrencyAmount(safeAmount, String(currencyCode || displayCurrencyCode).toUpperCase(), currencies, locale);
  };

  const formatSignedMoney = (amount, currencyCode = displayCurrencyCode) => {
    const safeAmount = asNumber(amount);
    const sign = safeAmount > 0 ? '+' : safeAmount < 0 ? '-' : '';
    return `${sign}${formatMoney(Math.abs(safeAmount), currencyCode)}`;
  };

  const userOrders = useMemo(
    () => (orders || [])
      .filter((entry) => String(entry?.userId || '') === String(userId))
      .sort((a, b) => new Date(b?.createdAt || b?.date || 0) - new Date(a?.createdAt || a?.date || 0)),
    [orders, userId]
  );

  const userTopups = useMemo(
    () => (topups || [])
      .filter((entry) => String(entry?.userId || '') === String(userId))
      .sort((a, b) => new Date(b?.createdAt || b?.date || 0) - new Date(a?.createdAt || a?.date || 0)),
    [topups, userId]
  );

  const operations = useMemo(() => {
    const orderOps = userOrders.map((order) => {
      const amount = asNumber(
        order?.financialSnapshot?.finalAmountAtExecution
        ?? order?.priceCoins
        ?? order?.totalAmount
        ?? 0
      );
      return {
        id: `order-${order.id}`,
        source: 'order',
        sourceId: order.id,
        status: String(order?.status || '').toLowerCase(),
        date: order?.createdAt || order?.date,
        amount: -Math.abs(amount),
        originalCurrencyCode: resolveOrderExecutionCurrency(order, userCurrencyCode),
        title: isArabic ? 'طلب شراء' : 'Order purchase',
        subtitle: order?.productNameAr || order?.productName || order?.productId || '-',
        raw: order,
      };
    });

    const topupOps = userTopups.map((topup) => {
      const amount = asNumber(topup?.actualPaidAmount ?? topup?.requestedAmount ?? topup?.amount ?? 0);
      return {
        id: `topup-${topup.id}`,
        source: 'topup',
        sourceId: topup.id,
        status: String(topup?.status || '').toLowerCase(),
        date: topup?.createdAt || topup?.date,
        amount: amount,
        originalCurrencyCode: resolveTopupExecutionCurrency(topup, userCurrencyCode),
        title: isArabic ? 'عملية شحن رصيد' : 'Balance topup',
        subtitle: topup?.paymentChannel || topup?.method || '-',
        raw: topup,
      };
    });

    return [...orderOps, ...topupOps]
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [isArabic, userCurrencyCode, userOrders, userTopups]);

  const walletOperations = useMemo(
    () => walletTransactions
      .map((entry) => buildWalletOperation(entry, displayCurrencyCode, isArabic))
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)),
    [displayCurrencyCode, isArabic, walletTransactions]
  );

  const displayOperations = useMemo(
    () => (walletOperations.length ? walletOperations : operations).map((entry) => {
      const sourceCurrencyCode = String(entry?.originalCurrencyCode || entry?.currencyCode || displayCurrencyCode).toUpperCase();
      const sourceAmount = entry?.sourceAmount !== undefined && entry?.sourceAmount !== null
        ? asNumber(entry.sourceAmount)
        : asNumber(entry.amount);
      return {
        ...entry,
        originalCurrencyCode: sourceCurrencyCode,
        convertedAmount: convertAmountBetweenCurrencies(sourceAmount, sourceCurrencyCode, displayCurrencyCode, currencies),
        currencyCode: displayCurrencyCode,
      };
    }),
    [currencies, displayCurrencyCode, operations, walletOperations]
  );
  const creditTotal = useMemo(
    () => displayOperations.reduce((sum, entry) => (entry.convertedAmount > 0 ? sum + entry.convertedAmount : sum), 0),
    [displayOperations]
  );
  const debitTotal = useMemo(
    () => Math.abs(displayOperations.reduce((sum, entry) => (entry.convertedAmount < 0 ? sum + entry.convertedAmount : sum), 0)),
    [displayOperations]
  );
  const operationsSourceNote = walletOperations.length
    ? (isArabic ? 'السجل المباشر من مسار المحفظة' : 'Live wallet route')
    : (isArabic ? 'سجل احتياطي من الطلبات والشحنات' : 'Fallback from orders and topups');

  const revalidateWalletState = async () => {
    await Promise.allSettled([
      loadUsers({ force: true }),
      getUserById(selectedUser.id, { force: true }),
      getUserWallet(selectedUser.id, { force: true }),
      getUserWalletTransactions(selectedUser.id, { force: true }),
    ]);
  };

  const handleAddBalance = async () => {
    const amount = Math.abs(asNumber(adjustAmount));
    if (amount <= 0) {
      addToast('أدخل مبلغًا صحيحًا.', 'error');
      return;
    }

    setIsBalanceUpdating(true);
    try {
      await updateUserCoins(selectedUser.id, amount, actor);
      await revalidateWalletState();
      addToast('تمت زيادة الرصيد بنجاح.', 'success');
      setAdjustAmount('');
    } catch (error) {
      await revalidateWalletState();
      addToast(error?.message || 'تعذر زيادة الرصيد.', 'error');
    } finally {
      setIsBalanceUpdating(false);
    }
  };

  const handleDeductBalance = async () => {
    const amount = Math.abs(asNumber(adjustAmount));
    if (amount <= 0) {
      addToast('أدخل مبلغًا صحيحًا.', 'error');
      return;
    }

    setIsBalanceUpdating(true);
    try {
      // Send negative to trigger the deduct path in the store/API
      await updateUserCoins(selectedUser.id, -amount, actor);
      await revalidateWalletState();
      addToast('تم خصم الرصيد بنجاح.', 'success');
      setAdjustAmount('');
    } catch (error) {
      await revalidateWalletState();
      addToast(error?.message || 'تعذر خصم الرصيد.', 'error');
    } finally {
      setIsBalanceUpdating(false);
    }
  };

  const handleSetBalance = async () => {
    const target = asNumber(targetBalance);
    if (target === currentBalance) {
      addToast('الرصيد الحالي مطابق للقيمة المطلوبة.', 'info');
      return;
    }

    setIsBalanceUpdating(true);
    try {
      // Use the dedicated setBalance endpoint — bypasses credit limit checks
      // and directly sets the exact walletBalance (including negative).
      await setUserBalance(selectedUser.id, target, actor);
      await revalidateWalletState();
      addToast('تم تحديث الرصيد بنجاح.', 'success');
      setTargetBalance('');
    } catch (error) {
      await revalidateWalletState();
      addToast(error?.message || 'تعذر تحديث الرصيد.', 'error');
    } finally {
      setIsBalanceUpdating(false);
    }
  };

  const handleBackNavigation = () => {
    const previousPath = getPreviousVisitedPath(location.pathname);
    if (previousPath) {
      navigate(previousPath);
      return;
    }

    navigate(getDashboardPathForRole(actor?.role));
  };

  const renderOperationStatus = (item) => {
    if (item.source === 'wallet') {
      const statusMeta = walletStatusMeta(item.status, isArabic);
      return <Badge variant={statusMeta.variant} className="px-2 py-0.5 text-[10px]">{statusMeta.label}</Badge>;
    }

    if (item.source === 'order') {
      const statusMeta = getOrderStatusMeta(item.status, isArabic ? 'ar' : 'en');
      return <Badge variant={statusMeta.variant} className="px-2 py-0.5 text-[10px]">{statusMeta.label}</Badge>;
    }

    const statusMeta = topupStatusMeta(item.status, isArabic);
    return <Badge variant={statusMeta.variant} className="px-2 py-0.5 text-[10px]">{statusMeta.label}</Badge>;
  };

  return (
    <div className="min-w-0 space-y-2 sm:space-y-4">
      <section className="admin-premium-hero space-y-2 p-2 sm:space-y-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-3">
          <div>
            <h1 className="text-lg font-bold text-[var(--color-text)] sm:text-2xl">
              {isArabic ? 'معاملات الحساب' : 'Account Transactions'}
            </h1>
            <p className="mt-0.5 text-[11px] leading-4 text-[var(--color-text-secondary)] sm:text-sm">
              {isArabic ? 'عرض كل الطلبات والمعاملات المالية الخاصة بالمستخدم وإدارة رصيده.' : 'Review all user orders and financial operations with balance controls.'}
            </p>
          </div>
        </div>

        {selectedUser ? (
          <div className="rounded-[var(--radius-xl)] border border-[color:rgb(var(--color-border-rgb)/0.82)] bg-[color:rgb(var(--color-card-rgb)/0.78)] p-2 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-3">
              <div>
                <p className="text-[13px] font-semibold text-[var(--color-text)] sm:text-base">{selectedUser.name}</p>
                <p className="text-[11px] text-[var(--color-text-secondary)] sm:text-sm">{selectedUser.email}</p>
                <p className="mt-0.5 text-[10px] text-[var(--color-muted)]">ID: {selectedUser.id}</p>
                <p className="mt-1 text-[10px] text-[var(--color-text-secondary)]">{operationsSourceNote}</p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary" className="px-2 py-0.5 text-[10px]">
                  {selectedWallet?.transactionsCount || displayOperations.length} {isArabic ? 'حركة' : 'moves'}
                </Badge>
                <Badge variant="info" className="px-2 py-0.5 text-[10px]">{selectedUser?.currency || selectedWallet?.currency || 'USD'}</Badge>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {isLoading ? (
        <Card className="admin-premium-panel p-2 text-[11px] text-[var(--color-text-secondary)] sm:p-4 sm:text-sm">
          {isArabic ? 'جارٍ تحميل بيانات المستخدم والمعاملات...' : 'Loading user transactions...'}
        </Card>
      ) : null}

      {!isLoading && !selectedUser ? (
        <Card className="admin-premium-panel p-2 sm:p-4">
          <p className="text-[11px] text-[var(--color-text-secondary)] sm:text-sm">
            {isArabic ? 'لم يتم العثور على هذا المستخدم.' : 'User not found.'}
          </p>
        </Card>
      ) : null}

      {selectedUser ? (
        <>
      <div className="grid grid-cols-2 gap-1.5 sm:gap-3 xl:grid-cols-4">
        <SummaryCard
          icon={Wallet}
          label={isArabic ? 'الرصيد الحالي' : 'Current balance'}
          value={formatMoney(currentBalance, displayCurrencyCode)}
          note={displayCurrencyCode}
          tone={currentBalance < 0 ? 'danger' : 'default'}
        />
        <SummaryCard
          icon={ReceiptText}
          label={isArabic ? 'حركات المحفظة' : 'Wallet movements'}
          value={formatNumber(displayOperations.length, locale)}
          note={operationsSourceNote}
        />
        <SummaryCard
          icon={CheckCircle2}
          label={isArabic ? 'إجمالي الإضافات' : 'Total credits'}
          value={formatMoney(creditTotal, displayCurrencyCode)}
          note={isArabic ? 'رصيد دخل المحفظة' : 'Incoming wallet flow'}
        />
        <SummaryCard
          icon={ShoppingCart}
          label={isArabic ? 'إجمالي الخصومات' : 'Total debits'}
          value={formatMoney(debitTotal, displayCurrencyCode)}
          note={isArabic ? 'رصيد خرج من المحفظة' : 'Outgoing wallet flow'}
        />
      </div>

      <Card className="admin-premium-panel p-2 sm:p-4">
        <h2 className="mb-1.5 text-[13px] font-semibold text-[var(--color-text)] sm:mb-3 sm:text-base">{isArabic ? 'تعديل الرصيد' : 'Balance Controls'}</h2>
        <div className="grid gap-2 lg:grid-cols-2">
          <div className="rounded-[var(--radius-lg)] border border-[color:rgb(var(--color-border-rgb)/0.8)] p-2 sm:p-3">
            <p className="text-[11px] text-[var(--color-text-secondary)]">{isArabic ? 'زيادة / خصم' : 'Add / Deduct'}</p>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={adjustAmount}
              onChange={(event) => setAdjustAmount(event.target.value.replace(/-/g, ''))}
              onKeyDown={(event) => { if (event.key === '-' || event.key === 'e') event.preventDefault(); }}
              placeholder={isArabic ? 'أدخل المبلغ' : 'Enter amount'}
              className="mt-1.5 h-9 px-2 py-1.5 text-xs sm:mt-2 sm:h-11 sm:px-4 sm:py-3 sm:text-sm"
            />
            <div className="mt-1.5 flex gap-1.5 sm:mt-2 sm:gap-2">
              <Button size="sm" onClick={handleAddBalance} disabled={isBalanceUpdating} className="h-8 flex-1 gap-1 px-2 text-[11px] sm:h-10 sm:gap-2 sm:px-4 sm:text-sm">
                <PlusCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {isArabic ? 'زيادة' : 'Add'}
              </Button>
              <Button size="sm" variant="danger" onClick={handleDeductBalance} disabled={isBalanceUpdating} className="h-8 flex-1 gap-1 px-2 text-[11px] sm:h-10 sm:gap-2 sm:px-4 sm:text-sm">
                <Clock3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {isArabic ? 'خصم' : 'Deduct'}
              </Button>
            </div>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[color:rgb(var(--color-border-rgb)/0.8)] p-2 sm:p-3">
            <p className="text-[11px] text-[var(--color-text-secondary)]">{isArabic ? 'تعيين رصيد محدد' : 'Set exact balance'}</p>
            <Input
              type="number"
              step="0.01"
              value={targetBalance}
              onChange={(event) => setTargetBalance(event.target.value)}
              placeholder={isArabic ? 'مثال: 500' : 'e.g. 500'}
              className="mt-1.5 h-9 px-2 py-1.5 text-xs sm:mt-2 sm:h-11 sm:px-4 sm:py-3 sm:text-sm"
            />
            <Button size="sm" variant="outline" onClick={handleSetBalance} disabled={isBalanceUpdating} className="mt-1.5 h-8 w-full gap-1 px-2 text-[11px] sm:mt-2 sm:h-10 sm:gap-2 sm:px-4 sm:text-sm">
              {isArabic ? 'تعيين الرصيد' : 'Set balance'}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="admin-premium-panel p-2 sm:p-4">
        <div className="mb-1.5 flex items-center justify-between gap-1.5 sm:mb-3 sm:gap-2">
          <div>
            <h2 className="text-[13px] font-semibold text-[var(--color-text)] sm:text-base">{isArabic ? 'سجل الحركة' : 'Movement ledger'}</h2>
            <p className="mt-0.5 text-[10px] text-[var(--color-text-secondary)]">{operationsSourceNote}</p>
          </div>
          <Badge variant="secondary" className="px-2 py-0.5 text-[10px]">{formatNumber(displayOperations.length, locale)}</Badge>
        </div>

        {!displayOperations.length ? (
          <div className="rounded-[var(--radius-lg)] border border-dashed border-[color:rgb(var(--color-border-rgb)/0.72)] p-4 text-center text-[11px] text-[var(--color-text-secondary)] sm:text-sm">
            {isArabic ? 'لا توجد حركات محفوظة لهذه المحفظة حتى الآن.' : 'No wallet movements found for this user yet.'}
          </div>
        ) : null}

        <div className="space-y-1 lg:hidden">
          {displayOperations.map((item) => (
            <div key={item.id} className="rounded-[var(--radius-lg)] border border-[color:rgb(var(--color-border-rgb)/0.74)] p-2">
              <div className="flex items-start justify-between gap-1.5">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-[var(--color-text)]">{item.title}</p>
                  <p className="mt-0.5 truncate text-[11px] text-[var(--color-text-secondary)]">{item.subtitle}</p>
                  {/* Order number + Player ID badges for wallet debit/refund rows */}
                  {(() => {
                    const meta = resolveOrderMeta(item.raw, userOrders);
                    if (!meta) return null;
                    return (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {meta.orderNumber != null && (
                          <span className="inline-flex items-center gap-0.5 rounded-md bg-[color:rgb(var(--color-primary-rgb)/0.08)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-primary)]">
                            📋 #{meta.orderNumber}
                          </span>
                        )}
                        {meta.playerId && (
                          <span className="inline-flex items-center gap-0.5 rounded-md bg-[color:rgb(var(--color-success-rgb,22,163,74)/0.08)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-success,#16a34a)]">
                            🎮 {meta.playerId}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>
                {renderOperationStatus(item)}
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-[var(--color-text-secondary)]">
                <span className="truncate pe-2">{formatDateTime(item.date, locale, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                <span className={`shrink-0 font-semibold ${item.convertedAmount >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}>
                  {formatSignedMoney(item.convertedAmount, item.currencyCode)}
                </span>
              </div>
              <Button size="sm" variant="outline" onClick={() => setDetailsItem(item)} className="mt-1.5 h-8 w-full gap-1 px-2 text-[11px] sm:mt-2 sm:h-10 sm:gap-2 sm:px-4 sm:text-sm">
                <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {isArabic ? 'عرض التفاصيل' : 'View details'}
              </Button>
            </div>
          ))}
        </div>

        <div className="hidden lg:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isArabic ? 'النوع' : 'Type'}</TableHead>
                <TableHead>{isArabic ? 'الوصف' : 'Description'}</TableHead>
                <TableHead className="text-center">{isArabic ? 'الحالة' : 'Status'}</TableHead>
                <TableHead className="text-center">{isArabic ? 'المبلغ' : 'Amount'}</TableHead>
                <TableHead className="text-center">{isArabic ? 'التاريخ' : 'Date'}</TableHead>
                <TableHead className="text-end">{isArabic ? 'التفاصيل' : 'Details'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayOperations.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.source === 'wallet'
                      ? walletTypeMeta(item.raw?.type, isArabic).shortLabel
                      : item.source === 'order'
                        ? (isArabic ? 'طلب' : 'Order')
                        : (isArabic ? 'شحن' : 'Topup')}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-[var(--color-text)]">{item.title}</div>
                    <div className="text-xs text-[var(--color-text-secondary)]">{item.subtitle}</div>
                    {/* Order number + Player ID badges */}
                    {(() => {
                      const meta = resolveOrderMeta(item.raw, userOrders);
                      if (!meta) return null;
                      return (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {meta.orderNumber != null && (
                            <span className="inline-flex items-center gap-0.5 rounded-md bg-[color:rgb(var(--color-primary-rgb)/0.08)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-primary)]">
                              📋 #{meta.orderNumber}
                            </span>
                          )}
                          {meta.playerId && (
                            <span className="inline-flex items-center gap-0.5 rounded-md bg-[color:rgb(var(--color-success-rgb,22,163,74)/0.08)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-success,#16a34a)]">
                              🎮 {meta.playerId}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-center">{renderOperationStatus(item)}</TableCell>
                  <TableCell className={`text-center font-semibold ${item.convertedAmount >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}>
                    {formatSignedMoney(item.convertedAmount, item.currencyCode)}
                  </TableCell>
                  <TableCell className="text-center text-xs text-[var(--color-text-secondary)]">
                    {formatDateTime(item.date, locale, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </TableCell>
                  <TableCell className="text-end">
                    <Button size="sm" variant="outline" onClick={() => setDetailsItem(item)}>
                      <Eye className="h-4 w-4" />
                      {isArabic ? 'عرض' : 'View'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
      </>
      ) : null}

      <Modal
        isOpen={Boolean(detailsItem)}
        onClose={() => setDetailsItem(null)}
        title={isArabic ? 'تفاصيل العملية' : 'Operation details'}
        size="lg"
      >
        {detailsItem ? (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[var(--radius-lg)] border border-[color:rgb(var(--color-border-rgb)/0.8)] p-3">
                <p className="text-xs text-[var(--color-text-secondary)]">{isArabic ? 'رقم العملية' : 'Operation ID'}</p>
                <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">#{detailsItem.sourceId}</p>
              </div>
              <div className="rounded-[var(--radius-lg)] border border-[color:rgb(var(--color-border-rgb)/0.8)] p-3">
                <p className="text-xs text-[var(--color-text-secondary)]">{isArabic ? 'التاريخ' : 'Date'}</p>
                <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">
                  {formatDateTime(detailsItem.date, locale, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </p>
              </div>
              <div className="rounded-[var(--radius-lg)] border border-[color:rgb(var(--color-border-rgb)/0.8)] p-3">
                <p className="text-xs text-[var(--color-text-secondary)]">{isArabic ? 'المبلغ' : 'Amount'}</p>
                <p className={`mt-1 text-sm font-semibold ${(detailsItem.convertedAmount ?? detailsItem.amount) >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}>
                  {formatSignedMoney(detailsItem.convertedAmount ?? detailsItem.amount, detailsItem.currencyCode)}
                </p>
              </div>
              <div className="rounded-[var(--radius-lg)] border border-[color:rgb(var(--color-border-rgb)/0.8)] p-3">
                <p className="text-xs text-[var(--color-text-secondary)]">{isArabic ? 'نوع العملية' : 'Operation type'}</p>
                <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">
                  {detailsItem.source === 'wallet'
                    ? walletTypeMeta(detailsItem.raw?.type, isArabic).label
                    : detailsItem.source === 'order'
                      ? (isArabic ? 'طلب شراء' : 'Order purchase')
                      : (isArabic ? 'شحن رصيد' : 'Balance topup')}
                </p>
              </div>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-[color:rgb(var(--color-border-rgb)/0.8)] p-3">
              {detailsItem.source === 'wallet' ? (
                <div className="space-y-2 text-sm text-[var(--color-text)]">
                  <p><span className="text-[var(--color-text-secondary)]">{isArabic ? 'الوصف:' : 'Description:'}</span> {detailsItem.raw?.description || detailsItem.subtitle || '-'}</p>
                  <p><span className="text-[var(--color-text-secondary)]">{isArabic ? 'المرجع:' : 'Reference:'}</span> {detailsItem.raw?.reference || '-'}</p>
                  <p><span className="text-[var(--color-text-secondary)]">{isArabic ? 'الرصيد بعد العملية:' : 'Balance after:'}</span> {detailsItem.raw?.balanceAfter !== null && detailsItem.raw?.balanceAfter !== undefined ? formatMoney(convertAmountBetweenCurrencies(detailsItem.raw.balanceAfter, detailsItem.raw?.currency || detailsItem.originalCurrencyCode || detailsItem.currencyCode, displayCurrencyCode, currencies), displayCurrencyCode) : '-'}</p>
                  <p><span className="text-[var(--color-text-secondary)]">{isArabic ? 'مصدر السجل:' : 'Ledger source:'}</span> {detailsItem.raw?.sourceType || (isArabic ? 'محفظة مباشرة' : 'Direct wallet entry')}</p>
                </div>
              ) : detailsItem.source === 'order' ? (
                <div className="space-y-2 text-sm text-[var(--color-text)]">
                  <p><span className="text-[var(--color-text-secondary)]">{isArabic ? 'المنتج:' : 'Product:'}</span> {detailsItem.raw?.productNameAr || detailsItem.raw?.productName || detailsItem.raw?.productId || '-'}</p>
                  <p><span className="text-[var(--color-text-secondary)]">{isArabic ? 'الكمية:' : 'Quantity:'}</span> {asNumber(detailsItem.raw?.quantity || 1)}</p>
                  <p><span className="text-[var(--color-text-secondary)]">{isArabic ? 'الحقول:' : 'Fields:'}</span> {JSON.stringify(detailsItem.raw?.orderFieldsValues || detailsItem.raw?.orderFields || {})}</p>
                </div>
              ) : (
                <div className="space-y-2 text-sm text-[var(--color-text)]">
                  <p><span className="text-[var(--color-text-secondary)]">{isArabic ? 'طريقة الدفع:' : 'Payment channel:'}</span> {detailsItem.raw?.paymentChannel || detailsItem.raw?.method || '-'}</p>
                  <p><span className="text-[var(--color-text-secondary)]">{isArabic ? 'المبلغ المطلوب:' : 'Requested amount:'}</span> {formatMoney(convertAmountBetweenCurrencies(detailsItem.raw?.requestedAmount ?? detailsItem.raw?.amount ?? 0, detailsItem.raw?.currencyCode || detailsItem.originalCurrencyCode || detailsItem.currencyCode, displayCurrencyCode, currencies), displayCurrencyCode)}</p>
                  <p><span className="text-[var(--color-text-secondary)]">{isArabic ? 'المبلغ المعتمد:' : 'Approved amount:'}</span> {detailsItem.raw?.actualPaidAmount ? formatMoney(convertAmountBetweenCurrencies(detailsItem.raw.actualPaidAmount, detailsItem.raw?.currencyCode || detailsItem.originalCurrencyCode || detailsItem.currencyCode, displayCurrencyCode, currencies), displayCurrencyCode) : '-'}</p>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default AdminUserTransactions;
