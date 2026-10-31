import { prisma } from '../lib/prisma';
import { AuthenticatedRequest } from './auth';

export async function logAuditEvent(
  req: AuthenticatedRequest | null,
  action: string,
  entityType: string,
  entityId?: string | null,
  beforeState?: any,
  afterState?: any
) {
  try {
    const actorId = req?.user?.userId || 'SYSTEM';
    const actorName = req?.user?.name || 'System Worker';
    const actorRole = req?.user?.role || 'SYSTEM';
    const ipAddress = req?.ip || req?.headers['x-forwarded-for']?.toString() || '127.0.0.1';

    await prisma.auditLog.create({
      data: {
        actorId: actorId === 'SYSTEM' ? null : actorId,
        actorName,
        actorRole,
        action,
        entityType,
        entityId: entityId || null,
        beforeState: beforeState ? JSON.stringify(beforeState) : null,
        afterState: afterState ? JSON.stringify(afterState) : null,
        ipAddress,
      },
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}
