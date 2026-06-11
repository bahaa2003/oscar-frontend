import React from 'react';
import { Link } from 'react-router-dom';
import soulChillBanner from '../../assets/soulchill-home-banner.webp';

const SoulChillBanner = ({ to = '/auth?mode=login', onClick }) => {
  const sharedClassName = 'group block overflow-hidden rounded-[1.35rem] border border-[color:rgb(var(--color-border-rgb)/0.64)] bg-[linear-gradient(135deg,rgb(var(--color-card-rgb)/0.98),rgb(var(--color-primary-rgb)/0.06))] shadow-[var(--shadow-subtle)] transition-[border-color,box-shadow] duration-300 ease-out hover:border-[color:rgb(var(--color-primary-rgb)/0.24)] hover:shadow-[0_18px_48px_-36px_rgb(var(--color-primary-rgb)/0.54)] sm:rounded-[1.65rem]';

  const content = (
    <div className="relative aspect-[3/1] w-full bg-[color:rgb(var(--color-card-rgb)/0.45)]">
      <img
        src={soulChillBanner}
        alt="SoulChill - تجارب موسيقية بلا حدود"
        loading="lazy"
        decoding="async"
        sizes="(max-width: 1024px) 100vw, 1024px"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.01]"
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent" />
    </div>
  );

  return (
    <section className="mx-auto w-full max-w-4xl px-0.5 sm:px-2" aria-label="SoulChill">
      {onClick ? (
        <button type="button" onClick={onClick} className={`${sharedClassName} w-full text-start`}>
          {content}
        </button>
      ) : (
        <Link to={to} className={sharedClassName}>
          {content}
        </Link>
      )}
    </section>
  );
};

export default SoulChillBanner;
