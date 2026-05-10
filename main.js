// ════════════════════════════════════════════
//   HASBURAK SARRAFİYE — Interactions
// ════════════════════════════════════════════

const isCoarsePointer = matchMedia('(pointer: coarse)').matches;
const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ════════════════════════════════════════════
//   CRITICAL: Mobile menu init FIRST
//   (must work even if any other script later throws on iOS Safari)
// ════════════════════════════════════════════
(function initMobileMenu() {
    function bind() {
        const hamburger = document.getElementById('hamburger');
        const mobileMenu = document.getElementById('mobileMenu');
        if (!hamburger || !mobileMenu) return;
        if (hamburger.dataset.bound === '1') return;
        hamburger.dataset.bound = '1';

        // Sağ üste kapatma butonu enjekte et — iPhone'da hamburger
        // bazen mobile-menu altında kalıp tıklanamıyordu. Net bir X olsun.
        if (!mobileMenu.querySelector('.mobile-menu-close')) {
            const closeBtn = document.createElement('button');
            closeBtn.type = 'button';
            closeBtn.className = 'mobile-menu-close';
            closeBtn.setAttribute('aria-label', 'Menüyü kapat');
            closeBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            `;
            mobileMenu.insertBefore(closeBtn, mobileMenu.firstChild);
        }

        function close() {
            mobileMenu.classList.remove('open');
            hamburger.classList.remove('active');
            document.body.style.overflow = '';
        }
        function toggle(e) {
            if (e) e.preventDefault();
            const isOpen = mobileMenu.classList.toggle('open');
            hamburger.classList.toggle('active', isOpen);
            document.body.style.overflow = isOpen ? 'hidden' : '';
        }

        // Hamburger: click only (works on all touch devices for buttons)
        hamburger.addEventListener('click', toggle);

        // X butonu kapatır
        mobileMenu.querySelector('.mobile-menu-close')?.addEventListener('click', close);

        // Menu links: native navigation. Just reset body scroll on click —
        // page change will tear the menu down anyway. NEVER preventDefault.
        mobileMenu.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => {
                document.body.style.overflow = '';
            });
        });

        // ESC tuşu (klavyeli kullanıcılar için) ve menünün boş alanına tıklama
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mobileMenu.classList.contains('open')) close();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bind);
    } else {
        bind();
    }
})();

// ─── PAGE ENTRY ───
if (!prefersReduced) document.body.classList.add('page-enter');

// ════════════════════════════════════════════
//   HERO BEAMS — gold/amber animated light beams (canvas)
//   Fixes:
//   - Dropped ctx.filter (double-blur with CSS killed perf, froze animation)
//   - Faster, higher-opacity beams so motion is actually visible
//   - Width-only resize detection: iOS URL bar height changes no longer
//     reset beams while scrolling
// ════════════════════════════════════════════
function initHeroBeams() {
    const canvas = document.getElementById('heroBeams');
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const isMobile = window.innerWidth <= 768 || isCoarsePointer;
    const BEAM_COUNT = isMobile ? 8 : 16;
    const DPR_CAP   = isMobile ? 1 : 2;

    let beams = [];
    let W = 0, H = 0, dpr = 1;
    let lastStableWidth = 0;

    function createBeam() {
        return {
            x: Math.random() * W,
            y: Math.random() * H * 1.2,
            width: 80 + Math.random() * 140,
            length: H * 1.8 + 200,
            angle: -32 + Math.random() * 14,
            speed: 1.4 + Math.random() * 1.6,
            opacity: 0.28 + Math.random() * 0.22,
            // warm gold hue range
            hue: 38 + Math.random() * 18,
            sat: 85 + Math.random() * 10,
            light: 58 + Math.random() * 10,
            pulse: Math.random() * Math.PI * 2,
            pulseSpeed: 0.015 + Math.random() * 0.02,
        };
    }

    function resetBeam(b) {
        b.y = H + 100;
        b.x = Math.random() * W;
        b.width = 80 + Math.random() * 140;
        b.speed = 1.4 + Math.random() * 1.6;
        b.hue = 38 + Math.random() * 18;
        b.opacity = 0.28 + Math.random() * 0.22;
    }

    // Full size + beam rebuild (called on first layout, width change, orientation change)
    function rebuild() {
        const parent = canvas.parentElement;
        W = parent.clientWidth;
        H = parent.clientHeight;
        dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        lastStableWidth = W;
        beams = Array.from({ length: BEAM_COUNT }, createBeam);
    }

    // Height-only update: stretches canvas without destroying beam state
    // (iOS URL bar show/hide fires resize; full rebuild there causes visible reset)
    function adjustHeight() {
        const parent = canvas.parentElement;
        const newH = parent.clientHeight;
        if (newH === H) return;
        H = newH;
        canvas.height = H * dpr;
        canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function drawBeam(b) {
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate((b.angle * Math.PI) / 180);

        const pulsing = b.opacity * (0.75 + Math.sin(b.pulse) * 0.25);
        const grad = ctx.createLinearGradient(0, 0, 0, b.length);
        const col = `${b.hue}, ${b.sat}%, ${b.light}%`;

        grad.addColorStop(0,    `hsla(${col}, 0)`);
        grad.addColorStop(0.15, `hsla(${col}, ${pulsing * 0.55})`);
        grad.addColorStop(0.50, `hsla(${col}, ${pulsing})`);
        grad.addColorStop(0.85, `hsla(${col}, ${pulsing * 0.55})`);
        grad.addColorStop(1,    `hsla(${col}, 0)`);

        ctx.fillStyle = grad;
        ctx.fillRect(-b.width / 2, 0, b.width, b.length);
        ctx.restore();
    }

    let running = true;
    function frame() {
        if (!running) return;
        ctx.clearRect(0, 0, W, H);
        for (let i = 0; i < beams.length; i++) {
            const b = beams[i];
            b.y -= b.speed;
            b.pulse += b.pulseSpeed;
            if (b.y + b.length < 0) resetBeam(b);
            drawBeam(b);
        }
        requestAnimationFrame(frame);
    }

    rebuild();
    requestAnimationFrame(frame);

    // Only rebuild on actual width change — height-only changes (iOS URL bar)
    // just adjust the canvas without resetting beams
    let resizeTimer;
    window.addEventListener('resize', () => {
        const newW = canvas.parentElement.clientWidth;
        if (newW !== lastStableWidth) {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(rebuild, 200);
        } else {
            adjustHeight();
        }
    }, { passive: true });

    window.addEventListener('orientationchange', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(rebuild, 250);
    });

    // Pause when hero off-screen
    const visObs = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
            if (!running) { running = true; requestAnimationFrame(frame); }
        } else {
            running = false;
        }
    }, { threshold: 0 });
    visObs.observe(canvas.parentElement);

    // Pause when tab hidden
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            running = false;
        } else if (!running) {
            running = true;
            requestAnimationFrame(frame);
        }
    });
}

// Hero beams — reduced-motion users get nothing, everyone else gets the show
if (!prefersReduced) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHeroBeams);
    } else {
        initHeroBeams();
    }
}

// ════════════════════════════════════════════
//   PRODUCT INLINE SVG ILLUSTRATIONS
//   (no external network dependency — works on every device)
// ════════════════════════════════════════════

const HB_GOLD = `<defs>
    <linearGradient id="g_gold_${Math.random().toString(36).slice(2,8)}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#F8E9B6"/>
        <stop offset="50%" stop-color="#D4AF37"/>
        <stop offset="100%" stop-color="#9A7A14"/>
    </linearGradient>
</defs>`;

const ICONS = {
    ring: `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#F8E9B6"/><stop offset="50%" stop-color="#D4AF37"/><stop offset="100%" stop-color="#9A7A14"/></linearGradient></defs><ellipse cx="100" cy="135" rx="58" ry="55" fill="none" stroke="url(#rg)" stroke-width="6"/><ellipse cx="100" cy="135" rx="46" ry="44" fill="none" stroke="url(#rg)" stroke-width="1.5" opacity="0.5"/><path d="M70 78 L78 60 L122 60 L130 78 L116 92 L84 92 Z" fill="url(#rg)"/><path d="M100 50 L108 68 L100 82 L92 68 Z" fill="#FFF7D6" opacity="0.95"/><circle cx="100" cy="68" r="2.5" fill="#FFF" opacity="0.7"/></svg>`,

    diamond: `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="dg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#F8E9B6"/><stop offset="50%" stop-color="#D4AF37"/><stop offset="100%" stop-color="#9A7A14"/></linearGradient><linearGradient id="ds" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.95"/><stop offset="50%" stop-color="#E0F0FF" stop-opacity="0.85"/><stop offset="100%" stop-color="#A0C0E0" stop-opacity="0.6"/></linearGradient></defs><ellipse cx="100" cy="155" rx="56" ry="52" fill="none" stroke="url(#dg)" stroke-width="6"/><path d="M70 70 L100 35 L130 70 L100 130 Z" fill="url(#ds)"/><path d="M70 70 L130 70 L100 90 Z" fill="url(#ds)" opacity="0.7"/><path d="M70 70 L100 90 L100 130 Z" fill="#000" opacity="0.18"/><path d="M70 70 L100 35 L100 90 Z" fill="#FFF" opacity="0.25"/></svg>`,

    necklace: `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="ng" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#F8E9B6"/><stop offset="50%" stop-color="#D4AF37"/><stop offset="100%" stop-color="#9A7A14"/></linearGradient></defs><path d="M30 50 Q100 130 170 50" fill="none" stroke="url(#ng)" stroke-width="2.5"/><path d="M30 50 Q100 135 170 50" fill="none" stroke="url(#ng)" stroke-width="1" opacity="0.4" stroke-dasharray="2 3"/><circle cx="100" cy="155" r="22" fill="url(#ng)"/><path d="M100 142 L108 155 L100 168 L92 155 Z" fill="#FFF7D6" opacity="0.9"/><circle cx="30" cy="50" r="3" fill="url(#ng)"/><circle cx="170" cy="50" r="3" fill="url(#ng)"/></svg>`,

    earring: `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="eg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#F8E9B6"/><stop offset="50%" stop-color="#D4AF37"/><stop offset="100%" stop-color="#9A7A14"/></linearGradient></defs><g transform="translate(70 0)"><circle cx="0" cy="60" r="22" fill="none" stroke="url(#eg)" stroke-width="5"/><line x1="0" y1="38" x2="0" y2="22" stroke="url(#eg)" stroke-width="2"/><circle cx="0" cy="20" r="3" fill="url(#eg)"/><path d="M-8 78 L8 78 L0 138 Z" fill="url(#eg)"/></g><g transform="translate(130 0)"><circle cx="0" cy="60" r="22" fill="none" stroke="url(#eg)" stroke-width="5"/><line x1="0" y1="38" x2="0" y2="22" stroke="url(#eg)" stroke-width="2"/><circle cx="0" cy="20" r="3" fill="url(#eg)"/><path d="M-8 78 L8 78 L0 138 Z" fill="url(#eg)"/></g></svg>`,

    bracelet: `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#F8E9B6"/><stop offset="50%" stop-color="#D4AF37"/><stop offset="100%" stop-color="#9A7A14"/></linearGradient></defs><ellipse cx="100" cy="110" rx="78" ry="48" fill="none" stroke="url(#bg)" stroke-width="9"/><ellipse cx="100" cy="110" rx="66" ry="38" fill="none" stroke="url(#bg)" stroke-width="2" opacity="0.55"/><circle cx="100" cy="62" r="9" fill="url(#bg)"/><path d="M100 53 L106 62 L100 71 L94 62 Z" fill="#FFF7D6" opacity="0.9"/><circle cx="22" cy="110" r="4" fill="url(#bg)"/><circle cx="178" cy="110" r="4" fill="url(#bg)"/></svg>`,

    bangle: `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bag" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#F8E9B6"/><stop offset="50%" stop-color="#D4AF37"/><stop offset="100%" stop-color="#9A7A14"/></linearGradient></defs><ellipse cx="100" cy="100" rx="72" ry="68" fill="none" stroke="url(#bag)" stroke-width="14"/><ellipse cx="100" cy="100" rx="58" ry="54" fill="none" stroke="url(#bag)" stroke-width="2" opacity="0.5"/><ellipse cx="100" cy="100" rx="86" ry="80" fill="none" stroke="url(#bag)" stroke-width="1" opacity="0.3"/></svg>`,

    goldbar: `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bbg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#F8E9B6"/><stop offset="50%" stop-color="#D4AF37"/><stop offset="100%" stop-color="#9A7A14"/></linearGradient></defs><path d="M40 70 L160 70 L172 88 L172 142 L160 160 L40 160 L28 142 L28 88 Z" fill="url(#bbg)"/><path d="M40 70 L160 70 L172 88 L28 88 Z" fill="#FFF" opacity="0.18"/><path d="M40 160 L160 160 L172 142 L28 142 Z" fill="#000" opacity="0.18"/><text x="100" y="120" text-anchor="middle" font-family="serif" font-size="22" fill="#5C4910" font-weight="700">999.9</text></svg>`,

    watch: `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="wg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#F8E9B6"/><stop offset="50%" stop-color="#D4AF37"/><stop offset="100%" stop-color="#9A7A14"/></linearGradient></defs><circle cx="100" cy="110" r="56" fill="url(#wg)"/><circle cx="100" cy="110" r="48" fill="#0A1442"/><circle cx="100" cy="110" r="48" fill="none" stroke="url(#wg)" stroke-width="1.5" opacity="0.6"/><line x1="100" y1="110" x2="100" y2="78" stroke="url(#wg)" stroke-width="3" stroke-linecap="round"/><line x1="100" y1="110" x2="124" y2="110" stroke="url(#wg)" stroke-width="2" stroke-linecap="round"/><circle cx="100" cy="110" r="3" fill="url(#wg)"/><path d="M82 56 L88 30 L112 30 L118 56 Z" fill="url(#wg)"/><path d="M82 164 L118 164 L112 190 L88 190 Z" fill="url(#wg)"/></svg>`,

    crown: `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#F8E9B6"/><stop offset="50%" stop-color="#D4AF37"/><stop offset="100%" stop-color="#9A7A14"/></linearGradient></defs><path d="M40 150 L36 80 L72 110 L100 60 L128 110 L164 80 L160 150 Z" fill="url(#cg)"/><path d="M40 150 L160 150 L156 168 L44 168 Z" fill="url(#cg)"/><circle cx="36" cy="76" r="6" fill="url(#cg)"/><circle cx="100" cy="56" r="7" fill="url(#cg)"/><circle cx="164" cy="76" r="6" fill="url(#cg)"/><circle cx="100" cy="130" r="6" fill="#FFF7D6" opacity="0.9"/></svg>`,

    ornament: `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="og" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#F8E9B6"/><stop offset="50%" stop-color="#D4AF37"/><stop offset="100%" stop-color="#9A7A14"/></linearGradient></defs><g transform="translate(100 110)"><circle cx="0" cy="-50" r="4" fill="url(#og)"/><path d="M0 -46 L6 -32 L0 -22 L-6 -32 Z" fill="url(#og)"/><path d="M0 -22 C 5 -10, 8 8, 0 24 C -8 8, -5 -10, 0 -22 Z" fill="url(#og)"/><path d="M-8 0 C -22 4, -34 4, -42 -2 C -32 -4, -18 -4, -8 0 Z" fill="url(#og)"/><path d="M8 0 C 22 4, 34 4, 42 -2 C 32 -4, 18 -4, 8 0 Z" fill="url(#og)"/><circle cx="-58" cy="-2" r="3" fill="url(#og)"/><circle cx="58" cy="-2" r="3" fill="url(#og)"/></g></svg>`,
};

function tagToIcon(tag, name) {
    const t = (tag + ' ' + name).toLocaleLowerCase('tr');
    if (t.includes('saat')) return 'watch';
    if (t.includes('yatırım') || t.includes('ziynet') || t.includes('çeyrek')) return 'goldbar';
    if (t.includes('pırlanta') || t.includes('tek taş') || t.includes('akik')) return 'diamond';
    if (t.includes('küpe')) return 'earring';
    // Künye (baby nameplate) is worn as a pendant → necklace, not crown
    if (t.includes('künye')) return 'necklace';
    if (t.includes('kolye') || t.includes('set') || t.includes('zincir') || t.includes('su yolu') || t.includes('akıtma') || t.includes('singapur') || t.includes('karzai')) return 'necklace';
    if (t.includes('bilezik') || t.includes('trabzon')) return 'bangle';
    if (t.includes('bileklik') || t.includes('kelepçe')) return 'bracelet';
    if (t.includes('taç') || t.includes('kemer') || t.includes('hızma') || t.includes('ayakkabı') || t.includes('aksesuar')) return 'crown';
    if (t.includes('yöresel') || t.includes('şahmeran') || t.includes('özel')) return 'ornament';
    // Yüzük / alyans / erkek yüzük → ring
    if (t.includes('yüzük') || t.includes('alyans') || t.includes('erkek')) return 'ring';
    return 'ring';
}

function swapToIcon(card) {
    const wrap = card.querySelector('.product-img-wrap');
    if (!wrap || wrap.dataset.iconified === 'true') return;
    const tag = card.querySelector('.product-tag')?.textContent?.trim() || '';
    const name = card.querySelector('.product-name')?.textContent?.trim() || '';
    const iconKey = tagToIcon(tag, name);
    wrap.innerHTML = `<div class="product-illustration product-illustration--${iconKey}">${ICONS[iconKey]}</div>`;
    wrap.dataset.iconified = 'true';
}

// Attach broken-image fallback to ALL product images — if Pexels URL
// fails to load, swap to the branded gold SVG illustration. Photos first,
// SVG as safety net.
function bindProductImgFallback() {
    document.querySelectorAll('.product-card .product-img-wrap img').forEach(img => {
        if (img.dataset.fallbackBound === '1') return;
        img.dataset.fallbackBound = '1';
        const card = img.closest('.product-card');
        const handler = () => swapToIcon(card);
        img.addEventListener('error', handler, { once: true });
        // Image already errored or broken (0×0 natural)
        if (img.complete && img.naturalWidth === 0) handler();
    });
}
try { bindProductImgFallback(); } catch (e) { console.warn('img fallback skipped', e); }

// ─── STORE GALLERY image placeholder ───
// If a photo in assets/store/ is missing, replace with a gold gradient
// + camera SVG so the gallery still looks intentional.
const STORE_PLACEHOLDER = `<div class="store-gallery-placeholder" aria-hidden="true">
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 18h10l3-5h20l3 5h10v32H9z"/>
        <circle cx="32" cy="34" r="10"/>
        <circle cx="32" cy="34" r="4"/>
    </svg>
    <span>Hasburak Sarrafiye</span>
</div>`;
function bindStoreGalleryFallback() {
    document.querySelectorAll('.store-gallery-item img').forEach(img => {
        if (img.dataset.fallbackBound === '1') return;
        img.dataset.fallbackBound = '1';
        const item = img.closest('.store-gallery-item');
        const handler = () => {
            if (!item || item.dataset.placeheld === '1') return;
            item.dataset.placeheld = '1';
            item.innerHTML = STORE_PLACEHOLDER;
        };
        img.addEventListener('error', handler, { once: true });
        if (img.complete && img.naturalWidth === 0) handler();
    });
}
try { bindStoreGalleryFallback(); } catch (e) { console.warn('store fallback skipped', e); }

// ─── SPLIT WORDS for premium heading reveal ───
function splitWords() {
    document.querySelectorAll('.split-words').forEach(el => {
        if (el.dataset.split === 'done') return;
        const tmp = document.createElement('div');
        tmp.innerHTML = el.innerHTML;
        const wrap = (token, tag) => {
            const w = document.createElement('span');
            w.className = 'word';
            const inner = document.createElement(tag || 'span');
            inner.textContent = token;
            w.appendChild(inner);
            return w;
        };
        const out = [];
        tmp.childNodes.forEach(child => {
            if (child.nodeType === 3) {
                child.textContent.split(/(\s+)/).forEach(t => {
                    if (t.trim() === '') { if (t.length) out.push(document.createTextNode(' ')); }
                    else out.push(wrap(t, 'span'));
                });
            } else if (child.nodeType === 1) {
                if (child.tagName === 'BR') { out.push(child.cloneNode()); return; }
                const tag = (child.tagName === 'EM') ? 'em' : (child.tagName === 'STRONG') ? 'strong' : 'span';
                child.textContent.split(/(\s+)/).forEach(t => {
                    if (t.trim() === '') { if (t.length) out.push(document.createTextNode(' ')); }
                    else out.push(wrap(t, tag));
                });
            }
        });
        el.innerHTML = '';
        out.forEach(n => el.appendChild(n));
        el.dataset.split = 'done';
    });
}
try { splitWords(); } catch (e) { console.warn('split skipped', e); }

// ─── NAVBAR SCROLL + SCROLL PROGRESS ───
const nav = document.getElementById('nav');
function onScroll() {
    const y = window.scrollY;
    if (nav) nav.classList.toggle('scrolled', y > 30);
    const sp = document.getElementById('scrollProgress');
    if (sp) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        sp.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    }
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// (Mobile menu init moved to top — guaranteed to run even if other scripts fail.)

// ─── REVEAL ANIMATIONS (staggered) ───
const reveals = document.querySelectorAll('.reveal, .text-reveal, .split-words, .section-head');
if (reveals.length && !prefersReduced) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                const delay = parseInt(entry.target.dataset.delay) || (i * 30);
                setTimeout(() => entry.target.classList.add('visible'), delay);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
    reveals.forEach(el => observer.observe(el));
} else if (prefersReduced) {
    reveals.forEach(el => el.classList.add('visible'));
}

// ─── COUNTER ANIMATION ───
const counters = document.querySelectorAll('[data-count]');
if (counters.length && !prefersReduced) {
    const counterObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseFloat(el.dataset.count);
                const suffix = el.dataset.suffix || '';
                const prefix = el.dataset.prefix || '';
                const dur = 2800;
                const start = performance.now();
                function tick(now) {
                    const t = Math.min(1, (now - start) / dur);
                    const eased = 1 - Math.pow(1 - t, 3);
                    el.textContent = prefix + Math.floor(target * eased) + suffix;
                    if (t < 1) requestAnimationFrame(tick);
                }
                requestAnimationFrame(tick);
                counterObs.unobserve(el);
            }
        });
    }, { threshold: 0.4 });
    counters.forEach(c => counterObs.observe(c));
}

