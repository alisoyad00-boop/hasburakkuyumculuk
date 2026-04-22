// ════════════════════════════════════════════
//   Hasburak Admin — credential check + HMAC-signed token
//   Token format: base64url(payload).base64url(hmac)
//   30-day expiry. No external JWT dependency.
// ════════════════════════════════════════════

import crypto from 'crypto';

const ADMIN_USER = 'hasburakkuyumculuk.admin';
const ADMIN_PASS = 'hbadmin2025';
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function getSecret() {
    // ADMIN_SECRET should be set as an env var in production.
    // Fallback only for local dev — token will be invalidated when env var is added.
    return process.env.ADMIN_SECRET || 'hb-fallback-dev-only-CHANGE-ME-2026';
}

export function checkCreds(username, password) {
    if (typeof username !== 'string' || typeof password !== 'string') return false;
    // Constant-time-ish comparison
    return username.trim() === ADMIN_USER && password === ADMIN_PASS;
}

export function signToken(payload = {}) {
    const data = { ...payload, iat: Date.now() };
    const body = Buffer.from(JSON.stringify(data)).toString('base64url');
    const sig = crypto.createHmac('sha256', getSecret()).update(body).digest('base64url');
    return `${body}.${sig}`;
}

export function verifyToken(token) {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [body, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', getSecret()).update(body).digest('base64url');
    // Use timingSafeEqual to avoid timing attacks
    try {
        const a = Buffer.from(sig, 'base64url');
        const b = Buffer.from(expectedSig, 'base64url');
        if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    } catch {
        return null;
    }
    try {
        const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
        if (!data.iat || (Date.now() - data.iat) > TOKEN_TTL_MS) return null;
        return data;
    } catch {
        return null;
    }
}

export function authedFromHeader(req) {
    const auth = req.headers?.authorization || req.headers?.Authorization || '';
    if (!auth.startsWith('Bearer ')) return null;
    return verifyToken(auth.slice(7).trim());
}
