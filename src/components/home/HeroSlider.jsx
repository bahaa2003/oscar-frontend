import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const HeroSlider = ({ slides }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { i18n } = useTranslation();
  const hasMultipleSlides = (slides?.length || 0) > 1;
  const isArabic = (i18n.resolvedLanguage || i18n.language || 'ar').toLowerCase().startsWith('ar');
  const verseText = isArabic
    ? 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ  ﴿ وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا (2) وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ (3) ﴾  صَدَقَ اللَّهُ الْعَظِيمُ'
    : 'In the name of Allah, the Most Gracious, the Most Merciful. Whoever fears Allah, He will make for him a way out and provide for him from where he does not expect.';

  useEffect(() => {
    if (!hasMultipleSlides) return undefined;

    const timer = window.setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5200);

    return () => window.clearInterval(timer);
  }, [hasMultipleSlides, slides]);

  if (!slides?.length) return null;

  const slide = slides[currentSlide];
  const SlideFrame = slide.href ? 'a' : 'div';
  const slideFrameProps = slide.href
    ? {
      href: slide.href,
      target: '_blank',
      rel: 'noreferrer',
      'aria-label': slide.alt || slide.title || (isArabic ? 'فتح الرابط' : 'Open link'),
    }
    : {};

  return (
    <div className="mx-auto w-full max-w-5xl space-y-1.5 sm:space-y-2">
      <section className="relative overflow-hidden rounded-[1.35rem] border border-[color:rgb(var(--color-border-rgb)/0.64)] bg-[color:rgb(var(--color-card-rgb)/0.68)] shadow-[var(--shadow-subtle)] sm:rounded-[1.65rem]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_32%)]" />
        <div className="relative aspect-[16/6] sm:aspect-[18/7]">
          <div
            key={slide.id}
            className="absolute inset-0 animate-[fade-in_0.32s_ease-out] motion-reduce:animate-none"
          >
            <SlideFrame {...slideFrameProps} className="block h-full w-full">
              <img
                src={slide.image}
                alt={slide.alt || ''}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                sizes="100vw"
                className="h-full w-full object-cover"
              />
            </SlideFrame>
          </div>
        </div>
      </section>

      <div className="px-1 sm:px-1.5">
        <div className="marquee-wrap" dir={isArabic ? 'rtl' : 'ltr'}>
          <div className="marquee-track-smooth">
            <span className="marquee-chunk text-[11px] font-semibold tracking-[0.02em] text-[var(--color-text)] sm:text-[12px]">
              {verseText}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSlider;
