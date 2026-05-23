import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Menu
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../components/ui/Button';
import ThemeToggle from '../components/ui/ThemeToggle';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';
import HeaderBrand from '../components/layout/HeaderBrand';
import useAuthStore from '../store/useAuthStore';
import { getDefaultRouteForRole } from '../utils/authRoles';
import slideOneHeroImage from '../assets/سلايد 1.jpg';
import buyCardsImage from '../assets/buyCards.webp';
import chatAppsImage from '../assets/chatApps.webp';

const Landing = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [slideIndex, setSlideIndex] = useState(0);

  const heroSlides = useMemo(
    () => [
      { id: 'landing-slide-1', image: slideOneHeroImage, title: t('home.slide1') },
      { id: 'landing-slide-2', image: buyCardsImage, title: t('home.slide2') },
      { id: 'landing-slide-3', image: chatAppsImage, title: t('home.slide3') }
    ],
    [t]
  );


  useEffect(() => {
    if (isAuthenticated && user?.role) {
      navigate(getDefaultRouteForRole(user.role), { replace: true });
    }
  }, [isAuthenticated, navigate, user]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % heroSlides.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [heroSlides.length]);

  return (
    <div className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[var(--shell-max-width)] space-y-8">
        <div dir="ltr" className="oscar-neon-panel grid min-h-[2.95rem] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-[20px] border px-2.5 py-1 sm:min-h-[3.25rem] sm:gap-5 sm:rounded-[28px] sm:px-5 sm:py-1.5">
          <div className="col-start-1 row-start-1 flex items-center gap-1 justify-self-start sm:gap-2">
            <LanguageSwitcher variant="glass" className="bg-[color:rgb(var(--color-surface-rgb)/0.46)]" />
            <ThemeToggle compact className="h-9 w-9 sm:h-10 sm:w-10" />
          </div>

          <div className="col-start-2 row-start-1 justify-self-center">
            <HeaderBrand />
          </div>

          <button
            type="button"
            onClick={() => navigate('/auth')}
            className="col-start-3 row-start-1 inline-flex h-9 w-9 shrink-0 items-center justify-center justify-self-end rounded-full border border-[color:rgb(var(--color-border-rgb)/0.84)] bg-[linear-gradient(180deg,rgb(3_8_22/0.9),rgb(2_6_19/0.78))] text-[var(--color-text)] shadow-[inset_0_0_18px_rgb(255_255_255/0.035),0_0_26px_-18px_rgb(34_211_238/0.9)] transition-all hover:-translate-y-0.5 hover:border-[color:rgb(var(--color-primary-rgb)/0.38)] hover:text-[var(--color-primary)] sm:h-10 sm:w-10"
            aria-label={t('common.menu', { defaultValue: 'Menu' })}
          >
            <Menu className="h-4.5 w-4.5 sm:h-6 sm:w-6" />
          </button>
        </div>

        <section className="premium-card-premium overflow-hidden px-5 py-6 sm:px-8 sm:py-8">
          <div className="grid items-center gap-8 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link to="/auth">
                  <Button size="lg" className="w-full sm:w-auto">
                    {t('home.getStarted')}
                    <ArrowRight className="h-5 w-5 rtl:rotate-180" />
                  </Button>
                </Link>
                <Link to="/catalog">
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                    {t('home.browseStore')}
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-x-6 top-4 h-20 rounded-full bg-white/10 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-[color:rgb(var(--color-border-rgb)/0.72)] bg-[color:rgb(var(--color-card-rgb)/0.58)] p-2 shadow-[var(--shadow-medium)] backdrop-blur-xl">
                <div className="relative h-[8.5rem] sm:h-[10rem] lg:h-[12rem] overflow-hidden rounded-[1.6rem]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={heroSlides[slideIndex].id}
                      initial={{ opacity: 0, scale: 1.08 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.7 }}
                      className="absolute inset-0"
                    >
                      <img
                        src={heroSlides[slideIndex].image}
                        alt={heroSlides[slideIndex].title}
                        loading="eager"
                        decoding="async"
                        fetchPriority="high"
                        sizes="(max-width: 1024px) 100vw, 45vw"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/18 to-transparent" />
                    </motion.div>
                  </AnimatePresence>
                </div>

              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Landing;
