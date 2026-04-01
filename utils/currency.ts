export const SUPPORTED_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "INR",
  "CAD",
  "AUD",
  "JPY",
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export function formatCurrency(amount: number, currency: string = "USD") {
  const normalized = String(currency || "USD").toUpperCase();
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: normalized,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

const BASE_USD_RATES: Record<SupportedCurrency, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.4,
  CAD: 1.35,
  AUD: 1.52,
  JPY: 151.2,
};

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
) {
  const from = String(fromCurrency || "USD").toUpperCase() as SupportedCurrency;
  const to = String(toCurrency || "USD").toUpperCase() as SupportedCurrency;
  const fromRate = BASE_USD_RATES[from] || 1;
  const toRate = BASE_USD_RATES[to] || 1;
  const usdAmount = amount / fromRate;
  const converted = usdAmount * toRate;
  return Math.round((converted + Number.EPSILON) * 100) / 100;
}

export function getFxRates(baseCurrency: string = "USD") {
  const base = String(baseCurrency || "USD").toUpperCase() as SupportedCurrency;
  const baseRate = BASE_USD_RATES[base] || 1;
  const rates: Record<string, number> = {};
  for (const currency of SUPPORTED_CURRENCIES) {
    rates[currency] =
      Math.round(
        (BASE_USD_RATES[currency] / baseRate + Number.EPSILON) * 10000,
      ) / 10000;
  }
  return rates;
}
