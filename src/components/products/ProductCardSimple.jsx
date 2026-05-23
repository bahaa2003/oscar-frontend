import React from 'react';
import { cn } from '../ui/Button';

const ProductCardSimple = React.memo(({
  product,
  categoryLabel,
  onOpen,
  showCategory = false,
  buyLabel = 'Buy now',
  unavailableLabel = 'غير متاح',
}) => {
  const isUnavailable = product.storefrontStatus?.isPurchasable === false;
  const imageSrc = String(product.image || '').trim();
  const displayName = product.displayName || product.name || 'Product';

  return (
    <button
      type="button"
      onClick={() => onOpen(product)}
      className="storefront-product-card group relative isolate flex h-full w-full origin-center select-none flex-col rounded-[1.4rem] text-start transition-all duration-200 ease-out"
      aria-label={displayName}
    >
      <div className="storefront-product-media relative overflow-hidden rounded-[1.2rem]">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={displayName}
            loading="lazy"
            decoding="async"
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 24vw, 18vw"
            className={cn(
              'relative block aspect-square h-full w-full bg-transparent object-contain object-center transition duration-500 group-hover:scale-[1.05]',
              isUnavailable && 'brightness-[0.42] grayscale-[0.18]'
            )}
          />
        ) : (
          <div
            aria-hidden="true"
            className={cn(
              'relative grid aspect-square h-full w-full place-items-center rounded-[1.2rem] border border-[color:rgb(var(--color-border-rgb)/0.72)] bg-[color:rgb(var(--color-surface-rgb)/0.72)] text-2xl font-black text-[var(--color-text-secondary)] transition duration-500 group-hover:scale-[1.03]',
              isUnavailable && 'brightness-[0.42] grayscale-[0.18]'
            )}
          >
            {displayName.slice(0, 1).toUpperCase()}
          </div>
        )}
        {isUnavailable && (
          <div className="absolute inset-0 grid place-items-center bg-black/24 px-2">
            <span className="rounded-full border border-white/22 bg-black/60 px-2.5 py-1 text-[11px] font-black text-white shadow-[0_10px_28px_-18px_rgb(0_0_0/0.9)] backdrop-blur-md sm:px-3 sm:py-1.5 sm:text-xs">
              {unavailableLabel}
            </span>
          </div>
        )}
      </div>

      <h3 className="storefront-product-title mt-2 line-clamp-2 w-full text-center text-sm font-semibold leading-5 text-[var(--color-text)] transition-colors duration-200 group-hover:text-[var(--color-primary)]">
        {displayName}
      </h3>
    </button>
  );
});

ProductCardSimple.displayName = 'ProductCardSimple';

export default ProductCardSimple;
