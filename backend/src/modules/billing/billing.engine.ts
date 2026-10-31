import { prisma } from '../../lib/prisma';
import { calculateLineItem, calculateOrderTotals } from '../../lib/financial';
import { calculateNextBillingDate, getBillingPeriodKey } from '../../lib/billing-date';
import { format } from 'date-fns';

export interface BillingRunResult {
  runId: string;
  runNumber: string;
  status: 'COMPLETED' | 'FAILED' | 'PARTIALLY_FAILED';
  processedCount: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  details: Array<{
    subscriptionId: string;
    subscriptionNumber: string;
    customerName: string;
    status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
    invoiceNumber?: string;
    amount?: number;
    reason?: string;
  }>;
}

/**
 * Core Autonomous Recurring Billing Engine
 * Idempotent, transaction-safe, calendar-aware recurring billing processor.
 */
export class BillingEngine {
  private static isProcessing = false;

  public static async executeBillingRun(
    triggerType: 'SCHEDULED' | 'MANUAL' | 'RETRY' = 'MANUAL',
    asOfDate: Date = new Date(),
    targetSubscriptionId?: string
  ): Promise<BillingRunResult> {
    if (this.isProcessing) {
      throw new Error('A billing run is currently in progress. Please wait for completion.');
    }

    this.isProcessing = true;
    const runNumber = `RUN-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;

    const billingRun = await prisma.billingRun.create({
      data: {
        runNumber,
        status: 'RUNNING',
        triggerType,
        startedAt: new Date(),
      },
    });

    const results: BillingRunResult['details'] = [];
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    try {
      let dueSubscriptions: any[] = [];

      if (targetSubscriptionId) {
        const sub = await prisma.subscription.findUnique({
          where: { id: targetSubscriptionId },
          include: { customer: true, plan: true, items: true },
        });

        if (sub) {
          if (new Date(sub.nextBillingDate) > asOfDate) {
            skippedCount++;
            results.push({
              subscriptionId: sub.id,
              subscriptionNumber: sub.subscriptionNumber,
              customerName: sub.customer.companyName,
              status: 'SKIPPED',
              reason: `Subscription is not due for billing (next billing date: ${format(new Date(sub.nextBillingDate), 'yyyy-MM-dd')}). Duplicate billing prevented.`,
            });
          } else {
            dueSubscriptions = [sub];
          }
        }
      } else {
        dueSubscriptions = await prisma.subscription.findMany({
          where: {
            status: 'ACTIVE',
            nextBillingDate: { lte: asOfDate },
          },
          include: {
            customer: true,
            plan: true,
            items: true,
          },
        });
      }

      for (const sub of dueSubscriptions) {
        try {
          // 2. Validate expiration & renewal rules
          if (sub.expiryDate && new Date(sub.expiryDate) < asOfDate) {
            if (!sub.allowRenewal) {
              await prisma.subscription.update({
                where: { id: sub.id },
                data: { status: 'EXPIRED' },
              });
              await prisma.subscriptionEvent.create({
                data: {
                  subscriptionId: sub.id,
                  eventType: 'EXPIRED',
                  description: 'Subscription expired and renewal is disabled.',
                },
              });
              skippedCount++;
              results.push({
                subscriptionId: sub.id,
                subscriptionNumber: sub.subscriptionNumber,
                customerName: sub.customer.companyName,
                status: 'SKIPPED',
                reason: 'Subscription expired (renewals disabled). Status set to EXPIRED.',
              });
              continue;
            }
          }

          // 3. Compute billing period
          const periodStart = sub.lastBilledDate ? new Date(sub.lastBilledDate) : new Date(sub.startDate);
          const periodEnd = new Date(sub.nextBillingDate);
          const billingKey = getBillingPeriodKey(periodStart, periodEnd);

          // 4. Duplicate prevention check (idempotency key check)
          const existingInvoice = await prisma.invoice.findFirst({
            where: {
              subscriptionId: sub.id,
              billingPeriodKey: billingKey,
            },
          });

          if (existingInvoice) {
            skippedCount++;
            results.push({
              subscriptionId: sub.id,
              subscriptionNumber: sub.subscriptionNumber,
              customerName: sub.customer.companyName,
              status: 'SKIPPED',
              reason: `Already billed for period ${billingKey}. Invoice: ${existingInvoice.invoiceNumber}`,
            });
            continue;
          }

          // 5. Calculate line items with snapshot pricing, active tax and discounts
          const taxes = await prisma.tax.findMany({
            where: { status: 'ACTIVE' },
          });
          const activeTax = taxes.length > 0 ? taxes[0] : null;

          const calculatedItems = sub.items.map((item: any) => {
            return calculateLineItem({
              basePrice: item.unitPrice,
              variantPrice: item.variantPrice,
              quantity: item.quantity,
              discountFixed: item.discountAmount,
              taxPercentage: activeTax ? activeTax.percentage : 0,
              isTaxInclusive: activeTax ? activeTax.isInclusive : false,
            });
          });

          const totals = calculateOrderTotals(calculatedItems);
          const invoiceNumber = `INV-${format(new Date(), 'yyyyMM')}-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 15);

          const nextBilling = calculateNextBillingDate(sub.nextBillingDate, sub.billingInterval);

