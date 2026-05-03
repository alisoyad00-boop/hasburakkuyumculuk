// ════════════════════════════════════════════
//   /api/reviews — yorum sistemi (PUBLIC + write)
//   GET  → onaylı yorumları döner (öne çıkanlar üste)
//   POST → yeni yorum gönder (status=pending, admin onayı gerekli)
//
//   Yorum şeması:
//   { id, name, location, rating, text, productCategory,
//     createdAt, status: pending|approved|rejected, featured: boolean }
//
//   Rate limit: aynı IP'den 1 dakikada 1 yorum
// ════════════════════════════════════════════

import { kvGetJSON, kvSetJSON, kvAvailable } from '../lib/kv.js';

export const REVIEWS_KEY = 'hasburak:reviews:v1';
export const RATE_KEY_PREFIX = 'hasburak:reviews:rate:';

function getClientIp(req) {
    return (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
        || req.headers['x-real-ip']
        || req.socket?.remoteAddress
        || 'unknown';
}

function clean(s, max) {
    return typeof s === 'string' ? s.trim().slice(0, max) : '';
}

function newId() {
    return 'r_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

const VALID_CATEGORIES = ['yuzuk', 'kolye', 'kupe', 'bilezik', 'yatirim', 'ozel', 'genel'];

function sanitize(input) {
    const out = {};
    out.name = clean(input.name, 60);
    out.location = clean(input.location, 80);
    const r = Number(input.rating);
    out.rating = Number.isFinite(r) && r >= 1 && r <= 5 ? Math.round(r) : 5;
    out.text = clean(input.text, 800);
    out.productCategory = VALID_CATEGORIES.includes(input.productCategory) ? input.productCategory : 'genel';
    return out;
}

function isValid(r) {
    return r.name && r.name.length >= 2 && r.text && r.text.length >= 10;
}

export async function loadAllReviews() {
    if (!kvAvailable()) return [];
    const list = await kvGetJSON(REVIEWS_KEY);
    return Array.isArray(list) ? list : [];
}

export async function saveAllReviews(list) {
    return kvSetJSON(REVIEWS_KEY, list);
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (!kvAvailable()) {
        if (req.method === 'GET') {
            return res.status(200).json({ reviews: [] });
        }
        return res.status(503).json({ error: 'Yorum sistemi henüz kurulmamış.' });
    }

    try {
        if (req.method === 'GET') {
            res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
            const all = await loadAllReviews();
            // Public: sadece approved yorumlar; öne çıkanlar üste, sonra tarihe göre yeniden eskiye
            const visible = all
                .filter(r => r.status === 'approved')
                .sort((a, b) => {
                    if (a.featured !== b.featured) return b.featured - a.featured;
                    return (b.createdAt || 0) - (a.createdAt || 0);
                })
                .map(r => ({
                    id: r.id,
                    name: r.name,
                    location: r.location,
                    rating: r.rating,
                    text: r.text,
                    productCategory: r.productCategory,
                    createdAt: r.createdAt,
                    featured: !!r.featured,
                }));
            return res.status(200).json({ reviews: visible });
        }

        if (req.method === 'POST') {
            const body = req.body || {};
            const sanitized = sanitize(body);
            if (!isValid(sanitized)) {
                return res.status(400).json({
                    error: 'İsim ve yorum yazısı gereklidir. Yorum en az 10 karakter olmalı.'
                });
            }

            // Basit IP-bazlı rate limit: aynı IP'den 60 sn'de bir
            const ip = getClientIp(req);
            const rateKey = RATE_KEY_PREFIX + ip;
            const lastTime = await kvGetJSON(rateKey);
            const now = Date.now();
            if (lastTime && (now - Number(lastTime)) < 60_000) {
                return res.status(429).json({
                    error: 'Çok hızlı yorum gönderiyorsunuz. Lütfen biraz bekleyin.'
                });
            }
            await kvSetJSON(rateKey, now);

            const review = {
                ...sanitized,
                id: newId(),
                createdAt: now,
                status: 'pending',
                featured: false,
            };
            const all = await loadAllReviews();
            all.unshift(review);
            // Toplam 500 yorumla sınırla — eski rejected yorumları temizle
            if (all.length > 500) {
                const sorted = all.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                const kept = [];
                for (const r of sorted) {
                    if (kept.length < 500 || r.status !== 'rejected') kept.push(r);
                    if (kept.length >= 500) break;
                }
                await saveAllReviews(kept);
            } else {
                await saveAllReviews(all);
            }

            return res.status(200).json({
                ok: true,
                message: 'Yorumun alındı! Onaylandıktan sonra sitede yayınlanacak.',
            });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (e) {
        console.error('reviews error:', e);
        return res.status(500).json({ error: e.message || 'Sunucu hatası' });
    }
}
