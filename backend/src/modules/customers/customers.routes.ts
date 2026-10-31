import { Router, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { requireAuth, requireRole, checkCustomerOwnership, AuthenticatedRequest } from '../../middleware/auth';
import { logAuditEvent } from '../../middleware/audit';

const router = Router();

// GET /api/customers
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // If customer role, only return their own customer record
    if (req.user?.role === 'CUSTOMER') {
      const customer = await prisma.customer.findFirst({
        where: {
          OR: [
            { userId: req.user.userId },
            { email: req.user.email },
          ],
        },
        include: {
          subscriptions: { include: { plan: true } },
          invoices: true,
          payments: true,
        },
      });
      return res.json(customer ? [customer] : []);
    }

    const { search, status } = req.query;
    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status as string;
    }

    if (search) {
      where.OR = [
        { companyName: { contains: search as string } },
        { contactName: { contains: search as string } },
        { email: { contains: search as string } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        _count: {
          select: {
            subscriptions: true,
            invoices: true,
            payments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(customers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/customers/:id
router.get('/:id', requireAuth, checkCustomerOwnership('id'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    res.json(customer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/customers (Staff or Admin)
router.post('/', requireAuth, requireRole('ADMIN', 'STAFF'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { companyName, contactName, email, phone, billingAddress, taxNumber, notes } = req.body;

    if (!companyName || !contactName || !email) {
      return res.status(400).json({ error: 'Company name, contact name, and email are required.' });
    }

    const existing = await prisma.customer.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'A customer with this email already exists.' });
    }

    const customer = await prisma.customer.create({
      data: {
        companyName,
        contactName,
        email,
        phone,
        billingAddress,
        taxNumber,
        notes,
        status: 'ACTIVE',
      },
    });

    await logAuditEvent(req, 'CUSTOMER_CREATED', 'Customer', customer.id, null, customer);

    res.status(201).json(customer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/customers/:id (Staff or Admin, or Customer editing self)
router.put('/:id', requireAuth, checkCustomerOwnership('id'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { companyName, contactName, phone, billingAddress, taxNumber, notes, status } = req.body;

    const existing = await prisma.customer.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    // Customer role cannot change customer status
    const newStatus = req.user?.role === 'CUSTOMER' ? existing.status : (status ?? existing.status);

    const updated = await prisma.customer.update({
      where: { id: req.params.id },
      data: {
        companyName: companyName ?? existing.companyName,
        contactName: contactName ?? existing.contactName,
        phone: phone ?? existing.phone,
        billingAddress: billingAddress ?? existing.billingAddress,
        taxNumber: taxNumber ?? existing.taxNumber,
        notes: notes ?? existing.notes,
        status: newStatus,
      },
    });

    await logAuditEvent(req, 'CUSTOMER_UPDATED', 'Customer', updated.id, existing, updated);

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
