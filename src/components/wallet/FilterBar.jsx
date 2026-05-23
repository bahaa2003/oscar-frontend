import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Filter, Calendar, Tag, CheckCircle, RotateCcw, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';

const FilterBar = ({ onFilterChange, total = 0, currentPage = 1, pageSize = 15, onPageChange = () => {} }) => {
  const { dir } = useLanguage();
  const { t } = useTranslation();
  const isRTL = dir === 'rtl';

  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    startDate: '',
    endDate: ''
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key, value) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    onFilterChange(next);
  };

  const resetFilters = () => {
    const initialFilters = {
      type: 'all',
      status: 'all',
      startDate: '',
      endDate: ''
    };
    setFilters(initialFilters);
    onFilterChange(initialFilters);
  };

  const isFiltered = useMemo(() => {
    return filters.type !== 'all' || filters.status !== 'all' || filters.startDate || filters.endDate;
  }, [filters]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIndex = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, total);

  const typeOptions = [
    { value: 'all', label: t('wallet.allTypes'), icon: '📋' },
    { value: 'deposit', label: t('wallet.typeDeposit'), icon: '📥' },
    { value: 'withdrawal', label: t('wallet.typeWithdrawal'), icon: '📤' },
    { value: 'transfer', label: t('wallet.typeTransfer'), icon: '↔️' },
    { value: 'purchase', label: t('wallet.typePurchase'), icon: '🛒' }
  ];

  const statusOptions = [
    { value: 'all', label: t('wallet.allStatuses'), icon: '⭕' },
    { value: 'completed', label: t('wallet.statusCompleted'), icon: '✅' },
    { value: 'pending', label: t('wallet.statusPending'), icon: '⏳' },
    { value: 'failed', label: t('wallet.statusFailed'), icon: '❌' }
  ];

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.35 }}
      className="space-y-3"
    >
      {/* Filter Header */}
      <div className={`relative overflow-hidden rounded-[20px] border border-gray-200/60 bg-gradient-to-br from-white via-white/95 to-gray-50/80 p-3 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.08)] backdrop-blur-sm sm:p-4 dark:border-gray-800/60 dark:from-gray-900 dark:via-gray-900/95 dark:to-gray-800/80`}>
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-gradient-to-br from-blue-200/30 to-transparent blur-2xl dark:from-blue-900/20" />
        </div>

        <div className={`relative z-10 flex flex-wrap items-center justify-between gap-2 sm:gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {/* Title & Count */}
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg">
              <Filter className="h-3 w-3" />
            </div>

            <div>
              <h3 className="text-xs font-bold text-gray-900 dark:text-white sm:text-sm">
                فلترة المعاملات
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {total === 0 ? 'لا توجد عمليات' : `${startIndex}-${endIndex} من ${total} عملية`}
              </p>

              {/* Pagination under the count (1 . 2 . 3 و التالي + السابق) */}
              {total > pageSize && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-gray-500">عرض {pageSize}</span>
                  <button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    className="px-2 py-1 text-xs font-semibold text-gray-700 dark:text-gray-300"
                  >
                    السابق
                  </button>

                  {Array.from({ length: Math.min(3, totalPages) }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => onPageChange(p)}
                      className={`px-2 py-1 text-xs font-semibold ${p === currentPage ? 'bg-blue-500 text-white rounded' : 'text-gray-700 dark:text-gray-300'}`}
                    >
                      {p}
                    </button>
                  ))}

                  {totalPages > 3 && <span className="px-2 text-xs text-gray-500">...</span>}
                  <button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    className="ml-2 px-3 py-1 text-xs font-semibold text-gray-700 dark:text-gray-300"
                  >
                    التالي
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className={`flex items-center gap-1.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {isFiltered && (
              <motion.button
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 rounded-[12px] border border-amber-200/60 bg-gradient-to-br from-amber-100/60 to-amber-50/40 px-2 py-1.5 text-xs font-semibold text-amber-700 transition-all hover:border-amber-300/80 hover:bg-amber-100/80 dark:border-amber-900/40 dark:from-amber-950/60 dark:to-amber-900/30 dark:text-amber-300 dark:hover:border-amber-800/60 dark:hover:bg-amber-950/70 sm:text-xs"
              >
                <RotateCcw className="h-2.5 w-2.5" />
                إعادة تعيين
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsExpanded(!isExpanded)}
              className={`inline-flex items-center gap-1 rounded-[12px] border border-gray-300/60 bg-white/70 px-2 py-1.5 text-xs font-semibold text-gray-700 transition-all hover:bg-gray-100 dark:border-gray-700/60 dark:bg-gray-800/50 dark:text-gray-300 dark:hover:bg-gray-700 sm:text-xs ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <ChevronDown className={`h-2.5 w-2.5 transition-transform ${isExpanded ? (isRTL ? 'rotate-180' : 'rotate-0') : (isRTL ? 'rotate-0' : 'rotate-180')}`} />
              {isExpanded ? 'إخفاء الفلاتر' : 'عرض الفلاتر'}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Expandable Filters Section */}
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className={`relative overflow-hidden rounded-[20px] border border-gray-200/60 bg-gradient-to-br from-white via-white/95 to-gray-50/80 p-4 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.08)] backdrop-blur-sm dark:border-gray-800/60 dark:from-gray-900 dark:via-gray-900/95 dark:to-gray-800/80 space-y-4`}>
          <div className="absolute inset-0 -z-10">
            <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-gradient-to-br from-cyan-200/30 to-transparent blur-2xl dark:from-cyan-900/20" />
          </div>

          <div className="relative z-10">
            {/* Type & Status Row */}
            <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {/* Type Filter */}
              <div>
                <label className={`mb-2 inline-flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-white ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-xs">
                    🏷️
                  </span>
                  نوع العملية
                </label>
                <div className="relative">
                  <select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className={`w-full appearance-none rounded-[14px] border border-gray-300/60 bg-white/70 px-4 py-2.5 text-xs font-semibold text-gray-700 transition-all hover:border-gray-400/80 focus:border-blue-500/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700/60 dark:bg-gray-800/50 dark:text-gray-300 dark:hover:border-gray-600/80 dark:focus:border-blue-400/80 ${isRTL ? 'text-right pl-4 pr-10' : 'text-left pr-4 pl-10'}`}
                  >
                    {typeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className={`pointer-events-none absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 text-gray-600 dark:text-gray-400 ${isRTL ? 'left-3' : 'right-3'}`} />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className={`mb-2 inline-flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-white ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 text-xs">
                    ✅
                  </span>
                  الحالة
                </label>
                <div className="relative">
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className={`w-full appearance-none rounded-[14px] border border-gray-300/60 bg-white/70 px-4 py-2.5 text-xs font-semibold text-gray-700 transition-all hover:border-gray-400/80 focus:border-blue-500/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700/60 dark:bg-gray-800/50 dark:text-gray-300 dark:hover:border-gray-600/80 dark:focus:border-blue-400/80 ${isRTL ? 'text-right pl-4 pr-10' : 'text-left pr-4 pl-10'}`}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className={`pointer-events-none absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 text-gray-600 dark:text-gray-400 ${isRTL ? 'left-3' : 'right-3'}`} />
                </div>
              </div>
            </div>

            {/* Date Range Row */}
            <div className="mt-4 border-t border-gray-200/60 pt-4 dark:border-gray-800/60">
              <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {/* Start Date */}
                <div>
                  <label className={`mb-2 inline-flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-white ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-xs">
                      📅
                    </span>
                    التاريخ من
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className={`w-full rounded-[14px] border border-gray-300/60 bg-white/70 px-4 py-2.5 text-xs font-semibold text-gray-700 transition-all hover:border-gray-400/80 focus:border-blue-500/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700/60 dark:bg-gray-800/50 dark:text-gray-300 dark:hover:border-gray-600/80 dark:focus:border-blue-400/80 ${isRTL ? 'text-right' : 'text-left'}`}
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className={`mb-2 inline-flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-white ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-rose-500 text-xs">
                      📅
                    </span>
                    حتى التاريخ
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className={`w-full rounded-[14px] border border-gray-300/60 bg-white/70 px-4 py-2.5 text-xs font-semibold text-gray-700 transition-all hover:border-gray-400/80 focus:border-blue-500/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700/60 dark:bg-gray-800/50 dark:text-gray-300 dark:hover:border-gray-600/80 dark:focus:border-blue-400/80 ${isRTL ? 'text-right' : 'text-left'}`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FilterBar;
