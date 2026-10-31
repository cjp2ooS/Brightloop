import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/db.js';
import { requireAuth, allowRoles } from '../../middleware/auth.js';
import { parseBody } from '../auth/validation.js';

const router = Router();
const productSchema = z.object({
  name: z.string().trim().min(1).max(160),
  type: z.string().trim().min(1).max(60),
  salesPrice: z.number().int().nonnegative().safe(),
  costPrice: z.number().int().nonnegative().safe(),
  notes: z.string().max(4000).nullable().optional(),
  isActive: z.boolean().optional(),
});
const variantSchema = z.object({ attribute: z.string().trim().min(1).max(80), value: z.string().trim().min(1).max(120), extraPrice: z.number().int().safe() });
const taxAssignmentSchema = z.object({ taxIds: z.array(z.string().min(1)).max(200) });
const productInclude = { variants: { orderBy: [{ attribute: 'asc' }, { value: 'asc' }] }, productTaxes: { include: { tax: true } } };
const withTaxes = (product) => product && ({ ...product, taxes: product.productTaxes.map(({ tax }) => tax), productTaxes: undefined });
const isDuplicate = (error) => error.code === 'P2002';

router.use(requireAuth);
router.get('/', allowRoles('ADMIN', 'STAFF'), async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const where = {};
    const q = String(req.query.q || '').trim();
    if (q) where.OR = [{ name: { contains: q, mode: 'insensitive' } }, { notes: { contains: q, mode: 'insensitive' } }];
    if (req.query.type) where.type = String(req.query.type);
    if (req.query.active === 'true' || req.query.active === 'false') where.isActive = req.query.active === 'true';
    const [items, total] = await Promise.all([
      prisma.product.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' }, include: productInclude }),
      prisma.product.count({ where }),
    ]);
    res.json({ items: items.map(withTaxes), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});

router.get('/:id/price', allowRoles('ADMIN', 'STAFF'), async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id }, select: { id: true, salesPrice: true, variants: { select: { id: true, extraPrice: true } } } });
    if (!product) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found' } });
    const variantId = req.query.variantId;
    if (variantId && !product.variants.some((variant) => variant.id === variantId)) return res.status(404).json({ error: { code: 'VARIANT_NOT_FOUND', message: 'Variant not found for this product' } });
    const extraPrice = variantId ? product.variants.find((variant) => variant.id === variantId).extraPrice : 0;
    res.json({ unitPrice: product.salesPrice + extraPrice });
  } catch (error) { next(error); }
});

router.get('/:id', allowRoles('ADMIN', 'STAFF'), async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id }, include: productInclude });
    if (!product) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found' } });
    res.json({ product: withTaxes(product) });
  } catch (error) { next(error); }
});

router.post('/', allowRoles('ADMIN'), async (req, res, next) => {
  try {
    const data = parseBody(productSchema, req, res); if (!data) return;
    const product = await prisma.product.create({ data: { ...data, isActive: data.isActive ?? true } });
    res.status(201).json({ product });
  } catch (error) { next(error); }
});

router.patch('/:id', allowRoles('ADMIN'), async (req, res, next) => {
  try {
    const data = parseBody(productSchema.partial(), req, res); if (!data) return;
    const product = await prisma.product.update({ where: { id: req.params.id }, data });
    res.json({ product });
  } catch (error) { if (error.code === 'P2025') return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found' } }); next(error); }
});

router.delete('/:id', allowRoles('ADMIN'), async (req, res, next) => {
  try {
    const existing = await prisma.product.findUnique({ where: { id: req.params.id }, select: { id: true } });
    if (!existing) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found' } });

    // SubscriptionLine is owned by the subscriptions module. Check for its standard Prisma table
    // shape without coupling this module to its model or exposing its data.
    const lineTable = await prisma.$queryRaw`SELECT table_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'SubscriptionLine' AND column_name = 'productId' LIMIT 1`;
    if (lineTable.length) {
      const [{ count }] = await prisma.$queryRawUnsafe('SELECT COUNT(*)::int AS count FROM "SubscriptionLine" WHERE "productId" = $1', req.params.id);
      if (count > 0) {
        const product = await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } });
        return res.json({ product, deleted: false, softDeleted: true });
      }
    }
    try {
      await prisma.product.delete({ where: { id: req.params.id } });
      res.status(204).end();
    } catch (error) {
      if (error.code === 'P2003' || error.code === 'P2014') {
        const product = await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } });
        return res.json({ product, deleted: false, softDeleted: true });
      }
      throw error;
    }
  } catch (error) { next(error); }
});

router.post('/:id/variants', allowRoles('ADMIN'), async (req, res, next) => {
  try {
    const data = parseBody(variantSchema, req, res); if (!data) return;
    if (!(await prisma.product.findUnique({ where: { id: req.params.id }, select: { id: true } }))) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found' } });
    const variant = await prisma.productVariant.create({ data: { ...data, productId: req.params.id } });
    res.status(201).json({ variant });
  } catch (error) { if (isDuplicate(error)) return res.status(409).json({ error: { code: 'VARIANT_EXISTS', message: 'This attribute and value already exist for the product' } }); next(error); }
});

router.patch('/:id/variants/:variantId', allowRoles('ADMIN'), async (req, res, next) => {
  try {
    const data = parseBody(variantSchema.partial(), req, res); if (!data) return;
    const updated = await prisma.productVariant.updateMany({ where: { id: req.params.variantId, productId: req.params.id }, data });
    if (!updated.count) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Variant not found' } });
    const variant = await prisma.productVariant.findUnique({ where: { id: req.params.variantId } });
    res.json({ variant });
  } catch (error) { if (isDuplicate(error)) return res.status(409).json({ error: { code: 'VARIANT_EXISTS', message: 'This attribute and value already exist for the product' } }); next(error); }
});

router.delete('/:id/variants/:variantId', allowRoles('ADMIN'), async (req, res, next) => {
  try {
    const deleted = await prisma.productVariant.deleteMany({ where: { id: req.params.variantId, productId: req.params.id } });
    if (!deleted.count) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Variant not found' } });
    res.status(204).end();
  } catch (error) { next(error); }
});

router.put('/:id/taxes', allowRoles('ADMIN'), async (req, res, next) => {
  try {
    const data = parseBody(taxAssignmentSchema, req, res); if (!data) return;
    if (!(await prisma.product.findUnique({ where: { id: req.params.id }, select: { id: true } }))) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found' } });
    const taxIds = [...new Set(data.taxIds)];
    const found = await prisma.tax.count({ where: { id: { in: taxIds } } });
    if (found !== taxIds.length) return res.status(400).json({ error: { code: 'INVALID_TAX', message: 'One or more tax IDs do not exist' } });
    await prisma.$transaction(async (tx) => {
      await tx.productTax.deleteMany({ where: { productId: req.params.id } });
      if (taxIds.length) await tx.productTax.createMany({ data: taxIds.map((taxId) => ({ productId: req.params.id, taxId })) });
    });
    const product = await prisma.product.findUnique({ where: { id: req.params.id }, include: productInclude });
    res.json({ taxes: product.productTaxes.map(({ tax }) => tax) });
  } catch (error) { next(error); }
});

export default router;
