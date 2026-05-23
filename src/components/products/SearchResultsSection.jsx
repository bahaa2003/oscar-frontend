import React from 'react';
import { SearchX } from 'lucide-react';
import EmptyState from './EmptyState';
import ProductCardSimple from './ProductCardSimple';

const SearchResultsSection = ({
  results,
  title,
  subtitle,
  emptyTitle,
  emptyDescription,
  clearActionLabel,
  onClear,
  onProductOpen,
  getCategoryLabel,
  unavailableLabel = 'غير متاح',
}) => {
  if (!results.length) {
    return (
      <EmptyState
        icon={SearchX}
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={clearActionLabel}
        onAction={onClear}
      />
    );
  }

  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--color-text)]">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm leading-7 text-[var(--color-text-secondary)]">
            {subtitle}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {results.map((product) => (
          <ProductCardSimple
            key={product.id}
            product={product}
            categoryLabel={getCategoryLabel(product)}
            onOpen={onProductOpen}
            showCategory
            unavailableLabel={unavailableLabel}
          />
        ))}
      </div>
    </section>
  );
};

export default SearchResultsSection;