          // 6. Atomic database transaction for invoice creation & subscription advance
          const createdInvoice = await prisma.$transaction(async (tx) => {
            const inv = await tx.invoice.create({
              data: {
                invoiceNumber,
                customerId: sub.customerId,
                subscriptionId: sub.id,
                billingRunId: billingRun.id,
                billingPeriodKey: billingKey,
                invoiceDate: new Date(),
                dueDate,
                billingPeriodStart: periodStart,
                billingPeriodEnd: periodEnd,
                workflowStatus: 'CONFIRMED',
                paymentStatus: 'UNPAID',
                subtotal: totals.subtotal,
                discountTotal: totals.discountTotal,
                taxTotal: totals.taxTotal,
                totalAmount: totals.totalAmount,
                amountPaid: 0,
                balanceDue: totals.totalAmount,
                calculationSnapshot: JSON.stringify({
                  items: calculatedItems,
                  totals,
                  appliedTax: activeTax,
                  billingInterval: sub.billingInterval,
                }),
                notes: `Auto-generated recurring invoice for period ${billingKey}. Plan: ${sub.plan.name}`,
                items: {
                  create: sub.items.map((it: any, idx: number) => ({
                    productId: it.productId,
                    productName: it.productName,
                    variantId: it.variantId,
                    variantName: it.variantName,
                    quantity: it.quantity,
                    unitPrice: it.unitPrice,
                    variantPrice: it.variantPrice,
                    discountAmount: calculatedItems[idx].discountAmount,
                    taxAmount: calculatedItems[idx].taxAmount,
                    lineTotal: calculatedItems[idx].lineTotal,
                  })),
                },
              },
            });

            // Advance subscription dates
            await tx.subscription.update({
              where: { id: sub.id },
              data: {
                lastBilledDate: sub.nextBillingDate,
                nextBillingDate: nextBilling,
              },
            });

            // Record subscription timeline event
            await tx.subscriptionEvent.create({
              data: {
                subscriptionId: sub.id,
                eventType: 'INVOICE_GENERATED',
                description: `Invoice ${inv.invoiceNumber} generated for amount ₹${totals.totalAmount}. Next billing: ${format(nextBilling, 'yyyy-MM-dd')}`,
                metadata: JSON.stringify({ invoiceId: inv.id, invoiceNumber: inv.invoiceNumber }),
                actorName: 'LOOPFLOW Billing Engine',
              },
            });

            // Record billing attempt
            await tx.billingAttempt.create({
              data: {
                billingRunId: billingRun.id,
                subscriptionId: sub.id,
                invoiceId: inv.id,
                status: 'SUCCESS',
              },
            });

            // Queue notification
            await tx.notification.create({
              data: {
                customerId: sub.customerId,
                type: 'INVOICE_ISSUED',
                subject: `New Invoice ${inv.invoiceNumber} from Brightloop Software`,
                body: `Your subscription invoice for ₹${totals.totalAmount} has been generated. Due date: ${format(dueDate, 'yyyy-MM-dd')}.`,
                status: 'SENT',
                sentAt: new Date(),
              },
            });

            return inv;
          });

          successCount++;
          results.push({
            subscriptionId: sub.id,
            subscriptionNumber: sub.subscriptionNumber,
            customerName: sub.customer.companyName,
            status: 'SUCCESS',
            invoiceNumber: createdInvoice.invoiceNumber,
            amount: createdInvoice.totalAmount,
          });
        } catch (subErr: any) {
          failedCount++;
          const errorMsg = subErr?.message || 'Unknown billing processing error';

          await prisma.billingAttempt.create({
            data: {
              billingRunId: billingRun.id,
              subscriptionId: sub.id,
              status: 'FAILED',
              errorMessage: errorMsg,
            },
          });

          results.push({
            subscriptionId: sub.id,
            subscriptionNumber: sub.subscriptionNumber,
            customerName: sub.customer.companyName,
            status: 'FAILED',
            reason: errorMsg,
          });
        }
      }

      const totalItems = dueSubscriptions.length + skippedCount;
      const finalStatus =
        failedCount === 0 ? 'COMPLETED' : successCount > 0 ? 'PARTIALLY_FAILED' : 'FAILED';

      await prisma.billingRun.update({
        where: { id: billingRun.id },
        data: {
          status: finalStatus,
          completedAt: new Date(),
          processedCount: totalItems,
          successCount,
          failedCount,
          skippedCount,
          logs: JSON.stringify(results),
        },
      });

      return {
        runId: billingRun.id,
        runNumber: billingRun.runNumber,
        status: finalStatus,
        processedCount: totalItems,
        successCount,
        failedCount,
        skippedCount,
        details: results,
      };
    } finally {
      this.isProcessing = false;
    }
  }

  public static async retryAttempt(attemptId: string): Promise<{ success: boolean; message: string }> {
    const attempt = await prisma.billingAttempt.findUnique({
      where: { id: attemptId },
      include: { subscription: true },
    });

    if (!attempt) {
      throw new Error('Billing attempt record not found.');
    }

    if (attempt.status === 'SUCCESS') {
      return { success: true, message: 'This billing attempt was already successful.' };
    }

    const runResult = await this.executeBillingRun('RETRY', new Date(), attempt.subscriptionId);
    const detail = runResult.details.find((d) => d.subscriptionId === attempt.subscriptionId);

    if (detail && detail.status === 'SUCCESS') {
      await prisma.billingAttempt.update({
        where: { id: attempt.id },
        data: {
          retryCount: { increment: 1 },
          status: 'SUCCESS',
          errorMessage: null,
        },
      });
      return { success: true, message: `Successfully retried. Invoice generated: ${detail.invoiceNumber}` };
    } else {
      await prisma.billingAttempt.update({
        where: { id: attempt.id },
        data: {
          retryCount: { increment: 1 },
          errorMessage: detail?.reason || 'Retry failed again',
        },
      });
      return { success: false, message: detail?.reason || 'Retry failed.' };
    }
  }
}
