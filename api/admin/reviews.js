// ════════════════════════════════════════════
//   /api/admin/reviews — yorum yönetimi (ADMIN)
//   GET                     → tüm yorumları döner (her statüde)
//   PATCH ?id=X { action }  → approve | reject | feature | unfeature
//   DELETE ?id=X            → yorumu kalıcı sil
// ════════════════════════════════════════════

import { authedFromHeader } from '../../lib/auth.js';
import { kvAvailable } from '../../lib/kv.js';
import { loadAllReviews, saveAllReviews } from '../reviews.js';

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, DELETE, OPTIONS');
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
