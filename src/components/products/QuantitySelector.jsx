import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '../ui/Button';

const QuantitySelector = ({
  value,
  minQty,
  maxQty,
  stepQty,
  onChange,
  disabled,
  copy,
}) => {
  const handleInputChange = (event) => {
    onChange(event.target.value);
  };

  const changeBy = (direction) => {
    onChange(Number(value || minQty) + (stepQty * direction));
  };

  return (
    <section className="space-y-3 rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{copy.quantityLabel}</p>
          <p className="mt-1 text-xs text-white/58">
            {copy.minLabel} {minQty} • {copy.maxLabel} {maxQty} • {copy.stepLabel} {stepQty}
          </p>
        </div>
        <div className="rounded-full border border-white/12 bg-black/20 px-3 py-1 text-sm font-semibold text-white">
          {value}
        </div>
      </div>

      <div className="grid grid-cols-[3rem,1fr,3rem] gap-2">
        <button
          type="button"
          onClick={() => changeBy(-1)}
          disabled={disabled || Number(value || minQty) <= minQty}
          className="inline-flex h-11 items-center justify-center rounded-[1rem] border border-white/10 bg-black/20 text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45 sm:h-12"
          aria-label={copy.decreaseLabel}
        >
          <Minus className="h-4 w-4" />
        </button>

        <input
          type="number"
          inputMode="numeric"
          min={minQty}
          max={maxQty}
          step={stepQty}
          value={value}
          onChange={handleInputChange}
          disabled={disabled}
          className={cn(
            'h-11 rounded-[1rem] border border-white/10 bg-black/20 px-4 text-center text-base font-semibold text-white outline-none transition-colors focus:border-red-400/60 focus:bg-black/30 sm:h-12 sm:text-lg',
            disabled && 'cursor-not-allowed opacity-55'
          )}
        />

        <button
          type="button"
          onClick={() => changeBy(1)}
          disabled={disabled || Number(value || minQty) >= maxQty}
          className="inline-flex h-11 items-center justify-center rounded-[1rem] border border-white/10 bg-black/20 text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45 sm:h-12"
          aria-label={copy.increaseLabel}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
};

export default QuantitySelector;
