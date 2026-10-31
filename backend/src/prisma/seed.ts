import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { addDays, subDays, addMonths, subMonths, format } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting LOOPFLOW Comprehensive Enterprise Database Seeding...');

  // Clear existing records
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.paymentAllocation.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.billingAttempt.deleteMany();
  await prisma.billingRun.deleteMany();
  await prisma.discountRedemption.deleteMany();
  await prisma.discount.deleteMany();
  await prisma.tax.deleteMany();
  await prisma.subscriptionEvent.deleteMany();
  await prisma.subscriptionItem.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.quotationItem.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.quotationTemplateItem.deleteMany();
  await prisma.quotationTemplate.deleteMany();
  await prisma.planProduct.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.staffProfile.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany();

  const salt = 10;
  const adminHash = await bcrypt.hash('Admin@Brightloop123!', salt);
  const staffHash = await bcrypt.hash('Staff@Brightloop123!', salt);
  const customerHash = await bcrypt.hash('Customer@Loopflow123!', salt);

  // 1. Admin Account
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@brightloop.io',
      name: 'Victoria Vance (Chief Product Officer)',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  });

  // 2. Three Staff Accounts
  const staff1 = await prisma.user.create({
    data: {
      email: 'sarah.ops@brightloop.io',
      name: 'Sarah Connor (Senior Operations)',
      passwordHash: staffHash,
      role: 'STAFF',
      staffProfile: {
        create: {
          department: 'Operations',
          title: 'Subscription Operations Lead',
        },
      },
    },
  });

  const staff2 = await prisma.user.create({
    data: {
      email: 'david.billing@brightloop.io',
      name: 'David Miller (Billing Specialist)',
      passwordHash: staffHash,
      role: 'STAFF',
      staffProfile: {
        create: {
          department: 'Finance & Billing',
          title: 'Billing Analyst',
        },
      },
    },
  });

  const staff3 = await prisma.user.create({
    data: {
      email: 'elena.support@brightloop.io',
      name: 'Elena Rostova (Account Manager)',
      passwordHash: staffHash,
      role: 'STAFF',
      staffProfile: {
        create: {
          department: 'Customer Success',
          title: 'Senior Account Manager',
        },
      },
    },
  });

  // 3. Tax Rules
  const gst18 = await prisma.tax.create({
    data: {
      name: 'GST (18%)',
      percentage: 18,
      taxType: 'PERCENTAGE',
      isInclusive: false,
      status: 'ACTIVE',
    },
  });

  const vat5 = await prisma.tax.create({
    data: {
      name: 'Reduced VAT (5%)',
      percentage: 5,
      taxType: 'PERCENTAGE',
      isInclusive: false,
      status: 'ACTIVE',
    },
  });

  const taxExempt = await prisma.tax.create({
    data: {
      name: 'Zero-Rated / Export',
      percentage: 0,
      taxType: 'PERCENTAGE',
      isInclusive: false,
      status: 'ACTIVE',
    },
  });

  // 4. Products & Variants (PRD Demo Scenario Step 1)
  const p1 = await prisma.product.create({
    data: {
      name: 'Business Management Software',
      productType: 'SOFTWARE',
      description: 'Unified ERP, CRM, and recurring workflow operational suite.',
      salesPrice: 2000,
      costPrice: 650,
      notes: 'Flagship Brightloop product',
      status: 'ACTIVE',
      variants: {
        create: [
          { name: 'Standard', additionalPrice: 0, sku: 'BMS-STD' },
          { name: 'Odoo', additionalPrice: 560, sku: 'BMS-ODOO' },
          { name: 'Enterprise', additionalPrice: 1200, sku: 'BMS-ENT' },
        ],
      },
    },
    include: { variants: true },
  });

  const p2 = await prisma.product.create({
    data: {
      name: 'Cloud Infrastructure Gateway',
      productType: 'SERVICE',
      description: 'High-throughput secure private API gateway with TLS termination.',
      salesPrice: 4500,
      costPrice: 1200,
      status: 'ACTIVE',
      variants: {
        create: [
          { name: 'Dedicated Node', additionalPrice: 1500, sku: 'CIG-DED' },
          { name: 'Shared Cluster', additionalPrice: 0, sku: 'CIG-SHR' },
        ],
      },
    },
    include: { variants: true },
  });

  const p3 = await prisma.product.create({
    data: {
      name: 'FinTech Compliance Vault',
      productType: 'SOFTWARE',
      description: 'Automated PCI-DSS, SOC2, and GST audit trail management.',
      salesPrice: 3200,
      costPrice: 900,
      status: 'ACTIVE',
      variants: {
        create: [
          { name: 'Automated Real-time', additionalPrice: 800, sku: 'FCV-AUTO' },
          { name: 'Standard Weekly', additionalPrice: 0, sku: 'FCV-STD' },
        ],
      },
    },
    include: { variants: true },
  });

  const p4 = await prisma.product.create({
    data: {
      name: 'Customer Support SLA 24/7',
      productType: 'SERVICE',
      description: 'Guaranteed 15-minute response time with dedicated Slack bridge.',
      salesPrice: 1500,
      costPrice: 400,
      status: 'ACTIVE',
      variants: {
        create: [
          { name: 'Dedicated Engineer', additionalPrice: 2000, sku: 'SLA-ENG' },
          { name: 'Team Pool', additionalPrice: 0, sku: 'SLA-POOL' },
        ],
      },
    },
    include: { variants: true },
  });

  const p5 = await prisma.product.create({
    data: {
      name: 'AI Revenue Forecasting Engine',
      productType: 'SOFTWARE',
      description: 'Predictive cohort cash flow and churn projection intelligence.',
      salesPrice: 5000,
      costPrice: 1500,
      status: 'ACTIVE',
    },
  });

  const p6 = await prisma.product.create({
    data: {
      name: 'Automated Payment Reconciliation Module',
      productType: 'SOFTWARE',
      description: 'Bank statement parsing and multi-invoice settlement matching.',
      salesPrice: 2800,
      costPrice: 700,
      status: 'ACTIVE',
    },
  });

  const p7 = await prisma.product.create({
    data: {
      name: 'Multi-Entity Ledger Consolidation',
      productType: 'SOFTWARE',
      description: 'Consolidated reporting across global corporate subsidiaries.',
      salesPrice: 6000,
      costPrice: 1800,
      status: 'ACTIVE',
    },
  });

  const p8 = await prisma.product.create({
    data: {
      name: 'Developer Webhooks & Kafka Stream',
      productType: 'SERVICE',
      description: 'Low-latency event streaming for external billing synchronization.',
      salesPrice: 1800,
      costPrice: 300,
      status: 'ACTIVE',
    },
  });

  const p9 = await prisma.product.create({
    data: {
      name: 'Custom Domain White-label Portal',
      productType: 'SERVICE',
      description: 'Full CSS theming and custom domain routing for billing portal.',
      salesPrice: 1200,
      costPrice: 200,
      status: 'ACTIVE',
    },
  });

  const p10 = await prisma.product.create({
    data: {
      name: 'Enterprise Security SAML / SSO',
      productType: 'SOFTWARE',
      description: 'Okta, Azure AD, and Google Workspace SAML 2.0 integration.',
      salesPrice: 2500,
      costPrice: 500,
      status: 'ACTIVE',
    },
  });

  // 5. Subscription Plans (PRD Demo Scenario Step 2)
  const planPro = await prisma.plan.create({
    data: {
      name: 'Business Pro',
      description: 'Complete operating platform for high-growth tech companies.',
      billingAmount: 2560,
      billingInterval: 'MONTHLY',
      minQuantity: 1,
      allowRenewal: true,
      allowPause: true,
      allowEarlyCancel: true,
      planProducts: {
        create: [{ productId: p1.id }, { productId: p4.id }],
      },
    },
  });

  const planEnterprise = await prisma.plan.create({
    data: {
      name: 'Enterprise Scale',
      description: 'Unlimited volume, dedicated nodes, and 24/7 phone escalation.',
      billingAmount: 12000,
      billingInterval: 'MONTHLY',
      minQuantity: 1,
      allowRenewal: true,
      allowPause: true,
      allowEarlyCancel: true,
      planProducts: {
        create: [{ productId: p1.id }, { productId: p2.id }, { productId: p3.id }],
      },
    },
  });

  const planYearly = await prisma.plan.create({
    data: {
      name: 'Annual Growth Tier',
      description: 'Full suite paid annually with 20% built-in platform savings.',
      billingAmount: 25000,
      billingInterval: 'YEARLY',
      minQuantity: 1,
      allowRenewal: true,
      allowPause: false,
      allowEarlyCancel: true,
      planProducts: {
        create: [{ productId: p1.id }, { productId: p6.id }],
      },
    },
  });

  const planWeekly = await prisma.plan.create({
    data: {
      name: 'Agile Weekly Sprint',
      description: 'Short-cycle billing for dynamic and seasonal consulting projects.',
      billingAmount: 1800,
      billingInterval: 'WEEKLY',
      minQuantity: 1,
      allowRenewal: true,
      allowPause: true,
      allowEarlyCancel: true,
      planProducts: {
        create: [{ productId: p4.id }, { productId: p8.id }],
      },
    },
  });

  const planDaily = await prisma.plan.create({
    data: {
      name: 'High Frequency Compute',
      description: 'Per-diem billing for burstable cloud jobs and stress-testing.',
      billingAmount: 450,
      billingInterval: 'DAILY',
      minQuantity: 1,
      allowRenewal: true,
      allowPause: true,
      allowEarlyCancel: true,
      planProducts: {
        create: [{ productId: p2.id }],
      },
    },
  });

  // 6. Discounts
  const disc10 = await prisma.discount.create({
    data: {
      name: '10% Welcome Discount',
      code: 'WELCOME10',
      discountType: 'PERCENTAGE',
      value: 10,
      usageLimit: 500,
      isSubscriptionWide: true,
      status: 'ACTIVE',
    },
  });

  const discFixed = await prisma.discount.create({
    data: {
      name: '₹500 Early Adopter Credit',
      code: 'EARLY500',
      discountType: 'FIXED',
      value: 500,
      minAmount: 2000,
      usageLimit: 100,
      isSubscriptionWide: true,
      status: 'ACTIVE',
    },
  });

  // 7. 20 Enterprise Customers & Accounts
  const customerNames = [
    { company: 'Acme Technologies Ltd', contact: 'Alex Rivera', email: 'alex@acmetech.io' },
    { company: 'Apex Cloud Solutions', contact: 'Jordan Taylor', email: 'jordan@apexcloud.com' },
    { company: 'Nexus FinTech Labs', contact: 'Marcus Vance', email: 'marcus@nexuslabs.co' },
    { company: 'Hyperion Analytics', contact: 'Sophia Chen', email: 'sophia@hyperion.ai' },
    { company: 'Starlight Media Group', contact: 'Lucas Gray', email: 'lucas@starlight.net' },
    { company: 'Vanguard Retail Systems', contact: 'Emma Watson', email: 'emma@vanguard.io' },
    { company: 'Quantum Dynamics', contact: 'Liam O’Connor', email: 'liam@quantumdyn.com' },
    { company: 'Pulse Health Technologies', contact: 'Aria Patel', email: 'aria@pulsehealth.org' },
    { company: 'Zenith Logistics Global', contact: 'Devon Miller', email: 'devon@zenithlogistics.com' },
    { company: 'Catalyst Robotics Corp', contact: 'Chloe Bennett', email: 'chloe@catalyst.io' },
    { company: 'Aegis Cybersecurity Inc', contact: 'Ethan Wright', email: 'ethan@aegissecur.com' },
    { company: 'Beacon Real Estate SaaS', contact: 'Grace Murphy', email: 'grace@beaconre.com' },
    { company: 'Solaria Clean Energy', contact: 'Noah Hernandez', email: 'noah@solariaenergy.io' },
    { company: 'Krypton Data Pipelines', contact: 'Zoe Campbell', email: 'zoe@kryptondata.io' },
    { company: 'Orbit Media Streaming', contact: 'Jack Sullivan', email: 'jack@orbitstreaming.tv' },
    { company: 'Meridian Banking Solutions', contact: 'Lily Foster', email: 'lily@meridianbank.io' },
    { company: 'Ironclad Compliance Group', contact: 'Mason Diaz', email: 'mason@ironcladcorp.com' },
    { company: 'Vertex AI Systems', contact: 'Harper Kelly', email: 'harper@vertexai.tech' },
    { company: 'Titan Aerospace Software', contact: 'Benjamin Scott', email: 'ben@titanaero.space' },
    { company: 'OmniFlow Digital Agency', contact: 'Mia Ross', email: 'mia@omniflow.design' },
  ];

  const createdCustomers: any[] = [];

  for (let i = 0; i < customerNames.length; i++) {
    const c = customerNames[i];
    const u = await prisma.user.create({
      data: {
        email: c.email,
        name: c.contact,
        passwordHash: customerHash,
        role: 'CUSTOMER',
      },
    });

    const cust = await prisma.customer.create({
      data: {
        userId: u.id,
        email: c.email,
        contactName: c.contact,
        companyName: c.company,
        phone: `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`,
        billingAddress: `${100 + i * 12} Technology Business Park, Sector ${i + 1}, Bengaluru, KA, India`,
        taxNumber: `29AABC${Math.floor(1000 + Math.random() * 9000)}Z${i}Z5`,
        status: 'ACTIVE',
      },
    });

    createdCustomers.push(cust);
  }

  // 8. Generate 110 Subscriptions across customers with full history
  console.log('Generating 110+ subscriptions and historical financial data...');
  const plans = [planPro, planEnterprise, planYearly, planWeekly, planDaily];
  const statuses = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'PAUSED', 'EXPIRED', 'CANCELLED'];

  let subscriptionCounter = 1000;
  let invoiceCounter = 1000;
  let paymentCounter = 1000;

  for (let i = 0; i < 110; i++) {
    const customer = createdCustomers[i % createdCustomers.length];
    const plan = plans[i % plans.length];
    const status = i === 0 ? 'ACTIVE' : statuses[i % statuses.length];
    subscriptionCounter++;

    const subNumber = `SUB-202610-${subscriptionCounter}`;
    const startMonthsAgo = (i % 6) + 1;
    const startDate = subMonths(new Date(), startMonthsAgo);

    // Make some subscriptions due today (for Billing Control Centre demo)
    let nextBillingDate: Date;
    if (i < 5) {
      // Due today!
      nextBillingDate = subDays(new Date(), 0);
    } else if (i < 15) {
      // Due in next 3 days
      nextBillingDate = addDays(new Date(), 2);
    } else {
      nextBillingDate = addDays(new Date(), (i % 25) + 5);
    }

    const odooVariant = p1.variants.find((v) => v.name === 'Odoo') || p1.variants[0];
    const unitPrice = p1.salesPrice;
    const variantPrice = odooVariant.additionalPrice;
    const quantity = (i % 4) + 1;
    const subtotal = (unitPrice + variantPrice) * quantity;
    const discountAmount = i % 3 === 0 ? Math.round(subtotal * 0.1) : 0;
    const taxable = subtotal - discountAmount;
    const taxAmount = Math.round(taxable * 0.18);
    const totalAmount = taxable + taxAmount;

    const sub = await prisma.subscription.create({
      data: {
        subscriptionNumber: subNumber,
        customerId: customer.id,
        planId: plan.id,
        status,
        billingInterval: plan.billingInterval,
        startDate,
        nextBillingDate,
        lastBilledDate: subMonths(nextBillingDate, 1),
        paymentTerms: 'NET_30',
        subtotal,
        discountTotal: discountAmount,
        taxTotal: taxAmount,
        totalAmount,
        autoClose: plan.autoClose,
        allowEarlyCancel: plan.allowEarlyCancel,
        allowPause: plan.allowPause,
        allowRenewal: plan.allowRenewal,
        items: {
          create: [
            {
              productId: p1.id,
              productName: p1.name,
              variantId: odooVariant.id,
              variantName: odooVariant.name,
              quantity,
              unitPrice,
              variantPrice,
              discountAmount,
              taxAmount,
              lineTotal: totalAmount,
            },
          ],
        },
      },
    });

    // Generate historical Invoices and Payments for subscriptions
    const invoiceMonths = Math.min(3, startMonthsAgo);
    for (let m = 0; m < invoiceMonths; m++) {
      invoiceCounter++;
      const invDate = subMonths(new Date(), m);
      const dueDate = addDays(invDate, 15);
      const invNumber = `INV-202610-${invoiceCounter}`;
      const periodKey = `${format(subMonths(invDate, 1), 'yyyy-MM-dd')}_to_${format(invDate, 'yyyy-MM-dd')}`;

      // Invoices: mixture of PAID, PARTIALLY_PAID, and OVERDUE
      let payStatus = 'PAID';
      let workStatus = 'PAID';
      let amtPaid = totalAmount;
      let balDue = 0;

      if (m === 0) {
        if (i % 5 === 0) {
          // Overdue invoice!
          payStatus = 'UNPAID';
          workStatus = 'CONFIRMED';
          amtPaid = 0;
          balDue = totalAmount;
        } else if (i % 7 === 0) {
          // Partially paid invoice!
          payStatus = 'PARTIALLY_PAID';
          workStatus = 'CONFIRMED';
          amtPaid = Math.round(totalAmount / 2);
          balDue = totalAmount - amtPaid;
        }
      }

      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber: invNumber,
          customerId: customer.id,
          subscriptionId: sub.id,
          billingPeriodKey: periodKey,
          invoiceDate: invDate,
          dueDate: payStatus === 'UNPAID' ? subDays(new Date(), 5) : dueDate,
          workflowStatus: workStatus,
          paymentStatus: payStatus,
          subtotal,
          discountTotal: discountAmount,
          taxTotal: taxAmount,
          totalAmount,
          amountPaid: amtPaid,
          balanceDue: balDue,
          calculationSnapshot: JSON.stringify({
            basePrice: unitPrice,
            variantPrice,
            quantity,
            subtotal,
            discount: discountAmount,
            tax: taxAmount,
            total: totalAmount,
          }),
          items: {
            create: [
              {
                productId: p1.id,
                productName: p1.name,
                variantId: odooVariant.id,
                variantName: odooVariant.name,
                quantity,
                unitPrice,
                variantPrice,
                discountAmount,
                taxAmount,
                lineTotal: totalAmount,
              },
            ],
          },
        },
      });

      // Create Payment records for paid & partially paid amounts
      if (amtPaid > 0) {
        paymentCounter++;
        const payNumber = `PAY-202610-${paymentCounter}`;
        const pmt = await prisma.payment.create({
          data: {
            paymentNumber: payNumber,
            customerId: customer.id,
            amount: amtPaid,
            paymentDate: addDays(invDate, 2),
            method: i % 2 === 0 ? 'BANK_TRANSFER' : i % 3 === 0 ? 'UPI' : 'CARD',
            transactionReference: `TXN-${Math.floor(10000000 + Math.random() * 90000000)}`,
            status: 'ALLOCATED',
            allocatedAmount: amtPaid,
            unallocatedAmount: 0,
            allocations: {
              create: [
                {
                  invoiceId: invoice.id,
                  amount: amtPaid,
                },
              ],
            },
          },
        });
      }
    }
  }

  // Create an Unmatched / Unallocated Payment for Reconciliation testing
  await prisma.payment.create({
    data: {
      paymentNumber: 'PAY-202610-9999',
      customerId: createdCustomers[0].id,
      amount: 15000,
      paymentDate: new Date(),
      method: 'BANK_TRANSFER',
      transactionReference: 'TXN-UNMATCHED-9999',
      status: 'RECORDED',
      allocatedAmount: 0,
      unallocatedAmount: 15000,
      notes: 'Direct wire deposit awaiting staff invoice matching',
    },
  });

  // Create Quotations
  await prisma.quotation.create({
    data: {
      quotationNumber: 'QUO-202610-1001',
      customerId: createdCustomers[0].id,
      planId: planPro.id,
      status: 'CONFIRMED',
      validityDate: addDays(new Date(), 20),
      paymentTerms: 'NET_30',
      notes: 'Standard enterprise rollout proposal',
      subtotal: 7680,
      discountTotal: 768,
      taxTotal: 1244.16,
      totalAmount: 8156.16,
      items: {
        create: [
          {
            productId: p1.id,
            productName: p1.name,
            variantId: p1.variants[1].id,
            variantName: 'Odoo',
            quantity: 3,
            unitPrice: 2000,
            variantPrice: 560,
            discountAmount: 768,
            taxAmount: 1244.16,
            lineTotal: 8156.16,
          },
        ],
      },
    },
  });

  // Create Quotation Template
  await prisma.quotationTemplate.create({
    data: {
      name: 'Standard SaaS Enterprise Package',
      validityDays: 30,
      paymentTerms: 'NET_30',
      defaultNotes: 'Includes full standard SLA and cloud hosting backup.',
      items: {
        create: [
          {
            productId: p1.id,
            variantId: p1.variants[1].id,
            quantity: 3,
          },
        ],
      },
    },
  });

  console.log('✅ LOOPFLOW Seeding Completed Successfully!');
  console.log('----------------------------------------------------');
  console.log('🔑 CREDENTIALS FOR TESTING & DEMO:');
  console.log('   ADMIN:    admin@brightloop.io / Admin@Brightloop123!');
  console.log('   STAFF:    sarah.ops@brightloop.io / Staff@Brightloop123!');
  console.log('   STAFF:    david.billing@brightloop.io / Staff@Brightloop123!');
  console.log('   CUSTOMER: alex@acmetech.io / Customer@Loopflow123!');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
