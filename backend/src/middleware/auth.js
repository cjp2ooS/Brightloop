import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../config/db.js';

export async function requireAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
  }
}

export const allowRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
  next();
};
