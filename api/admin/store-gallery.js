// ════════════════════════════════════════════
//   /api/admin/store-gallery — mağaza galerisi yönetimi (ADMIN)
//   GET                  → mevcut galeri
//   POST { url, alt }    → yeni fotoğraf ekle
//   DELETE ?id=X         → fotoğrafı kaldır
//   PUT  { order: [id]}  → sıralamayı güncelle
// ════════════════════════════════════════════

import { authedFromHeader } from '../../lib/auth.js';
import { kvSetJSON, kvAvailable } from '../../lib/kv.js';
import { loadGallery, GALLERY_KEY } from '../store-gallery.js';

function clean(s, max) {
    return typeof s === 'string' ? s.trim().slice(0, max) : '';
}
function newId() {
    return 'g_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (!kvAvailable()) {
        return res.status(503).json({ error: 'Storage henüz kurulmamış (Vercel KV / Upstash).' });
    }

    const session = authedFromHeader(req);
    if (!session) return res.status(401).json({ error: 'Yetki yok.' });

    try {
        if (req.method === 'GET') {
            const gallery = await loadGallery();
            return res.status(200).json({ gallery });
        }

        if (req.method === 'POST') {
            const body = req.body || {};
            const url = clean(body.url, 800);
            if (!url) return res.status(400).json({ error: 'Fotoğraf URL’si zorunlu.' });
            const item = {
                id: newId(),
                url,
                alt: clean(body.alt, 200) || 'Hasburak Sarrafiye mağaza fotoğrafı',
            };
            const gallery = await loadGallery();
            gallery.push(item);
            await kvSetJSON(GALLERY_KEY, gallery);
            return res.status(200).json({ ok: true, item, gallery });
        }

        if (req.method === 'DELETE') {
            const id = (req.query && req.query.id) || (req.body && req.body.id);
            if (!id) return res.status(400).json({ error: 'id zorunlu.' });
            const gallery = await loadGallery();
            const filtered = gallery.filter(g => g.id !== id);
            if (filtered.length === gallery.length) {
                return res.status(404).json({ error: 'Fotoğraf bulunamadı.' });
            }
            await kvSetJSON(GALLERY_KEY, filtered);
            return res.status(200).json({ ok: true, gallery: filtered });
        }

        if (req.method === 'PUT') {
            const order = (req.body && req.body.order) || [];
            if (!Array.isArray(order)) return res.status(400).json({ error: 'order dizisi zorunlu.' });
            const gallery = await loadGallery();
            const byId = {};
            gallery.forEach(g => { byId[g.id] = g; });
            const reordered = order.map(id => byId[id]).filter(Boolean);
            // Sırada olmayan kalan öğeleri de sona ekle (veri kaybı olmasın)
            gallery.forEach(g => { if (!order.includes(g.id)) reordered.push(g); });
            await kvSetJSON(GALLERY_KEY, reordered);
            return res.status(200).json({ ok: true, gallery: reordered });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (e) {
        console.error('admin/store-gallery error:', e);
        return res.status(500).json({ error: e.message || 'Sunucu hatası' });
    }
}
