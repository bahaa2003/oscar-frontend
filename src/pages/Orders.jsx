import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Coins,
  PackageCheck,
  ShoppingCart,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card from '../components/ui/Card';
import OrdersFiltersBar from '../components/orders/OrdersFiltersBar';
import CustomerOrderCard from '../components/orders/CustomerOrderCard';
import OrderDetailsDrawer from '../components/orders/OrderDetailsDrawer';
import EmptyOrdersState from '../components/orders/EmptyOrdersState';
import useAuthStore from '../store/useAuthStore';
import useOrderStore from '../store/useOrderStore';
import useMediaStore from '../store/useMediaStore';
import useSystemStore from '../store/useSystemStore';
import {
  filterOrders,
  enrichOrders,
  getOrderAmountValue,
  getOrderCurrencyCode,
  summarizeOrders,
} from '../utils/orders';
import { formatNumber } from '../utils/intl';
import { formatCurrencyAmount } from '../utils/pricing';

const ORDERS_PER_PAGE = 8;

const SummaryCard = ({ icon: Icon, label, value, tone = 'sky' }) => {
  const tones = {
    sky: 'border-sky-400/28 bg-sky-500/8 text-sky-500',
    amber: 'border-amber-400/30 bg-amber-500/10 text-amber-500',
    emerald: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-500',
    rose: 'border-rose-400/25 bg-rose-500/8 text-rose-500',
  };

  return (
    <div className="relative isolate overflow-hidden rounded-xl border border-[color:rgb(var(--color-border-rgb)/0.78)] bg-[linear-gradient(135deg,rgb(var(--color-card-rgb)/0.92),rgb(var(--color-surface-rgb)/0.58))] p-2.5 shadow-[var(--shadow-subtle)]">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -end-10 -top-10 h-28 w-28 rounded-full bg-[color:rgb(var(--color-primary-rgb)/0.14)] blur-2xl" />
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-black uppercase tracking-[0.12em] text-[var(--color-muted)]">
            {label}
          </p>
          <p className="mt-2 truncate text-xl font-black leading-none text-[var(--color-text)]" title={String(value)}>
            {value}
          </p>
        </div>

        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${tones[tone] || tones.sky}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
};

const Orders = () => {
  const { user } = useAuthStore();
  const { orders, loadOrders, getOrderById } = useOrderStore();
  const { products, loadProducts } = useMediaStore();
  const { currencies, loadCurrencies } = useSystemStore();
  const { i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('custom');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const isArabic = String(i18n.resolvedLanguage || i18n.language || 'ar').toLowerCase().startsWith('ar');
  const locale = isArabic ? 'ar-EG' : 'en-US';

  useEffect(() => {
    let isMounted = true;

    const loadPage = async () => {
      setIsLoading(true);

      await Promise.allSettled([
        Promise.resolve(loadOrders(user?.id, { force: true })),
        Promise.resolve(loadProducts({ force: true })),
        Promise.resolve(loadCurrencies()),
      ]);

      if (isMounted) {
        setIsLoading(false);
      }
    };

    loadPage();

    return () => {
      isMounted = false;
    };
  }, [loadCurrencies, loadOrders, loadProducts, user?.id]);

  const enrichedOrders = useMemo(
    () => enrichOrders(orders, {
      users: user ? [user] : [],
      products,
      language: isArabic ? 'ar' : 'en',
    }),
    [orders, products, user, isArabic]
  );

  const filteredOrders = useMemo(
    () => {
      const baseFiltered = filterOrders(enrichedOrders, {
        searchTerm,
        statusFilter,
        typeFilter: 'all',
        dateFilter,
        sortOrder,
      });

      if (dateFilter !== 'custom') {
        return baseFiltered;
      }

      const startBoundary = customStartDate ? new Date(`${customStartDate}T00:00:00`) : null;
      const endBoundary = customEndDate ? new Date(`${customEndDate}T23:59:59.999`) : null;

      return baseFiltered.filter((order) => {
        const orderDate = new Date(order?.createdAt || 0);
        if (Number.isNaN(orderDate.getTime())) return false;
        if (startBoundary && orderDate < startBoundary) return false;
        if (endBoundary && orderDate > endBoundary) return false;
        return true;
      });
    },
    [customEndDate, customStartDate, dateFilter, enrichedOrders, searchTerm, sortOrder, statusFilter]
  );

  const summary = useMemo(() => summarizeOrders(filteredOrders), [filteredOrders]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStartIndex = (safeCurrentPage - 1) * ORDERS_PER_PAGE;
  const paginatedOrders = useMemo(
    () => filteredOrders.slice(pageStartIndex, pageStartIndex + ORDERS_PER_PAGE),
    [filteredOrders, pageStartIndex]
  );
  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxButtons = 5;
    let start = Math.max(1, safeCurrentPage - 2);
    let end = Math.min(totalPages, start + maxButtons - 1);

    start = Math.max(1, end - maxButtons + 1);

    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }

    return pages;
  }, [safeCurrentPage, totalPages]);

  const totalRechargeAmount = useMemo(() => {
    const totalsByCurrency = filteredOrders.reduce((map, order) => {
      const currencyCode = getOrderCurrencyCode(order);
      const amount = getOrderAmountValue(order);
      map.set(currencyCode, (map.get(currencyCode) || 0) + amount);
      return map;
    }, new Map());

    const totals = Array.from(totalsByCurrency.entries())
      .filter(([, amount]) => amount > 0)
      .map(([currencyCode, amount]) => formatCurrencyAmount(amount, currencyCode, currencies, locale));

    return totals.length ? totals.join(' + ') : formatCurrencyAmount(0, user?.currency || 'USD', currencies, locale);
  }, [currencies, filteredOrders, locale, user?.currency]);

  const selectedOrder = useMemo(
    () => enrichedOrders.find((order) => order.id === selectedOrderId) || null,
    [enrichedOrders, selectedOrderId]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [customEndDate, customStartDate, dateFilter, searchTerm, sortOrder, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    const orderIdFromQuery = String(searchParams.get('orderId') || '').trim();
    if (!orderIdFromQuery) return;

    setSelectedOrderId(orderIdFromQuery);
    void getOrderById(orderIdFromQuery, user?.id).catch(() => {});
  }, [getOrderById, searchParams, user?.id]);

  const formatCount = (value) => formatNumber(value, locale);
  const visibleStart = filteredOrders.length ? pageStartIndex + 1 : 0;
  const visibleEnd = Math.min(pageStartIndex + paginatedOrders.length, filteredOrders.length);
  const PreviousIcon = isArabic ? ChevronRight : ChevronLeft;
  const NextIcon = isArabic ? ChevronLeft : ChevronRight;

  return (
    <div className="min-w-0 space-y-3 pb-3">
      <section className="overflow-hidden rounded-xl border border-[color:rgb(var(--color-border-rgb)/0.82)] bg-[linear-gradient(135deg,rgb(var(--color-card-rgb)/0.96),rgb(var(--color-surface-rgb)/0.76))] shadow-[var(--shadow-medium)]">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.55fr)]">
          <div className="border-b border-[color:rgb(var(--color-border-rgb)/0.72)] p-3 sm:p-4 lg:border-b-0 lg:border-e">
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgb(var(--color-primary-rgb)/0.22),rgb(168_85_247/0.12))] text-white shadow-[0_10px_30px_-18px_rgb(var(--color-primary-rgb)/0.9)]">
                <PackageCheck className="h-5 w-5" />
              </span>
              <span className="text-sm font-extrabold tracking-tight text-[var(--color-text)]">
                {isArabic ? 'لوحة الطلبات' : 'Orders Hub'}
              </span>
            </div>
              <h1 className="mt-3 text-3xl font-black leading-tight text-[var(--color-text)]">
                {isArabic ? 'طلباتك' : 'Your Orders'}
              </h1>
              <p className="mt-1 max-w-lg text-sm leading-6 text-[var(--color-text-secondary)]">
                {isArabic
                  ? 'عرض ومتابعة كل الطلبات، والوصول لتفاصيل الشحن من هنا.'
                  : 'View and track all orders, and access shipping details from one place.'}
              </p>

              <div className="mt-4 flex items-center gap-3">
                <div className="inline-flex items-center justify-center rounded-full px-3 py-2 bg-[linear-gradient(90deg,var(--color-primary),#a855f7)] text-white font-black text-base shadow-[0_10px_30px_-18px_rgb(var(--color-primary-rgb)/0.9)]">
                  {formatCount(filteredOrders.length)}
                </div>
                <div className="text-sm font-semibold text-[var(--color-text-secondary)]">
                  {isArabic ? 'طلبات مطابقة' : 'matching orders'}
                </div>
              </div>
          </div>

          <div className="grid grid-cols-2 gap-2 p-2.5 sm:gap-2.5 sm:p-4 xl:grid-cols-4">
            <SummaryCard
              icon={ShoppingCart}
              label={isArabic ? 'إجمالي الطلبات' : 'Total orders'}
              value={formatCount(summary.total)}
              tone="sky"
            />
            <SummaryCard
              icon={Clock3}
              label={isArabic ? 'قيد التنفيذ' : 'In progress'}
              value={formatCount(summary.processing)}
              tone="amber"
            />
            <SummaryCard
              icon={CheckCircle2}
              label={isArabic ? 'مكتملة' : 'Completed'}
              value={formatCount(summary.completed)}
              tone="emerald"
            />
            <SummaryCard
              icon={Coins}
              label={isArabic ? 'إجمالي مبلغ الشحن' : 'Total recharge'}
              value={totalRechargeAmount}
              tone="rose"
            />
          </div>
        </div>
      </section>

      <OrdersFiltersBar
        isArabic={isArabic}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        dateFilter={dateFilter}
        onDateChange={setDateFilter}
        sortOrder={sortOrder}
        onSortChange={setSortOrder}
        compact
        collapsible
        defaultCollapsed
        showTypeFilter={false}
        showDateFilter={false}
        resultCount={filteredOrders.length}
        searchPlaceholder={isArabic
          ? 'ابحث باسم المنتج أو رقم الطلب'
          : 'Search by product name or order number'}
        helperText={isArabic
          ? 'اختار مدة البحث من تاريخ إلى تاريخ، أو اتركها فارغة لعرض كل الطلبات.'
          : 'Choose a from-to date range, or leave it empty to show all orders.'}
        customRange={{
          startDate: customStartDate,
          endDate: customEndDate,
          onStartDateChange: setCustomStartDate,
          onEndDateChange: setCustomEndDate,
          helperText: isArabic
            ? 'فلترة الطلبات حسب تاريخ الإنشاء من بداية اليوم الأول لنهاية اليوم الأخير.'
            : 'Filters orders by creation date from the start date through the end date.',
        }}
        onApplyFilters={() => {
          setCurrentPage(1);
        }}
      />

      {filteredOrders.length ? (
        <>
          <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
            {paginatedOrders.map((order) => (
              <CustomerOrderCard
                key={order.id}
                order={order}
                isArabic={isArabic}
                currencies={currencies}
                onSelect={() => {
                  setSelectedOrderId(order.id);
                  const nextParams = new URLSearchParams(searchParams);
                  nextParams.set('orderId', order.id);
                  setSearchParams(nextParams, { replace: true });
                  void getOrderById(order.id, user?.id).catch(() => {});
                }}
              />
            ))}
          </div>

          {totalPages > 1 ? (
            <nav
              className="flex flex-col gap-2 rounded-xl border border-[color:rgb(var(--color-border-rgb)/0.82)] bg-[color:rgb(var(--color-card-rgb)/0.78)] p-2.5 shadow-[var(--shadow-subtle)] sm:flex-row sm:items-center sm:justify-between"
              aria-label={isArabic ? 'صفحات الطلبات' : 'Orders pages'}
            >
              <p className="text-center text-xs font-bold text-[var(--color-text-secondary)] sm:text-start">
                {isArabic
                  ? `عرض ${formatCount(visibleStart)}-${formatCount(visibleEnd)} من ${formatCount(filteredOrders.length)} طلب`
                  : `Showing ${formatCount(visibleStart)}-${formatCount(visibleEnd)} of ${formatCount(filteredOrders.length)} orders`}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={safeCurrentPage === 1}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[color:rgb(var(--color-border-rgb)/0.78)] bg-[color:rgb(var(--color-surface-rgb)/0.58)] px-3 text-[11px] font-black text-[var(--color-text)] transition hover:-translate-y-0.5 hover:border-[color:rgb(var(--color-primary-rgb)/0.34)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
                >
                  <PreviousIcon className="h-3.5 w-3.5" />
                  <span>{isArabic ? 'الصفحة السابقة' : 'Previous page'}</span>
                </button>

                <div className="flex items-center gap-1" dir="ltr">
                  {pageNumbers[0] > 1 ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setCurrentPage(1)}
                        className="h-9 min-w-9 rounded-lg border border-[color:rgb(var(--color-border-rgb)/0.78)] bg-[color:rgb(var(--color-surface-rgb)/0.52)] px-3 text-[11px] font-black text-[var(--color-text)] transition hover:-translate-y-0.5 hover:border-[color:rgb(var(--color-primary-rgb)/0.34)]"
                      >
                        1
                      </button>
                      <span className="px-1 text-sm font-black text-[var(--color-muted)]">...</span>
                    </>
                  ) : null}

                  {pageNumbers.map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      aria-current={page === safeCurrentPage ? 'page' : undefined}
                      className={`h-9 min-w-9 rounded-lg border px-3 text-[11px] font-black transition hover:-translate-y-0.5 ${
                        page === safeCurrentPage
                          ? 'border-[color:rgb(var(--color-primary-rgb)/0.52)] bg-[linear-gradient(135deg,rgb(var(--color-primary-rgb)/0.2),rgb(168_85_247/0.14))] text-[var(--color-primary)] shadow-[0_0_24px_-16px_rgb(var(--color-primary-rgb)/0.9)]'
                          : 'border-[color:rgb(var(--color-border-rgb)/0.78)] bg-[color:rgb(var(--color-surface-rgb)/0.52)] text-[var(--color-text)] hover:border-[color:rgb(var(--color-primary-rgb)/0.34)]'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  {pageNumbers[pageNumbers.length - 1] < totalPages ? (
                    <>
                      <span className="px-1 text-sm font-black text-[var(--color-muted)]">...</span>
                      <button
                        type="button"
                        onClick={() => setCurrentPage(totalPages)}
                        className="h-9 min-w-9 rounded-lg border border-[color:rgb(var(--color-border-rgb)/0.78)] bg-[color:rgb(var(--color-surface-rgb)/0.52)] px-3 text-[11px] font-black text-[var(--color-text)] transition hover:-translate-y-0.5 hover:border-[color:rgb(var(--color-primary-rgb)/0.34)]"
                      >
                        {totalPages}
                      </button>
                    </>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[color:rgb(var(--color-primary-rgb)/0.32)] bg-[color:rgb(var(--color-primary-rgb)/0.1)] px-3 text-[11px] font-black text-[var(--color-primary)] shadow-[var(--shadow-subtle)] transition hover:-translate-y-0.5 hover:border-[color:rgb(var(--color-primary-rgb)/0.48)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
                >
                  <span>{isArabic ? 'الصفحة التالية' : 'Next page'}</span>
                  <NextIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </nav>
          ) : null}
        </>
      ) : (
        <EmptyOrdersState
          title={isLoading
            ? (isArabic ? 'جارٍ تحميل الطلبات' : 'Loading orders')
            : (isArabic ? 'لا توجد طلبات حتى الآن' : 'No orders yet')}
          description={isLoading
            ? (isArabic ? 'نقوم بجلب طلباتك الحالية من النظام.' : 'We are fetching your current orders from the system.')
            : (isArabic
              ? 'عندما تنشئ طلبًا جديدًا سيظهر هنا مع حالته وتفاصيله كاملة.'
              : 'Once you place a new order, it will appear here with its status and details.')}
          actionLabel={isLoading ? '' : (isArabic ? 'تصفح المنتجات' : 'Browse products')}
          actionTo={isLoading ? '' : '/products'}
        />
      )}

      <OrderDetailsDrawer
        isOpen={Boolean(selectedOrder)}
        onClose={() => {
          setSelectedOrderId(null);
          const nextParams = new URLSearchParams(searchParams);
          nextParams.delete('orderId');
          setSearchParams(nextParams, { replace: true });
        }}
        order={selectedOrder}
        isArabic={isArabic}
        currencies={currencies}
        view="customer"
      />
    </div>
  );
};

export default Orders;
