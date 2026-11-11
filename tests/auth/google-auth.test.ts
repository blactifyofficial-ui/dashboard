import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  signSessionToken,
  verifySessionToken,
  SESSION_COOKIE_NAME,
  DEFAULT_MAX_AGE_SECONDS,
} from '../../src/lib/auth/token';

describe('Direct Google Auth - Token Engine', () => {
  it('should sign and verify a session token correctly', async () => {
    const user = {
      id: 'test-user-uuid-1234',
      email: 'blactifyofficial@gmail.com',
      name: 'Blactify Admin',
      image: 'https://lh3.googleusercontent.com/test.png',
    };

    const token = await signSessionToken(user);
    assert.ok(token);
    assert.strictEqual(typeof token, 'string');
    assert.strictEqual(token.split('.').length, 3);

    const verifiedUser = await verifySessionToken(token);
    assert.ok(verifiedUser);
    assert.strictEqual(verifiedUser.id, user.id);
    assert.strictEqual(verifiedUser.email, user.email);
    assert.strictEqual(verifiedUser.name, user.name);
    assert.strictEqual(verifiedUser.image, user.image);
  });

  it('should reject tampered session tokens', async () => {
    const user = {
      id: 'legit-user',
      email: 'blactifyofficial@gmail.com',
      name: 'Legit User',
    };

    const token = await signSessionToken(user);
    const [header, payload, signature] = token.split('.');

    // Tamper payload to change user email
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    decodedPayload.user.email = 'attacker@evil.com';
    const tamperedPayload = Buffer.from(JSON.stringify(decodedPayload)).toString('base64url');

    const tamperedToken = `${header}.${tamperedPayload}.${signature}`;
    const result = await verifySessionToken(tamperedToken);
    assert.strictEqual(result, null);
  });

  it('should reject expired session tokens', async () => {
    const user = {
      id: 'expired-user',
      email: 'expired@example.com',
      name: 'Expired User',
    };

    // Sign with negative maxAge to simulate expiration
    const expiredToken = await signSessionToken(user, -10);
    const result = await verifySessionToken(expiredToken);
    assert.strictEqual(result, null);
  });

  it('should reject invalid or garbage tokens gracefully', async () => {
    assert.strictEqual(await verifySessionToken(''), null);
    assert.strictEqual(await verifySessionToken('invalid.token'), null);
    assert.strictEqual(await verifySessionToken('not-even-a-jwt'), null);
  });
});

