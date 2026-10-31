/**
 * Financial precision utility for Brightloop Software
 * Ensures all monetary operations avoid JavaScript floating-point errors.
 * Rules:
 * - Round each line once.
 * - Standard 2 decimal places precision for currency (paise/cents).
 */

/**
 * Converts a monetary value (number, string, or Decimal) into integer cents.
 * e.g., 10.50 -> 1050, "123.456" -> 12346 (half up)
 */
export function toCents(amount) {
  if (amount === null || amount === undefined) return 0;
  const num = typeof amount === 'number' ? amount : parseFloat(amount.toString());
  if (Number.isNaN(num)) return 0;
  return Math.round(num * 100);
}

/**
 * Converts integer cents back into a standard 2-decimal number.
 * e.g., 1050 -> 10.50
 */
export function fromCents(cents) {
  if (!cents || Number.isNaN(cents)) return 0;
  return Number((cents / 100).toFixed(2));
}

/**
 * Rounds a value to exactly 2 decimal places using cent integer math.
 */
export function roundMoney(amount) {
  return fromCents(toCents(amount));
}

/**
 * Formats a value as a string with 2 decimal places (e.g., "12.50").
 */
export function toDecimalString(amount) {
  return roundMoney(amount).toFixed(2);
}

/**
 * Safe addition of multiple monetary amounts.
 */
export function addMoney(...amounts) {
  const totalCents = amounts.reduce((acc, curr) => acc + toCents(curr), 0);
  return fromCents(totalCents);
}

/**
 * Safe subtraction (a - b).
 */
export function subtractMoney(a, b) {
  return fromCents(toCents(a) - toCents(b));
}

/**
 * Safe multiplication of a monetary amount by a quantity or factor.
 */
export function multiplyMoney(amount, factor) {
  const num = typeof amount === 'number' ? amount : parseFloat(amount.toString());
  return roundMoney(num * factor);
}

/**
 * Calculates discount amount given base amount and discount rule (FIXED or PERCENT).
 */
export function calculateDiscount(baseAmount, discountType, discountValue) {
  const base = roundMoney(baseAmount);
  if (!discountValue || discountValue <= 0) return 0;

  if (discountType === 'PERCENT') {
    const rate = parseFloat(discountValue.toString()) / 100;
    const discount = roundMoney(base * rate);
    return Math.min(base, discount);
  }

  // FIXED
  const fixed = roundMoney(discountValue);
  return Math.min(base, fixed);
}

/**
 * Line calculation order per specification:
 * 1. lineBase = qty * unitPrice
 * 2. subtract discount
 * 3. tax = (lineBase - discount) * rate%
 * 4. lineTotal = (lineBase - discount) + tax
 */
export function calculateInvoiceLine({ quantity, unitPrice, discountAmount = 0, taxRatePercent = 0 }) {
  const qty = parseInt(quantity, 10) || 1;
  const price = roundMoney(unitPrice);
  const lineBase = roundMoney(qty * price);

  const appliedDiscount = roundMoney(Math.min(lineBase, discountAmount || 0));
  const taxableBase = roundMoney(lineBase - appliedDiscount);

  const rate = parseFloat(taxRatePercent.toString()) || 0;
  const taxAmount = roundMoney(taxableBase * (rate / 100));

  const lineTotal = roundMoney(taxableBase + taxAmount);

  return {
    quantity: qty,
    unitPrice: price,
    lineBase,
    discountAmount: appliedDiscount,
    taxableBase,
    taxRate: rate,
    taxAmount,
    lineTotal,
  };
}

/**
 * Formats amount for human display
 */
export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(roundMoney(amount));
}
