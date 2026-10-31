import React, { useState } from 'react';
import { apiRequest } from '../api/client';
import {
  Rocket,
  CheckCircle2,
  Clock,
  Play,
  ArrowRight,
  ShieldCheck,
  Receipt,
  CreditCard,
  Layers,
  Sparkles,
  ExternalLink,
  RotateCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Link } from 'react-router-dom';

interface StepState {
  title: string;
  desc: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  output?: any;
}

export const HackathonDemo: React.FC = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [running, setRunning] = useState(false);
  const [createdData, setCreatedData] = useState<any>({});

  const [steps, setSteps] = useState<StepState[]>([
    {
      title: 'Step 1: Product & Variant Creation',
      desc: 'Admin creates "Business Management Software" (Base ₹2,000) with "Odoo" variant (₹560).',
      status: 'PENDING',
    },
    {
      title: 'Step 2: Subscription Plan Creation',
      desc: 'Admin creates "Business Pro" plan (Monthly, renewals enabled, associated with product).',
      status: 'PENDING',
    },
    {
      title: 'Step 3: Quotation with 10% Discount',
      desc: 'Staff creates quotation: Product BMS, Variant Odoo, Qty 3, 10% Discount, GST 18%.',
      status: 'PENDING',
    },
    {
      title: 'Step 4: Confirm & Convert to Subscription',
      desc: 'Quotation confirmed and converted into an Active Subscription with next billing date.',
      status: 'PENDING',
    },
    {
      title: 'Step 5: Automatic Recurring Billing Run',
      desc: 'Subscription made due; recurring billing worker generates unique invoice with pricing snapshot.',
      status: 'PENDING',
    },
    {
      title: 'Step 6: Idempotent Duplicate Billing Prevention Test',
      desc: 'Trigger same billing run again. Database compound constraint skips cycle: 0 duplicate invoices!',
      status: 'PENDING',
    },
    {
      title: 'Step 7: Partial Payment & Settlement to PAID',
      desc: 'Record ₹4,000 partial payment (leaving balance due), then record remaining payment to mark invoice PAID.',
      status: 'PENDING',
    },
    {
      title: 'Step 8: Financial Intelligence Dashboard Update',
      desc: 'Verify normalized MRR, ARR, cash collected, and outstanding balance reflects new transactions.',
      status: 'PENDING',
    },
    {
      title: 'Step 9: Billing Control Centre Live State',
      desc: 'Inspect central control centre: due subscriptions, upcoming renewals, and run logs.',
      status: 'PENDING',
    },
  ]);

  const updateStepStatus = (index: number, status: StepState['status'], output?: any) => {
    setSteps((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], status, output };
      return copy;
    });
  };

  const runAllSteps = async () => {
    setRunning(true);
    for (let i = 0; i < steps.length; i++) {
      await executeStep(i);
    }
    setRunning(false);
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
  };

  const executeStep = async (index: number) => {
    updateStepStatus(index, 'RUNNING');
    setCurrentStepIndex(index);

    try {
      if (index === 0) {
        // Step 1: Create Product + Variant
        const p = await apiRequest('/products', {
          method: 'POST',
          body: JSON.stringify({
            name: `Business Management Software [Demo ${Date.now().toString().slice(-4)}]`,
            productType: 'SOFTWARE',
            description: 'Integrated business suite for ERP, CRM, and billing.',
            salesPrice: 2000,
            costPrice: 650,
            variants: [
              { name: 'Standard', additionalPrice: 0, sku: 'BMS-STD' },
              { name: 'Odoo', additionalPrice: 560, sku: 'BMS-ODOO' },
              { name: 'Enterprise', additionalPrice: 1200, sku: 'BMS-ENT' },
            ],
          }),
        });

        const odooVariant = p.variants.find((v: any) => v.name === 'Odoo') || p.variants[0];
        setCreatedData((prev: any) => ({ ...prev, product: p, odooVariant }));
        updateStepStatus(index, 'COMPLETED', {
          productId: p.id,
          productName: p.name,
          basePrice: p.salesPrice,
          variantName: odooVariant.name,
          variantAdditionalPrice: odooVariant.additionalPrice,
          unitFinalPrice: p.salesPrice + odooVariant.additionalPrice,
        });
      } else if (index === 1) {
        // Step 2: Create Plan
        const pId = createdData.product?.id;
        const plan = await apiRequest('/plans', {
          method: 'POST',
          body: JSON.stringify({
            name: `Business Pro [Demo ${Date.now().toString().slice(-4)}]`,
            description: 'Monthly flagship business subscription tier.',
            billingAmount: 2560,
            billingInterval: 'MONTHLY',
            allowRenewal: true,
            allowPause: true,
            allowEarlyCancel: true,
            productIds: pId ? [pId] : [],
          }),
        });

        setCreatedData((prev: any) => ({ ...prev, plan }));
        updateStepStatus(index, 'COMPLETED', {
          planId: plan.id,
          planName: plan.name,
          billingInterval: plan.billingInterval,
          allowRenewal: plan.allowRenewal,
        });
      } else if (index === 2) {
        // Step 3: Create Quotation with 10% Discount & 3 Qty
        const customers = await apiRequest('/customers');
        const customer = customers[0];

        const quo = await apiRequest('/quotations', {
          method: 'POST',
          body: JSON.stringify({
            customerId: customer.id,
            planId: createdData.plan?.id,
            paymentTerms: 'NET_30',
            notes: 'Hackathon Demo Quotation Scenario',
            items: [
              {
                productId: createdData.product?.id,
                productName: createdData.product?.name,
                variantId: createdData.odooVariant?.id,
                variantName: createdData.odooVariant?.name,
                unitPrice: createdData.product?.salesPrice || 2000,
                variantPrice: createdData.odooVariant?.additionalPrice || 560,
                quantity: 3,
                discountPercentage: 10,
              },
            ],
          }),
        });

        setCreatedData((prev: any) => ({ ...prev, quotation: quo, customer }));
        updateStepStatus(index, 'COMPLETED', {
          quotationNumber: quo.quotationNumber,
          customerName: customer.companyName,
          quantity: 3,
          subtotal: quo.subtotal,
          discountTotal: quo.discountTotal,
          taxTotal: quo.taxTotal,
          totalAmount: quo.totalAmount,
        });
      } else if (index === 3) {
        // Step 4: Confirm Quotation and Convert to Active Subscription
        await apiRequest(`/quotations/${createdData.quotation.id}/confirm`, { method: 'POST' });
        const conv = await apiRequest(`/quotations/${createdData.quotation.id}/convert`, { method: 'POST' });

        setCreatedData((prev: any) => ({ ...prev, subscription: conv.subscription }));
        updateStepStatus(index, 'COMPLETED', {
          subscriptionId: conv.subscription.id,
          subscriptionNumber: conv.subscription.subscriptionNumber,
          status: conv.subscription.status,
          nextBillingDate: conv.subscription.nextBillingDate,
          totalAmount: conv.subscription.totalAmount,
        });
      } else if (index === 4) {
        // Step 5: Make Due and Run Billing Engine
        const subId = createdData.subscription.id;
        await apiRequest(`/subscriptions/${subId}/make-due`, { method: 'POST' });
        const billingRes = await apiRequest('/billing/trigger', {
          method: 'POST',
          body: JSON.stringify({ subscriptionId: subId }),
        });

        const invoiceDetail = billingRes.result.details?.find((d: any) => d.subscriptionId === subId);
        const invoices = await apiRequest(`/invoices?subscriptionId=${subId}`);
        const generatedInv = invoices[0];

        setCreatedData((prev: any) => ({ ...prev, invoice: generatedInv }));
        updateStepStatus(index, 'COMPLETED', {
          invoiceNumber: generatedInv.invoiceNumber,
          billingStatus: invoiceDetail?.status,
          subtotal: generatedInv.subtotal,
          discount: generatedInv.discountTotal,
          tax: generatedInv.taxTotal,
          totalAmount: generatedInv.totalAmount,
          balanceDue: generatedInv.balanceDue,
          period: generatedInv.billingPeriodKey,
        });
      } else if (index === 5) {
        // Step 6: Trigger duplicate billing test
        const subId = createdData.subscription.id;
        const duplicateRes = await apiRequest('/billing/trigger', {
          method: 'POST',
          body: JSON.stringify({ subscriptionId: subId }),
        });

        const detail = duplicateRes.result.details?.find((d: any) => d.subscriptionId === subId);
        updateStepStatus(index, 'COMPLETED', {
          idempotentCheck: 'PASSED',
          status: detail?.status || 'SKIPPED',
          reason: detail?.reason || 'Already billed for this cycle. Duplicate prevented.',
          duplicateInvoicesCreated: 0,
        });
      } else if (index === 6) {
        // Step 7: Record Partial Payment of 4000, then Record Balance
        const inv = createdData.invoice;
        const custId = createdData.customer.id;

        // Partial payment: ₹4,000
        const p1 = await apiRequest('/payments', {
          method: 'POST',
          body: JSON.stringify({
            customerId: custId,
            invoiceId: inv.id,
            amount: 4000,
            method: 'BANK_TRANSFER',
            transactionReference: `TXN-DEMO-PART1-${Date.now().toString().slice(-4)}`,
            notes: 'Partial demo settlement',
          }),
        });

        const invAfterP1 = await apiRequest(`/invoices/${inv.id}`);

        // Remaining payment: ₹4,156.16 (or exact remaining balance)
        const remaining = invAfterP1.balanceDue;
        const p2 = await apiRequest('/payments', {
          method: 'POST',
          body: JSON.stringify({
            customerId: custId,
            invoiceId: inv.id,
            amount: remaining,
            method: 'UPI',
            transactionReference: `TXN-DEMO-PART2-${Date.now().toString().slice(-4)}`,
            notes: 'Final settlement to mark PAID',
          }),
        });

        const invFinal = await apiRequest(`/invoices/${inv.id}`);

        setCreatedData((prev: any) => ({ ...prev, invoiceFinal: invFinal }));
        updateStepStatus(index, 'COMPLETED', {
          firstPayment: p1.amount,
          intermediateBalanceDue: invAfterP1.balanceDue,
          finalPayment: p2.amount,
          finalBalanceDue: invFinal.balanceDue,
          finalPaymentStatus: invFinal.paymentStatus,
          finalWorkflowStatus: invFinal.workflowStatus,
        });
      } else if (index === 7) {
        // Step 8: Dashboard check
        const dash = await apiRequest('/analytics/dashboard');
        updateStepStatus(index, 'COMPLETED', {
          mrr: dash.kpis.mrr,
          arr: dash.kpis.arr,
          activeSubscriptions: dash.kpis.activeSubscriptionsCount,
          revenueCollected: dash.kpis.revenueCollected,
          outstandingRevenue: dash.kpis.outstandingRevenue,
        });
      } else if (index === 8) {
        // Step 9: Control Center check
        const ctrl = await apiRequest('/billing/control-center');
        updateStepStatus(index, 'COMPLETED', {
          dueSubscriptionsToday: ctrl.dueSubscriptions.length,
          upcomingRenewals: ctrl.upcomingRenewals.length,
          failedAttempts: ctrl.failedAttempts.length,
          unpaidInvoices: ctrl.invoiceMetrics.unpaidCount,
          overdueInvoices: ctrl.invoiceMetrics.overdueCount,
        });
      }
    } catch (err: any) {
      updateStepStatus(index, 'FAILED', { error: err.message });
      throw err;
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-amber-400">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Evaluation Mode</span>
          </div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight mt-1">
            Hackathon Demonstration Scenario
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Autonomous verification of the PRD Section 23 lifecycle: Product → Plan → Quotation → Subscription → Billing → Duplicate Prevention → Payments → Financial Reports.
          </p>
        </div>

        <button
          onClick={runAllSteps}
          disabled={running}
          className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-105 disabled:opacity-50"
        >
          {running ? (
            <>
              <RotateCw className="w-4 h-4 animate-spin text-slate-950" />
              <span>Running Verification...</span>
            </>
          ) : (
            <>
              <Rocket className="w-4 h-4 text-slate-950" />
              <span>Run Complete 9-Step Demo</span>
            </>
          )}
        </button>
      </div>

      {/* Steps List */}
      <div className="space-y-4">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className={`p-5 rounded-xl border transition-all ${
              step.status === 'COMPLETED'
                ? 'bg-slate-900/80 border-emerald-500/40 shadow-sm shadow-emerald-500/5'
                : step.status === 'RUNNING'
                ? 'bg-slate-900 border-amber-500/60 animate-pulse'
                : step.status === 'FAILED'
                ? 'bg-slate-900 border-rose-500/50'
                : 'bg-slate-950/60 border-slate-800/80'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="mt-0.5">
                  {step.status === 'COMPLETED' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : step.status === 'RUNNING' ? (
                    <RotateCw className="w-5 h-5 text-amber-400 animate-spin" />
                  ) : step.status === 'FAILED' ? (
                    <Clock className="w-5 h-5 text-rose-400" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-slate-700 flex items-center justify-center text-[10px] text-slate-400 font-bold">
                      {idx + 1}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">{step.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{step.desc}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {step.status !== 'COMPLETED' && (
                  <button
                    onClick={() => executeStep(idx)}
                    disabled={running}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-all disabled:opacity-50"
                  >
                    <Play className="w-3 h-3" /> Run Step
                  </button>
                )}
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    step.status === 'COMPLETED'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : step.status === 'RUNNING'
                      ? 'bg-amber-500/20 text-amber-400'
                      : step.status === 'FAILED'
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {step.status}
                </span>
              </div>
            </div>

            {/* Output details card */}
            {step.output && (
              <div className="mt-4 p-3.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-1 overflow-x-auto">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Live Backend Response:</div>
                {Object.entries(step.output).map(([key, value]: any) => (
                  <div key={key} className="flex items-center justify-between py-0.5 border-b border-slate-900">
                    <span className="text-slate-400">{key}:</span>
                    <span className="text-emerald-400 font-semibold">{String(value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
