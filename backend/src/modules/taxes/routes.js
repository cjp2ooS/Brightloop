import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/db.js';
import { requireAuth, allowRoles } from '../../middleware/auth.js';
import { parseBody } from '../auth/validation.js';

const router = Router();
const taxSchema = z.object({ name: z.string().trim().min(1).max(120), ratePercent: z.number().min(0).max(100), isActive: z.boolean().optional() });
router.use(requireAuth);

router.get('/', allowRoles('ADMIN', 'STAFF'), async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 100));
    const where = {};
    if (req.query.active === 'true' || req.query.active === 'false') where.isActive = req.query.active === 'true';
    const [items, total] = await Promise.all([prisma.tax.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { name: 'asc' } }), prisma.tax.count({ where })]);
    res.json({ items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});

router.post('/', allowRoles('ADMIN'), async (req, res, next) => {
  try {
    const data = parseBody(taxSchema, req, res); if (!data) return;
    const tax = await prisma.tax.create({ data: { ...data, isActive: data.isActive ?? true } });
    res.status(201).json({ tax });
  } catch (error) { if (error.code === 'P2002') return res.status(409).json({ error: { code: 'TAX_EXISTS', message: 'A tax with this name already exists' } }); next(error); }
});

router.patch('/:id', allowRoles('ADMIN'), async (req, res, next) => {
  try {
    const data = parseBody(taxSchema.partial(), req, res); if (!data) return;
    const tax = await prisma.tax.update({ where: { id: req.params.id }, data });
    res.json({ tax });
  } catch (error) { if (error.code === 'P2025') return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Tax not found' } }); if (error.code === 'P2002') return res.status(409).json({ error: { code: 'TAX_EXISTS', message: 'A tax with this name already exists' } }); next(error); }
});

router.delete('/:id', allowRoles('ADMIN'), async (req, res, next) => {
  try {
    if (!(await prisma.tax.findUnique({ where: { id: req.params.id }, select: { id: true } }))) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Tax not found' } });
    const usedCount = await prisma.productTax.count({ where: { taxId: req.params.id } });
    if (usedCount > 0) return res.status(409).json({ error: { code: 'TAX_IN_USE', message: 'This tax is assigned to products. Deactivate it instead.' } });
    const subscriptionLine = await prisma.$queryRaw`SELECT table_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'SubscriptionLine' AND column_name = 'taxId' LIMIT 1`;
    if (subscriptionLine.length) {
      const [{ count }] = await prisma.$queryRawUnsafe('SELECT COUNT(*)::int AS count FROM "SubscriptionLine" WHERE "taxId" = $1', req.params.id);
      if (count > 0) return res.status(409).json({ error: { code: 'TAX_IN_USE', message: 'This tax is used by a subscription. Deactivate it instead.' } });
    }
    await prisma.tax.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (error) { if (error.code === 'P2025') return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Tax not found' } }); if (error.code === 'P2003' || error.code === 'P2014') return res.status(409).json({ error: { code: 'TAX_IN_USE', message: 'This tax is assigned to products. Deactivate it instead.' } }); next(error); }
});

export default router;
