// Restore original product images from git history
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const oldCommit = '1004cc4';

function getOld(file) {
    return execSync(`git show ${oldCommit}:${file}`, { cwd: repoRoot }).toString('utf8');
}

// ── URUNLER.HTML: map each product name to its original <img> ──
const oldUrunler = getOld('urunler.html');
const imgByName = new Map();

// Match: <div class="product-img-wrap"><img src="..." alt="..." loading="lazy"></div>...<div class="product-name">NAME</div>
const cardRegex = /<div class="product-img-wrap">\s*(<img\s+src="[^"]+"\s+alt="[^"]*"\s+loading="lazy">)\s*<\/div>[\s\S]*?<div class="product-name">([^<]+)<\/div>/g;
let m;
while ((m = cardRegex.exec(oldUrunler))) {
    imgByName.set(m[2].trim(), m[1]);
}
console.log(`Found ${imgByName.size} original product images.`);

// Now read current urunler.html and replace each .product-illustration with the matching <img>
let current = fs.readFileSync(path.join(repoRoot, 'urunler.html'), 'utf8');
let restored = 0;
current = current.replace(
    /<div class="product-img-wrap"><div class="product-illustration[^"]*">[\s\S]*?<\/div><\/div>([\s\S]*?)<div class="product-name">([^<]+)<\/div>/g,
    (match, middle, name) => {
        const img = imgByName.get(name.trim());
        if (!img) { console.log('  no match:', name.trim()); return match; }
        restored++;
        return `<div class="product-img-wrap">${img}</div>${middle}<div class="product-name">${name}</div>`;
    }
);
fs.writeFileSync(path.join(repoRoot, 'urunler.html'), current, 'utf8');
console.log(`Restored ${restored}/42 product images in urunler.html`);

// ── INDEX.HTML: restore split-image ──
const oldIndex = getOld('index.html');
const splitImgIndex = oldIndex.match(/<div class="split-image reveal">\s*(<img[^>]+>)\s*<div class="split-image-caption">([^<]+)<\/div>\s*<\/div>/);
if (splitImgIndex) {
    let currIndex = fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf8');
    currIndex = currIndex.replace(
        /<div class="split-image reveal split-image--svg">[\s\S]*?<div class="split-image-caption">([^<]+)<\/div>\s*<\/div>/,
        `<div class="split-image reveal">\n                    ${splitImgIndex[1]}\n                    <div class="split-image-caption">$1</div>\n                </div>`
    );
    fs.writeFileSync(path.join(repoRoot, 'index.html'), currIndex, 'utf8');
    console.log(`Restored split-image in index.html`);
}

// ── BIZ-KIMIZ.HTML: restore both split-images ──
const oldBiz = getOld('biz-kimiz.html');
const splitMatches = [...oldBiz.matchAll(/<div class="split-image reveal">\s*(<img[^>]+>)\s*<div class="split-image-caption">([^<]+)<\/div>\s*<\/div>/g)];
console.log(`Found ${splitMatches.length} split-images in old biz-kimiz.html`);

if (splitMatches.length >= 1) {
    let currBiz = fs.readFileSync(path.join(repoRoot, 'biz-kimiz.html'), 'utf8');
    let idx = 0;
    currBiz = currBiz.replace(
        /<div class="split-image reveal split-image--svg">[\s\S]*?<div class="split-image-caption">([^<]+)<\/div>\s*<\/div>/g,
        (match, caption) => {
            const old = splitMatches[idx++];
            if (!old) return match;
            return `<div class="split-image reveal">\n                    ${old[1]}\n                    <div class="split-image-caption">${caption}</div>\n                </div>`;
        }
    );
    fs.writeFileSync(path.join(repoRoot, 'biz-kimiz.html'), currBiz, 'utf8');
    console.log(`Restored ${idx} split-images in biz-kimiz.html`);
}
