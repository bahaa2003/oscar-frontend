import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, MessageSquareText, Send, Sparkles, ArrowRightLeft, CheckCircle2, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input, { textareaClassName } from '../components/ui/Input';
import { cn } from '../components/ui/Button';
import { buildWhatsAppLink, getAdminWhatsAppNumber } from '../utils/whatsapp';
import { useLanguage } from '../context/LanguageContext';

const ContactUs = () => {
  const { dir } = useLanguage();
  const { i18n } = useTranslation();
  const isArabic = String(i18n.resolvedLanguage || i18n.language || dir || 'ar').toLowerCase().startsWith('ar');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [nameError, setNameError] = useState('');
  const [messageError, setMessageError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const ui = useMemo(() => {
    if (isArabic) {
      return {
        eyebrow: 'اتصل بنا',
        title: 'تواصل معنا بسرعة',
        description: 'اكتب اسمك ورسالتك، وسنجهزها لك بتنسيق مرتب داخل واتساب مباشرة.',
        nameLabel: 'الاسم',
        namePlaceholder: 'اكتب اسمك هنا',
        messageLabel: 'الرسالة',
        messagePlaceholder: 'اكتب تفاصيل طلبك أو استفسارك',
        submit: 'إرسال',
        helper: 'سيتم فتح واتساب تلقائيًا مع الرسالة التي كتبتها.',
        previewTitle: 'معاينة الرسالة',
        previewHint: 'سيظهر النص بهذا الشكل داخل واتساب.',
        nameRequired: 'الاسم مطلوب.',
        messageRequired: 'الرسالة مطلوبة.',
        success: 'تم تجهيز الرسالة وفتح واتساب.',
      };
    }

    return {
      eyebrow: 'Contact us',
      title: 'Contact us quickly and clearly',
      description: 'Write your name and message, and we will prepare it neatly inside WhatsApp.',
      nameLabel: 'Name',
      namePlaceholder: 'Enter your name',
      messageLabel: 'Message',
      messagePlaceholder: 'Write your request or question',
      submit: 'Send',
      helper: 'WhatsApp will open automatically with your message filled in.',
      previewTitle: 'Message preview',
      previewHint: 'This is how the text will appear inside WhatsApp.',
      nameRequired: 'Name is required.',
      messageRequired: 'Message is required.',
      success: 'Your message is ready and WhatsApp has been opened.',
    };
  }, [isArabic]);

  const previewText = useMemo(() => {
    const trimmedName = name.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName && !trimmedMessage) {
      return isArabic
        ? 'الاسم: -\nالرسالة: -'
        : 'Name: -\nMessage: -';
    }

    return isArabic
      ? `الاسم: ${trimmedName || '-'}\nالرسالة: ${trimmedMessage || '-'}`
      : `Name: ${trimmedName || '-'}\nMessage: ${trimmedMessage || '-'}`;
  }, [isArabic, message, name]);

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedMessage = message.trim();
    const nextNameError = trimmedName ? '' : ui.nameRequired;
    const nextMessageError = trimmedMessage ? '' : ui.messageRequired;

    setNameError(nextNameError);
    setMessageError(nextMessageError);

    if (nextNameError || nextMessageError) {
      return;
    }

    const formattedMessage = isArabic
      ? `الاسم: ${trimmedName}\nالرسالة: ${trimmedMessage}`
      : `Name: ${trimmedName}\nMessage: ${trimmedMessage}`;

    const href = buildWhatsAppLink({
      number: getAdminWhatsAppNumber(),
      message: formattedMessage,
    });

    window.open(href, '_blank', 'noopener,noreferrer');
    setSubmitted(true);
  };

  return (
    <div className="relative min-h-[calc(100vh-6rem)] overflow-hidden px-4 py-5 sm:px-6 sm:py-7 lg:px-8">

      <div className="relative mx-auto grid w-full max-w-6xl items-start gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:gap-6">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="order-2 space-y-4 lg:order-1"
        >
          <Card variant="flat" className="border-[color:rgb(var(--color-border-rgb)/0.78)] bg-[linear-gradient(180deg,rgb(var(--color-card-rgb)/0.94),rgb(var(--color-surface-rgb)/0.82))] p-4 shadow-[var(--shadow-medium)] backdrop-blur-xl sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[color:rgb(var(--color-primary-rgb)/0.2)] bg-[color:rgb(var(--color-primary-rgb)/0.1)] text-[var(--color-primary)]">
                <ArrowRightLeft className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div>
                  <h2 className="text-base font-bold text-[var(--color-text)]">{ui.previewTitle}</h2>
                  <p className="text-xs leading-6 text-[var(--color-text-secondary)] sm:text-sm">{ui.previewHint}</p>
                </div>
                <pre className="min-h-[9rem] whitespace-pre-wrap rounded-[var(--radius-lg)] border border-[color:rgb(var(--color-border-rgb)/0.72)] bg-[color:rgb(var(--color-bg-rgb)/0.38)] p-4 text-sm leading-7 text-[var(--color-text)] shadow-[inset_0_1px_0_rgb(255_255_255/0.12)]">
                  {previewText}
                </pre>
              </div>
            </div>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[var(--radius-lg)] border border-[color:rgb(var(--color-success-rgb)/0.22)] bg-[color:rgb(var(--color-success-rgb)/0.08)] p-4 text-sm leading-6 text-[var(--color-text-secondary)]">
              <MessageCircle className="mb-2 h-5 w-5 text-[var(--color-success)]" />
              {ui.helper}
            </div>
            <div className="rounded-[var(--radius-lg)] border border-[color:rgb(var(--color-primary-rgb)/0.2)] bg-[color:rgb(var(--color-primary-rgb)/0.08)] p-4 text-sm leading-6 text-[var(--color-text-secondary)]">
              <Sparkles className="mb-2 h-5 w-5 text-[var(--color-primary)]" />
              {isArabic ? 'المعاينة تتحدث أثناء الكتابة قبل فتح واتساب.' : 'The preview updates while you type before WhatsApp opens.'}
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="order-1 lg:order-2"
        >
          <Card variant="premium" className="relative overflow-hidden border border-[color:rgb(var(--color-border-rgb)/0.78)] bg-[linear-gradient(180deg,rgb(var(--color-card-rgb)/0.98),rgb(var(--color-surface-rgb)/0.88))] p-5 shadow-[var(--shadow-medium)] sm:p-7">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--color-primary),var(--color-primary-hover),var(--color-success))]" />
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-[color:rgb(var(--color-border-rgb)/0.74)] bg-[color:rgb(var(--color-card-rgb)/0.7)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] shadow-[var(--shadow-subtle)] backdrop-blur-xl">
                  <Sparkles className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                  <span>{ui.eyebrow}</span>
                  <span className="rounded-full bg-[color:rgb(var(--color-success-rgb)/0.12)] px-2 py-0.5 text-[10px] text-[var(--color-success)]">wa.me</span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-lg)] border border-[color:rgb(var(--color-primary-rgb)/0.22)] bg-[color:rgb(var(--color-primary-rgb)/0.12)] text-[var(--color-primary)]">
                  <MessageSquareText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-2xl font-black leading-tight text-[var(--color-text)] sm:text-3xl">
                      {ui.title}
                    </h1>
                    <p className="mt-2 text-sm leading-7 text-[var(--color-text-secondary)]">
                      {ui.description}
                    </p>
                  </div>
                </div>
              </div>

              <Input
                label={ui.nameLabel}
                placeholder={ui.namePlaceholder}
                icon={<UserRound className="h-4 w-4" />}
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (nameError) setNameError('');
                  if (submitted) setSubmitted(false);
                }}
                error={nameError}
                autoComplete="name"
              />

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-secondary)] sm:text-sm">
                  {ui.messageLabel}
                </label>
                <textarea
                  value={message}
                  onChange={(event) => {
                    setMessage(event.target.value);
                    if (messageError) setMessageError('');
                    if (submitted) setSubmitted(false);
                  }}
                  placeholder={ui.messagePlaceholder}
                  rows={6}
                  className={cn(textareaClassName, 'min-h-[9.5rem]')}
                />
                {messageError ? (
                  <p className="mt-1 text-xs text-[var(--color-error)]">{messageError}</p>
                ) : null}
              </div>

              <Button type="submit" size="lg" className="w-full">
                <Send className="h-4 w-4" />
                {ui.submit}
              </Button>

              {submitted ? (
                <div className="flex items-start gap-2 rounded-[var(--radius-lg)] border border-[color:rgb(var(--color-success-rgb)/0.24)] bg-[color:rgb(var(--color-success-rgb)/0.1)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-success)]" />
                  <span>{ui.success}</span>
                </div>
              ) : null}
            </form>
          </Card>
        </motion.section>
      </div>
    </div>
  );
};

export default ContactUs;
