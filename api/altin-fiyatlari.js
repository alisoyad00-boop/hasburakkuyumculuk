// ════════════════════════════════════════════
//   Hasburak — Elbistan Kuyumcular Derneği fiyat proxy
//   GET /api/altin-fiyatlari  →  { updatedAt, prices: [{name, alis, satis}, ...] }
//
//   Kaynak elbistanaltin.com (Joomla, login gerekli, her ~10sn güncelleniyor).
//   Bu endpoint:
//     1. Joomla session cookie'lerini warm instance'ta cache'ler
//     2. CSRF token'ı her login öncesi landing sayfasından çeker
//     3. 30 sn TTL ile fiyatları cache'ler (gereksiz kaynak yükü olmasın)
//     4. Cookie expire olursa otomatik re-login dener
//
//   Vercel ENV vars: ELBISTAN_USER, ELBISTAN_PASS
// ════════════════════════════════════════════

const SOURCE_URL = 'https://elbistanaltin.com/';
const LOGIN_URL = 'https://elbistanaltin.com/index.php';
const RETURN_PARAM = 'aW5kZXgucGhwP0l0ZW1pZD0xMDE='; // base64("index.php?Itemid=101")
const UA = 'Mozilla/5.0 (compatible; HasburakSarrafiye-PriceSync/1.0)';

const CACHE_TTL_MS = 30 * 1000; // 30 sn
const FETCH_TIMEOUT_MS = 8000;

// Warm-instance cache
let cachedCookies = '';      // serialized "name=val; name=val"
let cachedPrices = null;     // { updatedAt, prices }
let cachedAt = 0;

// ────────────────────────────────────────────
//   COOKIE JAR (mini)
// ────────────────────────────────────────────
function parseSetCookies(headers) {
    // Node fetch headers don't expose multiple Set-Cookie nicely; use raw()
    const out = [];
    if (typeof headers.getSetCookie === 'function') {
        for (const c of headers.getSetCookie()) {
            const pair = c.split(';')[0];
            if (pair && pair.includes('=')) out.push(pair);
        }
    } else {
        // Fallback: single set-cookie header
        const sc = headers.get('set-cookie');
        if (sc) {
            for (const c of sc.split(/,(?=\s*\w+=)/)) {
                const pair = c.split(';')[0];
                if (pair && pair.includes('=')) out.push(pair);
            }
        }
    }
    return out;
}

function mergeCookies(existing, fresh) {
    const jar = new Map();
    const parse = (s) => s.split(';').map(x => x.trim()).filter(Boolean);
    for (const pair of [...parse(existing || ''), ...fresh]) {
        const i = pair.indexOf('=');
        if (i > 0) jar.set(pair.slice(0, i), pair.slice(i + 1));
    }
    return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
}

// ────────────────────────────────────────────
//   PARSER
// ────────────────────────────────────────────
function decodeEntities(s) {
    return s
        .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
        .replace(/&amp;/g, '&')
        .replace(/&nbsp;/g, ' ')
        .replace(/&quot;/g, '"');
}

function isLoggedIn(html) {
    return html.includes('Çıkış Yap') || html.includes('Çıkış yap');
}

function extractCsrf(html) {
    const m = html.match(/"csrf\.token":"([a-f0-9]+)"/);
    return m ? m[1] : null;
}

function parsePrices(html) {
    const rows = [];
    const trChunks = html.split(/<\/tr>/i);
    for (const chunk of trChunks) {
        if (!chunk.includes('class="alis"') || !chunk.includes('class="satis"')) continue;
        const nameMatch = chunk.match(/<strong[^>]*>([^<]+)<\/strong>/);
        const alisMatch = chunk.match(/class="alis"[^>]*>([\d\.,]+)</);
        const satisMatch = chunk.match(/class="satis"[^>]*>([\d\.,]+)</);
        if (nameMatch && alisMatch && satisMatch) {
            rows.push({
                name: decodeEntities(nameMatch[1]).trim(),
                alis: alisMatch[1].trim(),
                satis: satisMatch[1].trim(),
            });
        }
    }
    return rows;
}

// ────────────────────────────────────────────
//   LOGIN + FETCH
// ────────────────────────────────────────────
async function fetchWithCookies(url, opts = {}) {
    const headers = {
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml',
        ...(opts.headers || {}),
    };
    if (cachedCookies) headers['Cookie'] = cachedCookies;
    const res = await fetch(url, {
        ...opts,
        headers,
        redirect: 'follow',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    const fresh = parseSetCookies(res.headers);
    if (fresh.length) cachedCookies = mergeCookies(cachedCookies, fresh);
    const html = await res.text();
    return { res, html };
}

async function login(user, pass) {
    // 1. Fresh GET to land + grab CSRF
    cachedCookies = ''; // clean slate
    const landing = await fetchWithCookies(SOURCE_URL);
    const csrf = extractCsrf(landing.html);
    if (!csrf) throw new Error('CSRF token not found on landing page');

    // 2. POST login
    const body = new URLSearchParams({
        username: user,
        password: pass,
        option: 'com_users',
        task: 'user.login',
        return: RETURN_PARAM,
        [csrf]: '1',
    });
    const loginRes = await fetchWithCookies(LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
    });

    if (!isLoggedIn(loginRes.html)) {
        throw new Error('Login failed — credentials rejected or site changed');
    }
    return loginRes.html;
}

async function fetchPriceHTML(user, pass) {
    // Try existing session first (warm instance)
    if (cachedCookies) {
        try {
            const { html } = await fetchWithCookies(SOURCE_URL);
            if (isLoggedIn(html) && html.includes('class="alis"')) return html;
        } catch (e) { /* fall through to re-login */ }
    }
    // Cold or expired → fresh login
    return login(user, pass);
}

// ────────────────────────────────────────────
//   HANDLER
// ────────────────────────────────────────────
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    // Serve from cache if fresh
    const now = Date.now();
    if (cachedPrices && (now - cachedAt) < CACHE_TTL_MS) {
        res.setHeader('Cache-Control', 'public, max-age=15, stale-while-revalidate=60');
        return res.status(200).json({ ...cachedPrices, cached: true });
    }

    const user = process.env.ELBISTAN_USER;
    const pass = process.env.ELBISTAN_PASS;
    if (!user || !pass) {
        return res.status(500).json({
            error: 'ELBISTAN_USER / ELBISTAN_PASS env vars not configured',
            prices: cachedPrices?.prices || [],
        });
    }

    try {
        const html = await fetchPriceHTML(user, pass);
        const prices = parsePrices(html);
        if (!prices.length) {
            // Site shape değişmiş olabilir; cache varsa onu dön
            if (cachedPrices) {
                return res.status(200).json({ ...cachedPrices, stale: true, warning: 'parser-empty' });
            }
            return res.status(502).json({ error: 'parser returned 0 rows', prices: [] });
        }
        cachedPrices = {
            updatedAt: new Date().toISOString(),
            source: 'elbistanaltin.com',
            prices,
        };
        cachedAt = now;
        res.setHeader('Cache-Control', 'public, max-age=15, stale-while-revalidate=60');
        return res.status(200).json(cachedPrices);
    } catch (e) {
        console.error('altin-fiyatlari error:', e.message);
        if (cachedPrices) {
            return res.status(200).json({ ...cachedPrices, stale: true, error: e.message });
        }
        return res.status(502).json({ error: e.message, prices: [] });
    }
}
