import { Router, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { generateInvoicePdf } from '../../lib/pdf';
import { requireAuth, requireRole, checkCustomerOwnership, AuthenticatedRequest } from '../../middleware/auth';
import { logAuditEvent } from '../../middleware/audit';
import { format } from 'date-fns';

const router = Router();

// GET /api/invoices
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { workflowStatus, paymentStatus, customerId, search } = req.query;
    const where: any = {};

    if (req.user?.role === 'CUSTOMER') {
      where.customerId = req.user.customerId;
    } else if (customerId) {
      where.customerId = customerId as string;
    }

    if (workflowStatus && workflowStatus !== 'ALL') {
      where.workflowStatus = workflowStatus as string;
    }

    if (paymentStatus && paymentStatus !== 'ALL') {
      where.paymentStatus = paymentStatus as string;
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search as string } },
        { customer: { companyName: { contains: search as string } } },
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        customer: true,
        subscription: { include: { plan: true } },
        items: true,
      },
      orderBy: { invoiceDate: 'desc' },
    });

    res.json(invoices);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/invoices/:id
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        subscription: { include: { plan: true } },
        items: true,
        paymentAllocations: {
          include: { payment: true },
          orderBy: { allocatedAt: 'desc' },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    if (req.user?.role === 'CUSTOMER' && invoice.customerId !== req.user.customerId) {
      return res.status(403).json({ error: 'Unauthorized to view this invoice.' });
    }

    res.json(invoice);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/invoices/:id/pdf (Download PDF)
router.get('/:id/pdf', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        subscription: true,
        items: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    if (req.user?.role === 'CUSTOMER' && invoice.customerId !== req.user.customerId) {
      return res.status(403).json({ error: 'Unauthorized to download this invoice.' });
    }

    const pdfBuffer = await generateInvoicePdf({
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: format(invoice.invoiceDate, 'yyyy-MM-dd'),
      dueDate: format(invoice.dueDate, 'yyyy-MM-dd'),
      billingPeriod: invoice.billingPeriodKey || undefined,
      paymentTerms: invoice.subscription?.paymentTerms || 'NET_30',
      workflowStatus: invoice.workflowStatus,
      paymentStatus: invoice.paymentStatus,
      customer: {
        companyName: invoice.customer.companyName,
        contactName: invoice.customer.contactName,
        email: invoice.customer.email,
        billingAddress: invoice.customer.billingAddress,
        taxNumber: invoice.customer.taxNumber,
      },
      items: invoice.items,
      subtotal: invoice.subtotal,
      discountTotal: invoice.discountTotal,
      taxTotal: invoice.taxTotal,
      totalAmount: invoice.totalAmount,
      amountPaid: invoice.amountPaid,
      balanceDue: invoice.balanceDue,
      notes: invoice.notes,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/invoices/:id/explanation (PRD Feature: Invoice Explanation Breakdown)
router.get('/:id/explanation', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        items: true,
        subscription: { include: { plan: true } },
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    let snapshot: any = null;
    if (invoice.calculationSnapshot) {
      try {
        snapshot = JSON.parse(invoice.calculationSnapshot);
      } catch (e) {}
    }

    res.json({
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customer.companyName,
      billingPeriod: invoice.billingPeriodKey,
      planName: invoice.subscription?.plan?.name || 'Standard Plan',
      subtotal: invoice.subtotal,
      discountTotal: invoice.discountTotal,
      taxTotal: invoice.taxTotal,
      totalAmount: invoice.totalAmount,
      amountPaid: invoice.amountPaid,
      balanceDue: invoice.balanceDue,
      items: invoice.items.map((it) => ({
        productName: it.productName,
        variantName: it.variantName,
        basePrice: it.unitPrice,
        variantPrice: it.variantPrice,
        unitFinalPrice: it.unitPrice + it.variantPrice,
        quantity: it.quantity,
        lineSubtotal: (it.unitPrice + it.variantPrice) * it.quantity,
        discount: it.discountAmount,
        taxable: ((it.unitPrice + it.variantPrice) * it.quantity) - it.discountAmount,
        tax: it.taxAmount,
        lineTotal: it.lineTotal,
      })),
      snapshot,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/invoices/:id/confirm (Staff or Admin)
router.post('/:id/confirm', requireAuth, requireRole('ADMIN', 'STAFF'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const existing = await prisma.invoice.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    const updated = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { workflowStatus: 'CONFIRMED' },
    });

    await logAuditEvent(req, 'INVOICE_CONFIRMED', 'Invoice', updated.id, existing, updated);

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/invoices/:id/cancel (Staff or Admin)
router.post('/:id/cancel', requireAuth, requireRole('ADMIN', 'STAFF'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const existing = await prisma.invoice.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    if (existing.amountPaid > 0) {
      return res.status(400).json({ error: 'Cannot cancel an invoice with recorded payments. Reverse payments first.' });
    }

    const updated = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { workflowStatus: 'CANCELLED' },
    });

    await logAuditEvent(req, 'INVOICE_CANCELLED', 'Invoice', updated.id, existing, updated);

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
