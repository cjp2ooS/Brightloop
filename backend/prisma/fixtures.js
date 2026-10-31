import bcrypt from 'bcrypt';
import { prisma } from '../src/config/db.js';

const email = process.env.FIXTURE_ADMIN_EMAIL || 'admin@brightloop.local';
const password = process.env.FIXTURE_ADMIN_PASSWORD || 'Brightloop!2026';
const passwordHash = await bcrypt.hash(password, 12);
const user = await prisma.user.upsert({ where: { email }, update: { name: 'Brightloop Admin', role: 'ADMIN', isActive: true, passwordHash }, create: { name: 'Brightloop Admin', email, passwordHash, role: 'ADMIN' } });
console.log(`Fixture admin ready: ${user.email} / ${password}`);
await prisma.$disconnect();
