import { Router, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth';

const router = Router();

// GET /api/notifications (List notifications for user or tenant)
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const where: any = {};
    if (req.user?.role === 'CUSTOMER') {
      where.customerId = req.user.customerId;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
