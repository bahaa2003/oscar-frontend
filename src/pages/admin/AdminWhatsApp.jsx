import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  MessageCircle,
  QrCode,
  RefreshCw,
  Smartphone,
  WifiOff,
} from 'lucide-react';
import apiClient from '../../services/client';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';

const POLL_INTERVAL_MS = 4000;

const DEFAULT_STATUS = {
  state: 'INITIALIZING',
  qrCode: null,
  isConnected: false,
  isInitializing: true,
  lastError: '',
};

const STATE_META = {
  CONNECTED: {
    label: 'متصل',
    className: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
  },
  QR_READY: {
    label: 'بانتظار المسح',
    className: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
  },
  INITIALIZING: {
    label: 'جاري التشغيل',
    className: 'border-amber-400/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  },
  AUTHENTICATED: {
    label: 'تم التحقق',
    className: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
  },
  DISCONNECTED: {
    label: 'غير متصل',
    className: 'border-rose-400/30 bg-rose-500/10 text-rose-700 dark:text-rose-300',
  },
  ERROR: {
    label: 'خطأ',
    className: 'border-rose-400/30 bg-rose-500/10 text-rose-700 dark:text-rose-300',
  },
};

const normalizeStatus = (status) => ({
  ...DEFAULT_STATUS,
  ...(status || {}),
  state: String(status?.state || DEFAULT_STATUS.state).trim().toUpperCase(),
});

const StatusPill = ({ state }) => {
  const meta = STATE_META[state] || STATE_META.DISCONNECTED;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${meta.className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current shadow-[0_0_12px_currentColor]" />
      {meta.label}
    </span>
  );
};

const AdminWhatsApp = () => {
  const { addToast } = useToast();
  const [status, setStatus] = useState(DEFAULT_STATUS);
  const [isLoading, setIsLoading] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const isConnected = Boolean(status?.isConnected || status?.state === 'CONNECTED');
  const shouldPoll = !isConnected;
  const stateMeta = useMemo(() => STATE_META[status.state] || STATE_META.DISCONNECTED, [status.state]);

  const fetchStatus = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setIsLoading(true);

    try {
      const nextStatus = await apiClient.whatsapp.getStatus();
      setStatus(normalizeStatus(nextStatus));
    } catch (error) {
      setStatus((prev) => normalizeStatus({
        ...prev,
        state: 'ERROR',
        isConnected: false,
        isInitializing: false,
        lastError: error?.message || 'تعذر تحميل حالة خدمة الواتساب.',
      }));

      if (!silent) {
        addToast(error?.message || 'تعذر تحميل حالة خدمة الواتساب.', 'error');
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (!shouldPoll) return undefined;

    const intervalId = window.setInterval(() => {
      fetchStatus({ silent: true });
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [fetchStatus, shouldPoll]);

  const handleReconnect = async () => {
    setIsReconnecting(true);

    try {
      const nextStatus = await apiClient.whatsapp.reconnect();
      setStatus(normalizeStatus(nextStatus));
      addToast('تمت إعادة تشغيل خدمة الواتساب.', 'success');
      await fetchStatus({ silent: true });
    } catch (error) {
      addToast(error?.message || 'تعذر إعادة تشغيل خدمة الواتساب.', 'error');
    } finally {
      setIsReconnecting(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5" dir="rtl">
      <section className="admin-premium-hero relative overflow-hidden p-3 sm:p-5">
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[color:rgb(var(--color-primary-rgb)/0.18)] bg-[color:rgb(var(--color-primary-rgb)/0.08)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp Bot
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-text)] sm:text-3xl">
              تكامل الواتساب
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
              امسح رمز QR لتوصيل حساب الواتساب ومتابعة حالة خدمة الإشعارات من لوحة التحكم.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <StatusPill state={status.state} />
            <Button
              type="button"
              variant="secondary"
              onClick={handleReconnect}
              disabled={isReconnecting}
              className="h-10 rounded-xl px-4 text-xs"
            >
              <RefreshCw className={`h-4 w-4 ${isReconnecting ? 'animate-spin' : ''}`} />
              إعادة تشغيل
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
        <Card className="admin-premium-panel min-h-[360px] p-4 sm:p-6">
          <div className="flex h-full min-h-[320px] items-center justify-center">
            {isLoading && status.state === 'INITIALIZING' ? (
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-400/25 bg-amber-500/10 text-amber-500 dark:text-amber-300">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
                <h2 className="mt-5 text-xl font-bold text-[var(--color-text)]">
                  جاري تشغيل خدمة الواتساب...
                </h2>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                  يتم تجهيز الجلسة الآن، سيظهر رمز QR تلقائيًا عند توفره.
                </p>
              </div>
            ) : isConnected ? (
              <div className="mx-auto max-w-xl text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-emerald-400/30 bg-emerald-500/10 text-emerald-600 shadow-[0_24px_80px_-40px_rgba(16,185,129,0.75)] dark:text-emerald-300">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h2 className="mt-6 text-2xl font-bold text-[var(--color-text)]">
                  خدمة الواتساب متصلة وتعمل بنجاح
                </h2>
                <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                  الجلسة محفوظة ويمكن للنظام إرسال إشعارات واتساب إلى رقم الأدمن المحدد في إعدادات الخادم.
                </p>
              </div>
            ) : status.state === 'QR_READY' && status.qrCode ? (
              <div className="mx-auto grid w-full max-w-3xl gap-6 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
                <div className="mx-auto rounded-[2rem] border border-[color:rgb(var(--color-border-rgb)/0.7)] bg-white p-3 shadow-[0_28px_80px_-48px_rgba(6,182,212,0.8)]">
                  <img
                    src={status.qrCode}
                    alt="WhatsApp QR"
                    className="h-56 w-56 rounded-2xl object-contain sm:h-64 sm:w-64"
                  />
                </div>

                <div className="min-w-0 text-center md:text-right">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 md:mx-0">
                    <QrCode className="h-6 w-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-[var(--color-text)]">
                    امسح رمز QR من تطبيق واتساب
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                    افتح واتساب على الهاتف، ثم الأجهزة المرتبطة، واضغط على ربط جهاز جديد لمسح الرمز.
                  </p>
                  <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-700 dark:text-cyan-300">
                    <Smartphone className="h-4 w-4" />
                    يتم تحديث الحالة تلقائيًا بعد المسح
                  </div>
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-xl text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-400/25 bg-rose-500/10 text-rose-700 dark:text-rose-300">
                  {status.state === 'ERROR' ? <AlertTriangle className="h-8 w-8" /> : <WifiOff className="h-8 w-8" />}
                </div>
                <h2 className="mt-5 text-xl font-bold text-[var(--color-text)]">
                  خدمة الواتساب غير متصلة
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                  اضغط إعادة تشغيل لإنشاء جلسة جديدة أو لإظهار رمز QR مرة أخرى.
                </p>
              </div>
            )}
          </div>
        </Card>

        <Card className="admin-premium-panel p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                Status
              </p>
              <h2 className="mt-1 text-lg font-bold text-[var(--color-text)]">
                حالة الاتصال
              </h2>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[color:rgb(var(--color-primary-rgb)/0.2)] bg-[color:rgb(var(--color-primary-rgb)/0.08)] text-[var(--color-primary)]">
              <MessageCircle className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-[color:rgb(var(--color-border-rgb)/0.72)] bg-[color:rgb(var(--color-card-rgb)/0.62)] p-3">
              <p className="text-xs text-[var(--color-text-secondary)]">الحالة الحالية</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-base font-bold text-[var(--color-text)]">{stateMeta.label}</p>
                <StatusPill state={status.state} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[color:rgb(var(--color-border-rgb)/0.72)] bg-[color:rgb(var(--color-card-rgb)/0.62)] p-3">
                <p className="text-xs text-[var(--color-text-secondary)]">متصل</p>
                <p className={`mt-2 text-lg font-bold ${isConnected ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                  {isConnected ? 'نعم' : 'لا'}
                </p>
              </div>
              <div className="rounded-2xl border border-[color:rgb(var(--color-border-rgb)/0.72)] bg-[color:rgb(var(--color-card-rgb)/0.62)] p-3">
                <p className="text-xs text-[var(--color-text-secondary)]">تهيئة</p>
                <p className="mt-2 text-lg font-bold text-[var(--color-text)]">
                  {status.isInitializing ? 'نشطة' : 'مكتملة'}
                </p>
              </div>
            </div>

            {status.lastError ? (
              <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 p-3 text-sm leading-6 text-rose-700 dark:text-rose-300">
                  {typeof status.lastError === 'object' ? status.lastError.message : status.lastError}
              </div>
            ) : null}
          </div>
        </Card>
      </section>
    </div>
  );
};

export default AdminWhatsApp;
