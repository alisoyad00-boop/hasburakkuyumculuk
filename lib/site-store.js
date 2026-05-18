// ════════════════════════════════════════════
//   Hasburak — Site veri katmanı (KV helper'ları)
//   site-config, categories, store-gallery için ortak KV mantığı.
//   lib/ altındaki dosyalar Vercel'de serverless function SAYILMAZ —
//   bu yüzden helper'ları buraya topladık (12-function limiti).
// ════════════════════════════════════════════

import { kvGetJSON, kvSetJSON, kvAvailable } from './kv.js';
import { CATEGORIES } from './seed.js';

// ──────────── SİTE CONFIG (banner + popup + iletişim) ────────────
export const SITE_CONFIG_KEY = 'hasburak:site-config:v1';

export const SITE_CONFIG_DEFAULT = {
    banner: {
        enabled: false, text: '', ctaText: '', ctaUrl: '',
        color: 'gold', dismissible: true,
    },
    popup: {
        enabled: false, title: '', message: '', ctaText: '', ctaUrl: '',
        showAfterSeconds: 3, showOncePerSession: true,
    },
    contact: {
        phone: '+90 547 006 00 46',
        whatsapp: '905470060046',
        instagram: 'hasburakkuyumculuk',
    },
    updatedAt: null,
};

export async function loadSiteConfig() {
    if (!kvAvailable()) return SITE_CONFIG_DEFAULT;
    const stored = await kvGetJSON(SITE_CONFIG_KEY);
    if (!stored) return SITE_CONFIG_DEFAULT;
    return {
        banner: { ...SITE_CONFIG_DEFAULT.banner, ...(stored.banner || {}) },
        popup: { ...SITE_CONFIG_DEFAULT.popup, ...(stored.popup || {}) },
        contact: { ...SITE_CONFIG_DEFAULT.contact, ...(stored.contact || {}) },
        updatedAt: stored.updatedAt || null,
    };
}

function clean(s, max = 500) {
    return typeof s === 'string' ? s.trim().slice(0, max) : '';
}

export function sanitizeSiteConfig(input) {
    const cur = input || {};
    const out = {
        banner: { ...SITE_CONFIG_DEFAULT.banner },
        popup: { ...SITE_CONFIG_DEFAULT.popup },
        contact: { ...SITE_CONFIG_DEFAULT.contact },
    };
    if (cur.banner) {
        out.banner.enabled = Boolean(cur.banner.enabled);
        out.banner.text = clean(cur.banner.text, 240);
        out.banner.ctaText = clean(cur.banner.ctaText, 60);
        out.banner.ctaUrl = clean(cur.banner.ctaUrl, 500);
        const validColors = ['gold', 'red', 'green', 'blue'];
        out.banner.color = validColors.includes(cur.banner.color) ? cur.banner.color : 'gold';
        out.banner.dismissible = cur.banner.dismissible !== false;
    }
    if (cur.popup) {
        out.popup.enabled = Boolean(cur.popup.enabled);
        out.popup.title = clean(cur.popup.title, 100);
        out.popup.message = clean(cur.popup.message, 500);
        out.popup.ctaText = clean(cur.popup.ctaText, 60);
        out.popup.ctaUrl = clean(cur.popup.ctaUrl, 500);
        const sec = Number(cur.popup.showAfterSeconds);
        out.popup.showAfterSeconds = Number.isFinite(sec) && sec >= 0 && sec <= 60 ? Math.floor(sec) : 3;
        out.popup.showOncePerSession = cur.popup.showOncePerSession !== false;
    }
    if (cur.contact) {
        out.contact.phone = clean(cur.contact.phone, 30) || SITE_CONFIG_DEFAULT.contact.phone;
        out.contact.whatsapp = clean(cur.contact.whatsapp, 20).replace(/[^0-9]/g, '') || SITE_CONFIG_DEFAULT.contact.whatsapp;
        out.contact.instagram = clean(cur.contact.instagram, 60).replace(/[^a-zA-Z0-9._]/g, '') || SITE_CONFIG_DEFAULT.contact.instagram;
    }
    out.updatedAt = new Date().toISOString();
    return out;
}

// ──────────── KATEGORİLER ────────────
export const CATEGORIES_KEY = 'hasburak:categories:v1';

export async function loadCategories() {
    if (!kvAvailable()) return CATEGORIES.slice();
    const stored = await kvGetJSON(CATEGORIES_KEY);
    if (!Array.isArray(stored) || !stored.length) return CATEGORIES.slice();
    return stored;
}

export function categorySlug(s) {
    return String(s || '')
        .toLocaleLowerCase('tr')
        .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
        .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40);
}

// ──────────── MAĞAZA GALERİSİ ────────────
export const GALLERY_KEY = 'hasburak:store-gallery:v1';

export const GALLERY_DEFAULT = [
    { id: 'def-1', url: 'assets/store/store-1.webp', alt: 'Hasburak Sarrafiye mağaza vitrini' },
    { id: 'def-2', url: 'assets/store/store-2.webp', alt: 'Hasburak Sarrafiye altın takı vitrini' },
    { id: 'def-3', url: 'assets/store/store-3.webp', alt: 'Hasburak Sarrafiye bilezik koleksiyonu' },
    { id: 'def-4', url: 'assets/store/store-4.webp', alt: 'Hasburak Sarrafiye kolye koleksiyonu' },
    { id: 'def-5', url: 'assets/store/store-5.webp', alt: 'Hasburak Sarrafiye mağaza içi' },
    { id: 'def-6', url: 'assets/store/store-6.webp', alt: 'Hasburak Sarrafiye pırlanta vitrini' },
    { id: 'def-7', url: 'assets/store/store-7.webp', alt: 'Hasburak Sarrafiye yatırımlık altın koleksiyonu' },
];

export async function loadGallery() {
    if (!kvAvailable()) return GALLERY_DEFAULT;
    const stored = await kvGetJSON(GALLERY_KEY);
    if (!Array.isArray(stored)) return GALLERY_DEFAULT;
    return stored;
}

// Ürün sayıları (kategori silme kontrolü için)
export async function productCountsByCategory() {
    const products = await kvGetJSON('hasburak:products:v1');
    const counts = {};
    if (Array.isArray(products)) {
        products.forEach(p => {
            if (p && p.category) counts[p.category] = (counts[p.category] || 0) + 1;
        });
    }
    return counts;
}

export { kvSetJSON, kvAvailable };
