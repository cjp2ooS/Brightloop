import { Router } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '../../config/db.js';
import { requireAuth, allowRoles } from '../../middleware/auth.js';
import { emailSchema, passwordSchema, parseBody } from '../auth/validation.js';

const router = Router();
router.use(requireAuth, allowRoles('ADMIN'));
const staffSchema = z.object({ name: z.string().trim().min(1).max(120), email: emailSchema, password: passwordSchema });
const activeSchema = z.object({ isActive: z.boolean() });
const safeUser = ({ id, name, email, role, isActive, createdAt }) => ({ id, name, email, role, isActive, createdAt });

router.post('/staff', async (req, res, next) => {
  try {
    const data = parseBody(staffSchema, req, res); if (!data) return;
    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({ data: { ...data, passwordHash, role: 'STAFF' } });
    res.status(201).json({ user: safeUser(user) });
  } catch (error) { if (error.code === 'P2002') return res.status(409).json({ error: { code: 'EMAIL_TAKEN', message: 'Email is already registered' } }); next(error); }
});

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const role = ['ADMIN', 'STAFF', 'CUSTOMER'].includes(req.query.role) ? req.query.role : undefined;
    const where = role ? { role } : {};
    const [items, total] = await Promise.all([prisma.user.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }), prisma.user.count({ where })]);
    res.json({ items: items.map(safeUser), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});

router.patch('/:id/active', async (req, res, next) => {
  try {
    const data = parseBody(activeSchema, req, res); if (!data) return;
    if (req.params.id === req.user.id && !data.isActive) return res.status(400).json({ error: { code: 'SELF_DEACTIVATION', message: 'You cannot deactivate your own account' } });
    const user = await prisma.user.update({ where: { id: req.params.id }, data });
    res.json({ user: safeUser(user) });
  } catch (error) { if (error.code === 'P2025') return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } }); next(error); }
});

export default router;