// ─── GOLD SPARKLES ───
function spawnSparkles() {
    const container = document.querySelector('.bg-particles');
    if (!container || prefersReduced) return;
    const count = window.innerWidth < 768 ? 12 : 22;
    for (let i = 0; i < count; i++) {
        const s = document.createElement('span');
        s.className = 'sparkle';
        s.style.left = Math.random() * 100 + '%';
        s.style.bottom = '-10px';
        const dur = 14 + Math.random() * 18;
        s.style.animationDuration = dur + 's';
        s.style.animationDelay = (Math.random() * dur) + 's';
        const size = 2 + Math.random() * 3;
        s.style.width = size + 'px';
        s.style.height = size + 'px';
        container.appendChild(s);
    }
}
spawnSparkles();

// ─── CURSOR GLOW (desktop) ───
if (!isCoarsePointer && !prefersReduced) {
    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    document.body.appendChild(glow);
    let tx = 0, ty = 0, cx = 0, cy = 0;
    window.addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    function loop() {
        cx += (tx - cx) * 0.16;
        cy += (ty - cy) * 0.16;
        glow.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
        requestAnimationFrame(loop);
    }
    loop();
}

// ─── MAGNETIC BUTTONS ───
if (!isCoarsePointer && !prefersReduced) {
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const r = btn.getBoundingClientRect();
            const dx = (e.clientX - (r.left + r.width / 2)) * 0.18;
            const dy = (e.clientY - (r.top + r.height / 2)) * 0.18;
            btn.style.transform = `translate(${dx}px, ${dy}px)`;
        });
        btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
}

