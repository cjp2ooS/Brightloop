import { Router, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { calculateNormalizedMrr, toCents, fromCents } from '../../lib/financial';
import { requireAuth, requireRole, AuthenticatedRequest } from '../../middleware/auth';
import { startOfMonth, endOfMonth, addDays, format } from 'date-fns';

const router = Router();

// POST /api/intelligence/query (Natural Language Financial & Operations Queries)
router.post('/query', requireAuth, requireRole('ADMIN', 'STAFF'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { question } = req.body;
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question query string is required.' });
    }

    const q = question.toLowerCase();
    const today = new Date();

    // Query 1: Revenue collected
    if (q.includes('revenue') && (q.includes('collect') || q.includes('this month') || q.includes('month'))) {
      const start = startOfMonth(today);
      const end = endOfMonth(today);

      const thisMonthPayments = await prisma.payment.aggregate({
        where: {
          paymentDate: { gte: start, lte: end },
          status: { not: 'REVERSED' },
        },
        _sum: { amount: true },
        _count: true,
      });

      const totalPayments = await prisma.payment.aggregate({
        where: { status: { not: 'REVERSED' } },
        _sum: { amount: true },
      });

      const monthAmt = thisMonthPayments._sum.amount || 0;
      const totalAmt = totalPayments._sum.amount || 0;

      return res.json({
        type: 'FINANCIAL_REVENUE',
        answer: `Brightloop Software has collected ₹${monthAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })} this month across ${thisMonthPayments._count} payments. All-time cash collected stands at ₹${totalAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`,
        data: {
          thisMonthCollected: monthAmt,
          thisMonthPaymentsCount: thisMonthPayments._count,
          totalCollected: totalAmt,
        },
      });
    }

    // Query 2: Overdue invoices
    if (q.includes('overdue') || q.includes('late')) {
      const overdueInvoices = await prisma.invoice.findMany({
        where: {
          workflowStatus: 'CONFIRMED',
          paymentStatus: { in: ['UNPAID', 'PARTIALLY_PAID'] },
          dueDate: { lt: today },
        },
        include: { customer: true },
        orderBy: { dueDate: 'asc' },
      });

      const totalOverdueCents = overdueInvoices.reduce((acc, inv) => acc + toCents(inv.balanceDue), 0);
      const totalOverdue = fromCents(totalOverdueCents);

      return res.json({
        type: 'OVERDUE_INVOICES',
        answer: `There are currently ${overdueInvoices.length} overdue invoices totaling ₹${totalOverdue.toLocaleString('en-IN', { minimumFractionDigits: 2 })} in outstanding balance.`,
        data: {
          count: overdueInvoices.length,
          totalBalanceDue: totalOverdue,
          invoices: overdueInvoices.map((inv) => ({
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            customerName: inv.customer.companyName,
            balanceDue: inv.balanceDue,
            dueDate: format(inv.dueDate, 'yyyy-MM-dd'),
          })),
        },
      });
    }

    // Query 3: Renewals this week / next 7 days
    if (q.includes('renew') || q.includes('this week') || q.includes('upcoming')) {
      const nextWeek = addDays(today, 7);
      const renewingSubs = await prisma.subscription.findMany({
        where: {
          status: 'ACTIVE',
          nextBillingDate: { gte: today, lte: nextWeek },
        },
        include: { customer: true, plan: true },
        orderBy: { nextBillingDate: 'asc' },
      });

      const totalRenewValue = renewingSubs.reduce((acc, s) => acc + s.totalAmount, 0);

      return res.json({
        type: 'UPCOMING_RENEWALS',
        answer: `There are ${renewingSubs.length} subscriptions scheduled to renew over the next 7 days, representing ₹${totalRenewValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })} in upcoming billing value.`,
        data: {
          count: renewingSubs.length,
          totalValue: totalRenewValue,
          subscriptions: renewingSubs.map((s) => ({
            subscriptionNumber: s.subscriptionNumber,
            customerName: s.customer.companyName,
            planName: s.plan.name,
            totalAmount: s.totalAmount,
            nextBillingDate: format(s.nextBillingDate, 'yyyy-MM-dd'),
          })),
        },
      });
    }

    // Query 4: Highest MRR products / Top products
    if (q.includes('mrr') || q.includes('product') || q.includes('highest') || q.includes('top')) {
      const activeSubs = await prisma.subscription.findMany({
        where: { status: 'ACTIVE' },
        include: { plan: true, items: true },
      });

      const productMrrMap: Record<string, number> = {};
      for (const sub of activeSubs) {
        for (const it of sub.items) {
          const normItemMrr = calculateNormalizedMrr(it.lineTotal, sub.billingInterval);
          productMrrMap[it.productName] = (productMrrMap[it.productName] || 0) + normItemMrr;
        }
      }

      const sortedProducts = Object.entries(productMrrMap)
        .map(([name, mrr]) => ({ name, mrr: fromCents(toCents(mrr)) }))
        .sort((a, b) => b.mrr - a.mrr);

      const topProduct = sortedProducts[0];

      return res.json({
        type: 'TOP_MRR_PRODUCTS',
        answer: topProduct
          ? `The highest MRR generating product is "${topProduct.name}" contributing ₹${topProduct.mrr.toLocaleString('en-IN', { minimumFractionDigits: 2 })} to monthly recurring revenue.`
          : 'No active products found with current subscriptions.',
        data: {
          ranking: sortedProducts,
        },
      });
    }

    // Default general answer
    const activeSubsCount = await prisma.subscription.count({ where: { status: 'ACTIVE' } });
    const customersCount = await prisma.customer.count({ where: { status: 'ACTIVE' } });

    res.json({
      type: 'GENERAL_SUMMARY',
      answer: `Brightloop Software is currently managing ${activeSubsCount} active subscriptions across ${customersCount} active business accounts. You can ask me about monthly revenue, overdue invoices, upcoming renewals, or top MRR products.`,
      data: {
        activeSubscriptions: activeSubsCount,
        activeCustomers: customersCount,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
