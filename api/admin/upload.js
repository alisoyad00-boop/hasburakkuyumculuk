// ════════════════════════════════════════════
//   POST /api/admin/upload
//   Body: raw file bytes (Content-Type = image/*)
//   Headers: x-filename = original filename (optional)
//   Returns: { url, pathname, contentType, size }
//   Auth required.
//   Storage: Vercel Blob (public access)
// ════════════════════════════════════════════

import { put } from '@vercel/blob';
import { authedFromHeader } from '../../lib/auth.js';

export const config = {
    api: {
        bodyParser: false, // we read the raw stream
    },
};

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB cap (Vercel Hobby plan = 4.5 MB hard limit per request)
const ALLOWED_TYPES = new Set([
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'
]);

function sanitizeFilename(name) {
    if (!name || typeof name !== 'string') return 'image';
    return name
        .replace(/[^a-zA-Z0-9._-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^[-.]+|[-.]+$/g, '')
        .slice(0, 80) || 'image';
}

function extFromContentType(ct) {
    if (!ct) return 'bin';
    if (ct === 'image/jpeg') return 'jpg';
    if (ct === 'image/png') return 'png';
    if (ct === 'image/webp') return 'webp';
    if (ct === 'image/gif') return 'gif';
    if (ct === 'image/avif') return 'avif';
    return 'bin';
}

async function readRawBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        let total = 0;
        req.on('data', (chunk) => {
            total += chunk.length;
            if (total > MAX_BYTES) {
                reject(new Error('FILE_TOO_LARGE'));
                req.destroy();
                return;
            }
            chunks.push(chunk);
        });
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
}

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-filename');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return res.status(503).json({
            error: 'Vercel Blob henüz bağlanmamış. Storage > Blob > Connect to Project yap.'
        });
    }

    const session = authedFromHeader(req);
    if (!session) {
        return res.status(401).json({ error: 'Oturum bulunamadı.' });
    }

    const contentType = (req.headers['content-type'] || '').toLowerCase();
    if (!ALLOWED_TYPES.has(contentType)) {
        return res.status(400).json({
            error: `Geçersiz dosya türü (${contentType || 'belirsiz'}). Yalnızca JPG, PNG, WEBP, GIF veya AVIF kabul edilir.`
        });
    }

    let body;
    try {
        body = await readRawBody(req);
    } catch (e) {
        if (e.message === 'FILE_TOO_LARGE') {
            return res.status(413).json({ error: 'Dosya çok büyük (en fazla 4 MB).' });
        }
        return res.status(400).json({ error: 'Dosya okunamadı.' });
    }

    if (!body || body.length === 0) {
        return res.status(400).json({ error: 'Dosya boş.' });
    }

    const rawName = req.headers['x-filename'] || '';
    const ext = extFromContentType(contentType);
    const baseName = sanitizeFilename(rawName.replace(/\.[^.]+$/, '')) || 'image';
    const ts = Date.now();
    const rand = Math.random().toString(36).slice(2, 8);
    const pathname = `urunler/${ts}-${rand}-${baseName}.${ext}`;

    try {
        const blob = await put(pathname, body, {
            access: 'public',
            contentType,
            addRandomSuffix: false, // we already added randomness
        });
        return res.status(200).json({
            url: blob.url,
            pathname: blob.pathname,
            contentType,
            size: body.length,
        });
    } catch (e) {
        console.error('blob put error:', e);
        return res.status(500).json({ error: 'Yükleme başarısız: ' + (e.message || 'bilinmeyen hata') });
    }
}
