#!/usr/bin/env node
// Replace all <img> URLs in urunler.html with verified Pexels jewelry photos.
// Unverified product types reuse a semantically-close verified URL.
// SVG fallback still kicks in on load error via main.js.

const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'urunler.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Verified Pexels URLs (from WebFetch-verified research)
const V = {
    alyans:          'https://images.pexels.com/photos/2219195/pexels-photo-2219195.jpeg?auto=compress&cs=tinysrgb&w=600&h=750&fit=crop',
    gundelik_yuzuk:  'https://images.pexels.com/photos/1395306/pexels-photo-1395306.jpeg?auto=compress&cs=tinysrgb&w=600&h=750&fit=crop',
    tek_tas:         'https://images.pexels.com/photos/14058109/pexels-photo-14058109.jpeg?auto=compress&cs=tinysrgb&w=600&h=750&fit=crop',
    pirlanta:        'https://images.pexels.com/photos/6098251/pexels-photo-6098251.jpeg?auto=compress&cs=tinysrgb&w=600&h=750&fit=crop',
    erkek_yuzuk:     'https://images.pexels.com/photos/29918365/pexels-photo-29918365.jpeg?auto=compress&cs=tinysrgb&w=600&h=750&fit=crop',
    sahmeran:        'https://images.pexels.com/photos/265906/pexels-photo-265906.jpeg?auto=compress&cs=tinysrgb&w=600&h=750&fit=crop',
    alyans_14ayar:   'https://images.pexels.com/photos/230290/pexels-photo-230290.jpeg?auto=compress&cs=tinysrgb&w=600&h=750&fit=crop',
    gundelik_14ayar: 'https://images.pexels.com/photos/56926/pexels-photo-56926.jpeg?auto=compress&cs=tinysrgb&w=600&h=750&fit=crop',
    minila_eklem:    'https://images.pexels.com/photos/1616096/pexels-photo-1616096.jpeg?auto=compress&cs=tinysrgb&w=600&h=750&fit=crop',
    kolye_uclari:    'https://images.pexels.com/photos/39239/pendulum-cone-chain-gold-39239.jpeg?auto=compress&cs=tinysrgb&w=600&h=750&fit=crop',
    gundelik_kolye:  'https://images.pexels.com/photos/13292666/pexels-photo-13292666.jpeg?auto=compress&cs=tinysrgb&w=600&h=750&fit=crop',
    set_kolye:       'https://images.pexels.com/photos/3641059/pexels-photo-3641059.jpeg?auto=compress&cs=tinysrgb&w=600&h=750&fit=crop',
    su_yolu_kolye:   'https://images.pexels.com/photos/7407595/pexels-photo-7407595.png?auto=compress&cs=tinysrgb&w=600&h=750&fit=crop',
    singapur_kolye:  'https://images.pexels.com/photos/14111396/pexels-photo-14111396.jpeg?auto=compress&cs=tinysrgb&w=600&h=750&fit=crop',
    kolye:           'https://images.pexels.com/photos/19869445/pexels-photo-19869445.jpeg?auto=compress&cs=tinysrgb&w=600&h=750&fit=crop',
    kupe:            'https://images.pexels.com/photos/3266700/pexels-photo-3266700.jpeg?auto=compress&cs=tinysrgb&w=600&h=750&fit=crop',
    halka_kupe:      'https://images.pexels.com/photos/12144990/pexels-photo-12144990.jpeg?auto=compress&cs=tinysrgb&w=600&h=750&fit=crop',
    sallama_kupe:    'https://images.pexels.com/photos/32989030/pexels-photo-32989030.jpeg?auto=compress&cs=tinysrgb&w=600&h=750&fit=crop',
    bileklik:        'https://images.pexels.com/photos/12194316/pexels-photo-12194316.jpeg?auto=compress&cs=tinysrgb&w=600&h=750&fit=crop',
    bilezik:         'https://images.pexels.com/photos/1444441/pexels-photo-1444441.jpeg?auto=compress&cs=tinysrgb&w=600&h=750&fit=crop',
    trabzon_hasiri:  'https://images.pexels.com/photos/8183950/pexels-photo-8183950.jpeg?auto=compress&cs=tinysrgb&w=600&h=750&fit=crop',
    kelepce:         'https://images.pexels.com/photos/5370647/pexels-photo-5370647.jpeg?auto=compress&cs=tinysrgb&w=600&h=750&fit=crop',
    yatirimlik_altin:'https://images.pexels.com/photos/8442325/pexels-photo-8442325.jpeg?auto=compress&cs=tinysrgb&w=600&h=750&fit=crop',
    ziynet:          'https://images.pexels.com/photos/8442322/pexels-photo-8442322.jpeg?auto=compress&cs=tinysrgb&w=600&h=750&fit=crop',
    erkek_bileklik:  'https://images.pexels.com/photos/36129405/pexels-photo-36129405.jpeg?auto=compress&cs=tinysrgb&w=600&h=750&fit=crop',
    erkek_zincir:    'https://images.pexels.com/photos/6404217/pexels-photo-6404217.jpeg?auto=compress&cs=tinysrgb&w=600&h=750&fit=crop',
    saat:            'https://images.pexels.com/photos/1034065/pexels-photo-1034065.jpeg?auto=compress&cs=tinysrgb&w=600&h=750&fit=crop',
    tac:             'https://images.pexels.com/photos/248077/pexels-photo-248077.jpeg?auto=compress&cs=tinysrgb&w=600&h=750&fit=crop',
    ozel_tasarim:    'https://images.pexels.com/photos/20858959/pexels-photo-20858959.jpeg?auto=compress&cs=tinysrgb&w=600&h=750&fit=crop',
    yoresel:         'https://images.pexels.com/photos/16918130/pexels-photo-16918130.jpeg?auto=compress&cs=tinysrgb&w=600&h=750&fit=crop',
};

