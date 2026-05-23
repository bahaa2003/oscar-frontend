import React from 'react';
import { Link } from 'react-router-dom';
import BrandMark from '../layout/BrandMark';

const StoreFooter = ({
  title,
  description,
  chips = [],
  copyright,
  metaLine,
  signature,
}) => (
  <footer className="overflow-hidden rounded-[2rem] border border-[color:rgb(var(--color-border-rgb)/0.72)] bg-[linear-gradient(180deg,rgb(var(--color-card-rgb)/0.78),rgb(var(--color-elevated-rgb)/0.56))] px-4 py-4 shadow-[var(--shadow-subtle)] backdrop-blur-xl sm:px-5 sm:py-5">
    <div className={`grid gap-3 ${chips.length ? 'xl:grid-cols-[1fr_auto]' : ''}`}>
      <div className="space-y-2">
        <BrandMark size="sm" />
        {title ? <h3 className="text-lg font-semibold text-[var(--color-text)]">{title}</h3> : null}
        {description ? <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)]">{description}</p> : null}
      </div>

      {chips.length ? (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <Link
              key={chip.label}
              to={chip.to}
              className="inline-flex h-10 items-center justify-center rounded-full border border-[color:rgb(var(--color-primary-rgb)/0.14)] bg-[color:rgb(var(--color-primary-rgb)/0.06)] px-4 text-sm font-medium text-[var(--color-text)] transition-all hover:-translate-y-0.5 hover:border-[color:rgb(var(--color-primary-rgb)/0.26)] hover:text-[var(--color-primary)]"
            >
              {chip.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>

    {(copyright || metaLine || signature) ? (
      <>
        <div className="soft-divider my-4" />

        <div className="space-y-2">
          <div className={`flex flex-col gap-1.5 text-sm text-[var(--color-muted)] ${metaLine ? 'lg:flex-row lg:items-center lg:justify-between' : 'items-center text-center'}`}>
            {copyright ? (
              <div className="inline-flex max-w-full flex-wrap items-center justify-center gap-x-1 gap-y-0 rounded-full border border-[color:rgb(var(--color-primary-rgb)/0.1)] bg-[color:rgb(var(--color-primary-rgb)/0.02)] px-1.5 py-0.5 text-[0.7rem] text-[var(--color-text-secondary)]">
                {copyright}
              </div>
            ) : (
              <span />
            )}
            {metaLine ? <p className="leading-6">{metaLine}</p> : null}
          </div>

          {signature ? (
            <p className="text-xs font-semibold tracking-[0.16em] text-[var(--color-text-secondary)]">
              {signature}
            </p>
          ) : null}
        </div>
      </>
    ) : null}
  </footer>
);

export default StoreFooter;
