/**
 * money.js — Arbitrary-precision money utilities
 *
 * Product prices (basePrice, providerPrice, finalPrice) are stored as
 * String with up to 50 decimal places. These functions work with raw
 * string values wherever possible to avoid IEEE 754 truncation.
 *
 * Only chargedAmount / wallet amounts use Number (2 dp fiat).
 */

const DEFAULT_MONEY_FRACTION_DIGITS = 10;
const FRACTION_EPSILON = 1e-9;

/**
 * Convert a value to a finite Number. For DISPLAY / FIAT amounts only.
 * DO NOT use this for product prices — use raw string rendering instead.
 */
export const toFiniteMoneyNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * Normalize a fiat money amount to a given fraction digits.
 * Only used for chargedAmount / wallet balances (2dp fiat).
 */
export const normalizeMoneyAmount = (value, fractionDigits = DEFAULT_MONEY_FRACTION_DIGITS) => {
  const safeValue = toFiniteMoneyNumber(value, 0);
  return Number(safeValue.toFixed(fractionDigits));
};

/**
 * Return the raw string representation of a price exactly as stored.
 * This is the primary display function for product prices (basePrice,
 * providerPrice, finalPrice) — it does NOT truncate, round, or cap.
 *
 * Returns the string as-is, stripping only trailing zeros for readability.
 * Falls back to '0' for null/undefined/empty.
 */
export const toRawPriceString = (value) => {
  if (value == null || value === '') return '0';
  const str = String(value);
  // If there's a dot, strip trailing zeros: 0.001700 → 0.0017
  if (str.includes('.')) {
    return str.replace(/0+$/, '').replace(/\.$/, '');
  }
  return str;
};

export const formatRawPriceString = (value) => {
  const raw = toRawPriceString(value).trim();
  const match = raw.match(/^([+-]?)(\d+)(\.\d+)?$/);

  if (!match) return raw;

  const [, sign, integerPart, fractionPart = ''] = match;
  const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${sign}${groupedInteger}${fractionPart}`;
};

const getResolvedMoneyFractionDigits = (value, maxFractionDigits = DEFAULT_MONEY_FRACTION_DIGITS) => {
  const safeValue = Math.abs(toFiniteMoneyNumber(value, 0));
  const normalized = safeValue.toFixed(maxFractionDigits).replace(/0+$/, '').replace(/\.$/, '');
  const fractionPart = normalized.split('.')[1] || '';
  return fractionPart.length;
};

export const getMoneyFormatOptions = (
  value,
  {
    compact = false,
    maximumFractionDigits,
    minimumFractionDigits,
  } = {}
) => {
  const safeValue = Math.abs(toFiniteMoneyNumber(value, 0));
  const hasFraction = Math.abs(safeValue - Math.trunc(safeValue)) > FRACTION_EPSILON;
  const actualFractionDigits = hasFraction
    ? getResolvedMoneyFractionDigits(safeValue, DEFAULT_MONEY_FRACTION_DIGITS)
    : 0;

  const resolvedMaximumFractionDigits = Number.isInteger(maximumFractionDigits)
    ? maximumFractionDigits
    : (compact ? Math.min(Math.max(actualFractionDigits, 1), 2) : actualFractionDigits);

  const resolvedMinimumFractionDigits = Number.isInteger(minimumFractionDigits)
    ? minimumFractionDigits
    : (compact ? 0 : actualFractionDigits);

  return {
    maximumFractionDigits: resolvedMaximumFractionDigits,
    minimumFractionDigits: resolvedMinimumFractionDigits,
  };
};
