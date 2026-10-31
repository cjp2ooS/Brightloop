import { Router, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { toCents, fromCents } from '../../lib/financial';
import { requireAuth, requireRole, checkCustomerOwnership, AuthenticatedRequest } from '../../middleware/auth';
import { logAuditEvent } from '../../middleware/audit';
import { format } from 'date-fns';

const router = Router();

// GET /api/payments
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { customerId, method, status } = req.query;
    const where: any = {};

    if (req.user?.role === 'CUSTOMER') {
      where.customerId = req.user.customerId;
    } else if (customerId) {
      where.customerId = customerId as string;
    }

    if (method && method !== 'ALL') {
      where.method = method as string;
    }

    if (status && status !== 'ALL') {
      where.status = status as string;
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        customer: true,
        allocations: {
          include: { invoice: true },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });

    res.json(payments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/payments/reconciliation (Reconciliation Dashboard)
router.get('/reconciliation', requireAuth, requireRole('ADMIN', 'STAFF'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const today = new Date();

    const [
      paidInvoices,
      partiallyPaidInvoices,
      unpaidInvoices,
      overdueInvoices,
      unallocatedPayments,
    ] = await Promise.all([
      prisma.invoice.findMany({
        where: { paymentStatus: 'PAID' },
        include: { customer: true },
        orderBy: { updatedAt: 'desc' },
        take: 30,
      }),
      prisma.invoice.findMany({
        where: { paymentStatus: 'PARTIALLY_PAID' },
        include: { customer: true },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.invoice.findMany({
        where: {
          paymentStatus: 'UNPAID',
          workflowStatus: 'CONFIRMED',
          dueDate: { gte: today },
        },
        include: { customer: true },
        orderBy: { dueDate: 'asc' },
      }),
      prisma.invoice.findMany({
        where: {
          paymentStatus: { in: ['UNPAID', 'PARTIALLY_PAID'] },
          workflowStatus: 'CONFIRMED',
          dueDate: { lt: today },
        },
        include: { customer: true },
        orderBy: { dueDate: 'asc' },
      }),
      prisma.payment.findMany({
        where: { unallocatedAmount: { gt: 0 }, status: { not: 'REVERSED' } },
        include: { customer: true },
        orderBy: { paymentDate: 'desc' },
      }),
    ]);

    const totalCollected = await prisma.payment.aggregate({
      where: { status: { not: 'REVERSED' } },
      _sum: { amount: true },
    });

    const totalOutstanding = await prisma.invoice.aggregate({
      where: { workflowStatus: { not: 'CANCELLED' } },
      _sum: { balanceDue: true },
    });

    res.json({
      summary: {
        totalCollected: totalCollected._sum.amount || 0,
        totalOutstanding: totalOutstanding._sum.balanceDue || 0,
        paidCount: paidInvoices.length,
        partiallyPaidCount: partiallyPaidInvoices.length,
        unpaidCount: unpaidInvoices.length,
        overdueCount: overdueInvoices.length,
        unallocatedPaymentsCount: unallocatedPayments.length,
      },
      paidInvoices,
      partiallyPaidInvoices,
      unpaidInvoices,
      overdueInvoices,
      unallocatedPayments,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/payments (Record a payment with optional immediate invoice allocation)
router.post('/', requireAuth, requireRole('ADMIN', 'STAFF'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { customerId, amount, method, transactionReference, notes, invoiceId } = req.body;

    if (!customerId || !amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Customer and positive payment amount are required.' });
    }

    const paymentAmount = parseFloat(amount);
    const paymentAmountCents = toCents(paymentAmount);
    const paymentNumber = `PAY-${format(new Date(), 'yyyyMM')}-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const payment = await prisma.$transaction(async (tx) => {
      let allocatedAmountCents = 0;
      let targetInvoice = null;

      if (invoiceId) {
        targetInvoice = await tx.invoice.findUnique({
          where: { id: invoiceId },
        });

        if (!targetInvoice) {
          throw new Error('Target invoice not found.');
        }

        const balanceDueCents = toCents(targetInvoice.balanceDue);
        if (balanceDueCents <= 0) {
          throw new Error('Target invoice is already fully paid.');
        }

        // Allocate up to the balance due or payment amount, whichever is smaller
        allocatedAmountCents = Math.min(paymentAmountCents, balanceDueCents);
      }

      const unallocatedAmountCents = paymentAmountCents - allocatedAmountCents;
      const status =
        unallocatedAmountCents === 0
          ? 'ALLOCATED'
          : allocatedAmountCents > 0
          ? 'PARTIALLY_ALLOCATED'
          : 'RECORDED';

      const p = await tx.payment.create({
        data: {
          paymentNumber,
          customerId,
          amount: fromCents(paymentAmountCents),
          paymentDate: new Date(),
          method: method || 'BANK_TRANSFER',
          transactionReference: transactionReference || null,
          notes: notes || null,
          status,
          allocatedAmount: fromCents(allocatedAmountCents),
          unallocatedAmount: fromCents(unallocatedAmountCents),
          createdById: req.user!.userId,
        },
      });

      if (targetInvoice && allocatedAmountCents > 0) {
        const allocatedAmount = fromCents(allocatedAmountCents);

        await tx.paymentAllocation.create({
          data: {
            paymentId: p.id,
            invoiceId: targetInvoice.id,
            amount: allocatedAmount,
            notes: `Allocated at payment recording`,
          },
        });

        const newPaidCents = toCents(targetInvoice.amountPaid) + allocatedAmountCents;
        const newBalanceCents = toCents(targetInvoice.totalAmount) - newPaidCents;
        const newPaymentStatus = newBalanceCents <= 0 ? 'PAID' : 'PARTIALLY_PAID';
        const newWorkflowStatus = newBalanceCents <= 0 ? 'PAID' : targetInvoice.workflowStatus;

        await tx.invoice.update({
          where: { id: targetInvoice.id },
          data: {
            amountPaid: fromCents(newPaidCents),
            balanceDue: Math.max(0, fromCents(newBalanceCents)),
            paymentStatus: newPaymentStatus,
            workflowStatus: newWorkflowStatus,
          },
        });

        if (targetInvoice.subscriptionId) {
          await tx.subscriptionEvent.create({
            data: {
              subscriptionId: targetInvoice.subscriptionId,
              eventType: 'PAYMENT_RECEIVED',
              description: `Payment ${p.paymentNumber} of ₹${allocatedAmount} applied to Invoice ${targetInvoice.invoiceNumber}. Status: ${newPaymentStatus}.`,
              metadata: JSON.stringify({ paymentId: p.id, invoiceId: targetInvoice.id, allocatedAmount }),
              actorName: req.user?.name || 'Staff User',
            },
          });
        }
      }

      return tx.payment.findUnique({
        where: { id: p.id },
        include: {
          allocations: { include: { invoice: true } },
          customer: true,
        },
      });
    });

    await logAuditEvent(req, 'PAYMENT_RECORDED', 'Payment', payment?.id, null, payment);

    res.status(201).json(payment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/payments/:id/allocate (Allocate unallocated payment balance to an invoice)
router.post('/:id/allocate', requireAuth, requireRole('ADMIN', 'STAFF'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { invoiceId, amount } = req.body;
    if (!invoiceId || !amount) {
      return res.status(400).json({ error: 'Invoice ID and allocation amount are required.' });
    }

    const allocCents = toCents(parseFloat(amount));
    if (allocCents <= 0) {
      return res.status(400).json({ error: 'Allocation amount must be greater than zero.' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({ where: { id: req.params.id } });
      if (!payment) throw new Error('Payment not found.');
      if (payment.status === 'REVERSED') throw new Error('Cannot allocate a reversed payment.');

      const unallocatedCents = toCents(payment.unallocatedAmount);
      if (allocCents > unallocatedCents) {
        throw new Error(`Allocation ₹${fromCents(allocCents)} exceeds available unallocated balance ₹${payment.unallocatedAmount}.`);
      }

      const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
      if (!invoice) throw new Error('Invoice not found.');

      const balanceCents = toCents(invoice.balanceDue);
      if (allocCents > balanceCents) {
        throw new Error(`Allocation ₹${fromCents(allocCents)} exceeds invoice balance due ₹${invoice.balanceDue}.`);
      }

      // Record allocation
      await tx.paymentAllocation.create({
        data: {
          paymentId: payment.id,
          invoiceId: invoice.id,
          amount: fromCents(allocCents),
        },
      });

      // Update payment
      const newAllocatedCents = toCents(payment.allocatedAmount) + allocCents;
      const newUnallocatedCents = unallocatedCents - allocCents;
      const newStatus = newUnallocatedCents === 0 ? 'ALLOCATED' : 'PARTIALLY_ALLOCATED';

      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          allocatedAmount: fromCents(newAllocatedCents),
          unallocatedAmount: fromCents(newUnallocatedCents),
          status: newStatus,
        },
      });

      // Update invoice
      const newInvoicePaidCents = toCents(invoice.amountPaid) + allocCents;
      const newInvoiceBalanceCents = toCents(invoice.totalAmount) - newInvoicePaidCents;
      const newPaymentStatus = newInvoiceBalanceCents <= 0 ? 'PAID' : 'PARTIALLY_PAID';
      const newWorkflowStatus = newInvoiceBalanceCents <= 0 ? 'PAID' : invoice.workflowStatus;

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid: fromCents(newInvoicePaidCents),
          balanceDue: Math.max(0, fromCents(newInvoiceBalanceCents)),
          paymentStatus: newPaymentStatus,
          workflowStatus: newWorkflowStatus,
        },
      });

      return updatedPayment;
    });

    await logAuditEvent(req, 'PAYMENT_ALLOCATED', 'Payment', updated.id, null, { invoiceId, amount });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/payments/:id/reverse (Auditable Reversal)
router.post('/:id/reverse', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reason } = req.body;

    const reversed = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: req.params.id },
        include: { allocations: { include: { invoice: true } } },
      });

      if (!payment) throw new Error('Payment not found.');
      if (payment.status === 'REVERSED') throw new Error('Payment is already reversed.');

      // Revert allocations from affected invoices
      for (const alloc of payment.allocations) {
        const inv = alloc.invoice;
        const revertCents = toCents(alloc.amount);
        const newPaidCents = Math.max(0, toCents(inv.amountPaid) - revertCents);
        const newBalanceCents = toCents(inv.totalAmount) - newPaidCents;
        const newPaymentStatus =
          newPaidCents === 0 ? 'UNPAID' : newBalanceCents > 0 ? 'PARTIALLY_PAID' : 'PAID';

        await tx.invoice.update({
          where: { id: inv.id },
          data: {
            amountPaid: fromCents(newPaidCents),
            balanceDue: fromCents(newBalanceCents),
            paymentStatus: newPaymentStatus,
            workflowStatus: inv.workflowStatus === 'PAID' ? 'CONFIRMED' : inv.workflowStatus,
          },
        });
      }

      return tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'REVERSED',
          notes: `${payment.notes || ''} [REVERSED: ${reason || 'Reversal requested'}]`,
        },
      });
    });

    await logAuditEvent(req, 'PAYMENT_REVERSED', 'Payment', reversed.id, null, { reason });

    res.json(reversed);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
