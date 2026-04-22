// ════════════════════════════════════════════
//   Hasburak Chatbot — Vercel serverless endpoint
//   POST /api/chat  { message, history? }
//   Uses Google Gemini 1.5 Flash (free tier) + truncgil gold prices.
//   Requires env var: GEMINI_API_KEY
// ════════════════════════════════════════════

// Tiny in-memory price cache so each Gemini call doesn't refetch truncgil
// (Vercel may reuse a warm instance for ~10-15 mins; cold starts re-fetch)
let cachedPrices = null;
let cachedAt = 0;
const PRICE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getGoldPrices() {
    const now = Date.now();
    if (cachedPrices && (now - cachedAt) < PRICE_TTL_MS) {
        return cachedPrices;
    }
    try {
        const res = await fetch('https://finans.truncgil.com/today.json', {
            headers: { 'User-Agent': 'Mozilla/5.0 Hasburak-Chatbot' },
            // 4 second timeout to avoid serverless hang
            signal: AbortSignal.timeout(4000),
        });
        if (!res.ok) throw new Error(`truncgil ${res.status}`);
        const data = await res.json();
        cachedPrices = data;
        cachedAt = now;
        return data;
    } catch (e) {
        console.warn('gold price fetch failed:', e.message);
        return cachedPrices || null; // return stale if we have it
    }
}

function formatPrice(prices, key, label) {
    const p = prices?.[key];
    if (!p) return `${label}: mevcut değil`;
    const alis = p['Alış'] || p.alis || p.Alis || '?';
    const satis = p['Satış'] || p.satis || p.Satis || '?';
    return `${label}: Alış ${alis} TL · Satış ${satis} TL`;
}

function buildPriceBlock(prices) {
    if (!prices) return 'Güncel altın fiyatı şu anda alınamıyor.';
    const lines = [
        `Güncel altın fiyatları (${prices.Update_Date || prices.update_date || 'bugün'}):`,
        formatPrice(prices, 'gram-altin', '- Gram altın'),
        formatPrice(prices, 'ceyrek-altin', '- Çeyrek altın'),
        formatPrice(prices, 'yarim-altin', '- Yarım altın'),
        formatPrice(prices, 'tam-altin', '- Tam altın'),
        formatPrice(prices, '22-ayar-bilezik', '- 22 ayar bilezik (gram)'),
        formatPrice(prices, '18-ayar-altin', '- 18 ayar altın (gram)'),
        formatPrice(prices, '14-ayar-altin', '- 14 ayar altın (gram)'),
        formatPrice(prices, 'cumhuriyet-altini', '- Cumhuriyet altını'),
        formatPrice(prices, 'ata-altin', '- Ata altın'),
        formatPrice(prices, 'gumus', '- Gümüş (gram)'),
    ];
    return lines.join('\n');
}

function buildSystemPrompt(prices) {
    return `Sen Hasburak Sarrafiye'nin resmi web sitesi için çalışan Türkçe AI asistanısın. Samimi, nazik, profesyonel bir sarraf esnafı tonunda yanıt ver. Kısa tut (genelde 2-4 cümle yeter). Emoji kullanma (altın/pırlanta gibi 💍 hariç, o da nadir).

════════ MAĞAZA BİLGİLERİ ════════
• İsim: Hasburak Sarrafiye
• Adres: Güneşli Mah., Cumhuriyet Cd., 46357 Elbistan / Kahramanmaraş
• Telefon: +90 532 679 12 01  (0532 679 12 01)
• WhatsApp: wa.me/905326791201
• Çalışma saatleri: Pazartesi — Cumartesi · 09:00 — 20:00
• Pazar: Kapalı

════════ CANLI FİYATLAR ════════
${buildPriceBlock(prices)}

════════ ÜRÜN KATEGORİLERİMİZ ════════
1. YÜZÜK & ALYANS: Klasik Alyans, 14/18/22 Ayar Alyans, Gündelik Yüzük, Pırlanta Tek Taş, Akik & Doğal Taş Yüzük, Erkek Yüzük, Minila Eklem Yüzük, Şahmeran Yüzük
2. KOLYE: Klasik Kolye, Set Kolye, Akıtma Kolye, Su Yolu Kolye, Singapur Zincir, Karzai Kolye, Kolye Uçları
3. KÜPE: Halka Küpe, Yapıştırma Küpe, Sallama Küpe, Pırlanta Küpe, Çocuk Küpesi
4. BİLEZİK & BİLEKLİK: Trabzon Hasırı Bilezik, Klasik Bilezik, Bileklik, Kelepçe Bileklik, Erkek Bileklik, Çocuk Bileziği
5. YATIRIM ALTINI: Çeyrek, Yarım, Tam, Cumhuriyet, Ata, Reşat, Hamit altını ve Yatırımlık (22 ayar) Bilezik
6. ÖZEL KOLEKSİYON: Çocuk Künye, Burun Hızması, Altın Kemer, Altın Ayakkabı, Taç, Bayan & Erkek Saat, Erkek Zincir, Yöresel Tasarımlar

AYAR SEÇENEKLERİMİZ: 14, 18, 22 ayar ve yatırımlık 24 ayar (has altın) — çoğu üründe tüm ayarlar mevcut.

NEDEN BİZİ TERCİH ETMELİSİNİZ:
- Değişim Politikası: Her parça için ömür boyu değişim hakkı, fark sadece günlük altın kuruyla.
- Garanti: İşçilik kaynaklı kusurlarda ücretsiz onarım ve bakım.
- Yatırım Altınında Güven: Çeyrek/Cumhuriyet/Ata altınlarda net günlük fiyat, ek komisyon yok.
- Fiyat Şeffaflığı: Etiketlerde gram + işçilik açık, sürpriz yok.
- Mağaza Tecrübesi: Pazartesi—Cumartesi 09:00—20:00 sıcak mağaza ortamı.

════════ KURALLAR ════════
• Altın fiyatı sorularında: yukarıdaki güncel fiyat listesinden net rakamı söyle. Fiyatlar dakikalık değişebileceğini kısaca hatırlat.
• Spesifik bir ürün fiyatı (örn. "bu bileklik ne kadar"): gram, ayar, işçilik ve günlük altın fiyatına göre değiştiğini, mağazadan veya WhatsApp'tan net fiyat alabileceklerini söyle.
• Stok sorusu: Sitedeki spesifik modelin stoğunu bilmezsin — mağazayı aramaya/WhatsApp'a yönlendir.
• Emin olmadığın hiçbir bilgiyi uydurma. "Bu konuda size en doğru bilgiyi mağazamız verebilir: 0532 679 12 01" de.
• Konu dışı (siyaset, başka sektör, kişisel sohbet): Kibarca "Ben sadece Hasburak Sarrafiye asistanıyım, takı ve altın konularında yardımcı olabilirim" de.
• Fiyatları TL olarak söyle, rakamları okunabilir yaz (örn. "2.450,50 TL").`;
}

