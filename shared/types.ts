export type UserRole = 'ADMIN' | 'STAFF' | 'CUSTOMER';

export type BillingIntervalType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export type SubscriptionStatusType = 
  | 'DRAFT'
  | 'QUOTATION'
  | 'CONFIRMED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'CLOSED';

export type InvoiceWorkflowStatusType =
  | 'DRAFT'
  | 'CONFIRMED'
  | 'PAID'
  | 'CANCELLED'
  | 'PARTIALLY_PAID'
  | 'OVERDUE';

export type PaymentStatusType = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';

export type PaymentMethodType = 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CARD' | 'OTHER';

export interface CalculationBreakdown {
  basePrice: number;
  variantPrice: number;
  unitFinalPrice: number;
  quantity: number;
  subtotal: number;
  discountType?: 'PERCENTAGE' | 'FIXED';
  discountRateOrValue?: number;
  discountAmount: number;
  taxableAmount: number;
  taxName?: string;
  taxPercentage?: number;
  isInclusiveTax?: boolean;
  taxAmount: number;
  total: number;
}

export interface FinancialAnalyticsSummary {
  mrr: number;
  arr: number;
  activeSubscriptionsCount: number;
  totalRevenueCollected: number;
  totalOutstandingBalance: number;
  overdueInvoicesCount: number;
  upcomingRenewalsCount: number;
  churnRate: number;
  invoicesSummary: {
    paid: number;
    partiallyPaid: number;
    unpaid: number;
    overdue: number;
  };
}
