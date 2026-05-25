import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, Mail, ShieldAlert, AlertCircle } from 'lucide-react';
import Input from '../ui/Input';
import OtpInput from './OtpInput';
import ConfirmDialog from './ConfirmDialog';
import { useToast } from '../ui/Toast';
import { useLanguage } from '../../context/LanguageContext';
import apiClient from '../../services/client';
import useAuthStore from '../../store/useAuthStore';
import { getReadableErrorMessage } from '../../utils/errorMessages';

const STATUS = {
  DISABLED: 'disabled',
  SENDING_CODE: 'sending-code',
  CONFIRMING: 'confirming',
  ENABLED: 'enabled',
  ERROR: 'error',
};

const maskEmailForDisplay = (value) => {
  const raw = String(value || '').trim();
  const [name, domain] = raw.split('@');
  if (!name || !domain) return raw;
  if (name.length <= 2) return `${name.slice(0, 1)}***@${domain}`;
  return `${name.slice(0, 2)}***@${domain}`;
};

const TwoFactorCard = ({ email, twoFactorEnabled = false, emailChangedPending = false }) => {
  const { language } = useLanguage();
  const { addToast } = useToast();
  const updateUserSession = useAuthStore((state) => state.updateUserSession);
  const isEnglish = language === 'en';

  const text = useMemo(
    () => ({
      title: isEnglish ? 'Two-Factor Authentication' : 'المصادقة الثنائية',
      description: isEnglish
        ? 'Receive a one-time email code as an extra security check at sign in.'
        : 'استلم رمز تحقق لمرة واحدة عبر بريدك الإلكتروني كخطوة أمان إضافية عند تسجيل الدخول.',
      enabled: isEnglish ? 'Enabled' : 'مفعلة',
      disabled: isEnglish ? 'Disabled' : 'غير مفعلة',
      sendingCode: isEnglish ? 'Sending code' : 'جارٍ إرسال الكود',
      confirming: isEnglish ? 'Confirming' : 'جارٍ تأكيد التفعيل',
      codeSent: isEnglish ? 'Verification code sent' : 'تم إرسال كود التحقق',
      enableBtn: isEnglish ? 'Enable 2FA' : 'تفعيل المصادقة الثنائية',
      disableBtn: isEnglish ? 'Disable 2FA' : 'إلغاء التفعيل',
      activated: isEnglish ? 'Two-factor authentication by email is enabled.' : 'تم تفعيل المصادقة الثنائية عبر البريد الإلكتروني.',
      deactivated: isEnglish ? 'Two-factor authentication has been disabled.' : 'تم إلغاء تفعيل المصادقة الثنائية.',
      codeSentMessage: isEnglish ? 'We sent a 6-digit verification code to your email.' : 'أرسلنا كود تحقق مكونًا من 6 أرقام إلى بريدك الإلكتروني.',
      enableError: isEnglish ? 'Unable to send the 2FA verification code. Please try again.' : 'تعذر إرسال كود تفعيل المصادقة الثنائية. حاول مرة أخرى.',
      confirmError: isEnglish ? 'Invalid verification code. Check the latest email and try again.' : 'كود التحقق غير صحيح. تأكد من آخر رسالة في بريدك وحاول مرة أخرى.',
      setupExpired: isEnglish ? 'This verification code has expired. Request a new code and try again.' : 'انتهت صلاحية كود التحقق. اطلب كودًا جديدًا وحاول مرة أخرى.',
      setupCodePrompt: isEnglish
        ? 'Enter the 6-digit code sent to your email to confirm activation.'
        : 'أدخل الكود المكون من 6 أرقام المرسل لبريدك لتأكيد التفعيل.',
      setupCodeRequired: isEnglish ? 'Enter the complete 6-digit code.' : 'أدخل الكود الكامل المكون من 6 أرقام.',
      confirmEnable: isEnglish ? 'Confirm activation' : 'تأكيد التفعيل',
      resendCode: isEnglish ? 'Resend code' : 'إعادة إرسال الكود',
      saveEmailFirst: isEnglish ? 'Save your email changes first before enabling 2FA.' : 'احفظ تغييرات البريد الإلكتروني أولاً قبل تفعيل المصادقة الثنائية.',
      emailNotice: isEnglish
        ? 'Sign-in verification codes will be sent to'
        : 'سيتم إرسال رموز التحقق عند تسجيل الدخول إلى',
      disableTitle: isEnglish ? 'Disable two-factor authentication?' : 'إلغاء تفعيل المصادقة الثنائية؟',
      disableDesc: isEnglish
        ? 'For security, confirm your current password before disabling 2FA.'
        : 'لأمان حسابك، أدخل كلمة المرور الحالية قبل إلغاء التفعيل.',
      currentPassword: isEnglish ? 'Current password' : 'كلمة المرور الحالية',
      currentPasswordPlaceholder: isEnglish ? 'Enter your current password' : 'أدخل كلمة المرور الحالية',
      passwordRequired: isEnglish ? 'Current password is required.' : 'كلمة المرور الحالية مطلوبة.',
      cancel: isEnglish ? 'Cancel' : 'إلغاء',
      confirmDisable: isEnglish ? 'Disable now' : 'إلغاء التفعيل الآن',
      disableError: isEnglish ? 'Could not disable 2FA.' : 'تعذر إلغاء تفعيل المصادقة الثنائية.',
    }),
    [isEnglish]
  );

  const [status, setStatus] = useState(STATUS.DISABLED);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isConfirmingEnable, setIsConfirmingEnable] = useState(false);
  const [enableCode, setEnableCode] = useState('');
  const [feedback, setFeedback] = useState({ type: 'info', message: '' });
  const [isDisableDialogOpen, setIsDisableDialogOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [isDisabling, setIsDisabling] = useState(false);

  const maskedEmail = useMemo(() => maskEmailForDisplay(email), [email]);

  useEffect(() => {
    const enabled = Boolean(twoFactorEnabled);
    setIsEnabled(enabled);
    setStatus(enabled ? STATUS.ENABLED : STATUS.DISABLED);
    setIsConfirmingEnable(false);
    setEnableCode('');
  }, [twoFactorEnabled]);

  const badgeState = useMemo(() => {
    if (status === STATUS.SENDING_CODE) return { label: text.sendingCode, variant: 'info' };
    if (status === STATUS.CONFIRMING) return { label: text.confirming, variant: 'info' };
    if (isConfirmingEnable) return { label: text.codeSent, variant: 'warning' };
    if (isEnabled) return { label: text.enabled, variant: 'success' };
    return { label: text.disabled, variant: 'default' };
  }, [isConfirmingEnable, isEnabled, status, text]);

  const feedbackClassName = (
    feedback.type === 'success'
      ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
      : feedback.type === 'error'
        ? 'border-rose-400/25 bg-rose-500/10 text-rose-800 dark:text-rose-200'
        : feedback.type === 'warning'
          ? 'border-amber-400/30 bg-amber-500/10 text-amber-800 dark:text-amber-200'
          : 'border-indigo-400/30 bg-indigo-500/10 text-indigo-800 dark:text-indigo-200'
  );

  const generateTwoFactor = async () => {
    if (emailChangedPending) {
      setFeedback({ type: 'warning', message: text.saveEmailFirst });
      return;
    }

    setStatus(STATUS.SENDING_CODE);
    setFeedback({ type: 'info', message: '' });

    try {
      await apiClient.auth.generateTwoFactor();
      setIsConfirmingEnable(true);
      setEnableCode('');
      setStatus(STATUS.DISABLED);
      setFeedback({ type: 'success', message: text.codeSentMessage });
      addToast(text.codeSentMessage, 'success');
    } catch (error) {
      const message = getReadableErrorMessage(error, text.enableError, { language });
      setStatus(STATUS.ERROR);
      setFeedback({ type: 'error', message });
      addToast(message, 'error');
    }
  };

  const confirmEnableTwoFactor = async () => {
    if (enableCode.length !== 6) {
      setFeedback({ type: 'error', message: text.setupCodeRequired });
      return;
    }

    setStatus(STATUS.CONFIRMING);
    setFeedback({ type: 'info', message: '' });

    try {
      await apiClient.auth.enableTwoFactor({ code: enableCode });
      setIsEnabled(true);
      setIsConfirmingEnable(false);
      setEnableCode('');
      setStatus(STATUS.ENABLED);
      updateUserSession({ twoFactorEnabled: true, isTwoFactorEnabled: true });
      setFeedback({ type: 'success', message: text.activated });
      addToast(text.activated, 'success');
    } catch (error) {
      const rawMessage = String(error?.message || '').toLowerCase();
      const message = rawMessage.includes('expired')
        ? text.setupExpired
        : rawMessage.includes('invalid')
          ? text.confirmError
          : getReadableErrorMessage(error, text.confirmError, { language });
      setStatus(STATUS.ERROR);
      setFeedback({ type: 'error', message });
      addToast(message, 'error');
    }
  };

  const handleToggle = () => {
    if (isEnabled) {
      setDisablePassword('');
      setIsDisableDialogOpen(true);
      return;
    }

    generateTwoFactor();
  };

  const disableTwoFactor = async () => {
    if (!disablePassword.trim()) {
      setFeedback({ type: 'error', message: text.passwordRequired });
      return;
    }

    setIsDisabling(true);
    try {
      await apiClient.auth.disableTwoFactor({ password: disablePassword });
      setIsEnabled(false);
      setStatus(STATUS.DISABLED);
      setIsDisableDialogOpen(false);
      setDisablePassword('');
      updateUserSession({ twoFactorEnabled: false, isTwoFactorEnabled: false });
      setFeedback({ type: 'success', message: text.deactivated });
      addToast(text.deactivated, 'success');
    } catch (error) {
      const message = getReadableErrorMessage(error, text.disableError, { language });
      setFeedback({ type: 'error', message });
      addToast(message, 'error');
    } finally {
      setIsDisabling(false);
    }
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-gray-200/50 bg-gradient-to-br from-white via-white/95 to-gray-50/80 shadow-[0_10px_24px_-18px_rgba(0,0,0,0.16)] backdrop-blur-sm dark:border-gray-800/50 dark:from-gray-900 dark:via-gray-900/95 dark:to-gray-800/80">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-br from-green-200/30 to-transparent blur-3xl dark:from-green-900/20" />
          <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-gradient-to-br from-emerald-200/20 to-transparent blur-3xl dark:from-emerald-900/10" />
        </div>

        {/* Header Section */}
        <div className="border-b border-gray-200/40 px-3.5 py-3.5 dark:border-gray-800/40 sm:px-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <div className="mb-1.5 flex items-center gap-2">
                <div
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${
                    isEnabled
                      ? 'bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg'
                      : 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700 dark:from-gray-700 dark:to-gray-800'
                  }`}
                >
                  <Mail className="h-4 w-4" />
                </div>
                <h3 className="text-base font-medium text-gray-950 dark:text-white">
                  {text.title}
                </h3>
              </div>
              <p className="text-sm leading-6 text-gray-400">
                {text.description}
              </p>
            </div>

            <div
              className={`shrink-0 rounded-lg border px-3 py-1.5 text-sm font-medium shadow-sm ${
                isEnabled
                  ? 'border-green-300/60 bg-gradient-to-r from-green-100/70 to-emerald-100/50 text-green-700 dark:border-green-900/50 dark:from-green-950/40 dark:to-emerald-950/30 dark:text-green-300'
                  : badgeState.variant === 'warning'
                    ? 'border-amber-300/60 bg-gradient-to-r from-amber-100/70 to-orange-100/50 text-amber-700 dark:border-amber-900/50 dark:from-amber-950/40 dark:to-orange-950/30 dark:text-amber-300'
                    : 'border-gray-300/60 bg-gradient-to-r from-gray-100/70 to-gray-100/50 text-gray-700 dark:border-gray-700/50 dark:from-gray-950/40 dark:to-gray-900/30 dark:text-gray-300'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                {isEnabled && <CheckCircle2 className="h-3.5 w-3.5" />}
                {badgeState.label}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-4 sm:p-5">
          {/* Email Notice */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-3 flex items-center gap-2.5 rounded-xl border px-3 py-2 text-xs font-medium ${
              isEnabled
                ? 'border-green-200/50 bg-gradient-to-r from-green-100/40 to-emerald-100/30 text-green-800 dark:border-green-900/40 dark:from-green-950/30 dark:to-emerald-950/20 dark:text-green-300'
                : 'border-gray-200/50 bg-gradient-to-r from-gray-100/40 to-gray-100/30 text-gray-700 dark:border-gray-800/40 dark:from-gray-950/30 dark:to-gray-900/20 dark:text-gray-400'
            }`}
          >
            <div className={`inline-flex h-2 w-2 rounded-full ${
              isEnabled ? 'bg-green-500' : 'bg-gray-400'
            }`} />
            <span>
              {text.emailNotice}{' '}
              <span className="font-bold">{maskedEmail || email}</span>
            </span>
          </motion.div>

          {/* Code Input Section */}
          {isConfirmingEnable && !isEnabled ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 space-y-3 rounded-xl border border-blue-200/50 bg-gradient-to-br from-blue-100/30 to-cyan-100/20 p-3 dark:border-blue-900/40 dark:from-blue-950/30 dark:to-cyan-950/20 sm:p-4"
            >
              <p className="text-xs font-semibold text-gray-950 dark:text-white">
                {text.setupCodePrompt}
              </p>
              <OtpInput value={enableCode} onChange={setEnableCode} disabled={status === STATUS.CONFIRMING} />
              <div className="flex flex-wrap gap-2 sm:flex-row">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={confirmEnableTwoFactor}
                  disabled={status === STATUS.CONFIRMING || enableCode.length !== 6}
                  className="flex items-center gap-2 rounded-lg border border-green-300/60 bg-gradient-to-r from-green-500 to-emerald-500 px-3 py-2 text-xs font-semibold text-white shadow-md transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === STATUS.CONFIRMING ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {text.confirmEnable}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={generateTwoFactor}
                  disabled={status === STATUS.SENDING_CODE || status === STATUS.CONFIRMING}
                  className="flex items-center gap-2 rounded-lg border border-gray-300/60 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700/60 dark:bg-gray-800 dark:text-gray-300"
                >
                  <Mail className="h-4 w-4" />
                  {text.resendCode}
                </motion.button>
              </div>
            </motion.div>
          ) : null}

          {/* Alert Messages */}
          {emailChangedPending && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200/50 bg-gradient-to-br from-amber-100/40 to-orange-100/30 p-3 text-xs text-amber-800 dark:border-amber-900/40 dark:from-amber-950/30 dark:to-orange-950/20 dark:text-amber-300"
            >
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{text.saveEmailFirst}</span>
            </motion.div>
          )}

          {feedback?.message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-3 flex items-start gap-2 rounded-xl border p-3 text-xs ${
                feedback.type === 'success'
                  ? 'border-green-200/50 bg-gradient-to-br from-green-100/40 to-emerald-100/30 text-green-800 dark:border-green-900/40 dark:from-green-950/30 dark:to-emerald-950/20 dark:text-green-300'
                  : feedback.type === 'error'
                    ? 'border-red-200/50 bg-gradient-to-br from-red-100/40 to-rose-100/30 text-red-800 dark:border-red-900/40 dark:from-red-950/30 dark:to-rose-950/20 dark:text-red-300'
                    : feedback.type === 'warning'
                      ? 'border-amber-200/50 bg-gradient-to-br from-amber-100/40 to-orange-100/30 text-amber-800 dark:border-amber-900/40 dark:from-amber-950/30 dark:to-orange-950/20 dark:text-amber-300'
                      : 'border-blue-200/50 bg-gradient-to-br from-blue-100/40 to-cyan-100/30 text-blue-800 dark:border-blue-900/40 dark:from-blue-950/30 dark:to-cyan-950/20 dark:text-blue-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
              ) : feedback.type === 'error' ? (
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              )}
              <span>{feedback.message}</span>
            </motion.div>
          )}

          {/* Action Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleToggle}
            disabled={status === STATUS.SENDING_CODE || status === STATUS.CONFIRMING || isDisabling || emailChangedPending}
            className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-md transition-all ${
              isEnabled
                ? 'border border-red-300/60 bg-gradient-to-r from-red-500 to-rose-500 text-white hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed'
                : 'border border-green-300/60 bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {status === STATUS.SENDING_CODE ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isEnabled ? (
              <ShieldAlert className="h-4 w-4" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            <span>{isEnabled ? text.disableBtn : text.enableBtn}</span>
          </motion.button>
        </div>
      </div>

      {/* Disable Confirmation Dialog */}
      <ConfirmDialog
        open={isDisableDialogOpen}
        title={text.disableTitle}
        description={text.disableDesc}
        confirmLabel={text.confirmDisable}
        cancelLabel={text.cancel}
        isLoading={isDisabling}
        onConfirm={disableTwoFactor}
        onCancel={() => !isDisabling && setIsDisableDialogOpen(false)}
      >
        <Input
          type="password"
          value={disablePassword}
          onChange={(event) => setDisablePassword(event.target.value)}
          label={text.currentPassword}
          placeholder={text.currentPasswordPlaceholder}
        />
      </ConfirmDialog>
    </>
  );
};

export default TwoFactorCard;
