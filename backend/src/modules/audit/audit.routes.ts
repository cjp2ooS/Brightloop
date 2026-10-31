import { Router, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { requireAuth, requireRole, AuthenticatedRequest } from '../../middleware/auth';

const router = Router();

// GET /api/audit (Admin Only: View Audit Logs)
router.get('/', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { action, entityType, limit } = req.query;
    const where: any = {};

    if (action) where.action = action as string;
    if (entityType) where.entityType = entityType as string;

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit ? parseInt(limit as string, 10) : 100,
      include: {
        user: { select: { email: true, name: true, role: true } },
      },
    });

    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
