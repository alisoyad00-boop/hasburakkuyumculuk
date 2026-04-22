// ════════════════════════════════════════════
//   Hasburak — Upstash Redis REST helpers
//   Works with both Vercel KV (Upstash-backed) and direct Upstash Redis.
//   Required env vars: KV_REST_API_URL, KV_REST_API_TOKEN
//   No SDK needed — pure fetch.
// ════════════════════════════════════════════

const URL_BASE = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';

export function kvAvailable() {
    return Boolean(URL_BASE && TOKEN);
}

async function call(method, pathSegments, body) {
    if (!kvAvailable()) throw new Error('KV_NOT_CONFIGURED');
    const url = `${URL_BASE}/${pathSegments.map(encodeURIComponent).join('/')}`;
    const init = {
        method,
        headers: { Authorization: `Bearer ${TOKEN}` },
        signal: AbortSignal.timeout(8000),
    };
    if (body !== undefined) {
        init.headers['Content-Type'] = 'application/json';
        init.body = typeof body === 'string' ? body : JSON.stringify(body);
    }
    const r = await fetch(url, init);
    if (!r.ok) {
        const txt = await r.text().catch(() => '');
        throw new Error(`KV ${method} ${pathSegments[0]} ${r.status}: ${txt.slice(0, 200)}`);
    }
    return r.json();
}

export async function kvGetJSON(key) {
    try {
        const { result } = await call('GET', ['get', key]);
        if (!result) return null;
        if (typeof result === 'string') {
            try { return JSON.parse(result); } catch { return result; }
        }
        return result;
    } catch (e) {
        if (e.message === 'KV_NOT_CONFIGURED') return null;
        throw e;
    }
}

export async function kvSetJSON(key, value) {
    const stringified = JSON.stringify(value);
    return call('POST', ['set', key], stringified);
}

export async function kvDel(key) {
    return call('POST', ['del', key]);
}
