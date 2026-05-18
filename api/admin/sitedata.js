// ════════════════════════════════════════════
//   /api/admin/sitedata — birleşik ADMIN veri yönetimi
//   ?type=config      GET / POST
//   ?type=categories  GET / POST / PUT / DELETE
//   ?type=gallery     GET / POST / DELETE / PUT(order)
//
//   (3 ayrı admin endpoint birleştirildi — 12-function limiti)
// ════════════════════════════════════════════

import { authedFromHeader } from '../../lib/auth.js';
import {
    loadSiteConfig, sanitizeSiteConfig, SITE_CONFIG_KEY,
    loadCategories, CATEGORIES_KEY, categorySlug,
    loadGallery, GALLERY_KEY,
    productCountsByCategory,
    kvSetJSON, kvAvailable,
} from '../../lib/site-store.js';

function clean(s, max) {
    return typeof s === 'string' ? s.trim().slice(0, max) : '';
}
function newId(prefix) {
    return prefix + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
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
    if (!session) return res.status(401).json({ error: 'Yetki yok. Tekrar giriş yap.' });

    const type = (req.query && req.query.type) || 'config';
    const body = req.body || {};

    try {
        // ════════ SİTE CONFIG ════════
        if (type === 'config') {
            if (req.method === 'GET') {
                return res.status(200).json(await loadSiteConfig());
            }
            if (req.method === 'POST') {
                const sanitized = sanitizeSiteConfig(body);
                await kvSetJSON(SITE_CONFIG_KEY, sanitized);
                return res.status(200).json({ ok: true, config: sanitized });
            }
            return res.status(405).json({ error: 'Method not allowed' });
        }

        // ════════ KATEGORİLER ════════
        if (type === 'categories') {
            if (req.method === 'GET') {
                const categories = await loadCategories();
                const counts = await productCountsByCategory();
                return res.status(200).json({ categories, counts });
            }
            if (req.method === 'POST') {
                const label = clean(body.label, 60);
                if (!label || label.length < 2) {
                    return res.status(400).json({ error: 'Kategori adı gerekli (en az 2 karakter).' });
                }
                const key = categorySlug(label);
                if (!key) return res.status(400).json({ error: 'Geçerli bir kategori adı girin.' });
                const categories = await loadCategories();
                if (categories.some(c => c.key === key)) {
                    return res.status(400).json({ error: 'Bu isimde bir kategori zaten var.' });
                }
                categories.push({ key, label });
                await kvSetJSON(CATEGORIES_KEY, categories);
                return res.status(200).json({ ok: true, categories });
            }
            if (req.method === 'PUT') {
                const key = clean(body.key, 40);
                const label = clean(body.label, 60);
                if (!key || !label || label.length < 2) {
                    return res.status(400).json({ error: 'key ve geçerli label zorunlu.' });
                }
                const categories = await loadCategories();
                const idx = categories.findIndex(c => c.key === key);
                if (idx === -1) return res.status(404).json({ error: 'Kategori bulunamadı.' });
                categories[idx].label = label;
                await kvSetJSON(CATEGORIES_KEY, categories);
                return res.status(200).json({ ok: true, categories });
            }
            if (req.method === 'DELETE') {
                const key = (req.query && req.query.key) || body.key;
                if (!key) return res.status(400).json({ error: 'key zorunlu.' });
                const counts = await productCountsByCategory();
                if (counts[key] > 0) {
                    return res.status(400).json({
                        error: `Bu kategoride ${counts[key]} ürün var. Önce ürünleri silin veya başka kategoriye taşıyın.`,
                    });
                }
                const categories = await loadCategories();
                const filtered = categories.filter(c => c.key !== key);
                if (filtered.length === categories.length) {
                    return res.status(404).json({ error: 'Kategori bulunamadı.' });
                }
                await kvSetJSON(CATEGORIES_KEY, filtered);
                return res.status(200).json({ ok: true, categories: filtered });
            }
            return res.status(405).json({ error: 'Method not allowed' });
        }

        // ════════ MAĞAZA GALERİSİ ════════
        if (type === 'gallery') {
            if (req.method === 'GET') {
                return res.status(200).json({ gallery: await loadGallery() });
            }
            if (req.method === 'POST') {
                const url = clean(body.url, 800);
                if (!url) return res.status(400).json({ error: 'Fotoğraf URL’si zorunlu.' });
                const item = {
                    id: newId('g_'),
                    url,
                    alt: clean(body.alt, 200) || 'Hasburak Sarrafiye mağaza fotoğrafı',
                };
                const gallery = await loadGallery();
                gallery.push(item);
                await kvSetJSON(GALLERY_KEY, gallery);
                return res.status(200).json({ ok: true, item, gallery });
            }
            if (req.method === 'DELETE') {
                const id = (req.query && req.query.id) || body.id;
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
                const order = Array.isArray(body.order) ? body.order : [];
                const gallery = await loadGallery();
                const byId = {};
                gallery.forEach(g => { byId[g.id] = g; });
                const reordered = order.map(id => byId[id]).filter(Boolean);
                gallery.forEach(g => { if (!order.includes(g.id)) reordered.push(g); });
                await kvSetJSON(GALLERY_KEY, reordered);
                return res.status(200).json({ ok: true, gallery: reordered });
            }
            return res.status(405).json({ error: 'Method not allowed' });
        }

        return res.status(400).json({ error: 'Geçersiz type (config | categories | gallery)' });
    } catch (e) {
        console.error('admin/sitedata error:', e);
        return res.status(500).json({ error: e.message || 'Sunucu hatası' });
    }
}
