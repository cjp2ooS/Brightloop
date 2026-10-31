import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../../config/db.js';
import { env } from '../../config/env.js';
import { requireAuth } from '../../middleware/auth.js';
import { sendMail } from '../../utils/mailer.js';
import { emailSchema, passwordSchema, parseBody } from './validation.js';

const router = Router();
const loginLimit = rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: true, legacyHeaders: false, message: { error: { code: 'RATE_LIMITED', message: 'Too many login attempts. Try again shortly.' } } });
const publicUser = ({ id, name, email, role }) => ({ id, name, email, role });
const tokenFor = (user) => jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
const signupSchema = z.object({ name: z.string().trim().min(1).max(120), email: emailSchema, password: passwordSchema });
const loginSchema = z.object({ email: emailSchema, password: z.string().min(1) });
const emailOnlySchema = z.object({ email: emailSchema });
const resetSchema = z.object({ token: z.string().min(1), password: passwordSchema });

router.post('/signup', async (req, res, next) => {
  try {
    const data = parseBody(signupSchema, req, res); if (!data) return;
    if (await prisma.user.findUnique({ where: { email: data.email } })) return res.status(409).json({ error: { code: 'EMAIL_TAKEN', message: 'Email is already registered' } });
    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({ data: { name: data.name, email: data.email, passwordHash, role: 'CUSTOMER' } });
      await tx.customer.create({ data: { userId: created.id, name: created.name, email: created.email } });
      return created;
    });
    res.status(201).json({ token: tokenFor(user), user: publicUser(user) });
  } catch (error) { if (error.code === 'P2002') return res.status(409).json({ error: { code: 'EMAIL_TAKEN', message: 'Email is already registered' } }); next(error); }
});

router.post('/login', loginLimit, async (req, res, next) => {
  try {
    const data = parseBody(loginSchema, req, res); if (!data) return;
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user || !user.isActive || !(await bcrypt.compare(data.password, user.passwordHash))) return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect' } });
    res.json({ token: tokenFor(user), user: publicUser(user) });
  } catch (error) { next(error); }
});

router.post('/forgot-password', async (req, res, next) => {
  const generic = { message: 'If an account exists for this email, a password reset link has been sent.' };
  try {
    const parsed = emailOnlySchema.safeParse(req.body);
    if (!parsed.success) return res.status(200).json(generic);
    const data = parsed.data;
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      await prisma.passwordReset.create({ data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 15 * 60_000) } });
      const link = `${env.appUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(rawToken)}`;
      await sendMail({ to: user.email, subject: 'Reset your Brightloop password', text: `Use this link within 15 minutes to reset your password: ${link}` });
    }
    res.status(200).json(generic);
  } catch (error) { next(error); }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const data = parseBody(resetSchema, req, res); if (!data) return;
    const tokenHash = crypto.createHash('sha256').update(data.token).digest('hex');
    const record = await prisma.passwordReset.findFirst({ where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } } });
    if (!record) return res.status(400).json({ error: { code: 'INVALID_RESET_TOKEN', message: 'Reset link is invalid or expired' } });
    const passwordHash = await bcrypt.hash(data.password, 12);
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      prisma.passwordReset.updateMany({ where: { userId: record.userId, usedAt: null }, data: { usedAt: new Date() } }),
    ]);
    res.json({ message: 'Password updated successfully' });
  } catch (error) { next(error); }
});

router.get('/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

export default router;
