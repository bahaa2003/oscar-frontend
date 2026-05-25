import React from 'react';
import { ImageIcon } from 'lucide-react';
import OrderStatusBadge from './OrderStatusBadge';
import {
  formatOrderDateTime,
  formatOrderMoney,
} from '../../utils/orders';

const CustomerOrderCard = ({ order, isArabic, currencies, onSelect }) => {
  const locale = isArabic ? 'ar-EG' : 'en-US';
  const orderNumber = order.siteOrderNumber || order.orderNumber || order.id;
  const amount = formatOrderMoney(order, currencies, locale);
  const createdAt = formatOrderDateTime(order.createdAt, locale);

  return (
    <button
      type="button"
      dir={isArabic ? 'rtl' : 'ltr'}
      onClick={() => onSelect(order)}
      className="group flex w-full min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-start shadow-[0_14px_36px_-28px_rgba(15,23,42,0.9)] backdrop-blur-md transition-all hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[color:rgb(var(--color-primary-rgb)/0.28)]"
    >
      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5">
        {order.productImage ? (
          <img
            src={order.productImage}
            alt={order.productName}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[var(--color-muted)]">
            <ImageIcon className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 pe-2">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="min-w-0 truncate text-sm font-bold text-[var(--color-text)]">
            {order.productName || (isArabic ? 'منتج غير معروف' : 'Unknown product')}
          </h2>
          <span className="shrink-0 rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-muted)]">
            #{orderNumber}
          </span>
        </div>
        <p className="mt-1 truncate text-xs text-[var(--color-text-secondary)]">
          {createdAt}
        </p>
      </div>

      <div className="ms-auto flex shrink-0 flex-col items-end gap-1.5">
        <span className="max-w-[7rem] truncate text-sm font-black text-[var(--color-text)]" title={amount}>
          {amount}
        </span>
        <OrderStatusBadge
          status={order.status}
          isArabic={isArabic}
          className="rounded-lg px-2 py-0.5 text-[10px]"
        />
      </div>
    </button>
  );
};

export default CustomerOrderCard;
