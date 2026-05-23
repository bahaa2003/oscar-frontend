import React from 'react';
import { Eye } from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import OrderStatusBadge from './OrderStatusBadge';
import ManualOrderStatusControl from './ManualOrderStatusControl';
import { formatOrderDateTime, formatOrderMoney } from '../../utils/orders';

const OrdersTable = ({
  orders,
  isArabic,
  currencies,
  onViewOrder,
  showManualStatusControl = false,
  onUpdateOrderStatus = () => {},
  loadingOrderId = '',
}) => {
  const locale = isArabic ? 'ar-EG' : 'en-US';

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{isArabic ? 'المنتج' : 'Product'}</TableHead>
          <TableHead>{isArabic ? 'العميل' : 'Customer'}</TableHead>
          <TableHead>{isArabic ? 'التاريخ' : 'Date'}</TableHead>
          <TableHead>{isArabic ? 'الحالة' : 'Status'}</TableHead>
          <TableHead>{isArabic ? 'المورد' : 'Supplier'}</TableHead>
          <TableHead className="text-center">{isArabic ? 'الإجمالي' : 'Total'}</TableHead>
          <TableHead className="text-center">{isArabic ? 'الربح (USD)' : 'Profit (USD)'}</TableHead>
          {showManualStatusControl ? (
            <TableHead>{isArabic ? 'تغيير الحالة' : 'Change status'}</TableHead>
          ) : null}
          <TableHead className="text-end">{isArabic ? 'التفاصيل' : 'Details'}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 overflow-hidden rounded-[1rem] border border-[color:rgb(var(--color-border-rgb)/0.88)] bg-[color:rgb(var(--color-card-rgb)/0.8)]">
                  {order.productImage ? (
                    <img src={order.productImage} alt={order.productName} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-[var(--color-muted)]">
                      #
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--color-text)]">{order.productName}</p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    {isArabic ? `رقم الموقع #${order.siteOrderNumber || order.orderNumber}` : `Site order #${order.siteOrderNumber || order.orderNumber}`}
                  </p>
                  {order.primaryIdentifierField ? (
                    <p className="mt-1 truncate text-xs text-[var(--color-text-secondary)]">
                      {order.primaryIdentifierField.label}: {order.primaryIdentifierField.value}
                    </p>
                  ) : null}
                </div>
              </div>
            </TableCell>

            <TableCell>
              <div className="flex items-center gap-3">
                <img
                  src={order.customerAvatar}
                  alt={order.customerName}
                  loading="lazy"
                  decoding="async"
                  className="h-11 w-11 rounded-full border border-[color:rgb(var(--color-border-rgb)/0.9)] object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--color-text)]">{order.customerName}</p>
                  <p className="truncate text-xs text-[var(--color-muted)]">{order.customerEmail || '-'}</p>
                </div>
              </div>
            </TableCell>

            <TableCell>
              <div className="space-y-1">
                <p className="text-sm text-[var(--color-text)]">{formatOrderDateTime(order.createdAt, locale)}</p>
                <p className="text-xs text-[var(--color-muted)]">
                  {isArabic ? 'رقم الطلب الداخلي' : 'Internal order no.'} #{order.siteOrderNumber || order.orderNumber}
                </p>
              </div>
            </TableCell>

            <TableCell>
              <div className="flex flex-col items-start gap-2">
                <OrderStatusBadge status={order.status} isArabic={isArabic} />
                <Badge variant={order.typeVariant}>{order.typeLabel}</Badge>
              </div>
            </TableCell>

            <TableCell>
              {order.supplierName || order.supplierOrderNumber ? (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[var(--color-text)]">
                    {order.supplierName || (isArabic ? 'مورد مرتبط' : 'Linked supplier')}
                  </p>
                  <p className="text-xs text-[var(--color-muted)]">
                    {order.supplierOrderNumber
                      ? (isArabic ? `رقم المورد #${order.supplierOrderNumber}` : `Supplier order #${order.supplierOrderNumber}`)
                      : '-'}
                  </p>
                </div>
              ) : (
                <span className="text-sm text-[var(--color-muted)]">
                  {isArabic ? 'بدون مورد' : 'No supplier'}
                </span>
              )}
            </TableCell>

            <TableCell className="text-center">
              <span className="text-sm font-semibold text-[var(--color-text)]">
                {formatOrderMoney(order, currencies, locale)}
              </span>
            </TableCell>

            <TableCell className="text-center">
              <span className="text-sm font-semibold text-emerald-500">
                {order.profitUsd != null ? `$${Number(order.profitUsd).toFixed(6)}` : '-'}
              </span>
            </TableCell>

            {showManualStatusControl ? (
              <TableCell>
                {order.manualStatusEditable ? (
                  <ManualOrderStatusControl
                    order={order}
                    isArabic={isArabic}
                    isLoading={loadingOrderId === order.id}
                    onSubmit={onUpdateOrderStatus}
                    compact
                  />
                ) : (
                  <span className="text-xs text-[var(--color-muted)]">
                    {isArabic ? 'متاح للطلبات اليدوية فقط' : 'Manual orders only'}
                  </span>
                )}
              </TableCell>
            ) : null}

            <TableCell className="text-end">
              <Button variant="secondary" size="sm" onClick={() => onViewOrder(order)}>
                <Eye className="h-4 w-4" />
                <span>{isArabic ? 'عرض' : 'View'}</span>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default React.memo(OrdersTable);
