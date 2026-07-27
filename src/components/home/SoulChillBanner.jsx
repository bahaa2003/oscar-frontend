import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import soulChillBanner from '../../assets/soulchill-home-banner.webp';
import referralBanner from '../../assets/slide-3.webp';
import { REFERRALS_ENABLED } from '../../config/featureFlags';

const SoulChillBanner = ({ to = '/auth?mode=login', onClick }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const slides = [
    { id: 'soulchill', image: soulChillBanner, alt: 'SoulChill - تجارب موسيقية بلا حدود' },
    ...(REFERRALS_ENABLED
      ? [{ id: 'referral', image: referralBanner, alt: 'رابط الإحالة — اكسب واسحب', to: '/referral' }]
      : []),
  ];
  const sharedClassName = 'group block overflow-hidden rounded-[1.35rem] border border-[color:rgb(var(--color-border-rgb)/0.64)] bg-[linear-gradient(135deg,rgb(var(--color-card-rgb)/0.98),rgb(var(--color-primary-rgb)/0.06))] shadow-[var(--shadow-subtle)] transition-[border-color,box-shadow] duration-300 ease-out hover:border-[color:rgb(var(--color-primary-rgb)/0.24)] hover:shadow-[0_18px_48px_-36px_rgb(var(--color-primary-rgb)/0.54)] sm:rounded-[1.65rem]';
  const slide = slides[activeSlide];

  useEffect(() => {
    if (slides.length < 2) return undefined;

    const timer = window.setInterval(() => {
      setDirection(1);
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const move = (nextDirection) => {
    setDirection(nextDirection);
    setActiveSlide((current) => (current + nextDirection + slides.length) % slides.length);
  };

  const content = (currentSlide) => (
    <div className="relative aspect-[3/1] w-full bg-[color:rgb(var(--color-card-rgb)/0.45)]">
      <img
        src={currentSlide.image}
        alt={currentSlide.alt}
        loading="lazy"
        decoding="async"
        sizes="(max-width: 1024px) 100vw, 1024px"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.01]"
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent" />
    </div>
  );

  return (
    <section className="mx-auto w-full max-w-4xl px-0.5 sm:px-2" aria-label="العروض المميزة">
      <div className={`relative ${sharedClassName}`}>
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={slide.id}
            custom={direction}
            initial={{ x: direction > 0 ? '22%' : '-22%', opacity: 0, scale: 1.035, filter: 'blur(5px)' }}
            animate={{ x: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ x: direction > 0 ? '-16%' : '16%', opacity: 0, scale: 0.985, filter: 'blur(3px)' }}
            transition={{ x: { type: 'spring', stiffness: 105, damping: 22 }, opacity: { duration: 0.45 }, scale: { duration: 0.7 }, filter: { duration: 0.4 } }}
          >
            {slide.id === 'soulchill' && onClick ? (
              <button type="button" onClick={onClick} className="block w-full text-start">{content(slide)}</button>
            ) : (
              <Link to={slide.to || to} className="block">{content(slide)}</Link>
            )}
          </motion.div>
        </AnimatePresence>

        {slides.length > 1 ? (
          <>
            <button type="button" onClick={() => move(-1)} aria-label="السلايد السابق" className="absolute left-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/25 text-white opacity-0 shadow-lg backdrop-blur-md transition hover:bg-black/40 group-hover:opacity-100 sm:h-9 sm:w-9"><ChevronLeft className="h-5 w-5" /></button>
            <button type="button" onClick={() => move(1)} aria-label="السلايد التالي" className="absolute right-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/25 text-white opacity-0 shadow-lg backdrop-blur-md transition hover:bg-black/40 group-hover:opacity-100 sm:h-9 sm:w-9"><ChevronRight className="h-5 w-5" /></button>
            <div className="absolute inset-x-0 bottom-2.5 z-20 flex justify-center gap-1.5">
              {slides.map((item, index) => (
                <button key={item.id} type="button" onClick={() => { setDirection(index > activeSlide ? 1 : -1); setActiveSlide(index); }} aria-label={`السلايد ${index + 1}`} className={`h-1.5 rounded-full border border-white/50 shadow transition-all duration-500 ${index === activeSlide ? 'w-7 bg-white' : 'w-2 bg-white/45 hover:bg-white/75'}`} />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
};

export default SoulChillBanner;
