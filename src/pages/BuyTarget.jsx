import React, { useCallback, useEffect, useMemo } from 'react';
import { ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TargetForm from '../components/target/TargetForm';
import Button from '../components/ui/Button';
import useAuthStore from '../store/useAuthStore';
import useTargetStore from '../store/useTargetStore';
import useSystemStore from '../store/useSystemStore';
import { useToast } from '../components/ui/Toast';
import { getActivePaymentMethods, isPaymentMethodAllowed } from '../utils/paymentSettings';

const TARGET_DATA_REFRESH_INTERVAL = 15 * 1000;

const BuyTarget = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { products, loadApps, submitRequest } = useTargetStore();
  const { paymentSettings, loadPaymentSettings } = useSystemStore();
  const { addToast } = useToast();

  const refreshData = useCallback(() => (
    Promise.allSettled([
      loadApps({ includeInactive: false }),
      loadPaymentSettings({ force: true }),
    ])
  ), [loadApps, loadPaymentSettings]);

  useEffect(() => {
    void refreshData();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      void refreshData();
    }, TARGET_DATA_REFRESH_INTERVAL);

    return () => window.clearInterval(intervalId);
  }, [refreshData]);

  const paymentMethods = useMemo(
    () => getActivePaymentMethods(paymentSettings, { fallbackToDefault: true }),
    [paymentSettings]
  );

  const handleSubmit = async (payload) => {
    const [freshAppsResult, freshPaymentSettingsResult] = await Promise.allSettled([
      loadApps({ includeInactive: false }),
      loadPaymentSettings({ force: true }),
    ]);

    const freshApps = freshAppsResult.status === 'fulfilled' ? freshAppsResult.value : products;
    const freshSettings = freshPaymentSettingsResult.status === 'fulfilled' ? freshPaymentSettingsResult.value : paymentSettings;
    const freshApp = (freshApps || []).find((app) => String(app.id) === String(payload.appId));
    const freshMethods = getActivePaymentMethods(freshSettings, { fallbackToDefault: true });
    const selectedMethod = freshMethods.find((method) => String(method.id) === String(payload.paymentMethodId));
    const isStillAllowed = freshApp && selectedMethod && isPaymentMethodAllowed(selectedMethod, freshApp.allowedPaymentMethods || freshApp.paymentMethodIds || []);

    if (!freshApp?.id) {
      addToast('التطبيق لم يعد متاحًا حاليًا. تم تحديث البيانات من السيرفر.', 'error');
      return;
    }

    if (!isStillAllowed) {
      addToast('طريقة الدفع لم تعد متاحة لهذا التطبيق. تم تحديث البيانات من السيرفر.', 'error');
      return;
    }

    await submitRequest({
      ...payload,
      appId: freshApp.id,
      paymentMethodId: selectedMethod.id,
      paymentMethod: selectedMethod.name,
      userId: user?.id || '',
      userName: user?.name || user?.fullName || '',
      userEmail: user?.email || '',
    });
    addToast('تم إرسال طلب التارجت بنجاح.', 'success');
  };

  return (
    <div className="compact-ui mx-auto max-w-6xl space-y-3 text-[var(--color-text)]" dir="rtl">
      <TargetForm products={products} paymentMethods={paymentMethods} onSubmit={handleSubmit} />
      <section className="rounded-2xl border border-[color:rgb(var(--color-primary-rgb)/0.16)] bg-[linear-gradient(135deg,rgb(var(--color-card-rgb)/0.92),rgb(var(--color-surface-rgb)/0.68))] p-3 shadow-[0_18px_48px_-42px_rgb(var(--color-primary-rgb)/0.32)]">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[color:rgb(var(--color-primary-rgb)/0.2)] bg-[color:rgb(var(--color-primary-rgb)/0.1)] text-[var(--color-primary)]">
              <ClipboardList className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-black text-[var(--color-text)]">طلبات التارجت السابقة</h2>
              <p className="mt-0.5 text-[11px] leading-5 text-[var(--color-text-secondary)]">
                تابع حالة طلباتك وافتح تفاصيل كل طلب من سجل مستقل.
              </p>
            </div>
          </div>

          <Button type="button" className="h-9 rounded-lg px-3 text-xs" onClick={() => navigate('/target-orders')}>
            <ClipboardList className="h-4 w-4" />
            عرض طلباتي
          </Button>
        </div>
      </section>
    </div>
  );
};

export default BuyTarget;
