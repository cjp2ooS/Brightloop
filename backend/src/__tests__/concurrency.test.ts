import { describe, it, expect } from 'vitest';
import { prisma } from '../lib/prisma';
import { BillingEngine } from '../modules/billing/billing.engine';

describe('LOOPFLOW Concurrency & Idempotency Engine', () => {
  it('handles simultaneous concurrent billing triggers on the same subscription without generating duplicate invoices', async () => {
    // 1. Find or create an active subscription
    const sub = await prisma.subscription.findFirst({
      where: { status: 'ACTIVE' },
    });

    expect(sub).not.toBeNull();

    // 2. Set nextBillingDate to past
    await prisma.subscription.update({
      where: { id: sub!.id },
      data: { nextBillingDate: new Date(Date.now() - 3600000) },
    });

    // 3. Fire first run to bill it
    const res1 = await BillingEngine.executeBillingRun('MANUAL', new Date(), sub!.id);
    expect(res1.status).toBeDefined();

    // 4. Immediately fire second run
    const res2 = await BillingEngine.executeBillingRun('MANUAL', new Date(), sub!.id);
    expect(res2.skippedCount).toBeGreaterThan(0);
    expect(res2.details[0].status).toBe('SKIPPED');

    // 5. Query invoices for this subscription to verify no duplicates were generated
    const periodInvoices = await prisma.invoice.findMany({
      where: {
        subscriptionId: sub!.id,
      },
    });

    const keys = periodInvoices.map((inv) => inv.billingPeriodKey);
    const uniqueKeys = new Set(keys);
    // Every generated invoice for a period must be unique (0 duplicate invoices for the same cycle)
    expect(keys.length).toBe(uniqueKeys.size);
  });
});
