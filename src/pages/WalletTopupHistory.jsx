import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardList, CreditCard, RefreshCw, WalletCards } from 'lucide-react';
import Badge from '../components/ui/Badge';
import Button, { cn } from '../components/ui/Button';
import useAuthStore from '../store/useAuthStore';
import useTopupStore from '../store/useTopupStore';
import { useLanguage } from '../context/LanguageContext';
import { formatDateTime, formatNumber } from '../utils/intl';
import { formatWalletAmount } from '../utils/storefront';
import { resolveTopupExecutionCurrency } from '../utils/transactionCurrency';

const normalizeStatus = (status) => String(status || 'pending').trim().toLowerCase();

const getStatusMeta = (status) => {
  const normalized = normalizeStatus(status);

  if (['approved', 'completed', 'complete', 'success'].includes(normalized)) {
    return {
      label: 'مكتملة',
      className: 'border-amber-400/35 bg-amber-500/12 text-amber-300 dark:border-amber-300/35 dark:bg-amber-500/14 dark:text-amber-200',
    };
  }

  if (['rejected', 'denied', 'failed', 'cancelled', 'canceled'].includes(normalized)) {
    return {
      label: 'فاشلة',
      className: 'border-[#c66a3d]/30 bg-[#c66a3d]/10 text-[#f0b08b] dark:border-[#c66a3d]/34 dark:bg-[#c66a3d]/12 dark:text-[#f5c8aa]',
    };
  }

  return {
    label: 'قيد الانتظار',
    className: 'border-[#22d3ee]/35 bg-[#22d3ee]/12 text-[#ccfbf1] dark:border-[#22d3ee]/45 dark:bg-[#22d3ee]/14 dark:text-[#e0f2fe]',
  };
};

const getTopupAmount = (topup) => Number(
  topup?.actualPaidAmount
  ?? topup?.amountWithFee
  ?? topup?.requestedAmount
  ?? topup?.requestedCoins
  ?? topup?.amount
  ?? 0
);

const PAGE_SIZE = 15;

