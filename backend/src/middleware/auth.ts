import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../lib/jwt';
import { prisma } from '../lib/prisma';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
  customerRecord?: any;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }

  req.user = payload;

  // If role is CUSTOMER, load customer profile ID
  if (payload.role === 'CUSTOMER') {
    const customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { userId: payload.userId },
          { email: payload.email },
        ],
      },
    });
    if (customer) {
      req.customerRecord = customer;
      req.user.customerId = customer.id;
    }
  }

  next();
}

export function requireRole(...allowedRoles: Array<'ADMIN' | 'STAFF' | 'CUSTOMER'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Requires one of [${allowedRoles.join(', ')}] permissions.`,
      });
    }

    next();
  };
}

export function checkCustomerOwnership(customerIdParamKey = 'customerId') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    // Admins and staff have tenant-wide view
    if (req.user.role === 'ADMIN' || req.user.role === 'STAFF') {
      return next();
    }

    // For customers, the resource customerId must match their own customer profile
    const requestedCustomerId = req.params[customerIdParamKey] || req.body[customerIdParamKey] || req.query[customerIdParamKey];
    if (requestedCustomerId && req.user.customerId && requestedCustomerId !== req.user.customerId) {
      return res.status(403).json({ error: 'Unauthorized: You do not own this customer profile or resource.' });
    }

    next();
  };
}
