import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const PREFIX = 'enc1';

function getKey() {
  const hex = process.env.TOKEN_ENCRYPTION_KEY;
  if (!hex) throw new Error('TOKEN_ENCRYPTION_KEY is not set');
  const key = Buffer.from(hex, 'hex');
  if (key.length !== 32) throw new Error('TOKEN_ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  return key;
}

/**
 * Encrypt a plaintext token string.
 * Returns null if value is null/undefined.
 * Format: enc1:<iv_hex>:<authTag_hex>:<ciphertext_hex>
 */
export function encryptToken(plaintext) {
  if (plaintext == null) return null;
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${PREFIX}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypt a token stored by encryptToken.
 * If the value does not start with the enc1: prefix, it is returned as-is
 * (backward compatibility for existing plaintext rows).
 * Returns null if value is null/undefined.
 */
export function decryptToken(stored) {
  if (stored == null) return null;
  if (!stored.startsWith(`${PREFIX}:`)) {
    // Legacy plaintext row — return as-is so existing sessions keep working
    return stored;
  }
  const rest = stored.slice(PREFIX.length + 1);
  const colon1 = rest.indexOf(':');
  const colon2 = rest.indexOf(':', colon1 + 1);
  if (colon1 === -1 || colon2 === -1) throw new Error('Malformed encrypted token');
  const iv = Buffer.from(rest.slice(0, colon1), 'hex');
  const authTag = Buffer.from(rest.slice(colon1 + 1, colon2), 'hex');
  const enc = Buffer.from(rest.slice(colon2 + 1), 'hex');
  const key = getKey();
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(enc) + decipher.final('utf8');
}
