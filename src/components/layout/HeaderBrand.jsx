import React from 'react';
import BrandMark from './BrandMark';
import { cn } from '../ui/Button';

const HeaderBrand = ({ className, iconClassName, textClassName }) => (
  <span className={cn('inline-flex items-center gap-3 rounded-[14px] sm:gap-5', className)}>
    <span className={cn('min-w-0 text-center leading-none', textClassName)}>
      <span className="oscar-brand-title block font-['Orbitron'] text-[0.98rem] font-black leading-none tracking-[0.12em] text-transparent bg-clip-text bg-[linear-gradient(120deg,#ffffff_0%,#f1e9ff_18%,#22d3ee_46%,#8b5cf6_70%,#f43fdd_100%)] animate-shimmer-slow min-[380px]:text-[1.1rem] sm:text-[1.5rem]">
        OSCAR
      </span>
      <span className="mt-0.5 block font-['Orbitron'] text-[0.38rem] font-bold uppercase tracking-[0.5em] text-[#a855f7] sm:text-[0.5rem]">
        STORE
      </span>
    </span>
    <BrandMark
      size="xs"
      compact
      showCaption={false}
      className={cn('scale-[0.88] min-[380px]:scale-[0.96] sm:scale-[1.04]', iconClassName)}
    />
  </span>
);

export default HeaderBrand;
