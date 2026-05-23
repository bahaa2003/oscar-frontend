import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Copy, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../ui/Toast';
import { resolveImageUrl } from '../../utils/imageUrl';

const PaymentMethodCard = ({ method, onSelect, index }) => {
  const { dir } = useLanguage();
  const { t } = useTranslation();
  const { addToast } = useToast();
  const isRTL = dir === 'rtl';

  const IconComponent = method.icon;
  const hasImage = Boolean(method.image);
  const title = String(method.displayName || method.name || '').trim();
  const description = String(method.description || '').trim();
  const groupLabel = String(method.groupLabel || '').trim();
  const instructionText = String(method.instructions || '').trim();

  const handleCopyAccount = async (event) => {
    event.stopPropagation();
    const value = String(method.accountNumber || '').trim();
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      addToast(
        t('payments.copySuccess', { defaultValue: dir === 'rtl' ? 'تم نسخ الرقم' : 'Number copied' }),
        'success'
      );
    } catch (_error) {
      addToast(
        t('payments.copyFailed', { defaultValue: dir === 'rtl' ? 'تعذر نسخ الرقم' : 'Unable to copy number' }),
        'error'
      );
    }
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="group relative"
    >
      <div
        className="relative cursor-pointer overflow-hidden rounded-[24px] border border-[color:rgb(var(--color-primary-rgb)/0.34)] bg-[linear-gradient(145deg,rgb(var(--color-primary-rgb)/0.12),rgba(124,58,237,0.1)_38%,rgb(var(--color-card-rgb)/0.94)_100%)] p-4 shadow-[0_18px_34px_-28px_rgb(var(--color-primary-rgb)/0.34)] transition-all hover:border-[color:rgb(var(--color-primary-rgb)/0.58)] sm:p-6"
        onClick={() => onSelect(method)}
      >
        <div className={`mb-3.5 flex items-start justify-between gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex min-w-0 items-start gap-3 sm:gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {hasImage ? (
              <img
                src={resolveImageUrl(method.image)}
                alt={method.name}
                className="h-11 w-11 shrink-0 rounded-[16px] border border-[color:rgb(var(--color-primary-rgb)/0.42)] object-cover shadow-[0_10px_20px_-16px_rgb(var(--color-primary-rgb)/0.42)] transition-transform group-hover:scale-110 sm:h-12 sm:w-12"
              />
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border border-[color:rgb(var(--color-primary-rgb)/0.48)] bg-[linear-gradient(135deg,rgb(var(--color-primary-rgb)/0.18),rgba(244,63,221,0.18))] text-[var(--color-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.48)] transition-transform group-hover:scale-110 sm:h-12 sm:w-12">
                <IconComponent className="h-6 w-6" />
              </div>
            )}
            <div className="min-w-0">
              {groupLabel ? (
                <p className="mb-1 text-[10px] font-semibold tracking-[0.08em] text-[var(--color-primary-soft)]">
                  {groupLabel}
                </p>
              ) : null}
              {title ? <h3 className="truncate text-[0.95rem] font-semibold text-[var(--color-text)] sm:text-lg">{title}</h3> : null}
              {description && (
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--color-primary-soft)] sm:text-sm">{description}</p>
              )}
            </div>
          </div>

          <div className={`flex shrink-0 items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {method.available === false && (
              <span className="rounded-full border border-red-300/60 bg-red-50/85 px-2 py-1 text-xs text-red-600">{t('common.unavailable')}</span>
            )}
            <ArrowLeft className={`h-5 w-5 text-[var(--color-primary-soft)] transition-colors group-hover:text-[var(--color-primary)] ${isRTL ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {method.accountNumber && (
          <div className="mb-3.5">
            <div className="rounded-[18px] border border-[color:rgb(var(--color-primary-rgb)/0.28)] bg-[color:rgb(var(--color-card-rgb)/0.55)] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] sm:p-4">
              {instructionText ? (
                <div className={`mb-2.5 text-[11px] leading-5 text-[var(--color-primary-soft)] sm:text-sm ${isRTL ? 'text-right' : 'text-left'}`}>
                  {instructionText}
                </div>
              ) : null}
              <div className={`mb-2 text-[10px] font-semibold tracking-[0.08em] text-[var(--color-primary-soft)] ${isRTL ? 'text-right' : 'text-left'}`}>
                {dir === 'rtl' ? 'رقم أو حساب التحويل' : 'Transfer account'}
              </div>
              <button
                type="button"
                onClick={handleCopyAccount}
                className={`flex w-full flex-col items-start gap-2 rounded-[14px] border border-[color:rgb(var(--color-primary-rgb)/0.4)] bg-[linear-gradient(135deg,rgb(var(--color-primary-rgb)/0.12),rgba(244,63,221,0.1))] px-3 py-2 font-mono text-[var(--color-text)] transition-colors hover:border-[color:rgb(var(--color-primary-rgb)/0.58)] hover:bg-[linear-gradient(135deg,rgb(var(--color-primary-rgb)/0.18),rgba(244,63,221,0.14))] sm:flex-row sm:items-center sm:justify-between ${
                  isRTL ? 'text-right' : 'text-left'
                }`}
              >
                <span className="w-full break-all text-sm leading-6 sm:w-auto sm:max-w-[70%] sm:truncate">{method.accountNumber}</span>
                <span className={`inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[var(--color-primary)] ${isRTL ? 'flex-row-reverse self-end sm:self-auto' : ''}`}>
                  <Copy className="h-3.5 w-3.5" />
                  <span>{t('payments.copyAccount', { defaultValue: dir === 'rtl' ? 'نسخ' : 'Copy' })}</span>
                </span>
              </button>
              {method.accountName && (
                <div className={`mt-2.5 rounded-[12px] border border-[color:rgb(var(--color-primary-rgb)/0.26)] bg-[linear-gradient(135deg,rgb(var(--color-primary-rgb)/0.08),rgba(244,63,221,0.08))] px-3 py-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                  <p className="text-[10px] font-semibold tracking-[0.08em] text-[var(--color-primary-soft)]">
                    {dir === 'rtl' ? 'اسم صاحب الحساب' : 'Account holder'}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-[var(--color-text)]">{method.accountName}</p>
                </div>
              )}
              {method.bankName && (
                <div className={`mt-2 text-xs leading-5 text-[var(--color-primary-soft)] ${isRTL ? 'text-right' : 'text-left'}`}>
                  {method.bankName}
                </div>
              )}
            </div>
          </div>
        )}

        <div className={`flex items-center gap-2 text-[11px] text-[var(--color-primary-soft)] ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Lock className="h-3 w-3" />
          <span>{t('payments.securityProtected')}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default PaymentMethodCard;
