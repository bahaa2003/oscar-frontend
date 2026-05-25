import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { cn } from './Button';
import { Search } from 'lucide-react';
import { searchInputClassName } from './Input';

const SearchBar = ({
  value,
  onChange,
  placeholder,
  className,
  inputClassName,
  forceIconRight = false,
  ...props
}) => {
  const { dir } = useLanguage();
  const isRTL = dir === 'rtl';
  const isIconOnRight = forceIconRight || isRTL;

  const handleChange = (e) => {
    if (typeof onChange !== 'function') return;
    onChange(e.target.value);
  };
  
  return (
    <div className={cn('w-full', className)}>
      <div className="relative">
        <Search
          className={cn(
            'pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]',
            isIconOnRight ? 'right-3.5' : 'left-3.5'
          )}
        />
        <input
          type="search"
          className={cn(
            searchInputClassName,
            inputClassName,
            isIconOnRight ? 'pr-10 pl-3.5 text-right' : 'pl-10 pr-3.5 text-left'
          )}
          placeholder={placeholder || ''}
          value={value}
          onChange={handleChange}
          id="search-input"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          {...props}
        />
      </div>
    </div>
  );
};

export default SearchBar;
