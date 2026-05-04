// ════════════════════════════════════════════
//   /api/site-config — site genelinde config (PUBLIC)
//   GET → { banner, popup, contact }
//   Admin yazısı için /api/admin/site-config kullan.
// ════════════════════════════════════════════

import { kvGetJSON, kvAvailable } from '../lib/kv.js';

const KEY = 'hasburak:site-config:v1';

const DEFAULT_CONFIG = {
    banner: {
        enabled: false,
        text: '',
        ctaText: '',
        ctaUrl: '',
        color: 'gold', // gold | red | green | blue
        dismissible: true,
    },
    popup: {
        enabled: false,
        title: '',
        message: '',
        ctaText: '',
        ctaUrl: '',
        showAfterSeconds: 3,
        showOncePerSession: true,
    },
    contact: {
        phone: '+90 547 006 00 46',
        whatsapp: '905470060046',
        instagram: 'hasburakkuyumculuk',
    },
    updatedAt: null,
};

export async function loadConfig() {
    if (!kvAvailable()) return DEFAULT_CONFIG;
    const stored = await kvGetJSON(KEY);
    if (!stored) return DEFAULT_CONFIG;
    // Merge with defaults (yeni alanlar eklendiğinde eski config kırılmasın)
    return {
        banner: { ...DEFAULT_CONFIG.banner, ...(stored.banner || {}) },
        popup: { ...DEFAULT_CONFIG.popup, ...(stored.popup || {}) },
        contact: { ...DEFAULT_CONFIG.contact, ...(stored.contact || {}) },
        updatedAt: stored.updatedAt || null,
    };
}

export const SITE_CONFIG_KEY = KEY;
export const SITE_CONFIG_DEFAULT = DEFAULT_CONFIG;

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const config = await loadConfig();
        return res.status(200).json(config);
    } catch (e) {
        console.error('site-config error:', e);
        // Hata durumunda default'u dön — site asla bu yüzden kırılmasın
        return res.status(200).json(DEFAULT_CONFIG);
    }
}
