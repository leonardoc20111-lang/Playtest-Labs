import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  if (!stored) return false;
  const [scheme, salt, hash] = stored.split(':');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  const derived = scryptSync(password, salt, KEY_LENGTH);
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

const REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Human-friendly, collision-resistant booking reference, e.g. PL-7K4M9Q. */
export function generateBookingReference(): string {
  const bytes = randomBytes(6);
  let out = '';
  for (let i = 0; i < 6; i += 1) out += REF_ALPHABET[bytes[i] % REF_ALPHABET.length];
  return `PL-${out}`;
}
