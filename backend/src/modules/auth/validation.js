import { z } from 'zod';

export const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{9,}$/;
export const passwordSchema = z.string().regex(PASSWORD_PATTERN, 'Password must be at least 9 characters and include uppercase, lowercase, and a special character');
export const emailSchema = z.string().trim().email().transform((value) => value.toLowerCase());
export function parseBody(schema, req, res) {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details: parsed.error.flatten() } });
    return null;
  }
  return parsed.data;
}
