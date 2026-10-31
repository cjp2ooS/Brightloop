import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.js';
import { notFoundHandler, errorHandler } from './middleware/error.js';
import authRoutes from './modules/auth/routes.js';
import userRoutes from './modules/users/routes.js';
import customerRoutes from './modules/customers/routes.js';

export const app = express();

// Security and standard middlewares
app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(','),
    credentials: true,
  })
);
app.use(express.json());

// Base health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    system: 'Brightloop Subscription Management System',
    timestamp: new Date().toISOString(),
    environment: env.nodeEnv,
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/customers', customerRoutes);

// 404 handler
app.use(notFoundHandler);

// Central error handler
app.use(errorHandler);