// ─── 3D CARD TILT ───
if (!isCoarsePointer && !prefersReduced) {
    document.querySelectorAll('.cat-card, .product-card').forEach(card => {
        card.classList.add('tilt');
        card.addEventListener('mousemove', (e) => {
            const r = card.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width - 0.5;
            const py = (e.clientY - r.top) / r.height - 0.5;
            card.style.setProperty('--rx', (-py * 6) + 'deg');
            card.style.setProperty('--ry', (px * 6) + 'deg');
        });
        card.addEventListener('mouseleave', () => {
            card.style.setProperty('--rx', '0deg');
            card.style.setProperty('--ry', '0deg');
        });
    });
}

// ─── HERO PARALLAX ───
if (!isCoarsePointer && !prefersReduced) {
    const heroRings = document.querySelectorAll('.hero-ring');
    const heroLogo = document.querySelector('.hero-logo, .hero-medallion');
    let ticking = false;
    function parallax() {
        const y = window.scrollY;
        if (heroLogo && y < window.innerHeight) heroLogo.style.transform = `translateY(${y * 0.12}px)`;
        heroRings.forEach((r, i) => {
            r.style.transform = `translateY(${y * (0.04 + i * 0.03)}px) rotate(${y * 0.015}deg)`;
        });
        ticking = false;
    }
    window.addEventListener('scroll', () => {
        if (!ticking) { requestAnimationFrame(parallax); ticking = true; }
    }, { passive: true });
}

