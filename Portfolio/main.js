/* ─── CUSTOM CURSOR ───────────────────────────── */
const cursor = document.getElementById('cursor');
const ring   = document.getElementById('cursorRing');
let mx = 0, my = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX;
  my = e.clientY;
  cursor.style.left = mx + 'px';
  cursor.style.top  = my + 'px';
  setTimeout(() => {
    ring.style.left = mx + 'px';
    ring.style.top  = my + 'px';
  }, 60);
});

document.querySelectorAll('a, button, .project-card, .skill-card, .edu-card, .contact-item').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursor.style.width  = '18px';
    cursor.style.height = '18px';
    ring.style.width    = '52px';
    ring.style.height   = '52px';
    ring.style.opacity  = '0.5';
  });
  el.addEventListener('mouseleave', () => {
    cursor.style.width  = '10px';
    cursor.style.height = '10px';
    ring.style.width    = '36px';
    ring.style.height   = '36px';
    ring.style.opacity  = '1';
  });
});

/* ─── SCROLL REVEAL ───────────────────────────── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ─── STAGGER CHILDREN ────────────────────────── */
document.querySelectorAll('.skills-flex, .edu-grid, .contact-right').forEach(parent => {
  Array.from(parent.children).forEach((child, i) => {
    child.style.transitionDelay = (i * 0.09) + 's';
  });
});

/* ─── ACTIVE NAV HIGHLIGHT ────────────────────── */
const sections = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('.nav-links a');

const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        link.style.color = '';
        if (link.getAttribute('href') === '#' + entry.target.id) {
          link.style.color = 'var(--rust)';
        }
      });
    }
  });
}, { threshold: 0.4 });

sections.forEach(s => navObserver.observe(s));
