// ════════════════════════════════════════════
//   /api/admin/categories — kategori yönetimi (ADMIN)
//   GET                  → kategoriler + her birinin ürün sayısı
//   POST { label }       → yeni kategori ekle (key otomatik slug)
//   PUT  { key, label }  → kategori adını düzenle
//   DELETE ?key=X        → kategori sil (içinde ürün varsa reddedilir)
// ════════════════════════════════════════════

import { authedFromHeader } from '../../lib/auth.js';
import { kvGetJSON, kvSetJSON, kvAvailable } from '../../lib/kv.js';
import { loadCategories, CATEGORIES_KEY } from '../categories.js';

const PRODUCTS_KEY = 'hasburak:products:v1';

function clean(s, max) {
    return typeof s === 'string' ? s.trim().slice(0, max) : '';
}

// Türkçe-duyarlı slug — kategori key'i için
function slugify(s) {
    return String(s || '')
        .toLocaleLowerCase('tr')
        .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
        .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40);
}

async function productCounts() {
    const products = await kvGetJSON(PRODUCTS_KEY);
    const counts = {};
    if (Array.isArray(products)) {
        products.forEach(p => {
            if (p && p.category) counts[p.category] = (counts[p.category] || 0) + 1;
        });
    }
    return counts;
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
            const categories = await loadCategories();
            const counts = await productCounts();
            return res.status(200).json({ categories, counts });
        }

        if (req.method === 'POST') {
            const label = clean(req.body && req.body.label, 60);
            if (!label || label.length < 2) {
                return res.status(400).json({ error: 'Kategori adı gerekli (en az 2 karakter).' });
            }
            const key = slugify(label);
            if (!key) {
                return res.status(400).json({ error: 'Geçerli bir kategori adı girin.' });
            }
            const categories = await loadCategories();
            if (categories.some(c => c.key === key)) {
                return res.status(400).json({ error: 'Bu isimde bir kategori zaten var.' });
            }
            categories.push({ key, label });
            await kvSetJSON(CATEGORIES_KEY, categories);
            return res.status(200).json({ ok: true, categories });
        }

        if (req.method === 'PUT') {
            const key = clean(req.body && req.body.key, 40);
            const label = clean(req.body && req.body.label, 60);
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
            const key = (req.query && req.query.key) || (req.body && req.body.key);
            if (!key) return res.status(400).json({ error: 'key zorunlu.' });
            // Bu kategoride ürün varsa silinmesini engelle (veri kaybı olmasın)
            const counts = await productCounts();
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
    } catch (e) {
        console.error('admin/categories error:', e);
        return res.status(500).json({ error: e.message || 'Sunucu hatası' });
    }
}