// ─── SMOOTH SCROLL ───
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        const href = a.getAttribute('href');
        if (href === '#') return;
        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// ─── IMAGE FADE-IN ───
document.querySelectorAll('img').forEach(img => {
    if (img.closest('.product-img-wrap')) return; // handled by SVG icons
    img.style.transition = 'opacity 0.7s ease';
    if (!img.complete) img.style.opacity = '0';
    const show = () => { img.style.opacity = '1'; };
    img.addEventListener('load', show, { once: true });
    img.addEventListener('error', show, { once: true });
});

// ════════════════════════════════════════════
//   PRODUCT LIVE SEARCH (urunler.html)
//   Filters .product-card elements by name + tag in real time.
//   Hides .cat-section heads when none of their cards match.
// ════════════════════════════════════════════
// ════════════════════════════════════════════
//   DYNAMIC PRODUCT LOADER
//   Fetches /api/products and fills [data-cat-grid="X"] divs.
//   Hides cat-sections that end up with zero products.
//   Runs only on pages that include <div data-products-root>.
// ════════════════════════════════════════════
function escapeAttr(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function renderProductCard(p) {
    const tagHtml = p.tag ? `<div class="product-tag">${escapeAttr(p.tag)}</div>` : '';
    // Ürün kartına tıklayınca doğrudan WhatsApp açılır + mesajda ürün adı geçer.
    // Önceden iletisim.html'e atıyordu ve oradan generic mesaj gidiyordu —
    // şimdi her ürün için kişisel mesaj.
    const productMsg = `Merhaba, "${(p.name || '').replace(/"/g, "'")}" hakkında bilgi almak istiyorum.`;
    const waUrl = `https://wa.me/905470060046?text=${encodeURIComponent(productMsg)}`;
    return `<a href="${escapeAttr(waUrl)}" target="_blank" rel="noopener" class="product-card reveal" data-product-id="${escapeAttr(p.id)}" aria-label="${escapeAttr(p.name)} hakkında WhatsApp ile bilgi al">
        <div class="product-img-wrap"><img src="${escapeAttr(p.image)}" width="600" height="750" decoding="async" alt="${escapeAttr(p.alt || p.name)}" loading="lazy"></div>
        ${tagHtml}
        <div class="product-arrow" title="WhatsApp ile bilgi al">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
        </div>
        <div class="product-info">
            <div class="product-name">${escapeAttr(p.name)}</div>
            <div class="product-line"></div>
        </div>
    </a>`;
}

async function initDynamicProducts() {
    const root = document.querySelector('[data-products-root]');
    if (!root) return false; // not on urunler.html

    const loading = document.getElementById('productsLoading');
    let products = [];
    try {
        const r = await fetch('/api/products', { headers: { 'Cache-Control': 'no-cache' } });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const data = await r.json();
        products = Array.isArray(data.products) ? data.products : [];
    } catch (e) {
        console.warn('product fetch failed:', e.message);
        if (loading) loading.textContent = 'Ürünler şu anda yüklenemiyor. Lütfen sayfayı yenileyin.';
        return false;
    }

    // Group by category
    const byCat = {};
    products.forEach(p => {
        if (!p || !p.category) return;
        (byCat[p.category] = byCat[p.category] || []).push(p);
    });

    // Fill grids + section header'a alt-kategori chip'leri ekle
    const grids = root.querySelectorAll('[data-cat-grid]');
    grids.forEach(grid => {
        const cat = grid.getAttribute('data-cat-grid');
        const list = byCat[cat] || [];
        const section = grid.closest('.cat-section');
        if (!list.length) {
            if (section) section.style.display = 'none';
            return;
        }
        grid.innerHTML = list.map(renderProductCard).join('');

        // Bu kategoride hangi alt-kategoriler var? Tag'leri topla.
        // Kullanıcı "küpeye tıkladığımda halka/yapıştırma/sallama vibe alamıyorum"
        // dedi — chip'lerle hangi alt türler olduğunu hemen görsün.
        if (section) {
            const head = section.querySelector('.cat-section-head');
            if (head && !head.querySelector('.cat-section-tags')) {
                const tagSet = new Set();
                list.forEach(p => { if (p.tag) tagSet.add(p.tag); });
                const uniqueTags = [...tagSet];
                if (uniqueTags.length >= 2) {
                    const tagsWrap = document.createElement('div');
                    tagsWrap.className = 'cat-section-tags';
                    // İlk 6 tag'i göster, fazlasını "+N" ile özetle
                    const visible = uniqueTags.slice(0, 6);
                    const more = uniqueTags.length - visible.length;
                    tagsWrap.innerHTML = visible.map(t =>
                        `<span class="cat-section-tag">${escapeAttr(t)}</span>`
                    ).join('') + (more > 0 ? `<span class="cat-section-tag" style="opacity:0.6;">+${more}</span>` : '');
                    // Line'ın hemen önüne ekle
                    const line = head.querySelector('.cat-section-line');
                    if (line) head.insertBefore(tagsWrap, line);
                    else head.appendChild(tagsWrap);
                }
            }
        }
    });

    if (loading) loading.remove();

    // Bind reveal animation to freshly added cards.
    // The page-level reveal observer already ran, so we attach a fresh one
    // for the new .reveal elements (just the new ones).
    const newReveals = root.querySelectorAll('.reveal:not(.visible)');
    if (newReveals.length) {
        const prefersReduced = window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced || !window.IntersectionObserver) {
            newReveals.forEach(el => el.classList.add('visible'));
        } else {
            const obs = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        obs.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
            newReveals.forEach(el => obs.observe(el));
        }
    }
    return true;
}

