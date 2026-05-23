import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const AnnouncementTicker = ({ items, durationMs = 7000, ariaLabel, direction = 'ltr' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!items?.length) return undefined;

    const timer = window.setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, durationMs);

    return () => window.clearTimeout(timer);
  }, [currentIndex, durationMs, items]);

  if (!items?.length) return null;

  const activeItem = items[currentIndex];
  const startPosition = direction === 'rtl' ? '100%' : '-100%';
  const endPosition = direction === 'rtl' ? '-100%' : '100%';

  return (
    <section aria-label={ariaLabel} dir={direction} className="px-0.5">
      <motion.div
        animate={reduceMotion ? undefined : { y: [0, -2, 0] }}
        transition={reduceMotion ? undefined : { duration: 5.4, repeat: Infinity, ease: 'easeInOut' }}
        className="relative mx-auto max-w-4xl overflow-hidden rounded-[1.1rem] bg-transparent px-2 py-1.5 text-center shadow-none sm:px-3 sm:py-2"
      >
        <div className="relative min-h-[2.8rem] overflow-hidden">
          <motion.div
            key={activeItem.id}
            initial={reduceMotion ? { opacity: 0 } : { left: startPosition, opacity: 0.9 }}
            animate={reduceMotion ? { opacity: 1 } : { left: endPosition, opacity: 1 }}
            transition={reduceMotion ? { duration: 0.22 } : { duration: durationMs / 1000, ease: 'linear' }}
            className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap"
          >
            <p className="px-2 text-[13px] font-semibold leading-6 text-[var(--color-text)] sm:text-[15px] sm:leading-7">
              {activeItem.text}
            </p>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default AnnouncementTicker;
