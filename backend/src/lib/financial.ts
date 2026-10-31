/**
 * Financial Calculation Engine for LOOPFLOW
 * Ensures financial precision by operating in integer minor units (cents / paise)
 * avoiding IEEE 754 floating point drift.
 */

export interface PricingInputItem {
  basePrice: number;
  variantPrice?: number;
  quantity: number;
  discountPercentage?: number;
  discountFixed?: number;
  taxPercentage?: number;
  isTaxInclusive?: boolean;
}

export interface CalculatedItemResult {
  basePrice: number;
  variantPrice: number;
  unitFinalPrice: number;
  quantity: number;
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  lineTotal: number;
  breakdown: {
    basePriceCents: number;
    variantPriceCents: number;
    unitPriceCents: number;
    subtotalCents: number;
    discountCents: number;
    taxableCents: number;
    taxCents: number;
    totalCents: number;
  };
}

export function toCents(amount: number): number {
  return Math.round((Number(amount) || 0) * 100);
}

export function fromCents(cents: number): number {
  return Number((cents / 100).toFixed(2));
}

export function calculateLineItem(item: PricingInputItem): CalculatedItemResult {
  const baseCents = toCents(item.basePrice);
  const variantCents = toCents(item.variantPrice || 0);
  const unitPriceCents = baseCents + variantCents;
  const quantity = Math.max(1, Math.floor(item.quantity || 1));
  
  const subtotalCents = unitPriceCents * quantity;

  // Discount calculation
  let discountCents = 0;
  if (item.discountPercentage && item.discountPercentage > 0) {
    const pct = Math.min(100, Math.max(0, item.discountPercentage));
    discountCents = Math.round((subtotalCents * pct) / 100);
  } else if (item.discountFixed && item.discountFixed > 0) {
    discountCents = Math.min(subtotalCents, toCents(item.discountFixed));
  }

  const taxableCents = Math.max(0, subtotalCents - discountCents);

  // Tax calculation
  let taxCents = 0;
  let totalCents = 0;
  const taxPct = Math.max(0, item.taxPercentage || 0);

  if (taxPct > 0) {
    if (item.isTaxInclusive) {
      // Inclusive: Tax = Taxable - (Taxable / (1 + Rate))
      const divisor = 1 + (taxPct / 100);
      const preTaxCents = Math.round(taxableCents / divisor);
      taxCents = taxableCents - preTaxCents;
      totalCents = taxableCents; // Total already includes tax
    } else {
      // Exclusive: Tax = Taxable * Rate
      taxCents = Math.round((taxableCents * taxPct) / 100);
      totalCents = taxableCents + taxCents;
    }
  } else {
    totalCents = taxableCents;
  }

  return {
    basePrice: fromCents(baseCents),
    variantPrice: fromCents(variantCents),
    unitFinalPrice: fromCents(unitPriceCents),
    quantity,
    subtotal: fromCents(subtotalCents),
    discountAmount: fromCents(discountCents),
    taxableAmount: fromCents(taxableCents),
    taxAmount: fromCents(taxCents),
    lineTotal: fromCents(totalCents),
    breakdown: {
      basePriceCents: baseCents,
      variantPriceCents: variantCents,
      unitPriceCents,
      subtotalCents,
      discountCents,
      taxableCents,
      taxCents,
      totalCents,
    },
  };
}

export function calculateOrderTotals(items: CalculatedItemResult[]) {
  let subtotalCents = 0;
  let discountCents = 0;
  let taxCents = 0;
  let totalCents = 0;

  for (const it of items) {
    subtotalCents += it.breakdown.subtotalCents;
    discountCents += it.breakdown.discountCents;
    taxCents += it.breakdown.taxCents;
    totalCents += it.breakdown.totalCents;
  }

  return {
    subtotal: fromCents(subtotalCents),
    discountTotal: fromCents(discountCents),
    taxTotal: fromCents(taxCents),
    totalAmount: fromCents(totalCents),
  };
}

export function calculateNormalizedMrr(amount: number, interval: string): number {
  const amt = Number(amount) || 0;
  switch (interval.toUpperCase()) {
    case 'DAILY':
      return fromCents(toCents(amt * 30));
    case 'WEEKLY':
      return fromCents(toCents((amt * 52) / 12));
    case 'MONTHLY':
      return fromCents(toCents(amt));
    case 'YEARLY':
      return fromCents(toCents(amt / 12));
    default:
      return fromCents(toCents(amt));
  }
}

export function calculateNormalizedArr(mrr: number): number {
  return fromCents(toCents(mrr * 12));
}
