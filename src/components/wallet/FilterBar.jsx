import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, ChevronDown, CreditCard, ListFilter, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';
import { cn } from '../ui/Button';
import { selectClassName } from '../ui/Input';

const fieldLabelClassName =
  'mb-1 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.1em] text-[var(--color-muted)]';

const FilterBar = ({ onFilterChange = () => {}, total = 0 }) => {
  const { dir } = useLanguage();
  const { t } = useTranslation();
  const isRTL = dir === 'rtl';

  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    startDate: '',
    endDate: '',
  });

  const typeOptions = [
    { value: 'all', label: isRTL ? 'كل العمليات' : 'All' },
    { value: 'credit', label: isRTL ? 'إضافة رصيد' : 'Credit' },
    { value: 'debit', label: isRTL ? 'خصم من الرصيد' : 'Debit' },
  ];

  const statusOptions = [
    { value: 'all', label: isRTL ? 'كل الحالات' : 'All statuses' },
    { value: 'completed', label: t('wallet.statusCompleted', { defaultValue: isRTL ? 'مكتملة' : 'Completed' }) },
    { value: 'pending', label: t('wallet.statusPending', { defaultValue: isRTL ? 'قيد الانتظار' : 'Pending' }) },
    { value: 'failed', label: t('wallet.statusFailed', { defaultValue: isRTL ? 'فشلت' : 'Failed' }) },
  ];

  const isFiltered = useMemo(
    () => filters.type !== 'all' || filters.status !== 'all' || filters.startDate || filters.endDate,
    [filters]
  );

  const normalizeOutgoingFilters = (nextFilters) => ({
    ...nextFilters,
    type: nextFilters.type === 'credit'
      ? 'deposit'
      : nextFilters.type === 'debit'
        ? 'purchase'
        : nextFilters.type,
  });

  const handleFilterChange = (key, value) => {
    const nextFilters = { ...filters, [key]: value };
    setFilters(nextFilters);
    onFilterChange(normalizeOutgoingFilters(nextFilters));
  };

  const resetFilters = () => {
    const initialFilters = {
      type: 'all',
      status: 'all',
      startDate: '',
      endDate: '',
    };
    setFilters(initialFilters);
    onFilterChange(initialFilters);
  };

  const controlClassName = cn(
    selectClassName,
    'h-9 rounded-lg bg-[color:rgb(var(--color-card-rgb)/0.94)] px-2.5 text-[11px] font-bold shadow-none focus:shadow-none',
    isRTL ? 'pl-9 pr-3 text-right' : 'pl-3 pr-9 text-left'
  );

  const SelectField = ({ label, icon: Icon, value, onChange, options }) => (
    <label className="min-w-0">
      <span className={fieldLabelClassName}>
        <Icon className="h-3.5 w-3.5 text-[var(--color-primary)]" />
        {label}
      </span>
      <span className="relative block">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={controlClassName}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className={cn(
            'pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-muted)]',
            isRTL ? 'left-3' : 'right-3'
          )}
        />
      </span>
    </label>
  );

  const DateField = ({ label, value, onChange, min, max }) => (
    <label className="min-w-0">
      <span className={fieldLabelClassName}>
        <CalendarDays className="h-3.5 w-3.5 text-[var(--color-primary)]" />
        {label}
      </span>
      <input
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        className={controlClassName}
      />
    </label>
  );

  return (
    <motion.section
      initial={{ y: 14, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35 }}
      dir={dir}
      className="relative isolate mb-3 overflow-hidden rounded-xl border border-[color:rgb(var(--color-border-rgb)/0.82)] bg-[linear-gradient(135deg,rgb(var(--color-card-rgb)/0.92),rgb(var(--color-surface-rgb)/0.62))] p-2.5 shadow-[var(--shadow-subtle)] sm:p-3"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -end-10 -top-10 h-28 w-28 rounded-full bg-[color:rgb(var(--color-primary-rgb)/0.12)] blur-2xl" />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.12em] text-[var(--color-muted)]">
            <ListFilter className="h-3.5 w-3.5 text-[var(--color-primary)]" />
            {isRTL ? 'تصفية المحفظة' : 'Wallet filters'}
          </span>

          <div className="flex items-center gap-2">
            {total > 0 ? (
              <span className="rounded-md border border-[color:rgb(var(--color-primary-rgb)/0.18)] bg-[color:rgb(var(--color-primary-rgb)/0.1)] px-2 py-1 text-[10px] font-black text-[var(--color-primary)]">
                {isRTL ? `${total} نتيجة` : `${total} results`}
              </span>
            ) : null}

            {isFiltered ? (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-[color:rgb(var(--color-border-rgb)/0.72)] bg-[color:rgb(var(--color-card-rgb)/0.66)] px-2.5 text-[11px] font-black text-[var(--color-text-secondary)] transition hover:border-[color:rgb(var(--color-primary-rgb)/0.38)] hover:bg-[color:rgb(var(--color-card-rgb)/0.86)]"
              >
                <RotateCcw className="h-3 w-3" />
                <span>{isRTL ? 'إعادة تعيين' : 'Reset'}</span>
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <SelectField
            label={isRTL ? 'نوع العملية' : 'Transaction type'}
            icon={CreditCard}
            value={filters.type}
            onChange={(value) => handleFilterChange('type', value)}
            options={typeOptions}
          />

          <SelectField
            label={isRTL ? 'الحالة' : 'Status'}
            icon={ListFilter}
            value={filters.status}
            onChange={(value) => handleFilterChange('status', value)}
            options={statusOptions}
          />

          <DateField
            label={isRTL ? 'من تاريخ' : 'From'}
            value={filters.startDate}
            max={filters.endDate || undefined}
            onChange={(value) => handleFilterChange('startDate', value)}
          />

          <DateField
            label={isRTL ? 'إلى تاريخ' : 'To'}
            value={filters.endDate}
            min={filters.startDate || undefined}
            onChange={(value) => handleFilterChange('endDate', value)}
          />
        </div>
      </div>
    </motion.section>
  );
};

export default FilterBar;
