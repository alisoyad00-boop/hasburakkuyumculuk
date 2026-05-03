// ════════════════════════════════════════════
//   /api/admin/site-config (ADMIN ONLY)
//   GET  → mevcut config
//   POST → tam veya kısmi config güncelleme
// ════════════════════════════════════════════

import { authedFromHeader } from '../../lib/auth.js';
import { kvGetJSON, kvSetJSON, kvAvailable } from '../../lib/kv.js';
import { SITE_CONFIG_KEY, SITE_CONFIG_DEFAULT, loadConfig } from '../site-config.js';

function clean(s, max = 500) {
    return typeof s === 'string' ? s.trim().slice(0, max) : '';
}

function sanitize(input) {
    const cur = input || {};
    const out = {
        banner: { ...SITE_CONFIG_DEFAULT.banner },
        popup: { ...SITE_CONFIG_DEFAULT.popup },
        contact: { ...SITE_CONFIG_DEFAULT.contact },
    };
    if (cur.banner) {
        out.banner.enabled = Boolean(cur.banner.enabled);
        out.banner.text = clean(cur.banner.text, 240);
        out.banner.ctaText = clean(cur.banner.ctaText, 60);
        out.banner.ctaUrl = clean(cur.banner.ctaUrl, 500);
        const validColors = ['gold', 'red', 'green', 'blue'];
        out.banner.color = validColors.includes(cur.banner.color) ? cur.banner.color : 'gold';
        out.banner.dismissible = cur.banner.dismissible !== false;
    }
    if (cur.popup) {
        out.popup.enabled = Boolean(cur.popup.enabled);
        out.popup.title = clean(cur.popup.title, 100);
        out.popup.message = clean(cur.popup.message, 500);
        out.popup.ctaText = clean(cur.popup.ctaText, 60);
        out.popup.ctaUrl = clean(cur.popup.ctaUrl, 500);
        const sec = Number(cur.popup.showAfterSeconds);
        out.popup.showAfterSeconds = Number.isFinite(sec) && sec >= 0 && sec <= 60 ? Math.floor(sec) : 3;
        out.popup.showOncePerSession = cur.popup.showOncePerSession !== false;
    }
    if (cur.contact) {
        out.contact.phone = clean(cur.contact.phone, 30) || SITE_CONFIG_DEFAULT.contact.phone;
        out.contact.whatsapp = clean(cur.contact.whatsapp, 20).replace(/[^0-9]/g, '') || SITE_CONFIG_DEFAULT.contact.whatsapp;
        out.contact.instagram = clean(cur.contact.instagram, 60).replace(/[^a-zA-Z0-9._]/g, '') || SITE_CONFIG_DEFAULT.contact.instagram;
    }
    out.updatedAt = new Date().toISOString();
    return out;
}

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (!kvAvailable()) {
        return res.status(503).json({ error: 'Storage henüz kurulmamış (Vercel KV / Upstash).' });
    }

    const session = authedFromHeader(req);
    if (!session) return res.status(401).json({ error: 'Yetki yok. Tekrar giriş yap.' });

    try {
        if (req.method === 'GET') {
            const config = await loadConfig();
            return res.status(200).json(config);
        }
        if (req.method === 'POST') {
            const body = req.body || {};
            const sanitized = sanitize(body);
            await kvSetJSON(SITE_CONFIG_KEY, sanitized);
            return res.status(200).json({ ok: true, config: sanitized });
        }
        return res.status(405).json({ error: 'Method not allowed' });
    } catch (e) {
        console.error('admin/site-config error:', e);
        return res.status(500).json({ error: e.message || 'Sunucu hatası' });
    }
}
