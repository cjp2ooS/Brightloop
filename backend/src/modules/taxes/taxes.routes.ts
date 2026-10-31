import { Router, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { requireAuth, requireRole, AuthenticatedRequest } from '../../middleware/auth';
import { logAuditEvent } from '../../middleware/audit';

const router = Router();

// GET /api/taxes
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.query;
    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status as string;
    }

    const taxes = await prisma.tax.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json(taxes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/taxes (Admin only)
router.post('/', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, percentage, taxType, isInclusive, applicableProducts, effectiveFrom, effectiveTo } = req.body;

    if (!name || percentage === undefined) {
      return res.status(400).json({ error: 'Tax name and percentage are required.' });
    }

    const tax = await prisma.tax.create({
      data: {
        name,
        percentage: parseFloat(percentage),
        taxType: taxType || 'PERCENTAGE',
        isInclusive: Boolean(isInclusive),
        applicableProducts: applicableProducts ? JSON.stringify(applicableProducts) : null,
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
        effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
        status: 'ACTIVE',
      },
    });

    await logAuditEvent(req, 'TAX_CREATED', 'Tax', tax.id, null, tax);

    res.status(201).json(tax);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/taxes/:id (Admin only)
router.put('/:id', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, percentage, taxType, isInclusive, applicableProducts, status } = req.body;
    const existing = await prisma.tax.findUnique({ where: { id: req.params.id } });

    if (!existing) {
      return res.status(404).json({ error: 'Tax rule not found.' });
    }

    const updated = await prisma.tax.update({
      where: { id: req.params.id },
      data: {
        name: name ?? existing.name,
        percentage: percentage !== undefined ? parseFloat(percentage) : existing.percentage,
        taxType: taxType ?? existing.taxType,
        isInclusive: isInclusive !== undefined ? Boolean(isInclusive) : existing.isInclusive,
        applicableProducts: applicableProducts ? JSON.stringify(applicableProducts) : existing.applicableProducts,
        status: status ?? existing.status,
      },
    });

    await logAuditEvent(req, 'TAX_UPDATED', 'Tax', updated.id, existing, updated);

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
