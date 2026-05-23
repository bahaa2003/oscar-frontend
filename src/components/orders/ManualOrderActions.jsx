import React from 'react';
import { Check, X } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { getManualOrderPrimaryAction, getVisualOrderStatus } from '../../utils/orders';

const ManualOrderActions = ({
  order,
  isArabic,
  isLoading,
  onAccept,
  onReject,
}) => {
  const language = isArabic ? 'ar' : 'en';
  const primaryAction = getManualOrderPrimaryAction(order, language);
  const visualStatus = getVisualOrderStatus(order?.status);

  return (
    <Card variant="flat" className="border-[color:rgb(var(--color-primary-rgb)/0.2)] bg-[color:rgb(var(--color-primary-rgb)/0.06)] p-4">
      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-[var(--color-text)]">
            {isArabic ? 'إجراءات الطلب اليدوي' : 'Manual order actions'}
          </p>
          <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
            {visualStatus === 'processing'
              ? (isArabic
                ? 'تم اعتماد الطلب مسبقًا وهو الآن تحت التنفيذ. يمكنك تأكيد اكتماله أو رفضه إذا ظهرت مشكلة.'
                : 'This order is already in progress. You can mark it completed or reject it if something goes wrong.')
              : (isArabic
                ? 'الطلب غير مربوط بمورد خارجي، لذا تتم مراجعته وتنفيذه يدويًا من لوحة الأدمن.'
                : 'This order is not linked to an external supplier, so it is managed directly from the admin panel.')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button onClick={() => onAccept(order, primaryAction.nextStatus)} disabled={isLoading}>
            <Check className="h-4 w-4" />
            <span>{primaryAction.label}</span>
          </Button>
          <Button variant="danger" onClick={() => onReject(order)} disabled={isLoading}>
            <X className="h-4 w-4" />
            <span>{isArabic ? 'رفض الطلب' : 'Reject order'}</span>
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ManualOrderActions;

