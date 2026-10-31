import { describe, it, expect } from 'vitest';
import {
  calculateLineItem,
  calculateOrderTotals,
  calculateNormalizedMrr,
  calculateNormalizedArr,
  toCents,
  fromCents,
} from '../lib/financial';
import { calculateNextBillingDate, getBillingPeriodKey } from '../lib/billing-date';

describe('LOOPFLOW Financial Precision Engine', () => {
  it('correctly calculates base price + variant price in minor units', () => {
    // Base: ₹2,000, Variant: ₹560 (Odoo), Quantity: 3
    const result = calculateLineItem({
      basePrice: 2000,
      variantPrice: 560,
      quantity: 3,
    });

    expect(result.unitFinalPrice).toBe(2560);
    expect(result.subtotal).toBe(7680);
    expect(result.lineTotal).toBe(7680);
    expect(result.breakdown.totalCents).toBe(768000);
  });

  it('correctly calculates percentage discounts and exclusive taxes matching PRD Scenario', () => {
    // Base: 2000, Variant: 560, Qty: 3 -> Subtotal: 7680
    // Discount: 10% -> ₹768. Taxable: ₹6912
    // GST 18% Exclusive: 6912 * 0.18 = 1244.16. Total: 8156.16
    const result = calculateLineItem({
      basePrice: 2000,
      variantPrice: 560,
      quantity: 3,
      discountPercentage: 10,
      taxPercentage: 18,
      isTaxInclusive: false,
    });

    expect(result.subtotal).toBe(7680);
    expect(result.discountAmount).toBe(768);
    expect(result.taxableAmount).toBe(6912);
    expect(result.taxAmount).toBe(1244.16);
    expect(result.lineTotal).toBe(8156.16);
  });

  it('correctly calculates inclusive tax without floating point drift', () => {
    // Price: 118, Tax: 18% inclusive -> Pre-tax: 100, Tax: 18, Total: 118
    const result = calculateLineItem({
      basePrice: 118,
      quantity: 1,
      taxPercentage: 18,
      isTaxInclusive: true,
    });

    expect(result.subtotal).toBe(118);
    expect(result.taxAmount).toBe(18);
    expect(result.lineTotal).toBe(118);
  });

  it('normalizes MRR and ARR accurately across billing intervals', () => {
    // Monthly: ₹10,000 -> MRR = 10,000, ARR = 120,000
    expect(calculateNormalizedMrr(10000, 'MONTHLY')).toBe(10000);
    expect(calculateNormalizedArr(10000)).toBe(120000);

    // Yearly: ₹120,000 -> MRR = 10,000
    expect(calculateNormalizedMrr(120000, 'YEARLY')).toBe(10000);

    // Weekly: ₹2,000 -> MRR = (2000 * 52) / 12 = 8666.67
    expect(calculateNormalizedMrr(2000, 'WEEKLY')).toBe(8666.67);

    // Daily: ₹100 -> MRR = 100 * 30 = 3000
    expect(calculateNormalizedMrr(100, 'DAILY')).toBe(3000);
  });
});

describe('LOOPFLOW Calendar-Aware Billing Date Calculations', () => {
  it('calculates monthly billing dates preserving end-of-month across February', () => {
    const jan31 = new Date('2026-01-31T00:00:00Z');
    const febNext = calculateNextBillingDate(jan31, 'MONTHLY', 31);
    
    // In 2026 (non-leap year), February has 28 days
    expect(febNext.getUTCDate()).toBe(28);
    expect(febNext.getUTCMonth()).toBe(1); // February (0-indexed)
  });

  it('generates consistent idempotent billing period keys', () => {
    const start = new Date('2026-01-01T00:00:00Z');
    const end = new Date('2026-01-31T00:00:00Z');
    const key = getBillingPeriodKey(start, end);

    expect(key).toBe('2026-01-01_to_2026-01-31');
  });
});
