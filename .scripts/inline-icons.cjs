// Rewrite urunler.html to embed inline SVG icons directly (no JS dependency)
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'urunler.html');

const ICONS = {
    ring: `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" class="prod-svg"><defs><linearGradient id="ring-g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#F8E9B6"/><stop offset="50%" stop-color="#D4AF37"/><stop offset="100%" stop-color="#9A7A14"/></linearGradient></defs><ellipse cx="100" cy="135" rx="58" ry="55" fill="none" stroke="url(#ring-g)" stroke-width="6"/><ellipse cx="100" cy="135" rx="46" ry="44" fill="none" stroke="url(#ring-g)" stroke-width="1.5" opacity="0.5"/><path d="M70 78 L78 60 L122 60 L130 78 L116 92 L84 92 Z" fill="url(#ring-g)"/><path d="M100 50 L108 68 L100 82 L92 68 Z" fill="#FFF7D6" opacity="0.95"/><circle cx="100" cy="68" r="2.5" fill="#FFF" opacity="0.7"/></svg>`,

    diamond: `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" class="prod-svg"><defs><linearGradient id="dia-g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#F8E9B6"/><stop offset="50%" stop-color="#D4AF37"/><stop offset="100%" stop-color="#9A7A14"/></linearGradient><linearGradient id="dia-s" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.95"/><stop offset="50%" stop-color="#E0F0FF" stop-opacity="0.85"/><stop offset="100%" stop-color="#A0C0E0" stop-opacity="0.6"/></linearGradient></defs><ellipse cx="100" cy="155" rx="56" ry="52" fill="none" stroke="url(#dia-g)" stroke-width="6"/><path d="M70 70 L100 35 L130 70 L100 130 Z" fill="url(#dia-s)"/><path d="M70 70 L130 70 L100 90 Z" fill="url(#dia-s)" opacity="0.7"/><path d="M70 70 L100 90 L100 130 Z" fill="#000" opacity="0.18"/><path d="M70 70 L100 35 L100 90 Z" fill="#FFF" opacity="0.25"/></svg>`,

    necklace: `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" class="prod-svg"><defs><linearGradient id="nec-g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#F8E9B6"/><stop offset="50%" stop-color="#D4AF37"/><stop offset="100%" stop-color="#9A7A14"/></linearGradient></defs><path d="M30 50 Q100 130 170 50" fill="none" stroke="url(#nec-g)" stroke-width="2.5"/><path d="M30 50 Q100 135 170 50" fill="none" stroke="url(#nec-g)" stroke-width="1" opacity="0.4" stroke-dasharray="2 3"/><circle cx="100" cy="155" r="22" fill="url(#nec-g)"/><path d="M100 142 L108 155 L100 168 L92 155 Z" fill="#FFF7D6" opacity="0.9"/><circle cx="30" cy="50" r="3" fill="url(#nec-g)"/><circle cx="170" cy="50" r="3" fill="url(#nec-g)"/></svg>`,

    earring: `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" class="prod-svg"><defs><linearGradient id="ear-g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#F8E9B6"/><stop offset="50%" stop-color="#D4AF37"/><stop offset="100%" stop-color="#9A7A14"/></linearGradient></defs><g transform="translate(70 0)"><circle cx="0" cy="60" r="22" fill="none" stroke="url(#ear-g)" stroke-width="5"/><line x1="0" y1="38" x2="0" y2="22" stroke="url(#ear-g)" stroke-width="2"/><circle cx="0" cy="20" r="3" fill="url(#ear-g)"/><path d="M-8 78 L8 78 L0 138 Z" fill="url(#ear-g)"/></g><g transform="translate(130 0)"><circle cx="0" cy="60" r="22" fill="none" stroke="url(#ear-g)" stroke-width="5"/><line x1="0" y1="38" x2="0" y2="22" stroke="url(#ear-g)" stroke-width="2"/><circle cx="0" cy="20" r="3" fill="url(#ear-g)"/><path d="M-8 78 L8 78 L0 138 Z" fill="url(#ear-g)"/></g></svg>`,

    bracelet: `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" class="prod-svg"><defs><linearGradient id="brc-g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#F8E9B6"/><stop offset="50%" stop-color="#D4AF37"/><stop offset="100%" stop-color="#9A7A14"/></linearGradient></defs><ellipse cx="100" cy="110" rx="78" ry="48" fill="none" stroke="url(#brc-g)" stroke-width="9"/><ellipse cx="100" cy="110" rx="66" ry="38" fill="none" stroke="url(#brc-g)" stroke-width="2" opacity="0.55"/><circle cx="100" cy="62" r="9" fill="url(#brc-g)"/><path d="M100 53 L106 62 L100 71 L94 62 Z" fill="#FFF7D6" opacity="0.9"/><circle cx="22" cy="110" r="4" fill="url(#brc-g)"/><circle cx="178" cy="110" r="4" fill="url(#brc-g)"/></svg>`,

    bangle: `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" class="prod-svg"><defs><linearGradient id="bng-g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#F8E9B6"/><stop offset="50%" stop-color="#D4AF37"/><stop offset="100%" stop-color="#9A7A14"/></linearGradient></defs><ellipse cx="100" cy="100" rx="72" ry="68" fill="none" stroke="url(#bng-g)" stroke-width="14"/><ellipse cx="100" cy="100" rx="58" ry="54" fill="none" stroke="url(#bng-g)" stroke-width="2" opacity="0.5"/><ellipse cx="100" cy="100" rx="86" ry="80" fill="none" stroke="url(#bng-g)" stroke-width="1" opacity="0.3"/></svg>`,

    goldbar: `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" class="prod-svg"><defs><linearGradient id="gb-g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#F8E9B6"/><stop offset="50%" stop-color="#D4AF37"/><stop offset="100%" stop-color="#9A7A14"/></linearGradient></defs><path d="M40 70 L160 70 L172 88 L172 142 L160 160 L40 160 L28 142 L28 88 Z" fill="url(#gb-g)"/><path d="M40 70 L160 70 L172 88 L28 88 Z" fill="#FFF" opacity="0.18"/><path d="M40 160 L160 160 L172 142 L28 142 Z" fill="#000" opacity="0.18"/><text x="100" y="120" text-anchor="middle" font-family="serif" font-size="22" fill="#5C4910" font-weight="700">999.9</text></svg>`,

    watch: `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" class="prod-svg"><defs><linearGradient id="wch-g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#F8E9B6"/><stop offset="50%" stop-color="#D4AF37"/><stop offset="100%" stop-color="#9A7A14"/></linearGradient></defs><circle cx="100" cy="110" r="56" fill="url(#wch-g)"/><circle cx="100" cy="110" r="48" fill="#0A1442"/><circle cx="100" cy="110" r="48" fill="none" stroke="url(#wch-g)" stroke-width="1.5" opacity="0.6"/><line x1="100" y1="110" x2="100" y2="78" stroke="url(#wch-g)" stroke-width="3" stroke-linecap="round"/><line x1="100" y1="110" x2="124" y2="110" stroke="url(#wch-g)" stroke-width="2" stroke-linecap="round"/><circle cx="100" cy="110" r="3" fill="url(#wch-g)"/><path d="M82 56 L88 30 L112 30 L118 56 Z" fill="url(#wch-g)"/><path d="M82 164 L118 164 L112 190 L88 190 Z" fill="url(#wch-g)"/></svg>`,

    crown: `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" class="prod-svg"><defs><linearGradient id="crn-g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#F8E9B6"/><stop offset="50%" stop-color="#D4AF37"/><stop offset="100%" stop-color="#9A7A14"/></linearGradient></defs><path d="M40 150 L36 80 L72 110 L100 60 L128 110 L164 80 L160 150 Z" fill="url(#crn-g)"/><path d="M40 150 L160 150 L156 168 L44 168 Z" fill="url(#crn-g)"/><circle cx="36" cy="76" r="6" fill="url(#crn-g)"/><circle cx="100" cy="56" r="7" fill="url(#crn-g)"/><circle cx="164" cy="76" r="6" fill="url(#crn-g)"/><circle cx="100" cy="130" r="6" fill="#FFF7D6" opacity="0.9"/></svg>`,

    ornament: `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" class="prod-svg"><defs><linearGradient id="orn-g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#F8E9B6"/><stop offset="50%" stop-color="#D4AF37"/><stop offset="100%" stop-color="#9A7A14"/></linearGradient></defs><g transform="translate(100 110)"><circle cx="0" cy="-50" r="4" fill="url(#orn-g)"/><path d="M0 -46 L6 -32 L0 -22 L-6 -32 Z" fill="url(#orn-g)"/><path d="M0 -22 C 5 -10, 8 8, 0 24 C -8 8, -5 -10, 0 -22 Z" fill="url(#orn-g)"/><path d="M-8 0 C -22 4, -34 4, -42 -2 C -32 -4, -18 -4, -8 0 Z" fill="url(#orn-g)"/><path d="M8 0 C 22 4, 34 4, 42 -2 C 32 -4, 18 -4, 8 0 Z" fill="url(#orn-g)"/><circle cx="-58" cy="-2" r="3" fill="url(#orn-g)"/><circle cx="58" cy="-2" r="3" fill="url(#orn-g)"/></g></svg>`,
};

