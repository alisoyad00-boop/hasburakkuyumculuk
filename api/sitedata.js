// ════════════════════════════════════════════
//   /api/sitedata — birleşik PUBLIC veri uç noktası
//   GET ?type=config     → banner + popup + iletişim
//   GET ?type=categories → ürün kategorileri
//   GET ?type=gallery    → mağaza galerisi
//
//   (3 ayrı endpoint birleştirildi — Vercel Hobby 12-function limiti)
// ════════════════════════════════════════════

import { loadSiteConfig, loadCategories, loadGallery, SITE_CONFIG_DEFAULT, GALLERY_DEFAULT } from '../lib/site-store.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const type = (req.query && req.query.type) || 'config';

    try {
        if (type === 'config') {
            const config = await loadSiteConfig();
            res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
            return res.status(200).json(config);
        }
        if (type === 'categories') {
            const categories = await loadCategories();
            res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
            return res.status(200).json({ categories });
        }
        if (type === 'gallery') {
            const gallery = await loadGallery();
            res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
            return res.status(200).json({ gallery });
        }
        return res.status(400).json({ error: 'Geçersiz type (config | categories | gallery)' });
    } catch (e) {
        console.error('sitedata error:', e);
        // Hata durumunda güvenli varsayılan dön — site asla bu yüzden kırılmasın
        if (type === 'categories') return res.status(200).json({ categories: [] });
        if (type === 'gallery') return res.status(200).json({ gallery: GALLERY_DEFAULT });
        return res.status(200).json(SITE_CONFIG_DEFAULT);
    }
}
