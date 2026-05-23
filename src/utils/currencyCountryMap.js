export const primaryCountryByCurrency = {
  USD: 'US',
  EGP: 'EG',
  SAR: 'SA',
  AED: 'AE',
  GBP: 'GB',
};

export const getPrimaryCountryCodeForCurrency = (currencyCode) => {
  const code = String(currencyCode || '').trim().toUpperCase();
  return primaryCountryByCurrency[code] || null;
};
