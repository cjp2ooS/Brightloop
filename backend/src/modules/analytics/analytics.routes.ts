import { Router, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { calculateNormalizedMrr, calculateNormalizedArr, toCents, fromCents } from '../../lib/financial';
import { requireAuth, requireRole, AuthenticatedRequest } from '../../middleware/auth';
import { subMonths, format, startOfMonth, endOfMonth } from 'date-fns';

const router = Router();

// GET /api/analytics/dashboard (Financial Intelligence Dashboard)
router.get('/dashboard', requireAuth, requireRole('ADMIN', 'STAFF'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const today = new Date();
    const next30Days = new Date(Date.now() + 30 * 24 * 3600 * 1000);

    // 1. Fetch active subscriptions for MRR & ARR
    const activeSubscriptions = await prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      select: {
        totalAmount: true,
        billingInterval: true,
      },
    });

    let totalMrrCents = 0;
    for (const sub of activeSubscriptions) {
      const normMrr = calculateNormalizedMrr(sub.totalAmount, sub.billingInterval);
      totalMrrCents += toCents(normMrr);
    }
    const mrr = fromCents(totalMrrCents);
    const arr = calculateNormalizedArr(mrr);

    // 2. Revenue collected (from non-reversed payments)
    const paymentSum = await prisma.payment.aggregate({
      where: { status: { not: 'REVERSED' } },
      _sum: { amount: true },
    });
    const revenueCollected = paymentSum._sum.amount || 0;

    // 3. Outstanding balance (from confirmed & non-cancelled invoices)
    const invoiceSum = await prisma.invoice.aggregate({
      where: { workflowStatus: { notIn: ['CANCELLED', 'DRAFT'] } },
      _sum: { balanceDue: true, totalAmount: true },
    });
    const outstandingRevenue = invoiceSum._sum.balanceDue || 0;
    const totalInvoiced = invoiceSum._sum.totalAmount || 0;

    // 4. Overdue Invoices
    const overdueCount = await prisma.invoice.count({
      where: {
        workflowStatus: 'CONFIRMED',
        paymentStatus: { in: ['UNPAID', 'PARTIALLY_PAID'] },
        dueDate: { lt: today },
      },
    });

    // 5. Upcoming Renewals in next 30 days
    const upcomingRenewalsCount = await prisma.subscription.count({
      where: {
        status: 'ACTIVE',
        nextBillingDate: { gte: today, lte: next30Days },
      },
    });

    // 6. Churn Rate = Cancelled / (Active + Cancelled)
    const cancelledCount = await prisma.subscription.count({ where: { status: 'CANCELLED' } });
    const totalSubs = activeSubscriptions.length + cancelledCount;
    const churnRate = totalSubs > 0 ? parseFloat(((cancelledCount / totalSubs) * 100).toFixed(1)) : 0;

    // 7. Monthly Revenue Trend (Last 6 months)
    const monthlyTrend: Array<{ month: string; invoiced: number; collected: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(today, i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      const label = format(monthDate, 'MMM yyyy');

      const invAgg = await prisma.invoice.aggregate({
        where: {
          invoiceDate: { gte: start, lte: end },
          workflowStatus: { not: 'CANCELLED' },
        },
        _sum: { totalAmount: true },
      });

      const payAgg = await prisma.payment.aggregate({
        where: {
          paymentDate: { gte: start, lte: end },
          status: { not: 'REVERSED' },
        },
        _sum: { amount: true },
      });

      monthlyTrend.push({
        month: label,
        invoiced: invAgg._sum.totalAmount || 0,
        collected: payAgg._sum.amount || 0,
      });
    }

    // 8. Revenue By Product
    const invoiceItems = await prisma.invoiceItem.findMany({
      select: { productName: true, lineTotal: true },
    });
    const productMap: Record<string, number> = {};
    for (const it of invoiceItems) {
      productMap[it.productName] = (productMap[it.productName] || 0) + it.lineTotal;
    }
    const revenueByProduct = Object.entries(productMap)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    // 9. Payment Method Distribution
    const payments = await prisma.payment.findMany({
      where: { status: { not: 'REVERSED' } },
      select: { method: true, amount: true },
    });
    const methodMap: Record<string, { amount: number; count: number }> = {};
    for (const p of payments) {
      if (!methodMap[p.method]) methodMap[p.method] = { amount: 0, count: 0 };
      methodMap[p.method].amount += p.amount;
      methodMap[p.method].count += 1;
    }
    const paymentMethodDist = Object.entries(methodMap).map(([method, stats]) => ({
      method,
      amount: Math.round(stats.amount * 100) / 100,
      count: stats.count,
    }));

    // 10. Billing Interval Distribution
    const subs = await prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      select: { billingInterval: true },
    });
    const intervalMap: Record<string, number> = {};
    for (const s of subs) {
      intervalMap[s.billingInterval] = (intervalMap[s.billingInterval] || 0) + 1;
    }
    const intervalDist = Object.entries(intervalMap).map(([interval, count]) => ({
      interval,
      count,
    }));

    res.json({
      kpis: {
        mrr,
        arr,
        activeSubscriptionsCount: activeSubscriptions.length,
        revenueCollected,
        outstandingRevenue,
        totalInvoiced,
        overdueInvoicesCount: overdueCount,
        upcomingRenewalsCount,
        churnRate,
      },
      charts: {
        monthlyTrend,
        revenueByProduct,
        paymentMethodDist,
        intervalDist,
      },
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
