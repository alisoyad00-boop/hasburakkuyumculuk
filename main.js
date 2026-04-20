// ════════════════════════════════════════════
//   HASBURAK KUYUMCULUK — Interactions
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

        function toggle(e) {
            if (e) e.preventDefault();
            const isOpen = mobileMenu.classList.toggle('open');
            hamburger.classList.toggle('active', isOpen);
            document.body.style.overflow = isOpen ? 'hidden' : '';
        }

        // Hamburger: click only (works on all touch devices for buttons)
        hamburger.addEventListener('click', toggle);

        // Menu links: native navigation. Just reset body scroll on click —
        // page change will tear the menu down anyway. NEVER preventDefault.
        mobileMenu.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => {
                document.body.style.overflow = '';
            });
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

// Iconify ALL product cards immediately — Unsplash photos are unreliable
// (some URLs 404, others point at unrelated content like phones/toys).
// The branded SVG illustrations are consistent, fast, and always correct.
// Note: only targets .product-card (urunler.html); .featured-card on home
// keeps its working Unsplash hero photos.
function iconifyAllProductCards() {
    document.querySelectorAll('.product-card').forEach(card => swapToIcon(card));
}
try { iconifyAllProductCards(); } catch (e) { console.warn('iconify skipped', e); }

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
                const dur = 1600;
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
