import React from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/useAuthStore';
import { isAdminRole } from '../../utils/authRoles';
import { buildWhatsAppLink, getAdminWhatsAppNumber } from '../../utils/whatsapp';

const FloatingWhatsApp = () => {
  const { i18n } = useTranslation();
  const location = useLocation();
  const { user } = useAuthStore();
  const shouldHideForRole = isAdminRole(user?.role);
  const isHomepage = ['/', '/catalog', '/dashboard'].includes(location.pathname);

  if (shouldHideForRole || !isHomepage) {
    return null;
  }

  const isArabic = String(i18n.resolvedLanguage || i18n.language || 'ar')
    .toLowerCase()
    .startsWith('ar');

  const message = isArabic
    ? 'مرحباً، أحتاج مساعدة من فريق OSCAR STORE'
    : 'Hello, I need help from the OSCAR STORE team';
  const href = buildWhatsAppLink({
    number: getAdminWhatsAppNumber(),
    message,
  });
  const tooltipText = isArabic ? 'تواصل معنا' : 'Chat with us';

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      referrerPolicy="no-referrer"
      aria-label={isArabic ? 'واتساب الدعم' : 'WhatsApp Support'}
      className="floating-whatsapp"
    >
      <span className="floating-whatsapp-ring" aria-hidden="true" />
      <span className="floating-whatsapp-tooltip" aria-hidden="true">{tooltipText}</span>
      <span className="floating-whatsapp-button">
        <svg viewBox="0 0 32 32" className="floating-whatsapp-icon" aria-hidden="true">
          <path
            fill="currentColor"
            d="M16.03 3.2c-7.08 0-12.81 5.71-12.81 12.77 0 2.26.6 4.48 1.73 6.42L3 29l6.79-1.78a12.84 12.84 0 0 0 6.24 1.6h.01c7.08 0 12.81-5.72 12.81-12.78A12.75 12.75 0 0 0 16.03 3.2Zm0 23.49h-.01a10.7 10.7 0 0 1-5.45-1.49l-.39-.23-4.03 1.05 1.08-3.92-.25-.4a10.57 10.57 0 0 1-1.63-5.66c0-5.9 4.8-10.7 10.7-10.7 2.86 0 5.55 1.1 7.57 3.13a10.58 10.58 0 0 1 3.13 7.56c0 5.9-4.8 10.7-10.72 10.7Zm5.87-8.01c-.32-.16-1.89-.93-2.18-1.04-.29-.1-.5-.16-.71.16-.21.31-.82 1.04-1 1.25-.18.21-.37.24-.68.08-.32-.16-1.34-.49-2.56-1.55-.95-.85-1.6-1.9-1.79-2.21-.18-.31-.02-.48.14-.64.14-.14.32-.37.48-.56.16-.19.21-.31.31-.52.11-.21.05-.4-.03-.56-.08-.16-.71-1.7-.98-2.33-.25-.6-.5-.51-.7-.52h-.6c-.21 0-.56.08-.85.39-.29.31-1.11 1.09-1.11 2.66 0 1.57 1.14 3.08 1.3 3.29.16.21 2.26 3.45 5.48 4.84.76.33 1.36.52 1.82.67.76.24 1.45.2 2 .12.61-.09 1.89-.77 2.16-1.51.27-.75.27-1.39.19-1.52-.08-.13-.29-.21-.61-.37Z"
          />
        </svg>
      </span>
    </a>
  );
};

export default FloatingWhatsApp;