// Map each product (identified by its alt text) → verified URL
// Unverified products reuse a semantically-similar verified image
const map = {
    'Alyans':                    V.alyans,
    'Gündelik Yüzük':            V.gundelik_yuzuk,
    'Tek Taş Yüzük':             V.tek_tas,
    'Akik ve Doğal Taş':         V.gundelik_yuzuk,   // reuse (gem ring)
    'Pırlanta Yüzük':            V.pirlanta,
    'Erkek Yüzük':               V.erkek_yuzuk,
    'Minila Eklem Yüzükleri':    V.minila_eklem,
    'Şahmeran':                  V.sahmeran,
    '14 Ayar Alyans':            V.alyans_14ayar,
    '14 Ayar Gündelik Yüzük':    V.gundelik_14ayar,
    '14 Ayar Tek Taş':           V.tek_tas,
    'Kolye Uçları':              V.kolye_uclari,
    'Gündelik Kolyeler':         V.gundelik_kolye,
    'Set Kolyeler':              V.set_kolye,
    'Karzai Kolye':              V.kolye,
    'Akıtma Kolye':              V.kolye,
    'Su Yolu Kolye':             V.su_yolu_kolye,
    'Singapur Kolye':            V.singapur_kolye,
    'Kolye Modelleri':           V.kolye,
    'Küpe':                      V.kupe,
    'Halka Küpeler':             V.halka_kupe,
    'Yapıştırma Küpe':           V.kupe,
    'Sallama Küpe':              V.sallama_kupe,
    'Bileklik':                  V.bileklik,
    'Bilezik':                   V.bilezik,
    'Trabzon Hasırı':            V.trabzon_hasiri,
    'Kelepçe':                   V.kelepce,
    'Çocuk Künyesi':             V.kolye_uclari,    // reuse (pendant)
    'Çocuk Küpesi':              V.kupe,            // reuse (earring)
    'Çocuk Bilezikleri':         V.bileklik,        // reuse (thin bracelet)
    'Hızma':                     V.kupe,            // reuse (small stud)
    'Kemer Modelleri':           V.tac,             // reuse (ornate)
    'Altın Ayakkabı':            V.ozel_tasarim,    // reuse (ornate display)
    'Taç Modelleri':             V.tac,
    'Yatırımlık Bilezik':        V.yatirimlik_altin,
    'Ziynet Altın':              V.ziynet,
    'Saat Modelleri':            V.saat,
    'Erkek Bileklik':            V.erkek_bileklik,
    'Erkek Zincir':              V.erkek_zincir,
    'Yöresel Ürünler':           V.yoresel,
    'Özel Tasarım':              V.ozel_tasarim,
};

// Replace each <img> based on alt attribute
let replaced = 0;
const imgRegex = /<img\s+src="https:\/\/images\.unsplash\.com\/photo-[^"]+"\s+width="600"\s+height="750"\s+decoding="async"\s+alt="([^"]+)"\s+loading="lazy"\s*>/g;

html = html.replace(imgRegex, (match, alt) => {
    const url = map[alt];
    if (!url) {
        console.warn(`[WARN] no mapping for alt="${alt}", leaving as-is`);
        return match;
    }
    replaced++;
    return `<img src="${url}" width="600" height="750" decoding="async" alt="${alt}" loading="lazy">`;
});

fs.writeFileSync(htmlPath, html);
console.log(`[OK] replaced ${replaced} image URLs in urunler.html`);
