// ════════════════════════════════════════════
//   HASBURAK KUYUMCULUK — Interactions
// ════════════════════════════════════════════

const isCoarsePointer = matchMedia('(pointer: coarse)').matches;
const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ─── PAGE ENTRY ───
if (!prefersReduced) document.body.classList.add('page-enter');

// ════════════════════════════════════════════
//   HERO BEAMS — gold/amber animated light beams (canvas)
//   Adapted to Hasburak's navy + gold theme
// ════════════════════════════════════════════
function initHeroBeams() {
    const canvas = document.getElementById('heroBeams');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let beams = [];
    const MIN_BEAMS = 20;
    const intensity = 1; // strong

    function createBeam(w, h) {
        return {
            x: Math.random() * w * 1.5 - w * 0.25,
            y: Math.random() * h * 1.5 - h * 0.25,
            width: 30 + Math.random() * 60,
            length: h * 2.5,
            angle: -35 + Math.random() * 10,
            speed: 0.5 + Math.random() * 1.0,
            opacity: 0.10 + Math.random() * 0.16,
            // GOLD/AMBER hue range (35-55 = warm gold)
            hue: 35 + Math.random() * 22,
            sat: 75 + Math.random() * 15,
            light: 55 + Math.random() * 15,
            pulse: Math.random() * Math.PI * 2,
            pulseSpeed: 0.018 + Math.random() * 0.025,
        };
    }

    function updateSize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const parent = canvas.parentElement;
        const w = parent.clientWidth;
        const h = parent.clientHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);

        const total = Math.floor(MIN_BEAMS * 1.5);
        beams = Array.from({ length: total }, () => createBeam(canvas.width, canvas.height));
    }

    function resetBeam(beam, index, total) {
        const column = index % 3;
        const spacing = canvas.width / 3;
        beam.y = canvas.height + 100;
        beam.x = column * spacing + spacing / 2 + (Math.random() - 0.5) * spacing * 0.5;
        beam.width = 90 + Math.random() * 100;
        beam.speed = 0.5 + Math.random() * 0.4;
        beam.hue = 35 + (index * 22) / total;
        beam.opacity = 0.18 + Math.random() * 0.10;
    }

    function drawBeam(beam) {
        ctx.save();
        ctx.translate(beam.x, beam.y);
        ctx.rotate((beam.angle * Math.PI) / 180);

        const pulsing = beam.opacity * (0.8 + Math.sin(beam.pulse) * 0.2) * intensity;
        const grad = ctx.createLinearGradient(0, 0, 0, beam.length);
        const colorBase = `${beam.hue}, ${beam.sat}%, ${beam.light}%`;

        grad.addColorStop(0,    `hsla(${colorBase}, 0)`);
        grad.addColorStop(0.10, `hsla(${colorBase}, ${pulsing * 0.5})`);
        grad.addColorStop(0.40, `hsla(${colorBase}, ${pulsing})`);
        grad.addColorStop(0.60, `hsla(${colorBase}, ${pulsing})`);
        grad.addColorStop(0.90, `hsla(${colorBase}, ${pulsing * 0.5})`);
        grad.addColorStop(1,    `hsla(${colorBase}, 0)`);

        ctx.fillStyle = grad;
        ctx.fillRect(-beam.width / 2, 0, beam.width, beam.length);
        ctx.restore();
    }

    let running = true;
    function animate() {
        if (!running) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.filter = 'blur(35px)';

        const total = beams.length;
        beams.forEach((beam, i) => {
            beam.y -= beam.speed;
            beam.pulse += beam.pulseSpeed;
            if (beam.y + beam.length < -100) resetBeam(beam, i, total);
            drawBeam(beam);
        });

        requestAnimationFrame(animate);
    }

    updateSize();
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(updateSize, 150);
    });
    animate();

    // Pause when hero scrolled out of view (perf)
    const visObs = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting && !running) { running = true; animate(); }
        else if (!entry.isIntersecting) running = false;
    }, { threshold: 0 });
    visObs.observe(canvas.parentElement);
}

if (!prefersReduced) initHeroBeams();

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
    if (t.includes('kolye') || t.includes('set') || t.includes('zincir') || t.includes('su yolu') || t.includes('akıtma') || t.includes('singapur') || t.includes('karzai')) return 'necklace';
    if (t.includes('bilezik') || t.includes('trabzon')) return 'bangle';
    if (t.includes('bileklik') || t.includes('kelepçe')) return 'bracelet';
    if (t.includes('taç') || t.includes('kemer') || t.includes('hızma') || t.includes('ayakkabı') || t.includes('aksesuar') || t.includes('künye')) return 'crown';
    if (t.includes('yöresel') || t.includes('şahmeran') || t.includes('özel')) return 'ornament';
    return 'ring';
}

function injectProductIcons() {
    document.querySelectorAll('.product-card').forEach(card => {
        const wrap = card.querySelector('.product-img-wrap');
        if (!wrap || wrap.dataset.iconified === 'true') return;
        const tag = card.querySelector('.product-tag')?.textContent?.trim() || '';
        const name = card.querySelector('.product-name')?.textContent?.trim() || '';
        const iconKey = tagToIcon(tag, name);
        wrap.innerHTML = `<div class="product-illustration product-illustration--${iconKey}">${ICONS[iconKey]}</div>`;
        wrap.dataset.iconified = 'true';
    });
}
injectProductIcons();

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
splitWords();

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

// ─── MOBILE MENU ───
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        mobileMenu.classList.toggle('open');
        document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
            hamburger.classList.remove('active');
            mobileMenu.classList.remove('open');
            document.body.style.overflow = '';
        });
    });
}

// ─── REVEAL ANIMATIONS (staggered) ───
const reveals = document.querySelectorAll('.reveal, .text-reveal, .split-words, .section-head');
if (reveals.length && !prefersReduced) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                const delay = parseInt(entry.target.dataset.delay) || (i * 70);
                setTimeout(() => entry.target.classList.add('visible'), delay);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
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
