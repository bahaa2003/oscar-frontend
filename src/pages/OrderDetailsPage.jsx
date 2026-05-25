import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  BadgeDollarSign,
  CalendarClock,
  CheckCircle2,
  Clock,
  Hash,
  Info,
  Mail,
  Package,
  ReceiptText,
  RefreshCw,
  ShoppingBag,
  UserRound,
} from 'lucide-react';
import useOrderStore from '../store/useOrderStore';
import { useLanguage } from '../context/LanguageContext';
import { devLogger } from '../utils/devLogger';
import { formatOrderDuration, isCompletedOrderStatus } from '../utils/orders';

const getCopy = (language = 'ar') => {
  if (language === 'en') {
    return {
      orderNumber: 'Order Number',
      status: 'Status',
      orderType: 'Order Type',
      amount: 'Amount',
      createdDate: 'Created Date',
      updatedDate: 'Updated Date',
      email: 'Email',
      playerId: 'Player ID',
      orderDetails: 'Order Details',
      personalInfo: 'Personal Information',
      productInfo: 'Product Information',
      notes: 'Notes',
      productName: 'Product',
      productId: 'Product ID',
      quantity: 'Quantity',
      backToOrders: 'Back to Orders',
      manual: 'Manual',
      automatic: 'Automatic',
      pending: 'Pending',
      processing: 'Processing',
      completed: 'Completed',
      failed: 'Failed',
      cancelled: 'Cancelled',
      loading: 'Loading order details...',
    };
  }

  return {
    orderNumber: 'رقم الطلب',
    status: 'الحالة',
    orderType: 'نوع الطلب',
    amount: 'المبلغ',
    createdDate: 'تاريخ الإنشاء',
    updatedDate: 'آخر تحديث',
    email: 'البريد الإلكتروني',
    playerId: 'رقم اللاعب',
    orderDetails: 'تفاصيل الطلب',
    personalInfo: 'المعلومات الشخصية',
    productInfo: 'بيانات المنتج',
    notes: 'ملاحظات',
    productName: 'المنتج',
    productId: 'معرف المنتج',
    quantity: 'الكمية',
    backToOrders: 'العودة للطلبات',
    manual: 'يدوي',
    automatic: 'تلقائي',
    pending: 'قيد الانتظار',
    processing: 'قيد التنفيذ',
    completed: 'مكتمل',
    failed: 'فشل',
    cancelled: 'ملغى',
    loading: 'جاري تحميل تفاصيل الطلب...',
  };
};

const statusTone = (status) => {
  switch (String(status || '').toLowerCase()) {
    case 'completed':
    case 'success':
      return 'text-emerald-500 dark:text-emerald-300';
    case 'failed':
    case 'cancelled':
    case 'rejected':
      return 'text-rose-500 dark:text-rose-300';
    default:
      return 'text-cyan-600 dark:text-cyan-300';
  }
};

const getStatusIcon = (status) => {
  switch (String(status || '').toLowerCase()) {
    case 'completed':
    case 'success':
      return CheckCircle2;
    case 'failed':
    case 'cancelled':
    case 'rejected':
      return AlertCircle;
    default:
      return Clock;
  }
};

