import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Wallet, AlertCircle, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import PaymentMethodCard from '../../components/wallet/PaymentMethodCard';
import useAuthStore from '../../store/useAuthStore';
import useSystemStore from '../../store/useSystemStore';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '../../utils/intl';
import { resolveImageUrl } from '../../utils/imageUrl';
import { CreditCard, Smartphone, Building, Banknote } from 'lucide-react';

// ── Icon resolver for groups/methods without uploaded images ──────────────
const getMethodIcon = (type) => {
  switch (String(type || '').toLowerCase()) {
    case 'mobile_wallet':
    case 'mobile':
    case 'ewallet':
      return Smartphone;
    case 'bank_transfer':
    case 'bank':
      return Building;
    case 'card':
    case 'credit_card':
      return CreditCard;
    case 'cash':
      return Banknote;
    default:
      return CreditCard;
  }
};

const AddBalance = () => {
  const { t, dir } = useLanguage();
  const { t: i18t } = useTranslation();
  const navigate = useNavigate();
  const isRTL = dir === 'rtl';

  const { user } = useAuthStore();
  const { paymentSettings, loadPaymentSettings } = useSystemStore();

  // ── Ensure payment settings are loaded ─────────────────────────────────
  useEffect(() => {
    loadPaymentSettings({ force: true });
  }, [loadPaymentSettings]);

  // ── Filter groups + methods by user currency ───────────────────────────
  const userCurrency = String(user?.currency || 'USD').toUpperCase();
  const walletBalance = Number(user?.walletBalance ?? 0);

  const filteredGroups = useMemo(() => {
    const groups = paymentSettings?.paymentGroups;
    if (!Array.isArray(groups)) return [];

    return groups
      .filter((group) => {
        // Must be active
        if (group.isActive === false) return false;
        return true;
      })
      .map((group) => ({
        ...group,
        // Filter methods within each group to only active ones
        methods: (group.methods || []).filter((m) => m.isActive !== false),
      }))
      // Remove groups with zero active methods after filtering
      .filter((group) => group.methods.length > 0);
  }, [paymentSettings]);

  const hasAnyMethods = filteredGroups.length > 0;
  const isLoading = !paymentSettings?.paymentGroups;

  // ── Handlers ───────────────────────────────────────────────────────────

  const handleMethodSelect = (method) => {
    navigate(`/wallet/payment-details/${method.id}`);
  };

  const handleBack = () => {
    navigate('/wallet');
  };

  const handleMenuClick = () => {
    // Handle mobile menu
  };

  // ── Enrich methods with icons for the card component ───────────────────
  const enrichMethod = (method, group) => ({
    ...method,
    icon: getMethodIcon(method.type || group.type),
    // Ensure the card can access group-level info if needed
    groupName: group.name,
    groupCurrency: group.currency,
  });

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900" dir={dir}>
      <Header
        user={user}
        onMenuClick={handleMenuClick}
        showUserInfo={true}
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <motion.button
          initial={{ x: isRTL ? 50 : -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          onClick={handleBack}
          className={`flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
          {isRTL ? 'العودة للمحفظة' : 'Back to Wallet'}
        </motion.button>

        {/* Page Header */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={`mb-8 ${isRTL ? 'text-right' : 'text-left'}`}
        >
          <h1 className="text-3xl font-bold text-white mb-2">
            {isRTL ? 'إضافة رصيد' : 'Add Balance'}
          </h1>
          <p className="text-gray-400">
            {isRTL
              ? 'اختر طريقة الدفع المناسبة لإضافة رصيد إلى محفظتك'
              : 'Choose a payment method to add balance to your wallet'}
          </p>
        </motion.div>

        {/* Current Balance Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6 mb-8"
        >
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-orange-400 to-pink-500 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">
                  {isRTL ? 'الرصيد الحالي' : 'Current Balance'}
                </p>
                <p className="text-white text-2xl font-bold">
                  {formatNumber(walletBalance, 'en-US')} {userCurrency}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <Loader className="w-8 h-8 text-orange-400 animate-spin mb-4" />
            <p className="text-gray-400">
              {isRTL ? 'جاري تحميل طرق الدفع...' : 'Loading payment methods...'}
            </p>
          </motion.div>
        )}

        {/* No Methods Available */}
        {!isLoading && !hasAnyMethods && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-8 text-center"
          >
            <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-white text-lg font-semibold mb-2">
              {isRTL ? 'لا توجد طرق دفع متاحة' : 'No Payment Methods Available'}
            </h3>
            <p className="text-gray-400 max-w-md mx-auto">
              {isRTL
                ? `لا توجد طرق دفع متاحة حاليًا لعملتك (${userCurrency}). يرجى التواصل مع الدعم.`
                : `No payment methods are currently available for your currency (${userCurrency}). Please contact support.`}
            </p>
          </motion.div>
        )}

        {/* Payment Groups */}
        {!isLoading && hasAnyMethods && (
          <div className="space-y-8">
            {filteredGroups.map((group, groupIndex) => (
              <motion.div
                key={group.id || group._id || groupIndex}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 + groupIndex * 0.1 }}
              >
                {/* Group Header */}
                <div className={`mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                  <div className={`flex items-center gap-3 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    {group.image ? (
                      <img
                        src={resolveImageUrl(group.image)}
                        alt={group.name}
                        className="w-8 h-8 rounded-lg object-cover border border-white/20"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-400/20 to-pink-500/20 border border-white/10 flex items-center justify-center">
                        {React.createElement(getMethodIcon(group.type), {
                          className: 'w-4 h-4 text-orange-400',
                        })}
                      </div>
                    )}
                    <h2 className="text-xl font-semibold text-white">{group.name}</h2>
                  </div>
                  {group.description && (
                    <p className="text-gray-400 text-sm">{group.description}</p>
                  )}
                </div>

                {/* Methods Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {group.methods.map((method, methodIndex) => (
                    <PaymentMethodCard
                      key={method.id || method._id || methodIndex}
                      method={enrichMethod(method, group)}
                      onSelect={handleMethodSelect}
                      index={methodIndex}
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Info Notice */}
        {!isLoading && hasAnyMethods && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className={`mt-8 bg-black/30 border border-white/5 rounded-xl p-4 ${isRTL ? 'text-right' : 'text-left'}`}
          >
            <p className="text-gray-500 text-sm">
              {isRTL
                ? 'بعد اختيار وسيلة الدفع ورفع الإيصال، سيتم مراجعة الطلب من الإدارة وإضافة الرصيد إلى المحفظة. قد يستغرق الأمر حتى 24 ساعة.'
                : 'After selecting a payment method and uploading your receipt, your request will be reviewed by admin and the balance will be added to your wallet. This may take up to 24 hours.'}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AddBalance;
