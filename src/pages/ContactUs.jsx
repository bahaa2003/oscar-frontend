import { motion } from 'framer-motion';
import { Headphones, MessageCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getAdminWhatsAppNumber } from '../utils/whatsapp';

const WhatsAppIcon = ({ className = 'h-5 w-5' }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 32 32"
    fill="currentColor"
    className={className}
  >
    <path d="M16.04 3.2c-7.03 0-12.74 5.7-12.74 12.73 0 2.25.59 4.45 1.72 6.38L3.2 28.8l6.66-1.75a12.7 12.7 0 0 0 6.18 1.58h.01c7.02 0 12.74-5.7 12.74-12.73 0-3.4-1.33-6.6-3.73-9.01a12.67 12.67 0 0 0-9.02-3.69Zm.01 23.27h-.01c-1.86 0-3.68-.5-5.27-1.45l-.38-.23-3.95 1.04 1.05-3.85-.25-.4a10.55 10.55 0 0 1-1.62-5.65c0-5.75 4.68-10.42 10.44-10.42 2.78 0 5.4 1.09 7.36 3.06a10.35 10.35 0 0 1 3.05 7.36c0 5.75-4.68 10.44-10.42 10.44Zm5.72-7.81c-.31-.16-1.85-.91-2.14-1.02-.29-.1-.5-.15-.71.16-.21.31-.82 1.02-1 1.23-.19.21-.37.23-.69.08-.31-.16-1.32-.49-2.52-1.55-.93-.83-1.56-1.86-1.74-2.17-.18-.31-.02-.48.14-.64.14-.14.31-.37.47-.55.16-.18.21-.31.31-.52.1-.21.05-.39-.03-.55-.08-.16-.71-1.71-.97-2.34-.26-.62-.52-.54-.71-.55h-.61c-.21 0-.55.08-.84.39-.29.31-1.1 1.08-1.1 2.63 0 1.55 1.13 3.05 1.29 3.26.16.21 2.23 3.4 5.4 4.77.75.33 1.34.52 1.8.66.76.24 1.45.2 1.99.12.61-.09 1.85-.76 2.11-1.49.26-.73.26-1.36.18-1.49-.08-.13-.29-.21-.61-.36Z" />
  </svg>
);

const ContactUs = () => {
  const { dir } = useLanguage();
  const isRTL = dir === 'rtl';
  const whatsappPhoneNumber = getAdminWhatsAppNumber() || 'YOUR_PHONE_NUMBER';
  const whatsappHref = `https://wa.me/${whatsappPhoneNumber}`;

  const text = isRTL
    ? {
        title: 'تواصل مع الدعم الفني',
        description:
          'اضغط على الزر أدناه للتواصل معنا مباشرة عبر واتساب. فريقنا متاح للرد على استفساراتك.',
        action: 'تواصل عبر واتساب',
        note: 'رد سريع ومباشر',
      }
    : {
        title: 'Contact Support',
        description:
          'Tap the button below to reach us directly on WhatsApp. Our team is ready to answer your questions.',
        action: 'Chat on WhatsApp',
        note: 'Fast direct support',
      };

  return (
    <main
      dir={dir}
      className="flex min-h-[calc(100vh-6rem)] items-start justify-center px-4 pb-8 pt-14 sm:px-6 sm:pt-16 lg:px-8 lg:pt-20"
    >
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-[color:rgb(var(--color-border-rgb)/0.86)] bg-[linear-gradient(180deg,rgb(var(--color-card-rgb)/0.98),rgb(var(--color-surface-rgb)/0.92))] p-8 text-center shadow-[var(--shadow-medium)] backdrop-blur-md dark:border-white/10 dark:bg-white/5"
      >
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgb(37_211_102/0.16),transparent_48%)]" />

        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#25D366]/25 bg-[#25D366]/10 text-[#128C4A] shadow-[0_0_32px_-18px_#25D366] dark:text-[#25D366]">
          <Headphones className="h-6 w-6" />
        </div>

        <p className="mb-3 inline-flex items-center justify-center gap-2 rounded-full border border-[#25D366]/20 bg-[#25D366]/10 px-3 py-1 text-[11px] font-medium text-[#128C4A] dark:text-[#9debbd]">
          <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" />
          {text.note}
        </p>

        <h1 className="mb-2 text-xl font-bold text-[var(--color-text)]">{text.title}</h1>
        <p className="mb-8 text-sm leading-7 text-[var(--color-text-secondary)]">{text.description}</p>

        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#25D366] px-6 py-3 text-sm font-medium text-white shadow-[0_18px_36px_-24px_#25D366] transition-all hover:-translate-y-0.5 hover:bg-[#20bd5a] focus:outline-none focus:ring-2 focus:ring-[#25D366]/35"
        >
          <WhatsAppIcon className="h-5 w-5" />
          <span>{text.action}</span>
        </a>
      </motion.section>
    </main>
  );
};

export default ContactUs;
