import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/db.js';
import { requireAuth, allowRoles } from '../../middleware/auth.js';
import { emailSchema, parseBody } from '../auth/validation.js';

const router = Router();
router.use(requireAuth, allowRoles('ADMIN', 'STAFF'));
const customerSchema = z.object({ name: z.string().trim().min(1).max(160), email: emailSchema, company: z.string().trim().max(160).optional().nullable(), phone: z.string().trim().max(40).optional().nullable() });

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const q = String(req.query.q || '').trim();
    const where = q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }, { company: { contains: q, mode: 'insensitive' } }] } : {};
    const [items, total] = await Promise.all([prisma.customer.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }), prisma.customer.count({ where })]);
    res.json({ items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try { const data = parseBody(customerSchema, req, res); if (!data) return; res.status(201).json({ customer: await prisma.customer.create({ data }) }); }
  catch (error) { if (error.code === 'P2002') return res.status(409).json({ error: { code: 'EMAIL_TAKEN', message: 'A customer with this email already exists' } }); next(error); }
});

router.get('/:id', async (req, res, next) => {
  try { const customer = await prisma.customer.findUnique({ where: { id: req.params.id } }); if (!customer) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Customer not found' } }); res.json({ customer }); }
  catch (error) { next(error); }
});

router.patch('/:id', async (req, res, next) => {
  try { const data = parseBody(customerSchema.partial(), req, res); if (!data) return; res.json({ customer: await prisma.customer.update({ where: { id: req.params.id }, data }) }); }
  catch (error) { if (error.code === 'P2025') return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Customer not found' } }); if (error.code === 'P2002') return res.status(409).json({ error: { code: 'EMAIL_TAKEN', message: 'A customer with this email already exists' } }); next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try { await prisma.customer.delete({ where: { id: req.params.id } }); res.status(204).end(); }
  catch (error) { if (error.code === 'P2025') return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Customer not found' } }); if (error.code === 'P2003' || error.code === 'P2014') return res.status(409).json({ error: { code: 'CUSTOMER_HAS_SUBSCRIPTIONS', message: 'Customer with subscriptions cannot be deleted' } }); next(error); }
});

export default router;
