import crypto from 'node:crypto';

// How long a technician invite link stays valid.
const INVITE_TTL_DAYS = 7;

// Hash a raw token for storage/lookup. We only ever persist the hash, so a DB
// leak can't be turned into usable invite links.
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Mint a new invite token. Returns the raw token (emailed to the technician),
// its hash (stored on the technician row), and the expiry timestamp.
export function generateInviteToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(
    Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();
  return { token, hash: hashToken(token), expiresAt };
}
