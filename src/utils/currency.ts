/**
 * Multi-currency conversion (USD <-> NGN)
 * Live exchange rates pulled from backend or fallback to cached rate.
 */

export type Currency = 'USD' | 'NGN';

const CACHED_RATE_KEY = 'skilltok_usd_ngn_rate';
const CACHED_RATE_TIMESTAMP = 'skilltok_usd_ngn_timestamp';
const DEFAULT_RATE = 1650; // ₦1,650 per $1 USD (Feb 2026 average)

export const Currency = {
  getCurrentRate(): number {
    try {
      const cached = localStorage.getItem(CACHED_RATE_KEY);
      const timestamp = parseInt(localStorage.getItem(CACHED_RATE_TIMESTAMP) || '0');
      const oneHour = 60 * 60 * 1000;
      if (cached && Date.now() - timestamp < oneHour) {
        return parseFloat(cached);
      }
    } catch {}
    return DEFAULT_RATE;
  },

  async refreshRate(): Promise<number> {
    try {
      // In production: fetch from backend `/api/currency/rate` which calls Fixer.io or ExchangeRate-API
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      const ngnRate = data.rates?.NGN || DEFAULT_RATE;
      localStorage.setItem(CACHED_RATE_KEY, String(ngnRate));
      localStorage.setItem(CACHED_RATE_TIMESTAMP, String(Date.now()));
      return ngnRate;
    } catch {
      return DEFAULT_RATE;
    }
  },

  usdToNgn(usd: number): number {
    return Math.round(usd * this.getCurrentRate());
  },

  ngnToUsd(ngn: number): number {
    return parseFloat((ngn / this.getCurrentRate()).toFixed(2));
  },

  format(amount: number, currency: Currency = 'USD'): string {
    if (currency === 'NGN') {
      return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  },

  formatCents(cents: number, currency: Currency = 'USD'): string {
    const dollars = cents / 100;
    if (currency === 'NGN') {
      return this.format(this.usdToNgn(dollars), 'NGN');
    }
    return this.format(dollars, 'USD');
  }
};