function tagToIcon(tag, name) {
    const t = (tag + ' ' + name).toLocaleLowerCase('tr');
    if (t.includes('saat')) return 'watch';
    if (t.includes('yatırım') || t.includes('ziynet') || t.includes('çeyrek')) return 'goldbar';
    if (t.includes('pırlanta') || t.includes('tek taş') || t.includes('akik')) return 'diamond';
    if (t.includes('küpe')) return 'earring';
    if (t.includes('kolye') || t.includes('set') || t.includes('zincir') || t.includes('su yolu') || t.includes('akıtma') || t.includes('singapur') || t.includes('karzai')) return 'necklace';
    if (t.includes('bilezik') || t.includes('trabzon')) return 'bangle';
    if (t.includes('bileklik') || t.includes('kelepçe')) return 'bracelet';
    if (t.includes('taç') || t.includes('kemer') || t.includes('hızma') || t.includes('ayakkabı') || t.includes('aksesuar') || t.includes('künye')) return 'crown';
    if (t.includes('yöresel') || t.includes('şahmeran') || t.includes('özel')) return 'ornament';
    return 'ring';
}

let html = fs.readFileSync(FILE, 'utf8');
let count = 0;

// Match each product card and replace its <img> with appropriate inline SVG
html = html.replace(
    /<a href="iletisim\.html" class="product-card reveal">\s*<div class="product-img-wrap">\s*<img\s+src="https:\/\/[^"]+"\s+alt="[^"]*"\s+loading="lazy">\s*<\/div>\s*<div class="product-tag">([^<]+)<\/div>([\s\S]*?)<div class="product-name">([^<]+)<\/div>/g,
    (match, tag, middle, name) => {
        count++;
        const key = tagToIcon(tag, name);
        return `<a href="iletisim.html" class="product-card reveal">
                        <div class="product-img-wrap"><div class="product-illustration product-illustration--${key}">${ICONS[key]}</div></div>
                        <div class="product-tag">${tag}</div>${middle}<div class="product-name">${name}</div>`;
    }
);

fs.writeFileSync(FILE, html, 'utf8');
console.log(`Replaced ${count} product images with inline SVG icons.`);