function initProductSearch() {
    const input = document.getElementById('productSearch');
    if (!input) return; // not on urunler.html
    const clearBtn = document.getElementById('productSearchClear');
    const result = document.getElementById('productSearchResult');
    const sections = Array.from(document.querySelectorAll('.cat-section'));
    if (!sections.length) return;

    // Turkish-aware lowercasing + diacritic-folding so "kupe" matches "küpe"
    function fold(str) {
        return (str || '')
            .toLocaleLowerCase('tr')
            .replace(/ı/g, 'i')
            .replace(/ş/g, 's')
            .replace(/ğ/g, 'g')
            .replace(/ü/g, 'u')
            .replace(/ö/g, 'o')
            .replace(/ç/g, 'c')
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .trim();
    }

    // Pre-index every card with its searchable text
    const cards = [];
    sections.forEach(section => {
        section.querySelectorAll('.product-card').forEach(card => {
            const name = card.querySelector('.product-name')?.textContent || '';
            const tag  = card.querySelector('.product-tag')?.textContent || '';
            const sectionTitle = section.querySelector('h3')?.textContent || '';
            cards.push({
                el: card,
                section,
                haystack: fold(`${name} ${tag} ${sectionTitle}`),
            });
        });
    });

    function applyFilter(rawQuery) {
        const q = fold(rawQuery);
        if (!q) {
            cards.forEach(c => c.el.classList.remove('is-hidden-search'));
            sections.forEach(s => s.classList.remove('is-hidden-search'));
            if (result) { result.hidden = true; result.textContent = ''; }
            if (clearBtn) clearBtn.hidden = true;
            return;
        }

        if (clearBtn) clearBtn.hidden = false;
        const tokens = q.split(/\s+/).filter(Boolean);
        let matchCount = 0;
        const sectionMatches = new Map();

        cards.forEach(c => {
            const hit = tokens.every(t => c.haystack.includes(t));
            c.el.classList.toggle('is-hidden-search', !hit);
            if (hit) {
                matchCount++;
                sectionMatches.set(c.section, (sectionMatches.get(c.section) || 0) + 1);
            }
        });

        sections.forEach(s => {
            s.classList.toggle('is-hidden-search', !sectionMatches.get(s));
        });

        if (result) {
            if (matchCount === 0) {
                const sectionCount = sectionMatches.size;
                result.textContent = `"${rawQuery.trim()}" için sonuç bulunamadı. Aradığınızı bulamadıysanız bize ulaşın.`;
                result.classList.add('is-empty');
            } else {
                const sectionCount = sectionMatches.size;
                result.textContent = sectionCount > 1
                    ? `${matchCount} ürün · ${sectionCount} kategoride bulundu`
                    : `${matchCount} ürün bulundu`;
                result.classList.remove('is-empty');
            }
            result.hidden = false;
        }

        // Eşleşen ilk kategoriye scroll — kategori başlığı kullanıcının gözünden
        // kayboluyor sorununun fix'i. Sadece input doluyken + ilk eşleşme
        // viewport dışındaysa hareket et.
        if (matchCount > 0 && q.length >= 2) {
            const firstHit = sections.find(s => sectionMatches.get(s));
            if (firstHit) {
                const rect = firstHit.getBoundingClientRect();
                const navOffset = 100;
                if (rect.top < navOffset || rect.top > window.innerHeight * 0.6) {
                    firstHit.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        }
    }

    let debounceId;
    input.addEventListener('input', () => {
        clearTimeout(debounceId);
        debounceId = setTimeout(() => applyFilter(input.value), 120);
    });

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            input.value = '';
            applyFilter('');
            input.focus();
        });
    }

    // ESC clears the field
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && input.value) {
            input.value = '';
            applyFilter('');
        }
    });
}

