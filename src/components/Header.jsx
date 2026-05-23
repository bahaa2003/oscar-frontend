import React from 'react';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from './ui/LanguageSwitcher';
import ThemeToggle from './ui/ThemeToggle';
import HeaderBrand from './layout/HeaderBrand';
import { resolveUserAvatar } from '../utils/avatar';

const Header = ({ user, onMenuClick, showUserInfo = true }) => {
  const { dir } = useLanguage();
  const { t } = useTranslation();
  const isRTL = dir === 'rtl';
  const avatarUrl = resolveUserAvatar(user, user?.name || user?.email || 'OSCAR User');

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="sticky top-0 z-50 app-header px-3 py-1.5 backdrop-blur-xl sm:px-4 sm:py-2"
    >
      <div className="mx-auto max-w-7xl">
        <div dir="ltr" className="oscar-neon-panel grid min-h-[2.95rem] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-[20px] border px-2.5 py-1 sm:min-h-[3.25rem] sm:gap-5 sm:rounded-[28px] sm:px-5 sm:py-1.5">
          <div className="col-start-1 row-start-1 flex items-center gap-1 justify-self-start sm:gap-2">
            <ThemeToggle compact className="h-9 w-9 shrink-0 rounded-full border-[color:rgb(var(--color-border-rgb)/0.84)] bg-[radial-gradient(circle_at_35%_25%,rgb(255_255_255/0.16),transparent_34%),linear-gradient(180deg,rgb(10_17_42/0.88),rgb(2_6_19/0.78))] shadow-[inset_0_0_18px_rgb(34_211_238/0.08),0_0_28px_-18px_rgb(34_211_238/0.9)] sm:h-10 sm:w-10" />
            <LanguageSwitcher variant="glass" className="h-9 rounded-full border-[color:rgb(var(--color-border-rgb)/0.84)] bg-[linear-gradient(180deg,rgb(10_17_42/0.88),rgb(2_6_19/0.72))] sm:h-10" />
            {showUserInfo ? (
              <motion.div
                className="hidden items-center gap-2 rounded-full border border-[color:rgb(var(--color-border-rgb)/0.72)] bg-[linear-gradient(180deg,rgb(10_17_42/0.78),rgb(2_6_19/0.64))] px-2 py-1 sm:flex"
                whileHover={{ scale: 1.02 }}
              >
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-cyan-400 via-violet-500 to-fuchsia-500 p-0.5">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-gray-950">
                    <img src={avatarUrl} alt={user?.name || t('common.user')} className="h-full w-full rounded-full object-cover" />
                  </div>
                </div>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <h3 className="max-w-[8rem] truncate text-xs font-semibold text-white">{user?.name || t('common.user')}</h3>
                  <p className="max-w-[8rem] truncate text-[10px] text-[var(--color-text-secondary)]">
                    {user?.role ? t(`roles.${user.role}`, { defaultValue: user.role }) : t('common.customer')}
                  </p>
                </div>
              </motion.div>
            ) : null}
          </div>

          <div className="col-start-2 row-start-1 justify-self-center">
            <HeaderBrand className="translate-x-16 min-[380px]:translate-x-24 sm:translate-x-40 lg:translate-x-64" />
          </div>

          <motion.button
            onClick={onMenuClick}
            className="col-start-3 row-start-1 inline-flex h-9 w-9 shrink-0 items-center justify-center justify-self-end rounded-full border border-[color:rgb(var(--color-border-rgb)/0.84)] bg-[linear-gradient(180deg,rgb(3_8_22/0.9),rgb(2_6_19/0.78))] text-[var(--color-text)] shadow-[inset_0_0_18px_rgb(255_255_255/0.035),0_0_26px_-18px_rgb(34_211_238/0.9)] transition-all hover:-translate-y-0.5 hover:border-[color:rgb(var(--color-primary-rgb)/0.38)] hover:text-[var(--color-primary)] sm:h-10 sm:w-10"
            whileTap={{ scale: 0.95 }}
          >
            <Menu size={20} className="sm:h-6 sm:w-6" />
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
