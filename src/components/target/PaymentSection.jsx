import React from 'react';
import { CreditCard } from 'lucide-react';
import { selectClassName } from '../ui/Input';

const PaymentSection = ({ methods, selectedMethodId, onMethodChange, accountValue, onAccountChange }) => {
  const selectedMethod = methods.find((method) => method.id === selectedMethodId);

  return (
    <div className="rounded-[1.5rem] border border-[color:rgb(var(--color-primary-rgb)/0.18)] bg-[#101010]/80 p-4 shadow-[0_22px_70px_-44px_rgb(var(--color-primary-rgb)/0.45)]">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color:rgb(var(--color-primary-rgb)/0.12)] text-[var(--color-primary)]">
          <CreditCard className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-bold text-[var(--color-text)]">طريقة الدفع</p>
          <p className="text-xs text-[var(--color-text-secondary)]">اختر الطريقة وسيظهر حساب التحويل.</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-[var(--color-text-secondary)]">طريقة الدفع</span>
          <select
            value={selectedMethodId}
            onChange={(event) => onMethodChange(event.target.value)}
            className={selectClassName}
          >
            {methods.map((method) => (
              <option key={method.id} value={method.id}>{method.name}</option>
            ))}
          </select>
        </label>

        {selectedMethod && (
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-[var(--color-text-secondary)]">
              {selectedMethod.accountLabel}
            </span>
            <input
              value={accountValue}
              onChange={(event) => onAccountChange(event.target.value)}
              className={selectClassName}
              placeholder={selectedMethod.accountValue}
            />
          </label>
        )}
      </div>
    </div>
  );
};

export default PaymentSection;
