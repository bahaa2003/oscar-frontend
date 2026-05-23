import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import useOrderStore from '../store/useOrderStore';
import { useLanguage } from '../context/LanguageContext';
import { devLogger } from '../utils/devLogger';

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
      backToOrders: 'Back to Orders',
      manual: 'Manual',
      automatic: 'Automatic',
      pending: 'Pending',
      processing: 'Processing',
      completed: 'Completed',
      failed: 'Failed',
      cancelled: 'Cancelled',
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
    backToOrders: 'العودة للطلبات',
    manual: 'يدوي',
    automatic: 'تلقائي',
    pending: 'قيد الانتظار',
    processing: 'قيد التنفيذ',
    completed: 'مكتمل',
    failed: 'فشل',
    cancelled: 'ملغى',
  };
};

const getStatusIcon = (status) => {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'success':
      return <CheckCircle2 className="h-5 w-5 text-green-400" />;
    case 'processing':
    case 'pending':
      return <Clock className="h-5 w-5 text-cyan-400" />;
    case 'failed':
    case 'cancelled':
      return <AlertCircle className="h-5 w-5 text-red-400" />;
    default:
      return <Clock className="h-5 w-5 text-cyan-400" />;
  }
};

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'success':
      return 'border-green-400/30 bg-green-400/10 text-green-300';
    case 'processing':
    case 'pending':
      return 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300';
    case 'failed':
    case 'cancelled':
      return 'border-red-400/30 bg-red-400/10 text-red-300';
    default:
      return 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300';
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return dateString;
  }
};

