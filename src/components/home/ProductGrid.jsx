import React from 'react';
import { PackageSearch } from 'lucide-react';
import ProductCard from './ProductCard';

const ProductGrid = ({
  products,
  emptyTitle,
  emptyDescription,
  categoryResolver,
  priceLabel,
  buyLabel,
  secondaryLabelResolver,
  secondaryToResolver,
  isRTL,
}) => {
  if (!products.length) {
    return (
      <div className="rounded-[1.75rem] border border-[color:rgb(var(--color-border-rgb)/0.9)] bg-[color:rgb(var(--color-card-rgb)/0.94)] p-10 text-center shadow-[var(--shadow-subtle)]">
        <PackageSearch className="mx-auto h-10 w-10 text-[var(--color-primary)]" />
        <p className="mt-4 text-lg font-semibold text-[var(--color-text)]">{emptyTitle}</p>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          categoryLabel={categoryResolver(product)}
          priceLabel={priceLabel}
          buyLabel={buyLabel}
          secondaryLabel={secondaryLabelResolver(product)}
          secondaryTo={secondaryToResolver(product)}
          isRTL={isRTL}
        />
      ))}
    </div>
  );
};

export default ProductGrid;
