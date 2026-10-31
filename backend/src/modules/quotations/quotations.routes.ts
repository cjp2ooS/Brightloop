import { Router, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { calculateLineItem, calculateOrderTotals } from '../../lib/financial';
import { calculateNextBillingDate } from '../../lib/billing-date';
import { requireAuth, requireRole, AuthenticatedRequest } from '../../middleware/auth';
import { logAuditEvent } from '../../middleware/audit';
import { format } from 'date-fns';

const router = Router();

// ==================== QUOTATION TEMPLATES ====================

// GET /api/quotations/templates
router.get('/templates', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const templates = await prisma.quotationTemplate.findMany({
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(templates);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/quotations/templates (Staff or Admin)
router.post('/templates', requireAuth, requireRole('ADMIN', 'STAFF'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, planId, validityDays, paymentTerms, defaultNotes, items } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Template name is required.' });
    }

    const template = await prisma.quotationTemplate.create({
      data: {
        name,
        planId: planId || null,
        validityDays: validityDays ? parseInt(validityDays, 10) : 30,
        paymentTerms: paymentTerms || 'NET_30',
        defaultNotes: defaultNotes || null,
        items: {
          create: (items || []).map((it: any) => ({
            productId: it.productId,
            variantId: it.variantId || null,
            quantity: it.quantity ? parseInt(it.quantity, 10) : 1,
          })),
        },
      },
      include: { items: true },
    });

    res.status(201).json(template);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== QUOTATIONS ====================

// GET /api/quotations
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, customerId } = req.query;
    const where: any = {};

    if (req.user?.role === 'CUSTOMER') {
      where.customerId = req.user.customerId;
    } else if (customerId) {
      where.customerId = customerId as string;
    }

    if (status && status !== 'ALL') {
      where.status = status as string;
    }

    const quotations = await prisma.quotation.findMany({
      where,
      include: {
        customer: true,
        plan: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(quotations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/quotations/:id
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        plan: true,
        items: true,
        subscriptions: true,
      },
    });

    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found.' });
    }

    if (req.user?.role === 'CUSTOMER' && quotation.customerId !== req.user.customerId) {
      return res.status(403).json({ error: 'Unauthorized to view this quotation.' });
    }

    res.json(quotation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/quotations (Staff or Admin)
router.post('/', requireAuth, requireRole('ADMIN', 'STAFF'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { customerId, planId, items, paymentTerms, notes, validityDays } = req.body;

    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Customer and at least one line item are required.' });
    }

    // Taxes
    const taxes = await prisma.tax.findMany({ where: { status: 'ACTIVE' } });
    const activeTax = taxes.length > 0 ? taxes[0] : null;

    // Line items calculation
    const calculatedItems = items.map((it: any) => {
      return {
        ...it,
        calc: calculateLineItem({
          basePrice: parseFloat(it.unitPrice),
          variantPrice: it.variantPrice ? parseFloat(it.variantPrice) : 0,
          quantity: parseInt(it.quantity, 10) || 1,
          discountPercentage: it.discountPercentage ? parseFloat(it.discountPercentage) : undefined,
          discountFixed: it.discountAmount ? parseFloat(it.discountAmount) : undefined,
          taxPercentage: activeTax ? activeTax.percentage : 0,
          isTaxInclusive: activeTax ? activeTax.isInclusive : false,
        }),
      };
    });

    const totals = calculateOrderTotals(calculatedItems.map((ci: any) => ci.calc));

    const quotationNumber = `QUO-${format(new Date(), 'yyyyMM')}-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const validity = new Date();
    validity.setDate(validity.getDate() + (parseInt(validityDays, 10) || 30));

    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber,
        customerId,
        planId: planId || null,
        status: 'QUOTATION',
        validityDate: validity,
        paymentTerms: paymentTerms || 'NET_30',
        notes: notes || null,
        subtotal: totals.subtotal,
        discountTotal: totals.discountTotal,
        taxTotal: totals.taxTotal,
        totalAmount: totals.totalAmount,
        createdById: req.user!.userId,
        items: {
          create: calculatedItems.map((it: any) => ({
            productId: it.productId,
            productName: it.productName || 'Product Item',
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
      include: {
        customer: true,
        plan: true,
        items: true,
      },
    });

    await logAuditEvent(req, 'QUOTATION_CREATED', 'Quotation', quotation.id, null, quotation);

    res.status(201).json(quotation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/quotations/:id/confirm (Staff or Admin)
router.post('/:id/confirm', requireAuth, requireRole('ADMIN', 'STAFF'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: req.params.id },
    });

    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found.' });
    }

    if (new Date() > quotation.validityDate) {
      return res.status(400).json({ error: 'Cannot confirm expired quotation without validity extension.' });
    }

    const updated = await prisma.quotation.update({
      where: { id: req.params.id },
      data: { status: 'CONFIRMED' },
    });

    await logAuditEvent(req, 'QUOTATION_CONFIRMED', 'Quotation', updated.id, quotation, updated);

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/quotations/:id/convert (Convert confirmed quotation to Active Subscription)
router.post('/:id/convert', requireAuth, requireRole('ADMIN', 'STAFF'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: req.params.id },
      include: {
        items: true,
        customer: true,
        plan: true,
        subscriptions: true,
      },
    });

    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found.' });
    }

    // Check if already converted
    if (quotation.status === 'CONVERTED' || quotation.subscriptions.length > 0) {
      return res.status(400).json({
        error: `Quotation is already converted into subscription ${quotation.subscriptions[0]?.subscriptionNumber}. Duplicate conversion prevented.`,
      });
    }

    if (quotation.status !== 'CONFIRMED') {
      return res.status(400).json({ error: 'Only confirmed quotations can be converted into subscriptions.' });
    }

    const plan = quotation.plan;
    if (!plan) {
      return res.status(400).json({ error: 'Cannot convert quotation without an associated subscription plan.' });
    }

    const startDate = new Date();
    const nextBillingDate = calculateNextBillingDate(startDate, plan.billingInterval);
    const subscriptionNumber = `SUB-${format(startDate, 'yyyyMM')}-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const subscription = await prisma.$transaction(async (tx) => {
      const sub = await tx.subscription.create({
        data: {
          subscriptionNumber,
          customerId: quotation.customerId,
          planId: plan.id,
          quotationId: quotation.id,
          status: 'ACTIVE',
          billingInterval: plan.billingInterval,
          startDate,
          nextBillingDate,
          paymentTerms: quotation.paymentTerms,
          subtotal: quotation.subtotal,
          discountTotal: quotation.discountTotal,
          taxTotal: quotation.taxTotal,
          totalAmount: quotation.totalAmount,
          autoClose: plan.autoClose,
          allowEarlyCancel: plan.allowEarlyCancel,
          allowPause: plan.allowPause,
          allowRenewal: plan.allowRenewal,
          items: {
            create: quotation.items.map((it) => ({
              productId: it.productId,
              productName: it.productName,
              variantId: it.variantId,
              variantName: it.variantName,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              variantPrice: it.variantPrice,
              discountAmount: it.discountAmount,
              taxAmount: it.taxAmount,
              lineTotal: it.lineTotal,
            })),
          },
        },
      });

      // Mark quotation as CONVERTED
      await tx.quotation.update({
        where: { id: quotation.id },
        data: { status: 'CONVERTED' },
      });

      // Record timeline events
      await tx.subscriptionEvent.create({
        data: {
          subscriptionId: sub.id,
          eventType: 'CREATED',
          description: `Subscription created from Quotation ${quotation.quotationNumber}.`,
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

    await logAuditEvent(req, 'QUOTATION_CONVERTED', 'Subscription', subscription.id, null, subscription);

    res.status(201).json({
      message: 'Quotation successfully converted to active subscription.',
      subscription,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
