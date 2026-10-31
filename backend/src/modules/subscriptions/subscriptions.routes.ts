import { Router, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { calculateNextBillingDate } from '../../lib/billing-date';
import { calculateLineItem, calculateOrderTotals } from '../../lib/financial';
import { requireAuth, requireRole, AuthenticatedRequest } from '../../middleware/auth';
import { logAuditEvent } from '../../middleware/audit';
import { format } from 'date-fns';

const router = Router();

// VALID STATE TRANSITIONS MATRIX
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['QUOTATION', 'CONFIRMED', 'CANCELLED'],
  QUOTATION: ['CONFIRMED', 'CANCELLED', 'EXPIRED'],
  CONFIRMED: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['PAUSED', 'CANCELLED', 'CLOSED', 'EXPIRED'],
  PAUSED: ['ACTIVE', 'CANCELLED', 'CLOSED'],
  CANCELLED: [], // Terminal
  CLOSED: [],    // Terminal
  EXPIRED: ['ACTIVE'], // Can be renewed into active
};

// GET /api/subscriptions
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, customerId, search } = req.query;
    const where: any = {};

    if (req.user?.role === 'CUSTOMER') {
      where.customerId = req.user.customerId;
    } else if (customerId) {
      where.customerId = customerId as string;
    }

    if (status && status !== 'ALL') {
      where.status = status as string;
    }

    if (search) {
      where.OR = [
        { subscriptionNumber: { contains: search as string } },
        { customer: { companyName: { contains: search as string } } },
        { customer: { contactName: { contains: search as string } } },
      ];
    }

    const subscriptions = await prisma.subscription.findMany({
      where,
      include: {
        customer: true,
        plan: true,
        items: true,
        _count: {
          select: { invoices: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(subscriptions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/subscriptions/:id
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        plan: true,
        items: true,
        events: {
          orderBy: { createdAt: 'desc' },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          include: { paymentAllocations: true },
        },
      },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found.' });
    }

    if (req.user?.role === 'CUSTOMER' && subscription.customerId !== req.user.customerId) {
      return res.status(403).json({ error: 'Unauthorized to view this subscription.' });
    }

    res.json(subscription);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/subscriptions (Direct Creation)
router.post('/', requireAuth, requireRole('ADMIN', 'STAFF'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { customerId, planId, items, billingInterval, startDate, paymentTerms, autoClose } = req.body;

    if (!customerId || !planId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Customer, Plan, and product items are required.' });
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found.' });
    }

    // Taxes
    const taxes = await prisma.tax.findMany({ where: { status: 'ACTIVE' } });
    const activeTax = taxes.length > 0 ? taxes[0] : null;

    const calculatedItems = items.map((it: any) => {
      return {
        ...it,
        calc: calculateLineItem({
          basePrice: parseFloat(it.unitPrice),
          variantPrice: it.variantPrice ? parseFloat(it.variantPrice) : 0,
          quantity: parseInt(it.quantity, 10) || 1,
          discountFixed: it.discountAmount ? parseFloat(it.discountAmount) : 0,
          taxPercentage: activeTax ? activeTax.percentage : 0,
          isTaxInclusive: activeTax ? activeTax.isInclusive : false,
        }),
      };
    });

    const totals = calculateOrderTotals(calculatedItems.map((ci: any) => ci.calc));
    const start = startDate ? new Date(startDate) : new Date();
    const interval = billingInterval ? billingInterval.toUpperCase() : plan.billingInterval;
    const nextBillingDate = calculateNextBillingDate(start, interval);
    const subscriptionNumber = `SUB-${format(start, 'yyyyMM')}-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const subscription = await prisma.$transaction(async (tx) => {
      const sub = await tx.subscription.create({
        data: {
          subscriptionNumber,
          customerId,
          planId,
          status: 'ACTIVE',
          billingInterval: interval,
          startDate: start,
          nextBillingDate,
          paymentTerms: paymentTerms || 'NET_30',
          subtotal: totals.subtotal,
          discountTotal: totals.discountTotal,
          taxTotal: totals.taxTotal,
          totalAmount: totals.totalAmount,
          autoClose: autoClose !== undefined ? Boolean(autoClose) : plan.autoClose,
          allowEarlyCancel: plan.allowEarlyCancel,
          allowPause: plan.allowPause,
          allowRenewal: plan.allowRenewal,
          items: {
            create: calculatedItems.map((it: any) => ({
              productId: it.productId,
              productName: it.productName || 'Subscription Product',
              variantId: it.variantId || null,
              variantName: it.variantName || null,
              quantity: it.calc.quantity,
              unitPrice: it.calc.basePrice,
              variantPrice: it.calc.variantPrice,
              discountAmount: it.calc.discountAmount,
              taxAmount: it.calc.taxAmount,
              lineTotal: it.calc.lineTotal,
            })),
          },
        },
      });

      await tx.subscriptionEvent.create({
        data: {
          subscriptionId: sub.id,
          eventType: 'CREATED',
          description: `Subscription created directly by ${req.user?.name || 'Staff'}.`,
          actorName: req.user?.name || 'Staff User',
          actorId: req.user?.userId,
        },
      });

      await tx.subscriptionEvent.create({
        data: {
          subscriptionId: sub.id,
          eventType: 'ACTIVATED',
          description: `Subscription activated. Next billing due: ${format(nextBillingDate, 'yyyy-MM-dd')}.`,
          actorName: req.user?.name || 'Staff User',
          actorId: req.user?.userId,
        },
      });

      return sub;
    });

    await logAuditEvent(req, 'SUBSCRIPTION_CREATED', 'Subscription', subscription.id, null, subscription);

    res.status(201).json(subscription);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/subscriptions/:id/transition (State Transition Engine)
router.post('/:id/transition', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { targetStatus, reason } = req.body;
    const sub = await prisma.subscription.findUnique({
      where: { id: req.params.id },
      include: { plan: true },
    });

    if (!sub) {
      return res.status(404).json({ error: 'Subscription not found.' });
    }

    // Role restrictions: Customer can only request cancellation or pause if permitted
    if (req.user?.role === 'CUSTOMER') {
      if (sub.customerId !== req.user.customerId) {
        return res.status(403).json({ error: 'Unauthorized to modify this subscription.' });
      }
      if (targetStatus === 'CANCELLED' && !sub.allowEarlyCancel) {
        return res.status(403).json({ error: 'Early cancellation is not permitted by your subscription plan.' });
      }
      if (targetStatus === 'PAUSED' && !sub.allowPause) {
        return res.status(403).json({ error: 'Pausing is not permitted by your subscription plan.' });
      }
      if (!['PAUSED', 'CANCELLED'].includes(targetStatus)) {
        return res.status(403).json({ error: 'Customers are only permitted to pause or cancel active subscriptions.' });
      }
    }

    const currentStatus = sub.status;
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];

    if (!allowed.includes(targetStatus)) {
      return res.status(400).json({
        error: `Illegal state transition from ${currentStatus} to ${targetStatus}. Allowed: [${allowed.join(', ')}]`,
      });
    }

    const updateData: any = {
      status: targetStatus,
    };

    if (targetStatus === 'PAUSED') {
      updateData.pausedAt = new Date();
    } else if (targetStatus === 'ACTIVE' && currentStatus === 'PAUSED') {
      updateData.pausedAt = null;
    } else if (targetStatus === 'CANCELLED') {
      updateData.cancelReason = reason || 'Cancelled by user/operator';
    }

    const updated = await prisma.$transaction(async (tx) => {
      const s = await tx.subscription.update({
        where: { id: req.params.id },
        data: updateData,
      });

      await tx.subscriptionEvent.create({
        data: {
          subscriptionId: s.id,
          eventType: targetStatus,
          description: `Status changed from ${currentStatus} to ${targetStatus}.${reason ? ` Reason: ${reason}` : ''}`,
          actorName: req.user?.name || 'Staff User',
          actorId: req.user?.userId,
        },
      });

      return s;
    });

    await logAuditEvent(req, 'SUBSCRIPTION_TRANSITION', 'Subscription', updated.id, { status: currentStatus }, { status: targetStatus, reason });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/subscriptions/:id/renew (Staff or Admin)
router.post('/:id/renew', requireAuth, requireRole('ADMIN', 'STAFF'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sub = await prisma.subscription.findUnique({
      where: { id: req.params.id },
    });

    if (!sub) {
      return res.status(404).json({ error: 'Subscription not found.' });
    }

    if (!sub.allowRenewal) {
      return res.status(400).json({ error: 'Renewals are disabled for this subscription.' });
    }

    const nextBilling = calculateNextBillingDate(sub.nextBillingDate, sub.billingInterval);

    const updated = await prisma.$transaction(async (tx) => {
      const s = await tx.subscription.update({
        where: { id: sub.id },
        data: {
          status: 'ACTIVE',
          nextBillingDate: nextBilling,
        },
      });

      await tx.subscriptionEvent.create({
        data: {
          subscriptionId: s.id,
          eventType: 'RENEWED',
          description: `Subscription renewed manually. Next billing date: ${format(nextBilling, 'yyyy-MM-dd')}`,
          actorName: req.user?.name || 'Staff User',
          actorId: req.user?.userId,
        },
      });

      return s;
    });

    await logAuditEvent(req, 'SUBSCRIPTION_RENEWED', 'Subscription', updated.id, sub, updated);

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/subscriptions/:id/make-due (DEMO HELPER: Force Next Billing Date to Now/Past)
router.post('/:id/make-due', requireAuth, requireRole('ADMIN', 'STAFF'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = await prisma.subscription.update({
      where: { id: req.params.id },
      data: {
        nextBillingDate: new Date(Date.now() - 3600000), // 1 hour in the past
      },
    });

    res.json({
      message: 'Subscription next billing date set to past. Subscription is now due for billing.',
      subscription: updated,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
