// ════════════════════════════════════════════
//   HASBURAK KUYUMCULUK — Interactions
// ════════════════════════════════════════════

const isCoarsePointer = matchMedia('(pointer: coarse)').matches;
const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ─── PAGE ENTRY ───
if (!prefersReduced) document.body.classList.add('page-enter');

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

// ─── IMAGE FADE-IN + BROKEN-IMG FALLBACK ───
const PLACEHOLDER_SVG = (label) => {
    const safe = (label || 'Hasburak').replace(/[<>&"]/g, '');
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 750'>
        <defs>
            <linearGradient id='bg' x1='0%' y1='0%' x2='100%' y2='100%'>
                <stop offset='0%' stop-color='%23131F5C'/>
                <stop offset='100%' stop-color='%23060E2C'/>
            </linearGradient>
            <linearGradient id='gold' x1='0%' y1='0%' x2='100%' y2='100%'>
                <stop offset='0%' stop-color='%23F0DFA3'/>
                <stop offset='50%' stop-color='%23D4AF37'/>
                <stop offset='100%' stop-color='%23B8941F'/>
            </linearGradient>
        </defs>
        <rect width='600' height='750' fill='url(%23bg)'/>
        <g transform='translate(300 320)' fill='none' stroke='url(%23gold)' stroke-width='3'>
            <circle cx='0' cy='0' r='90' opacity='0.85'/>
            <circle cx='0' cy='0' r='70' opacity='0.45'/>
            <path d='M-30 -110 L-15 -85 L15 -85 L30 -110' opacity='0.85'/>
        </g>
        <text x='300' y='500' font-family='Cormorant Garamond, serif' font-size='34' font-weight='500' fill='%23F0DFA3' text-anchor='middle' letter-spacing='2'>${safe}</text>
        <text x='300' y='540' font-family='Inter, sans-serif' font-size='12' fill='%23F0DFA3' opacity='0.55' text-anchor='middle' letter-spacing='6'>HASBURAK</text>
    </svg>`;
    return `data:image/svg+xml;charset=utf-8,${svg.replace(/\n\s*/g, '').replace(/#/g, '%23')}`;
};

document.querySelectorAll('img').forEach(img => {
    img.style.transition = 'opacity 0.7s ease';
    if (!img.complete) img.style.opacity = '0';
    const show = () => { img.style.opacity = '1'; };
    const fail = () => {
        const card = img.closest('.product-card');
        const label = card?.querySelector('.product-name')?.textContent || img.alt || '';
        img.src = PLACEHOLDER_SVG(label);
        img.style.opacity = '1';
    };
    img.addEventListener('load', show, { once: true });
    img.addEventListener('error', fail, { once: true });
    if (img.complete && img.naturalWidth === 0) fail();
});
