import { Router, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { requireAuth, requireRole, AuthenticatedRequest } from '../../middleware/auth';
import { logAuditEvent } from '../../middleware/audit';

const router = Router();

// GET /api/products (All active or query all for admin)
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, search } = req.query;
    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status as string;
    }
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { description: { contains: search as string } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        variants: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/products/:id
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { variants: true },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    res.json(product);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/products (Admin only)
router.post('/', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, productType, description, salesPrice, costPrice, notes, variants } = req.body;

    if (!name || salesPrice === undefined) {
      return res.status(400).json({ error: 'Product name and sales price are required.' });
    }

    const product = await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: {
          name,
          productType: productType || 'SERVICE',
          description,
          salesPrice: parseFloat(salesPrice),
          costPrice: costPrice ? parseFloat(costPrice) : 0,
          notes,
          status: 'ACTIVE',
        },
      });

      if (variants && Array.isArray(variants)) {
        for (const v of variants) {
          if (v.name) {
            await tx.productVariant.create({
              data: {
                productId: p.id,
                name: v.name,
                additionalPrice: v.additionalPrice ? parseFloat(v.additionalPrice) : 0,
                sku: v.sku || null,
                status: 'ACTIVE',
              },
            });
          }
        }
      }

      return tx.product.findUnique({
        where: { id: p.id },
        include: { variants: true },
      });
    });

    await logAuditEvent(req, 'PRODUCT_CREATED', 'Product', product?.id, null, product);

    res.status(201).json(product);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/products/:id (Admin only)
router.put('/:id', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, productType, description, salesPrice, costPrice, notes, status } = req.body;
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });

    if (!existing) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        name: name !== undefined ? name : existing.name,
        productType: productType !== undefined ? productType : existing.productType,
        description: description !== undefined ? description : existing.description,
        salesPrice: salesPrice !== undefined ? parseFloat(salesPrice) : existing.salesPrice,
        costPrice: costPrice !== undefined ? parseFloat(costPrice) : existing.costPrice,
        notes: notes !== undefined ? notes : existing.notes,
        status: status !== undefined ? status : existing.status,
      },
      include: { variants: true },
    });

    await logAuditEvent(req, 'PRODUCT_UPDATED', 'Product', updated.id, existing, updated);

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/products/:id/variants (Admin only)
router.post('/:id/variants', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, additionalPrice, sku } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Variant name is required.' });
    }

    const variant = await prisma.productVariant.create({
      data: {
        productId: req.params.id,
        name,
        additionalPrice: additionalPrice ? parseFloat(additionalPrice) : 0,
        sku: sku || null,
        status: 'ACTIVE',
      },
    });

    await logAuditEvent(req, 'VARIANT_CREATED', 'ProductVariant', variant.id, null, variant);

    res.status(201).json(variant);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/products/variants/:variantId (Admin only)
router.put('/variants/:variantId', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, additionalPrice, sku, status } = req.body;
    const existing = await prisma.productVariant.findUnique({ where: { id: req.params.variantId } });

    if (!existing) {
      return res.status(404).json({ error: 'Variant not found.' });
    }

    const updated = await prisma.productVariant.update({
      where: { id: req.params.variantId },
      data: {
        name: name !== undefined ? name : existing.name,
        additionalPrice: additionalPrice !== undefined ? parseFloat(additionalPrice) : existing.additionalPrice,
        sku: sku !== undefined ? sku : existing.sku,
        status: status !== undefined ? status : existing.status,
      },
    });

    await logAuditEvent(req, 'VARIANT_UPDATED', 'ProductVariant', updated.id, existing, updated);

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