const WalletTopupHistory = () => {
  const { dir } = useLanguage();
  const { user } = useAuthStore();
  const { topups, loadTopups } = useTopupStore();
  const isRTL = dir === 'rtl';
  const userId = String(user?.id || '').trim();
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    void loadTopups({ force: true });
  }, [loadTopups]);

  const myTopups = useMemo(() => (
    (topups || [])
      .filter((topup) => String(topup?.type || 'regular') !== 'game_topup')
      .filter((topup) => !userId || String(topup?.userId || '').trim() === userId)
      .sort((left, right) => new Date(right?.createdAt || right?.date || 0) - new Date(left?.createdAt || left?.date || 0))
  ), [topups, userId]);

  const totalPages = Math.max(1, Math.ceil(myTopups.length / PAGE_SIZE));
  const visibleTopups = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return myTopups.slice(startIndex, startIndex + PAGE_SIZE);
  }, [currentPage, myTopups]);

  useEffect(() => {
    setCurrentPage(1);
  }, [userId]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(Math.max(page, 1), totalPages));
  }, [totalPages]);

  const stats = useMemo(() => {
    const summary = { all: myTopups.length, pending: 0, approved: 0, rejected: 0 };

    myTopups.forEach((topup) => {
      const status = normalizeStatus(topup.status);
      if (['approved', 'completed', 'complete', 'success'].includes(status)) summary.approved += 1;
      else if (['rejected', 'denied', 'failed', 'cancelled', 'canceled'].includes(status)) summary.rejected += 1;
      else summary.pending += 1;
    });

    return summary;
  }, [myTopups]);

  return (
    <div className="mx-auto max-w-6xl space-y-4 text-[var(--color-text)]" dir={dir}>
      <section className="rounded-[1.5rem] border border-[color:rgb(var(--color-primary-rgb)/0.22)] bg-[linear-gradient(135deg,rgb(var(--color-card-rgb)/0.96),rgb(var(--color-surface-rgb)/0.84))] p-4 shadow-[0_24px_70px_-52px_rgb(var(--color-primary-rgb)/0.42)] dark:border-[color:rgb(var(--color-primary-rgb)/0.3)] dark:bg-[linear-gradient(135deg,rgb(17_16_12/0.96),rgb(10_9_8/0.9))] dark:shadow-[0_24px_70px_-52px_rgb(0_0_0/0.7)] sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-[1rem] border border-[color:rgb(var(--color-primary-rgb)/0.24)] bg-[color:rgb(var(--color-primary-rgb)/0.1)] text-[var(--color-primary)]">
              <WalletCards className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-black text-[var(--color-text)] sm:text-3xl">سجل طلبات إضافة الرصيد</h1>
            <p className="mt-2 max-w-2xl text-xs leading-6 text-[var(--color-text-secondary)] sm:text-sm">
              تابع طلبات إضافة الفلوس، حالة المراجعة، وطريقة الدفع المستخدمة.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:min-w-[24rem]">
            {[
              { label: 'الكل', value: stats.all },
              { label: 'انتظار', value: stats.pending },
              { label: 'مقبولة', value: stats.approved },
              { label: 'مرفوضة', value: stats.rejected },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-[color:rgb(var(--color-border-rgb)/0.82)] bg-[color:rgb(var(--color-elevated-rgb)/0.72)] px-2 py-1.5 shadow-[var(--shadow-subtle)] dark:border-[color:rgb(var(--color-primary-rgb)/0.15)] dark:bg-[linear-gradient(180deg,rgb(23_20_14/0.9),rgb(14_12_10/0.86))] dark:shadow-[0_18px_34px_-28px_rgb(0_0_0/0.72)]">
                <p className="text-[9px] font-semibold text-[var(--color-text-secondary)] dark:text-[color:rgb(var(--color-primary-rgb)/0.72)]">{item.label}</p>
                <p className="mt-0.5 text-sm font-black text-[var(--color-text)] dark:text-[#e0f2fe]">{formatNumber(item.value, 'en-US')}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between gap-3 rounded-[1.2rem] border border-[color:rgb(var(--color-border-rgb)/0.78)] bg-[color:rgb(var(--color-card-rgb)/0.82)] p-3 dark:border-[color:rgb(var(--color-primary-rgb)/0.16)] dark:bg-[linear-gradient(180deg,rgb(19_17_12/0.94),rgb(11_10_8/0.9))]">
        <div className="flex min-w-0 items-center gap-2">
          <ClipboardList className="h-4 w-4 shrink-0 text-[var(--color-primary)] dark:text-[#7df9ff]" />
          <p className="truncate text-sm font-bold text-[var(--color-text)]">طلباتك الأخيرة</p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={() => loadTopups({ force: true })}>
          <RefreshCw className="h-4 w-4" />
          تحديث
        </Button>
      </div>

      {myTopups.length ? (
        <section className="grid gap-3 lg:grid-cols-2">
          {visibleTopups.map((topup) => {
            const statusMeta = getStatusMeta(topup.status);
            const currency = resolveTopupExecutionCurrency(topup, user?.currency || 'USD');
            const amount = getTopupAmount(topup);
            const createdAt = topup?.createdAt || topup?.date;

            return (
              <article
                key={topup.id}
                className="rounded-[1.25rem] border border-[color:rgb(var(--color-border-rgb)/0.82)] bg-[color:rgb(var(--color-card-rgb)/0.88)] p-3.5 shadow-[0_18px_54px_-46px_rgb(var(--color-primary-rgb)/0.35)] dark:border-[color:rgb(var(--color-primary-rgb)/0.16)] dark:bg-[linear-gradient(180deg,rgb(18_16_12/0.96),rgb(10_9_8/0.92))] dark:shadow-[0_18px_54px_-46px_rgb(0_0_0/0.78)] sm:p-4"
              >
                <div className={cn('flex items-start justify-between gap-3', isRTL ? 'flex-row-reverse text-right' : '')}>
                  <div className="min-w-0">
                    <div className={cn('mb-2 flex flex-wrap items-center gap-1.5', isRTL ? 'justify-end' : '')}>
                      <Badge className={statusMeta.className}>{statusMeta.label}</Badge>
                      <span className="rounded-full border border-[color:rgb(var(--color-border-rgb)/0.72)] bg-[color:rgb(var(--color-surface-rgb)/0.62)] px-2 py-1 text-[10px] font-bold text-[var(--color-text-secondary)] dark:border-[color:rgb(var(--color-primary-rgb)/0.15)] dark:bg-[color:rgb(var(--color-primary-rgb)/0.06)] dark:text-[#7df9ff]">
                        #{topup.id}
                      </span>
                    </div>
                    <h2 className="truncate text-sm font-black text-[var(--color-text)]">
                      {topup.paymentChannel || topup.method || 'طلب إضافة رصيد'}
                    </h2>
                    <p className="mt-1 text-[11px] text-[var(--color-text-secondary)] dark:text-[color:rgb(var(--color-primary-rgb)/0.68)]">
                      {formatDateTime(createdAt, 'ar-EG') || 'بدون تاريخ'}
                    </p>
                  </div>

                  <div className="shrink-0 text-left [direction:ltr]">
                    <p className="text-sm font-black text-[var(--color-primary)] dark:text-[#ccfbf1]">
                      {formatWalletAmount(amount, currency || 'USD')}
                    </p>
                    <p className="mt-1 text-[10px] text-[var(--color-text-secondary)] dark:text-[color:rgb(var(--color-primary-rgb)/0.62)]">{currency || 'USD'}</p>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 text-xs">
                  <div className="rounded-xl border border-[color:rgb(var(--color-border-rgb)/0.68)] bg-[color:rgb(var(--color-surface-rgb)/0.5)] p-2 dark:border-[color:rgb(var(--color-primary-rgb)/0.14)] dark:bg-[color:rgb(var(--color-primary-rgb)/0.05)]">
                    <p className="text-[10px] text-[var(--color-text-secondary)] dark:text-[color:rgb(var(--color-primary-rgb)/0.62)]">رسوم/إجمالي</p>
                    <p className="mt-1 font-black text-[var(--color-text)] [direction:ltr] dark:text-[#e0f2fe]">
                      {formatWalletAmount(amount, currency || 'USD')}
                    </p>
                  </div>
                </div>

                {topup.adminNote ? (
                  <p className="mt-3 rounded-xl border border-[color:rgb(var(--color-border-rgb)/0.7)] bg-[color:rgb(var(--color-surface-rgb)/0.44)] px-3 py-2 text-xs leading-5 text-[var(--color-text-secondary)] dark:border-[color:rgb(var(--color-primary-rgb)/0.14)] dark:bg-[color:rgb(var(--color-primary-rgb)/0.05)] dark:text-[color:rgb(var(--color-primary-rgb)/0.72)]">
                    {topup.adminNote}
                  </p>
                ) : null}
              </article>
            );
          })}

          {totalPages > 1 && (
            <div className="lg:col-span-2 mt-1 flex flex-wrap items-center justify-center gap-2">
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
                  className={cn(
                    'h-9 min-w-9 rounded-full border px-3 text-xs font-black transition',
                    currentPage === pageNumber
                      ? 'border-[color:rgb(var(--color-primary-rgb)/0.54)] bg-[color:rgb(var(--color-primary-rgb)/0.16)] text-[var(--color-primary)]'
                      : 'border-[color:rgb(var(--color-border-rgb)/0.78)] bg-[color:rgb(var(--color-card-rgb)/0.82)] text-[var(--color-text)] hover:border-[color:rgb(var(--color-primary-rgb)/0.38)] hover:text-[var(--color-primary)]'
                  )}
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
        </section>
      ) : (
        <section className="rounded-[1.5rem] border border-dashed border-[color:rgb(var(--color-border-rgb)/0.86)] bg-[color:rgb(var(--color-card-rgb)/0.72)] p-8 text-center">
          <CreditCard className="mx-auto h-10 w-10 text-[var(--color-primary)]" />
          <h2 className="mt-3 text-lg font-black text-[var(--color-text)]">لا توجد طلبات إضافة رصيد</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--color-text-secondary)]">
            بعد إرسال طلب إضافة فلوس جديد سيظهر هنا بحالته وتفاصيله.
          </p>
        </section>
      )}
    </div>
  );
};

export default WalletTopupHistory;
