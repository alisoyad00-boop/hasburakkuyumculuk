// ════════════════════════════════════════════
//   /api/admin/products  (auth required)
//   GET    → list everything (admin view)
//   POST   → add new product
//   PUT    → update existing product (body: { id, ...fields })
//   DELETE → remove product (?id=xxx or body { id })
// ════════════════════════════════════════════

import { authedFromHeader } from '../../lib/auth.js';
import { kvGetJSON, kvSetJSON, kvAvailable } from '../../lib/kv.js';
import { SEED_PRODUCTS } from '../../lib/seed.js';
import { loadCategories } from '../categories.js';

const KEY = 'hasburak:products:v1';

function sanitizeProduct(input, existing = {}, validCats) {
    const out = { ...existing };
    if (typeof input.name === 'string') out.name = input.name.trim().slice(0, 120);
    if (typeof input.tag === 'string') out.tag = input.tag.trim().slice(0, 60);
    if (typeof input.category === 'string' && validCats.has(input.category)) {
        out.category = input.category;
    }
    if (typeof input.image === 'string') out.image = input.image.trim().slice(0, 800);
    if (typeof input.alt === 'string') out.alt = input.alt.trim().slice(0, 200);
    return out;
}

function newId() {
    return 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

async function loadAll() {
    let list = await kvGetJSON(KEY);
    if (!Array.isArray(list)) {
        // First-time bootstrap: seed defaults into KV
        list = SEED_PRODUCTS.slice();
        await kvSetJSON(KEY, list);
    }
    return list;
}

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (!kvAvailable()) {
        return res.status(503).json({
            error: 'Storage henüz kurulmamış. Vercel dashboard → Storage → Upstash Redis bağlantısını yap.'
        });
    }

    const session = authedFromHeader(req);
    if (!session) {
        return res.status(401).json({ error: 'Oturum bulunamadı veya süresi dolmuş. Tekrar giriş yap.' });
    }

    try {
        // Geçerli kategoriler her istekte dinamik yüklenir (admin kategori ekleyebilir)
        const categories = await loadCategories();
        const validCats = new Set(categories.map(c => c.key));

        if (req.method === 'GET') {
            const list = await loadAll();
            return res.status(200).json({ products: list, categories });
        }

        if (req.method === 'POST') {
            const body = req.body || {};
            if (!body.name || !body.category || !body.image) {
                return res.status(400).json({ error: 'name, category ve image zorunlu.' });
            }
            if (!validCats.has(body.category)) {
                return res.status(400).json({ error: 'Geçersiz kategori.' });
            }
            const list = await loadAll();
            const product = sanitizeProduct(body, {
                id: newId(),
                createdAt: Date.now(),
            }, validCats);
            // Default alt to name if not provided
            if (!product.alt) product.alt = product.name;
            list.unshift(product); // newest first
            await kvSetJSON(KEY, list);
            return res.status(200).json({ product });
        }

        if (req.method === 'PUT') {
            const body = req.body || {};
            const id = body.id;
            if (!id) return res.status(400).json({ error: 'id zorunlu.' });
            const list = await loadAll();
            const idx = list.findIndex(p => p.id === id);
            if (idx === -1) return res.status(404).json({ error: 'Ürün bulunamadı.' });
            list[idx] = sanitizeProduct(body, list[idx], validCats);
            list[idx].updatedAt = Date.now();
            await kvSetJSON(KEY, list);
            return res.status(200).json({ product: list[idx] });
        }

        if (req.method === 'DELETE') {
            const id = (req.query && req.query.id) || (req.body && req.body.id);
            if (!id) return res.status(400).json({ error: 'id zorunlu.' });
            const list = await loadAll();
            const filtered = list.filter(p => p.id !== id);
            if (filtered.length === list.length) {
                return res.status(404).json({ error: 'Ürün bulunamadı.' });
            }
            await kvSetJSON(KEY, filtered);
            return res.status(200).json({ removed: 1 });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (e) {
        console.error('admin/products error:', e);
        return res.status(500).json({ error: e.message || 'Sunucu hatası.' });
    }
}