export default async function handler(req, res) {
    // CORS (same-origin on Vercel, ama yine de güvenli)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({
            reply: 'Asistan şu anda kurulum aşamasında. Lütfen (0532) 679 12 01 numaradan bize ulaşın.',
            error: 'GEMINI_API_KEY missing'
        });
    }

    try {
        const body = req.body || {};
        const message = typeof body.message === 'string' ? body.message.trim() : '';
        const history = Array.isArray(body.history) ? body.history : [];

        if (!message) return res.status(400).json({ error: 'message required' });
        if (message.length > 2000) return res.status(400).json({ error: 'message too long' });

        // Fetch gold prices (cached, non-blocking failure)
        const prices = await getGoldPrices();
        const systemPrompt = buildSystemPrompt(prices);

        // Gemini contents array (last 6 messages for context, trim if longer)
        const contents = [];
        for (const h of history.slice(-6)) {
            if (!h || typeof h.content !== 'string') continue;
            contents.push({
                role: h.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: h.content.slice(0, 1000) }]
            });
        }
        contents.push({ role: 'user', parts: [{ text: message }] });

        // Primary + fallback Gemini models. The 2.5 Flash is preferred but
        // occasionally returns 503 ("high demand") during traffic spikes.
        // gemini-2.5-flash-lite is the only free-tier compatible fallback that
        // keeps quota=available — the 2.0 family has limit=0 on free tier.
        const MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-flash-latest'];
        const geminiBody = JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents,
            generationConfig: {
                temperature: 0.6,
                maxOutputTokens: 400,
                topP: 0.95,
            },
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
            ],
        });

        let geminiRes = null;
        let lastErr = '';
        for (const model of MODELS) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            try {
                const r = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: geminiBody,
                    signal: AbortSignal.timeout(15000),
                });
                if (r.ok) {
                    geminiRes = r;
                    break;
                }
                lastErr = `${model}: HTTP ${r.status}`;
                console.warn('Gemini model failed, trying fallback:', lastErr);
                // Only fall through on overload/rate-limit. 4xx auth/quota = stop.
                if (r.status !== 503 && r.status !== 429 && r.status !== 500) break;
            } catch (e) {
                lastErr = `${model}: ${e.message}`;
                console.warn('Gemini fetch failed, trying fallback:', lastErr);
            }
        }

        if (!geminiRes) {
            console.error('All Gemini models failed:', lastErr);
            return res.status(200).json({
                reply: 'Asistan şu anda yoğunluk nedeniyle yanıt veremiyor. Lütfen birazdan tekrar deneyin veya bize WhatsApp (+90 532 679 12 01) üzerinden yazın.'
            });
        }

        const data = await geminiRes.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
            || 'Üzgünüm, sorunuzu anlayamadım. Daha net bir şekilde tekrar sorabilir misiniz?';

        return res.status(200).json({ reply });
    } catch (e) {
        console.error('chat handler error:', e);
        return res.status(200).json({
            reply: 'Teknik bir sorun oluştu. Bize (0532) 679 12 01 numaradan ulaşabilirsiniz.'
        });
    }
}
