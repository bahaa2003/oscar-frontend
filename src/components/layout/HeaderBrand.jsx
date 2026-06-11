import React from 'react';
import BrandMark from './BrandMark';
import { cn } from '../ui/Button';

const HeaderBrand = ({ className, iconClassName, textClassName }) => (
  <span className={cn('inline-flex items-center gap-1.5 min-[380px]:gap-2.5 sm:gap-5', className)}>
    <span className={cn('min-w-0 text-center leading-none', textClassName)}>
      {}
      <span className="oscar-brand-title block font-['Orbitron'] text-[0.82rem] font-black leading-none tracking-[0.08em] text-transparent bg-clip-text bg-[linear-gradient(120deg,#ffffff_0%,#f1e9ff_18%,#22d3ee_46%,#8b5cf6_70%,#f43fdd_100%)] animate-shimmer-slow min-[380px]:text-[1.02rem] sm:text-[1.5rem]">
        OSCAR
      </span>
      {}
      <span className="mt-0.5 block font-['Orbitron'] text-[0.28rem] font-bold uppercase tracking-[0.3em] text-[#a855f7] min-[380px]:text-[0.36rem] sm:text-[0.5rem]">
        STORE
      </span>
    </span>
    {}
    <BrandMark
      size="xs"
      compact
      showCaption={false}
      className={cn(
        'scale-[0.9] origin-left min-[380px]:scale-[1.05] min-[380px]:-mr-0.5 sm:scale-[1.22] sm:mr-0',
        iconClassName
      )}
    />
  </span>
);

export default HeaderBrand;
