// ════════════════════════════════════════════
//   /api/store-gallery — Biz Kimiz mağaza galerisi (PUBLIC)
//   GET → { gallery: [{ id, url, alt }, ...] }
//   Admin yazısı için /api/admin/store-gallery kullan.
// ════════════════════════════════════════════

import { kvGetJSON, kvAvailable } from '../lib/kv.js';

const KEY = 'hasburak:store-gallery:v1';

// KV boşsa gösterilecek varsayılan galeri (mevcut 7 webp)
const DEFAULT_GALLERY = [
    { id: 'def-1', url: 'assets/store/store-1.webp', alt: 'Hasburak Sarrafiye mağaza vitrini' },
    { id: 'def-2', url: 'assets/store/store-2.webp', alt: 'Hasburak Sarrafiye altın takı vitrini' },
    { id: 'def-3', url: 'assets/store/store-3.webp', alt: 'Hasburak Sarrafiye bilezik koleksiyonu' },
    { id: 'def-4', url: 'assets/store/store-4.webp', alt: 'Hasburak Sarrafiye kolye koleksiyonu' },
    { id: 'def-5', url: 'assets/store/store-5.webp', alt: 'Hasburak Sarrafiye mağaza içi' },
    { id: 'def-6', url: 'assets/store/store-6.webp', alt: 'Hasburak Sarrafiye pırlanta vitrini' },
    { id: 'def-7', url: 'assets/store/store-7.webp', alt: 'Hasburak Sarrafiye yatırımlık altın koleksiyonu' },
];

export const GALLERY_KEY = KEY;
export const GALLERY_DEFAULT = DEFAULT_GALLERY;

export async function loadGallery() {
    if (!kvAvailable()) return DEFAULT_GALLERY;
    const stored = await kvGetJSON(KEY);
    // İlk kez: KV boş → default. Admin bir kez kaydedince KV devreye girer.
    if (!Array.isArray(stored)) return DEFAULT_GALLERY;
    return stored;
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const gallery = await loadGallery();
        res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
        return res.status(200).json({ gallery });
    } catch (e) {
        console.error('store-gallery error:', e);
        return res.status(200).json({ gallery: DEFAULT_GALLERY });
    }
}