async function bootProductsPage() {
    // On urunler.html: load dynamic products first, then index search.
    // On other pages: initDynamicProducts is a no-op, search is also a no-op.
    await initDynamicProducts();
    initProductSearch();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootProductsPage);
} else {
    bootProductsPage();
}

// ════════════════════════════════════════════
//   AI CHATBOT — Hasburak asistan
//   Floating widget, sits above WhatsApp FAB, talks to /api/chat (Gemini)
// ════════════════════════════════════════════
function initChatbot() {
    if (document.getElementById('hbChatToggle')) return; // don't double-inject

    const WELCOME = 'Merhaba, Hasburak Sarrafiye\'ye hoş geldiniz. Size nasıl yardımcı olabilirim? Güncel altın fiyatları, ürünlerimiz veya mağazamız hakkında sorularınızı yanıtlayabilirim.';

    const SUGGESTIONS = [
        'Gram altın kaç TL?',
        'Çeyrek altın fiyatı',
        'Bileziklerde hangi ayarlar var?',
        'Çalışma saatleri'
    ];

    const widgetHTML = `
<button id="hbChatToggle" class="chat-toggle" type="button" aria-label="Asistanı aç" aria-expanded="false">
    <span class="chat-badge">AI</span>
    <svg class="chat-icon-closed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        <circle cx="8.5" cy="10" r="0.8" fill="currentColor"/>
        <circle cx="12" cy="10" r="0.8" fill="currentColor"/>
        <circle cx="15.5" cy="10" r="0.8" fill="currentColor"/>
    </svg>
    <svg class="chat-icon-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
</button>
<aside id="hbChatPanel" class="chat-panel" role="dialog" aria-label="Hasburak Asistan" aria-hidden="true">
    <header class="chat-header">
        <div class="chat-header-inner">
            <div class="chat-header-avatar" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2L14.5 8.5 21 9.5l-5 4.5 1.5 7L12 17.5 6.5 21 8 14l-5-4.5 6.5-1z"/>
                </svg>
            </div>
            <div class="chat-header-text">
                <div class="chat-header-name">Hasburak Asistan</div>
                <div class="chat-header-status">
                    <span class="chat-status-dot"></span>
                    <span>Canlı · genellikle birkaç saniyede yanıtlar</span>
                </div>
            </div>
        </div>
        <button id="hbChatClose" class="chat-close" type="button" aria-label="Asistanı kapat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
        </button>
    </header>
    <div id="hbChatMessages" class="chat-messages" aria-live="polite"></div>
    <form id="hbChatForm" class="chat-input-row" autocomplete="off">
        <input id="hbChatInput" class="chat-input" type="text" placeholder="Mesajınızı yazın…" maxlength="2000" autocomplete="off" aria-label="Mesaj" required>
        <button id="hbChatSend" class="chat-send" type="submit" aria-label="Gönder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2" fill="currentColor" stroke="none"/>
            </svg>
        </button>
    </form>
    <div class="chat-footer">
        Yapay zekâ ile güçlendirilmiştir · Detaylı bilgi için <a href="tel:+905470060046">0547 006 00 46</a>
    </div>
</aside>
`;

    document.body.insertAdjacentHTML('beforeend', widgetHTML);

    const toggleBtn = document.getElementById('hbChatToggle');
    const panel     = document.getElementById('hbChatPanel');
    const closeBtn  = document.getElementById('hbChatClose');
    const messages  = document.getElementById('hbChatMessages');
    const form      = document.getElementById('hbChatForm');
    const input     = document.getElementById('hbChatInput');
    const sendBtn   = document.getElementById('hbChatSend');

    // multi-turn context (sent to API, trimmed server-side to last 6)
    const history = [];
    let isSending = false;

    function escapeHTML(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Make phone/whatsapp/urls clickable inside bot replies
    function linkify(text) {
        let html = escapeHTML(text);
        // phone: 0547 006 00 46 or +90 344 415 27 65
        html = html.replace(
            /(\+?90\s?)?(?:0\s?)?532\s?679\s?12\s?01/g,
            '<a href="tel:+905470060046">$&</a>'
        );
        // wa.me links
        html = html.replace(
            /wa\.me\/\d+/g,
            m => `<a href="https://${m}" target="_blank" rel="noopener">${m}</a>`
        );
        // preserve line breaks
        html = html.replace(/\n/g, '<br>');
        return html;
    }

    function scrollBottom() {
        messages.scrollTop = messages.scrollHeight;
    }

    function addMessage(role, text) {
        const msg = document.createElement('div');
        msg.className = `chat-msg chat-msg--${role}`;
        const bubble = document.createElement('div');
        bubble.className = 'chat-msg-bubble';
        bubble.innerHTML = role === 'bot' ? linkify(text) : escapeHTML(text);
        msg.appendChild(bubble);
        messages.appendChild(msg);
        scrollBottom();
        return msg;
    }

    function addTyping() {
        const msg = document.createElement('div');
        msg.className = 'chat-msg chat-msg--bot chat-msg--typing';
        msg.id = 'hbChatTyping';
        const bubble = document.createElement('div');
        bubble.className = 'chat-msg-bubble';
        bubble.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
        msg.appendChild(bubble);
        messages.appendChild(msg);
        scrollBottom();
        return msg;
    }

    function removeTyping() {
        const t = document.getElementById('hbChatTyping');
        if (t) t.remove();
    }

    function renderSuggestions() {
        // Remove existing pills (if any) so they only show once
        const existing = messages.querySelector('.chat-suggestions');
        if (existing) existing.remove();

        const wrap = document.createElement('div');
        wrap.className = 'chat-suggestions';
        SUGGESTIONS.forEach(text => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'chat-suggestion';
            btn.textContent = text;
            btn.addEventListener('click', () => {
                wrap.remove();
                sendMessage(text);
            });
            wrap.appendChild(btn);
        });
        messages.appendChild(wrap);
        scrollBottom();
    }

    async function sendMessage(text) {
        if (isSending) return;
        const trimmed = (text || '').trim();
        if (!trimmed) return;

        // Remove suggestion chips once user engages
        const sugg = messages.querySelector('.chat-suggestions');
        if (sugg) sugg.remove();

        addMessage('user', trimmed);
        history.push({ role: 'user', content: trimmed });
        input.value = '';
        isSending = true;
        sendBtn.disabled = true;
        input.disabled = true;

        addTyping();

        let reply = '';
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: trimmed, history: history.slice(0, -1) }),
            });
            const data = await res.json().catch(() => ({}));
            reply = (data && data.reply) || 'Üzgünüm, şu anda yanıt veremiyorum. Lütfen birazdan tekrar deneyin veya bizi (0547) 006 00 46 numaradan arayın.';
        } catch (e) {
            reply = 'Bağlantı hatası oluştu. Lütfen internet bağlantınızı kontrol edin veya (0547) 006 00 46 numaradan bize ulaşın.';
        }

        removeTyping();
        addMessage('bot', reply);
        history.push({ role: 'assistant', content: reply });

        // Keep only last 12 turns in memory (server trims to 6 anyway)
        if (history.length > 24) history.splice(0, history.length - 24);

        isSending = false;
        sendBtn.disabled = false;
        input.disabled = false;
        input.focus();
    }

    function openPanel() {
        panel.classList.add('open');
        toggleBtn.classList.add('open');
        toggleBtn.setAttribute('aria-expanded', 'true');
        panel.setAttribute('aria-hidden', 'false');
        // Seed on first open
        if (!messages.dataset.seeded) {
            addMessage('bot', WELCOME);
            history.push({ role: 'assistant', content: WELCOME });
            renderSuggestions();
            messages.dataset.seeded = '1';
        }
        setTimeout(() => { try { input.focus(); } catch (_) {} }, 280);
    }

    function closePanel() {
        panel.classList.remove('open');
        toggleBtn.classList.remove('open');
        toggleBtn.setAttribute('aria-expanded', 'false');
        panel.setAttribute('aria-hidden', 'true');
    }

    toggleBtn.addEventListener('click', () => {
        if (panel.classList.contains('open')) closePanel();
        else openPanel();
    });
    closeBtn.addEventListener('click', closePanel);

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        sendMessage(input.value);
    });

    // ESC to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && panel.classList.contains('open')) closePanel();
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbot);
} else {
    initChatbot();
}

