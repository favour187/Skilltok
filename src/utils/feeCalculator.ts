import { PlanType, FeeCalculationResult } from '../types';

export function calculateFees(
  basePriceCents: number,
  sellerPlan: PlanType,
  paymentMethod: 'paystack' | 'flutterwave' | 'stripe' | 'monnify' | 'bank_transfer'
): FeeCalculationResult {
  // Buyer pays the listed price (0% buyer fee)
  const buyerFee = 0;
  const buyerPays = basePriceCents;

  // Seller platform fee (decreases with subscription tier)
  let sellerFeeRate = 0.05;  // free plan: 5%
  if (sellerPlan === 'pro')    sellerFeeRate = 0.04;  // pro: 4%
  if (sellerPlan === 'agency') sellerFeeRate = 0.03;  // agency: 3%

  const sellerFee = Math.round(basePriceCents * sellerFeeRate);
  const sellerNet = basePriceCents - sellerFee;

  // Payment processor fee (charged by the provider)
  let processingFee = 0;
  if (paymentMethod === 'paystack') {
    // Paystack: 1.5% + ₦100 (waived below ₦2,500)
    processingFee = Math.round(buyerPays * 0.015 + 100);
    if (basePriceCents < 250000) processingFee = Math.round(buyerPays * 0.015);
  } else if (paymentMethod === 'flutterwave') {
    // Flutterwave: 1.4% local + ₦50
    processingFee = Math.round(buyerPays * 0.014 + 50);
  } else if (paymentMethod === 'stripe') {
    // Stripe: 2.9% + $0.30 (international: +1.5%)
    processingFee = Math.round(buyerPays * 0.029 + 30);
  } else if (paymentMethod === 'monnify') {
    // Monnify: 1.5% capped at ₦2,000
    processingFee = Math.min(Math.round(buyerPays * 0.015), 200000);
  } else if (paymentMethod === 'bank_transfer') {
    processingFee = 0;
  }

  const platformNet = buyerFee + sellerFee - processingFee;

  return {
    basePriceCents,
    buyerFee,
    buyerPays,
    sellerFeeRate,
    sellerFee,
    sellerNet,
    processingFee,
    platformNet,
  };
}

export function formatCurrency(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(dollars);
}
