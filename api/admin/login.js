// ════════════════════════════════════════════
//   POST /api/admin/login
//   Body: { username, password }
//   Returns: { token } on success, 401 otherwise
// ════════════════════════════════════════════

import { checkCreds, signToken } from '../../lib/auth.js';

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(200).end();
    }
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const body = req.body || {};
        const username = typeof body.username === 'string' ? body.username : '';
        const password = typeof body.password === 'string' ? body.password : '';

        if (!checkCreds(username, password)) {
            // Tiny artificial delay to make brute force less attractive
            await new Promise(r => setTimeout(r, 400));
            return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı.' });
        }

        const token = signToken({ sub: username });
        return res.status(200).json({ token, expiresInDays: 30 });
    } catch (e) {
        console.error('login error:', e);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
}
