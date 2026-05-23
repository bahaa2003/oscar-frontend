import React from 'react';
import { cn } from '../ui/Button';
import { resolveImageUrl } from '../../utils/imageUrl';
import coinsImage from '../../assets/عملات.webp';

const ProductCard = ({
  product,
  categoryLabel,
  priceLabel,
  buyLabel,
  secondaryLabel,
  secondaryTo,
  isRTL,
}) => {
  const productName = product.displayName;
  const isUnavailable = product.storefrontStatus?.isPurchasable === false;

  return (
    <article className="group flex h-full flex-col">
      <div className="relative overflow-hidden rounded-[1rem]">
        <img
          src={product.image ? resolveImageUrl(product.image) : coinsImage}
          alt={productName}
          className={cn(
            'aspect-square w-full object-cover transition duration-500 group-hover:scale-105',
            isUnavailable && 'brightness-[0.42] grayscale-[0.18]'
          )}
        />
        {isUnavailable && (
          <div className="absolute inset-0 grid place-items-center bg-black/22 px-2">
            <span className="rounded-full border border-white/22 bg-black/58 px-3 py-1.5 text-xs font-black text-white shadow-[0_10px_28px_-18px_rgb(0_0_0/0.9)] backdrop-blur-md">
              {isRTL ? 'غير متاح' : 'Unavailable'}
            </span>
          </div>
        )}
      </div>

      <h3 className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-[var(--color-text)] text-center">
        {productName}
      </h3>
    </article>
  );
};

export default ProductCard;
