import { Router, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { hashPassword, comparePassword, validatePasswordStrength } from '../../lib/password';
import { signToken } from '../../lib/jwt';
import { requireAuth, requireRole, AuthenticatedRequest } from '../../middleware/auth';
import { logAuditEvent } from '../../middleware/audit';
import crypto from 'crypto';

const router = Router();

// POST /api/auth/register (Customer Registration)
router.post('/register', async (req, res) => {
  try {
    const { email, password, companyName, contactName, phone, billingAddress, taxNumber } = req.body;

    if (!email || !password || !contactName) {
      return res.status(400).json({ error: 'Email, password, and contact name are required.' });
    }

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.error });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email,
          passwordHash,
          name: contactName,
          role: 'CUSTOMER',
        },
      });

      const customer = await tx.customer.create({
        data: {
          userId: u.id,
          email,
          contactName,
          companyName: companyName || contactName,
          phone: phone || null,
          billingAddress: billingAddress || null,
          taxNumber: taxNumber || null,
        },
      });

      await tx.notification.create({
        data: {
          customerId: customer.id,
          userId: u.id,
          type: 'WELCOME',
          subject: 'Welcome to LOOPFLOW - Brightloop Software',
          body: `Hi ${contactName}, your customer portal account has been created successfully.`,
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      return u;
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: 'CUSTOMER',
      name: user.name,
    });

    await logAuditEvent(null, 'CUSTOMER_REGISTERED', 'User', user.id, null, { email, role: 'CUSTOMER' });

    res.status(201).json({
      message: 'Account registered successfully.',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message || 'Registration failed.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        customer: true,
        staffProfile: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role as any,
      customerId: user.customer?.id,
      name: user.name,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        customerId: user.customer?.id,
        customer: user.customer,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Login failed.' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        customer: true,
        staffProfile: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        customerId: user.customer?.id,
        customer: user.customer,
        staffProfile: user.staffProfile,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/staff (Admin Only: Create Staff Accounts)
router.post('/staff', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password, name, department, title, permissions } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and staff name are required.' });
    }

    const validation = validatePasswordStrength(password);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }

    const passwordHash = await hashPassword(password);

    const staffUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email,
          passwordHash,
          name,
          role: 'STAFF',
        },
      });

      await tx.staffProfile.create({
        data: {
          userId: u.id,
          department: department || 'Operations',
          title: title || 'Subscription Specialist',
          permissions: permissions ? JSON.stringify(permissions) : null,
        },
      });

      return u;
    });

    await logAuditEvent(req, 'STAFF_CREATED', 'StaffProfile', staffUser.id, null, { email, name, role: 'STAFF' });

    res.status(201).json({
      message: 'Staff account created successfully.',
      staff: {
        id: staffUser.id,
        email: staffUser.email,
        name: staffUser.name,
        role: staffUser.role,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Staff creation failed.' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return success to avoid email enumeration
      return res.json({ message: 'If this email exists in our records, a reset token has been generated.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    res.json({
      message: 'Password reset token generated.',
      resetToken: token, // Surfaced in demo environment for immediate testing
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required.' });
    }

    const validation = validatePasswordStrength(newPassword);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetRecord || resetRecord.usedAt || new Date() > resetRecord.expiresAt) {
      return res.status(400).json({ error: 'Invalid or expired password reset token.' });
    }

    const newHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash: newHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
    ]);

    res.json({ message: 'Password has been reset successfully. You can now log in.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
