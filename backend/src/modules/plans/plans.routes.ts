import { Router, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { requireAuth, requireRole, AuthenticatedRequest } from '../../middleware/auth';
import { logAuditEvent } from '../../middleware/audit';

const router = Router();

// GET /api/plans
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.query;
    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status as string;
    }

    const plans = await prisma.plan.findMany({
      where,
      include: {
        planProducts: {
          include: { product: true },
        },
        _count: {
          select: { subscriptions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(plans);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/plans/:id
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const plan = await prisma.plan.findUnique({
      where: { id: req.params.id },
      include: {
        planProducts: {
          include: {
            product: {
              include: { variants: true },
            },
          },
        },
      },
    });

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found.' });
    }

    res.json(plan);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/plans (Admin only)
router.post('/', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      name,
      description,
      billingAmount,
      billingInterval,
      minQuantity,
      startDate,
      endDate,
      autoClose,
      allowEarlyCancel,
      allowPause,
      allowRenewal,
      productIds,
    } = req.body;

    if (!name || billingAmount === undefined || !billingInterval) {
      return res.status(400).json({ error: 'Name, billing amount, and billing interval are required.' });
    }

    const plan = await prisma.$transaction(async (tx) => {
      const p = await tx.plan.create({
        data: {
          name,
          description,
          billingAmount: parseFloat(billingAmount),
          billingInterval: billingInterval.toUpperCase(),
          minQuantity: minQuantity ? parseInt(minQuantity, 10) : 1,
          startDate: startDate ? new Date(startDate) : new Date(),
          endDate: endDate ? new Date(endDate) : null,
          autoClose: Boolean(autoClose),
          allowEarlyCancel: allowEarlyCancel !== undefined ? Boolean(allowEarlyCancel) : true,
          allowPause: allowPause !== undefined ? Boolean(allowPause) : true,
          allowRenewal: allowRenewal !== undefined ? Boolean(allowRenewal) : true,
          status: 'ACTIVE',
        },
      });

      if (productIds && Array.isArray(productIds)) {
        for (const pid of productIds) {
          await tx.planProduct.create({
            data: {
              planId: p.id,
              productId: pid,
            },
          });
        }
      }

      return tx.plan.findUnique({
        where: { id: p.id },
        include: {
          planProducts: { include: { product: true } },
        },
      });
    });

    await logAuditEvent(req, 'PLAN_CREATED', 'Plan', plan?.id, null, plan);

    res.status(201).json(plan);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/plans/:id (Admin only)
router.put('/:id', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      name,
      description,
      billingAmount,
      billingInterval,
      minQuantity,
      autoClose,
      allowEarlyCancel,
      allowPause,
      allowRenewal,
      status,
      productIds,
    } = req.body;

    const existing = await prisma.plan.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Plan not found.' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.plan.update({
        where: { id: req.params.id },
        data: {
          name: name ?? existing.name,
          description: description ?? existing.description,
          billingAmount: billingAmount !== undefined ? parseFloat(billingAmount) : existing.billingAmount,
          billingInterval: billingInterval ? billingInterval.toUpperCase() : existing.billingInterval,
          minQuantity: minQuantity !== undefined ? parseInt(minQuantity, 10) : existing.minQuantity,
          autoClose: autoClose !== undefined ? Boolean(autoClose) : existing.autoClose,
          allowEarlyCancel: allowEarlyCancel !== undefined ? Boolean(allowEarlyCancel) : existing.allowEarlyCancel,
          allowPause: allowPause !== undefined ? Boolean(allowPause) : existing.allowPause,
          allowRenewal: allowRenewal !== undefined ? Boolean(allowRenewal) : existing.allowRenewal,
          status: status ?? existing.status,
        },
      });

      if (productIds && Array.isArray(productIds)) {
        await tx.planProduct.deleteMany({ where: { planId: p.id } });
        for (const pid of productIds) {
          await tx.planProduct.create({
            data: { planId: p.id, productId: pid },
          });
        }
      }

      return tx.plan.findUnique({
        where: { id: p.id },
        include: { planProducts: { include: { product: true } } },
      });
    });

    await logAuditEvent(req, 'PLAN_UPDATED', 'Plan', updated?.id, existing, updated);

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
