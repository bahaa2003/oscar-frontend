import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Coins, CreditCard, Sparkles, Target } from 'lucide-react';
import Button, { cn } from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import UploadProof from './UploadProof';
import { formatNumber } from '../../utils/intl';
import { resolveImageUrl } from '../../utils/imageUrl';
import { useToast } from '../ui/Toast';
import { isPaymentMethodAllowed } from '../../utils/paymentSettings';

const getPaymentMethodLabel = (method) => {
  const normalized = String(method || '').trim().toLowerCase();
  if (normalized === 'vodafone cash') return 'فودافون كاش';
  if (normalized === 'instapay') return 'إنستا باي';
  if (normalized === 'orange cash') return 'أورانج كاش';
  if (normalized === 'etisalat cash') return 'اتصالات كاش';
  if (normalized === 'binance') return 'بينانس';
  return method;
};

const TargetForm = ({ products = [], paymentMethods = [], onSubmit }) => {
  const [selectedAppId, setSelectedAppId] = useState('');
  const [coinAmount, setCoinAmount] = useState('');
  const [senderId, setSenderId] = useState('');
  const [transferNumber, setTransferNumber] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [proof, setProof] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const activeApps = useMemo(
    () => (products || []).filter((app) => app?.isActive !== false),
    [products]
  );

  const selectedApp = useMemo(
    () => activeApps.find((app) => String(app.id) === String(selectedAppId)) || activeApps[0] || null,
    [activeApps, selectedAppId]
  );

  const allowedPaymentMethods = useMemo(
    () => (Array.isArray(selectedApp?.allowedPaymentMethods) ? selectedApp.allowedPaymentMethods : []),
    [selectedApp]
  );

  const availablePaymentMethods = useMemo(
    () => paymentMethods.filter((method) => isPaymentMethodAllowed(method, allowedPaymentMethods)),
    [allowedPaymentMethods, paymentMethods]
  );

  const selectedPaymentMethod = useMemo(
    () => availablePaymentMethods.find((method) => String(method.id) === String(paymentMethodId)) || null,
    [availablePaymentMethods, paymentMethodId]
  );

  const coinAmountValue = Number(coinAmount || 0);
  const unitPrice = Number(selectedApp?.unitPrice || 0);
  const totalPrice = Math.max(0, coinAmountValue * unitPrice);

  useEffect(() => {
    if (!selectedApp && activeApps.length) {
      setSelectedAppId(activeApps[0].id);
      return;
    }
    if (selectedApp && !selectedAppId) {
      setSelectedAppId(selectedApp.id);
    }
  }, [activeApps, selectedApp, selectedAppId]);

  useEffect(() => {
    if (!availablePaymentMethods.length) {
      setPaymentMethodId('');
      return;
    }
    if (!availablePaymentMethods.some((method) => String(method.id) === String(paymentMethodId))) {
      setPaymentMethodId(availablePaymentMethods[0].id);
    }
  }, [availablePaymentMethods, paymentMethodId]);

  const resetForm = () => {
    setCoinAmount('');
    setSenderId('');
    setTransferNumber('');
    setProof(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedApp?.id || !Number.isInteger(coinAmountValue) || coinAmountValue <= 0 || !selectedPaymentMethod || !senderId.trim() || !transferNumber.trim() || !proof?.file) {
      addToast('أكمل بيانات طلب التارجت وارفع صورة إثبات التحويل.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        appId: selectedApp.id,
        coinAmount: coinAmountValue,
        senderId: senderId.trim(),
        transferNumber: transferNumber.trim(),
        paymentMethodId: selectedPaymentMethod.id,
        paymentMethod: selectedPaymentMethod.name,
        agentAccountId: selectedApp.agentAccountId || '',
        screenshotProof: proof.file,
      });
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="overflow-hidden rounded-2xl border-[color:rgb(var(--color-primary-rgb)/0.18)] bg-[linear-gradient(135deg,rgb(var(--color-card-rgb)/0.98),rgb(var(--color-surface-rgb)/0.84))] p-3 shadow-[0_24px_70px_-52px_rgb(var(--color-primary-rgb)/0.4)] sm:p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-2.5 rounded-2xl border border-[color:rgb(var(--color-primary-rgb)/0.14)] bg-[color:rgb(var(--color-primary-rgb)/0.06)] p-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full border border-[color:rgb(var(--color-primary-rgb)/0.2)] bg-[color:rgb(var(--color-card-rgb)/0.72)] px-2.5 py-1 text-[11px] font-bold text-[var(--color-primary)]">
              <Sparkles className="h-3.5 w-3.5" />
              OSCAR STORE Target
            </p>
            <h2 className="mt-2 text-lg font-black text-[var(--color-text)] sm:text-xl">بيع تارجت</h2>
          </div>
        </div>

        <section>
          <p className="mb-2 text-xs font-bold text-[var(--color-text)]">اختر تطبيق بيع التارجت</p>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {activeApps.map((app) => {
              const isSelected = String(app.id) === String(selectedApp?.id);
              return (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => setSelectedAppId(app.id)}
                  className={cn(
                    'group overflow-hidden rounded-2xl border bg-[color:rgb(var(--color-card-rgb)/0.94)] text-start shadow-[0_16px_44px_-38px_rgb(var(--color-primary-rgb)/0.48)] transition duration-300 hover:-translate-y-0.5 hover:scale-[1.005]',
                    isSelected
                      ? 'border-[color:rgb(var(--color-primary-rgb)/0.72)] shadow-[0_22px_70px_-36px_rgb(var(--color-primary-rgb)/0.65)]'
                      : 'border-[color:rgb(var(--color-border-rgb)/0.72)] hover:border-[color:rgb(var(--color-primary-rgb)/0.32)]'
                  )}
                >
                  <div className="relative h-24 overflow-hidden">
                    {app.image ? (
                      <img src={resolveImageUrl(app.image)} alt={app.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-black/30 text-[var(--color-primary)]">
                        <Target className="h-6 w-6" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                    {isSelected && (
                      <span className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary)] text-black">
                        <CheckCircle2 className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="line-clamp-1 text-sm font-black text-[var(--color-text)]">{app.name}</p>
                    <p className="mt-0.5 text-xs text-[var(--color-primary)]">
                      {formatNumber(app.unitPrice, 'en-US', { maximumFractionDigits: 2 })} EGP / كوين
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_17rem]">
          <div className="space-y-3">
            <section className="rounded-2xl border border-[color:rgb(var(--color-border-rgb)/0.72)] bg-[color:rgb(var(--color-surface-rgb)/0.62)] p-3">
              <p className="mb-3 text-xs font-black text-[var(--color-text)]">بيانات الطلب</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="عدد الكوينز"
                  type="number"
                  min="1"
                  step="1"
                  value={coinAmount}
                  onChange={(event) => setCoinAmount(event.target.value)}
                  placeholder="1000"
                />
                <Input
                  label="معرّف الحساب"
                  value={senderId}
                  onChange={(event) => setSenderId(event.target.value)}
                  placeholder="ID الحساب أو اللاعب داخل التطبيق المحدد"
                />
              </div>
            </section>

            <section className="rounded-2xl border border-[color:rgb(var(--color-border-rgb)/0.72)] bg-[color:rgb(var(--color-surface-rgb)/0.62)] p-3">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[color:rgb(var(--color-primary-rgb)/0.1)] text-[var(--color-primary)]">
                  <CreditCard className="h-4 w-4" />
                </span>
                <p className="text-xs font-black text-[var(--color-text)]">طريقة الدفع</p>
              </div>

              {availablePaymentMethods.length ? (
                <div className="grid gap-2 sm:grid-cols-4">
                  {availablePaymentMethods.map((method) => {
                    const isSelected = String(method.id) === String(paymentMethodId);
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethodId(method.id)}
                        className={cn(
                          'min-h-11 rounded-xl border px-2.5 py-2 text-xs font-black transition hover:-translate-y-0.5',
                          isSelected
                            ? 'border-[color:rgb(var(--color-primary-rgb)/0.62)] bg-[color:rgb(var(--color-primary-rgb)/0.13)] text-[var(--color-primary)] shadow-[0_14px_34px_-28px_rgb(var(--color-primary-rgb)/0.58)]'
                            : 'border-[color:rgb(var(--color-border-rgb)/0.78)] bg-[color:rgb(var(--color-card-rgb)/0.72)] text-[var(--color-text-secondary)] hover:border-[color:rgb(var(--color-primary-rgb)/0.3)]'
                        )}
                      >
                        {getPaymentMethodLabel(method.name)}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-xl border border-[color:rgb(var(--color-error-rgb)/0.22)] bg-[color:rgb(var(--color-error-rgb)/0.08)] px-3 py-2 text-xs font-bold text-[var(--color-error)]">
                  لا توجد طرق دفع مفعّلة لهذا التطبيق حاليًا.
                </p>
              )}

              <div className="mt-3">
                <Input
                  label="رقم التحويل"
                  value={transferNumber}
                  onChange={(event) => setTransferNumber(event.target.value)}
                  placeholder="رقم المحفظة أو حساب InstaPay"
                />
              </div>
            </section>

            <UploadProof label="صورة إثبات التحويل" value={proof} onChange={setProof} />
          </div>

          <aside className="h-fit rounded-2xl border border-[color:rgb(var(--color-primary-rgb)/0.18)] bg-[linear-gradient(180deg,rgb(var(--color-card-rgb)/0.98),rgb(var(--color-elevated-rgb)/0.82))] p-3 shadow-[0_22px_60px_-48px_rgb(var(--color-primary-rgb)/0.55)]">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[color:rgb(var(--color-primary-rgb)/0.13)] text-[var(--color-primary)]">
              <Coins className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold text-[var(--color-text-secondary)]">ملخص السعر</p>
            <div className="mt-3 space-y-2.5 text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--color-text-secondary)]">سعر الكوين</span>
                <strong className="text-[var(--color-text)]">{formatNumber(unitPrice, 'en-US', { maximumFractionDigits: 2 })} EGP</strong>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--color-text-secondary)]">الكوينز</span>
                <strong className="text-[var(--color-text)]">{formatNumber(coinAmountValue, 'en-US')}</strong>
              </div>
              <div className="border-t border-[color:rgb(var(--color-border-rgb)/0.72)] pt-2.5">
                <span className="text-xs text-[var(--color-text-secondary)]">الإجمالي</span>
                <p className="mt-1 text-xl font-black text-[var(--color-primary)] sm:text-2xl">
                  {formatNumber(totalPrice, 'en-US', { maximumFractionDigits: 2 })} EGP
                </p>
              </div>
            </div>
          </aside>
        </div>

        <Button type="submit" size="md" className="w-full rounded-xl" disabled={isSubmitting || !activeApps.length || !availablePaymentMethods.length}>
          <Target className="h-4 w-4" />
          {isSubmitting ? 'جارٍ إرسال الطلب...' : 'إرسال طلب التارجت'}
        </Button>
      </form>
    </Card>
  );
};

export default TargetForm;
