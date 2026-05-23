import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Wallet } from 'lucide-react';
import Card from '../ui/Card';
import { cn } from '../ui/Button';

const WelcomeCard = ({
  title,
  description,
  userName,
  balanceLabel,
  balanceValue,
  tierLabel,
  tierValue,
  primaryActionLabel,
  secondaryActionLabel,
}) => (
  <Card variant="premium" className="relative overflow-hidden p-5 sm:p-6">
    <div className="absolute -right-6 top-0 h-28 w-28 rounded-full bg-[color:rgb(var(--color-primary-rgb)/0.16)] blur-3xl" />

    <div className="relative grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-primary-soft)]">
          {title}
        </p>
        <h2 className="text-2xl font-semibold leading-tight text-[var(--color-text)] sm:text-[2rem]">
          {userName}
        </h2>
        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)] sm:text-base">
          {description}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            to="/wallet"
            className="glow-button inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-soft)_48%,var(--color-primary-hover))] px-5 text-sm font-semibold text-[var(--color-button-text)] shadow-[var(--shadow-gold)] transition-all hover:-translate-y-0.5"
          >
            <Wallet className="h-4.5 w-4.5" />
            {primaryActionLabel}
          </Link>

          <div className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[color:rgb(var(--color-primary-rgb)/0.2)] bg-[color:rgb(var(--color-primary-rgb)/0.07)] px-5 text-sm font-medium text-[var(--color-text)]">
            <ShieldCheck className="h-4.5 w-4.5 text-[var(--color-primary)]" />
            {secondaryActionLabel}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {[
          { label: balanceLabel, value: balanceValue },
          { label: tierLabel, value: tierValue },
        ].map((item) => (
          <div
            key={item.label}
            className={cn(
              'rounded-[1.5rem] border border-[color:rgb(var(--color-border-rgb)/0.9)] bg-[color:rgb(var(--color-bg-rgb)/0.18)] px-4 py-4 backdrop-blur-md'
            )}
          >
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">{item.label}</p>
            <p className="mt-3 text-xl font-semibold text-[var(--color-text)]">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  </Card>
);

export default WelcomeCard;
