import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/Header';
import UploadReceiptBox from '../../components/payment/UploadReceiptBox';
import useAuthStore from '../../store/useAuthStore';
import useSystemStore from '../../store/useSystemStore';
import { useToast } from '../../components/ui/Toast';
import { useLanguage } from '../../context/LanguageContext';
import { findPaymentMethodById } from '../../utils/paymentSettings';
import { getReadableErrorMessage } from '../../utils/errorMessages';
import apiClient from '../../services/client';

const PaymentDetails = () => {
  const { methodId } = useParams();
  const { user } = useAuthStore();
  const { paymentSettings, currencies, loadPaymentSettings, loadCurrencies } = useSystemStore();
  const { addToast } = useToast();
  const { t, dir, language } = useLanguage();
  const navigate = useNavigate();
  const isRTL = dir === 'rtl';

  // ── Resolve selected payment method from global state ──────────────────
  const resolved = useMemo(
    () => findPaymentMethodById(paymentSettings, methodId, { fallbackToDefault: false }),
    [paymentSettings, methodId]
  );
  const selectedMethod = resolved?.method ?? null;
  const selectedGroup = resolved?.group ?? null;

  // ── Build currency dropdown options from system store ──────────────────
  const currencyOptions = useMemo(() => {
    if (Array.isArray(currencies) && currencies.length > 0) {
      return currencies
        .filter((c) => c.isActive !== false)
        .map((c) => c.code || c.symbol || 'USD');
    }
    return ['EGP', 'USD', 'SAR'];
  }, [currencies]);

  // ── Form state ─────────────────────────────────────────────────────────
  const defaultCurrency =
    (user?.currency && currencyOptions.includes(user.currency.toUpperCase()))
      ? user.currency.toUpperCase()
      : currencyOptions[0] || 'EGP';

  const [formData, setFormData] = useState({
    amount: '',
    currency: defaultCurrency,
    notes: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', or null

  // ── Ensure payment settings & currencies are loaded ────────────────────
  useEffect(() => {
    loadPaymentSettings({ force: true });
    loadCurrencies();
  }, [loadPaymentSettings, loadCurrencies]);

  // ── Handlers ───────────────────────────────────────────────────────────

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileSelect = (file) => {
    setSelectedFile(file);
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.amount || !selectedFile) {
      addToast('يرجى إدخال المبلغ ورفع إيصال التحويل', 'error');
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      await apiClient.topups.create({
        requestedAmount: Number(formData.amount),
        currency: formData.currency,
        paymentMethodId: methodId,
        receipt: selectedFile,
        notes: formData.notes || '',
      });

      setSubmitStatus('success');
      addToast('تم إرسال طلبك بنجاح! سيتم مراجعته خلال 24 ساعة', 'success');

      // Reset form
      setFormData({ amount: '', currency: defaultCurrency, notes: '' });
      setSelectedFile(null);

      // Redirect back to wallet after a short delay
      setTimeout(() => {
        navigate('/wallet');
      }, 2500);
    } catch (error) {
      const msg = getReadableErrorMessage(
        error,
        language === 'en'
          ? 'Could not submit the request. Please try again.'
          : 'حدث خطأ في إرسال الطلب. يرجى المحاولة مرة أخرى.',
        { language }
      );
      setSubmitStatus('error');
      addToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/wallet/add-balance');
  };

  const handleMenuClick = () => {
    // Handle mobile menu
  };

  // ── Not found ──────────────────────────────────────────────────────────

  if (!selectedMethod) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-white text-2xl font-bold mb-2">طريقة دفع غير صحيحة</h1>
          <button
            onClick={() => navigate('/wallet/add-balance')}
            className="text-orange-400 hover:text-orange-300"
          >
            العودة لاختيار طريقة الدفع
          </button>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900" dir={dir}>
      <Header
        user={user}
        onMenuClick={handleMenuClick}
        showUserInfo={true}
      />

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back Button */}
        <motion.button
          initial={{ x: isRTL ? 50 : -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          onClick={handleBack}
          className={`flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
          العودة لاختيار طريقة الدفع
        </motion.button>

        {/* Page Header */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={`mb-8 ${isRTL ? 'text-right' : 'text-left'}`}
        >
          <h1 className="text-3xl font-bold text-white mb-2">تفاصيل الدفع</h1>
          <p className="text-gray-400">أكمل عملية الدفع لإضافة الرصيد إلى محفظتك</p>
        </motion.div>

        {/* Selected Method Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gradient-to-r from-orange-400/20 to-pink-500/20 backdrop-blur-xl border border-orange-400/30 rounded-xl p-6 mb-8"
        >
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="text-3xl">
              {selectedMethod.image
                ? <img src={selectedMethod.image} alt={selectedMethod.name} className="w-10 h-10 rounded-lg object-cover" />
                : (selectedMethod.type === 'bank_transfer' ? '🏦' : '📱')
              }
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">{selectedMethod.name}</h3>
              {selectedGroup && (
                <p className="text-gray-400">{selectedGroup.name}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Payment Form */}
        <motion.form
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Amount Input */}
          <div>
            <label className="block text-white font-semibold mb-2">المبلغ</label>
            <div className="flex gap-3">
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="أدخل المبلغ"
                className={`flex-1 bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
                required
              />
              <select
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                className={`w-24 bg-black/50 border border-white/20 rounded-lg px-3 py-3 text-white focus:outline-none focus:border-orange-400 transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
              >
                {currencyOptions.map((code) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Transfer Details */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">بيانات التحويل</h3>
            <div className="space-y-4">
              {selectedMethod.accountNumber && (
                <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-gray-400">رقم الحساب:</span>
                  <span className="text-white font-mono">{selectedMethod.accountNumber}</span>
                </div>
              )}
              {selectedMethod.accountName && (
                <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-gray-400">باسم:</span>
                  <span className="text-white">{selectedMethod.accountName}</span>
                </div>
              )}
              {selectedMethod.name && (
                <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-gray-400">اسم المستلم:</span>
                  <span className="text-white">{selectedMethod.name}</span>
                </div>
              )}
              {selectedMethod.bankName && (
                <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-gray-400">اسم البنك:</span>
                  <span className="text-white">{selectedMethod.bankName}</span>
                </div>
              )}
              {selectedMethod.instructions && (
                <div className="pt-4 border-t border-white/10">
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {selectedMethod.instructions}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Upload Receipt */}
          <UploadReceiptBox
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            onRemove={handleFileRemove}
          />

          {/* Notes */}
          <div>
            <label className="block text-white font-semibold mb-2">ملاحظات إضافية (اختياري)</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="أي ملاحظات إضافية..."
              rows={3}
              className={`w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-colors resize-none ${isRTL ? 'text-right' : 'text-left'}`}
            />
          </div>

          {/* Submit Status */}
          {submitStatus === 'success' && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 flex items-center gap-3"
            >
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-green-400 font-semibold">تم إرسال طلبك بنجاح!</p>
                <p className="text-green-300 text-sm">سيتم مراجعة طلبك خلال 24 ساعة</p>
              </div>
            </motion.div>
          )}

          {submitStatus === 'error' && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-red-400 font-semibold">حدث خطأ في إرسال الطلب</p>
                <p className="text-red-300 text-sm">يرجى المحاولة مرة أخرى</p>
              </div>
            </motion.div>
          )}

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
            whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
            aria-busy={isSubmitting}
            type="submit"
            className="w-full bg-gradient-to-r from-orange-400 to-pink-500 text-white py-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-orange-500/25 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                جاري الإرسال...
              </>
            ) : (
              'تأكيد الدفع'
            )}
          </motion.button>
        </motion.form>
      </div>
    </div>
  );
};

export default PaymentDetails;