// ════════════════════════════════════════════
//   SİTE CONFIG: Üst Duyuru Bandı (#18) + Karşılama Popup (#11)
//   GET /api/site-config — admin'in açtığı banner ve popup'ı gösterir
// ════════════════════════════════════════════
async function initSiteConfig() {
    let config;
    try {
        const r = await fetch('/api/site-config', { cache: 'default' });
        if (!r.ok) return;
        config = await r.json();
    } catch (e) { return; }

    if (config.banner?.enabled && config.banner.text) {
        renderBanner(config.banner);
    }
    if (config.popup?.enabled && (config.popup.title || config.popup.message)) {
        schedulePopup(config.popup);
    }
}

function renderBanner(banner) {
    if (document.getElementById('hbBanner')) return;
    // Daha önce kapattıysa gösterme (config değiştiğinde tekrar göster)
    const dismissKey = 'hb-banner-dismissed:' + (banner.text || '').slice(0, 40);
    if (banner.dismissible && sessionStorage.getItem(dismissKey)) return;

    const colors = {
        gold:  { bg: 'linear-gradient(90deg, #b8941f, #d4af37, #b8941f)', fg: '#1a1208' },
        red:   { bg: 'linear-gradient(90deg, #a83232, #d04545, #a83232)', fg: '#ffffff' },
        green: { bg: 'linear-gradient(90deg, #1f7a4d, #2da367, #1f7a4d)', fg: '#ffffff' },
        blue:  { bg: 'linear-gradient(90deg, #1c2b7a, #2a3d9c, #1c2b7a)', fg: '#ffffff' },
    };
    const col = colors[banner.color] || colors.gold;

    const wrap = document.createElement('div');
    wrap.id = 'hbBanner';
    wrap.className = 'hb-banner';
    wrap.style.background = col.bg;
    wrap.style.color = col.fg;
    wrap.innerHTML = `
        <div class="hb-banner-inner">
            <span class="hb-banner-text">${escapeHTML(banner.text)}</span>
            ${banner.ctaText && banner.ctaUrl
                ? `<a class="hb-banner-cta" href="${escapeAttr(banner.ctaUrl)}" target="_blank" rel="noopener">${escapeHTML(banner.ctaText)} →</a>`
                : ''}
            ${banner.dismissible
                ? `<button type="button" class="hb-banner-close" aria-label="Bandı kapat">×</button>`
                : ''}
        </div>
    `;
    document.body.insertBefore(wrap, document.body.firstChild);

    // Nav'ı banner kadar aşağı it
    document.documentElement.style.setProperty('--hb-banner-h', wrap.offsetHeight + 'px');
    document.body.classList.add('has-hb-banner');

    if (banner.dismissible) {
        wrap.querySelector('.hb-banner-close')?.addEventListener('click', () => {
            sessionStorage.setItem(dismissKey, '1');
            wrap.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            wrap.style.opacity = '0';
            wrap.style.transform = 'translateY(-100%)';
            setTimeout(() => {
                wrap.remove();
                document.body.classList.remove('has-hb-banner');
                document.documentElement.style.removeProperty('--hb-banner-h');
            }, 300);
        });
    }
}

