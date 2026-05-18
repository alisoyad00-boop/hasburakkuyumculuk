// ════════════════════════════════════════════
//   /api/admin/reviews — yorum yönetimi (ADMIN)
//   GET                     → tüm yorumları döner (her statüde)
//   POST { name, text, ... } → admin elle yorum ekler (direkt onaylı)
//   PATCH ?id=X { action }  → approve | reject | feature | unfeature
//   DELETE ?id=X            → yorumu kalıcı sil
// ════════════════════════════════════════════

import { authedFromHeader } from '../../lib/auth.js';
import { kvAvailable } from '../../lib/kv.js';
import { loadAllReviews, saveAllReviews } from '../reviews.js';

const VALID_CATEGORIES = ['yuzuk', 'kolye', 'kupe', 'bilezik', 'yatirim', 'ozel', 'genel'];

function clean(s, max) {
    return typeof s === 'string' ? s.trim().slice(0, max) : '';
}

function newId() {
    return 'r_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (!kvAvailable()) {
        return res.status(503).json({ error: 'Storage henüz kurulmamış.' });
    }

    const session = authedFromHeader(req);
    if (!session) return res.status(401).json({ error: 'Yetki yok.' });

    try {
        if (req.method === 'GET') {
            const all = await loadAllReviews();
            const sorted = all.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            return res.status(200).json({
                reviews: sorted,
                stats: {
                    total: sorted.length,
                    pending: sorted.filter(r => r.status === 'pending').length,
                    approved: sorted.filter(r => r.status === 'approved').length,
                    featured: sorted.filter(r => r.featured).length,
                    rejected: sorted.filter(r => r.status === 'rejected').length,
                },
            });
        }

        if (req.method === 'POST') {
            const body = req.body || {};
            const name = clean(body.name, 60);
            const text = clean(body.text, 800);
            if (!name || name.length < 2 || !text || text.length < 5) {
                return res.status(400).json({ error: 'İsim ve yorum yazısı gerekli (yorum en az 5 karakter).' });
            }
            const r = Number(body.rating);
            const rating = Number.isFinite(r) && r >= 1 && r <= 5 ? Math.round(r) : 5;
            const review = {
                id: newId(),
                name,
                location: clean(body.location, 80),
                rating,
                text,
                productCategory: VALID_CATEGORIES.includes(body.productCategory) ? body.productCategory : 'genel',
                createdAt: Date.now(),
                status: 'approved',       // admin eklediği yorum direkt onaylı
                featured: Boolean(body.featured),
                addedByAdmin: true,
            };
            const all = await loadAllReviews();
            all.unshift(review);
            await saveAllReviews(all);
            return res.status(200).json({ ok: true, review });
        }

        if (req.method === 'PATCH') {
            const id = (req.query && req.query.id) || (req.body && req.body.id);
            const action = (req.body && req.body.action) || (req.query && req.query.action);
            if (!id || !action) return res.status(400).json({ error: 'id ve action zorunlu.' });
            const all = await loadAllReviews();
            const idx = all.findIndex(r => r.id === id);
            if (idx === -1) return res.status(404).json({ error: 'Yorum bulunamadı.' });

            switch (action) {
                case 'approve':
                    all[idx].status = 'approved';
                    break;
                case 'reject':
                    all[idx].status = 'rejected';
                    all[idx].featured = false;
                    break;
                case 'feature':
                    all[idx].featured = true;
                    if (all[idx].status !== 'approved') all[idx].status = 'approved';
                    break;
                case 'unfeature':
                    all[idx].featured = false;
                    break;
                default:
                    return res.status(400).json({ error: 'Geçersiz action.' });
            }
            all[idx].updatedAt = Date.now();
            await saveAllReviews(all);
            return res.status(200).json({ ok: true, review: all[idx] });
        }

        if (req.method === 'DELETE') {
            const id = (req.query && req.query.id) || (req.body && req.body.id);
            if (!id) return res.status(400).json({ error: 'id zorunlu.' });
            const all = await loadAllReviews();
            const filtered = all.filter(r => r.id !== id);
            if (filtered.length === all.length) {
                return res.status(404).json({ error: 'Yorum bulunamadı.' });
            }
            await saveAllReviews(filtered);
            return res.status(200).json({ ok: true, removed: 1 });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (e) {
        console.error('admin/reviews error:', e);
        return res.status(500).json({ error: e.message || 'Sunucu hatası' });
    }
}
