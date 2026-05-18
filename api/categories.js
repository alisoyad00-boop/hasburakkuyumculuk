// ════════════════════════════════════════════
//   /api/categories — ürün kategorileri (PUBLIC)
//   GET → { categories: [{ key, label }, ...] }
//   Admin yazısı için /api/admin/categories kullan.
// ════════════════════════════════════════════

import { kvGetJSON, kvAvailable } from '../lib/kv.js';
import { CATEGORIES } from '../lib/seed.js';

const KEY = 'hasburak:categories:v1';

export const CATEGORIES_KEY = KEY;

export async function loadCategories() {
    if (!kvAvailable()) return CATEGORIES.slice();
    const stored = await kvGetJSON(KEY);
    // İlk kez: KV boş → seed kategoriler. Admin değiştirince KV devreye girer.
    if (!Array.isArray(stored) || !stored.length) return CATEGORIES.slice();
    return stored;
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const categories = await loadCategories();
        res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
        return res.status(200).json({ categories });
    } catch (e) {
        console.error('categories error:', e);
        return res.status(200).json({ categories: CATEGORIES.slice() });
    }
}
