import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CatalogCard = React.memo(({ catalog, isRTL, onOpen }) => (
  <button
    type="button"
    onClick={() => onOpen(catalog.id)}
    className="group text-start [content-visibility:auto] [contain-intrinsic-size:320px]"
    aria-label={catalog.title}
  >
    <article className="overflow-hidden rounded-[1.9rem] border border-[color:rgb(var(--color-border-rgb)/0.88)] bg-[color:rgb(var(--color-card-rgb)/0.96)] shadow-[var(--shadow-subtle)] transition-all duration-200 hover:-translate-y-1 hover:border-[color:rgb(var(--color-primary-rgb)/0.26)] hover:shadow-[var(--shadow-medium)]">
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={catalog.image}
          alt={catalog.title}
          loading="lazy"
          decoding="async"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 360px"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,10,0.08)_0%,rgba(8,8,10,0.16)_42%,rgba(8,8,10,0.84)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 sm:p-5">
          <h3 className="text-lg font-semibold tracking-[-0.02em] text-white sm:text-xl">
            {catalog.title}
          </h3>
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/14 bg-black/30 text-white/82 backdrop-blur-sm transition-transform duration-200 group-hover:translate-x-0.5">
            {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </span>
        </div>
      </div>
    </article>
  </button>
));

CatalogCard.displayName = 'CatalogCard';

export default CatalogCard;
