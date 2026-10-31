import { Router, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { requireAuth, requireRole, AuthenticatedRequest } from '../../middleware/auth';
import { logAuditEvent } from '../../middleware/audit';

const router = Router();

// GET /api/discounts
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.query;
    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status as string;
    }

    const discounts = await prisma.discount.findMany({
      where,
      include: {
        product: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(discounts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/discounts (Admin only)
router.post('/', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      name,
      code,
      discountType,
      value,
      minAmount,
      minQuantity,
      maxDiscountAmount,
      usageLimit,
      startDate,
      endDate,
      productId,
      isSubscriptionWide,
    } = req.body;

    if (!name || !code || value === undefined) {
      return res.status(400).json({ error: 'Discount name, unique code, and value are required.' });
    }

    const existingCode = await prisma.discount.findUnique({ where: { code: code.toUpperCase() } });
    if (existingCode) {
      return res.status(400).json({ error: 'A discount with this code already exists.' });
    }

    const discount = await prisma.discount.create({
      data: {
        name,
        code: code.toUpperCase(),
        discountType: discountType || 'PERCENTAGE',
        value: parseFloat(value),
        minAmount: minAmount ? parseFloat(minAmount) : null,
        minQuantity: minQuantity ? parseInt(minQuantity, 10) : null,
        maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
        usageLimit: usageLimit ? parseInt(usageLimit, 10) : null,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        productId: productId || null,
        isSubscriptionWide: isSubscriptionWide !== undefined ? Boolean(isSubscriptionWide) : true,
        status: 'ACTIVE',
      },
    });

    await logAuditEvent(req, 'DISCOUNT_CREATED', 'Discount', discount.id, null, discount);

    res.status(201).json(discount);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/discounts/:id (Admin only)
router.put('/:id', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, value, usageLimit, status, endDate } = req.body;
    const existing = await prisma.discount.findUnique({ where: { id: req.params.id } });

    if (!existing) {
      return res.status(404).json({ error: 'Discount not found.' });
    }

    const updated = await prisma.discount.update({
      where: { id: req.params.id },
      data: {
        name: name ?? existing.name,
        value: value !== undefined ? parseFloat(value) : existing.value,
        usageLimit: usageLimit !== undefined ? parseInt(usageLimit, 10) : existing.usageLimit,
        endDate: endDate ? new Date(endDate) : existing.endDate,
        status: status ?? existing.status,
      },
    });

    await logAuditEvent(req, 'DISCOUNT_UPDATED', 'Discount', updated.id, existing, updated);

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