const normalizeOrderId = (value) => String(value || '').replace(/^#/, '').trim().toLowerCase();

const formatDate = (dateString, language = 'ar') => {
  if (!dateString) return '-';

  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return String(dateString);

  return parsed.toLocaleString(language === 'en' ? 'en-US' : 'ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const displayValue = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
};

const SectionHeader = ({ children }) => (
  <div className="-mx-4 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-500 dark:text-white/45 sm:-mx-5 sm:px-5">
    {children}
  </div>
);

const DetailRow = ({ icon: Icon, label, value, dir = 'auto', valueClassName = '' }) => (
  <div className="flex items-center justify-between gap-4 border-b border-white/5 py-3 last:border-0">
    <span className="inline-flex shrink-0 items-center gap-2 text-sm text-slate-500 dark:text-white/45">
      <Icon className="h-4 w-4 text-slate-400 dark:text-white/35" />
      <span>{label}</span>
    </span>
    <span
      dir={dir}
      className={`min-w-0 max-w-[58%] text-end text-sm font-medium text-slate-900 dark:text-white/85 ${valueClassName}`}
    >
      {React.isValidElement(value) ? value : displayValue(value)}
    </span>
  </div>
);

const StatusValue = ({ status, label }) => {
  const Icon = getStatusIcon(status);

  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${statusTone(status)}`}>
      <Icon className="h-4 w-4" />
      <span>{displayValue(label)}</span>
    </span>
  );
};

const OrderDetailsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId } = useParams();
  const { language, dir } = useLanguage();
  const orders = useOrderStore((state) => state.orders);
  const copy = useMemo(() => getCopy(language), [language]);

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const maybeHash = location?.hash ? location.hash.replace(/^#/, '') : '';
    const candidateId = orderId || maybeHash;

    if (!candidateId) {
      navigate('/orders');
      return;
    }

    const target = normalizeOrderId(candidateId);
    const found = orders?.find((item) => (
      normalizeOrderId(item.id) === target
      || normalizeOrderId(item.orderId) === target
      || normalizeOrderId(item.orderNumber) === target
      || normalizeOrderId(item.displayOrderId) === target
    ));

    if (found) {
      setOrder(found);
    } else {
      devLogger.warn('Order not found', { orderId: candidateId });
      navigate('/orders');
    }

    setIsLoading(false);
  }, [location?.hash, navigate, orderId, orders]);

  if (isLoading || !order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#0a0e1a_0%,#1a0f2e_50%,#0a0e1a_100%)]" dir={dir}>
        <div className="text-center">
          <div className="inline-flex h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-cyan-300" />
          <p className="mt-4 text-sm text-white/55">{copy.loading}</p>
        </div>
      </div>
    );
  }

  const statusLabel = copy[String(order.status || '').toLowerCase()] || order.status || '-';
  const typeLabel = copy[String(order.type || '').toLowerCase() === 'manual' ? 'manual' : 'automatic'] || order.type || '-';
  const orderNumber = order.orderNumber || order.displayOrderId || order.id || order.orderId;
  const amount = order.total ?? order.amount ?? order.priceCoins ?? order.price ?? '-';
  const customerIdentifier = order.playerId || order.customerId || order.userId;
  const notes = order.description || order.notes || order.remarks || order.rejectionReason;
  const orderDurationText = isCompletedOrderStatus(order.statusKey || order.status || statusLabel)
    ? formatOrderDuration(order.createdAt || order.timestamp || order.date, order.updatedAt || order.lastUpdated)
    : '';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[linear-gradient(135deg,#0a0e1a_0%,#1a0f2e_50%,#0a0e1a_100%)] px-4 py-6 text-slate-950 dark:text-white"
      dir={dir}
    >
      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/orders')}
            className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/70 backdrop-blur-md transition hover:bg-white/10 hover:text-white"
            aria-label={copy.backToOrders}
          >
            <ArrowLeft className={`h-5 w-5 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
          </button>
          <h1 className="text-lg font-bold text-white/90">{copy.orderDetails}</h1>
        </header>

        <motion.article
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-2 shadow-[0_28px_80px_-52px_rgba(0,0,0,0.95)] backdrop-blur-md sm:px-5"
        >
          <DetailRow
            icon={Hash}
            label={copy.orderNumber}
            value={orderNumber}
            dir="ltr"
            valueClassName="break-all font-mono text-xs"
          />
          <DetailRow
            icon={ReceiptText}
            label={copy.status}
            value={(
              <div className="flex flex-col items-center">
                <StatusValue status={order.status} label={statusLabel} />
                {orderDurationText ? (
                  <div className="mt-1 text-center text-[11px] font-medium text-gray-400">
                    {orderDurationText}
                  </div>
                ) : null}
              </div>
            )}
          />
          <DetailRow icon={Info} label={copy.orderType} value={typeLabel} />
          <DetailRow
            icon={BadgeDollarSign}
            label={copy.amount}
            value={amount}
            dir="ltr"
            valueClassName="break-all font-mono text-xs"
          />
          <DetailRow icon={CalendarClock} label={copy.createdDate} value={formatDate(order.createdAt || order.timestamp || order.date, language)} />

          {(order.updatedAt || order.lastUpdated) && (
            <DetailRow icon={RefreshCw} label={copy.updatedDate} value={formatDate(order.updatedAt || order.lastUpdated, language)} />
          )}

          {(order.email || customerIdentifier) && <SectionHeader>{copy.personalInfo}</SectionHeader>}

          {order.email && (
            <DetailRow
              icon={Mail}
              label={copy.email}
              value={order.email}
              dir="ltr"
              valueClassName="break-all text-xs"
            />
          )}

          {customerIdentifier && (
            <DetailRow
              icon={UserRound}
              label={copy.playerId}
              value={customerIdentifier}
              dir="ltr"
              valueClassName="break-all font-mono text-xs"
            />
          )}

          {(order.productName || order.quantity || order.productId) && <SectionHeader>{copy.productInfo}</SectionHeader>}

          {order.productName && (
            <DetailRow
              icon={Package}
              label={copy.productName}
              value={order.productName}
              valueClassName="break-words"
            />
          )}

          {order.quantity && (
            <DetailRow icon={ShoppingBag} label={copy.quantity} value={order.quantity} dir="ltr" />
          )}

          {order.productId && (
            <DetailRow
              icon={Hash}
              label={copy.productId}
              value={order.productId}
              dir="ltr"
              valueClassName="break-all font-mono text-xs"
            />
          )}

          {notes && <SectionHeader>{copy.notes}</SectionHeader>}

          {notes && (
            <DetailRow
              icon={Info}
              label={copy.notes}
              value={notes}
              valueClassName="break-words"
            />
          )}
        </motion.article>

        <motion.button
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.08, duration: 0.2 }}
          type="button"
          onClick={() => navigate('/orders')}
          className="mt-4 h-11 w-full rounded-xl border border-white/10 bg-white/10 text-sm font-semibold text-white/85 backdrop-blur-md transition hover:bg-white/20 hover:text-white"
        >
          {copy.backToOrders}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default OrderDetailsPage;
