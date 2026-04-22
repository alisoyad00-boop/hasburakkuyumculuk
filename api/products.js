// ════════════════════════════════════════════
//   GET /api/products  (public)
//   Returns: { products, categories }
//   Falls back to seed if KV is unavailable, so the site never looks empty.
// ════════════════════════════════════════════

import { kvGetJSON, kvSetJSON, kvAvailable } from '../lib/kv.js';
import { SEED_PRODUCTS, CATEGORIES } from '../lib/seed.js';

const KEY = 'hasburak:products:v1';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Short edge cache so the public page is snappy but admin edits show within ~10s
    res.setHeader('Cache-Control', 'public, max-age=10, s-maxage=20, stale-while-revalidate=60');

    let products;
    try {
        if (kvAvailable()) {
            const stored = await kvGetJSON(KEY);
            if (Array.isArray(stored) && stored.length) {
                products = stored;
            } else {
                // First-ever request — bootstrap the store with the 45 seed products
                products = SEED_PRODUCTS.slice();
                try { await kvSetJSON(KEY, products); }
                catch (e) { console.warn('seed write failed:', e.message); }
            }
        } else {
            // KV not configured yet — serve seed so the page still works
            products = SEED_PRODUCTS.slice();
        }
    } catch (e) {
        console.error('products GET error:', e);
        products = SEED_PRODUCTS.slice();
    }

    return res.status(200).json({
        products,
        categories: CATEGORIES,
        seeded: !kvAvailable(),
    });
}
