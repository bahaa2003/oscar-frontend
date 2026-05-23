import React from 'react';
import logoImage from '../../assets/ms-removebg-preview.webp';

const Loader = () => {
  return (
    <div className="flex min-h-[220px] w-full items-center justify-center p-8">
      <img
        src={logoImage}
        alt="OSCAR STORE"
        className="h-24 w-24 object-contain drop-shadow-[0_8px_20px_rgb(var(--color-primary-rgb)/0.35)] animate-[logo-soft-spin_1.7s_cubic-bezier(0.4,0,0.2,1)_infinite] sm:h-28 sm:w-28"
      />
    </div>
  );
};

export default Loader;
