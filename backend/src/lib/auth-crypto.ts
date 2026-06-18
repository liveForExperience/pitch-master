import { createHash, randomBytes } from 'node:crypto';

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function generateShortCode(length = 6): string {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return out;
}

export function generateAdminToken(): string {
  return `tok_${randomBytes(32).toString('base64url')}`;
}

export function generatePin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function hashAdminToken(adminToken: string, pin: string): string {
  return createHash('sha256').update(`${adminToken}${pin}`).digest('hex');
}

export function verifyAdminToken(
  adminToken: string,
  pin: string,
  storedHash: string,
): boolean {
  return hashAdminToken(adminToken, pin) === storedHash;
}
