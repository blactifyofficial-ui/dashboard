export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}

export interface SessionPayload {
  user: SessionUser;
  exp: number; // seconds
  iat: number; // seconds
}

export const SESSION_COOKIE_NAME = 'auth_session';
export const OAUTH_STATE_COOKIE_NAME = 'oauth_state';
export const DEFAULT_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

function getSecretKey(): string {
  return (
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    'blactify-dashboard-secret-key-production-fallback-2026'
  );
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str, 'utf8').toString('base64url');
}

function base64UrlDecode(b64: string): string {
  return Buffer.from(b64, 'base64url').toString('utf8');
}

async function getCryptoKey(usage: KeyUsage[]): Promise<CryptoKey> {
  const secret = getSecretKey();
  const encoder = new TextEncoder();
  return await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    usage
  );
}

/**
 * Creates an HMAC-SHA256 signed session token
 */
export async function signSessionToken(
  user: SessionUser,
  maxAgeSeconds: number = DEFAULT_MAX_AGE_SECONDS
): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + maxAgeSeconds;

  const header = { alg: 'HS256', typ: 'JWT' };
  const payload: SessionPayload = { user, exp, iat };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const key = await getCryptoKey(['sign']);
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(dataToSign)
  );

  const encodedSignature = Buffer.from(signatureBuffer).toString('base64url');
  return `${dataToSign}.${encodedSignature}`;
}

/**
 * Verifies and decodes an HMAC-SHA256 session token
 */
export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const dataToVerify = `${encodedHeader}.${encodedPayload}`;

  try {
    const key = await getCryptoKey(['verify']);
    const signatureBuffer = Buffer.from(encodedSignature, 'base64url');

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBuffer,
      new TextEncoder().encode(dataToVerify)
    );

    if (!isValid) return null;

    const payloadText = base64UrlDecode(encodedPayload);
    const payload: SessionPayload = JSON.parse(payloadText);

    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < now) {
      return null;
    }

    if (!payload.user?.email) {
      return null;
    }

    return payload.user;
  } catch {
    return null;
  }
}

