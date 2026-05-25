import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
} from '../utils/orders';
import { formatNumber } from '../utils/intl';

const ORDERS_PER_PAGE = 8;

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
  const statusChips = [
    { value: 'all', label: isArabic ? 'الكل' : 'All' },
    { value: 'processing', label: isArabic ? 'قيد التنفيذ' : 'In progress' },
    { value: 'completed', label: isArabic ? 'مكتمل' : 'Completed' },
    { value: 'incomplete', label: isArabic ? 'مرفوض' : 'Rejected' },
  ];

  const openOrder = (order) => {
    setSelectedOrderId(order.id);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('orderId', order.id);
    setSearchParams(nextParams, { replace: true });
    void getOrderById(order.id, user?.id).catch(() => {});
  };

  return (
    <div className="min-w-0 space-y-3 pb-3" dir={isArabic ? 'rtl' : 'ltr'}>
      <section className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-md">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-black text-[var(--color-text)] sm:text-xl">
              {isArabic ? 'طلباتي' : 'My Orders'}
            </h1>
            <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
              {isArabic
                ? `${formatCount(filteredOrders.length)} طلب مطابق`
                : `${formatCount(filteredOrders.length)} matching orders`}
            </p>
          </div>
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {statusChips.map((chip) => {
            const isActive = statusFilter === chip.value;

            return (
              <button
                key={chip.value}
                type="button"
                onClick={() => setStatusFilter(chip.value)}
                className={`shrink-0 rounded-xl border px-4 py-2 text-xs font-black backdrop-blur-md transition-all ${
                  isActive
                    ? 'border-[color:rgb(var(--color-primary-rgb)/0.45)] bg-[color:rgb(var(--color-primary-rgb)/0.22)] text-[var(--color-primary)] shadow-[0_0_28px_-12px_rgb(var(--color-primary-rgb)/0.85)]'
                    : 'border-white/10 bg-white/5 text-[var(--color-text-secondary)] hover:bg-white/10'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
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
        showStatusFilter={false}
        showTypeFilter={false}
        showDateFilter={false}
        resultCount={filteredOrders.length}
        searchPlaceholder={isArabic ? 'ابحث باسم المنتج أو رقم الطلب' : 'Search by product name or order number'}
        helperText={isArabic
          ? 'استخدم البحث أو نطاق التاريخ لتضييق قائمة الطلبات.'
          : 'Use search or a date range to narrow the order list.'}
        customRange={{
          startDate: customStartDate,
          endDate: customEndDate,
          onStartDateChange: setCustomStartDate,
          onEndDateChange: setCustomEndDate,
          helperText: isArabic
            ? 'تصفية حسب تاريخ إنشاء الطلب.'
            : 'Filters orders by creation date.',
        }}
        onApplyFilters={() => {
          setCurrentPage(1);
        }}
      />

      {filteredOrders.length ? (
        <>
          <div className="flex flex-col gap-2">
            {paginatedOrders.map((order) => (
              <CustomerOrderCard
                key={order.id}
                order={order}
                isArabic={isArabic}
                currencies={currencies}
                onSelect={openOrder}
              />
            ))}
          </div>

          {totalPages > 1 ? (
            <nav
              className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between"
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
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-[11px] font-black text-[var(--color-text)] transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <PreviousIcon className="h-3.5 w-3.5" />
                  <span>{isArabic ? 'السابق' : 'Previous'}</span>
                </button>

                <div className="flex items-center gap-1" dir="ltr">
                  {pageNumbers[0] > 1 ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setCurrentPage(1)}
                        className="h-9 min-w-9 rounded-lg border border-white/10 bg-white/5 px-3 text-[11px] font-black text-[var(--color-text)] transition hover:bg-white/10"
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
                      className={`h-9 min-w-9 rounded-lg border px-3 text-[11px] font-black transition ${
                        page === safeCurrentPage
                          ? 'border-[color:rgb(var(--color-primary-rgb)/0.45)] bg-[color:rgb(var(--color-primary-rgb)/0.2)] text-[var(--color-primary)] shadow-[0_0_24px_-14px_rgb(var(--color-primary-rgb)/0.85)]'
                          : 'border-white/10 bg-white/5 text-[var(--color-text)] hover:bg-white/10'
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
                        className="h-9 min-w-9 rounded-lg border border-white/10 bg-white/5 px-3 text-[11px] font-black text-[var(--color-text)] transition hover:bg-white/10"
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
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-[11px] font-black text-[var(--color-primary)] transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <span>{isArabic ? 'التالي' : 'Next'}</span>
                  <NextIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </nav>
          ) : null}
        </>
      ) : (
        <EmptyOrdersState
          title={isLoading
            ? (isArabic ? 'جاري تحميل الطلبات' : 'Loading orders')
            : (isArabic ? 'لا توجد طلبات حتى الآن' : 'No orders yet')}
          description={isLoading
            ? (isArabic ? 'نقوم بجلب طلباتك الحالية من النظام.' : 'We are fetching your current orders from the system.')
            : (isArabic
              ? 'عندما تنشئ طلبًا جديدًا سيظهر هنا مع حالته وتفاصيله.'
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
