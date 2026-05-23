import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { SearchX } from 'lucide-react';
import { resolveImageUrl } from '../../utils/imageUrl';
import coinsImage from '../../assets/عملات.webp';
import SearchBar from '../ui/SearchBar';
import { cn } from '../ui/Button';
import { filterStorefrontProducts, sanitizeStorefrontQuery } from '../../utils/storefront';

const ProductSearchBar = ({
  products = [],
  language = 'ar',
  value,
  onChange,
  onSelectProduct,
  placeholder,
  className,
  maxResults = 6,
  noResultsLabel,
  inputClassName,
  resetSignal = 0,
  forceIconRight = false,
}) => {
  const isControlled = typeof value === 'string';
  const [internalValue, setInternalValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [dropdownLayout, setDropdownLayout] = useState(null);
  const rootRef = useRef(null);
  const layoutFrameRef = useRef(0);
  const searchValue = isControlled ? value : internalValue;
  const deferredQuery = useDeferredValue(searchValue);
  const normalizedQuery = sanitizeStorefrontQuery(deferredQuery);
  const isArabic = language === 'ar';

  const results = useMemo(() => {
    if (!normalizedQuery) return [];

    return filterStorefrontProducts(products, {
      searchTerm: normalizedQuery,
      activeCategory: 'all',
      language,
    }).slice(0, maxResults);
  }, [language, maxResults, normalizedQuery, products]);

  const updateValue = (nextValue) => {
    if (!isControlled) {
      setInternalValue(nextValue);
    }

    if (typeof onChange === 'function') {
      onChange(nextValue);
    }
  };

  const handleSelect = (product) => {
    updateValue('');
    setIsFocused(false);

    if (typeof onSelectProduct === 'function') {
      onSelectProduct(product);
    }
  };

  const handleBlur = () => {
    window.setTimeout(() => {
      setIsFocused(false);
    }, 120);
  };

  const showDropdown = isFocused && Boolean(normalizedQuery);

  const syncDropdownLayout = () => {
    if (!rootRef.current) return;

    const rect = rootRef.current.getBoundingClientRect();
    setDropdownLayout({
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
    });
  };

  const scheduleDropdownLayoutSync = () => {
    if (layoutFrameRef.current) {
      window.cancelAnimationFrame(layoutFrameRef.current);
    }

    layoutFrameRef.current = window.requestAnimationFrame(() => {
      layoutFrameRef.current = 0;
      syncDropdownLayout();
    });
  };

  useEffect(() => {
    if (isControlled) return undefined;

    setInternalValue('');
    setIsFocused(false);
    return undefined;
  }, [isControlled, resetSignal]);

  useEffect(() => {
    if (!showDropdown) return undefined;

    scheduleDropdownLayoutSync();

    const handleLayoutUpdate = () => {
      scheduleDropdownLayoutSync();
    };

    window.addEventListener('resize', handleLayoutUpdate);
    window.addEventListener('scroll', handleLayoutUpdate, true);

    return () => {
      if (layoutFrameRef.current) {
        window.cancelAnimationFrame(layoutFrameRef.current);
        layoutFrameRef.current = 0;
      }
      window.removeEventListener('resize', handleLayoutUpdate);
      window.removeEventListener('scroll', handleLayoutUpdate, true);
    };
  }, [showDropdown, normalizedQuery, results.length]);

  return (
    <div ref={rootRef} className={cn('relative w-full', className)}>
      <SearchBar
        value={searchValue}
        onChange={updateValue}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && results.length > 0) {
            event.preventDefault();
            handleSelect(results[0]);
          }
        }}
        placeholder={placeholder}
        className={className}
        inputClassName={inputClassName}
        forceIconRight={forceIconRight}
      />

      {showDropdown && dropdownLayout && typeof document !== 'undefined' && createPortal(
        <div
          style={dropdownLayout || undefined}
          className="fixed z-[30] overflow-hidden rounded-[1.25rem] border border-[color:rgb(var(--color-border-rgb)/0.82)] bg-[color:rgb(var(--color-card-rgb)/0.98)] shadow-[0_24px_60px_-34px_rgba(15,23,42,0.46)] backdrop-blur-xl"
        >
          {results.length > 0 ? (
            <div className="max-h-[18rem] overflow-y-auto py-1.5">
              {results.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    handleSelect(product);
                  }}
                  className="flex w-full items-center gap-2.5 px-2.5 py-2 text-start transition-colors hover:bg-[color:rgb(var(--color-primary-rgb)/0.08)]"
                >
                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded-[0.95rem] border border-[color:rgb(var(--color-border-rgb)/0.84)] bg-[color:rgb(var(--color-elevated-rgb)/0.88)]">
                    <img
                      src={product.image ? resolveImageUrl(product.image) : coinsImage}
                      alt={product.displayName}
                      loading="lazy"
                      decoding="async"
                      sizes="44px"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-[var(--color-text)] sm:text-[13px]">
                      {product.displayName}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2.5 px-3 py-3 text-xs text-[var(--color-text-secondary)] sm:text-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[color:rgb(var(--color-border-rgb)/0.86)] bg-[color:rgb(var(--color-elevated-rgb)/0.88)] text-[var(--color-muted)]">
                <SearchX className="h-4 w-4" />
              </div>
              <p>{noResultsLabel || (isArabic ? 'لا توجد منتجات مطابقة' : 'No matching products found')}</p>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default React.memo(ProductSearchBar);
