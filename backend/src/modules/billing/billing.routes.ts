import { Router, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { BillingEngine } from './billing.engine';
import { requireAuth, requireRole, AuthenticatedRequest } from '../../middleware/auth';
import { logAuditEvent } from '../../middleware/audit';

const router = Router();

// GET /api/billing/control-center (Signature Feature: Central Operations Control)
router.get('/control-center', requireAuth, requireRole('ADMIN', 'STAFF'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const today = new Date();
    const next7Days = new Date(Date.now() + 7 * 24 * 3600 * 1000);

    // 1. Due Subscriptions (nextBillingDate <= today and status is ACTIVE)
    const dueSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        nextBillingDate: { lte: today },
      },
      include: { customer: true, plan: true },
      orderBy: { nextBillingDate: 'asc' },
    });

    // 2. Upcoming Renewals (nextBillingDate between today and next 7 days, or expiryDate soon)
    const upcomingRenewals = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        nextBillingDate: { gt: today, lte: next7Days },
      },
      include: { customer: true, plan: true },
      orderBy: { nextBillingDate: 'asc' },
    });

    // 3. Failed Billing Attempts
    const failedAttempts = await prisma.billingAttempt.findMany({
      where: { status: 'FAILED' },
      include: {
        subscription: { include: { customer: true, plan: true } },
        billingRun: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // 4. Invoices Status Summary
    const draftInvoices = await prisma.invoice.count({ where: { workflowStatus: 'DRAFT' } });
    const confirmedInvoices = await prisma.invoice.count({ where: { workflowStatus: 'CONFIRMED' } });
    const unpaidInvoices = await prisma.invoice.count({ where: { paymentStatus: 'UNPAID' } });
    const overdueInvoices = await prisma.invoice.count({
      where: {
        paymentStatus: { in: ['UNPAID', 'PARTIALLY_PAID'] },
        dueDate: { lt: today },
      },
    });

    // 5. Payment Operations
    const partiallyPaidInvoices = await prisma.invoice.findMany({
      where: { paymentStatus: 'PARTIALLY_PAID' },
      include: { customer: true },
      take: 15,
    });

    const unallocatedPayments = await prisma.payment.findMany({
      where: { unallocatedAmount: { gt: 0 } },
      include: { customer: true },
      take: 15,
    });

    // 6. Expiring Discounts
    const expiringDiscounts = await prisma.discount.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { not: null, lte: next7Days },
      },
    });

    // 7. Recent Billing Runs
    const recentRuns = await prisma.billingRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: 5,
    });

    res.json({
      dueSubscriptions,
      upcomingRenewals,
      failedAttempts,
      invoiceMetrics: {
        draftCount: draftInvoices,
        confirmedCount: confirmedInvoices,
        unpaidCount: unpaidInvoices,
        overdueCount: overdueInvoices,
      },
      paymentMetrics: {
        partiallyPaid: partiallyPaidInvoices,
        unallocatedPayments,
      },
      expiringDiscounts,
      recentRuns,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/billing/trigger (Trigger recurring billing run)
router.post('/trigger', requireAuth, requireRole('ADMIN', 'STAFF'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { asOfDate, subscriptionId } = req.body;
    const targetDate = asOfDate ? new Date(asOfDate) : new Date();

    const result = await BillingEngine.executeBillingRun(
      'MANUAL',
      targetDate,
      subscriptionId || undefined
    );

    await logAuditEvent(
      req,
      'BILLING_RUN_EXECUTED',
      'BillingRun',
      result.runId,
      null,
      {
        processed: result.processedCount,
        success: result.successCount,
        failed: result.failedCount,
        skipped: result.skippedCount,
      }
    );

    res.json({
      message: 'Billing run executed successfully.',
      result,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/billing/retry-attempt/:attemptId (Retry a failed billing attempt)
router.post('/retry-attempt/:attemptId', requireAuth, requireRole('ADMIN', 'STAFF'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { attemptId } = req.params;
    const result = await BillingEngine.retryAttempt(attemptId);

    await logAuditEvent(req, 'BILLING_RETRY', 'BillingAttempt', attemptId, null, result);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/billing/runs (History of all billing runs)
router.get('/runs', requireAuth, requireRole('ADMIN', 'STAFF'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const runs = await prisma.billingRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: 50,
      include: {
        attempts: {
          include: { subscription: { select: { subscriptionNumber: true } } },
        },
      },
    });
    res.json(runs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
