// Helpers
const qs = (s, el = document) => el.querySelector(s);
const qsa = (s, el = document) => [...el.querySelectorAll(s)];

// Mobile menu toggle
const toggleBtn = qs('.menu-toggle');
const menu = qs('.menu');
if (toggleBtn && menu) {
    toggleBtn.addEventListener('click', () => menu.classList.toggle('show'));
}

// Theme toggle (Light/Dark)
const root = document.documentElement;
const themeBtn = qs('.theme-toggle');
const THEME_KEY = 'fitapp-theme';

function applyTheme(theme) {
    if (theme === 'light') {
        root.setAttribute('data-theme', 'light');
    } else {
        root.removeAttribute('data-theme'); // dark (default)
    }
}

function getPreferredTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) return stored;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
}

applyTheme(getPreferredTheme());

if (themeBtn) {
    const syncPressed = () => themeBtn.setAttribute('aria-pressed', root.getAttribute('data-theme') === 'light' ? 'true' : 'false');
    // init state
    syncPressed();
    themeBtn.addEventListener('click', () => {
        const isLight = root.getAttribute('data-theme') === 'light';
        const next = isLight ? 'dark' : 'light';
        applyTheme(next);
        localStorage.setItem(THEME_KEY, next);
        syncPressed();
    });
}

// Intersection Observer reveal
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('show');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });

qsa('.reveal').forEach(el => observer.observe(el));

// Footer year
const yearEl = qs('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Improved tilt effect (clamped, disabled on touch)
const isTouch = matchMedia('(pointer: coarse)').matches;
if (!isTouch) {
    qsa('.tilt').forEach(card => {
        let raf = null;
        const maxTiltX = 6; // deg
        const maxTiltY = 8; // deg
        const baseLift = -2; // px
        const onMove = (e) => {
            const r = card.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width;  // 0..1
            const y = (e.clientY - r.top) / r.height; // 0..1
            const rx = (y - .5) * -maxTiltX;  // rotateX
            const ry = (x - .5) * maxTiltY;  // rotateY
            if (raf) cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                card.style.transform = `translateY(${baseLift}px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
            });
        };
        const reset = () => {
            if (raf) cancelAnimationFrame(raf);
            card.style.transform = `translateY(${baseLift}px)`;
        };
        card.addEventListener('mouseenter', () => card.style.willChange = 'transform');
        card.addEventListener('mousemove', onMove);
        card.addEventListener('mouseleave', () => { card.style.willChange = 'auto'; reset(); });
    });
}

// Smooth scroll for internal links
qsa('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
        const id = link.getAttribute('href').slice(1);
        const target = qs(`#${id}`);
        if (target) {
            e.preventDefault();
            window.scrollTo({ top: target.offsetTop - 70, behavior: 'smooth' });
        }
    });
});

// Mouse wheel → horizontal scroll for gallery (desktop)
const galleryTrack = qs('.gallery__track');
if (galleryTrack) {
    const isCoarse = matchMedia('(pointer: coarse)').matches; // true on touch
    if (!isCoarse) {
        galleryTrack.addEventListener('wheel', (e) => {
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                e.preventDefault();
                galleryTrack.scrollLeft += e.deltaY;
            }
        }, { passive: false });
    }
}