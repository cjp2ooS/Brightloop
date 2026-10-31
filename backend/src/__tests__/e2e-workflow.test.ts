import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index';
import { prisma } from '../lib/prisma';

describe('LOOPFLOW End-to-End Enterprise Scenario (PRD Section 23)', () => {
  let adminToken: string;
  let staffToken: string;
  let customerId: string;
  let createdProductId: string;
  let createdVariantId: string;
  let createdPlanId: string;
  let createdQuotationId: string;
  let createdSubscriptionId: string;
  let createdInvoiceId: string;

  it('Step 0: Authenticate Admin & Staff accounts', async () => {
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@brightloop.io', password: 'Admin@Brightloop123!' });

    expect(adminRes.status).toBe(200);
    expect(adminRes.body.token).toBeDefined();
    adminToken = adminRes.body.token;

    const staffRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sarah.ops@brightloop.io', password: 'Staff@Brightloop123!' });

    expect(staffRes.status).toBe(200);
    staffToken = staffRes.body.token;

    const cust = await prisma.customer.findFirst();
    expect(cust).not.toBeNull();
    customerId = cust!.id;
  });

  it('Step 1: Admin creates Business Management Software (Base ₹2,000, Odoo ₹560)', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'E2E Business Management Software',
        productType: 'SOFTWARE',
        salesPrice: 2000,
        costPrice: 650,
        variants: [
          { name: 'Standard', additionalPrice: 0 },
          { name: 'Odoo', additionalPrice: 560 },
          { name: 'Enterprise', additionalPrice: 1200 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.salesPrice).toBe(2000);
    expect(res.body.variants.length).toBe(3);

    createdProductId = res.body.id;
    const odoo = res.body.variants.find((v: any) => v.name === 'Odoo');
    expect(odoo.additionalPrice).toBe(560);
    createdVariantId = odoo.id;
  });

  it('Step 2: Admin creates Business Pro Plan (Monthly, Renewal Enabled)', async () => {
    const res = await request(app)
      .post('/api/plans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'E2E Business Pro',
        billingAmount: 2560,
        billingInterval: 'MONTHLY',
        allowRenewal: true,
        productIds: [createdProductId],
      });

    expect(res.status).toBe(201);
    expect(res.body.billingInterval).toBe('MONTHLY');
    expect(res.body.allowRenewal).toBe(true);
    createdPlanId = res.body.id;
  });

  it('Step 3: Staff creates Quotation (Qty 3, Odoo variant, 10% discount)', async () => {
    const res = await request(app)
      .post('/api/quotations')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        customerId,
        planId: createdPlanId,
        paymentTerms: 'NET_30',
        items: [
          {
            productId: createdProductId,
            variantId: createdVariantId,
            unitPrice: 2000,
            variantPrice: 560,
            quantity: 3,
            discountPercentage: 10,
          },
        ],
      });

    expect(res.status).toBe(201);
    // Subtotal: (2000+560)*3 = 7680
    expect(res.body.subtotal).toBe(7680);
    // Discount 10%: 768
    expect(res.body.discountTotal).toBe(768);
    // Taxable: 6912, GST 18%: 1244.16, Total: 8156.16
    expect(res.body.taxTotal).toBe(1244.16);
    expect(res.body.totalAmount).toBe(8156.16);
    expect(res.body.status).toBe('QUOTATION');

    createdQuotationId = res.body.id;
  });

  it('Step 4: Confirm Quotation and Convert into Active Subscription', async () => {
    // Confirm
    const confRes = await request(app)
      .post(`/api/quotations/${createdQuotationId}/confirm`)
      .set('Authorization', `Bearer ${staffToken}`);
    expect(confRes.status).toBe(200);
    expect(confRes.body.status).toBe('CONFIRMED');

    // Convert
    const convRes = await request(app)
      .post(`/api/quotations/${createdQuotationId}/convert`)
      .set('Authorization', `Bearer ${staffToken}`);

    expect(convRes.status).toBe(201);
    expect(convRes.body.subscription.status).toBe('ACTIVE');
    expect(convRes.body.subscription.totalAmount).toBe(8156.16);

    createdSubscriptionId = convRes.body.subscription.id;

    // Test duplicate conversion prevention
    const dupRes = await request(app)
      .post(`/api/quotations/${createdQuotationId}/convert`)
      .set('Authorization', `Bearer ${staffToken}`);
    expect(dupRes.status).toBe(400);
    expect(dupRes.body.error).toContain('Duplicate conversion prevented');
  });

  it('Step 5 & 6: Trigger Billing Engine & Duplicate Prevention Idempotency', async () => {
    // Force due
    await request(app)
      .post(`/api/subscriptions/${createdSubscriptionId}/make-due`)
      .set('Authorization', `Bearer ${staffToken}`);

    // Trigger billing
    const billRes = await request(app)
      .post('/api/billing/trigger')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ subscriptionId: createdSubscriptionId });

    expect(billRes.status).toBe(200);
    const detail = billRes.body.result.details.find((d: any) => d.subscriptionId === createdSubscriptionId);
    expect(detail.status).toBe('SUCCESS');
    expect(detail.invoiceNumber).toBeDefined();

    const inv = await prisma.invoice.findFirst({
      where: { subscriptionId: createdSubscriptionId },
    });
    expect(inv).not.toBeNull();
    expect(inv!.totalAmount).toBe(8156.16);
    createdInvoiceId = inv!.id;

    // Trigger duplicate run immediately: Must be skipped and produce 0 duplicate invoices!
    const dupBillRes = await request(app)
      .post('/api/billing/trigger')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ subscriptionId: createdSubscriptionId });

    expect(dupBillRes.status).toBe(200);
    const dupDetail = dupBillRes.body.result.details.find((d: any) => d.subscriptionId === createdSubscriptionId);
    expect(dupDetail.status).toBe('SKIPPED');
  });

  it('Step 7: Partial Payment (₹4,000) & Remaining Payment to mark PAID', async () => {
    // Partial payment of ₹4,000
    const p1Res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        customerId,
        invoiceId: createdInvoiceId,
        amount: 4000,
        method: 'BANK_TRANSFER',
      });

    expect(p1Res.status).toBe(201);
    const invAfterP1 = await prisma.invoice.findUnique({ where: { id: createdInvoiceId } });
    expect(invAfterP1!.amountPaid).toBe(4000);
    expect(invAfterP1!.balanceDue).toBe(4156.16);
    expect(invAfterP1!.paymentStatus).toBe('PARTIALLY_PAID');

    // Remaining payment of ₹4,156.16
    const p2Res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        customerId,
        invoiceId: createdInvoiceId,
        amount: 4156.16,
        method: 'UPI',
      });

    expect(p2Res.status).toBe(201);
    const invFinal = await prisma.invoice.findUnique({ where: { id: createdInvoiceId } });
    expect(invFinal!.amountPaid).toBe(8156.16);
    expect(invFinal!.balanceDue).toBe(0);
    expect(invFinal!.paymentStatus).toBe('PAID');
    expect(invFinal!.workflowStatus).toBe('PAID');
  });

  it('Step 8 & 9: Verify Financial Dashboard & Control Centre Data Integrity', async () => {
    const dashRes = await request(app)
      .get('/api/analytics/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(dashRes.status).toBe(200);
    expect(dashRes.body.kpis.mrr).toBeGreaterThan(0);
    expect(dashRes.body.kpis.revenueCollected).toBeGreaterThan(0);

    const ctrlRes = await request(app)
      .get('/api/billing/control-center')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(ctrlRes.status).toBe(200);
    expect(ctrlRes.body.invoiceMetrics).toBeDefined();
  });
});