const OrderDetailsPage = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { language, dir } = useLanguage();
  const orders = useOrderStore((state) => state.orders);
  const copy = useMemo(() => getCopy(language), [language]);

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Find order
  useEffect(() => {
    // Support orderId passed as route param or as URL hash (e.g. /orders/#10009)
    const loc = location;
    const maybeHash = loc?.hash ? loc.hash.replace(/^#/, '') : '';
    const candidateId = orderId || maybeHash;

    if (!candidateId) {
      navigate('/orders');
      return;
    }

    const normalize = (v) => String(v || '').replace(/^#/, '').trim().toLowerCase();
    const target = normalize(candidateId);

    const found = orders?.find((o) => normalize(o.id) === target || normalize(o.orderId) === target);
    if (found) {
      setOrder(found);
    } else {
      devLogger.warn('Order not found', { orderId: candidateId });
      navigate('/orders');
    }
    setIsLoading(false);
  }, [orderId, orders, navigate]);

  if (isLoading || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(135deg,#0a0e1a_0%,#1a0f2e_50%,#0a0e1a_100%)]">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-t-fuchsia-400" />
          <p className="mt-4 text-cyan-300 text-sm">{copy.orderDetails}...</p>
        </div>
      </div>
    );
  }

  const statusLabel = copy[order.status?.toLowerCase()] || order.status;
  const typeLabel = copy[(order.type?.toLowerCase() === 'manual' ? 'manual' : 'automatic')] || order.type;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[linear-gradient(135deg,#0a0e1a_0%,#1a0f2e_50%,#0a0e1a_100%)] flex flex-col px-4 py-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-cyan-400/10 text-cyan-300 transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-cyan-300 flex-1">{copy.orderDetails}</h1>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto w-full space-y-4 pb-6">
        {/* Order Header Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/5 via-slate-900/50 to-fuchsia-400/5 backdrop-blur-xl p-6 shadow-[0_8px_32px_rgba(34,211,238,0.1)]"
        >
          <div className="space-y-4">
            {/* Order Number */}
            <div className="flex items-center justify-between pb-4 border-b border-cyan-400/10">
              <span className="text-sm text-cyan-200/60 font-medium">{copy.orderNumber}</span>
              <span className="text-lg font-bold text-cyan-300 font-mono">{order.id || order.orderId}</span>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-cyan-200/60 font-medium">{copy.status}</span>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getStatusColor(order.status)}`}>
                {getStatusIcon(order.status)}
                <span className="text-sm font-bold">{statusLabel}</span>
              </div>
            </div>

            {/* Order Type */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-cyan-200/60 font-medium">{copy.orderType}</span>
              <span className="text-sm font-bold text-cyan-300">{typeLabel}</span>
            </div>

            {/* Amount */}
            <div className="flex items-center justify-between pt-2 border-t border-cyan-400/10">
              <span className="text-sm text-cyan-200/60 font-medium">{copy.amount}</span>
              <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-cyan-300">
                ${parseFloat(order.total || order.amount || 0).toFixed(4)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Dates Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/5 via-slate-900/50 to-fuchsia-400/5 backdrop-blur-xl p-6 shadow-[0_8px_32px_rgba(34,211,238,0.1)]"
        >
          <h3 className="text-xs text-cyan-200/60 font-semibold mb-4 uppercase">{copy.personalInfo}</h3>
          <div className="space-y-3">
            {/* Created Date */}
            <div>
              <p className="text-xs text-cyan-200/60 font-medium mb-1">{copy.createdDate}</p>
              <p className="text-sm text-cyan-300">
                {formatDate(order.createdAt || order.timestamp || order.date)}
              </p>
            </div>

            {/* Updated Date */}
            {(order.updatedAt || order.lastUpdated) && (
              <div>
                <p className="text-xs text-cyan-200/60 font-medium mb-1">{copy.updatedDate}</p>
                <p className="text-sm text-cyan-300">
                  {formatDate(order.updatedAt || order.lastUpdated)}
                </p>
              </div>
            )}

            {/* Email */}
            {order.email && (
              <div>
                <p className="text-xs text-cyan-200/60 font-medium mb-1">{copy.email}</p>
                <p className="text-sm text-cyan-300 break-all">{order.email}</p>
              </div>
            )}

            {/* Player ID */}
            {(order.playerId || order.userId || order.customerId) && (
              <div>
                <p className="text-xs text-cyan-200/60 font-medium mb-1">{copy.playerId}</p>
                <p className="text-sm font-mono text-cyan-300">
                  {order.playerId || order.userId || order.customerId}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Additional Details */}
        {(order.description || order.notes || order.remarks) && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/5 via-slate-900/50 to-fuchsia-400/5 backdrop-blur-xl p-6 shadow-[0_8px_32px_rgba(34,211,238,0.1)]"
          >
            <h3 className="text-xs text-cyan-200/60 font-semibold mb-3 uppercase">ملاحظات</h3>
            <p className="text-sm text-cyan-300 leading-relaxed">
              {order.description || order.notes || order.remarks}
            </p>
          </motion.div>
        )}

        {/* Product Information */}
        {(order.productId || order.productName) && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/5 via-slate-900/50 to-fuchsia-400/5 backdrop-blur-xl p-6 shadow-[0_8px_32px_rgba(34,211,238,0.1)]"
          >
            <h3 className="text-xs text-cyan-200/60 font-semibold mb-4 uppercase">المنتج</h3>
            <div className="space-y-3">
              {order.productName && (
                <div className="flex justify-between items-start">
                  <span className="text-sm text-cyan-200/60">الاسم</span>
                  <span className="text-sm font-bold text-cyan-300 text-right">{order.productName}</span>
                </div>
              )}
              {order.quantity && (
                <div className="flex justify-between items-start">
                  <span className="text-sm text-cyan-200/60">الكمية</span>
                  <span className="text-sm font-bold text-cyan-300">{order.quantity}</span>
                </div>
              )}
              {order.productId && (
                <div className="flex justify-between items-start">
                  <span className="text-sm text-cyan-200/60">ID</span>
                  <span className="text-sm font-mono text-cyan-300">{order.productId}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Action Button */}
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={() => navigate('/orders')}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-pink-500 text-white font-bold text-sm transition hover:brightness-110 shadow-[0_0_20px_rgba(34,211,238,0.3),0_0_30px_rgba(168,85,247,0.2)]"
        >
          {copy.backToOrders}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default OrderDetailsPage;
