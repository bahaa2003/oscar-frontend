import React, { useEffect, useMemo, useState } from 'react';
// dev: touch to trigger rebuild
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Building2, ChevronDown, Smartphone, Wallet, Shield, FileText, Headphones, Zap, CreditCard, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import useAuthStore from '../store/useAuthStore';
import useSystemStore from '../store/useSystemStore';
import { resolveImageUrl } from '../utils/imageUrl';
import { formatWalletAmount } from '../utils/storefront';
import { getActivePaymentGroups } from '../utils/paymentSettings';

const getMethodsCountLabel = (count, isRTL) => {
    const safeCount = Number(count) || 0;

    if (!isRTL) {
        return `${safeCount} methods`;
    }

    if (safeCount === 1) return 'وسيلة واحدة';
    if (safeCount === 2) return 'وسيلتان';
    if (safeCount >= 3 && safeCount <= 10) return `${safeCount} وسائل`;
    return `${safeCount} وسيلة`;
};

const getGroupSummary = (group, isRTL) => {
    if (group?.description) return group.description;

    return isRTL
        ? `اختر من ${getMethodsCountLabel(group?.methods?.length, true)} المتاحة للشحن اليدوي.`
        : `Choose from ${getMethodsCountLabel(group?.methods?.length, false)} available for manual top-up.`;
};

const getMethodPresentation = (method) => {
    const token = `${method?.id || ''} ${method?.name || ''}`.toLowerCase();

    if (token.includes('vodafone')) {
        return { icon: Smartphone, color: 'from-red-500 via-rose-500 to-pink-500', glow: 'shadow-[0_0_0_1px_rgba(244,63,94,0.18),0_12px_24px_-16px_rgba(244,63,94,0.7)]' };
    }
    if (token.includes('etisalat')) {
        return { icon: Smartphone, color: 'from-emerald-500 via-green-500 to-teal-500', glow: 'shadow-[0_0_0_1px_rgba(34,197,94,0.18),0_12px_24px_-16px_rgba(34,197,94,0.7)]' };
    }
    if (token.includes('orange')) {
        return { icon: Smartphone, color: 'from-orange-500 via-amber-500 to-red-500', glow: 'shadow-[0_0_0_1px_rgba(249,115,22,0.18),0_12px_24px_-16px_rgba(249,115,22,0.72)]' };
    }
    if (String(method?.type || '') === 'bank_transfer') {
        return { icon: Building2, color: 'from-sky-500 via-blue-500 to-indigo-500', glow: 'shadow-[0_0_0_1px_rgba(59,130,246,0.18),0_12px_24px_-16px_rgba(59,130,246,0.72)]' };
    }

    return { icon: Smartphone, color: 'from-emerald-500 via-cyan-500 to-sky-500', glow: 'shadow-[0_0_0_1px_rgba(34,197,94,0.16),0_12px_24px_-16px_rgba(34,197,94,0.68)]' };
};

