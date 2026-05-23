import React from 'react';
import { resolveImageUrl } from '../../utils/imageUrl';
import coinsImage from '../../assets/عملات.webp';

const ProductInfoPanel = ({
  product,
  title,
  formattedPrice,
  priceLabel,
  kicker,
}) => (
  <section className="space-y-4">
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-black/30">
      <img
        src={product.image ? resolveImageUrl(product.image) : coinsImage}
        alt={title}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        className="aspect-[1.02] w-full object-cover"
      />
    </div>

    <div className="space-y-3">
      <span className="inline-flex rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-red-200">
        {kicker}
      </span>
      <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white sm:text-[2rem]">
        {title}
      </h2>

      <div className="rounded-[1.5rem] border border-red-400/16 bg-[linear-gradient(135deg,rgba(239,68,68,0.16),rgba(249,115,22,0.12))] p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-red-100/72">{priceLabel}</p>
        <p className="mt-2 text-3xl font-bold tracking-[-0.04em] text-white sm:text-[2.5rem]">
          {formattedPrice}
        </p>
      </div>
    </div>
  </section>
);

export default ProductInfoPanel;
