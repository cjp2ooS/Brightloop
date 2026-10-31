import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './modules/auth/auth.routes';
import customerRoutes from './modules/customers/customers.routes';
import productRoutes from './modules/products/products.routes';
import planRoutes from './modules/plans/plans.routes';
import taxRoutes from './modules/taxes/taxes.routes';
import discountRoutes from './modules/discounts/discounts.routes';
import quotationRoutes from './modules/quotations/quotations.routes';
import subscriptionRoutes from './modules/subscriptions/subscriptions.routes';
import billingRoutes from './modules/billing/billing.routes';
import invoiceRoutes from './modules/invoices/invoices.routes';
import paymentRoutes from './modules/payments/payments.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import intelligenceRoutes from './modules/intelligence/intelligence.routes';
import auditRoutes from './modules/audit/audit.routes';
import notificationRoutes from './modules/notifications/notifications.routes';
import { BillingEngine } from './modules/billing/billing.engine';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/taxes', taxRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/intelligence', intelligenceRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'LOOPFLOW Subscription Management API',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Periodic Asynchronous Billing Scheduler Ticker (Runs every 60 seconds)
const SCHEDULER_INTERVAL_MS = 60 * 1000;
let schedulerTimer: NodeJS.Timeout | null = null;

function startBillingScheduler() {
  schedulerTimer = setInterval(async () => {
    try {
      await BillingEngine.executeBillingRun('SCHEDULED', new Date());
    } catch (err: any) {
      if (!err?.message?.includes('already in progress')) {
        console.warn('[BillingScheduler] Run note:', err?.message);
      }
    }
  }, SCHEDULER_INTERVAL_MS);
}

// Only listen if not imported in test suite
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    console.log(`🚀 LOOPFLOW Backend Server running on port ${PORT}`);
    console.log(`⚡ API ready at http://localhost:${PORT}/api/health`);
    startBillingScheduler();
  });

  process.on('SIGINT', () => {
    if (schedulerTimer) clearInterval(schedulerTimer);
    server.close(() => {
      console.log('Server stopped cleanly.');
      process.exit(0);
    });
  });
}

export default app;
