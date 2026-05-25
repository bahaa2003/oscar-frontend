import React, { useId, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, ChevronDown, CreditCard, ListFilter, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';
import Badge from '../ui/Badge';
import { cn } from '../ui/Button';

const fieldLabelClassName =
  'mb-1 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.1em] text-[var(--color-muted)]';

const FilterBar = ({ onFilterChange = () => {}, total = 0 }) => {
  const { dir } = useLanguage();
  const { t } = useTranslation();
  const isRTL = dir === 'rtl';
  const panelId = useId();

  const [isCollapsed, setIsCollapsed] = useState(true);
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
    { value: 'all', label: isRTL ? 'الكل' : 'All' },
    { value: 'completed', label: t('wallet.statusCompleted', { defaultValue: isRTL ? 'مكتمل' : 'Completed' }) },
    { value: 'pending', label: t('wallet.statusPending', { defaultValue: isRTL ? 'قيد الانتظار' : 'Pending' }) },
    { value: 'failed', label: t('wallet.statusFailed', { defaultValue: isRTL ? 'مرفوض' : 'Rejected' }) },
  ];

  const resultText = isRTL ? `${total} نتيجة` : `${total} results`;
  const titleText = isRTL ? 'بحث وتصفية' : 'Search and filter';
  const toggleText = isCollapsed
    ? (isRTL ? 'فتح الفلاتر' : 'Open filters')
    : (isRTL ? 'إخفاء الفلاتر' : 'Hide filters');

  const normalizeOutgoingFilters = (nextFilters) => ({
    ...nextFilters,
    type: nextFilters.type === 'credit'
      ? 'deposit'
      : nextFilters.type === 'debit'
        ? 'purchase'
        : nextFilters.type,
  });

  const applyFilters = (nextFilters = filters) => {
    onFilterChange(normalizeOutgoingFilters(nextFilters));
  };

  const handleStatusChange = (status) => {
    const nextFilters = { ...filters, status };
    setFilters(nextFilters);
    applyFilters(nextFilters);
  };

  const handleFieldChange = (key, value) => {
    setFilters((currentFilters) => ({ ...currentFilters, [key]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    applyFilters();
  };

  const walletFilterControlClassName = cn(
    'wallet-filter-control h-10 w-full appearance-none rounded-lg border border-white/10 bg-white/5 py-2.5 text-sm font-medium leading-normal text-white outline-none transition focus:border-purple-500',
    'placeholder:text-sm placeholder:text-gray-400',
    isRTL ? 'pl-9 pr-3 text-right' : 'pl-3 pr-9 text-left'
  );

  const walletFilterOptionClassName = 'bg-slate-950 text-sm font-medium text-white';

  const dateGridDir = useMemo(() => (isRTL ? 'rtl' : 'ltr'), [isRTL]);

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
          className={walletFilterControlClassName}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} className={walletFilterOptionClassName}>
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
        className={walletFilterControlClassName}
      />
    </label>
  );

  return (
    <motion.div
      initial={{ y: 14, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35 }}
      dir={dir}
      className="mb-3 flex flex-col gap-3"
    >
      <section className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-md">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {statusOptions.map((status) => {
            const isActive = filters.status === status.value;

            return (
              <button
                key={status.value}
                type="button"
                onClick={() => handleStatusChange(status.value)}
                className={cn(
                  'shrink-0 rounded-xl border px-4 py-2 text-xs font-black backdrop-blur-md transition-all',
                  isActive
                    ? 'border-[color:rgb(var(--color-primary-rgb)/0.45)] bg-[color:rgb(var(--color-primary-rgb)/0.22)] text-[var(--color-primary)] shadow-[0_0_28px_-12px_rgb(var(--color-primary-rgb)/0.85)]'
                    : 'border-white/10 bg-white/5 text-[var(--color-text-secondary)] hover:bg-white/10'
                )}
              >
                {status.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="relative isolate overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-2.5 shadow-[var(--shadow-subtle)] backdrop-blur-md sm:p-3">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -end-10 -top-10 h-28 w-28 rounded-full bg-[color:rgb(var(--color-primary-rgb)/0.12)] blur-2xl" />
        </div>

        <button
          type="button"
          onClick={() => setIsCollapsed((value) => !value)}
          aria-expanded={!isCollapsed}
          aria-controls={panelId}
          className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-start shadow-[var(--shadow-subtle)] transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[color:rgb(var(--color-primary-rgb)/0.24)]"
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[color:rgb(var(--color-primary-rgb)/0.2)] bg-[color:rgb(var(--color-primary-rgb)/0.1)] text-[var(--color-primary)]">
              <ListFilter className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] font-black uppercase tracking-[0.12em] text-[var(--color-muted)]">
                {titleText}
              </span>
              <span className="block truncate text-[11px] font-bold text-[var(--color-text-secondary)]">
                {toggleText}
              </span>
            </span>
          </span>

          <span className="flex shrink-0 items-center gap-2">
            <Badge variant="premium" className="rounded-md px-2 py-1 text-[10px]">
              {resultText}
            </Badge>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[var(--color-text-secondary)]">
              <ChevronDown className={cn('h-4 w-4 transition-transform', isCollapsed ? '' : 'rotate-180')} />
            </span>
          </span>
        </button>

        {!isCollapsed ? (
          <form id={panelId} onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3">
            <SelectField
              label={isRTL ? 'نوع العملية' : 'Transaction type'}
              icon={CreditCard}
              value={filters.type}
              onChange={(value) => handleFieldChange('type', value)}
              options={typeOptions}
            />

            <div className="grid grid-cols-2 gap-4" dir={dateGridDir}>
              <DateField
                label={isRTL ? 'من تاريخ' : 'From'}
                value={filters.startDate}
                max={filters.endDate || undefined}
                onChange={(value) => handleFieldChange('startDate', value)}
              />

              <DateField
                label={isRTL ? 'إلى تاريخ' : 'To'}
                value={filters.endDate}
                min={filters.startDate || undefined}
                onChange={(value) => handleFieldChange('endDate', value)}
              />
            </div>

            <button
              type="submit"
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-[color:rgb(var(--color-primary-rgb)/0.28)] bg-[linear-gradient(135deg,rgb(var(--color-primary-rgb)/0.22),rgb(168_85_247/0.14))] px-4 text-xs font-black text-[var(--color-primary)] shadow-[0_0_28px_-12px_rgb(var(--color-primary-rgb)/0.75)] transition-transform duration-150 hover:-translate-y-0.5"
            >
              <Search className="h-3.5 w-3.5" />
              <span>{isRTL ? 'بحث' : 'Search'}</span>
            </button>
          </form>
        ) : null}
      </section>
    </motion.div>
  );
};

export default FilterBar;
