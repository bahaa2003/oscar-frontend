import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
    }, 6200);

    return () => window.clearInterval(timer);
  }, [hasMultipleSlides, slides]);

  if (!slides?.length) return null;

  const safeCurrentSlide = currentSlide >= slides.length ? 0 : currentSlide;
  const slide = slides[safeCurrentSlide];
  const goToPrevious = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  const goToNext = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
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
    <div className="mx-auto w-full max-w-7xl space-y-1.5 px-0 sm:space-y-2 sm:px-2">
      <section className="group relative overflow-hidden rounded-[1.1rem] border border-[color:rgb(var(--color-primary-rgb)/0.18)] bg-[color:rgb(var(--color-card-rgb)/0.72)] shadow-[0_22px_70px_-42px_rgb(var(--color-primary-rgb)/0.82)] sm:rounded-[1.55rem]">
        <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(90deg,rgba(255,255,255,0.08),transparent_22%,transparent_78%,rgba(255,255,255,0.08))]" />
        <div className="pointer-events-none absolute inset-x-8 bottom-0 z-10 h-px bg-[linear-gradient(90deg,transparent,rgb(var(--color-primary-rgb)/0.65),transparent)]" />
        <div className="relative aspect-[3/1] min-h-[9.5rem] sm:min-h-[14rem] lg:min-h-[18rem]">
          <div
            key={slide.id}
            className="absolute inset-0 animate-[fade-in_0.42s_ease-out] motion-reduce:animate-none"
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

          {hasMultipleSlides ? (
            <>
              <button
                type="button"
                onClick={goToPrevious}
                className="absolute left-2 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/26 text-white opacity-0 shadow-[0_16px_34px_-20px_rgb(0_0_0/0.85)] backdrop-blur-md transition-all hover:bg-black/38 group-hover:opacity-100 sm:flex"
                aria-label={isArabic ? 'السلايد السابق' : 'Previous slide'}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={goToNext}
                className="absolute right-2 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/26 text-white opacity-0 shadow-[0_16px_34px_-20px_rgb(0_0_0/0.85)] backdrop-blur-md transition-all hover:bg-black/38 group-hover:opacity-100 sm:flex"
                aria-label={isArabic ? 'السلايد التالي' : 'Next slide'}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          ) : null}
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