const CompactPaymentMethodTile = ({ method, presentation, onSelect, index, isRTL }) => {
    const IconComponent = presentation.icon;
    const hasImage = Boolean(method?.image);
    const ActionIcon = isRTL ? ArrowLeft : ArrowRight;

    return (
        <motion.button
            type="button"
            initial={{ y: 20, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, delay: index * 0.05, type: 'spring', stiffness: 400 }}
            whileHover={{ y: -8, scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => onSelect(method)}
            className="group relative isolate flex min-h-[140px] flex-col items-center justify-between overflow-hidden rounded-[20px] border border-gray-200/50 bg-gradient-to-br from-white via-white/95 to-gray-50/80 p-4 text-center shadow-[0_8px_16px_-6px_rgba(0,0,0,0.08)] transition-all hover:border-[#c89a3a]/60 hover:shadow-[0_16px_32px_-12px_rgba(200,154,58,0.25)] hover:from-white hover:to-[#faf8f3]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c89a3a] dark:border-gray-700/50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800/90 dark:to-gray-900/80 dark:hover:border-[#d8b45f]/60 dark:hover:from-gray-800 dark:hover:to-gray-900 sm:rounded-[24px] sm:p-5"
        >
            <div className="absolute inset-0 -z-10 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="absolute inset-0 bg-gradient-to-br from-[#c89a3a]/5 via-transparent to-transparent" />
            </div>

            {hasImage ? (
                <img
                    src={resolveImageUrl(method.image)}
                    alt={method.name}
                    className="h-14 w-14 rounded-[16px] border border-gray-200/60 bg-white object-cover shadow-[0_8px_16px_-8px_rgba(0,0,0,0.15)] transition-all group-hover:scale-110 group-hover:shadow-lg dark:border-gray-600/50 dark:bg-gray-950 sm:h-16 sm:w-16 sm:rounded-[20px]"
                    loading="lazy"
                    decoding="async"
                />
            ) : (
                <div className={`flex h-14 w-14 items-center justify-center rounded-[16px] bg-gradient-to-br ${presentation.color} text-white shadow-[0_12px_24px_-8px_rgba(0,0,0,0.2)] transition-all duration-300 group-hover:scale-125 group-hover:shadow-xl sm:h-16 sm:w-16 sm:rounded-[20px] ${presentation.glow}`}>
                    <IconComponent className="h-7 w-7 sm:h-8 sm:w-8" />
                </div>
            )}

            <div className="mt-3 space-y-2">
                <span className="line-clamp-2 min-h-[38px] text-xs font-bold leading-[18px] text-gray-900 dark:text-white">
                    {method.name}
                </span>
                <motion.span
                    whileHover={{ scale: 1.08 }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[color:rgb(var(--color-primary-rgb)/0.4)] bg-gradient-to-r from-[color:rgb(var(--color-primary-rgb)/0.12)] to-[color:rgb(var(--color-primary-rgb)/0.08)] px-3 py-1.5 text-[10px] font-bold text-[var(--color-primary)] shadow-sm transition-all group-hover:shadow-md"
                >
                    <span>{isRTL ? 'متابعة' : 'Continue'}</span>
                    <ActionIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </motion.span>
            </div>
        </motion.button>
    );
};

const AddBalance = () => {
    const { dir } = useLanguage();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { paymentSettings, loadPaymentSettings } = useSystemStore();
    const isRTL = dir === 'rtl';

    const [openGroupId, setOpenGroupId] = useState(null);

    useEffect(() => {
        void loadPaymentSettings({ force: true }).catch(() => null);
    }, [loadPaymentSettings]);

    const currentBalance = Number(user?.coins || 0);
    const currentCurrency = String(user?.currency || 'USD').toUpperCase();
    const balanceDisplayValue = formatWalletAmount(currentBalance, currentCurrency);
    const isNegativeBalance = currentBalance < 0;

    const paymentGroups = useMemo(
        () => getActivePaymentGroups(paymentSettings, { fallbackToDefault: false }),
        [paymentSettings]
    );

    useEffect(() => {
        if (!paymentGroups.length) {
            setOpenGroupId(null);
            return;
        }

        setOpenGroupId((previous) => (
            paymentGroups.some((group) => group.id === previous) ? previous : paymentGroups[0].id
        ));
    }, [paymentGroups]);

    const handleMethodSelect = (method) => {
        navigate(`/wallet/payment-details/${method.id}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 pb-8 sm:pb-12" dir={dir}>
            <div className="mx-auto w-full max-w-5xl space-y-5 px-3 sm:px-4 sm:space-y-6">
                
                {/* Hero Section */}
                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.05 }}
                    className="relative overflow-hidden rounded-[28px] border border-gray-200/60 bg-gradient-to-br from-white via-white/95 to-gray-50/80 p-6 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.08)] backdrop-blur-sm sm:rounded-[32px] sm:p-8 dark:border-gray-800/60 dark:from-gray-900 dark:via-gray-900/95 dark:to-gray-800/80"
                >
                    <div className="absolute inset-0 -z-10">
                        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-br from-blue-200/30 to-transparent blur-3xl dark:from-blue-900/20" />
                        <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-gradient-to-br from-purple-200/20 to-transparent blur-3xl dark:from-purple-900/10" />
                    </div>

                    <div className={`relative z-10 grid gap-6 lg:grid-cols-2 lg:items-center`}>
                        {/* Left Content */}
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.15 }}
                            className={isRTL ? 'text-right lg:text-right' : 'text-left'}
                        >
                            <div className={`flex flex-wrap items-center gap-3 ${isRTL ? 'justify-end' : 'justify-start'}`}>
                                <span className="inline-flex items-center gap-2 rounded-full border border-blue-200/60 bg-gradient-to-r from-blue-50 to-blue-50/50 px-4 py-2 text-xs font-bold text-blue-700 shadow-sm dark:border-blue-900/40 dark:from-blue-950/50 dark:to-blue-900/30 dark:text-blue-300">
                                    <Zap className="h-3.5 w-3.5" />
                                    {isRTL ? 'شحن يدوي' : 'Manual Top-up'}
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full border border-dashed border-gray-300 bg-gray-100/50 px-4 py-2 text-xs font-semibold text-gray-600 dark:border-gray-700/60 dark:bg-gray-800/30 dark:text-gray-400">
                                    <TrendingUp className="h-3.5 w-3.5" />
                                    {isRTL ? 'شحن تلقائي' : 'Auto Top-up'}
                                    <span className="ml-1.5 rounded-md border border-gray-400/40 bg-gray-200/40 px-1.5 py-0.5 text-[9px] font-medium dark:border-gray-600/40 dark:bg-gray-700/30">
                                        {isRTL ? 'قريبًا' : 'Soon'}
                                    </span>
                                </span>
                            </div>

                            <motion.h1
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.25 }}
                                className="mt-4 text-4xl font-black tracking-tight text-gray-950 sm:text-5xl dark:text-white"
                            >
                                {t('wallet.addBalance')}
                            </motion.h1>

                            {/* subtitle removed per request */}
                        </motion.div>

                        {/* Right: Balance Card (compact) */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="relative overflow-hidden rounded-md bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400 p-0.5 shadow-sm w-96 sm:w-[60rem] self-start dark:shadow-sm"
                        >
                            <div className="relative overflow-hidden rounded-md bg-gradient-to-br from-white to-blue-50/30 p-3 dark:from-gray-950 dark:to-blue-950/30 sm:p-4">
                                {/* Background Elements */}
                                <div className="absolute inset-0 opacity-30 dark:opacity-20">
                                    <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-gradient-to-br from-blue-400/40 to-transparent blur-2xl" />
                                    <div className="absolute -bottom-16 -left-16 h-32 w-32 rounded-full bg-gradient-to-br from-cyan-300/30 to-transparent blur-2xl" />
                                </div>

                                <div className="relative z-10 flex flex-col justify-between h-full">
                                    {/* Top Section */}
                                    <div>
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.6, delay: 0.3 }}
                                            className="text-xs font-semibold tracking-wider text-blue-700/70 uppercase dark:text-blue-300/60"
                                        >
                                            {t('wallet.currentBalance')}
                                        </motion.p>

                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.6, delay: 0.35 }}
                                            className="mt-4 flex items-baseline gap-2"
                                        >
                                            <span className={`text-sm sm:text-base font-black tracking-tight ${
                                                isNegativeBalance 
                                                    ? 'text-red-600 dark:text-red-400' 
                                                    : 'bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent dark:from-blue-300 dark:to-cyan-300'
                                            }`}>
                                                {balanceDisplayValue}
                                            </span>
                                        </motion.div>
                                    </div>

                                    {/* Bottom Section */}
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.6, delay: 0.4 }}
                                            className="mt-4 flex items-center justify-between pt-3 border-t border-blue-200/40 dark:border-blue-900/40"
                                        >
                                            <span className="inline-flex items-center gap-2 rounded-md border border-blue-300/50 bg-gradient-to-r from-blue-100/50 to-cyan-100/30 px-2 py-1 text-xs font-semibold text-blue-700 shadow-sm dark:border-blue-900/50 dark:from-blue-950/40 dark:to-cyan-950/30 dark:text-blue-300">
                                                <span className="inline-flex h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
                                                {currentCurrency}
                                            </span>

                                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-300/30 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 text-blue-600 dark:border-blue-900/30 dark:text-blue-300">
                                                <Wallet className="h-5 w-5" />
                                            </span>
                                        </motion.div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Payment Methods Section */}
                <motion.section
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="rounded-[28px] border border-gray-200/60 bg-gradient-to-br from-white via-white/95 to-gray-50/80 p-6 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.08)] backdrop-blur-sm sm:rounded-[32px] sm:p-8 dark:border-gray-800/60 dark:from-gray-900 dark:via-gray-900/95 dark:to-gray-800/80"
                >
                    <div className={isRTL ? 'text-right' : 'text-left'}>
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.35 }}
                            className="inline-flex items-center gap-2 rounded-full border border-purple-200/50 bg-gradient-to-r from-purple-50 to-purple-50/50 px-4 py-2 text-xs font-bold text-purple-700 dark:border-purple-900/40 dark:from-purple-950/50 dark:to-purple-900/30 dark:text-purple-300"
                        >
                            <CreditCard className="h-3.5 w-3.5" />
                            {isRTL ? 'خيارات الدفع' : 'Payment Options'}
                        </motion.div>

                        <motion.h2
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="mt-4 text-3xl font-bold text-gray-950 dark:text-white"
                        >
                            {isRTL ? 'اختر وسيلة الدفع' : 'Choose Payment Method'}
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.45 }}
                            className="mt-2 max-w-2xl text-base font-medium text-gray-600 dark:text-gray-300"
                        >
                            {isRTL 
                                ? 'اختر الطريقة المناسبة واضغط متابعة لإكمال عملية التحويل' 
                                : 'Select your preferred payment method and click continue to complete the transfer'}
                        </motion.p>
                    </div>

                    {paymentGroups.length > 0 ? (
                        <div className="mt-8 space-y-4 sm:space-y-5">
                            {paymentGroups.map((group, index) => {
                                const isOpen = openGroupId === group.id;

                                return (
                                    <motion.div
                                        key={group.id}
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ duration: 0.4, delay: 0.4 + index * 0.08 }}
                                        className="group/card relative isolate overflow-hidden rounded-[24px] border border-gray-200/50 bg-gradient-to-br from-white via-white/98 to-gray-50/90 shadow-[0_8px_16px_-6px_rgba(0,0,0,0.06)] transition-all hover:shadow-[0_12px_24px_-8px_rgba(0,0,0,0.1)] sm:rounded-[28px] dark:border-gray-800/50 dark:from-gray-900/80 dark:via-gray-900/90 dark:to-gray-800/80"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => setOpenGroupId((previous) => (previous === group.id ? null : group.id))}
                                            className="flex w-full flex-col gap-4 rounded-[22px] border border-gray-200/30 bg-gradient-to-br from-gray-50/50 to-white/30 px-5 py-4 text-start transition-all hover:border-gray-300/60 hover:bg-gradient-to-br hover:from-white/50 hover:to-white/20 dark:border-gray-700/30 dark:from-gray-800/50 dark:to-gray-900/30 dark:hover:from-gray-800/70 dark:hover:to-gray-900/50 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6 sm:py-5"
                                        >
                                            <div className={`flex min-w-0 items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                                {group.image ? (
                                                    <img
                                                        src={resolveImageUrl(group.image)}
                                                        alt={group.name}
                                                        className="h-14 w-14 shrink-0 rounded-[18px] border border-gray-200/60 bg-white object-cover shadow-[0_8px_16px_-8px_rgba(0,0,0,0.12)] transition-transform group-hover/card:scale-110 sm:h-16 sm:w-16 sm:rounded-[20px] dark:border-gray-700/60 dark:bg-gray-950"
                                                        loading="lazy"
                                                        decoding="async"
                                                    />
                                                ) : (
                                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-[0_12px_24px_-8px_rgba(59,130,246,0.3)] transition-all sm:h-16 sm:w-16 sm:rounded-[20px]">
                                                        <Building2 className="h-6 w-6 sm:h-7 sm:w-7" />
                                                    </div>
                                                )}

                                                <div className="min-w-0">
                                                    <div className={`flex flex-wrap items-center gap-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                                                        <h3 className="truncate text-lg font-bold text-gray-950 sm:text-xl dark:text-white">
                                                            {group.name}
                                                        </h3>
                                                        {group.currency && (
                                                            <motion.span
                                                                whileHover={{ scale: 1.05 }}
                                                                className="shrink-0 rounded-lg border border-blue-300/50 bg-gradient-to-r from-blue-100/60 to-blue-50/40 px-2.5 py-1 text-xs font-bold tracking-wide text-blue-700 shadow-sm dark:border-blue-900/40 dark:from-blue-950/40 dark:to-blue-900/30 dark:text-blue-300"
                                                            >
                                                                {String(group.currency).toUpperCase()}
                                                            </motion.span>
                                                        )}
                                                    </div>
                                                    <p className="mt-1.5 text-sm font-medium leading-5 text-gray-600 dark:text-gray-400">
                                                        {getGroupSummary(group, isRTL)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className={`flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-start ${isRTL ? 'flex-row-reverse' : ''}`}>
                                                <motion.span
                                                    whileHover={{ scale: 1.08 }}
                                                    className="rounded-full border border-purple-300/60 bg-gradient-to-r from-purple-100/70 to-purple-50/50 px-4 py-2 text-sm font-bold text-purple-700 shadow-sm transition-all dark:border-purple-900/40 dark:from-purple-950/50 dark:to-purple-900/30 dark:text-purple-300"
                                                >
                                                    {getMethodsCountLabel(group.methods.length, isRTL)}
                                                </motion.span>
                                                <motion.div
                                                    animate={{ rotate: isOpen ? 180 : 0 }}
                                                    transition={{ duration: 0.3 }}
                                                    className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200/50 bg-gray-100/50 text-gray-700 transition-all dark:border-gray-700/50 dark:bg-gray-800/50 dark:text-gray-300"
                                                >
                                                    <ChevronDown className="h-5 w-5" />
                                                </motion.div>
                                            </div>
                                        </button>

                                        <AnimatePresence initial={false}>
                                            {isOpen && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3, ease: 'easeOut' }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="grid grid-cols-2 gap-3 border-t border-gray-200/30 px-2 py-4 dark:border-gray-700/30 sm:gap-4 sm:px-4 min-[520px]:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                                                        {group.methods.map((method, methodIndex) => {
                                                            const presentation = getMethodPresentation(method);
                                                            const mappedMethod = {
                                                                ...method,
                                                                icon: presentation.icon,
                                                                color: presentation.color,
                                                                available: method.isActive !== false,
                                                            };

                                                            return (
                                                                <CompactPaymentMethodTile
                                                                    key={method.id}
                                                                    method={mappedMethod}
                                                                    presentation={presentation}
                                                                    onSelect={handleMethodSelect}
                                                                    index={methodIndex}
                                                                    isRTL={isRTL}
                                                                />
                                                            );
                                                        })}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="mt-8 rounded-2xl border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50/80 to-white/60 p-8 text-center shadow-sm dark:border-gray-700/60 dark:from-gray-900/50 dark:to-gray-800/40"
                    >
                        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-200/50 bg-gradient-to-br from-amber-100/50 to-amber-50/30 text-amber-600 dark:border-amber-900/40 dark:from-amber-950/40 dark:to-amber-900/30 dark:text-amber-400">
                            <CreditCard className="h-8 w-8" />
                        </div>
                            <p className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-300">
                                {isRTL ? 'لا توجد طرق دفع متاحة' : 'No payment methods available'}
                            </p>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                {isRTL 
                                    ? `للأسف لا توجد طرق دفع متاحة حاليًا لعملتك (${currentCurrency}). يرجى التواصل مع فريق الدعم.` 
                                    : `No payment methods are currently available for your currency (${currentCurrency}). Please contact our support team.`}
                            </p>
                    </motion.div>
                    )}

                    <div
                        className="inline-flex items-center gap-2 rounded-full border border-green-200/35 bg-green-50/55 px-3 py-1.5 text-[11px] font-bold text-green-700 dark:border-green-900/30 dark:bg-green-950/22 dark:text-green-300"
                    >
                        <Shield className="h-3.5 w-3.5" />
                        {isRTL ? 'لماذا نحن' : 'Why Choose Us'}
                    </div>

                    <h2 className={`mt-2 text-sm font-bold text-gray-950 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
                        {isRTL ? 'الميزات الأمنية والمزايا' : 'Security & Benefits'}
                    </h2>

                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                        {[
                            {
                                icon: Shield,
                                title: isRTL ? 'شحن آمن' : 'Secure',
                                desc: isRTL ? 'تشفير عالي المستوى' : 'High-level encryption',
                                color: 'from-green-500 to-emerald-500',
                            },
                            {
                                icon: FileText,
                                title: isRTL ? 'إيصال محفوظ' : 'Receipt',
                                desc: isRTL ? 'احتفظ بسجل معاملاتك' : 'Keep transaction record',
                                color: 'from-blue-500 to-cyan-500',
                            },
                            {
                                icon: Headphones,
                                title: isRTL ? 'دعم مباشر' : 'Support',
                                desc: isRTL ? 'فريق دعم متاح 24/7' : '24/7 Support Team',
                                color: 'from-purple-500 to-pink-500',
                            },
                        ].map((benefit, idx) => (
                            <div
                                key={idx}
                                className="relative overflow-hidden rounded-md border border-gray-200/35 bg-white/60 p-2 sm:p-3 dark:border-gray-800/35 dark:bg-gray-900/45"
                            >
                                <div className="absolute inset-0 -z-10 opacity-[0.025]">
                                    <div className={`absolute inset-0 bg-gradient-to-br ${benefit.color}`} />
                                </div>

                                <div
                                    className={`inline-flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br ${benefit.color} text-white`}
                                >
                                    <benefit.icon className="h-3.5 w-3.5" />
                                </div>

                                <h3 className="mt-1 text-sm font-bold text-gray-950 dark:text-white">
                                    {benefit.title}
                                </h3>
                                <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
                                    {benefit.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </motion.section>
            </div>
        </div>
    );
};

export default AddBalance;