function schedulePopup(popup) {
    const key = 'hb-popup-shown:' + (popup.title || '').slice(0, 40) + ':' + (popup.message || '').slice(0, 40);
    if (popup.showOncePerSession && sessionStorage.getItem(key)) return;

    const delay = (Number(popup.showAfterSeconds) || 3) * 1000;
    setTimeout(() => {
        if (sessionStorage.getItem(key)) return;
        renderPopup(popup, key);
    }, delay);
}

function renderPopup(popup, key) {
    if (document.getElementById('hbPopup')) return;

    const wrap = document.createElement('div');
    wrap.id = 'hbPopup';
    wrap.className = 'hb-popup-backdrop';
    wrap.innerHTML = `
        <div class="hb-popup" role="dialog" aria-labelledby="hbPopupTitle">
            <button type="button" class="hb-popup-close" aria-label="Kapat">×</button>
            <div class="hb-popup-decoration" aria-hidden="true">
                <svg viewBox="0 0 60 60" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="30" cy="30" r="20"/>
                    <polygon points="30,12 35,28 50,30 35,32 30,48 25,32 10,30 25,28"/>
                </svg>
            </div>
            ${popup.title ? `<h3 id="hbPopupTitle" class="hb-popup-title">${escapeHTML(popup.title)}</h3>` : ''}
            ${popup.message ? `<p class="hb-popup-message">${escapeHTML(popup.message)}</p>` : ''}
            ${popup.ctaText && popup.ctaUrl
                ? `<a class="hb-popup-cta" href="${escapeAttr(popup.ctaUrl)}" target="_blank" rel="noopener">${escapeHTML(popup.ctaText)}</a>`
                : ''}
        </div>
    `;
    document.body.appendChild(wrap);
    sessionStorage.setItem(key, '1');

    // Animate in
    requestAnimationFrame(() => wrap.classList.add('show'));

    function close() {
        wrap.classList.remove('show');
        setTimeout(() => wrap.remove(), 300);
    }
    wrap.querySelector('.hb-popup-close')?.addEventListener('click', close);
    wrap.addEventListener('click', (e) => { if (e.target === wrap) close(); });
    document.addEventListener('keydown', function esc(e) {
        if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
    });
}

function escapeHTML(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSiteConfig);
} else {
    initSiteConfig();
}

// ════════════════════════════════════════════
//   DİNAMİK YORUMLAR (#10) — index.html ana sayfa için
//   .reviews-grid içindeki statik kartları /api/reviews ile değiştirir
//   + altına "Sen de yorum bırak" formu ekler
// ════════════════════════════════════════════
async function initDynamicReviews() {
    const grid = document.querySelector('.reviews-grid[data-reviews-dynamic]');
    if (!grid) return;

    let reviews = [];
    try {
        const r = await fetch('/api/reviews', { cache: 'default' });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const data = await r.json();
        reviews = Array.isArray(data.reviews) ? data.reviews : [];
    } catch (e) {
        console.warn('reviews fetch failed:', e.message);
        return; // Statik fallback HTML kalsın
    }

    if (reviews.length === 0) return; // Hiç onaylı yorum yoksa statik fallback'i bozma

    // Render reviews
    grid.innerHTML = reviews.slice(0, 12).map(r => {
        const stars = '<span>★</span>'.repeat(r.rating) + '<span style="opacity:0.3;">★</span>'.repeat(5 - r.rating);
        const initials = (r.name || '?')
            .split(/\s+/).slice(0, 2)
            .map(w => w[0]?.toLocaleUpperCase('tr-TR') || '')
            .join('.') + '.';
        const subtitle = r.location || categoryLabel(r.productCategory);
        return `
            <article class="review-card reveal${r.featured ? ' is-featured' : ''}">
                ${r.featured ? '<div class="review-featured-badge">Öne Çıkan</div>' : ''}
                <div class="review-stars" aria-label="${r.rating} yıldız">${stars}</div>
                <p class="review-text">"${escapeHTML(r.text)}"</p>
                <div class="review-author">
                    <div class="review-avatar" aria-hidden="true">${escapeHTML(initials)}</div>
                    <div class="review-meta">
                        <strong>${escapeHTML(r.name)}</strong>
                        <span>${escapeHTML(subtitle)}</span>
                    </div>
                </div>
            </article>
        `;
    }).join('');

    // Re-bind reveal observer for newly added cards
    if (window.IntersectionObserver) {
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
            });
        }, { threshold: 0.12 });
        grid.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    }
}

function categoryLabel(cat) {
    const map = {
        yuzuk: 'Yüzük & Alyans',
        kolye: 'Kolye',
        kupe: 'Küpe',
        bilezik: 'Bilezik & Bileklik',
        yatirim: 'Yatırım Altını',
        ozel: 'Özel Koleksiyon',
        genel: 'Müşterimiz',
    };
    return map[cat] || 'Müşterimiz';
}

function initReviewForm() {
    const form = document.getElementById('reviewForm');
    if (!form) return;
    const status = document.getElementById('reviewFormStatus');
    const submit = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!status) return;
        status.textContent = '';
        status.className = 'review-form-status';
        submit.disabled = true;
        submit.textContent = 'Gönderiliyor...';

        const fd = new FormData(form);
        const payload = {
            name: fd.get('name'),
            location: fd.get('location'),
            rating: Number(fd.get('rating') || 5),
            text: fd.get('text'),
            productCategory: fd.get('productCategory') || 'genel',
        };

        try {
            const r = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await r.json();
            if (!r.ok) throw new Error(data.error || 'Gönderme başarısız');
            status.textContent = data.message || 'Yorumun alındı, onaylanınca yayınlanır. Teşekkürler!';
            status.classList.add('success');
            form.reset();
        } catch (err) {
            status.textContent = err.message;
            status.classList.add('error');
        } finally {
            submit.disabled = false;
            submit.textContent = 'Gönder';
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initDynamicReviews();
        initReviewForm();
    });
} else {
    initDynamicReviews();
    initReviewForm();
}
